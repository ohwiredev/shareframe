import { useState, useCallback, useRef } from 'react';

const DEFAULT_MAX_HISTORY = 30;

export function useHistory<T>(initialState: T, maxHistory: number = DEFAULT_MAX_HISTORY) {
  const [state, setState] = useState<T>(initialState);
  const undoStack = useRef<T[]>([]);
  const redoStack = useRef<T[]>([]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const nextState = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;

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
