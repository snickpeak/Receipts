import React, { createContext, useContext, useMemo, useRef } from "react";

export type PhotoHeroPayload = {
  entryId: string;
  uri: string;
  /** Window coordinates & size from measureInWindow (source thumbnail). */
  x: number;
  y: number;
  width: number;
  height: number;
};

type PhotoHeroApi = {
  preparePhotoHero: (payload: PhotoHeroPayload) => void;
  takePhotoHeroForEntry: (entryId: string) => PhotoHeroPayload | null;
};

const PhotoHeroContext = createContext<PhotoHeroApi | null>(null);

export function PhotoHeroProvider({ children }: { children: React.ReactNode }) {
  const pendingRef = useRef<PhotoHeroPayload | null>(null);

  const api = useMemo(
    (): PhotoHeroApi => ({
      preparePhotoHero(payload: PhotoHeroPayload) {
        pendingRef.current = payload;
      },
      takePhotoHeroForEntry(entryId: string) {
        const p = pendingRef.current;
        pendingRef.current = null;
        if (!p || p.entryId !== entryId) return null;
        return p;
      },
    }),
    [],
  );

  return <PhotoHeroContext.Provider value={api}>{children}</PhotoHeroContext.Provider>;
}

export function usePhotoHero() {
  const ctx = useContext(PhotoHeroContext);
  if (!ctx) throw new Error("usePhotoHero must be used inside PhotoHeroProvider");
  return ctx;
}

/** Reads and consumes pending hero data once per `entryId` navigation (first render of detail). */
export function useConsumedPhotoHero(entryId: string | undefined): PhotoHeroPayload | null {
  const ctx = useContext(PhotoHeroContext);
  const cache = useRef<{ entryId: string | null; payload: PhotoHeroPayload | null }>({
    entryId: null,
    payload: null,
  });
  if (!entryId || !ctx) return null;
  if (cache.current.entryId !== entryId) {
    cache.current = { entryId, payload: ctx.takePhotoHeroForEntry(entryId) };
  }
  return cache.current.payload;
}
