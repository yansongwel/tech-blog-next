import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cyber Gallery",
  description: "3D 赛博朋克风格相册，支持星球、DNA、漩涡、矩阵、心形五种布局",
};

export default function AlbumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
