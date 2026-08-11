import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_MAX_HISTORY = 30;

export function useHistory<T>(storageKey: string, initialState: T, maxHistory: number = DEFAULT_MAX_HISTORY) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.logo?.src?.startsWith("blob:")) parsed.logo.src = null;
        if (parsed?.image?.src?.startsWith("blob:")) parsed.image.src = null;
        return parsed;
      }
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
    return initialState;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(state, (key, value) => {
          if (key === "src" && typeof value === "string" && value.startsWith("blob:")) {
            return null;
          }
          return value;
        })
      );
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [state, storageKey]);
  const undoStack = useRef<T[]>([]);
  const redoStack = useRef<T[]>([]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const nextState = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;

        undoStack.current = [...undoStack.current, prev];
        if (undoStack.current.length > maxHistory) {
          undoStack.current = undoStack.current.slice(undoStack.current.length - maxHistory);
        }

        redoStack.current = [];

        return nextState;
      });
    },
    [maxHistory],
  );

  const undo = useCallback(() => {
    setState((prev) => {
      if (undoStack.current.length === 0) {
        return prev;
      }

      const previous = undoStack.current[undoStack.current.length - 1];
      undoStack.current = undoStack.current.slice(0, -1);
      redoStack.current = [...redoStack.current, prev];

      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (redoStack.current.length === 0) {
        return prev;
      }

      const next = redoStack.current[redoStack.current.length - 1];
      redoStack.current = redoStack.current.slice(0, -1);
      undoStack.current = [...undoStack.current, prev];

      return next;
    });
  }, []);

  /** Update state without pushing to the undo stack. */
  const replace = useCallback((next: T | ((prev: T) => T)) => {
    setState(next);
  }, []);

  const reset = useCallback((newState: T) => {
    undoStack.current = [];
    redoStack.current = [];
    setState(newState);
  }, []);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  return { state, set, replace, undo, redo, canUndo, canRedo, reset };
}
