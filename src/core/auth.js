// ─── 认证助手函数 ─────────────────────────────────────────────────────────────

/**
 * 校验管理后台访问权限（Bearer Token 或 Cookie）
 */
export function isAdminAuthorized(request, adminToken) {
  if (!adminToken) return false;
  if (getBearerToken(request) === adminToken) return true;
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  return cookies.admin_token === adminToken;
}

/**
 * 校验 API 访问权限 (仅限 API Token)
 */
export function isApiAuthorized(request, apiToken) {
  if (!apiToken) return false;
  return getBearerToken(request) === apiToken;
}

/**
 * 获取请求头中的 Bearer Token
 */
function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function parseCookies(cookieHeader) {
  const output = {};
  for (const part of String(cookieHeader || "").split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey) output[rawKey] = decodeURIComponent(rest.join("="));
  }
  return output;
}
