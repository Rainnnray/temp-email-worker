# Temp Mail Console

基于 **Cloudflare Workers + D1** 的临时邮箱控制台。接收邮件后，根据可配置的正则规则自动提取关键数据（如验证码），并通过 API 对外提供查询能力。

## 功能

- 🧩 **控制台管理**：邮件列表、规则管理、白名单管理与 API 对接说明。
- 🛡️ **发件人白名单**：基于正则表达式过滤发信人，不匹配直接忽略。
- 🔍 **内容正则提取**：对邮件正文进行正则匹配，提取验证码等关键信息。
- 🖥️ **RESTful API**：对外提供查询接口，便于系统集成。
- 🔄 **全局邮件转发**：入库后可自动转发原始邮件到真实邮箱。
- 🧹 **记录自动清理**：Cron 每小时清理 48 小时前的历史数据，防止数据库膨胀。
- ☁️ **无服务器架构**：基于 Cloudflare Workers + D1，支持低成本托管。

## 界面预览

<table>
  <tr>
    <td align="center"><img src="images/pqvxt.png" alt="控制台-邮件列表" width="260" /></td>
    <td align="center"><img src="images/nldhs.png" alt="控制台-命中规则" width="260" /></td>
    <td align="center"><img src="images/kbrya.png" alt="控制台-白名单" width="260" /></td>
  </tr>
</table>


## 快速开始

### 方式一：一键部署（推荐）

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/beyoug/temp-mail-console)

> 点击上方按钮可全自动 Fork 并在你的 Cloudflare 账户上部署该项目，自动分配 D1 数据库资源。部署后别忘了按下方指南补充运行时变量（如 `ADMIN_TOKEN` 和 `API_TOKEN`）以及邮件路由。

> 提示：当前版本会在部署阶段自动执行 D1 migrations。完成 `ADMIN_TOKEN` / `API_TOKEN` 和邮件路由配置后即可使用。

---

### 方式二：手动部署

### 1. 安装依赖

```bash
npm install
```

### 2. 创建 D1 数据库（首次）

```bash
# 创建远程数据库
npx wrangler d1 create temp-email-db

# 将输出的 database_id 填入 wrangler.toml
```

### 3. 配置 `wrangler.toml`

将上一步创建 D1 数据库返回的 `database_id` 填入 `wrangler.toml`：

```toml
name = "temp-email-worker"
main = "src/index.js"
compatibility_date = "2024-11-01"

[[d1_databases]]
binding = "DB"
database_name = "temp-email-db"
database_id = "your-d1-database-id"

[triggers]
crons = ["0 * * * *"] # 每小时执行一次，自动清理超过 48 小时的数据库记录
```

### 4. 配置运行时变量

以下变量不要写入 `wrangler.toml`，建议按环境分别管理：

- `ADMIN_TOKEN`：必填，后台登录令牌
- `API_TOKEN`：必填，API 鉴权令牌
- `FORWARD_TO`：可选，原始邮件转发目标地址

本地开发推荐使用 `.dev.vars`。可复制下面的示例到项目根目录的 `.dev.vars`：

```bash
ADMIN_TOKEN=dev-admin-token
API_TOKEN=dev-api-token
# 可选
FORWARD_TO=
```

生产环境推荐使用 Cloudflare Worker 的 **Secrets / Variables**：

> 在项目根目录执行下面的命令，也就是包含 `wrangler.toml` 的目录。Wrangler 会把 secret 写入当前项目对应的 Cloudflare Worker。
> 如果一键部署页面要求填写 `FORWARD_TO`，可以先留空；只有在需要自动转发原始邮件时才需要配置它。

```bash
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put API_TOKEN

# 可选：启用原始邮件自动转发时再设置
npx wrangler secret put FORWARD_TO
```

> 说明：`ADMIN_TOKEN`、`API_TOKEN` 建议始终使用 secret；`FORWARD_TO` 虽然不是严格敏感信息，但为了保持配置入口统一，也建议按同样方式管理。

### 5. 本地开发

```bash
npm run db:migrate:local
npm run dev
# 访问 http://localhost:8787
```

> 首次本地启动前请先执行一次本地 migration，确保 D1 表结构已经就绪。

### 6. 部署

```bash
npm run deploy
```

> `npm run deploy` 会先部署 Worker，再自动执行远程 D1 migrations。部署成功后，数据库表结构应当已经可用。

### 7. 配置邮件路由 (Email Routing)

- 在 Cloudflare 控制台左侧菜单，找到 **Email** -> **Email Routing**
- 进入 **Routes** 配置页
- 根据需要配置 **Catch-all address** 或具体的 **Custom addresses**（Destination 均选择 `Send to a Worker`，并选择刚才部署的 `temp-email-worker`）

> [!IMPORTANT]
> 当你在 Cloudflare 邮件路由中将动作设置为 **"Send to a Worker"** 时，Cloudflare **不再**会自动将该邮件投递/转发到你原本的个人收件箱。Worker 会完全接管这条邮件的处理权。
> 如果你希望 Worker 在提取数据的同时继续转发原邮件，请在下方“邮件转发配置”一节中设置 `FORWARD_TO`，并确保目标地址已经在 Cloudflare Email Routing 的 Destination addresses 中完成验证。

### 可选：手动执行 / 修复 D1 migrations

```bash
# 本地 D1 migration
npm run db:migrate:local

# 远程 D1 migration
npm run db:migrate:remote
```

> 说明：项目不再依赖首次访问时自动建表。只有在你需要单独修复数据库结构，或排查 migration 执行情况时，才需要手动执行上面的命令。

## 邮件转发配置

1. 在 Cloudflare **Email Routing** 的 **Destination addresses** 中添加并验证你的真实邮箱。
2. 在 Worker 运行时变量中设置 `FORWARD_TO`。

```bash
# 本地开发：写入 .dev.vars（推荐从 .dev.vars.example 复制）
FORWARD_TO="your-real@email.com"

# 线上环境：推荐使用 secret，执行后按提示输入邮箱值
npx wrangler secret put FORWARD_TO
```

3. 如果你更习惯在 Cloudflare 控制台操作，也可以在 Worker **Settings -> Variables** 中配置它。

> 提示：当 `FORWARD_TO` 为空时不会执行转发，仍会正常入库与规则解析。

## 管理控制台

- 管理控制台入口：`https://<your-worker-domain>/`
- 使用 `ADMIN_TOKEN` 登录后台。
- 管理端相关路由位于 `/admin/*`。

## API 访问

- API 路由位于 `/api/*`。
- 调用 API 时使用 `API_TOKEN` 进行 Bearer 鉴权。

### API 鉴权请求头

```
Authorization: Bearer <API_TOKEN>
```

### 查询最新命中结果

```
GET /api/emails/latest?address=<email_address>
```

**响应：**

```json
{
  "code": 200,
  "data": {
    "from_address": "noreply@example.com",
    "to_address": "user@yourdomain.com",
    "received_at": 1741881600000,
    "results": [
      { "rule_id": 1, "value": "123456", "remark": "验证码" }
    ]
  }
}
```

### API 进阶说明：字段定义

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | `number` | 业务状态码，200 表示成功 |
| `data.from_address` | `string` | 发件人电子邮箱地址 |
| `data.to_address` | `string` | 收件人电子邮箱地址 |
| `data.received_at` | `number` | 邮件接收时间戳（13位毫秒） |
| `data.results` | `array` | 命中规则提取的结果列表 |
| `..rule_id` | `number` | 匹配到的规则唯一 ID |
| `..value` | `string` | 正则匹配提取到的实际内容 |
| `..remark` | `string` | 规则的备注说明（可能为 null） |

## 规则说明

每条规则由三部分组成：

| 字段 | 说明 |
|------|------|
| `remark` | 备注名称，作为返回结果的标签（可选） |
| `sender_filter` | 发信人过滤，支持正则，多个用逗号或换行分隔，留空匹配所有 |
| `pattern` | 内容提取正则，对邮件正文匹配，取第一个完整匹配 |

## 白名单说明

- 白名单为空时接受所有邮件。
- 白名单规则支持正则表达式，匹配不通过的发件人将被直接忽略。

**示例**：提取来自 `example.com` 的6位验证码

| 字段 | 值 |
|------|----|
| remark | `验证码` |
| sender_filter | `.*@example\.com` |
| pattern | `\b\d{6}\b` |

## 本地测试

**发送测试邮件（触发 email handler）：**

```bash
curl -X POST "http://localhost:8787/cdn-cgi/handler/email?from=sender@example.com&to=demo@yourdomain.com" \
  --data-binary @./test/sample.eml
```

**查询最新命中结果：**

```bash
curl "http://localhost:8787/api/emails/latest?address=demo@yourdomain.com" \
  -H "Authorization: Bearer dev-api-token"
```

## 项目结构

```
├── migrations/
│   └── 0001_init.sql            # D1 初始表结构 migration
├── .dev.vars.example            # 本地开发变量示例
├── src/
│   ├── index.js                 # Worker 入口（协调各模块处理事件）
│   ├── core/
│   │   ├── auth.js              # 管理员与 API 鉴权校验
│   │   ├── db.js                # D1 数据存取操作
│   │   └── logic.js             # 邮件解析与正则匹配核心业务
│   ├── handlers/
│   │   └── handlers.js          # HTTP 路由处理函数集合
│   ├── ui/
│   │   └── templates.js         # UI HTML/CSS 模板
│   └── utils/
│       ├── constants.js         # 全局常量定义
│       └── utils.js             # 通用 JSON 响应与助手函数
├── test/
│   └── sample.eml               # 本地测试用示例邮件
├── images/                      # README 截图
├── wrangler.toml                # Wrangler 配置
└── package.json
```

## License

MIT
