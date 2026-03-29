# Kubernetes 微服务架构全面指南

本文全面介绍 Kubernetes 微服务架构的设计、部署与运维最佳实践。

## 1. 架构概览

Kubernetes 微服务架构通常包含以下核心组件：

- **API Gateway**: 统一入口，负载均衡
- **Service Mesh**: 服务间通信管理（如 Istio）
- **Config Center**: 配置中心（ConfigMap / Secret）
- **Monitoring**: 监控告警（Prometheus + Grafana）

### 1.1 系统架构图

```mermaid
graph TD
    A[用户请求] --> B[Ingress Controller]
    B --> C[API Gateway]
    C --> D[Auth Service]
    C --> E[User Service]
    C --> F[Order Service]
    E --> G[(PostgreSQL)]
    F --> H[(Redis)]
    F --> I[(MongoDB)]
    D --> J[JWT Token]

    subgraph Monitoring
        K[Prometheus]
        L[Grafana]
        M[AlertManager]
    end

    E --> K
    F --> K
    K --> L
    K --> M
```

### 1.2 部署流程

```mermaid
sequenceDiagram
    participant Dev as 开发者
    participant CI as CI/CD Pipeline
    participant Registry as 镜像仓库
    participant K8s as Kubernetes

    Dev->>CI: 推送代码
    CI->>CI: 运行测试
    CI->>Registry: 构建并推送镜像
    CI->>K8s: 滚动更新部署
    K8s->>K8s: 健康检查
    K8s-->>Dev: 部署完成通知
```

## 2. 核心配置

### 2.1 Deployment 配置示例

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  labels:
    app: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: registry.example.com/user-service:v1.2.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "128Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
```

### 2.2 数据库连接 (Python)

```python
import asyncpg
from contextlib import asynccontextmanager

class DatabasePool:
    def __init__(self, dsn: str, min_size: int = 5, max_size: int = 20):
        self.dsn = dsn
        self.min_size = min_size
        self.max_size = max_size
        self._pool = None

    async def initialize(self):
        self._pool = await asyncpg.create_pool(
            self.dsn,
            min_size=self.min_size,
            max_size=self.max_size,
        )

    @asynccontextmanager
    async def acquire(self):
        async with self._pool.acquire() as conn:
            yield conn

# 使用示例
db = DatabasePool("postgresql://user:pass@localhost/mydb")
await db.initialize()

async with db.acquire() as conn:
    users = await conn.fetch("SELECT * FROM users WHERE active = $1", True)
```

### 2.3 监控查询 (SQL)

```sql
-- 慢查询分析
SELECT
    query,
    calls,
    total_exec_time / 1000 AS total_seconds,
    mean_exec_time / 1000 AS avg_seconds,
    rows
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY total_exec_time DESC
LIMIT 20;
```

## 3. 性能对比

| 方案 | QPS | 延迟 (P99) | 内存占用 | 适用场景 |
|------|-----|-----------|---------|---------|
| 单体架构 | 5,000 | 50ms | 2GB | 小型项目 |
| 微服务 + K8s | 50,000 | 20ms | 8GB | 中大型项目 |
| Service Mesh | 45,000 | 25ms | 12GB | 复杂微服务 |
| Serverless | 30,000 | 80ms | 按需 | 事件驱动 |

## 4. 最佳实践

> **黄金法则**: 每个微服务应该只做一件事，并把它做好。保持服务边界清晰，避免分布式单体。

### 要点清单

1. **服务拆分原则**
   - 按业务域拆分（DDD）
   - 单一职责原则
   - 数据库独立
2. **通信模式**
   - 同步：gRPC / REST
   - 异步：Kafka / RabbitMQ
3. **可观测性**
   - 分布式链路追踪（Jaeger）
   - 指标采集（Prometheus）
   - 日志聚合（ELK Stack）

---

*本文最后更新于 2026 年 3 月，基于 Kubernetes 1.29 版本。*
