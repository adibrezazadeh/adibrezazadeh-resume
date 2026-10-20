"use client";

import { useEffect, useState } from "react";

export function useMaxWidth(px: number) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${px}px)`);
    const apply = () => setMatch(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [px]);
  return match;
}
