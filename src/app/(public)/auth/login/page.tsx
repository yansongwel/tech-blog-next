"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, LogIn } from "lucide-react";
import LoginCharacter from "@/components/auth/LoginCharacter";

export default function UserLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [triggerSuccess, setTriggerSuccess] = useState(false);
  const [triggerFail, setTriggerFail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("请填写邮箱和密码");
      return;
    }

    setLoading(true);
    setError("");
    setTriggerSuccess(false);
    setTriggerFail(false);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setTriggerFail(true);
        setError("邮箱或密码错误");
      } else {
        setTriggerSuccess(true);
        setTimeout(() => router.push("/"), 800);
      }
    } catch {
      setTriggerFail(true);
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Rive Character */}
        <LoginCharacter
          inputValue={email}
          isPasswordFocused={isPasswordFocused}
          triggerSuccess={triggerSuccess}
          triggerFail={triggerFail}
        />

        {/* Login Card */}
        <div className="glass rounded-2xl p-8 mt-4">
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            欢迎回来
          </h1>
          <p className="text-sm text-muted text-center mb-6">
            登录你的账号
          </p>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsPasswordFocused(false)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder="输入密码"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "登录中..." : "登录"}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted">还没有账号？</span>{" "}
            <Link
              href="/auth/register"
              className="text-primary-light hover:underline cursor-pointer"
            >
              立即注册
            </Link>
          </div>
          <div className="mt-2 text-center">
            <Link
              href="/login"
              className="text-xs text-muted hover:text-foreground/70 cursor-pointer"
            >
              管理员登录 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
