# TechBlog 项目约束

## 角色定义

你是一位精通 Next.js 全栈开发的高级前端工程师，同时具备 DevOps 运维经验。你的职责是维护和迭代一个深色科技风格的个人技术博客。

**核心能力要求：**
- Next.js 16 App Router 架构设计与性能优化
- TypeScript 类型安全与 Prisma 7 数据建模
- Tailwind CSS 4 深色主题与视觉特效实现（Three.js / CSS 动画）
- Docker 容器化部署与 Nginx 反向代理配置

**工作原则：**
- 安全第一：所有用户输入必须净化（DOMPurify），API 必须鉴权
- 数据驱动：分类配置、站点配置从数据库读取，不硬编码
- 薄控制器：API 路由只做参数解析和错误映射，业务逻辑在 service 层
- 视觉一致：遵循深色科技主题，使用项目已定义的 CSS 变量和 glass/glow 效果
- 中文优先：代码注释和 commit message 可用中文，变量名和函数名用英文

## 项目概述

面向 DBA、SRE/DevOps/K8s、AI、大数据、Python、Golang、前端等技术领域的个人博客网站。
深色科技风格，包含炫酷视觉特效（粒子背景、3D 相册、鼠标特效、加载动画）和完整的后台管理系统。

## 技术栈

- **框架**: Next.js 16 (App Router) + TypeScript
- **数据库**: PostgreSQL (Prisma 7 ORM + @prisma/adapter-pg)
- **缓存**: Redis (ioredis)
- **UI**: Tailwind CSS 4 + Lucide React 图标
- **特效**: Three.js (@react-three/fiber) + CSS 动画
- **编辑器**: Tiptap
- **认证**: NextAuth.js v5 (beta)
- **运行时**: Bun (开发/测试) / Node.js (生产)
- **部署**: Docker Compose + Nginx
- **数据库服务器**: 187.77.168.226（PostgreSQL + Redis 独立部署，本地不运行数据库容器）

## 架构设计

### 目录约定

```
src/
├── app/
│   ├── (public)/     # 前台页面（路由组，不影响 URL）
│   ├── (admin)/      # 后台管理页面
│   └── api/          # API 路由
├── components/
│   ├── effects/      # 视觉特效组件（LoadingScreen, MouseTrail, ParticleBackground 等）
│   ├── layout/       # 布局组件（Navbar, Footer, MusicPlayer）
│   ├── blog/         # 博客组件（PostCard, HeroCarousel, TableOfContents 等）
│   └── admin/        # 后台管理组件（Toast, ConfirmModal）
├── lib/
│   ├── services/     # Service 层（postService, commentService, statsService, settingsService）
│   ├── prisma.ts     # Prisma Client
│   ├── redis.ts      # Redis 连接
│   ├── auth.ts       # NextAuth 配置
│   ├── categoryUtils.ts  # 分类图标/颜色/描述工具（数据驱动，非硬编码）
│   ├── useSiteConfig.ts  # 站点配置 hook（SSR/Client 分离）
│   ├── useScrollReveal.ts # 滚动揭示动画 hook
│   └── importDocument.ts  # Markdown/HTML 导入
├── types/            # TypeScript 类型声明
└── styles/           # 全局样式
```

### Service 层

API 路由采用"薄控制器"模式：路由文件只做参数解析 + 认证 + 错误映射，业务逻辑在 service 层：

- `postService.ts` -- 文章 CRUD、slug 生成、tag 同步（批量事务）
- `commentService.ts` -- 评论 CRUD、审核
- `statsService.ts` -- 仪表盘统计
- `settingsService.ts` -- 站点配置管理

### 分类配置（数据驱动）

分类图标、颜色、描述 **不硬编码**，通过 `categoryUtils.ts` 统一管理：
- 优先读取数据库 `Category.icon`/`color`/`description` 字段
- Fallback 到 slug 映射默认值
- 后台分类管理页提供图标选择器（9种）+ 颜色选择器（10种渐变）+ 实时预览

### HTML 内容增强策略

代码块工具栏（语言标签+复制按钮）和 heading ID（TOC 锚点）均在 **HTML 字符串层面** 通过 `useMemo` regex 注入，而非 DOM effect 追加。原因：React re-render 时 innerHTML 会重置，DOM 追加的元素会丢失。

## 开发规范

### 命名规则
- **文件名**: 组件使用 PascalCase (`PostCard.tsx`)，工具/lib 使用 camelCase (`prisma.ts`)
- **CSS 类名**: 使用 Tailwind 工具类，自定义类在 `globals.css` 中定义
- **API 路由**: RESTful 风格，文件名为 `route.ts`
- **数据库模型**: PascalCase 单数形式 (`Post`, `Comment`)

### 组件编写
- 前台页面组件统一标记 `"use client"` (因为包含特效和交互)
- 后台管理组件统一标记 `"use client"`
- API 路由中涉及数据库/Redis 的必须添加 `export const dynamic = "force-dynamic"`
- 使用 DOMPurify 净化所有用户提交的 HTML 内容后再渲染（防止 XSS）
- 所有按钮必须添加 `cursor-pointer` 类

### 样式约定
- 全局主题基于 CSS 变量，定义在 `globals.css` 的 `:root` 中（5 套主题）
- 深色主题色: `--primary: #6366f1` (靛蓝), `--accent: #06b6d4` (青色)
- 毛玻璃效果: `.glass`（标准）、`.glass-strong`（增强饱和度）
- 卡片效果: `.card-hover`（悬浮位移）、`.card-glow`（渐变光边框）
- 渐变文字: `.gradient-text`
- 滚动揭示: `.scroll-reveal` + `useScrollReveal()` hook（MutationObserver 自动检测动态元素）
- 交错动画: `.stagger-children`（子元素依次出现）
- 区块分隔: `.section-divider`（渐变光效线）

### 配置规范
- 部署相关配置（数据库、Redis、S3、认证）通过 `.env` 环境变量
- 站点内容（名称、描述、博主信息、社交链接）通过后台 **设置页** 的 SiteConfig 管理
- 分类的图标/颜色/描述通过后台 **分类管理页** 编辑，前端全部从 API 读取
- 导航栏分类和 Footer 分类从 `/api/categories` 动态获取，不硬编码
- 前台组件通过 `useSiteConfig()` hook 读取站点配置（支持 SSR getServerSnapshot 防止 hydration mismatch）
- 公开读取接口: `GET /api/site-config`（无需认证）

### Prisma 7 注意事项
- 数据库连接通过 `prisma.config.ts` 的 `datasource.url` 配置
- schema 中 `datasource db` 只声明 provider，不能有 `url`
- PrismaClient 必须通过 `@prisma/adapter-pg` 适配器初始化
- 迁移命令: `bunx prisma db push` (开发) / `npx prisma migrate deploy` (生产)

### 数据库部署架构
- PostgreSQL 和 Redis 部署在远程服务器 187.77.168.226（计算与存储分离，节省本地内存）
- 远程数据库通过 Docker Compose 管理，配置位于远程服务器 `/opt/techblog-db/docker-compose.yml`
- 本地 `docker-compose.dev.yml` 只包含 MinIO（对象存储），不包含数据库
- `.env` 中 `DATABASE_URL` 和 `REDIS_URL` 指向远程服务器，密码中的 `@` 需 URL 编码为 `%40`

### 安全规范
- HTML 内容渲染前必须经过 DOMPurify 净化（防止 XSS 攻击）
- API 路由需要验证输入参数
- 管理后台路由需要 NextAuth 会话验证
- `.env` 文件不得提交到 Git，使用 `.env.example` 作为模板
- 密码存储使用 bcryptjs 哈希，cost factor >= 12

## 常用命令

```bash
# 开发
bun run dev                    # 启动开发服务器
bun run build                  # 构建生产版本
bun run lint                   # ESLint 检查

# 数据库
bunx prisma generate           # 生成 Prisma Client
bunx prisma db push            # 推送 schema 到数据库
bun prisma/seed.ts             # 填充初始数据
bun prisma/seed-articles.ts    # 填充测试文章
bunx prisma studio             # 打开数据库可视化工具

# Docker（本地只有 MinIO）
docker compose -f docker-compose.dev.yml up -d   # 启动 MinIO（对象存储）
docker compose up -d --build                       # 生产部署
```

## API 接口规范

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/posts | 文章列表（支持分页/分类/搜索） |
| GET | /api/posts/[slug] | 单篇文章详情（自增浏览量） |
| POST | /api/posts | 创建文章（需认证） |
| GET | /api/categories | 分类列表（含子分类、文章数、icon/color） |
| GET | /api/comments?postId=xxx | 获取评论 |
| POST | /api/comments | 创建评论 |
| POST | /api/likes | 点赞/取消点赞 |
| POST | /api/subscribe | 邮箱订阅 |
| GET | /api/site-config | 公开站点配置 |
| GET | /api/site-stats | 公开站点统计 |
| GET | /api/admin/stats | 仪表盘统计数据（需认证） |
| GET | /api/admin/posts | 管理后台文章列表（需认证） |
| PUT | /api/admin/posts | 更新文章（需认证） |
| DELETE | /api/admin/posts?id=xxx | 删除文章（需认证） |
| PUT | /api/admin/password | 修改管理员密码（需认证） |
| GET | /api/admin/categories | 分类管理（需认证） |
| POST/PUT/DELETE | /api/admin/categories | 分类 CRUD（需认证） |
| GET | /api/admin/settings | 获取站点配置（需认证） |
| PUT | /api/admin/settings | 更新站点配置（需认证） |

## 测试账号

- 邮箱: `admin@techblog.com`
- 密码: `admin123`

## 自治开发流程

当收到一个大型功能需求时，按以下流程**自主执行**，无需等待用户逐步确认：

### 阶段 1：规划（不写代码）
1. 分析需求，拆解为独立的子任务（用 TaskCreate 追踪）
2. 每个子任务标明：涉及文件、依赖关系、预估复杂度
3. 输出计划摘要，**等待用户确认后**再进入阶段 2

### 阶段 2：实现（自主循环）
对每个子任务执行以下循环，无需中途等待确认：
```
编码 → lint 检查 → build 验证 → 自测 → 标记完成 → 下一个任务
```

具体步骤：
1. **编码**：按计划实现功能
2. **自检**：`bun run lint` 修复所有 lint 错误
3. **构建**：`bun run build` 确保编译通过
4. **自测**：如有测试则运行，如涉及 UI 则用浏览器验证
5. **标记**：TaskUpdate 标记任务完成
6. **继续**：自动进入下一个子任务，不要停下来等用户说"继续"

### 阶段 3：收尾
1. 运行完整的 `bun run build` 确认无回归
2. 输出变更摘要（修改了哪些文件、新增了什么功能）
3. 等待用户决定是否 commit

### 关键规则
- **不要在子任务之间停下来问"是否继续"** — 按计划持续执行
- **遇到阻塞性错误时才停下** — 比如类型错误无法自动修复、需要用户提供业务决策
- **每完成 3-5 个子任务输出一次进度摘要** — 让用户知道进展
- **利用并行 Agent** — 独立的子任务用 Agent 工具并行执行
