# PostgreSQL & Redis 远程迁移实战指南

> 将本地 Docker 容器中的 PostgreSQL 和 Redis 迁移到独立服务器，实现计算与存储分离，释放本地内存资源。

## 背景与动机

### 问题现状

本地开发服务器（8GB 内存）同时运行以下服务：

| 服务 | 内存占用 | 说明 |
|------|---------|------|
| Next.js 应用 | ~500MB | 开发热重载时更高 |
| PostgreSQL 16 | ~200-400MB | shared_buffers + 连接池 |
| Redis 7 | ~100-300MB | 缓存数据增长 |
| MinIO | ~100MB | 对象存储 |
| Claude Code | ~1-2GB | AI 编程助手 |

多个服务竞争有限内存，频繁触发 OOM（Out of Memory），导致服务器卡死。

### 解决方案：计算与存储分离

```
迁移前:                          迁移后:
┌─────────────────────┐         ┌──────────────────┐     ┌──────────────────┐
│    本地服务器 (8GB)   │         │  本地服务器 (8GB)  │     │ 远程服务器 (16GB)  │
│                     │         │                  │     │                  │
│  ✦ Next.js App      │         │  ✦ Next.js App   │────▶│  ✦ PostgreSQL 16 │
│  ✦ PostgreSQL 16    │   ──▶   │  ✦ MinIO         │     │  ✦ Redis 7       │
│  ✦ Redis 7          │         │  ✦ Claude Code   │     │                  │
│  ✦ MinIO            │         │                  │     │                  │
│  ✦ Claude Code      │         │  内存充裕 ✓       │     │  16GB 内存充裕 ✓  │
│                     │         └──────────────────┘     └──────────────────┘
│  内存不足 ✗          │
└─────────────────────┘
```

**核心思路**：有状态的数据库服务迁移到专用服务器，本地只保留无状态的应用代码和开发工具。

---

## 前置条件

| 项目 | 要求 |
|------|------|
| 本地环境 | Docker 运行中，PostgreSQL 和 Redis 容器正常 |
| 远程服务器 | Linux 系统，已安装 Docker 和 Docker Compose |
| 网络 | 本地能通过 SSH 访问远程服务器 |
| 工具 | `sshpass`（用于脚本化 SSH 连接） |

### 安装 sshpass

```bash
# Ubuntu/Debian
sudo apt-get install -y sshpass

# CentOS/RHEL
sudo yum install -y sshpass

# macOS
brew install hudochenkov/sshpass/sshpass
```

---

## 第一步：检查环境

### 1.1 确认本地数据库容器状态

```bash
docker ps --format '{{.Names}} {{.Status}}'
```

预期输出：

```
techblog-postgres Up 18 hours (healthy)
techblog-redis Up 18 hours (healthy)
techblog-minio Up 18 hours
```

### 1.2 检查远程服务器资源

```bash
sshpass -p '<ROOT_PASSWORD>' ssh -o StrictHostKeyChecking=no root@<REMOTE_IP> \
  'uname -a && free -h && docker --version'
```

预期输出：

```
Linux rke2-agent-05 6.8.0-100-generic ... x86_64 GNU/Linux
               total        used        free
Mem:            15Gi       5.9Gi       4.8Gi       # 充足的可用内存
Docker version 29.3.0, build 5927d80               # Docker 已就绪
```

> **关键检查点**：远程服务器需有足够空闲内存（建议 ≥ 2GB），且 Docker 已安装。

---

## 第二步：在远程服务器部署数据库

### 2.1 创建 Docker Compose 配置

```bash
sshpass -p '<ROOT_PASSWORD>' ssh root@<REMOTE_IP> \
  'mkdir -p /opt/techblog-db && cat > /opt/techblog-db/docker-compose.yml << '\''COMPOSE'\''
services:
  postgres:
    image: postgres:16-alpine
    container_name: techblog-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: <PG_PASSWORD>
      POSTGRES_DB: techblog
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    command: >
      postgres
        -c max_connections=100
        -c shared_buffers=256MB
        -c effective_cache_size=1GB
        -c work_mem=4MB
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: techblog-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: >
      redis-server
        --requirepass <REDIS_PASSWORD>
        --maxmemory 512mb
        --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "<REDIS_PASSWORD>", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
COMPOSE'
```

**配置要点解读**：

| 参数 | 值 | 说明 |
|------|-----|------|
| `shared_buffers` | 256MB | PostgreSQL 共享缓存，建议为总内存的 1/4（远程 16GB 可调更大） |
| `effective_cache_size` | 1GB | 告诉查询规划器可用的系统缓存估算值 |
| `max_connections` | 100 | 最大连接数，远程开发足够 |
| `maxmemory` | 512mb | Redis 最大内存上限 |
| `maxmemory-policy` | allkeys-lru | 内存满时淘汰最近最少使用的 key |
| `restart` | unless-stopped | 服务器重启后自动拉起容器 |

### 2.2 启动容器

```bash
sshpass -p '<ROOT_PASSWORD>' ssh root@<REMOTE_IP> \
  'cd /opt/techblog-db && docker compose up -d'
```

### 2.3 验证健康状态

等待约 15 秒后检查：

```bash
sshpass -p '<ROOT_PASSWORD>' ssh root@<REMOTE_IP> \
  'docker ps --format "{{.Names}} {{.Status}}"'
```

预期输出：

```
techblog-postgres Up 25 seconds (healthy)
techblog-redis Up 25 seconds (healthy)
```

> 两个容器都显示 `(healthy)` 才可进入下一步。

---

## 第三步：迁移数据

### 3.1 管道式数据迁移（推荐）

使用 `pg_dump | ssh | psql` 管道，**不落盘**直接传输：

```bash
docker exec techblog-postgres pg_dump \
  -U postgres \
  -d techblog \
  --clean \
  --if-exists \
  --no-owner \
| sshpass -p '<ROOT_PASSWORD>' ssh root@<REMOTE_IP> \
  'docker exec -i techblog-postgres psql -U postgres -d techblog'
```

**参数解释**：

| 参数 | 作用 |
|------|------|
| `--clean` | 在还原前先 DROP 目标库中已有的对象，保证干净还原 |
| `--if-exists` | DROP 时加 IF EXISTS，避免对象不存在报错 |
| `--no-owner` | 不导出所有权信息，避免本地/远程用户不同导致权限错误 |
| `-i` (psql) | 从标准输入读取 SQL，配合管道使用 |

**为什么选管道而不是先导出文件？**

```
方案 A（落盘）：pg_dump > dump.sql → scp dump.sql → psql < dump.sql
  ✗ 需要本地磁盘空间存放 dump 文件
  ✗ 内存紧张时写大文件可能加剧 OOM
  ✗ 多一次磁盘 I/O

方案 B（管道）：pg_dump | ssh psql
  ✓ 零磁盘占用，数据流式传输
  ✓ 内存友好
  ✓ 一条命令完成
```

### 3.2 验证数据完整性

对比本地和远程的表结构：

```bash
# 本地表列表
docker exec techblog-postgres psql -U postgres -d techblog \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"

# 远程表列表
sshpass -p '<ROOT_PASSWORD>' ssh root@<REMOTE_IP> \
  "docker exec techblog-postgres psql -U postgres -d techblog \
   -c \"SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;\""
```

对比关键表的行数：

```bash
# 本地行数
docker exec techblog-postgres psql -U postgres -d techblog -c "
SELECT 'Post' as table_name, count(*) FROM \"Post\"
UNION ALL SELECT 'User', count(*) FROM \"User\"
UNION ALL SELECT 'Category', count(*) FROM \"Category\"
UNION ALL SELECT 'Comment', count(*) FROM \"Comment\"
UNION ALL SELECT 'Media', count(*) FROM \"Media\";"

# 远程行数（同样的查询通过 SSH 执行）
```

验证结果示例：

```
 table_name | count
------------+-------
 Post       |     6
 User       |     1
 Category   |    14
 Comment    |     1
 Media      |     1
```

> 两端结果必须完全一致，才可进入下一步。

---

## 第四步：更新本地配置

### 4.1 修改 `.env`

将数据库连接地址从 `localhost` 改为远程服务器 IP：

```bash
# 修改前
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/techblog?schema=public"
REDIS_URL="redis://localhost:6379"

# 修改后
DATABASE_URL="postgresql://postgres:<PG_PASSWORD_URL_ENCODED>@<REMOTE_IP>:5432/techblog?schema=public"
REDIS_URL="redis://:<REDIS_PASSWORD_URL_ENCODED>@<REMOTE_IP>:6379"
```

> **重要：URL 编码**
>
> 如果密码中包含 `@`、`#`、`%`、`/` 等特殊字符，必须进行 URL 编码，否则连接字符串解析会出错：
>
> | 原字符 | 编码 |
> |--------|------|
> | `@` | `%40` |
> | `#` | `%23` |
> | `%` | `%25` |
> | `/` | `%2F` |
> | `:` | `%3A` |
>
> 例如密码 `Pass@123` 应编码为 `Pass%40123`。

### 4.2 精简 `docker-compose.dev.yml`

移除 PostgreSQL 和 Redis，只保留 MinIO：

```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: techblog-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  minio_data:
```

### 4.3 验证应用连接

测试 PostgreSQL 连接（通过 Prisma）：

```bash
# 加载环境变量后测试
set -a && source .env && set +a
bunx prisma db execute --stdin <<< "SELECT count(*) FROM \"Post\";"
```

预期输出：

```
Loaded Prisma config from prisma.config.ts.
Script executed successfully.
```

测试 Redis 连接（通过 Node.js）：

```bash
set -a && source .env && set +a
node -e "
const Redis = require('ioredis');
const r = new Redis(process.env.REDIS_URL);
r.ping().then(res => {
  console.log('Redis:', res);
  r.disconnect();
}).catch(e => {
  console.error('Redis error:', e.message);
  r.disconnect();
});
"
```

预期输出：

```
Redis: PONG
```

---

## 第五步：停止本地数据库容器

确认远程连接正常后，停止并移除本地数据库容器：

```bash
# 停止容器
docker stop techblog-postgres techblog-redis

# 移除容器
docker rm techblog-postgres techblog-redis
```

验证本地状态：

```bash
docker ps --format '{{.Names}} {{.Status}}'
```

预期只剩 MinIO：

```
techblog-minio Up 18 hours
```

查看释放后的内存：

```bash
free -h
```

---

## 第六步：更新项目文档

在 `CLAUDE.md` 中记录架构变更，确保团队成员（和 AI 助手）了解新的部署拓扑：

1. 技术栈中增加远程数据库服务器信息
2. 开发规范中增加数据库部署架构说明
3. 常用命令中增加远程数据库管理命令

---

## 运维手册

### 日常管理

```bash
# 查看远程数据库状态
ssh root@<REMOTE_IP> 'cd /opt/techblog-db && docker compose ps'

# 查看远程数据库日志
ssh root@<REMOTE_IP> 'cd /opt/techblog-db && docker compose logs -f --tail=50'

# 重启远程数据库
ssh root@<REMOTE_IP> 'cd /opt/techblog-db && docker compose restart'
```

### 数据备份

```bash
# 远程 PostgreSQL 备份到本地文件
sshpass -p '<ROOT_PASSWORD>' ssh root@<REMOTE_IP> \
  'docker exec techblog-postgres pg_dump -U postgres -d techblog' \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Redis 持久化（RDB 快照已通过 volume 自动持久化）
sshpass -p '<ROOT_PASSWORD>' ssh root@<REMOTE_IP> \
  'docker exec techblog-redis redis-cli -a <REDIS_PASSWORD> BGSAVE'
```

### 故障排查

| 现象 | 排查步骤 |
|------|---------|
| 应用报 `P1001 Can't reach database` | 1. 检查远程容器状态 2. 检查防火墙 3. 检查 `.env` 中的 IP 和端口 |
| Redis 连接超时 | 1. `redis-cli -h <IP> -a <PWD> ping` 2. 检查 maxmemory 是否已满 |
| 数据库连接被拒绝 | 检查 `pg_hba.conf` 是否允许远程连接（alpine 镜像默认允许） |
| 密码认证失败 | 检查密码中特殊字符是否正确 URL 编码 |

---

## 安全加固建议

迁移完成后，强烈建议执行以下安全加固措施：

### 防火墙限制（仅允许本地服务器 IP）

```bash
# 在远程服务器上执行
# 只允许本地服务器 IP 访问数据库端口
ufw allow from <LOCAL_SERVER_IP> to any port 5432 proto tcp
ufw allow from <LOCAL_SERVER_IP> to any port 6379 proto tcp

# 拒绝其他来源的数据库访问
ufw deny 5432/tcp
ufw deny 6379/tcp

ufw enable
```

### 其他安全建议

- [ ] 定期轮换数据库密码
- [ ] 配置 PostgreSQL 的 `pg_hba.conf` 限制来源 IP
- [ ] 开启 Redis 的 `rename-command` 禁用危险命令（如 `FLUSHALL`）
- [ ] 设置定时备份（cron + pg_dump）
- [ ] 监控远程服务器的磁盘和内存使用率

---

## 迁移清单（Checklist）

- [x] 检查远程服务器资源和 Docker 环境
- [x] 在远程服务器创建 Docker Compose 配置
- [x] 启动远程 PostgreSQL 和 Redis 容器
- [x] 验证远程容器健康状态
- [x] 通过管道迁移 PostgreSQL 数据
- [x] 验证本地与远程数据一致性（表结构 + 行数）
- [x] 更新 `.env` 指向远程数据库（注意 URL 编码）
- [x] 精简 `docker-compose.dev.yml`（移除数据库）
- [x] 验证应用层 PostgreSQL 连接
- [x] 验证应用层 Redis 连接
- [x] 停止并移除本地数据库容器
- [x] 更新项目文档（CLAUDE.md）
- [ ] 配置远程服务器防火墙
- [ ] 设置定时备份

---

*文档生成时间：2026-03-29*
*迁移耗时：约 10 分钟（含镜像拉取）*
