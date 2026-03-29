import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────

export interface ListPostsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: "latest" | "popular" | "comments";
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
  lockType?: string;
  lockPassword?: string | null;
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
  lockType?: string;
  lockPassword?: string | null;
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

  // Upsert tags, then replace post-tag links in a single interactive transaction
  // to eliminate the race window between upsert and findMany
  await prisma.$transaction(async (tx) => {
    // Upsert all tags
    for (let i = 0; i < tagNames.length; i++) {
      await tx.tag.upsert({
        where: { slug: slugs[i] },
        update: {},
        create: { name: tagNames[i], slug: slugs[i] },
      });
    }

    // Fetch tag IDs within the same transaction
    const tags = await tx.tag.findMany({ where: { slug: { in: slugs } } });

    // Replace post-tag links
    await tx.postTag.deleteMany({ where: { postId } });
    await tx.postTag.createMany({
      data: tags.map((tag) => ({ postId, tagId: tag.id })),
      skipDuplicates: true,
    });
  });
}

// ─── Public API ──────────────────────────────────────────

export async function listPublishedPosts({ page = 1, limit = 12, category, search, sort = "latest" }: ListPostsParams) {
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
      orderBy: sort === "popular" ? { viewCount: "desc" as const } : { publishedAt: "desc" as const },
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

  const [relatedPosts, comments, prevPost, nextPost] = await Promise.all([
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
    // Previous post (older)
    prisma.post.findFirst({
      where: { status: "PUBLISHED", publishedAt: { lt: post.publishedAt || post.createdAt } },
      select: { title: true, slug: true },
      orderBy: { publishedAt: "desc" },
    }),
    // Next post (newer)
    prisma.post.findFirst({
      where: { status: "PUBLISHED", publishedAt: { gt: post.publishedAt || post.createdAt } },
      select: { title: true, slug: true },
      orderBy: { publishedAt: "asc" },
    }),
  ]);

  // Strip lockPassword from response (never expose to frontend)
  const { lockPassword: _, ...safePost } = post;
  return { ...safePost, viewCount: post.viewCount + 1, relatedPosts, comments, prevPost, nextPost };
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
      lockType: data.lockType || "none",
      lockPassword: data.lockPassword || null,
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
  if (fields.lockType !== undefined) updateData.lockType = fields.lockType;
  if (fields.lockPassword !== undefined) updateData.lockPassword = fields.lockPassword;
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
