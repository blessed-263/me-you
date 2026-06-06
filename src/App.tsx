/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useSpring } from 'motion/react';
import { MapPin, Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ResponsiveImage from './components/ResponsiveImage.tsx';
import EventAssistant from './components/EventAssistant.tsx';
import HeroSlider from './components/HeroSlider.tsx';
import Sponsors from './components/Sponsors.tsx';
import { HERO_SLIDES } from './lib/heroSlides.ts';
import { VENUE_AREA, VENUE_MAPS_URL, VENUE_NAME, VENUE_STREET } from './lib/venue.ts';

const TICKETS_URL = '/tickets';

const marqueeImages: { base: string; alt: string }[] = [
  { base: '/images/harvest-table', alt: 'Harvest Table' },
  { base: '/images/event-cake', alt: 'Cake unveiling' },
  { base: '/images/event-martell-bar', alt: 'Martell bar' },
  { base: '/images/event-dj', alt: 'DJ set' },
  { base: '/images/after-party', alt: 'After party' },
  { base: '/images/event-guests-couch', alt: 'Guests on lounge' },
  { base: '/images/event-guests-duo', alt: 'Guests portrait' },
  { base: '/images/martell-bottles', alt: 'Martell selection' },
];

function EditionInfinity() {
  const slots = ['Days', 'Hours', 'Minutes', 'Seconds'] as const;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-6 md:gap-8 justify-center items-center text-center mt-12 max-w-full px-2">
      {slots.map((label) => (
        <div key={label} className="flex flex-col items-center min-w-[4.5rem] sm:min-w-[80px]">
          <span className="font-serif text-4xl md:text-6xl text-brand-text leading-none" aria-hidden>
            ∞
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-brand-muted mt-4">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.4,
    restDelta: 0.001,
  });

  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 72) {
        setNavHidden(false);
      } else if (y > lastScrollY.current + 8) {
        setNavHidden(true);
      } else if (y < lastScrollY.current - 8) {
        setNavHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-brand-text">
      <motion.div
        aria-hidden
        style={{ scaleX: progressScaleX }}
        className="fixed left-0 top-0 right-0 h-[2px] origin-left bg-brand-text/70 z-[70] pointer-events-none"
      />

      <motion.header
        initial={false}
        animate={{ y: navHidden ? '-100%' : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-[60] w-full max-w-full bg-brand-bg border-b border-brand-border shadow-sm"
      >
        <nav className="relative px-5 py-4 md:px-12 md:py-5 flex justify-between items-center gap-4">
        <a href="/" className="shrink-0 flex items-center group">
          <img 
            src="/sponsors/youandme white.png"
            alt="You & Me Africa"
            className="h-9 w-auto md:h-10 object-contain invert group-hover:opacity-80 transition-opacity duration-300"
          />
        </a>
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href={TICKETS_URL}
            className="text-[10px] rounded-full px-4 py-2.5 md:px-8 md:py-3 uppercase tracking-[0.14em] font-semibold bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors whitespace-nowrap"
          >
            Buy Tickets
          </a>
        </div>
      </nav>
      </motion.header>

      {/* Hero carousel */}
      <section className="relative h-[min(88vh,820px)] min-h-[480px] md:h-[min(92vh,900px)] md:min-h-[560px] pt-20 md:pt-24 flex items-end justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden bg-brand-surface border-b border-brand-border/30">
          <HeroSlider slides={[...HERO_SLIDES]} />
        </div>
      </section>

      {/* Vision Statement */}
      <section id="vision" className="scroll-mt-24 py-20 md:py-32 px-6 relative bg-brand-bg">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-3xl md:text-5xl lg:text-5xl leading-[1.35] font-medium text-balance text-brand-text"
          >
            YOU &amp; ME is a cultural gathering
            <br className="hidden md:block" />
            <span className="italic text-brand-muted">centered around music, food, conversation and community.</span>
          </motion.h2>
        </div>
      </section>

      {/* Experiences / Split Layout */}
      <section id="experiences" className="scroll-mt-24 py-16 md:py-24 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center pt-8 md:pt-12">
          
          <div className="lg:col-span-5 lg:col-start-2 relative order-2 lg:order-1">
            <motion.div 
              initial={{ opacity: 0, clipPath: 'inset(10% 10% 10% 10%)' }}
              whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="aspect-[4/5] object-cover relative group max-w-sm mx-auto"
            >
              <ResponsiveImage
                base="/images/harvest-table"
                alt="Harvest Table"
                sizes="(max-width: 639px) 90vw, 384px"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out"
              />
            </motion.div>
            
            {/* Vertical Accent Label */}
            <div className="absolute top-1/2 -translate-y-1/2 writing-vertical rotate-180 text-[9px] uppercase tracking-[0.4em] text-brand-muted hidden lg:block -left-12">
              Nela's Kitchen
            </div>
            {/* Outline box detail */}
            <div className="absolute top-4 bottom-4 left-4 right-4 border border-brand-border/50 -z-10 hidden md:block max-w-sm mx-auto"></div>
          </div>
          
          <div className="lg:col-span-5 lg:col-start-8 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <h4 className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent mb-8 flex items-center gap-6">
                <span className="w-12 h-[1px] bg-brand-accent/50"></span>
                Part I
              </h4>
              <h3 className="font-serif text-5xl md:text-6xl lg:text-6xl mb-10 font-semibold text-brand-text uppercase leading-tight">
                The Harvest<br/><span className="text-brand-text">Table Experience</span>
              </h3>
              <div className="text-brand-muted text-sm md:text-base leading-[1.8] font-light max-w-md space-y-4">
                <p>A long-table experience curated by Nela's Kitchen.</p>
                <p>An intimate gathering built around food, conversation, and presence.</p>
                <p>Includes a curated meal and welcome drinks.</p>
                <p>Guests transition into the afterparty session.</p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center mt-24 md:mt-32">
          
          <div className="lg:col-span-5 lg:col-start-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <h4 className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent mb-8 flex items-center gap-6">
                <span className="w-12 h-[1px] bg-brand-accent/50"></span>
                Part II
              </h4>
              <h3 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-10 font-semibold text-brand-text">
                The After Lunch<br/><span className="text-brand-text">Gathering</span>
              </h3>
              <div className="text-brand-muted text-sm md:text-base leading-[1.8] font-light max-w-md space-y-4">
                <p>A sonic experience as the day shifts into night.</p>
                <p>Music, movement, and a carefully assembled room.</p>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5 lg:col-start-8 relative">
            <motion.div 
              initial={{ opacity: 0, clipPath: 'inset(10% 10% 10% 10%)' }}
              whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="aspect-[4/5] object-cover relative group max-w-sm mx-auto"
            >
              <ResponsiveImage
                base="/images/event-dj"
                alt="DJ at the after lunch gathering"
                sizes="(max-width: 639px) 90vw, 384px"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out"
              />
            </motion.div>

            <div className="absolute top-1/2 -translate-y-1/2 writing-vertical text-[9px] uppercase tracking-[0.4em] text-brand-muted hidden lg:block -right-12">
              Rhythm & Soul
            </div>
            <div className="absolute top-4 bottom-4 left-4 right-4 border border-brand-border/50 -z-10 hidden md:block max-w-sm mx-auto"></div>
          </div>
        </div>
      </section>

      {/* Gallery / Atmosphere Marquee */}
      <section className="py-20 md:py-24 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center px-6 mb-12"
        >
          <h4 className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent mb-6">
            A Space To Breathe
          </h4>
          <h3 className="font-serif text-4xl md:text-6xl font-semibold text-brand-text">
            The <span className="text-brand-text">Memory</span>
          </h3>
        </motion.div>

        <div className="w-full max-w-full relative mt-8 cursor-ew-resize overflow-x-clip">
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-r from-brand-bg to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-l from-brand-bg to-transparent z-10 pointer-events-none"></div>
          
          <div className="animate-marquee">
            {[...marqueeImages, ...marqueeImages].map((img, i) => (
              <div key={i} className="w-[240px] md:w-[320px] shrink-0 pr-4 md:pr-8">
                <div className="aspect-[4/5] w-full overflow-hidden relative group rounded-sm shadow-sm">
                  <ResponsiveImage
                    base={img.base}
                    alt={img.alt}
                    sizes="(max-width: 767px) 240px, 320px"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Details Section / Big Layout */}
      <section id="details" className="scroll-mt-24 py-20 md:py-24 px-6 mt-8 relative">
        <div className="absolute inset-0 bg-brand-surface border-y border-brand-border -z-10"></div>
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="flex flex-col md:flex-row gap-12 md:gap-8 justify-between"
          >
            <div className="flex flex-col gap-6 items-center text-center px-4">
              <Calendar className="w-5 h-5 text-brand-accent mb-4 stroke-1" />
              <h5 className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">The Date</h5>
              <p className="font-serif text-3xl lg:text-4xl font-medium text-brand-text">31 May <span className="italic text-brand-muted">2026</span></p>
            </div>
            <div className="flex flex-col gap-6 items-center text-center px-4">
              <Clock className="w-5 h-5 text-brand-accent mb-4 stroke-1" />
              <h5 className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">The Time</h5>
              <p className="font-serif text-3xl lg:text-4xl font-medium text-brand-text">11:00 AM <span className="italic text-brand-muted">to Late</span></p>
            </div>
            <div className="flex flex-col gap-6 items-center text-center px-4">
              <MapPin className="w-5 h-5 text-brand-accent mb-4 stroke-1" />
              <h5 className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">The Setting</h5>
              <p className="font-serif text-3xl lg:text-4xl font-medium text-brand-text text-balance break-words">
                {VENUE_NAME},{' '}
                <span className="italic text-brand-muted">
                  {VENUE_STREET}, {VENUE_AREA}
                </span>
              </p>
              <a
                href={VENUE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent hover:text-brand-text transition-colors"
              >
                Get Directions
                <ArrowUpRight className="w-3 h-3 stroke-[1.5] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Second edition — next gathering */}
      <section id="countdown" className="py-20 md:py-32 px-6 relative bg-brand-surface border-y border-brand-border">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl md:text-5xl font-semibold tracking-tight mb-6 text-brand-text text-balance"
            >
              The Second edition has come and gone.
            </motion.h2>
            <p className="text-sm md:text-base font-light text-brand-muted leading-relaxed max-w-xl mx-auto">
              Thank you for showing up. The next gathering is already on its way — details coming soon.
            </p>
            <p className="mt-6 text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent">
              Until then
            </p>
          </div>
          <EditionInfinity />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border/50 py-16 px-6 md:px-12 flex flex-col items-center gap-8 md:gap-10 bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="/sponsors/youandme white.png"
            alt="You & Me Africa"
            className="h-36 w-auto sm:h-44 md:h-52 lg:h-60 object-contain invert"
          />
        </div>

        <Sponsors className="max-w-5xl mx-auto mt-2 md:mt-4 pt-8 md:pt-10" />

        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-8 pt-6 mt-6 border-t border-brand-border/30">
          <div className="text-[9px] uppercase tracking-[0.3em] text-brand-muted/60">
            © {new Date().getFullYear()} You & Me Africa. All Rights Reserved.
          </div>
          <div className="flex gap-8 text-[9px] uppercase tracking-[0.3em] text-brand-muted">
            <a
              href="https://www.instagram.com/youandmeafrica/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-text transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>
      <EventAssistant />
    </div>
  );
}

