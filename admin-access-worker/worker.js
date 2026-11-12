const REPO = "maiconcarlospng/Site-GPENSC-Teste";
const BRANCH = "main";
const API_BASE = "https://api.github.com";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-GitHub-Api-Version",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? cors(origin) : {})
    }
  });
}
function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
async function sha256(value) {
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}
function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}
async function createSession(env) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "gpensc-admin-access",
    sub: "collaborator",
    iat: now,
    exp: now + 8 * 60 * 60,
    codeHash: await sha256(env.ACCESS_CODE)
  };
  const encoded = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  return encoded + "." + await hmac(encoded, env.SESSION_SECRET);
}
async function verifySession(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const expectedSignature = await hmac(parts[0], env.SESSION_SECRET);
  if (!constantTimeEqual(parts[1], expectedSignature)) return false;
  try {
    const payload = JSON.parse(decoder.decode(base64UrlToBytes(parts[0])));
    if (payload.iss !== "gpensc-admin-access" || payload.exp <= Math.floor(Date.now() / 1000)) return false;
    if (!constantTimeEqual(payload.codeHash, await sha256(env.ACCESS_CODE))) return false;
    return true;
  } catch {
    return false;
  }
}
function safeRepoTarget(raw, method) {
  if (!raw || !raw.startsWith("/") || raw.includes("\\") || raw.includes("#")) return null;
  if (raw.split("/").some((part) => {
    try { const decoded = decodeURIComponent(part); return decoded === "." || decoded === ".."; }
    catch { return true; }
  })) return null;

  let target;
  try { target = new URL(raw, API_BASE); } catch { return null; }
  if (target.origin !== API_BASE) return null;
  const prefix = "/repos/" + REPO + "/";
  if (!target.pathname.startsWith(prefix)) return null;
  const resource = target.pathname.slice(prefix.length);

  if (method === "GET") {
    if (resource === "contents/admin/config.yml") {
      return target.searchParams.get("ref") === BRANCH ? target : null;
    }
    if (resource.startsWith("contents/data/")) {
      if (!/\.ya?ml$/i.test(resource)) return null;
      return target.searchParams.get("ref") === BRANCH ? target : null;
    }
    if (resource === "commits") {
      if (target.searchParams.get("path") !== "data") return null;
      const perPage = Number(target.searchParams.get("per_page") || 15);
      return perPage > 0 && perPage <= 15 ? target : null;
    }
    if (/^commits\/[a-f0-9]{7,40}$/i.test(resource)) return target;
    return null;
  }

  if (method === "PUT" && resource.startsWith("contents/")) {
    const filePath = resource.slice("contents/".length);
    if (!(filePath.startsWith("data/") && /\.ya?ml$/i.test(filePath)) && !filePath.startsWith("img/")) return null;
    return target;
  }
  return null;
}
async function githubProxy(request, env, origin) {
  if (!await verifySession(request, env)) return json({ error: "A sessão expirou. Entre novamente com o código de acesso." }, 401, origin);
  const url = new URL(request.url);
  const method = request.method;
  const target = safeRepoTarget(url.searchParams.get("path") || "", method);
  if (!target) return json({ error: "Operação não permitida para este acesso." }, 403, origin);

  let body;
  if (method === "PUT") {
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 12 * 1024 * 1024) return json({ error: "O arquivo excede o limite permitido." }, 413, origin);
    const rawBody = await request.text();
    if (rawBody.length > 12 * 1024 * 1024) return json({ error: "O arquivo excede o limite permitido." }, 413, origin);
    try {
      const parsed = JSON.parse(rawBody);
      if (parsed.branch !== BRANCH || typeof parsed.content !== "string") {
        return json({ error: "O conteúdo enviado não passou pela validação de segurança." }, 400, origin);
      }
    } catch {
      return json({ error: "O conteúdo enviado não é um JSON válido." }, 400, origin);
    }
    body = rawBody;
  }

  const headers = {
    "Authorization": "Bearer " + env.GITHUB_TOKEN,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (body) headers["Content-Type"] = "application/json";
  const upstream = await fetch(target.toString(), { method, headers, ...(body ? { body } : {}) });
  const responseBody = await upstream.text();
  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...cors(origin)
    }
  });
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "";
    if (!allowedOrigin || origin !== allowedOrigin) return json({ error: "Origem não autorizada." }, 403, "");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(allowedOrigin) });
    if (!env.ACCESS_CODE || env.ACCESS_CODE.length < 24 || !env.SESSION_SECRET || env.SESSION_SECRET.length < 32 || !env.GITHUB_TOKEN) {
      return json({ error: "O serviço de acesso ainda não foi configurado pelo administrador." }, 503, allowedOrigin);
    }
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/token/login") {
      let input;
      try {
        const raw = await request.text();
        if (raw.length > 2048) return json({ error: "Solicitação inválida." }, 400, allowedOrigin);
        input = JSON.parse(raw);
      } catch {
        return json({ error: "Informe um código de acesso válido." }, 400, allowedOrigin);
      }
      const code = typeof input.code === "string" ? input.code.trim() : "";
      if (!code || !constantTimeEqual(await sha256(code), await sha256(env.ACCESS_CODE))) {
        return json({ error: "Código de acesso inválido." }, 401, allowedOrigin);
      }
      return json({ ok: true, token: await createSession(env), expiresIn: 8 * 60 * 60 }, 200, allowedOrigin);
    }
    if ((request.method === "GET" || request.method === "PUT") && url.pathname === "/github") {
      return githubProxy(request, env, allowedOrigin);
    }
    return json({ error: "Rota não encontrada." }, 404, allowedOrigin);
  }
};
