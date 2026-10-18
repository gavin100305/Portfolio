"use client";

import { useEffect } from "react";
import { playButtonSound, preloadButtonSound } from "@/lib/button-sound";

const buttonSelector = "button, [role='button'], a.folio-raised-control, a.folio-section-link, a.folio-footer-link";

function getSoundButton(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const button = target.closest<HTMLElement>(buttonSelector);
  if (!button || button.matches(":disabled, [aria-disabled='true']") || button.closest(".folio-keycap-face")) return null;
  return button;
}

export function ButtonSoundEffects() {
  useEffect(() => {
    preloadButtonSound();
    const activePointers = new Map<number, number>();
    const activeKeys = new Map<HTMLElement, Map<string, number>>();
    const lastKeyboardPress = new WeakMap<HTMLElement, number>();
    const lastPointerPress = new WeakMap<HTMLElement, number>();
    let strokeIndex = 0;

    function pointerDown(event: PointerEvent) {
      const button = getSoundButton(event.target);
      // Mobile audio activation is reliable on the completed tap (click).
      if (!event.isPrimary || event.button !== 0 || event.pointerType === "touch" || !button) return;
      lastPointerPress.set(button, performance.now());
      const index = strokeIndex++;
      activePointers.set(event.pointerId, index);
      playButtonSound("down", index);
    }

    function pointerUp(event: PointerEvent) {
      const index = activePointers.get(event.pointerId);
      if (index === undefined) return;
      activePointers.delete(event.pointerId);
      playButtonSound("up", index);
    }

    function keyDown(event: KeyboardEvent) {
      const button = getSoundButton(event.target);
      if (event.repeat || (event.key !== "Enter" && event.key !== " ") || !button) return;
      const keys = activeKeys.get(button) ?? new Map<string, number>();
      if (keys.has(event.key)) return;
      const index = strokeIndex++;
      keys.set(event.key, index);
      activeKeys.set(button, keys);
      lastKeyboardPress.set(button, performance.now());
      playButtonSound("down", index);
    }

    function keyUp(event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLElement>(buttonSelector);
      if (!button || button.closest(".folio-keycap-face")) return;
      const keys = activeKeys.get(button);
      const index = keys?.get(event.key);
      if (!keys || index === undefined) return;
      keys.delete(event.key);
      if (!keys.size) activeKeys.delete(button);
      playButtonSound("up", index);
    }

    function click(event: MouseEvent) {
      const button = getSoundButton(event.target);
      if (!button || performance.now() - (lastKeyboardPress.get(button) ?? -Infinity) < 500) return;
      if (event.detail !== 0 && performance.now() - (lastPointerPress.get(button) ?? -Infinity) < 1500) return;
      const index = strokeIndex++;
      playButtonSound("down", index);
      playButtonSound("up", index);
    }

    document.addEventListener("pointerdown", pointerDown, true);
    document.addEventListener("pointerup", pointerUp, true);
    document.addEventListener("pointercancel", pointerUp, true);
    document.addEventListener("keydown", keyDown, true);
    document.addEventListener("keyup", keyUp, true);
    document.addEventListener("click", click, true);
    return () => {
      document.removeEventListener("pointerdown", pointerDown, true);
      document.removeEventListener("pointerup", pointerUp, true);
      document.removeEventListener("pointercancel", pointerUp, true);
      document.removeEventListener("keydown", keyDown, true);
      document.removeEventListener("keyup", keyUp, true);
      document.removeEventListener("click", click, true);
    };
  }, []);

  return null;
}
