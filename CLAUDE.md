# TechBlog 项目约束

## 项目概述

面向 DBA、SRE/DevOps/K8s、AI、大数据、Python、Golang、前端等技术领域的个人博客网站。
深色科技风格，包含炫酷视觉特效（粒子背景、3D 相册、鼠标特效、加载动画）和完整的后台管理系统。

## 技术栈

- **框架**: Next.js 16 (App Router) + TypeScript
- **数据库**: PostgreSQL (Prisma 7 ORM + @prisma/adapter-pg)
- **缓存**: Redis (ioredis)
- **UI**: Tailwind CSS 4 + Lucide React 图标
- **特效**: Three.js (@react-three/fiber) + GSAP + Framer Motion
- **编辑器**: Tiptap
- **认证**: NextAuth.js v5 (beta)
- **运行时**: Bun (开发/测试) / Node.js (生产)
- **部署**: Docker Compose + Nginx

## 目录约定

```
src/
├── app/
│   ├── (public)/     # 前台页面（路由组，不影响 URL）
│   ├── (admin)/      # 后台管理页面
│   └── api/          # API 路由
├── components/
│   ├── effects/      # 视觉特效组件（LoadingScreen, MouseTrail, ParticleBackground 等）
│   ├── layout/       # 布局组件（Navbar, Footer, MusicPlayer）
│   ├── blog/         # 博客相关组件（PostCard, HeroCarousel 等）
│   └── admin/        # 后台管理组件
├── lib/              # 工具库（prisma, redis, auth, wechat）
├── types/            # TypeScript 类型声明
└── styles/           # 全局样式
```

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
- 全局主题基于 CSS 变量，定义在 `globals.css` 的 `:root` 中
- 深色主题色: `--primary: #6366f1` (靛蓝), `--accent: #06b6d4` (青色)
- 毛玻璃效果统一使用 `.glass` 类
- 卡片悬浮效果使用 `.card-hover` 类
- 渐变文字使用 `.gradient-text` 类

### Prisma 7 注意事项
- 数据库连接通过 `prisma.config.ts` 的 `datasource.url` 配置
- schema 中 `datasource db` 只声明 provider，不能有 `url`
- PrismaClient 必须通过 `@prisma/adapter-pg` 适配器初始化
- 迁移命令: `bunx prisma db push` (开发) / `npx prisma migrate deploy` (生产)

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
bunx prisma studio             # 打开数据库可视化工具

# Docker
docker compose -f docker-compose.dev.yml up -d   # 启动开发数据库
docker compose up -d --build                       # 生产部署
```

## 分类体系

顶级分类: DBA | SRE | AI | 大数据 | Python | Golang | 前端

子分类:
- DBA → MySQL, PostgreSQL, Redis, MongoDB
- SRE → DevOps, Kubernetes, Docker, 监控告警, CI/CD

## API 接口规范

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/posts | 文章列表（支持分页/分类/搜索） |
| GET | /api/posts/[slug] | 单篇文章详情（自增浏览量） |
| POST | /api/posts | 创建文章（需认证） |
| GET | /api/categories | 分类列表（含子分类和文章数） |
| GET | /api/comments?postId=xxx | 获取评论 |
| POST | /api/comments | 创建评论 |
| POST | /api/likes | 点赞/取消点赞 |
| POST | /api/subscribe | 邮箱订阅 |
| GET | /api/admin/stats | 仪表盘统计数据（需认证） |
| GET | /api/admin/posts | 管理后台文章列表（需认证） |
| PUT | /api/admin/posts | 更新文章（需认证） |
| DELETE | /api/admin/posts?id=xxx | 删除文章（需认证） |
| GET | /api/admin/comments | 评论列表（需认证，支持筛选） |
| PUT | /api/admin/comments | 审核评论（需认证） |
| DELETE | /api/admin/comments?id=xxx | 删除评论（需认证） |
| GET | /api/admin/media | 媒体文件列表（需认证） |
| POST | /api/admin/media | 上传图片到 MinIO（需认证） |
| DELETE | /api/admin/media?id=xxx | 删除媒体文件（需认证） |
| GET | /api/admin/settings | 获取站点配置（需认证） |
| PUT | /api/admin/settings | 更新站点配置（需认证） |
| GET | /api/wechat | 微信服务器验证 |
| POST | /api/wechat | 处理微信消息 |
| PUT | /api/wechat | 验证解锁码 |

## 测试账号

- 邮箱: `admin@techblog.com`
- 密码: `admin123`
