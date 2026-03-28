"use client";

import {
  GitBranch,
  Mail,
  MapPin,
  Briefcase,
  Award,
  BookOpen,
  Code2,
} from "lucide-react";
import { useSiteConfig } from "@/lib/useSiteConfig";

const defaultSkills = [
  { category: "DBA", items: ["MySQL", "PostgreSQL", "Redis", "MongoDB", "ClickHouse"] },
  { category: "SRE/DevOps", items: ["Kubernetes", "Docker", "Terraform", "Ansible", "Prometheus", "Grafana"] },
  { category: "AI", items: ["LLM", "RAG", "LangChain", "PyTorch", "向量数据库"] },
  { category: "大数据", items: ["Flink", "Spark", "Kafka", "Hive", "Hadoop"] },
  { category: "编程语言", items: ["Python", "Go", "TypeScript", "Shell", "SQL"] },
];

const timeline = [
  { year: "2024", title: "AI 工程化实践", desc: "深入 LLM 应用开发，构建企业级 RAG 系统" },
  { year: "2023", title: "云原生架构师", desc: "主导公司全面上云与容器化改造" },
  { year: "2022", title: "SRE 团队负责人", desc: "搭建完善的监控告警体系与 SRE 文化" },
  { year: "2020", title: "资深 DBA", desc: "负责千亿级数据量的数据库架构设计与优化" },
  { year: "2018", title: "运维工程师", desc: "开始系统学习自动化运维与 DevOps 实践" },
];

export default function AboutPage() {
  const config = useSiteConfig();

  const authorName = config.author_name || "TechBlog 博主";
  const authorBio = config.author_bio || "";
  const authorAvatar = config.author_avatar || "Dev";
  const githubUrl = config.github_url;
  const emailAddr = config.email;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile card */}
      <section className="glass rounded-2xl p-8 md:p-12 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-5xl font-bold text-white shrink-0 animate-pulse-glow">
            {authorAvatar}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {authorName}
            </h1>
            <p className="text-muted mb-4 leading-relaxed">
              {authorBio}
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-muted">
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" /> SRE / DBA
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> 中国
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> 技术博主
              </span>
            </div>
            <div className="flex gap-3 mt-4 justify-center md:justify-start">
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="p-2 glass rounded-lg text-muted hover:text-foreground transition-colors">
                  <GitBranch className="w-5 h-5" />
                </a>
              )}
              {emailAddr && (
                <a href={`mailto:${emailAddr}`} className="p-2 glass rounded-lg text-muted hover:text-foreground transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold gradient-text mb-6 flex items-center gap-2">
          <Code2 className="w-6 h-6" /> 技术栈
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultSkills.map((group) => (
            <div key={group.category} className="glass rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">
                {group.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 text-xs bg-primary/10 text-primary-light border border-primary/20 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section>
        <h2 className="text-2xl font-bold gradient-text mb-6 flex items-center gap-2">
          <Award className="w-6 h-6" /> 成长历程
        </h2>
        <div className="space-y-0">
          {timeline.map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1.5" />
                {i < timeline.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border" />
                )}
              </div>
              <div className="pb-8">
                <span className="text-xs font-mono text-accent">{item.year}</span>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
