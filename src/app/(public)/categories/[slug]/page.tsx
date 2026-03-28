import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CategoryPosts from "@/components/blog/CategoryPosts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!category) {
    return { title: "分类未找到" };
  }

  return {
    title: `${category.name} - 文章列表`,
    description: category.description || `${category.name} 分类下的所有文章`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryPosts slug={slug} />;
}
