import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { HeroSlide } from '../lib/heroSlides.ts';

const ease = [0.16, 1, 0.3, 1] as const;

type HeroSliderProps = {
  slides: HeroSlide[];
  /** Auto-advance interval in ms */
  intervalMs?: number;
};

const MOBILE_MQ = '(max-width: 767px)';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export default function HeroSlider({ slides, intervalMs = 7000 }: HeroSliderProps) {
  const isMobile = useIsMobile();
  const visibleSlides = useMemo(
    () => slides.filter((slide) => !slide.mobileOnly || isMobile),
    [slides, isMobile],
  );

  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const landingDone = useRef(false);

  useEffect(() => {
    setIndex(0);
  }, [isMobile]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (visibleSlides.length <= 1 || reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % visibleSlides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [visibleSlides.length, intervalMs, reduceMotion]);

  useEffect(() => {
    if (visibleSlides.length <= 1) return;
    const next = visibleSlides[(index + 1) % visibleSlides.length];
    if (!next) return;
    const img = new Image();
    img.src = next.src;
  }, [index, visibleSlides]);

  if (visibleSlides.length === 0) return null;

  const current = visibleSlides[index] ?? visibleSlides[0];
  const isLandingSlide = index === 0 && !landingDone.current;

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="sync" initial={false}>
        <motion.img
          key={current.src}
          src={current.src}
          alt={current.alt}
          initial={
            reduceMotion
              ? { opacity: 1, scale: 1 }
              : isLandingSlide
                ? { opacity: 0, scale: 1.06 }
                : { opacity: 0, scale: 1 }
          }
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0 : isLandingSlide ? 1.6 : 1.2,
            ease,
          }}
          onAnimationComplete={() => {
            if (index === 0) landingDone.current = true;
          }}
          className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
          decoding={index === 0 ? 'sync' : 'async'}
          fetchPriority={index === 0 ? 'high' : 'auto'}
          draggable={false}
        />
      </AnimatePresence>

      {visibleSlides.length > 1 ? (
        <div
          className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2 md:bottom-8"
          role="tablist"
          aria-label="Hero slides"
        >
          {visibleSlides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show slide ${i + 1} of ${visibleSlides.length}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index
                  ? 'w-8 bg-brand-bg'
                  : 'w-1.5 bg-brand-bg/45 hover:bg-brand-bg/70'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type { HeroSlide };
