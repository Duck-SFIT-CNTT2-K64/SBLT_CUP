import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommentType } from "@prisma/client";

const VALID_TYPES: CommentType[] = ["TOURNAMENT", "GAME", "ANNOUNCEMENT"];

function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; entityId: string }> }
) {
  const { type, entityId } = await params;

  if (!VALID_TYPES.includes(type as CommentType)) {
    return NextResponse.json({ error: "Loại không hợp lệ" }, { status: 400 });
  }

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const repliesFor = searchParams.get("repliesFor");
  const repliesPage = parseInt(searchParams.get("repliesPage") || "1");

  // Load more replies for a specific comment
  if (repliesFor) {
    const replies = await prisma.comment.findMany({
      where: { parentId: repliesFor },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (repliesPage - 1) * 5,
      take: 5,
    });
    const totalReplies = await prisma.comment.count({ where: { parentId: repliesFor } });
    return NextResponse.json({
      data: replies,
      pagination: {
        page: repliesPage,
        total: totalReplies,
        totalPages: Math.ceil(totalReplies / 5),
      },
    });
  }

  const comments = await prisma.comment.findMany({
    where: {
      type: type as CommentType,
      entityId,
      parentId: null, // Only top-level comments
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, role: true },
      },
      replies: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 5, // Limit initial replies shown
      },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.comment.count({
    where: {
      type: type as CommentType,
      entityId,
      parentId: null,
    },
  });

  return NextResponse.json({
    data: comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; entityId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, entityId } = await params;

  if (!VALID_TYPES.includes(type as CommentType)) {
    return NextResponse.json({ error: "Loại không hợp lệ" }, { status: 400 });
  }

  const body = await req.json();
  const { content, parentId } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Nội dung không được để trống" }, { status: 400 });
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: "Nội dung tối đa 1000 ký tự" }, { status: 400 });
  }

  // If replying, verify parent comment exists
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
    });
    if (!parent || parent.entityId !== entityId) {
      return NextResponse.json({ error: "Bình luận gốc không tồn tại" }, { status: 400 });
    }
  }

  const comment = await prisma.comment.create({
    data: {
      userId: session.user.id,
      type: type as CommentType,
      entityId,
      content: sanitizeHtml(content.trim()),
      parentId,
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, role: true },
      },
      _count: { select: { replies: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; entityId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const commentId = searchParams.get("commentId");

  if (!commentId) {
    return NextResponse.json({ error: "Thiếu commentId" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    return NextResponse.json({ error: "Không tìm thấy bình luận" }, { status: 404 });
  }

  // Only allow deletion by comment owner or admin
  if (comment.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền xóa bình luận này" }, { status: 403 });
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return NextResponse.json({ success: true });
}
