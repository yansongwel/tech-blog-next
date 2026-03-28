import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于我",
  description: "了解博主的技术背景、技能栈和成长历程",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
