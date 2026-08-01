import { useEffect, useRef } from "react";

export type ShortcutMap = Record<string, () => void>;

const IGNORED_ELEMENTS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (IGNORED_ELEMENTS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  return false;
}

function buildKeyString(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey || event.metaKey) parts.push("ctrl");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");

  const key = event.key.toLowerCase();

  // Don't add standalone modifier keys as the main key
  if (!["control", "shift", "alt", "meta"].includes(key)) {
    parts.push(key);
  }

  return parts.join("+");
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      const keyString = buildKeyString(event);
      const handler = shortcutsRef.current[keyString];

      if (handler) {
        event.preventDefault();
        handler();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
