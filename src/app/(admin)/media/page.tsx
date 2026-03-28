"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, Trash2, Loader2, Image as ImageIcon, Copy, Check } from "lucide-react";

interface Media {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = () => {
    setLoading(true);
    fetch("/api/admin/media")
      .then((res) => res.json())
      .then((data) => setMedia(data.media || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        await fetch("/api/admin/media", { method: "POST", body: formData });
      } catch {}
    }
    setUploading(false);
    fetchMedia();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`确定删除「${filename}」？`)) return;
    await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
    fetchMedia();
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">媒体库</h1>
        <label className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? "上传中..." : "上传图片"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : media.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted mb-4">暂无媒体文件</p>
          <label className="text-primary-light hover:text-primary cursor-pointer">
            上传第一张图片
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item) => (
            <div key={item.id} className="glass rounded-xl overflow-hidden group">
              <div className="relative aspect-square bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.filename}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleCopy(item.url, item.id)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer"
                    title="复制链接"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.filename)}
                    className="p-2 bg-white/10 hover:bg-red-500/30 rounded-lg cursor-pointer"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs text-foreground truncate">{item.filename}</p>
                <p className="text-xs text-muted">{formatSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
