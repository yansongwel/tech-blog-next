import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PostDetail from "@/components/blog/PostDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      category: { select: { name: true } },
    },
  });

  if (!post) {
    return { title: "文章未找到" };
  }

  return {
    title: post.title,
    description: post.excerpt || `${post.title} - ${post.category.name}`,
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      type: "article",
      ...(post.coverImage && { images: [post.coverImage] }),
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PostDetail slug={slug} />;
}
