"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, User, Check, X } from "lucide-react";
import LoginCharacter from "@/components/auth/LoginCharacter";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [triggerSuccess, setTriggerSuccess] = useState(false);
  const [triggerFail, setTriggerFail] = useState(false);

  // Username availability check
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  const checkUsername = useCallback(async (name: string) => {
    if (!name || name.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await fetch(
        `/api/auth/check-username?username=${encodeURIComponent(name)}`,
      );
      const data = await res.json();
      setUsernameStatus(data.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  // Password validation
  const passwordValid = password.length >= 8 && /^(?=.*[a-zA-Z])(?=.*\d)/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTriggerSuccess(false);
    setTriggerFail(false);

    if (!email.trim()) {
      setError("请填写邮箱");
      return;
    }
    if (usernameStatus !== "available") {
      setError("请输入可用的用户名");
      return;
    }
    if (!passwordValid) {
      setError("密码至少 8 个字符，需包含字母和数字");
      return;
    }
    if (!passwordsMatch) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTriggerFail(true);
        setError(data.error || "注册失败");
        setLoading(false);
        return;
      }

      // Auto login after registration
      setTriggerSuccess(true);
      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        // Registration succeeded but auto-login failed, redirect to login
        setTimeout(() => router.push("/auth/login"), 800);
      } else {
        setTimeout(() => router.push("/"), 800);
      }
    } catch {
      setTriggerFail(true);
      setError("注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // Character tracks the currently focused non-password field
  const activeInput = isPasswordFocused ? "" : email || username;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Rive Character */}
        <LoginCharacter
          inputValue={activeInput}
          isPasswordFocused={isPasswordFocused}
          triggerSuccess={triggerSuccess}
          triggerFail={triggerFail}
        />

        {/* Register Card */}
        <div className="glass rounded-2xl p-8 mt-4">
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            创建账号
          </h1>
          <p className="text-sm text-muted text-center mb-6">
            加入社区，参与技术讨论
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

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setIsPasswordFocused(false)}
                  placeholder="3-20 个字符（字母、数字、下划线）"
                  className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  autoComplete="username"
                />
                {/* Username status indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted" />
                  )}
                  {usernameStatus === "available" && (
                    <Check className="w-4 h-4 text-green-400" />
                  )}
                  {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>
              {usernameStatus === "taken" && (
                <p className="text-xs text-red-400 mt-1">该用户名已被占用</p>
              )}
              {usernameStatus === "invalid" && (
                <p className="text-xs text-red-400 mt-1">
                  仅支持字母、数字和下划线，3-20 个字符
                </p>
              )}
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
                  placeholder="至少 8 个字符，需包含字母和数字"
                  className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  autoComplete="new-password"
                />
                {password.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {passwordValid ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder="再次输入密码"
                  className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  autoComplete="new-password"
                />
                {confirmPassword.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {passwordsMatch ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                )}
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
                <User className="w-4 h-4" />
              )}
              {loading ? "注册中..." : "注册"}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted">已有账号？</span>{" "}
            <Link
              href="/auth/login"
              className="text-primary-light hover:underline cursor-pointer"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
