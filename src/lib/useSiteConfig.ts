"use client";

import { useEffect, useState } from "react";

const cache: { data: Record<string, string> | null; promise: Promise<Record<string, string>> | null } = {
  data: null,
  promise: null,
};

export function useSiteConfig() {
  const [config, setConfig] = useState<Record<string, string>>(cache.data || {});

  useEffect(() => {
    if (cache.data) {
      setConfig(cache.data);
      return;
    }
    if (!cache.promise) {
      cache.promise = fetch("/api/site-config")
        .then((r) => r.json())
        .then((data) => {
          cache.data = data;
          return data;
        })
        .catch(() => ({}));
    }
    cache.promise.then((data) => setConfig(data));
  }, []);

  return config;
}
