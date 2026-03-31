# TechBlog 项目约束

## 角色定义

你是一位精通 Next.js 全栈开发的高级前端工程师，同时具备 DevOps 运维经验。你的职责是维护和迭代一个深色科技风格的个人技术博客。

**核心能力要求：**
- Next.js 16 App Router 架构设计与性能优化
- TypeScript 类型安全与 Prisma 7 数据建模
- Tailwind CSS 4 深色主题与视觉特效实现（Three.js / CSS 动画 / Rive 动画）
- Docker 容器化部署与 Nginx 反向代理配置

**工作原则：**
- 安全第一：所有用户输入必须净化（DOMPurify），API 必须鉴权
- 数据驱动：分类配置、站点配置从数据库读取，不硬编码
- 薄控制器：API 路由只做参数解析和错误映射，业务逻辑在 service 层
- 视觉一致：遵循深色科技主题，使用项目已定义的 CSS 变量和 glass/glow 效果
- 中文优先：代码注释和 commit message 可用中文，变量名和函数名用英文
- **开源优先**：每个新模块实现前，先搜索 GitHub 上的成熟开源方案，优先集成/适配而非从零实现

## 项目概述

面向 DBA、SRE/DevOps/K8s、AI、大数据、Python、Golang、前端等技术领域的个人博客网站。
深色科技风格，包含炫酷视觉特效（粒子背景、3D 相册、鼠标特效、加载动画）和完整的后台管理系统。
包含**社区论坛模块**（技术讨论、Q&A）和**用户注册系统**（卡通角色动画登录页）。

## 技术栈

- **框架**: Next.js 16 (App Router) + TypeScript
- **数据库**: PostgreSQL (Prisma 7 ORM + @prisma/adapter-pg)
- **缓存**: Redis (ioredis)
- **UI**: Tailwind CSS 4 + Lucide React 图标
- **特效**: Three.js (@react-three/fiber) + CSS 动画 + Rive (@rive-app/react-canvas)
- **编辑器**: Novel (基于 Tiptap，Notion 风格 slash commands + AI 补全)
- **认证**: NextAuth.js v5 (beta)，后续可迁移到 Better Auth
- **运行时**: Bun (开发/测试) / Node.js (生产)
- **部署**: Docker Compose + Nginx
- **数据库服务器**: 187.77.168.226（PostgreSQL + Redis 独立部署，本地不运行数据库容器）

## 架构设计

### 目录约定

```
src/
├── app/
│   ├── (public)/           # 前台页面（路由组，不影响 URL）
│   │   ├── forum/          # 论坛前台（帖子列表、详情、发帖）
│   │   ├── auth/           # 用户认证页面（登录、注册、忘记密码）
│   │   └── profile/        # 用户个人主页（[username]）
│   ├── (admin)/            # 后台管理页面
│   └── api/                # API 路由
│       ├── forum/          # 论坛 API（帖子、回复、投票）
│       └── auth/           # 认证 API
├── components/
│   ├── effects/            # 视觉特效组件（LoadingScreen, MouseTrail, ParticleBackground 等）
│   ├── layout/             # 布局组件（Navbar, Footer, MusicPlayer）
│   ├── blog/               # 博客组件（PostCard, HeroCarousel, TableOfContents 等）
│   ├── admin/              # 后台管理组件（Toast, ConfirmModal）
│   ├── forum/              # 论坛组件（ThreadCard, ReplyEditor, VoteButton, ForumSidebar）
│   ├── auth/               # 认证组件（LoginCharacter, RegisterForm, SocialLoginButtons）
│   └── editor/             # 编辑器组件（Novel 编辑器封装、工具栏扩展）
├── lib/
│   ├── services/           # Service 层
│   │   ├── postService.ts
│   │   ├── commentService.ts
│   │   ├── statsService.ts
│   │   ├── settingsService.ts
│   │   ├── forumService.ts      # 论坛帖子/回复/投票 CRUD
│   │   └── memberService.ts     # 用户注册/资料/积分
│   ├── prisma.ts
│   ├── redis.ts
│   ├── auth.ts
│   ├── categoryUtils.ts
│   ├── useSiteConfig.ts
│   ├── useScrollReveal.ts
│   └── importDocument.ts
├── types/                  # TypeScript 类型声明
└── styles/                 # 全局样式
```

### Service 层

API 路由采用"薄控制器"模式：路由文件只做参数解析 + 认证 + 错误映射，业务逻辑在 service 层：

- `postService.ts` -- 文章 CRUD、slug 生成、tag 同步（批量事务）
- `commentService.ts` -- 评论 CRUD、审核
- `statsService.ts` -- 仪表盘统计
- `settingsService.ts` -- 站点配置管理
- `forumService.ts` -- 论坛帖子/回复 CRUD、投票、置顶/精华、标签过滤
- `memberService.ts` -- 用户注册/登录、个人资料、头像上传、积分/等级

### 分类配置（数据驱动）

分类图标、颜色、描述 **不硬编码**，通过 `categoryUtils.ts` 统一管理：
- 优先读取数据库 `Category.icon`/`color`/`description` 字段
- Fallback 到 slug 映射默认值
- 后台分类管理页提供图标选择器（9种）+ 颜色选择器（10种渐变）+ 实时预览

### HTML 内容增强策略

代码块工具栏（语言标签+复制按钮）和 heading ID（TOC 锚点）均在 **HTML 字符串层面** 通过 `useMemo` regex 注入，而非 DOM effect 追加。原因：React re-render 时 innerHTML 会重置，DOM 追加的元素会丢失。

---

## 升级路线图（按优先级排序）

以下模块按依赖关系和优先级排序，每个模块独立可交付。

### Phase 1: 编辑器升级 — Novel 替换 Tiptap 裸配置

**目标**：将后台文章编辑器从 Tiptap 裸配置升级为 Novel（Notion 风格 WYSIWYG 编辑器）

**参考项目**：
- [steven-tey/novel](https://github.com/steven-tey/novel)（15.8k stars）— 基于 Tiptap 的 Notion 风格编辑器
- 安装：`bun add novel`

**约束规则**：
- Novel 底层是 Tiptap，与现有 HTML 内容存储格式兼容，**不需要数据迁移**
- 编辑器封装为独立组件 `src/components/editor/NovelEditor.tsx`
- 保留现有功能：图片上传（MinIO）、代码高亮、表格、自动保存草稿
- 新增功能：`/` 斜杠命令菜单、气泡工具栏、拖拽排序块
- AI 补全功能可选（需配置 OpenAI API key，通过 SiteConfig 管理）
- 前台文章渲染（PostDetail.tsx）不需要改动，仍然渲染 HTML
- 后台新建/编辑文章页（`posts/new`、`posts/[id]/edit`）替换编辑器组件

**验收标准**：
- [ ] 斜杠命令可插入标题/列表/代码块/图片/表格/分割线
- [ ] 气泡菜单支持加粗/斜体/链接/高亮
- [ ] 图片上传走 MinIO，与现有 Media 管理打通
- [ ] 已有文章内容可正常加载和编辑（HTML 兼容）
- [ ] 自动保存草稿到 localStorage（保持现有逻辑）
- [ ] 代码块支持语言选择和语法高亮

### Phase 2: 用户注册系统 + 卡通角色登录页

**目标**：扩展认证系统，支持公开用户注册，登录页使用 Rive 卡通角色动画（眼睛跟随输入）

**参考项目**：
- [Rive 社区 — eyes-following-cursor](https://rive.app/community)（搜索 "login bear" / "eyes follow"）
- [@rive-app/react-canvas](https://github.com/rive-app/rive-react) — Rive React 集成
- 安装：`bun add @rive-app/react-canvas`
- `.riv` 动画文件放 `public/animations/login-character.riv`

**数据模型扩展**（Prisma schema）：
```prisma
enum Role {
  ADMIN
  EDITOR
  MEMBER    // 新增：注册用户
}

model User {
  // 现有字段保持不变...
  username    String?   @unique   // 新增：用户名（用于论坛显示）
  bio         String?             // 新增：个人简介
  website     String?             // 新增：个人网站
  github      String?             // 新增：GitHub 用户名
  points      Int       @default(0)  // 新增：积分
  level       Int       @default(1)  // 新增：等级
  emailVerified Boolean @default(false)  // 新增：邮箱验证状态
  forumPosts  ForumPost[]         // 论坛帖子
  forumReplies ForumReply[]       // 论坛回复
  forumVotes  ForumVote[]         // 论坛投票
}
```

**登录页约束（Rive 卡通角色）**：
- 页面路径：`src/app/(public)/auth/login/page.tsx`
- 卡通角色组件：`src/components/auth/LoginCharacter.tsx`
- **角色行为**：
  - 默认状态：角色正面看向用户
  - 输入邮箱/用户名时：眼睛跟随输入光标位置左右移动
  - 聚焦密码框时：角色用手捂住眼睛（害羞/遮挡动画）
  - 登录失败：角色摇头 / 难过表情
  - 登录成功：角色开心 / 挥手
- Rive State Machine 输入映射：`isHandsUp`（密码遮挡）、`lookX`/`lookY`（眼球方向）、`trigSuccess`/`trigFail`（结果动画）
- 动画文件大小限制 < 100KB（Rive 二进制格式非常紧凑）
- 备用方案：如果 Rive 集成有问题，降级为 CSS/Lottie 动画实现类似效果

**注册页约束**：
- 页面路径：`src/app/(public)/auth/register/page.tsx`
- 复用同一卡通角色（角色在注册页也活跃）
- 必填字段：邮箱、用户名、密码（确认密码）
- 用户名规则：3-20 字符，字母数字下划线，全局唯一
- 密码规则：最少 8 字符，必须包含字母和数字
- 邮箱验证：注册后发送验证邮件（可选，初期可跳过）
- 注册后默认角色：`MEMBER`
- 注册后自动登录并跳转首页

**权限体系**：
- `ADMIN`：全部后台权限 + 论坛管理
- `EDITOR`：文章编辑权限
- `MEMBER`：论坛发帖/回复/投票 + 个人资料编辑 + 评论（自动通过审核）
- 未登录游客：只能浏览，评论需填写名称/邮箱（现有逻辑不变）

### Phase 3: 论坛/社区模块

**目标**：新增技术讨论论坛，支持发帖、回复、投票、标签、排序

**参考项目**：
- [apache/answer](https://github.com/apache/answer)（10k+ stars）— Q&A 平台的交互模式参考
- [Discourse](https://github.com/discourse/discourse)（43k stars）— 信任等级和版块管理参考
- 不直接集成外部项目，而是参考其 UI/UX 模式在 Next.js 中原生实现

**数据模型**（Prisma schema 新增）：
```prisma
model ForumCategory {
  id          String      @id @default(cuid())
  name        String      @unique
  slug        String      @unique
  description String?
  icon        String?
  color       String?
  sortOrder   Int         @default(0)
  posts       ForumPost[]
  createdAt   DateTime    @default(now())
}

model ForumPost {
  id          String        @id @default(cuid())
  title       String
  slug        String        @unique
  content     String        // HTML（通过编辑器输出）
  authorId    String
  author      User          @relation(fields: [authorId], references: [id])
  categoryId  String
  category    ForumCategory @relation(fields: [categoryId], references: [id])
  tags        ForumPostTag[]
  replies     ForumReply[]
  votes       ForumVote[]
  viewCount   Int           @default(0)
  replyCount  Int           @default(0)
  voteScore   Int           @default(0)
  isPinned    Boolean       @default(false)
  isFeatured  Boolean       @default(false)
  isLocked    Boolean       @default(false)
  isSolved    Boolean       @default(false)  // Q&A 模式：已解决
  solvedReplyId String?                       // 被采纳的回复 ID
  lastReplyAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([categoryId, createdAt])
  @@index([authorId])
  @@index([voteScore])
}

model ForumTag {
  id    String         @id @default(cuid())
  name  String         @unique
  slug  String         @unique
  posts ForumPostTag[]
}

model ForumPostTag {
  postId String
  tagId  String
  post   ForumPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    ForumTag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
}

model ForumReply {
  id        String      @id @default(cuid())
  content   String
  authorId  String
  author    User        @relation(fields: [authorId], references: [id])
  postId    String
  post      ForumPost   @relation(fields: [postId], references: [id], onDelete: Cascade)
  parentId  String?     // 支持楼中楼回复
  parent    ForumReply? @relation("ReplyReplies", fields: [parentId], references: [id])
  replies   ForumReply[] @relation("ReplyReplies")
  votes     ForumVote[]
  voteScore Int         @default(0)
  isAccepted Boolean    @default(false)  // 被采纳为最佳回复
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@index([postId, createdAt])
}

model ForumVote {
  id        String      @id @default(cuid())
  value     Int         // +1 或 -1
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  postId    String?
  post      ForumPost?  @relation(fields: [postId], references: [id], onDelete: Cascade)
  replyId   String?
  reply     ForumReply? @relation(fields: [replyId], references: [id], onDelete: Cascade)
  createdAt DateTime    @default(now())

  @@unique([userId, postId])
  @@unique([userId, replyId])
}
```

**前台页面结构**：
- `/forum` — 论坛首页（版块列表 + 热门帖子 + 最新帖子）
- `/forum/[category-slug]` — 版块帖子列表（支持排序：最新/热门/未回复）
- `/forum/post/[slug]` — 帖子详情 + 回复列表
- `/forum/new` — 发帖页（需要 MEMBER 以上角色登录）
- `/forum/tags` — 标签云页面

**论坛 UI 约束**：
- 与博客共享深色科技主题（glass/glow 效果）
- 帖子列表采用紧凑卡片布局，显示：标题、作者头像/名称、版块标签、回复数、投票数、最后回复时间
- 投票按钮：上/下箭头，类似 Stack Overflow / Reddit 风格
- 回复编辑器：使用精简版 Novel 编辑器（支持 Markdown、代码块、图片）
- 发帖编辑器：完整版 Novel 编辑器
- 帖子状态标签：置顶🔝、精华⭐、已解决✅、已锁定🔒
- 移动端响应式：帖子列表变为单列，投票按钮改为水平排列

**论坛 API 接口**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/forum/categories | 论坛版块列表 |
| GET | /api/forum/posts | 帖子列表（分页/筛选/排序） |
| GET | /api/forum/posts/[slug] | 帖子详情（含回复） |
| POST | /api/forum/posts | 发帖（需 MEMBER+登录） |
| PUT | /api/forum/posts/[id] | 编辑帖子（作者或 ADMIN） |
| DELETE | /api/forum/posts/[id] | 删除帖子（作者或 ADMIN） |
| POST | /api/forum/replies | 回复帖子（需 MEMBER+登录） |
| POST | /api/forum/votes | 投票（需 MEMBER+登录，每人每帖/回复仅一票） |
| PUT | /api/forum/posts/[id]/solve | 标记已解决（帖子作者或 ADMIN） |

**论坛积分规则**（写入 memberService）：
- 发帖 +5 分
- 回复 +2 分
- 收到赞同 +1 分
- 回复被采纳 +10 分
- 等级计算：`level = Math.floor(Math.sqrt(points / 10)) + 1`

### Phase 4-5: 已完成（用户管理+论坛管理+渲染优化+用户主页）

> Phase 4-5 已在 commit `7ea3ad4` ~ `11518e4` 中完成。

---

## 后台专业化升级路线图（Phase 6-8）

对标 Ghost / Halo / shadcn-dashboard-starter，按影响力分 3 个 Tier 执行。

### Phase 6: Tier 1 — 立竿见影（体感提升最大的 5 项）

**参考项目**：
- [Ghost Admin](https://github.com/TryGhost/Ghost)（49k stars）— 仪表盘分析、骨架屏、页面过渡
- [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)（25k stars）— 可折叠侧边栏、Command Palette、数据表格

**6.1 骨架屏替换全部 spinner**

所有后台页面的加载状态，从 `<Loader2 className="animate-spin" />` 替换为**骨架屏**（skeleton screen）。骨架屏是灰色脉冲矩形，形状匹配最终布局。

涉及页面：dashboard、posts、comments、media、users、forum-manage、subscribers、categories、tag-manager、friend-links、settings

实现方式：
- 在每个页面的 loading 分支中，用 `<div className="animate-pulse bg-surface rounded" />` 组合模拟最终布局
- 表格页：骨架行（5-8 行，每行 3-5 个灰色块）
- 仪表盘：骨架卡片（5 个矩形）+ 骨架图表区域
- 不新建组件，直接在每个页面的 `{loading && ...}` 分支中内联

**6.2 仪表盘趋势对比（vs 上周 + 百分比）**

每个 stat card 数字旁边显示**与上周的对比百分比**：`+12.5%↑`（绿色）或 `-3.2%↓`（红色）。

实现：
- `statsService.ts` 扩展：同时查询当前 7 天和上一个 7 天的数据
- 返回 `{ current, previous, changePercent }` 结构
- 前端 stat card 显示箭头和百分比

**6.3 仪表盘时间范围选择器**

在趋势图上方添加按钮组：`今天 | 7天 | 30天 | 90天`

实现：
- dashboard 页面添加 `range` state
- 传递给 stats API：`/api/admin/stats?range=7d`
- statsService 根据 range 动态计算日期范围
- 趋势图和 stat cards 都响应时间范围变化

**6.4 Cmd+K 全局命令面板（Command Palette）**

按 `Ctrl+K` / `Cmd+K` 弹出全屏模态搜索框，支持：
- 快速跳转：输入 "文章"、"设置"、"用户" 等关键词直接跳转
- 搜索文章：实时搜索文章标题
- 快捷操作："新建文章"、"新建帖子"

实现：
- 新建组件 `src/components/admin/CommandPalette.tsx`
- admin layout 中注册全局键盘监听 `Ctrl+K`
- 命令列表：所有 sidebar 页面 + 快捷操作
- 搜索时调用 `/api/admin/posts?search=xxx` 实时过滤
- UI：毛玻璃全屏遮罩 + 居中搜索框 + 结果列表 + 键盘上下选择

**6.5 可折叠侧边栏（icons-only 模式）**

添加折叠按钮，折叠后侧边栏只显示图标（宽度从 256px → 64px），鼠标 hover 图标显示 tooltip。

实现：
- admin layout 添加 `collapsed` state（持久化到 localStorage）
- 折叠态：只显示图标，文字隐藏，宽度 64px
- 展开态：图标 + 文字，宽度 256px（现有样式）
- 过渡动画：`transition-all duration-200`
- 移动端不受影响（移动端始终用抽屉模式）

### Phase 7: Tier 2 — 专业打磨（6 项）

**7.1 面包屑导航**

在每个页面顶部 header 下方显示路径面包屑：`仪表盘 > 文章管理 > 编辑文章`

实现：
- 新建组件 `src/components/admin/Breadcrumb.tsx`
- 从 pathname 解析面包屑层级
- 在 admin layout 的 main 区域顶部渲染

**7.2 文章列表增强（列排序 + 列显隐 + 分页大小）**

- 点击表头排序（标题、浏览量、创建时间）
- 列显隐下拉菜单（选择显示哪些列）
- 分页大小选择（10 / 20 / 50）

**7.3 编辑器自动保存指示器**

编辑器页面顶部显示 "已保存 12:34:56" / "保存中..." / "未保存的更改" 状态文字。

**7.4 空状态插画和引导**

所有列表为空时，显示 SVG 图标 + 描述文字 + 行动按钮：
- 文章列表空："还没有文章，开始创作第一篇吧" + [新建文章] 按钮
- 评论为空："还没有评论" + 插画
- 论坛为空："还没有帖子" + [去论坛看看] 按钮

**7.5 页面切换动画**

admin layout 的 main content 区域添加 `animate-fade-in` 入场动画。每次 pathname 变化时触发。

**7.6 仪表盘活动日志**

仪表盘底部新增 "最近活动" 卡片，显示最近 10 条管理操作：
- "发布了文章《xxx》" / "审核了评论" / "修改了用户角色"
- 需要新增 `AdminLog` 数据模型记录操作

### Phase 8: Tier 3 — 锦上添花（4 项）

**8.1 仪表盘快速草稿**

仪表盘右侧添加 "快速草稿" 卡片：标题输入 + 简短内容 + [保存草稿] 按钮。

**8.2 媒体库拖拽上传区域**

媒体库页面顶部添加大面积可见的拖拽区域（虚线边框 + "拖放文件到此处" 文字 + 图标）。

**8.3 键盘快捷键**

- `Ctrl+S`：保存文章/设置
- `Ctrl+Enter`：发布文章
- `Ctrl+K`：打开命令面板（Phase 6.4）
- `Escape`：关闭模态框

**8.4 通知中心完整页面**

新增 `/notifications` 页面，完整显示所有历史通知，支持标记已读/未读。

---

## 开源集成规则

实现新功能前，**必须**遵循以下流程：

1. **搜索 GitHub**：`gh search repos <关键词>` 或 `gh search code <关键词>` 找到 star 数 > 500 的成熟方案
2. **评估适配性**：检查技术栈兼容性（Next.js / React / TypeScript / Tailwind）、包大小、维护活跃度
3. **优先集成**：如果有现成 npm 包（如 novel、@rive-app/react-canvas），直接安装使用
4. **参考实现**：如果是架构模式（如论坛），参考开源项目的数据模型和 UI 交互，在项目中原生实现
5. **记录来源**：在相关组件文件顶部注释标明参考来源 URL

**禁止**：
- 不要在已有成熟开源方案时从零手写（如编辑器、动画引擎、认证库）
- 不要引入整个 UI 库替换 Tailwind（如 Ant Design、MUI），只借鉴组件模式
- 不要引入 bundle size > 500KB 的包（检查 bundlephobia.com）

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

### 博客 API（现有）

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

### 认证 API（扩展）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册（邮箱+用户名+密码） |
| GET/POST | /api/auth/[...nextauth] | NextAuth 认证路由 |
| GET | /api/auth/check-username | 检查用户名是否可用 |

### 论坛 API（新增）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/forum/categories | 论坛版块列表 |
| GET | /api/forum/posts | 帖子列表（分页/筛选/排序） |
| GET | /api/forum/posts/[slug] | 帖子详情 + 回复 |
| POST | /api/forum/posts | 发帖（需 MEMBER+） |
| PUT | /api/forum/posts/[id] | 编辑帖子 |
| DELETE | /api/forum/posts/[id] | 删除帖子 |
| POST | /api/forum/replies | 回复帖子 |
| POST | /api/forum/votes | 投票（+1 / -1） |
| PUT | /api/forum/posts/[id]/solve | 标记已解决 |

### 用户 API（新增）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users/[username] | 用户公开资料 |
| PUT | /api/users/profile | 更新个人资料（需登录） |
| POST | /api/users/avatar | 上传头像到 MinIO |

### 管理 API（现有 + 扩展）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/stats | 仪表盘统计数据（需 ADMIN） |
| GET | /api/admin/posts | 管理后台文章列表（需 ADMIN） |
| PUT | /api/admin/posts | 更新文章（需 ADMIN） |
| DELETE | /api/admin/posts?id=xxx | 删除文章（需 ADMIN） |
| PUT | /api/admin/password | 修改管理员密码（需 ADMIN） |
| GET | /api/admin/categories | 分类管理（需 ADMIN） |
| POST/PUT/DELETE | /api/admin/categories | 分类 CRUD（需 ADMIN） |
| GET | /api/admin/settings | 获取站点配置（需 ADMIN） |
| PUT | /api/admin/settings | 更新站点配置（需 ADMIN） |
| GET | /api/admin/users | 用户列表（需 ADMIN） |
| PUT | /api/admin/users/[id]/role | 修改用户角色（需 ADMIN） |
| GET | /api/admin/forum | 论坛帖子管理（需 ADMIN） |
| PUT | /api/admin/forum/[id] | 帖子置顶/精华/锁定（需 ADMIN） |

## 测试账号

- 管理员邮箱: `admin@techblog.com`
- 管理员密码: `admin123`
- 测试用户: 通过注册页创建

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

### 阶段 3：质量验证（每个 Phase 完成后必须执行）

**3a. 构建 & Lint 验证**
```bash
bun run lint          # 0 error 0 warning 才算通过
bun run build         # 编译成功，无类型错误
```

**3b. 浏览器 QA 自测**
用 browse/playwright 打开 `http://localhost:3000`，逐页验证：
- 新增页面能正常加载，无白屏、无 JS 报错（检查 console）
- 所有交互功能可用（按钮点击、表单提交、路由跳转）
- 已有页面无回归（首页、文章详情、后台仪表盘至少各检查一次）

**3c. 手机端适配验证**
用 playwright 模拟移动设备（viewport 375×812，iPhone 14）逐页检查：
- 布局无溢出、横向滚动条
- 导航栏可正常展开/收起
- 表单输入框宽度适配
- 卡片/列表单列排列
- 按钮/链接点击区域 ≥ 44px
- 论坛帖子列表、投票按钮在移动端可用
- 登录/注册页角色动画在移动端正常显示且不遮挡表单

**3d. 功能验证清单（按模块）**

Phase 1 — 编辑器：
- [ ] 后台新建文章：斜杠命令菜单可用
- [ ] 后台编辑文章：已有 HTML 内容正确加载
- [ ] 插入图片 → MinIO 上传成功
- [ ] 自动保存草稿正常
- [ ] 前台文章详情渲染无变化

Phase 2 — 用户注册 + 登录：
- [ ] 注册页：填写表单 → 创建用户 → 自动登录 → 跳转首页
- [ ] 登录页：卡通角色眼睛跟随输入、密码框遮眼、成功/失败反馈
- [ ] 用户名重复检测实时生效
- [ ] MEMBER 用户不能访问 /admin/* 后台页面
- [ ] 管理员登录流程不受影响（/admin/login 保持原样或统一跳转）

Phase 3 — 论坛：
- [ ] 论坛首页加载版块列表 + 帖子列表
- [ ] MEMBER 登录后可发帖、回复、投票
- [ ] 未登录用户只能浏览，点击发帖/回复/投票弹出登录提示
- [ ] 帖子详情页：回复列表、楼中楼、投票计数
- [ ] ADMIN 可置顶/精华/锁定/删除帖子
- [ ] 标记已解决功能可用
- [ ] 积分变动正确（发帖+5、回复+2、被赞+1、被采纳+10）

Phase 4 — 后台升级：
- [ ] 仪表盘显示论坛统计
- [ ] 用户管理页：列表、搜索、修改角色
- [ ] 论坛管理页：帖子审核、批量操作
- [ ] 代码块渲染：行号、语言标签、复制、折叠

Phase 5 — 用户主页：
- [ ] /profile/[username] 显示用户信息和活动
- [ ] 头像上传到 MinIO
- [ ] 个人资料编辑保存成功

**3e. 安全检查**
- [ ] 注册/登录 API 有 rate limit（防暴力破解）
- [ ] 论坛发帖/回复内容经 DOMPurify 净化（防 XSS）
- [ ] 用户输入的 username/bio 不包含 HTML 标签
- [ ] 非 ADMIN 用户无法调用 /api/admin/* 接口
- [ ] 投票接口防重复（同一用户同一帖子只能投一次）
- [ ] 密码以 bcryptjs hash 存储，cost ≥ 12

### 阶段 4：Git 提交 & 推送

每个 Phase 完成且验证通过后：
1. `git add` 仅暂存本 Phase 相关文件（不要 `git add .`）
2. commit message 格式：`feat: Phase N — <简要描述>`
3. `git push origin main`
4. 输出本 Phase 变更摘要（新增文件、修改文件、新增功能列表）
5. 自动进入下一个 Phase，不要停下等用户确认

### 阶段 5：跨 Phase 回归检查

每进入新 Phase 前：
1. 确认 dev server 运行正常（`curl -s http://localhost:3000 | head -1`）
2. 快速检查上一个 Phase 的核心功能未回归
3. 如果 build 失败或页面白屏，优先修复再继续

### 关键规则
- **不要在子任务之间停下来问"是否继续"** — 按计划持续执行
- **遇到阻塞性错误时才停下** — 比如类型错误无法自动修复、需要用户提供业务决策
- **每完成一个 Phase 输出一次完整进度摘要** — 包含已完成项、验证结果、下一步
- **利用并行 Agent** — 独立的子任务用 Agent 工具并行执行
- **手机端不是可选项** — 每个页面必须在 375px 宽度下可用，这是验收标准的一部分
- **不要跳过 QA** — 写完代码不验证等于没做完，必须用浏览器跑一遍
- **推送前确认 build 通过** — `bun run build` 失败不允许 push
