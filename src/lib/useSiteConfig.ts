"use client";

import { useSyncExternalStore, useCallback } from "react";

let cache: Record<string, string> = {};
let listeners: Array<() => void> = [];
let fetched = false;
let loaded = false;

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
        loaded = true;
        notify();
      }
    })
    .catch(() => {});
}

// Server snapshot is always empty — prevents hydration mismatch
const serverSnapshot: Record<string, string> = {};

export function useSiteConfig() {
  const getSnapshot = useCallback(() => cache, []);
  const getServerSnapshot = useCallback(() => serverSnapshot, []);
  const config = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!fetched) fetchConfig();

  return config;
}

/** Returns true once site config has been fetched from the API */
export function useSiteConfigLoaded() {
  const getSnapshot = useCallback(() => loaded, []);
  const getServerSnapshot = useCallback(() => false, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
