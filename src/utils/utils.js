// ─── 通用工具函数 ─────────────────────────────────────────────────────────────

/**
 * 限制分页参数在合理范围内
 */
export function clampPage(value) {
  const page = Number(value);
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

/**
 * 安全解析 JSON 字符串
 */
export function safeParseJson(value) {
  try { return JSON.parse(value); } catch { return null; }
}

/**
 * 解析 JSON body。
 * 返回: { ok: true, data } 或 { ok: false, error }
 */
export async function readJsonBody(request) {
  try {
    const data = await request.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: "invalid JSON body" };
  }
}

/**
 * 为 Response 添加 CORS 响应头（原地修改）。
 */
export function applyCors(response, corsHeaders) {
  for (const [k, v] of Object.entries(corsHeaders || {})) response.headers.set(k, v);
  return response;
}

/**
 * 返回标准 JSON 响应
 */
export function json(data, status = 200) {
  return Response.json({ code: status, data }, { status });
}

/**
 * 返回 JSON 错误响应
 */
export function jsonError(message, status) {
  return Response.json({ code: status, message }, { status });
}
