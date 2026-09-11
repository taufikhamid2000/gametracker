"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const BUBBLE_WIDTH = 224; // w-56
const VIEWPORT_MARGIN = 8;
// Clears the app's sticky header (~56px tall) with a little breathing room,
// so a "top" placement never visually overlaps it even when it technically
// still fits within the raw viewport.
const TOP_SAFE_ZONE = 76;

export function Tooltip({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  // Bumped on every show() call (not just closed->open) — hovering then
  // focusing the same trigger (e.g. a click also fires focus) calls
  // show() again while already open, and the position must recompute
  // each time or it can go stale.
  const [showToken, setShowToken] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number; placement: "top" | "bottom" } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  // Two-pass positioning: render the bubble invisibly first so we can
  // measure its real (possibly multi-line) height, then place it —
  // a fixed height estimate undershoots for longer tooltip text and can
  // still overlap the header.
  useLayoutEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    const bubble = bubbleRef.current;
    if (!button || !bubble) return;

    const rect = button.getBoundingClientRect();
    const bubbleHeight = bubble.getBoundingClientRect().height;
    const candidateTop = rect.top - 8 - bubbleHeight;
    const placement: "top" | "bottom" = candidateTop < TOP_SAFE_ZONE ? "bottom" : "top";

    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - BUBBLE_WIDTH / 2, VIEWPORT_MARGIN),
      window.innerWidth - BUBBLE_WIDTH - VIEWPORT_MARGIN
    );
    const top = placement === "top" ? rect.top - 8 : rect.bottom + 8;

    setPosition({ top, left, placement });
  }, [open, showToken]);

  function show() {
    setShowToken((n) => n + 1);
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  return (
    <span className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        aria-describedby={id}
        aria-label="More info"
        onClick={show}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => e.key === "Escape" && hide()}
        className="relative inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-border text-[10px] leading-none text-foreground/60 transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {/* Invisible hit-slop: expands the tap target to ~44x44 without growing the visible circle. */}
        <span className="absolute -inset-[14px]" aria-hidden="true" />
        i
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            ref={bubbleRef}
            id={id}
            role="tooltip"
            style={{
              position: "fixed",
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              transform: position?.placement === "top" ? "translateY(-100%)" : undefined,
              visibility: position ? "visible" : "hidden",
            }}
            className="z-50 w-56 whitespace-pre-line rounded-lg border border-border bg-foreground px-3 py-2 text-xs text-background shadow-lg"
          >
            {label}
          </span>,
          document.body
        )}
    </span>
  );
}
