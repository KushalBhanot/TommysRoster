"use client";

import { useEffect } from "react";

/**
 * Stops the page behind a dialog from scrolling for as long as the dialog is
 * on screen. The lock comes off when the dialog goes away, including when the
 * person presses Back and Next hides the page with the dialog still open.
 */
export function useScrollLock() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dialog-open");
    return () => root.classList.remove("dialog-open");
  }, []);
}
