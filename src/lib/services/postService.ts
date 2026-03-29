import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────

export interface ListPostsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export interface AdminListPostsParams {
  page?: number;
  limit?: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  search?: string;
}

type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface CreatePostInput {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  status?: PostStatus;
  isLocked?: boolean;
  categoryId: string;
  authorId: string;
  tags?: string[];
}

export interface UpdatePostInput {
  id: string;
  title?: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  categoryId?: string;
  status?: PostStatus;
  isLocked?: boolean;
  tags?: string[];
}

// ─── Helpers ─────────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = `${baseSlug}-${Date.now().toString(36)}`;
  const existing = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    slug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}

/**
 * Sync tags for a post: upsert all tags in a batch, then replace the post-tag links.
 * Unified implementation that avoids N+1 queries.
 */
async function syncTags(postId: string, tagNames: string[]): Promise<void> {
  if (tagNames.length === 0) {
    await prisma.postTag.deleteMany({ where: { postId } });
    return;
  }

  const slugs = tagNames.map((t) => t.toLowerCase().replace(/\s+/g, "-"));

  // Batch upsert all tags in a single transaction
  await prisma.$transaction(
    tagNames.map((name, i) =>
      prisma.tag.upsert({
        where: { slug: slugs[i] },
        update: {},
        create: { name, slug: slugs[i] },
      })
    )
  );

  const tags = await prisma.tag.findMany({ where: { slug: { in: slugs } } });

  // Replace all post-tag links atomically
  await prisma.$transaction([
    prisma.postTag.deleteMany({ where: { postId } }),
    prisma.postTag.createMany({
      data: tags.map((tag) => ({ postId, tagId: tag.id })),
      skipDuplicates: true,
    }),
  ]);
}

// ─── Public API ──────────────────────────────────────────

export async function listPublishedPosts({ page = 1, limit = 12, category, search }: ListPostsParams) {
  const safeLimit = Math.min(limit, 50);

  const where = {
    status: "PUBLISHED" as const,
    ...(category && { category: { slug: category } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { content: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    pagination: { page, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
  };
}

export async function getPostBySlug(slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true } },
      author: { select: { name: true, avatar: true } },
      tags: { include: { tag: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!post) return null;

  // Fire-and-forget view count increment
  prisma.post
    .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const [relatedPosts, comments] = await Promise.all([
    prisma.post.findMany({
      where: {
        categoryId: post.categoryId,
        id: { not: post.id },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        viewCount: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.comment.findMany({
      where: { postId: post.id, approved: true, parentId: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        author: true,
        createdAt: true,
        replies: {
          where: { approved: true },
          select: { id: true, content: true, author: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ]);

  return { ...post, viewCount: post.viewCount + 1, relatedPosts, comments };
}

export async function createPost(input: CreatePostInput) {
  const { tags, ...data } = input;

  // Verify category exists
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new Error("INVALID_CATEGORY");

  const slug = await ensureUniqueSlug(generateSlug(data.title));

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || null,
      coverImage: data.coverImage || null,
      status: data.status ?? "DRAFT",
      isLocked: data.isLocked || false,
      authorId: data.authorId,
      categoryId: data.categoryId,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });

  if (tags?.length) {
    await syncTags(post.id, tags);
  }

  return post;
}

// ─── Admin API ───────────────────────────────────────────

export async function listAdminPosts({ page = 1, limit = 20, status, search }: AdminListPostsParams) {
  const safeLimit = Math.min(limit, 100);

  const where = {
    ...(status && { status }),
    ...(search && {
      title: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    pagination: { page, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
  };
}

export async function updatePost(input: UpdatePostInput) {
  const { id, tags, ...fields } = input;

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) throw new Error("POST_NOT_FOUND");

  const updateData: Record<string, unknown> = {};
  if (fields.title !== undefined) updateData.title = fields.title;
  if (fields.content !== undefined) updateData.content = fields.content;
  if (fields.excerpt !== undefined) updateData.excerpt = fields.excerpt;
  if (fields.coverImage !== undefined) updateData.coverImage = fields.coverImage;
  if (fields.categoryId !== undefined) updateData.categoryId = fields.categoryId;
  if (fields.isLocked !== undefined) updateData.isLocked = fields.isLocked;
  if (fields.status !== undefined) {
    updateData.status = fields.status;
    if (fields.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }
  }

  const post = await prisma.post.update({ where: { id }, data: updateData });

  if (tags !== undefined) {
    await syncTags(id, tags);
  }

  return post;
}

export async function deletePost(id: string) {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) throw new Error("POST_NOT_FOUND");

  await prisma.$transaction([
    prisma.postTag.deleteMany({ where: { postId: id } }),
    prisma.like.deleteMany({ where: { postId: id } }),
    prisma.comment.deleteMany({ where: { postId: id } }),
    prisma.post.delete({ where: { id } }),
  ]);
}
