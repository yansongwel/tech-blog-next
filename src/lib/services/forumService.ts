import { prisma } from "@/lib/prisma";

// ==================== Forum Categories ====================

export async function getForumCategories() {
  return prisma.forumCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { posts: true } },
    },
  });
}

// ==================== Forum Posts ====================

interface ListPostsOptions {
  categorySlug?: string;
  sort?: "latest" | "hot" | "unanswered";
  page?: number;
  limit?: number;
  search?: string;
}

export async function listForumPosts(options: ListPostsOptions = {}) {
  const { categorySlug, sort = "latest", page = 1, limit = 20, search } = options;

  const where: Record<string, unknown> = {};
  if (categorySlug) {
    where.category = { slug: categorySlug };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }
  if (sort === "unanswered") {
    where.replyCount = 0;
  }

  const orderBy =
    sort === "hot"
      ? [{ isPinned: "desc" as const }, { voteScore: "desc" as const }, { createdAt: "desc" as const }]
      : [{ isPinned: "desc" as const }, { createdAt: "desc" as const }];

  const [posts, total] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, username: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: true } },
        _count: { select: { replies: true, votes: true } },
      },
    }),
    prisma.forumPost.count({ where }),
  ]);

  return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getForumPost(slug: string) {
  const post = await prisma.forumPost.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, username: true, name: true, avatar: true, level: true, points: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
      tags: { include: { tag: true } },
      replies: {
        orderBy: [{ isAccepted: "desc" }, { voteScore: "desc" }, { createdAt: "asc" }],
        include: {
          author: { select: { id: true, username: true, name: true, avatar: true, level: true } },
          _count: { select: { replies: true, votes: true } },
        },
      },
      _count: { select: { replies: true, votes: true } },
    },
  });

  if (post) {
    // Increment view count
    await prisma.forumPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return post;
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}

interface CreatePostInput {
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  tags?: string[];
}

export async function createForumPost(input: CreatePostInput) {
  const { title, content, categoryId, authorId, tags = [] } = input;
  const slug = generateSlug(title);

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.forumPost.create({
      data: {
        title,
        slug,
        content,
        categoryId,
        authorId,
      },
    });

    // Create tags
    if (tags.length > 0) {
      for (const tagName of tags) {
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, "-");
        const tag = await tx.forumTag.upsert({
          where: { slug: tagSlug },
          create: { name: tagName, slug: tagSlug },
          update: {},
        });
        await tx.forumPostTag.create({
          data: { postId: created.id, tagId: tag.id },
        });
      }
    }

    // Award points: +5 for creating a post
    await tx.user.update({
      where: { id: authorId },
      data: {
        points: { increment: 5 },
        level: { set: calculateLevel(await tx.user.findUnique({ where: { id: authorId }, select: { points: true } }).then(u => (u?.points ?? 0) + 5)) },
      },
    });

    return created;
  });

  return post;
}

// ==================== Forum Replies ====================

interface CreateReplyInput {
  content: string;
  postId: string;
  authorId: string;
  parentId?: string;
}

export async function createForumReply(input: CreateReplyInput) {
  const { content, postId, authorId, parentId } = input;

  const reply = await prisma.$transaction(async (tx) => {
    const created = await tx.forumReply.create({
      data: {
        content,
        postId,
        authorId,
        parentId: parentId || null,
      },
    });

    // Update post reply count and last reply time
    await tx.forumPost.update({
      where: { id: postId },
      data: {
        replyCount: { increment: 1 },
        lastReplyAt: new Date(),
      },
    });

    // Award points: +2 for replying
    await tx.user.update({
      where: { id: authorId },
      data: {
        points: { increment: 2 },
        level: { set: calculateLevel(await tx.user.findUnique({ where: { id: authorId }, select: { points: true } }).then(u => (u?.points ?? 0) + 2)) },
      },
    });

    return created;
  });

  return reply;
}

// ==================== Voting ====================

interface VoteInput {
  userId: string;
  value: 1 | -1;
  postId?: string;
  replyId?: string;
}

export async function vote(input: VoteInput) {
  const { userId, value, postId, replyId } = input;

  if (!postId && !replyId) throw new Error("Must provide postId or replyId");

  return prisma.$transaction(async (tx) => {
    // Check existing vote
    if (postId) {
      const existing = await tx.forumVote.findUnique({
        where: { userId_postId: { userId, postId } },
      });

      if (existing) {
        if (existing.value === value) {
          // Remove vote (toggle off)
          await tx.forumVote.delete({ where: { id: existing.id } });
          await tx.forumPost.update({
            where: { id: postId },
            data: { voteScore: { decrement: value } },
          });
          return { action: "removed", voteScore: 0 };
        } else {
          // Change vote direction
          await tx.forumVote.update({ where: { id: existing.id }, data: { value } });
          await tx.forumPost.update({
            where: { id: postId },
            data: { voteScore: { increment: value * 2 } },
          });
          return { action: "changed", voteScore: value };
        }
      }

      // New vote
      await tx.forumVote.create({ data: { userId, value, postId } });
      await tx.forumPost.update({
        where: { id: postId },
        data: { voteScore: { increment: value } },
      });

      // Award point to post author for upvote
      if (value === 1) {
        const post = await tx.forumPost.findUnique({ where: { id: postId }, select: { authorId: true } });
        if (post && post.authorId !== userId) {
          await tx.user.update({ where: { id: post.authorId }, data: { points: { increment: 1 } } });
        }
      }

      return { action: "voted", voteScore: value };
    }

    // Reply vote
    if (replyId) {
      const existing = await tx.forumVote.findUnique({
        where: { userId_replyId: { userId, replyId } },
      });

      if (existing) {
        if (existing.value === value) {
          await tx.forumVote.delete({ where: { id: existing.id } });
          await tx.forumReply.update({ where: { id: replyId }, data: { voteScore: { decrement: value } } });
          return { action: "removed", voteScore: 0 };
        } else {
          await tx.forumVote.update({ where: { id: existing.id }, data: { value } });
          await tx.forumReply.update({ where: { id: replyId }, data: { voteScore: { increment: value * 2 } } });
          return { action: "changed", voteScore: value };
        }
      }

      await tx.forumVote.create({ data: { userId, value, replyId } });
      await tx.forumReply.update({ where: { id: replyId }, data: { voteScore: { increment: value } } });

      if (value === 1) {
        const reply = await tx.forumReply.findUnique({ where: { id: replyId }, select: { authorId: true } });
        if (reply && reply.authorId !== userId) {
          await tx.user.update({ where: { id: reply.authorId }, data: { points: { increment: 1 } } });
        }
      }

      return { action: "voted", voteScore: value };
    }

    return { action: "none", voteScore: 0 };
  });
}

// ==================== Solve ====================

export async function markSolved(postId: string, replyId: string, userId: string) {
  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) throw new Error("帖子不存在");
  if (post.authorId !== userId) throw new Error("只有帖子作者可以标记已解决");

  return prisma.$transaction(async (tx) => {
    await tx.forumPost.update({
      where: { id: postId },
      data: { isSolved: true, solvedReplyId: replyId },
    });
    await tx.forumReply.update({
      where: { id: replyId },
      data: { isAccepted: true },
    });

    // Award +10 points to reply author
    const reply = await tx.forumReply.findUnique({ where: { id: replyId }, select: { authorId: true } });
    if (reply) {
      await tx.user.update({
        where: { id: reply.authorId },
        data: { points: { increment: 10 } },
      });
    }

    return { success: true };
  });
}

// ==================== Helpers ====================

function calculateLevel(points: number): number {
  return Math.floor(Math.sqrt(points / 10)) + 1;
}
