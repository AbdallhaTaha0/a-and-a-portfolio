"use client";

import { type CSSProperties, useEffect, useRef } from "react";

const DEFAULT_POSITION = 50;
const ORANGE_EASING = 0.14;
const WHITE_EASING = 0.075;

type Point = {
  x: number;
  y: number;
};

function interpolate(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}

export function AmbientBackground() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const precisePointer = window.matchMedia("(pointer: fine)");

    if (!layer || reducedMotion.matches || !precisePointer.matches) {
      return;
    }

    const target: Point = { x: DEFAULT_POSITION, y: DEFAULT_POSITION };
    const orange: Point = { ...target };
    const white: Point = { ...target };
    let animationFrame = 0;
    let isVisible = document.visibilityState === "visible";

    const setPosition = () => {
      orange.x = interpolate(orange.x, target.x, ORANGE_EASING);
      orange.y = interpolate(orange.y, target.y, ORANGE_EASING);
      white.x = interpolate(white.x, target.x, WHITE_EASING);
      white.y = interpolate(white.y, target.y, WHITE_EASING);

      layer.style.setProperty("--orange-x", `${orange.x}%`);
      layer.style.setProperty("--orange-y", `${orange.y}%`);
      layer.style.setProperty("--white-x", `${white.x}%`);
      layer.style.setProperty("--white-y", `${white.y}%`);

      if (isVisible) {
        animationFrame = window.requestAnimationFrame(setPosition);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth) * 100;
      target.y = (event.clientY / window.innerHeight) * 100;
    };

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";

      if (isVisible) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(setPosition);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    animationFrame = window.requestAnimationFrame(setPosition);

    return () => {
      isVisible = false;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const initialPosition = {
    "--orange-x": "50%",
    "--orange-y": "42%",
    "--white-x": "54%",
    "--white-y": "48%",
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-[#080808] [background:radial-gradient(circle_28rem_at_var(--orange-x)_var(--orange-y),rgb(255_184_0/0.22),transparent_68%),radial-gradient(circle_36rem_at_var(--white-x)_var(--white-y),rgb(255_255_255/0.10),transparent_72%),linear-gradient(145deg,#080808_0%,#0d0d0d_55%,#080808_100%)] motion-reduce:[background:radial-gradient(circle_at_22%_20%,rgb(255_184_0/0.18),transparent_42%),radial-gradient(circle_at_78%_62%,rgb(255_255_255/0.08),transparent_44%),#080808]"
      ref={layerRef}
      style={initialPosition}
    />
  );
}
