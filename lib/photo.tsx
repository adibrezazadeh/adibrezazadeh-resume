"use client";

import { createContext, useContext, type ReactNode } from "react";

// The portrait's URL, or null when public/me.jpg is not there. Decided on the server, so a
// missing photo never turns into a broken image or a 404 in the console.
const PhotoContext = createContext<string | null>(null);

export function PhotoProvider({ photo, children }: { photo: string | null; children: ReactNode }) {
  return <PhotoContext.Provider value={photo}>{children}</PhotoContext.Provider>;
}

export function usePhoto() {
  return useContext(PhotoContext);
}
