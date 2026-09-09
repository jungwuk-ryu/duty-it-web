import { useEffect, type RefObject } from "react";

export function useDismiss(
  enabled: boolean,
  onDismiss: () => void,
  ref: RefObject<HTMLElement | null>,
  { behavior }: { behavior: "consume" | "pass-through" },
) {
  useEffect(() => {
    if (!enabled) return;
    const dismiss = (event: PointerEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      if (behavior === "consume") { event.preventDefault(); event.stopPropagation(); }
      onDismiss();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onDismiss(); };
    document.addEventListener("pointerdown", dismiss, true);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss, true);
      document.removeEventListener("keydown", escape);
    };
  }, [enabled, onDismiss, ref, behavior]);
}
