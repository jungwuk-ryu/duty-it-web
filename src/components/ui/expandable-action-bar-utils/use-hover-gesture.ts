import { useRef, type PointerEvent } from "react";

export function useHoverGesture() {
  const hovering = useRef(false);
  return {
    enter(event: PointerEvent) {
      if (event.pointerType !== "mouse") return false;
      hovering.current = true;
      return true;
    },
    leave(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !hovering.current) return false;
      hovering.current = false;
      return true;
    },
  };
}
