import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────

export interface ListPublicCommentsParams {
  postId: string;
}

export interface AdminListCommentsParams {
  page?: number;
  limit?: number;
  approved?: boolean | null;
  search?: string;
}

export interface CreateCommentInput {
  content: string;
  author: string;
  email: string;
  website?: string;
  postId: string;
  parentId?: string;
}

// ─── Helpers ─────────────────────────────────────────────

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "");

// ─── Public API ──────────────────────────────────────────

export async function listApprovedComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, approved: true, parentId: null },
    include: {
      replies: {
        where: { approved: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createComment(input: CreateCommentInput) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new Error("INVALID_EMAIL");
  }

  // Verify post exists
  const postExists = await prisma.post.findUnique({
    where: { id: input.postId },
    select: { id: true },
  });
  if (!postExists) throw new Error("POST_NOT_FOUND");

  return prisma.comment.create({
    data: {
      content: stripTags(input.content).slice(0, 2000),
      author: stripTags(input.author).slice(0, 50),
      email: input.email.slice(0, 100),
      website: input.website?.slice(0, 200) || null,
      postId: input.postId,
      parentId: input.parentId || null,
    },
  });
}

// ─── Admin API ───────────────────────────────────────────

export async function listAdminComments({
  page = 1,
  limit = 20,
  approved,
  search,
}: AdminListCommentsParams) {
  const safeLimit = Math.min(limit, 100);

  const where = {
    ...(approved !== null && approved !== undefined ? { approved } : {}),
    ...(search && {
      OR: [
        { content: { contains: search, mode: "insensitive" as const } },
        { author: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: { post: { select: { title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    comments,
    pagination: { page, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
  };
}

export async function approveComment(id: string, approved: boolean) {
  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!existing) throw new Error("COMMENT_NOT_FOUND");

  return prisma.comment.update({
    where: { id },
    data: { approved },
  });
}

export async function deleteComment(id: string) {
  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!existing) throw new Error("COMMENT_NOT_FOUND");

  // Delete replies first, then the comment
  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { parentId: id } }),
    prisma.comment.delete({ where: { id } }),
  ]);
}
