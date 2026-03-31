import { PAGE_SIZE, RULES_PAGE_SIZE, MAX_RULE_PATTERN_LENGTH, MAX_RULE_REMARK_LENGTH, MAX_SENDER_FILTER_LENGTH, MAX_SENDER_PATTERN_LENGTH } from "../utils/constants.js";
import { json, jsonError, clampPage, safeParseJson, readJsonBody } from "../utils/utils.js";
import * as dbActions from "../core/db.js";

// ─── 路由处理函数 (Route Handlers) ─────────────────────────────────────────────

/**
 * [API] 获取针对特定收件地址的最新映射结果
 */
export async function handleEmailsLatest(url, db) {
  const address = String(url.searchParams.get("address") || "").trim();
  if (!address) return jsonError("address is required", 400);

  const row = await dbActions.getLatestEmail(db, address);
  if (!row) return jsonError("message not found", 404);

  return json({
    from_address: row.from_address,
    to_address: row.to_address,
    received_at: row.received_at,
    results: safeParseJson(row.extracted_json) || []
  });
}

/**
 * [Admin] 获取邮件列表 (带分页和域名过滤)
 */
export async function handleAdminEmails(url, db) {
  const page = clampPage(url.searchParams.get("page"));
  const domain = url.searchParams.get("domain") || null;
  const { items, total } = await dbActions.getEmails(db, page, PAGE_SIZE, domain);
  return json({ page, pageSize: PAGE_SIZE, total, items });
}

/**
 * [Admin] 获取系统中的所有域名
 */
export async function handleAdminDomains(url, db) {
  const domains = await dbActions.getAvailableDomains(db);
  return json({ domains });
}

/**
 * [Admin] 获取规则列表 (带分页)
 */
export async function handleAdminRulesGet(url, db) {
  const page = clampPage(url.searchParams.get("page"));
  const { items, total } = await dbActions.getRulesPaged(db, page, RULES_PAGE_SIZE);
  return json({ page, pageSize: RULES_PAGE_SIZE, total, items });
}

/**
 * [Admin] 创建新规则
 */
export async function handleAdminRulesPost(request, db) {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  const body = parsed.data || {};
  const remark = String(body.remark || "").trim();
  const sender_filter = String(body.sender_filter || "").trim();
  const pattern = String(body.pattern || "").trim();
  if (!pattern) return jsonError("pattern is required", 400);
  if (pattern.length > MAX_RULE_PATTERN_LENGTH) return jsonError("pattern is too long", 400);
  if (remark.length > MAX_RULE_REMARK_LENGTH) return jsonError("remark is too long", 400);
  if (sender_filter.length > MAX_SENDER_FILTER_LENGTH) return jsonError("sender_filter is too long", 400);

  await dbActions.createRule(db, {
    remark,
    sender_filter,
    pattern
  });
  return json({ ok: true });
}

/**
 * [Admin] 删除现有规则
 */
export async function handleAdminRulesDelete(pathname, db) {
  const id = Number(pathname.replace("/admin/rules/", ""));
  if (!Number.isFinite(id)) return jsonError("invalid rule id", 400);
  await dbActions.deleteRule(db, id);
  return json({ ok: true });
}

/**
 * [Admin] 获取白名单列表 (带分页)
 */
export async function handleAdminWhitelistGet(url, db) {
  const page = clampPage(url.searchParams.get("page"));
  const { items, total } = await dbActions.getWhitelistPaged(db, page, RULES_PAGE_SIZE);
  return json({ page, pageSize: RULES_PAGE_SIZE, total, items });
}

/**
 * [Admin] 添加白名单项
 */
export async function handleAdminWhitelistPost(request, db) {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  const body = parsed.data || {};
  const senderPattern = String(body.sender_pattern || "").trim();
  if (!senderPattern) return jsonError("sender_pattern is required", 400);
  if (senderPattern.length > MAX_SENDER_PATTERN_LENGTH) return jsonError("sender_pattern is too long", 400);

  await dbActions.createWhitelistEntry(db, senderPattern);
  return json({ ok: true });
}

/**
 * [Admin] 删除白名单项
 */
export async function handleAdminWhitelistDelete(pathname, db) {
  const id = Number(pathname.replace("/admin/whitelist/", ""));
  if (!Number.isFinite(id)) return jsonError("invalid whitelist id", 400);
  await dbActions.deleteWhitelistEntry(db, id);
  return json({ ok: true });
}
