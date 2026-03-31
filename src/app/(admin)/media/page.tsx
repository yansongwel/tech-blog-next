"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, Trash2, Loader2, Image as ImageIcon, Copy, Check, X } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; status: "pending" | "uploading" | "done" | "error" }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const toast = useToast();
  const [confirmModal, setConfirmModal] = useState<{open: boolean, title: string, message: string, onConfirm: () => void}>({open: false, title: "", message: "", onConfirm: () => {}});

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

    const fileList = Array.from(files);
    // Validate file sizes
    const oversized = fileList.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.warning(`以下文件超过 10MB 限制：${oversized.map((f) => f.name).join("、")}`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    const progress = fileList.map((f) => ({ name: f.name, status: "pending" as const }));
    setUploadProgress([...progress]);

    for (let i = 0; i < fileList.length; i++) {
      setUploadProgress((prev) => prev.map((p, j) => j === i ? { ...p, status: "uploading" } : p));
      const formData = new FormData();
      formData.append("file", fileList[i]);
      try {
        const res = await fetch("/api/admin/media", { method: "POST", body: formData });
        setUploadProgress((prev) => prev.map((p, j) => j === i ? { ...p, status: res.ok ? "done" : "error" } : p));
      } catch {
        setUploadProgress((prev) => prev.map((p, j) => j === i ? { ...p, status: "error" } : p));
      }
    }
    setUploading(false);
    toast.success("上传成功");
    fetchMedia();
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Clear progress after 3 seconds
    setTimeout(() => setUploadProgress([]), 3000);
  };

  const handleDelete = (id: string, filename: string) => {
    setConfirmModal({
      open: true,
      title: "删除文件",
      message: `确定删除「${filename}」？`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("已删除");
          } else {
            toast.error("删除失败");
          }
        } catch {
          toast.error("网络错误，请重试");
        }
        fetchMedia();
      },
    });
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

      {/* Upload progress */}
      {uploadProgress.length > 0 && (
        <div className="mb-4 glass rounded-xl p-4 space-y-2 animate-fade-in">
          {uploadProgress.map((p, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              {p.status === "uploading" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
              {p.status === "done" && <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />}
              {p.status === "error" && <X className="w-3.5 h-3.5 text-red-400 shrink-0" />}
              {p.status === "pending" && <div className="w-3.5 h-3.5 rounded-full bg-muted/30 shrink-0" />}
              <span className={`truncate ${p.status === "error" ? "text-red-400" : "text-foreground/80"}`}>{p.name}</span>
              <span className="text-xs text-muted ml-auto shrink-0">
                {p.status === "uploading" ? "上传中" : p.status === "done" ? "完成" : p.status === "error" ? "失败" : "等待"}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted mb-4">支持 JPG、PNG、GIF、WebP、SVG，单文件最大 10MB</p>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <div className="aspect-square bg-surface" />
              <div className="p-2"><div className="h-3 bg-surface rounded w-3/4" /></div>
            </div>
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <ImageIcon className="w-16 h-16 text-muted/30 mx-auto mb-4" />
          <p className="text-lg text-foreground/70 mb-2">媒体库为空</p>
          <p className="text-sm text-muted mb-6">上传图片来丰富你的文章内容</p>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors cursor-pointer">
            上传图片
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
                  loading="lazy"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreviewUrl(item.url)}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = "none";
                    // Show fallback icon
                    const fallback = img.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div className="absolute inset-0 items-center justify-center text-muted hidden">
                  <ImageIcon className="w-8 h-8" />
                </div>
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

      {/* Lightbox preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="预览"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
      <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} danger onConfirm={() => { confirmModal.onConfirm(); setConfirmModal(prev => ({...prev, open: false})); }} onCancel={() => setConfirmModal(prev => ({...prev, open: false}))} />
    </div>
  );
}
