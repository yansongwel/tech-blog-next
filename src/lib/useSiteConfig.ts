"use client";

import { useSyncExternalStore, useCallback } from "react";

let cache: Record<string, string> = {};
let listeners: Array<() => void> = [];
let fetched = false;

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

function fetchConfig() {
  if (fetched) return;
  fetched = true;
  fetch("/api/site-config")
    .then((r) => r.json())
    .then((data) => {
      if (data && !data.error) {
        cache = data;
        notify();
      }
    })
    .catch(() => {});
}

export function useSiteConfig() {
  const getSnapshot = useCallback(() => cache, []);
  const config = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!fetched) fetchConfig();

  return config;
}
