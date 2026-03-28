"use client";

function Bone({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface-light rounded ${className}`} />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <Bone className="h-48 rounded-none" />
      <div className="p-5 space-y-3">
        <Bone className="h-5 w-3/4" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-1/2" />
        <div className="flex gap-4 pt-2">
          <Bone className="h-3 w-12" />
          <Bone className="h-3 w-12" />
          <Bone className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function PostGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Bone className="h-4 w-32" />
      <div className="space-y-3">
        <Bone className="h-6 w-20" />
        <Bone className="h-10 w-3/4" />
        <div className="flex gap-4">
          <Bone className="h-4 w-20" />
          <Bone className="h-4 w-24" />
          <Bone className="h-4 w-20" />
        </div>
      </div>
      <div className="glass rounded-2xl p-10 space-y-4">
        <Bone className="h-6 w-48" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
        <Bone className="h-32 w-full" />
        <Bone className="h-6 w-40" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
      </div>
    </div>
  );
}
