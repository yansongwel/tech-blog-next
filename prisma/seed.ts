import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/techblog?schema=public";
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@techblog.com" },
    update: {},
    create: {
      email: "admin@techblog.com",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  // Create categories
  const categoryData = [
    { name: "DBA", slug: "dba", description: "数据库管理与优化", sortOrder: 1 },
    { name: "SRE", slug: "sre", description: "站点可靠性工程", sortOrder: 2 },
    { name: "AI", slug: "ai", description: "人工智能与机器学习", sortOrder: 3 },
    { name: "大数据", slug: "bigdata", description: "大数据技术栈", sortOrder: 4 },
    { name: "Python", slug: "python", description: "Python 开发", sortOrder: 5 },
    { name: "Golang", slug: "golang", description: "Go 语言开发", sortOrder: 6 },
    { name: "前端", slug: "frontend", description: "前端开发技术", sortOrder: 7 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = created.id;
  }

  // Create sub-categories for SRE
  const sreSubcategories = [
    { name: "DevOps", slug: "devops", description: "DevOps 实践", parentId: categories.sre },
    { name: "Kubernetes", slug: "kubernetes", description: "K8s 容器编排", parentId: categories.sre },
    { name: "Docker", slug: "docker", description: "容器化技术", parentId: categories.sre },
    { name: "监控告警", slug: "monitoring", description: "监控与告警体系", parentId: categories.sre },
    { name: "CI/CD", slug: "cicd", description: "持续集成与部署", parentId: categories.sre },
  ];

  for (const sub of sreSubcategories) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: sub,
    });
  }

  // Create sub-categories for DBA
  const dbaSubcategories = [
    { name: "MySQL", slug: "mysql", description: "MySQL 数据库", parentId: categories.dba },
    { name: "PostgreSQL", slug: "postgresql", description: "PostgreSQL 数据库", parentId: categories.dba },
    { name: "Redis", slug: "redis-db", description: "Redis 缓存", parentId: categories.dba },
    { name: "MongoDB", slug: "mongodb", description: "MongoDB 文档数据库", parentId: categories.dba },
  ];

  for (const sub of dbaSubcategories) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: sub,
    });
  }

  // Create tags
  const tagNames = [
    "Kubernetes", "Docker", "MySQL", "PostgreSQL", "Redis",
    "Python", "Go", "TypeScript", "React", "Next.js",
    "Prometheus", "Grafana", "Terraform", "Ansible",
    "LLM", "RAG", "LangChain", "Flink", "Spark", "Kafka",
    "Linux", "Shell", "Git", "CI/CD", "DevOps",
  ];

  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      },
    });
  }

  // Create sample posts
  const posts = [
    {
      title: "MySQL 8.0 InnoDB 集群部署完全指南",
      slug: "mysql-innodb-cluster-guide",
      content: "<h2>前言</h2><p>MySQL InnoDB Cluster 是 MySQL 官方推出的高可用解决方案...</p>",
      excerpt: "详细讲解 MySQL InnoDB Cluster 的搭建步骤、故障切换机制和监控方案",
      categoryId: categories.dba,
      status: "PUBLISHED" as const,
      viewCount: 2341,
    },
    {
      title: "Kubernetes 高可用架构实战指南",
      slug: "k8s-ha-architecture",
      content: "<h2>控制平面高可用</h2><p>控制平面是 Kubernetes 的大脑...</p>",
      excerpt: "深入探讨 K8s 集群的高可用部署方案与故障转移策略",
      categoryId: categories.sre,
      status: "PUBLISHED" as const,
      viewCount: 1856,
    },
    {
      title: "RAG 系统设计：让 LLM 拥有你的知识库",
      slug: "rag-system-design",
      content: "<h2>什么是 RAG</h2><p>RAG (Retrieval-Augmented Generation) 是一种...</p>",
      excerpt: "基于 LangChain 构建检索增强生成系统的实战经验分享",
      categoryId: categories.ai,
      status: "PUBLISHED" as const,
      viewCount: 3421,
      isLocked: true,
    },
  ];

  for (const postData of posts) {
    await prisma.post.upsert({
      where: { slug: postData.slug },
      update: {},
      create: {
        ...postData,
        authorId: admin.id,
        publishedAt: new Date(),
      },
    });
  }

  // Create site config
  const configs = [
    { key: "site_name", value: "TechBlog" },
    { key: "site_logo", value: "T" },
    { key: "site_description", value: "探索技术的无限可能" },
    { key: "site_subtitle", value: "深耕 DBA、SRE、AI、大数据等领域，分享一线实战经验与技术思考" },
    { key: "author_name", value: "TechBlog 博主" },
    { key: "author_bio", value: "资深 SRE / DBA 工程师，热衷于云原生、数据库优化、AI 应用和大数据技术。多年一线运维和开发经验，曾参与多个大型分布式系统的架构设计与运维保障。这里记录我的技术沉淀和成长思考。" },
    { key: "author_avatar", value: "Dev" },
    { key: "author_skills", value: "Kubernetes,Docker,MySQL,PostgreSQL,Python,Go,Prometheus,Terraform,LLM,Flink" },
    { key: "github_url", value: "" },
    { key: "email", value: "" },
    { key: "icp_number", value: "" },
    { key: "wechat_qr_url", value: "/images/wechat-qr.png" },
    { key: "music_url", value: "" },
  ];

  for (const config of configs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
