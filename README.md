# TechBlog - 炫酷技术博客

一个面向 DBA、SRE、AI、大数据、Python、Golang、前端等技术领域的个人博客网站。深色科技风格，具备炫酷视觉特效和完整的后台管理系统。

## 功能特性

### 前台展示
- **炫酷加载动效** - 访问时全屏代码雨 Matrix 动画 + 进度条
- **粒子星空背景** - 星星连线 + 鼠标吸引效果
- **鼠标个性特效** - 自定义光标 + 拖尾粒子 + 点击烟花
- **3D 等离子相册** - Three.js 实现，支持球形/螺旋/网格/心形四种布局切换
- **跳舞小人** - 页面角落可拖拽互动的 SVG 动画人物
- **音乐播放器** - 右下角浮动播放器，支持播放/暂停/静音
- **3D 轮播图** - 首页 Hero 区域自动轮播
- **打字机效果** - 首页标语逐字显示
- **技能标签云** - 个人简介区域技能展示

### 博客功能
- **文章分类** - DBA / SRE / AI / 大数据 / Python / Golang / 前端（支持子分类）
- **文章搜索** - 按标题和分类筛选
- **点赞** - 防重复机制（IP + 访客指纹），Redis 计数
- **收藏** - 文章书签功能
- **评论系统** - 嵌套回复，审核机制
- **邮箱订阅** - 新文章推送通知
- **微信解锁** - 部分文章需关注公众号获取验证码解锁

### 后台管理
- **管理员登录** - NextAuth.js 邮箱密码认证
- **仪表盘** - 浏览量、点赞、评论、订阅数据统计
- **文章管理** - 新建/编辑/删除/发布，富文本编辑器
- **评论管理** - 审核/删除/回复
- **媒体库** - 图片上传管理

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router) + TypeScript |
| 样式 | Tailwind CSS 4 |
| 3D 特效 | Three.js + React Three Fiber |
| 动画 | GSAP + Framer Motion |
| 图标 | Lucide React |
| 数据库 | PostgreSQL + Prisma 7 ORM |
| 缓存 | Redis (ioredis) |
| 认证 | NextAuth.js v5 |
| 编辑器 | Tiptap |
| 对象存储 | MinIO (兼容 S3) |
| 部署 | Docker Compose + Nginx |
| 开发运行时 | Bun |
| 生产运行时 | Node.js 20 |

## 快速开始

### 前置要求

- [Bun](https://bun.sh/) >= 1.0
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- Git

### 1. 克隆项目

```bash
git clone git@github.com:yansongwel/tech-blog-next.git tech-blog
cd tech-blog
```

### 2. 安装依赖

```bash
bun install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 修改数据库密码、NextAuth 密钥等配置
```

### 4. 启动开发数据库

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 5. 初始化数据库

```bash
bunx prisma generate          # 生成 Prisma Client
bunx prisma db push            # 创建数据库表
bun prisma/seed.ts             # 填充初始数据（分类、标签、示例文章）
```

### 6. 启动开发服务器

```bash
bun run dev
```

访问 http://localhost:3000 查看前台，访问 http://localhost:3000/login 登录后台。

**测试账号**: `admin@techblog.com` / `admin123`

## 生产部署

### Docker Compose 一键部署

```bash
# 编辑 .env 配置生产环境变量
# 修改 nginx/nginx.conf 中的域名和 SSL 证书路径

docker compose up -d --build
```

### 部署架构

```
用户请求 -> Nginx (SSL/缓存) -> Next.js App (Node.js) -> PostgreSQL / Redis
                                                       -> MinIO (对象存储)
```

### SSL 证书

```bash
# 首次获取 Let's Encrypt 证书
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d yourdomain.com

# 然后取消 nginx.conf 中 SSL 证书行的注释，重启 Nginx
docker compose restart nginx
```

## 项目结构

```
tech-blog/
├── prisma/
│   ├── schema.prisma           # 数据模型（11 个表）
│   └── seed.ts                 # 初始数据填充
├── prisma.config.ts            # Prisma 7 连接配置
├── nginx/
│   └── nginx.conf              # Nginx 反向代理配置
├── public/
│   ├── music/                  # 背景音乐文件
│   ├── images/                 # 轮播图、相册图片
│   └── models/                 # Live2D 模型（预留）
├── src/
│   ├── app/
│   │   ├── (public)/           # 前台页面
│   │   │   ├── page.tsx        # 首页
│   │   │   ├── blog/           # 文章列表 & 详情
│   │   │   ├── album/          # 3D 相册
│   │   │   └── about/          # 关于页
│   │   ├── (admin)/            # 后台管理
│   │   │   ├── login/          # 登录页
│   │   │   ├── dashboard/      # 仪表盘
│   │   │   ├── posts/          # 文章管理
│   │   │   └── ...
│   │   └── api/                # API 接口
│   ├── components/
│   │   ├── effects/            # 特效组件（5 个）
│   │   ├── layout/             # 布局组件
│   │   ├── blog/               # 博客组件
│   │   └── admin/              # 后台组件
│   └── lib/                    # prisma / redis / auth / wechat
├── docker-compose.yml          # 生产部署
├── docker-compose.dev.yml      # 开发环境
├── Dockerfile                  # 多阶段构建
└── CLAUDE.md                   # 项目开发约束
```

## 数据模型

| 模型 | 说明 |
|------|------|
| User | 管理员账户 |
| Post | 文章（标题、内容、分类、标签、状态、锁定） |
| Category | 分类（支持父子层级） |
| Tag | 标签（多对多） |
| Comment | 评论（支持嵌套回复） |
| Like | 点赞（防重复） |
| Bookmark | 收藏 |
| Subscription | 邮箱订阅 |
| WechatUnlock | 微信解锁记录 |
| SiteConfig | 站点配置（键值对） |
| Media | 媒体资源 |

## 常用命令

```bash
# 开发
bun run dev                     # 启动开发服务器（Turbopack）
bun run build                   # 构建生产版本
bun run lint                    # 代码检查

# 数据库
bunx prisma generate            # 生成 Client
bunx prisma db push             # 同步 Schema
bun prisma/seed.ts              # 填充数据
bunx prisma studio              # 数据库可视化

# Docker
docker compose -f docker-compose.dev.yml up -d    # 开发数据库
docker compose -f docker-compose.dev.yml down      # 停止开发数据库
docker compose up -d --build                        # 生产部署
docker compose logs -f app                          # 查看应用日志
```

## 微信公众号解锁流程

1. 后台创建文章时开启「微信解锁」开关
2. 访客浏览该文章时看到部分内容 + 遮罩
3. 展示公众号二维码，提示关注后回复关键词（如 `K8S`）
4. 公众号自动回复 6 位数字验证码（有效期 30 分钟）
5. 访客在网站输入验证码，验证通过后解锁文章（24 小时有效）

## 许可证

MIT
