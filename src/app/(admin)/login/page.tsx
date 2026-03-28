"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Will integrate with NextAuth signIn()
    try {
      const { signIn } = await import("next-auth/react");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码错误");
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-2xl mb-4">
            T
          </div>
          <h1 className="text-2xl font-bold gradient-text">TechBlog Admin</h1>
          <p className="text-muted text-sm mt-1">登录后台管理系统</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-foreground mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-foreground mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-light disabled:opacity-50 text-white rounded-lg font-medium transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
