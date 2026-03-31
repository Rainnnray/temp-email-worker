import { PAGE_SIZE, RULES_PAGE_SIZE, HTML_HEADERS, CORS_HEADERS } from "./utils/constants.js";
import { jsonError, applyCors } from "./utils/utils.js";
import { isAdminAuthorized, isApiAuthorized } from "./core/auth.js";
import { clearExpiredEmails } from "./core/db.js";
import { processIncomingEmail } from "./core/logic.js";
import * as handlers from "./handlers/handlers.js";
import { renderAuthHtml, renderHtml } from "./ui/templates.js";

function apiOptionsResponse() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
}

function apiJsonError(message, status = 400) {
  return applyCors(jsonError(message, status), CORS_HEADERS);
}

export default {
  /**
   * 处理入站邮件
   */
  async email(message, env, ctx) {
    const parsed = await processIncomingEmail(message, env, ctx);

    // 如果处理成功（通过白名单）且设置了全局转发
    if (parsed && env.FORWARD_TO) {
      try {
        await message.forward(env.FORWARD_TO);
      } catch (err) {
        console.error("邮件转发失败:", err);
      }
    }
  },

  /**
   * 处理 HTTP 请求
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // 1. API 路由 (/api/...)
    if (pathname === "/api/emails/latest") {
      if (method === "OPTIONS") return apiOptionsResponse();
      if (method !== "GET") return apiJsonError("Method Not Allowed", 405);
      if (!isApiAuthorized(request, env.API_TOKEN)) return apiJsonError("Unauthorized", 401);
      const res = await handlers.handleEmailsLatest(url, env.DB);
      return applyCors(res, CORS_HEADERS);
    }

    // 2. 静态页面 (Dashboard)
    if (pathname === "/") {
      if (!isAdminAuthorized(request, env.ADMIN_TOKEN)) {
        return new Response(renderAuthHtml(), { headers: HTML_HEADERS });
      }
      return new Response(renderHtml(PAGE_SIZE, RULES_PAGE_SIZE), { headers: HTML_HEADERS });
    }

    // 3. 管理端路由 (/admin/...)
    if (pathname.startsWith("/admin/")) {
      if (!isAdminAuthorized(request, env.ADMIN_TOKEN)) return new Response("Unauthorized", { status: 401 });

      // 分发请求
      if (pathname === "/admin/domains" && method === "GET") return handlers.handleAdminDomains(url, env.DB);
      if (pathname === "/admin/emails" && method === "GET") return handlers.handleAdminEmails(url, env.DB);
      if (pathname === "/admin/rules" && method === "GET") return handlers.handleAdminRulesGet(url, env.DB);
      if (pathname === "/admin/rules" && method === "POST") return handlers.handleAdminRulesPost(request, env.DB);
      if (pathname.startsWith("/admin/rules/") && method === "DELETE") return handlers.handleAdminRulesDelete(pathname, env.DB);
      if (pathname === "/admin/whitelist" && method === "GET") return handlers.handleAdminWhitelistGet(url, env.DB);
      if (pathname === "/admin/whitelist" && method === "POST") return handlers.handleAdminWhitelistPost(request, env.DB);
      if (pathname.startsWith("/admin/whitelist/") && method === "DELETE") return handlers.handleAdminWhitelistDelete(pathname, env.DB);
    }

    if (pathname.startsWith("/api/")) return apiJsonError("Not Found", 404);
    return new Response("Not Found", { status: 404 });
  },

  /**
   * 定时清理任务
   */
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      clearExpiredEmails(env.DB, 48)
        .then(() => console.log("[Cron] 自动清理完毕"))
        .catch(err => console.error("[Cron] 自动清理失败:", err))
    );
  }
};
