"use client";

import { useState, useRef, useEffect } from "react";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useSiteConfig } from "@/lib/useSiteConfig";

export default function MusicPlayer() {
  const config = useSiteConfig();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasMusic, setHasMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const musicUrl = config.music_url;
    if (!musicUrl) {
      setHasMusic(false);
      return;
    }

    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.3;

    // Only show player if audio can load
    audio.addEventListener("canplaythrough", () => setHasMusic(true));
    audio.addEventListener("error", () => setHasMusic(false));
    audio.load();

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeAttribute("src");
    };
  }, [config.music_url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !muted;
    setMuted(!muted);
  };

  // Don't render if no music configured or file can't load
  if (!hasMusic) return null;

  return (
    <div className="music-player">
      <div
        className={`glass rounded-full transition-all duration-300 flex items-center gap-2 ${
          expanded ? "px-4 py-3" : "p-3"
        }`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {expanded && (
          <>
            <button
              onClick={toggleMute}
              className="text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <span className="text-xs text-muted whitespace-nowrap">
              BGM
            </span>
          </>
        )}
        <button
          onClick={togglePlay}
          className="text-primary-light hover:text-primary transition-colors cursor-pointer"
        >
          {playing ? (
            <Pause className="w-5 h-5" />
          ) : expanded ? (
            <Play className="w-5 h-5" />
          ) : (
            <Music
              className={`w-5 h-5 ${playing ? "animate-pulse" : ""}`}
            />
          )}
        </button>
      </div>
    </div>
  );
}
