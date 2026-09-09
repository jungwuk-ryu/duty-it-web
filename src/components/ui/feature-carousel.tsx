"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/src/lib/utils";

export type FeatureCarouselItem = {
  id: string;
};

export type FeatureCarouselClassNames = {
  root?: string;
  copy?: string;
  copyContent?: string;
  tabList?: string;
  tab?: string;
  viewport?: string;
  slide?: string;
  controls?: string;
  control?: string;
};

export type FeatureCarouselProps<T extends FeatureCarouselItem> = {
  items: readonly T[];
  renderCopy: (item: T, index: number) => ReactNode;
  renderTab: (item: T, index: number) => ReactNode;
  renderSlide: (item: T, index: number) => ReactNode;
  ariaLabel: string;
  idPrefix?: string;
  classNames?: FeatureCarouselClassNames;
  interval?: number;
  initialIndex?: number;
};

/**
 * An accessible, auto-advancing feature carousel that leaves slide content
 * interactive. Tabs, keyboard navigation, and previous/next controls share
 * one active state so it can host complex product previews safely.
 */
export function FeatureCarousel<T extends FeatureCarouselItem>({
  items,
  renderCopy,
  renderTab,
  renderSlide,
  ariaLabel,
  idPrefix = "feature-carousel",
  classNames,
  interval = 4800,
  initialIndex = 0,
}: FeatureCarouselProps<T>) {
  const safeInitialIndex = Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0));
  const [activeIndex, setActiveIndex] = useState(safeInitialIndex);
  const [paused, setPaused] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prefersReducedMotion = useReducedMotion();

  const selectIndex = useCallback((nextIndex: number) => {
    if (items.length === 0) return;
    setActiveIndex((nextIndex + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (paused || prefersReducedMotion || items.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [interval, items.length, paused, prefersReducedMotion]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    else return;

    event.preventDefault();
    selectIndex(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  };

  if (items.length === 0) return null;

  const currentIndex = Math.min(activeIndex, items.length - 1);
  const activeItem = items[currentIndex];
  const slideMotion = prefersReducedMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, x: 20, scale: 0.985 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -20, scale: 0.985 } };

  return (
    <section
      className={classNames?.root}
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        const nextFocusedElement = event.relatedTarget;
        if (!(nextFocusedElement instanceof Node) || !event.currentTarget.contains(nextFocusedElement)) {
          setPaused(false);
        }
      }}
    >
      <div className={classNames?.copy}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeItem.id}
            className={classNames?.copyContent}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderCopy(activeItem, currentIndex)}
          </motion.div>
        </AnimatePresence>

        <div className={classNames?.tabList} role="tablist" aria-label={ariaLabel} aria-orientation="vertical">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${item.id}`}
              aria-controls={`${idPrefix}-panel-${item.id}`}
              aria-selected={currentIndex === index}
              tabIndex={currentIndex === index ? 0 : -1}
              data-active={currentIndex === index}
              className={cn(classNames?.tab)}
              ref={(element) => { tabRefs.current[index] = element; }}
              onClick={() => selectIndex(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span aria-hidden>{String(index + 1).padStart(2, "0")}</span>
              <span>{renderTab(item, index)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={classNames?.viewport}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeItem.id}
            id={`${idPrefix}-panel-${activeItem.id}`}
            role="tabpanel"
            aria-labelledby={`${idPrefix}-tab-${activeItem.id}`}
            tabIndex={0}
            className={classNames?.slide}
            {...slideMotion}
            transition={{ type: "spring", stiffness: 310, damping: 29, mass: 0.7 }}
          >
            {renderSlide(activeItem, activeIndex)}
          </motion.div>
        </AnimatePresence>

        <div className={classNames?.controls}>
          <button
            type="button"
            className={classNames?.control}
            onClick={() => selectIndex(currentIndex - 1)}
            aria-label="이전 기능 보기"
          >
            <ArrowLeft size={18} strokeWidth={1.7} aria-hidden />
          </button>
          <span aria-live="polite">{currentIndex + 1} / {items.length}</span>
          <button
            type="button"
            className={classNames?.control}
            onClick={() => selectIndex(currentIndex + 1)}
            aria-label="다음 기능 보기"
          >
            <ArrowRight size={18} strokeWidth={1.7} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}

export default FeatureCarousel;
