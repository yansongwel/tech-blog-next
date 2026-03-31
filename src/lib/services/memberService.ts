import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).+$/;

interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

interface RegisterResult {
  success: boolean;
  error?: string;
  user?: { id: string; email: string; username: string; role: string };
}

export async function registerMember(input: RegisterInput): Promise<RegisterResult> {
  const { email, username, password } = input;

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "请输入有效的邮箱地址" };
  }

  // Validate username
  if (!username || !USERNAME_REGEX.test(username)) {
    return {
      success: false,
      error: "用户名需 3-20 个字符，仅支持字母、数字和下划线",
    };
  }

  // Validate password
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { success: false, error: "密码至少需要 8 个字符" };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { success: false, error: "密码必须包含字母和数字" };
  }

  // Check email uniqueness
  const existingEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingEmail) {
    return { success: false, error: "该邮箱已被注册" };
  }

  // Check username uniqueness
  const existingUsername = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (existingUsername) {
    return { success: false, error: "该用户名已被占用" };
  }

  // Create user
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      name: username,
      passwordHash,
      role: "MEMBER",
      points: 0,
      level: 1,
      emailVerified: false,
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
    },
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username!,
      role: user.role,
    },
  };
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  if (!username || !USERNAME_REGEX.test(username)) return false;
  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  return !existing;
}

export function calculateLevel(points: number): number {
  return Math.floor(Math.sqrt(points / 10)) + 1;
}
