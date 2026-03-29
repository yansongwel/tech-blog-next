/**
 * Seed script: creates test articles with rich markdown content.
 * Run: DATABASE_URL="..." bun prisma/seed-articles.ts
 */

import { PrismaClient } from "@prisma/client";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { PrismaClient: PC } = await import("@prisma/client");
const { PrismaPg } = await import("@prisma/adapter-pg");
const adapter = new PrismaPg(pool);
const prisma = new PC({ adapter }) as unknown as PrismaClient;

// Get admin user
const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
if (!admin) {
  console.error("No admin user found. Run the main seed first.");
  process.exit(1);
}

// Get categories
const categories = await prisma.category.findMany({ where: { parentId: null } });
if (categories.length === 0) {
  console.error("No categories found. Run the main seed first.");
  process.exit(1);
}

// Helper: find category by slug prefix
function findCat(slug: string) {
  return categories.find((c) => c.slug.includes(slug)) || categories[0];
}

// Cover images from Unsplash (free, no auth needed)
const covers = [
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=600&fit=crop", // code
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop", // server room
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop", // AI
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop", // data
  "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&h=600&fit=crop", // dev
  "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1200&h=600&fit=crop", // docker
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=600&fit=crop", // matrix
];

const articles = [
  {
    title: "PostgreSQL 性能调优实战：从慢查询到毫秒级响应",
    slug: `pg-performance-tuning-${Date.now().toString(36)}`,
    category: "dba",
    coverImage: covers[0],
    excerpt: "深入探讨 PostgreSQL 查询优化的核心策略，包括索引设计、查询计划分析和连接池配置。",
    tags: ["PostgreSQL", "性能优化", "DBA"],
    content: `
<h2>为什么你的 SQL 查询这么慢？</h2>
<p>在生产环境中，一条慢查询可能拖垮整个系统。本文将从实战角度，带你系统性地解决 PostgreSQL 性能问题。</p>

<h2>第一步：定位慢查询</h2>
<h3>开启 pg_stat_statements</h3>
<p>这是 PostgreSQL 内置的慢查询分析利器：</p>
<pre><code class="language-sql">-- 开启扩展
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 查看最耗时的 10 条查询
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;</code></pre>

<h3>使用 EXPLAIN ANALYZE</h3>
<p>对可疑查询进行执行计划分析：</p>
<pre><code class="language-sql">EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT p.*, c.name as category_name
FROM posts p
JOIN categories c ON p.category_id = c.id
WHERE p.status = 'PUBLISHED'
ORDER BY p.published_at DESC
LIMIT 20;</code></pre>

<h2>第二步：索引优化策略</h2>
<h3>复合索引的列顺序</h3>
<p>复合索引的列顺序直接影响查询性能。遵循 <strong>ESR 原则</strong>（Equality → Sort → Range）：</p>
<pre><code class="language-sql">-- 好的索引设计
CREATE INDEX idx_posts_status_published
ON posts (status, published_at DESC)
WHERE status = 'PUBLISHED';  -- 部分索引，更小更快

-- 避免的模式
CREATE INDEX idx_posts_bad ON posts (published_at, status);  -- 顺序错误</code></pre>

<h3>覆盖索引（Index-Only Scan）</h3>
<p>当查询所需的所有列都在索引中时，PostgreSQL 可以完全从索引返回数据，无需访问表：</p>
<pre><code class="language-sql">CREATE INDEX idx_posts_covering
ON posts (category_id, status)
INCLUDE (title, slug, published_at);</code></pre>

<h2>第三步：连接池配置</h2>
<p>使用 <code>PgBouncer</code> 作为连接池代理：</p>
<pre><code class="language-ini">[pgbouncer]
listen_port = 6432
max_client_conn = 200
default_pool_size = 20
pool_mode = transaction</code></pre>

<blockquote>
<p><strong>经验法则：</strong> pool_size = CPU 核心数 × 2 + 磁盘数。对于 4 核 SSD 服务器，推荐 default_pool_size = 10。</p>
</blockquote>

<h2>监控与告警</h2>
<p>使用以下查询持续监控数据库健康度：</p>

| 指标 | 查询 | 阈值 |
|------|------|------|
| 连接数 | \`SELECT count(*) FROM pg_stat_activity\` | < max_connections × 80% |
| 缓存命中率 | \`SELECT hit_rate FROM cache_stats\` | > 99% |
| 死锁次数 | \`SELECT deadlocks FROM pg_stat_database\` | = 0 |

<h2>总结</h2>
<p>性能调优是一个持续的过程。关键是建立<strong>监控 → 发现 → 分析 → 优化 → 验证</strong>的闭环。</p>
`,
  },
  {
    title: "Kubernetes 生产环境最佳实践：从部署到可观测性",
    slug: `k8s-production-best-practices-${Date.now().toString(36)}`,
    category: "sre",
    coverImage: covers[1],
    excerpt: "涵盖 K8s 资源管理、HPA 自动扩缩容、健康检查、日志收集和 Prometheus 监控的完整实践指南。",
    tags: ["Kubernetes", "DevOps", "SRE"],
    content: `
<h2>生产级 K8s 部署清单</h2>
<p>将应用部署到 Kubernetes 生产环境，远不止写一个 Deployment YAML。本文总结了经过实战验证的最佳实践。</p>

<h2>资源管理：requests 和 limits</h2>
<h3>为什么必须设置资源限制？</h3>
<p>不设置 limits 的 Pod 是"资源炸弹"——它可以无限制地消耗节点资源，导致同节点其他 Pod 被 OOM Kill。</p>

<pre><code class="language-yaml">apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: myapp:v1.2.0
        resources:
          requests:
            cpu: "250m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        # 健康检查 —— 区分 liveness 和 readiness
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5</code></pre>

<h2>HPA 自动扩缩容</h2>
<p>基于 CPU 和自定义指标的水平扩缩：</p>
<pre><code class="language-yaml">apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # 防止频繁缩容
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60</code></pre>

<h2>可观测性三支柱</h2>

<h3>1. 日志（Logging）</h3>
<p>使用 <strong>Fluent Bit</strong> 作为日志收集 DaemonSet，输出到 Elasticsearch：</p>
<pre><code class="language-bash">helm install fluent-bit fluent/fluent-bit \\
  --set backend.type=es \\
  --set backend.es.host=elasticsearch.logging</code></pre>

<h3>2. 指标（Metrics）</h3>
<p>Prometheus + Grafana 是黄金组合：</p>
<pre><code class="language-bash"># 安装 kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \\
  --namespace monitoring --create-namespace</code></pre>

<h3>3. 追踪（Tracing）</h3>
<p>使用 OpenTelemetry SDK 实现分布式链路追踪，帮助定位跨服务调用的延迟瓶颈。</p>

<h2>安全加固</h2>
<ul>
<li>启用 <strong>NetworkPolicy</strong> 限制 Pod 间通信</li>
<li>使用 <strong>PodSecurityStandard</strong> (restricted) 限制容器权限</li>
<li>镜像使用 <strong>digest</strong> 而非 tag 引用，防止供应链攻击</li>
<li>Secret 使用 <strong>External Secrets Operator</strong> 从 Vault 注入</li>
</ul>

<h2>总结</h2>
<p>生产级 K8s 运维的核心理念：<strong>Everything as Code, Observable, and Resilient</strong>。</p>
`,
  },
  {
    title: "LLM 应用开发入门：从 Prompt Engineering 到 RAG 架构",
    slug: `llm-app-development-guide-${Date.now().toString(36)}`,
    category: "ai",
    coverImage: covers[2],
    excerpt: "系统介绍如何基于大语言模型构建实际应用，涵盖 Prompt 设计、Function Calling、RAG 和向量数据库。",
    tags: ["AI", "LLM", "RAG"],
    content: `
<h2>LLM 应用的技术栈全景</h2>
<p>2024-2025 年，大语言模型（LLM）正在重塑软件开发。但从"和 ChatGPT 聊天"到"构建可靠的 LLM 应用"，中间有巨大的工程鸿沟。</p>

<h2>Prompt Engineering 核心原则</h2>
<h3>结构化 Prompt 模板</h3>
<pre><code class="language-python">SYSTEM_PROMPT = """你是一个技术文档助手。
角色：准确回答用户的技术问题
约束：
- 只基于提供的上下文回答
- 不确定时明确说明
- 使用代码示例辅助说明
输出格式：Markdown"""

def build_prompt(question: str, context: str) -> str:
    return f"""基于以下上下文回答问题。

上下文：
{context}

问题：{question}

请用中文回答，包含代码示例。"""</code></pre>

<h3>Few-shot Learning</h3>
<p>提供 2-3 个示例，让模型学会你期望的输出格式：</p>
<pre><code class="language-json">{
  "messages": [
    {"role": "system", "content": "从 SQL 错误日志中提取关键信息"},
    {"role": "user", "content": "ERROR: relation \\"users\\" does not exist"},
    {"role": "assistant", "content": "{\\"type\\": \\"missing_table\\", \\"table\\": \\"users\\", \\"fix\\": \\"CREATE TABLE or run migration\\"}"},
    {"role": "user", "content": "ERROR: duplicate key value violates unique constraint"},
    {"role": "assistant", "content": "{\\"type\\": \\"unique_violation\\", \\"fix\\": \\"Use UPSERT or check existing data\\"}"}
  ]
}</code></pre>

<h2>RAG（检索增强生成）架构</h2>
<p>RAG 通过检索外部知识来增强 LLM 的回答质量，解决幻觉问题：</p>

<pre><code class="language-mermaid">graph LR
    A[用户提问] --> B[向量化查询]
    B --> C[向量数据库检索]
    C --> D[Top-K 相关文档]
    D --> E[构建 Prompt]
    E --> F[LLM 生成回答]
    F --> G[返回用户]</code></pre>

<h3>向量数据库选型</h3>

| 数据库 | 优势 | 适用场景 |
|--------|------|----------|
| Pinecone | 全托管，零运维 | 快速原型 |
| Milvus | 开源，高性能 | 大规模生产 |
| pgvector | PostgreSQL 扩展 | 已有 PG 基础设施 |
| Chroma | 轻量，Python 友好 | 本地开发 |

<h2>Function Calling 实践</h2>
<p>让 LLM 调用外部工具，实现真正的 AI Agent：</p>
<pre><code class="language-python">tools = [
    {
        "type": "function",
        "function": {
            "name": "query_database",
            "description": "执行 SQL 查询并返回结果",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "SQL 查询语句"},
                    "database": {"type": "string", "enum": ["production", "analytics"]}
                },
                "required": ["sql"]
            }
        }
    }
]</code></pre>

<h2>生产部署注意事项</h2>
<ul>
<li><strong>成本控制：</strong>使用缓存层（Redis）避免重复调用 LLM API</li>
<li><strong>延迟优化：</strong>流式输出（SSE）改善用户体验</li>
<li><strong>安全：</strong>Prompt Injection 防护，输入输出过滤</li>
<li><strong>评估：</strong>建立自动化评估流水线，持续监控回答质量</li>
</ul>
`,
  },
  {
    title: "Docker Compose 多服务编排：从开发到部署的完整工作流",
    slug: `docker-compose-workflow-${Date.now().toString(36)}`,
    category: "sre",
    coverImage: covers[5],
    excerpt: "详解 Docker Compose 在微服务架构中的使用，包括网络配置、健康检查、环境变量管理和生产部署策略。",
    tags: ["Docker", "DevOps", "微服务"],
    content: `
<h2>为什么选择 Docker Compose？</h2>
<p>对于中小规模的微服务架构，Docker Compose 提供了<strong>声明式</strong>、<strong>可版本控制</strong>的服务编排方案，比直接管理多个 docker run 命令优雅得多。</p>

<h2>生产级 docker-compose.yml 模板</h2>
<pre><code class="language-yaml">version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:\${DB_PASSWORD}@db:5432/myapp
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "\${REDIS_PASSWORD}", "ping"]
      interval: 10s

volumes:
  pgdata:</code></pre>

<h2>多环境配置</h2>
<p>使用 <code>docker-compose.override.yml</code> 实现开发/生产环境差异化：</p>
<pre><code class="language-bash"># 开发环境（自动加载 override）
docker compose up

# 生产环境（只用主配置）
docker compose -f docker-compose.yml up -d</code></pre>

<h2>最佳实践清单</h2>
<ul>
<li>使用 <code>.env</code> 文件管理敏感配置，绝不硬编码密码</li>
<li>所有服务必须配置 <code>healthcheck</code></li>
<li>使用 <code>depends_on</code> + <code>condition: service_healthy</code> 确保启动顺序</li>
<li>数据卷使用 named volumes 而非 bind mounts</li>
<li>使用多阶段构建减小镜像体积</li>
</ul>
`,
  },
  {
    title: "Go 并发编程精髓：Goroutine、Channel 与 Context 深度解析",
    slug: `golang-concurrency-deep-dive-${Date.now().toString(36)}`,
    category: "golang",
    coverImage: covers[4],
    excerpt: "从 goroutine 调度器到 channel 底层实现，深入理解 Go 并发模型，掌握生产环境中的并发最佳实践。",
    tags: ["Golang", "并发", "高性能"],
    content: `
<h2>Go 并发的哲学</h2>
<blockquote><p>Do not communicate by sharing memory; instead, share memory by communicating. — Go Proverbs</p></blockquote>

<h2>Goroutine 调度模型：GMP</h2>
<p>Go 运行时使用 <strong>GMP 模型</strong>进行 goroutine 调度：</p>
<ul>
<li><strong>G (Goroutine)</strong>：轻量级协程，初始栈仅 2KB</li>
<li><strong>M (Machine)</strong>：操作系统线程</li>
<li><strong>P (Processor)</strong>：逻辑处理器，默认等于 CPU 核数</li>
</ul>

<h2>Channel 使用模式</h2>
<h3>Fan-out / Fan-in 模式</h3>
<pre><code class="language-go">func fanOut(input <-chan int, workers int) []<-chan int {
    channels := make([]<-chan int, workers)
    for i := 0; i < workers; i++ {
        channels[i] = process(input)
    }
    return channels
}

func fanIn(channels ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    merged := make(chan int)

    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for v := range c {
                merged <- v
            }
        }(ch)
    }

    go func() {
        wg.Wait()
        close(merged)
    }()

    return merged
}</code></pre>

<h3>超时控制与 Context</h3>
<pre><code class="language-go">func fetchWithTimeout(ctx context.Context, url string) ([]byte, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}</code></pre>

<h2>常见陷阱</h2>
<ol>
<li><strong>Goroutine 泄漏</strong> — 忘记关闭 channel 或 cancel context</li>
<li><strong>竞态条件</strong> — 使用 <code>go run -race</code> 检测</li>
<li><strong>死锁</strong> — 避免在同一 goroutine 中同时读写 unbuffered channel</li>
</ol>

<h2>性能基准</h2>

| 操作 | 耗时 | 对比 |
|------|------|------|
| 创建 goroutine | ~1μs | 线程 ~1ms（1000x） |
| Channel 发送/接收 | ~50ns | Mutex Lock ~25ns |
| Context 取消传播 | ~100ns | — |
`,
  },
];

console.log("Creating test articles...");

for (const article of articles) {
  const cat = findCat(article.category);

  try {
    // Ensure unique slug
    const existing = await prisma.post.findUnique({ where: { slug: article.slug } });
    if (existing) {
      console.log(`  Skipped: ${article.title} (slug exists)`);
      continue;
    }

    const post = await prisma.post.create({
      data: {
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        coverImage: article.coverImage,
        status: "PUBLISHED",
        publishedAt: new Date(),
        viewCount: Math.floor(Math.random() * 500) + 50,
        authorId: admin.id,
        categoryId: cat.id,
      },
    });

    // Create tags
    for (const tagName of article.tags) {
      const tagSlug = tagName.toLowerCase().replace(/\s+/g, "-");
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: { name: tagName, slug: tagSlug },
      });
      await prisma.postTag.create({
        data: { postId: post.id, tagId: tag.id },
      }).catch(() => {}); // skip duplicates
    }

    console.log(`  Created: ${article.title}`);
  } catch (err) {
    console.error(`  Error creating "${article.title}":`, err);
  }
}

// Update category colors and icons
const categoryUpdates = [
  { slug: "dba", icon: "database", color: "from-orange-500 to-red-500", description: "MySQL · PostgreSQL · Redis · MongoDB" },
  { slug: "sre", icon: "server", color: "from-indigo-500 to-purple-500", description: "DevOps · K8s · Docker · 监控告警" },
  { slug: "ai", icon: "brain", color: "from-cyan-500 to-blue-500", description: "机器学习 · 深度学习 · LLM · RAG" },
  { slug: "python", icon: "code", color: "from-yellow-500 to-orange-500", description: "Web · 爬虫 · 数据分析 · 自动化" },
  { slug: "golang", icon: "terminal", color: "from-sky-400 to-blue-500", description: "微服务 · 云原生 · 高并发" },
  { slug: "frontend", icon: "globe", color: "from-pink-500 to-rose-500", description: "React · Vue · TypeScript · Next.js" },
];

console.log("\nUpdating category icons and colors...");
for (const update of categoryUpdates) {
  try {
    await prisma.category.updateMany({
      where: { slug: { contains: update.slug } },
      data: { icon: update.icon, color: update.color, description: update.description },
    });
    console.log(`  Updated: ${update.slug}`);
  } catch {
    console.log(`  Skipped: ${update.slug} (not found)`);
  }
}

console.log("\nDone! Created test articles and updated category metadata.");
await pool.end();
process.exit(0);
