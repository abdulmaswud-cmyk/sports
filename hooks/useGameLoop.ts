import { useEffect, useRef } from 'react';

type LoopCallback = (args: { dtSec: number; nowMs: number }) => void;

/**
 * requestAnimationFrame-driven game loop.
 * Keeps timing in refs to avoid re-renders inside the loop.
 */
export function useGameLoop(running: boolean, onFrame: LoopCallback) {
  const rafRef = useRef<number | null>(null);
  const lastMsRef = useRef<number | null>(null);
  const cbRef = useRef(onFrame);

  cbRef.current = onFrame;

  useEffect(() => {
    if (!running) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastMsRef.current = null;
      return;
    }

    const tick = (nowMs: number) => {
      const last = lastMsRef.current ?? nowMs;
      const dtMs = Math.min(50, Math.max(0, nowMs - last)); // clamp to keep gameplay stable
      lastMsRef.current = nowMs;

      cbRef.current({ dtSec: dtMs / 1000, nowMs });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastMsRef.current = null;
    };
  }, [running]);
}

