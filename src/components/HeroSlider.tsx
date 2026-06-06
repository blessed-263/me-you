import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HERO_IMAGE_SIZES, heroPrefetchUrl, type HeroSlide } from '../lib/heroSlides.ts';

type HeroSliderProps = {
  slides: HeroSlide[];
  /** Auto-advance interval in ms */
  intervalMs?: number;
};

function HeroSlidePicture({
  slide,
  priority,
}: {
  slide: HeroSlide;
  priority: boolean;
}) {
  return (
    <picture className="absolute inset-0 block h-full w-full">
      <source type="image/webp" srcSet={slide.webpSrcSet} sizes={HERO_IMAGE_SIZES} />
      <img
        src={slide.jpegSrc}
        srcSet={slide.jpegSrcSet}
        sizes={HERO_IMAGE_SIZES}
        alt={slide.alt}
        className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        draggable={false}
      />
    </picture>
  );
}

export default function HeroSlider({ slides, intervalMs = 7000 }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [slides.length, intervalMs, reduceMotion]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const next = slides[(index + 1) % slides.length];
    if (!next) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = heroPrefetchUrl(next);
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [index, slides]);

  if (slides.length === 0) return null;

  const current = slides[index] ?? slides[0];

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 1.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="absolute inset-0"
        >
          <HeroSlidePicture slide={current} priority={index === 0} />
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 ? (
        <div
          className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2 md:bottom-8"
          role="tablist"
          aria-label="Hero slides"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show slide ${i + 1} of ${slides.length}`}
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
