import { useRef, type PointerEvent } from "react";

export function useTapGesture<T>() {
  const gesture = useRef<{ pointerType: string; state: T } | null>(null);
  return {
    start(event: PointerEvent, state: T) { gesture.current = { pointerType: event.pointerType, state }; },
    drop() { gesture.current = null; },
    take() { const current = gesture.current; gesture.current = null; return current; },
  };
}
