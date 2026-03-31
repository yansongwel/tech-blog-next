"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface VoteButtonProps {
  score: number;
  postId?: string;
  replyId?: string;
  userVote?: number; // 1, -1, or 0
}

export default function VoteButton({ score, postId, replyId, userVote = 0 }: VoteButtonProps) {
  const [currentScore, setCurrentScore] = useState(score);
  const [currentVote, setCurrentVote] = useState(userVote);
  const [loading, setLoading] = useState(false);

  const handleVote = async (value: 1 | -1) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/forum/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, postId, replyId }),
      });

      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.action === "removed") {
          setCurrentScore(currentScore - (currentVote));
          setCurrentVote(0);
        } else if (data.action === "changed") {
          setCurrentScore(currentScore + value * 2);
          setCurrentVote(value);
        } else {
          setCurrentScore(currentScore + value);
          setCurrentVote(value);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`p-1 rounded transition-colors cursor-pointer ${
          currentVote === 1
            ? "text-primary bg-primary/10"
            : "text-muted hover:text-foreground hover:bg-white/5"
        }`}
      >
        <ChevronUp className="w-5 h-5" />
      </button>
      <span className={`text-sm font-semibold ${
        currentScore > 0 ? "text-primary-light" : currentScore < 0 ? "text-red-400" : "text-muted"
      }`}>
        {currentScore}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`p-1 rounded transition-colors cursor-pointer ${
          currentVote === -1
            ? "text-red-400 bg-red-500/10"
            : "text-muted hover:text-foreground hover:bg-white/5"
        }`}
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
}
