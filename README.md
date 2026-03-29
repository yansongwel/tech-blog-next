# TechBlog - 炫酷科技风格技术博客

一个面向 DBA、SRE、AI、大数据、Python、Golang、前端等技术领域的个人博客网站。深色科技风格，具备炫酷视觉特效和完整的后台管理系统。

## 功能特性

### 前台展示
- **5 种加载动效** - Matrix 代码雨 / 赛博网格 / 终端启动 / 雷达扫描 / 故障艺术（后台可切换）
- **粒子星空背景** - 星星连线 + 鼠标吸引效果
- **10 种鼠标特效** - 靛蓝星轨 / 翡翠流光 / 烈焰追踪 / 星光金尘 / 霓虹幻彩 / 北极极光 / 樱花飞舞 / 深海之光 / 赛博朋克 / 银河漫游
- **5 套主题** - 暗夜靛蓝 / 暗夜翡翠 / 暗夜玫瑰 / 暗夜琥珀 / 浅色模式
- **3D 相册** - Three.js 实现，支持星球 / DNA / 漩涡 / 矩阵 / 心形布局，优先使用媒体库图片
- **Mega Dropdown 导航** - 分类带图标、描述和子分类的下拉菜单
- **Command Palette 搜索** - Cmd+K 全屏搜索 + 分类快速导航
- **阅读进度条** - 文章页顶部 primary-accent 渐变进度指示
- **首页 Featured 布局** - 最新文章大卡片 + 网格布局 + 统计数字动画 + 滚动揭示动画
- **AI 悬浮角色** - 可拖拽交互的全息 AI 角色（后台可关闭）
- **音乐播放器** - 右下角浮动 BGM 播放器

### 博客功能
- **文章分类** - DBA / SRE / AI / 大数据 / Python / Golang / 前端（支持子分类，后台配置图标和颜色）
- **目录导航 (TOC)** - 右侧固定目录，点击跳转 + URL hash + 滚动高亮追踪
- **代码块增强** - 语法高亮 (highlight.js) + 语言标签 + 一键复制按钮
- **Mermaid 图表** - 自动渲染流程图、时序图等
- **Markdown 导入** - 后台支持拖拽导入 .md/.html 文件
- **文章搜索** - 按标题和内容全文搜索
- **点赞 / 收藏 / 分享** - 防重复机制，一键复制链接
- **评论系统** - 嵌套回复，审核机制，XSS 防护
- **邮箱订阅** - 新文章推送通知
- **微信解锁** - 部分文章需关注公众号获取验证码解锁
- **SEO** - Sitemap、RSS Feed、Open Graph 元数据

### 后台管理
- **仪表盘** - 5 项统计 + 7 天趋势图 + 分类分布饼图 + 最近文章 + 待处理提醒
- **文章管理** - Tiptap 富文本编辑器，批量操作，CSV/Markdown 导出
- **评论管理** - 批量审核/删除，搜索筛选
- **分类管理** - 层级分类 + 图标选择器 + 颜色选择器 + 实时预览
- **媒体库** - 图片上传至 MinIO，Lightbox 预览，复制链接
- **友情链接** - 排序、显示/隐藏控制
- **订阅管理** - 统计、搜索、批量操作、CSV 导出
- **站点设置** - 主题/加载动画/鼠标皮肤选择器 + 站点信息 + 社交链接 + AI 角色开关
- **密码修改** - 管理员密码安全修改（bcrypt 验证）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router) + TypeScript |
| 样式 | Tailwind CSS 4 |
| 3D 特效 | Three.js + React Three Fiber |
| 图标 | Lucide React |
| 数据库 | PostgreSQL + Prisma 7 ORM |
| 缓存 | Redis (ioredis) |
| 认证 | NextAuth.js v5 |
| 编辑器 | Tiptap |
| 对象存储 | MinIO (S3 兼容) |
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

### 4. 启动 MinIO（对象存储）

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 5. 初始化数据库

```bash
bunx prisma generate          # 生成 Prisma Client
bunx prisma db push            # 创建数据库表
bun prisma/seed.ts             # 填充初始数据（分类、管理员账号）
bun prisma/seed-articles.ts    # 填充测试文章（可选）
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

## 项目结构

```
tech-blog/
├── prisma/
│   ├── schema.prisma           # 数据模型（12 个表）
│   ├── seed.ts                 # 初始数据填充
│   └── seed-articles.ts        # 测试文章填充
├── prisma.config.ts            # Prisma 7 连接配置
├── nginx/                      # Nginx 反向代理配置
├── src/
│   ├── app/
│   │   ├── (public)/           # 前台页面
│   │   │   ├── page.tsx        # 首页（轮播+统计+分类+文章+订阅）
│   │   │   ├── blog/           # 文章列表 & 详情
│   │   │   ├── album/          # 3D 相册
│   │   │   ├── about/          # 关于页
│   │   │   └── categories/     # 分类文章
│   │   ├── (admin)/            # 后台管理（8 个页面）
│   │   └── api/                # API 接口（20+ 端点）
│   ├── components/
│   │   ├── effects/            # 特效组件（5 个）
│   │   ├── layout/             # 布局组件（Navbar/Footer/MusicPlayer/ScrollButtons）
│   │   ├── blog/               # 博客组件（PostCard/PostDetail/TOC/Skeleton 等）
│   │   └── admin/              # 后台组件（Toast/ConfirmModal）
│   └── lib/
│       ├── services/           # Service 层（薄控制器模式）
│       ├── categoryUtils.ts    # 分类配置工具（数据驱动，非硬编码）
│       ├── useSiteConfig.ts    # 站点配置 hook
│       └── useScrollReveal.ts  # 滚动揭示 hook
├── docker-compose.yml          # 生产部署
├── docker-compose.dev.yml      # 开发环境（MinIO）
├── Dockerfile                  # 多阶段构建
├── CLAUDE.md                   # 项目开发约束
└── README.md
```

## 许可证

MIT
