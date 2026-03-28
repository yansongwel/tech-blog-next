"use client";

import { useState, useRef, useEffect } from "react";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element - replace with your actual music file
    audioRef.current = new Audio("/music/bg-music.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        // Autoplay blocked by browser
      });
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !muted;
    setMuted(!muted);
  };

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
