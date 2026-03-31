export function renderHtml(PAGE_SIZE, RULES_PAGE_SIZE) {
  const DASHBOARD_STYLE = `
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      .dark ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      .dark ::-webkit-scrollbar-thumb:hover { background: #475569; }
      ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `;


  return `<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Temp Mail Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = { darkMode: 'class' };
      (function() {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      })();
    </script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <style>\${DASHBOARD_STYLE}</style>
  </head>
  <body class="bg-slate-50 dark:bg-[#09090b] text-slate-600 dark:text-slate-300 antialiased selection:bg-indigo-500/30 transition-colors duration-300">
    <div id="app" class="min-h-screen">
      <header class="max-w-5xl mx-auto px-4 py-3 mt-1">
        <div class="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] backdrop-blur-xl px-6 py-5 flex items-center justify-between shadow-sm dark:shadow-2xl transition-all">
          <div class="flex items-center gap-4">
            <div class="h-10 w-10 flex border border-slate-200 dark:border-white/10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-inner shadow-white/20">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <div>
              <h1 class="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Temp Mail Console</h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cloudflare Workers</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <!-- 运行状态 -->
            <div
              class="h-8 flex items-center gap-1.5 px-3 rounded-full border shadow-sm transition-all duration-300"
              :class="apiActive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'"
            >
              <span class="relative flex h-1.5 w-1.5">
                <span v-if="apiActive" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5" :class="apiActive ? 'bg-emerald-500' : 'bg-red-500'"></span>
              </span>
              <span class="text-[10px] font-bold uppercase tracking-widest" :class="apiActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                {{ apiActive ? '运行中' : '网络错误' }}
              </span>
            </div>
            <!-- 主题切换 -->
            <button
              @click="toggleTheme"
              class="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-all shadow-sm"
              :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
            >
              <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-4 pt-3 pb-6">
        <div class="mb-6 p-1 relative flex items-center gap-1 bg-slate-200/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl w-fit shadow-sm dark:shadow-inner dark:shadow-black/20">
          <button
            class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200"
            :class="activeTab === 'emails' ? 'bg-white dark:bg-white/[0.1] text-indigo-600 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'"
            @click="activeTab = 'emails'"
          >邮件记录</button>
          <button
            class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200"
            :class="activeTab === 'rules' ? 'bg-white dark:bg-white/[0.1] text-indigo-600 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'"
            @click="activeTab = 'rules'"
          >命中规则</button>
          <button
            class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200"
            :class="activeTab === 'whitelist' ? 'bg-white dark:bg-white/[0.1] text-indigo-600 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'"
            @click="activeTab = 'whitelist'"
          >发件人白名单</button>
          <button
            class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200"
            :class="activeTab === 'api' ? 'bg-white dark:bg-white/[0.1] text-indigo-600 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'"
            @click="activeTab = 'api'"
          >API</button>
        </div>

        <div v-if="adminError" class="mb-4 text-xs text-red-400">{{ adminError }}</div>

        <section v-if="activeTab === 'emails'" class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm dark:shadow-xl dark:shadow-black/20 overflow-hidden backdrop-blur-sm">
          <div class="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.01]">
            <div class="flex items-center gap-4">
              <h2 class="text-sm font-semibold text-slate-900 dark:text-white">收件箱</h2>
              <!-- 域名筛选器 -->
              <div v-if="availableDomains.length > 0" class="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-white/5">
                <span class="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">筛选域名</span>
                <select
                  v-model="filterDomain"
                  @change="page=1;loadList()"
                  class="bg-transparent text-[11px] font-medium text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer hover:text-indigo-600 dark:hover:text-white transition-colors"
                >
                  <option value="">全部域名</option>
                  <option v-for="d in availableDomains" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
            </div>
            <div class="flex items-center gap-2 text-[11px]">
              <button class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" @click="prevPage" :disabled="page===1">上一页</button>
              <span class="px-3 py-1 text-slate-500 dark:text-slate-400">{{ page }} / {{ totalPages }}</span>
              <button class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" @click="nextPage" :disabled="page>=totalPages">下一页</button>
            </div>
          </div>
          <div class="p-5 space-y-3">
            <div class="grid grid-cols-[1.5fr,1.2fr,1.2fr,0.8fr] gap-4 px-3 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-medium">
              <div>主题</div>
              <div>发件人</div>
              <div>收件人</div>
              <div class="text-right">已接收</div>
            </div>
            <div v-if="items.length===0" class="min-h-[240px] flex items-center justify-center text-xs text-slate-400">暂无邮件记录</div>
            <div v-for="item in items" :key="item.message_id" class="p-3.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-sm dark:hover:shadow-none transition-all duration-200 cursor-pointer group" @click="toggleResult(item.message_id)">
              <div class="grid grid-cols-[1.5fr,1.2fr,1.2fr,0.8fr] gap-4 items-center">
                <div class="min-w-0">
                  <div class="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">{{ item.subject || '(无主题)' }}</div>
                </div>
                <div class="min-w-0 text-[11px] text-slate-500 dark:text-slate-400 truncate">{{ item.from_address }}</div>
                <div class="min-w-0 text-[11px] text-slate-500 dark:text-slate-400 truncate">{{ item.to_address }}</div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 text-right tabular-nums">{{ formatTime(item.received_at) }}</div>
                <div v-if="!hasResult(item.extracted_json) || expandedResults[item.message_id]" class="col-span-4 mt-3">
                  <div v-if="hasResult(item.extracted_json) && expandedResults[item.message_id]" class="relative group/copy" @click.stop>
                    <div
                      class="text-[12px] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-200 rounded-lg p-3 whitespace-pre-wrap font-mono pr-12 shadow-inner"
                    >{{ formatResult(item.extracted_json) }}</div>
                    <button
                      class="absolute top-2 right-2 p-1.5 rounded-md text-indigo-400 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-100 dark:hover:bg-indigo-500/20 opacity-0 group-hover/copy:opacity-100 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30 font-medium text-[10px] tracking-wider uppercase"
                      @click.stop="copyContent(formatResult(item.extracted_json), item.message_id)"
                    >{{ copyStatus[item.message_id] ? '已复制' : '复制' }}</button>
                  </div>
                  <div v-if="!hasResult(item.extracted_json)" class="text-[11px] text-slate-400 dark:text-slate-600">— 未提取到规则内容</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'rules'" class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm dark:shadow-xl dark:shadow-black/20 overflow-hidden backdrop-blur-sm">
          <div class="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01]">
            <h2 class="text-sm font-semibold text-slate-900 dark:text-white">命中规则</h2>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">符合发信人过滤规则的邮件，将会使用对应的邮件内容匹配规则进行解析</p>
          </div>

          <div class="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div class="lg:col-span-5">
              <div class="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] p-5 lg:sticky lg:top-5">
                <div class="mb-4">
                  <div class="text-[13px] font-medium text-slate-900 dark:text-white mb-0.5">添加规则</div>
                  <div class="text-[11px] text-slate-500">创建新的正则提取器</div>
                </div>
                <div class="space-y-4">
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">备注</label>
                    <input v-model="newRule.remark" type="text" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-black/20 text-[13px] text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-sans" placeholder="e.g. 验证码" />
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">发信人过滤规则</label>
                    <textarea v-model="newRule.sender_filter" rows="3" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-black/20 text-[13px] text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono" placeholder="e.g. noreply@example.com"></textarea>
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">内容匹配正则</label>
                    <textarea v-model="newRule.pattern" rows="5" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-black/20 text-[13px] text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono" placeholder="e.g. (\d{6})"></textarea>
                  </div>
                  <button class="w-full py-2.5 rounded-lg bg-indigo-600 dark:bg-white text-white dark:text-slate-900 font-medium text-[13px] hover:bg-indigo-700 dark:hover:bg-slate-200 hover:shadow-md dark:hover:shadow-none transition-all mt-2" @click="addRule">添加规则</button>
                </div>
              </div>
            </div>
            <div class="lg:col-span-7">
              <div class="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col min-h-[460px]">
                <div class="px-5 py-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-transparent">
                  <div class="text-[12px] font-medium text-slate-700 dark:text-slate-300">现有规则</div>
                  <div class="flex items-center gap-2 text-[11px]">
                    <span class="text-slate-400 dark:text-slate-500 mr-2">总计: {{ rulesTotal }}</span>
                    <button class="px-2.5 py-1 rounded border border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50" @click="prevRulesPage" :disabled="rulesPage===1">上一页</button>
                    <span class="text-slate-500 dark:text-slate-400">{{ rulesPage }} / {{ rulesTotalPages }}</span>
                    <button class="px-2.5 py-1 rounded border border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50" @click="nextRulesPage" :disabled="rulesPage>=rulesTotalPages">下一页</button>
                  </div>
                </div>
                <div class="p-3 space-y-2 flex-1 overflow-auto">
                  <div v-if="rules.length===0" class="h-full flex items-center justify-center text-[12px] text-slate-400">尚无配置规则。</div>
                  <div v-for="rule in rules" :key="rule.id" class="p-3.5 rounded-lg border border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:border-slate-200 dark:hover:border-white/10 transition-all flex items-start justify-between gap-4 group">
                    <div class="min-w-0 space-y-1.5 flex-1">
                      <div v-if="rule.remark" class="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">{{ rule.remark }}</div>
                      <div class="text-[11px] text-slate-400 dark:text-slate-400 truncate flex items-center gap-2">
                        <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/5 font-mono text-slate-500 dark:text-slate-400">来自</span>
                        <span class="truncate">{{ rule.sender_filter || '所有发件人' }}</span>
                      </div>
                      <div class="text-[11px] text-slate-400 dark:text-slate-400 break-words flex items-start gap-2">
                        <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/5 font-mono shrink-0 pt-0.5 text-slate-500 dark:text-slate-400">正则</span>
                        <span class="font-mono text-indigo-500 dark:text-indigo-300">{{ rule.pattern }}</span>
                      </div>
                    </div>
                    <button class="shrink-0 text-[11px] px-2.5 py-1.5 rounded-md text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all font-medium" @click="deleteRule(rule.id)">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'whitelist'" class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm dark:shadow-xl dark:shadow-black/20 overflow-hidden backdrop-blur-sm">
          <div class="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01]">
            <h2 class="text-sm font-semibold text-slate-900 dark:text-white">发件人白名单</h2>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">只处理匹配白名单的发信人，白名单为空时接受所有邮件</p>
          </div>
          <div class="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div class="lg:col-span-5">
              <div class="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] p-5">
                <div class="mb-4">
                  <div class="text-[13px] font-medium text-slate-900 dark:text-white mb-0.5">添加白名单</div>
                  <div class="text-[11px] text-slate-500">支持正则表达式</div>
                </div>
                <div class="space-y-4">
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">发信人模式</label>
                    <textarea v-model="newWhitelist" rows="4" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-black/20 text-[13px] text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono" placeholder="e.g. .*@example\.com"></textarea>
                  </div>
                  <button class="w-full py-2.5 rounded-lg bg-indigo-600 dark:bg-white text-white dark:text-slate-900 font-medium text-[13px] hover:bg-indigo-700 dark:hover:bg-slate-200 hover:shadow-md dark:hover:shadow-none transition-all mt-2" @click="addWhitelistEntry">添加白名单</button>
                </div>
              </div>
            </div>
            <div class="lg:col-span-7">
              <div class="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col min-h-[220px]">
                <div class="px-5 py-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-transparent">
                  <div class="text-[12px] font-medium text-slate-700 dark:text-slate-300">白名单列表</div>
                  <div class="flex items-center gap-2 text-[11px]">
                    <span class="text-slate-400 dark:text-slate-500 mr-2">总计: {{ whitelistTotal }}</span>
                    <button class="px-2.5 py-1 rounded border border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50" @click="prevWhitelistPage" :disabled="whitelistPage===1">上一页</button>
                    <span class="text-slate-500 dark:text-slate-400">{{ whitelistPage }} / {{ whitelistTotalPages }}</span>
                    <button class="px-2.5 py-1 rounded border border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50" @click="nextWhitelistPage" :disabled="whitelistPage>=whitelistTotalPages">下一页</button>
                  </div>
                </div>
                <div class="p-3 space-y-2 flex-1 overflow-auto">
                  <div v-if="whitelistItems.length===0" class="h-full flex items-center justify-center text-[12px] text-slate-400">尚无白名单，当前接受所有发信人</div>
                  <div v-for="item in whitelistItems" :key="item.id" class="p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:border-slate-200 dark:hover:border-white/10 transition-colors flex items-center justify-between gap-4 group">
                    <div class="min-w-0 font-mono text-[12px] text-indigo-500 dark:text-indigo-300 truncate">{{ item.sender_pattern }}</div>
                    <button class="shrink-0 text-[11px] px-2.5 py-1.5 rounded-md text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all font-medium" @click="deleteWhitelistEntry(item.id)">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section v-if="activeTab === 'api'" class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm dark:shadow-xl dark:shadow-black/20 overflow-hidden backdrop-blur-sm">
          <div class="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01]">
            <h2 class="text-sm font-semibold text-slate-900 dark:text-white">API</h2>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">外部集成接口文档，用于第三方系统获取邮件处理结果</p>
          </div>

          <div class="p-6 space-y-10">
            <!-- 身份验证 -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <h3 class="text-[13px] font-semibold text-slate-700 dark:text-slate-200">身份验证</h3>
              </div>
              <p class="text-[12px] text-slate-500 dark:text-slate-400">所有 API 请求必须在请求头中包含 Bearer Token。</p>
              <div class="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#030303] p-4 text-slate-600 dark:text-slate-300 font-mono text-[12px] shadow-sm dark:shadow-inner">
                <span class="text-slate-400 dark:text-slate-500">Authorization:</span> Bearer <span class="text-indigo-600 dark:text-indigo-400">&lt;API_TOKEN&gt;</span>
              </div>
            </div>

            <!-- 接口：获取最新邮件结果 -->
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <h3 class="text-[13px] font-semibold text-slate-700 dark:text-slate-200">获取最新邮件结果</h3>
              </div>

              <div class="flex items-center gap-3">
                <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">GET</span>
                <code class="text-[12px] text-slate-600 dark:text-slate-300 font-mono">/api/emails/latest</code>
              </div>

              <div class="space-y-3">
                <div class="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">请求参数 (Query)</div>
                <div class="rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                  <table class="w-full text-left text-[12px] border-collapse">
                    <thead class="bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 font-medium">
                      <tr>
                        <th class="px-4 py-2 border-b border-slate-200 dark:border-white/5 w-1/4">参数</th>
                        <th class="px-4 py-2 border-b border-slate-200 dark:border-white/5 w-1/4">类型</th>
                        <th class="px-4 py-2 border-b border-slate-200 dark:border-white/5">说明</th>
                      </tr>
                    </thead>
                    <tbody class="text-slate-600 dark:text-slate-300">
                      <tr>
                        <td class="px-4 py-3 border-b border-slate-200 dark:border-white/5 font-mono text-indigo-600 dark:text-indigo-300">address</td>
                        <td class="px-4 py-3 border-b border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 italic">string</td>
                        <td class="px-4 py-3 border-b border-slate-200 dark:border-white/5">收件人的电子邮箱地址 (必填)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="space-y-3 pt-2">
                <div class="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">响应参数说明</div>
                <div class="rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                  <table class="w-full text-left text-[11px] border-collapse">
                    <thead class="bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 font-medium">
                      <tr>
                        <th class="px-4 py-2 border-b border-slate-200 dark:border-white/5 w-1/4">参数名</th>
                        <th class="px-4 py-2 border-b border-slate-200 dark:border-white/5">类型</th>
                        <th class="px-4 py-2 border-b border-slate-200 dark:border-white/5">详细说明</th>
                      </tr>
                    </thead>
                    <tbody class="text-slate-600 dark:text-slate-300">
                      <tr>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 font-mono text-indigo-600 dark:text-indigo-300">code</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 italic">number</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5">业务状态码，200 表示成功</td>
                      </tr>
                      <tr class="bg-slate-50/50 dark:bg-white/[0.01]">
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 font-mono text-indigo-600 dark:text-indigo-300">data</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 italic">object</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5">返回的数据主体</td>
                      </tr>
                      <tr>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 font-mono text-slate-400 dark:text-slate-400 pl-8">.from_address</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 italic">string</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5">发件人电子邮箱地址</td>
                      </tr>
                      <tr>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 font-mono text-slate-400 dark:text-slate-400 pl-8">.to_address</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 italic">string</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5">收件人电子邮箱地址</td>
                      </tr>
                      <tr>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 font-mono text-slate-400 dark:text-slate-400 pl-8">.received_at</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 italic">number</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5">邮件接收时间戳（13位毫秒）</td>
                      </tr>
                      <tr>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 font-mono text-slate-400 dark:text-slate-400 pl-8">.results</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 italic">array</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5">命中规则提取的结果列表</td>
                      </tr>
                      <tr class="bg-indigo-500/[0.02]">
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 font-mono text-indigo-500/50 dark:text-indigo-200/50 pl-12">..rule_id</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-600 italic">number</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400">匹配到的规则唯一 ID</td>
                      </tr>
                      <tr class="bg-indigo-500/[0.02]">
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 font-mono text-indigo-500/50 dark:text-indigo-200/50 pl-12">..value</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-600 italic">string</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400">正则匹配提取到的实际内容</td>
                      </tr>
                      <tr class="bg-indigo-500/[0.02]">
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 font-mono text-indigo-500/50 dark:text-indigo-200/50 pl-12">..remark</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-600 italic">string</td>
                        <td class="px-4 py-2 border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400">规则的备注说明（可能为 null）</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="space-y-3 pt-2">
                <div class="text-[11px] font-medium text-slate-500 uppercase tracking-widest">响应示例 (JSON)</div>
                <pre class="rounded-xl border border-white/5 bg-[#030303] p-4 text-slate-300 font-mono text-[12px] shadow-inner overflow-x-auto leading-relaxed">{
  <span class="text-indigo-400">"code"</span>: 200,
  <span class="text-indigo-400">"data"</span>: {
    <span class="text-indigo-400">"from_address"</span>: <span class="text-emerald-400">"sender@example.com"</span>,
    <span class="text-indigo-400">"to_address"</span>: <span class="text-emerald-400">"target@domain.com"</span>,
    <span class="text-indigo-400">"received_at"</span>: 1741881600000,
    <span class="text-indigo-400">"results"</span>: [
      { <span class="text-indigo-400">"rule_id"</span>: 1, <span class="text-indigo-400">"value"</span>: <span class="text-emerald-400">"123"</span>, <span class="text-indigo-400">"remark"</span>: <span class="text-emerald-400">"备注"</span> }
    ]
  }
}</pre>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer class="max-w-5xl mx-auto px-4 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div class="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4">
          <span>© 2026 Temp Mail Console</span>
          <a class="text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors" href="https://github.com/beyoug/temp-mail-console" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </div>

    <script>
      const { createApp } = Vue;
      createApp({
        data() {
          return {
            page: 1, total: 0, items: [],
            rules: [], rulesPage: 1, rulesTotal: 0,
            newRule: { remark: "", sender_filter: "", pattern: "" },
            whitelistItems: [], whitelistPage: 1, whitelistTotal: 0,
            newWhitelist: "", activeTab: "emails",
            adminToken: "", adminError: "", poller: null,
            expandedResults: {}, copyStatus: {}, isDark: true,
            apiActive: true,
            availableDomains: [], filterDomain: ""
          };
        },
        computed: {
          totalPages() { return Math.max(1, Math.ceil(this.total / ${PAGE_SIZE})); },
          rulesTotalPages() { return Math.max(1, Math.ceil(this.rulesTotal / ${RULES_PAGE_SIZE})); },
          whitelistTotalPages() { return Math.max(1, Math.ceil(this.whitelistTotal / ${RULES_PAGE_SIZE})); }
        },
        mounted() {
          this.isDark = document.documentElement.classList.contains('dark');
          this.adminToken = getCookieValue("admin_token");
          if (!this.adminToken) return;
          this.loadList(); this.loadRules(); this.loadWhitelistData(); this.loadDomains(); this.startPolling();
        },
        beforeUnmount() { this.stopPolling(); },
        methods: {
          toggleTheme() {
            this.isDark = !this.isDark;
            const root = document.documentElement;
            if (this.isDark) { root.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
            else { root.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
          },
          startPolling() {
            this.stopPolling();
            this.poller = setInterval(() => {
              if (this.adminToken && this.activeTab === "emails") this.loadList();
            }, 5000);
          },
          stopPolling() { if (this.poller) { clearInterval(this.poller); this.poller = null; } },
          async handleAuthError(res) {
            if (res.status === 401) { this.clearAdminToken("密码不正确，请重试"); return true; }
            return false;
          },
          clearAdminToken(message) {
            this.adminToken = ""; this.adminError = message || "";
            document.cookie = "admin_token=; Path=/; Max-Age=0; SameSite=Lax";
            this.stopPolling();
          },
          async requestJson(url, options = {}) {
            try {
              const res = await fetch(url, {
                ...options,
                headers: { ...this.adminHeaders(), ...(options.headers || {}) }
              });
              if (await this.handleAuthError(res)) return null;
              this.apiActive = true;
              return res.json();
            } catch (err) {
              this.apiActive = false;
              console.error("API Request failed:", err);
              return null;
            }
          },
          async loadList() {
            let url = "/admin/emails?page=" + this.page;
            if (this.filterDomain) url += "&domain=" + this.filterDomain;
            const payload = await this.requestJson(url);
            if (!payload || !payload.data) return;
            this.items = payload.data.items || [];
            this.total = payload.data.total || 0;
          },
          async loadDomains() {
            const payload = await this.requestJson("/admin/domains");
            if (payload && payload.data) this.availableDomains = payload.data.domains || [];
          },
          async loadRules() {
            const payload = await this.requestJson("/admin/rules?page=" + this.rulesPage);
            if (!payload || !payload.data) return;
            this.rules = payload.data.items || [];
            this.rulesTotal = payload.data.total || 0;
          },
          async addRule() {
            if (!this.newRule.pattern) return;
            const payload = await this.requestJson("/admin/rules", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(this.newRule)
            });
            if (!payload) return;
            this.newRule = { remark: "", sender_filter: "", pattern: "" };
            this.rulesPage = 1; await this.loadRules();
          },
          async deleteRule(id) {
            const payload = await this.requestJson("/admin/rules/" + id, { method: "DELETE" });
            if (!payload) return;
            await this.loadRules();
            if (this.rules.length === 0 && this.rulesPage > 1) { this.rulesPage -= 1; await this.loadRules(); }
          },
          adminHeaders() { return this.adminToken ? { Authorization: "Bearer " + this.adminToken } : {}; },
          async nextPage() { if (this.page < this.totalPages) { this.page += 1; await this.loadList(); } },
          async prevPage() { if (this.page > 1) { this.page -= 1; await this.loadList(); } },
          async nextRulesPage() { if (this.rulesPage < this.rulesTotalPages) { this.rulesPage += 1; await this.loadRules(); } },
          async prevRulesPage() { if (this.rulesPage > 1) { this.rulesPage -= 1; await this.loadRules(); } },
          async loadWhitelistData() {
            const payload = await this.requestJson("/admin/whitelist?page=" + this.whitelistPage);
            if (!payload || !payload.data) return;
            this.whitelistItems = payload.data.items || [];
            this.whitelistTotal = payload.data.total || 0;
          },
          async addWhitelistEntry() {
            if (!this.newWhitelist.trim()) return;
            const payload = await this.requestJson("/admin/whitelist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sender_pattern: this.newWhitelist.trim() })
            });
            if (!payload) return;
            this.newWhitelist = ""; this.whitelistPage = 1; await this.loadWhitelistData();
          },
          async deleteWhitelistEntry(id) {
            const payload = await this.requestJson("/admin/whitelist/" + id, { method: "DELETE" });
            if (!payload) return;
            await this.loadWhitelistData();
          },
          async nextWhitelistPage() { if (this.whitelistPage < this.whitelistTotalPages) { this.whitelistPage += 1; await this.loadWhitelistData(); } },
          async prevWhitelistPage() { if (this.whitelistPage > 1) { this.whitelistPage -= 1; await this.loadWhitelistData(); } },
          toggleResult(messageId) { this.expandedResults[messageId] = !this.expandedResults[messageId]; },
          async copyContent(text, messageId) {
            try {
              await navigator.clipboard.writeText(text);
              this.copyStatus[messageId] = true;
              setTimeout(() => { this.copyStatus[messageId] = false; }, 2000);
            } catch (err) { console.error("Failed to copy:", err); }
          },
          hasResult(raw) { try { const p = JSON.parse(raw); return Array.isArray(p) && p.length > 0; } catch { return false; } },
          formatResult(raw) {
            try {
              const p = JSON.parse(raw);
              return Array.isArray(p) ? JSON.stringify(p, null, 2) : String(p ?? "");
            } catch { return raw || ""; }
          },
          formatTime(ts) { return new Date(ts).toLocaleString(); }
        }
      }).mount("#app");

      function getCookieValue(name) {
        const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
        return match ? decodeURIComponent(match[1]) : "";
      }

    </script>
  </body>
</html>`;
}

export function renderAuthHtml() {
  return `<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Temp Mail Console - 登录</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = { darkMode: 'class' };
      (function() {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      })();
    </script>
    <style>body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }</style>
  </head>
  <body class="bg-slate-50 dark:bg-[#09090b] text-slate-600 dark:text-slate-200 antialiased flex items-center justify-center min-h-screen selection:bg-indigo-500/30 transition-colors duration-300">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(99,102,241,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_center,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none"></div>
    <div class="w-full max-w-sm p-8 rounded-[1.5rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 backdrop-blur-xl shadow-xl dark:shadow-2xl relative">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 flex border border-slate-200 dark:border-white/10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-inner shadow-white/20">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <span class="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Temp Mail Console</span>
        </div>
        <button id="theme-toggle" class="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-all shadow-sm">
          <svg id="moon" class="w-4 h-4 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          <svg id="sun" class="w-4 h-4 block dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
        </button>
      </div>
      <h1 class="text-xl font-semibold text-slate-900 dark:text-white tracking-tight mb-1">控制台访问</h1>
      <p class="text-[13px] text-slate-500 dark:text-slate-400 mb-8">请输入访问令牌以继续</p>
      <form class="space-y-4" onsubmit="return false;">
        <input
          id="admin-token"
          type="password"
          class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-[13px]"
          placeholder="管理令牌"
          autocomplete="current-password"
        />
        <div id="admin-error" class="text-[12px] text-red-500 dark:text-red-400 hidden">密码不正确，请重试</div>
        <button
          id="admin-submit"
          type="button"
          class="w-full py-2.5 rounded-xl bg-indigo-600 dark:bg-white text-white dark:text-slate-900 font-medium text-[13px] hover:bg-indigo-700 dark:hover:bg-slate-200 transition-all shadow-lg shadow-indigo-500/10 dark:shadow-white/5"
        >安全登录</button>
      </form>
    </div>
    <script>
      const input = document.getElementById("admin-token");
      const error = document.getElementById("admin-error");
      const submit = document.getElementById("admin-submit");
      const themeToggle = document.getElementById("theme-toggle");

      if (input) input.focus();

      themeToggle.addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      });

      const setError = (message) => {
        if (!error) return;
        error.textContent = message;
        error.classList.remove("hidden");
      };

      const attempt = async () => {
        const token = input ? input.value.trim() : "";
        if (!token) { setError("请输入访问密码"); return; }
        const res = await fetch("/admin/emails?page=1", {
          headers: { Authorization: "Bearer " + token }
        });
        if (res.status === 401) { setError("密码不正确，请重试"); return; }
        if (!res.ok) { setError("登录失败，请重试"); return; }
        document.cookie = "admin_token=" + encodeURIComponent(token) + "; Path=/; SameSite=Lax";
        window.location.href = "/";
      };

      if (submit) submit.addEventListener("click", attempt);
      if (input) input.addEventListener("keydown", (e) => { if (e.key === "Enter") attempt(); });
    </script>
  </body>
</html>`;
}
