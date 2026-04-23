import PostalMime from "postal-mime";
import { loadRules, loadWhitelist, saveEmail } from "./db.js";
import { MAX_MATCH_CONTENT_CHARS, MAX_RULE_PATTERN_LENGTH, MAX_SENDER_PATTERN_LENGTH } from "../utils/constants.js";

function normalizeSearchContent(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'");
}

function htmlToText(html) {
  const stripped = String(html || "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\b[^>]*>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|tr|td|th|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return normalizeSearchContent(
    decodeHtmlEntities(stripped)
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
  );
}

function getMatchValue(match) {
  if (!match) return "";
  for (let i = 1; i < match.length; i += 1) {
    if (typeof match[i] === "string" && match[i].length > 0) return match[i];
  }
  return match[0] || "";
}

// ─── 核心业务逻辑 (Email Processing) ──────────────────────────────────────────

/**
 * 解析入站邮件的原始数据
 */
async function parseIncomingEmail(message) {
  const rawBuffer = await new Response(message.raw).arrayBuffer();
  const parsed = await new PostalMime().parse(rawBuffer);
  const toList = Array.isArray(parsed.to) ? parsed.to : [];

  return {
    from: parsed.from?.address || "",
    to: toList.map((item) => item.address).filter(Boolean),
    subject: parsed.subject || "",
    text: parsed.text || "",
    html: parsed.html || ""
  };
}

/**
 * 对邮件内容应用解析规则
 */
function applyRules(contents, sender, rules) {
  const senderValue = String(sender || "").toLowerCase();
  const safeContents = Array.from(new Set((Array.isArray(contents) ? contents : [contents])
    .map((content) => String(content || "").slice(0, MAX_MATCH_CONTENT_CHARS))
    .filter(Boolean)));
  const outputs = [];
  for (const rule of rules) {
    if (!senderMatches(senderValue, rule.sender_filter)) continue;
    try {
      const pattern = String(rule.pattern || "");
      if (!pattern || pattern.length > MAX_RULE_PATTERN_LENGTH) continue;
      const regex = new RegExp(pattern, "m");
      for (const content of safeContents) {
        const match = content.match(regex);
        const value = getMatchValue(match);
        if (value) {
          outputs.push({ rule_id: rule.id, value, remark: rule.remark || null });
          break;
        }
      }
    } catch { continue; }
  }
  return outputs;
}

/**
 * 检查发件人是否在白名单中
 */
function senderInWhitelist(sender, whitelist) {
  if (whitelist.length === 0) return true;
  const senderValue = String(sender || "").toLowerCase();
  return whitelist.some(({ sender_pattern }) => {
    const pattern = String(sender_pattern || "");
    if (!pattern || pattern.length > MAX_SENDER_PATTERN_LENGTH) return false;
    try { return new RegExp(pattern, "i").test(senderValue); } catch { return false; }
  });
}

/**
 * 辅助函数：匹配发件人与过滤规则
 */
function senderMatches(senderValue, filterValue) {
  const filter = String(filterValue || "").trim();
  if (!filter) return true;
  const parts = filter.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  return parts.length === 0 || parts.some((pattern) => {
    if (!pattern || pattern.length > MAX_SENDER_PATTERN_LENGTH) return false;
    try { return new RegExp(pattern, "i").test(senderValue); } catch { return false; }
  });
}

/**
 * 集中处理入站邮件的完整流程 (解析 -> 过滤 -> 匹配 -> 存储)
 */
export async function processIncomingEmail(message, env, ctx) {
  const parsed = await parseIncomingEmail(message);

  parsed.from = String(parsed.from || "").toLowerCase();
  parsed.to = Array.isArray(parsed.to) ? parsed.to.map((a) => String(a || "").toLowerCase()) : [];

  const whitelist = await loadWhitelist(env.DB);
  if (!senderInWhitelist(parsed.from, whitelist)) return null;

  const rules = await loadRules(env.DB);
  const textContent = normalizeSearchContent(parsed.text);
  const htmlContent = htmlToText(parsed.html);
  const subjectContent = normalizeSearchContent(parsed.subject);
  const matches = applyRules([textContent, htmlContent, subjectContent], parsed.from, rules);

  ctx.waitUntil(saveEmail(env.DB, { ...parsed, matches }));

  return parsed;
}
