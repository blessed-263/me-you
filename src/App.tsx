/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import { MapPin, Calendar, Clock, ArrowUpRight, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const TICKETS_URL = 'https://www.ampex.store/event/01KQVZ98HQX52PJ15TACANTR2X';

const navLinks = [
  { href: '#vision', label: 'Philosophy' },
  { href: '#experiences', label: 'The Gathering' },
  { href: '#details', label: 'Location' },
] as const;

const marqueeImages: { src: string; alt: string }[] = [
  { src: '/images/harvest-table.png', alt: 'Harvest Table' },
  { src: '/images/event-cake.png', alt: 'Cake unveiling' },
  { src: '/images/event-martell-bar.png', alt: 'Martell bar' },
  { src: '/images/event-dj.png', alt: 'DJ set' },
  { src: '/images/after-party.png', alt: 'After party' },
  { src: '/images/event-guests-couch.png', alt: 'Guests on lounge' },
  { src: '/images/event-guests-duo.png', alt: 'Guests portrait' },
  { src: '/images/martell-bottles.png', alt: 'Martell selection' },
];

function Countdown() {
  const targetDate = new Date('2026-05-31T11:00:00+02:00').getTime();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex gap-4 md:gap-8 justify-center items-center text-center mt-12">
      <div className="flex flex-col items-center min-w-[80px]">
        <span className="font-serif text-4xl md:text-6xl text-brand-text">{timeLeft.days}</span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-brand-muted mt-4">Days</span>
      </div>
      <div className="flex flex-col items-center min-w-[80px]">
        <span className="font-serif text-4xl md:text-6xl text-brand-text">{timeLeft.hours}</span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-brand-muted mt-4">Hours</span>
      </div>
      <div className="flex flex-col items-center min-w-[80px]">
        <span className="font-serif text-4xl md:text-6xl text-brand-text">{timeLeft.minutes}</span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-brand-muted mt-4">Minutes</span>
      </div>
      <div className="flex flex-col items-center min-w-[80px]">
        <span className="font-serif text-4xl md:text-6xl text-brand-text">{timeLeft.seconds}</span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-brand-muted mt-4">Seconds</span>
      </div>
    </div>
  );
}

export default function App() {
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.4,
    restDelta: 0.001,
  });

  const [menuOpen, setMenuOpen] = useState(false);
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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-brand-text">
      <motion.div
        aria-hidden
        style={{ scaleX: progressScaleX }}
        className="fixed left-0 top-0 right-0 h-[2px] origin-left bg-brand-text/70 z-[70] pointer-events-none"
      />

      <motion.header
        initial={false}
        animate={{ y: navHidden ? '-100%' : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-[60] bg-brand-bg border-b border-brand-border shadow-sm"
      >
        <nav className="px-5 py-4 md:px-12 md:py-5 flex justify-between items-center gap-4">
        <a href="/" className="shrink-0 flex items-center group" onClick={closeMenu}>
          <img 
            src="https://gallery.youandmeafrica.com/site-icon/you-me.jpeg" 
            alt="You & Me Africa" 
            className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover group-hover:opacity-80 transition-opacity duration-300 border border-brand-text/30 p-[2px]"
          />
        </a>
        <div className="hidden md:flex gap-10 text-[10px] uppercase tracking-[0.25em] font-medium text-brand-text/80">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-brand-text transition-colors">
                {link.label}
              </a>
            ))}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              className="md:hidden p-2 -mr-1 text-brand-text"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="w-5 h-5 stroke-[1.5]" /> : <Menu className="w-5 h-5 stroke-[1.5]" />}
            </button>
          <a
            href={TICKETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] rounded-full px-4 py-2.5 md:px-8 md:py-3 uppercase tracking-[0.2em] font-medium bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors whitespace-nowrap"
          >
            Buy Tickets
          </a>
        </div>
      </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden overflow-hidden border-t border-brand-border bg-brand-bg"
            >
              <div className="px-6 py-6 flex flex-col gap-5 text-[10px] uppercase tracking-[0.25em] font-medium text-brand-text/80">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="hover:text-brand-text transition-colors"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <section className="relative h-[min(84vh,780px)] min-h-[520px] pt-20 md:pt-24 flex items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <motion.div style={{ y: yHero }} className="absolute inset-0 z-0 bg-brand-surface border-b border-brand-border/30">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover object-center scale-105 opacity-80"
          >
            <source
              src="https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/40 via-transparent to-brand-bg"></div>
        </motion.div>

        <motion.div style={{ opacity: opacityHero }} className="relative z-10 text-center flex flex-col items-center -mt-4 md:-mt-2 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src="/sponsors/youandme brown .png"
              alt="You & Me Africa"
              className="mx-auto w-[min(68vw,440px)] md:w-[min(46vw,560px)] object-contain"
              decoding="async"
            />
            <a
              href={TICKETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-[1cm] inline-block px-10 py-4 bg-brand-text text-brand-bg text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-brand-text/90 transition-colors duration-500"
            >
              Buy Tickets
            </a>
          </motion.div>
        </motion.div>

      </section>

      {/* Vision Statement */}
      <section id="vision" className="scroll-mt-24 py-20 md:py-32 px-6 relative bg-brand-bg">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-3xl md:text-5xl lg:text-5xl leading-[1.4] font-light text-balance text-brand-text/90"
          >
            A space to celebrate the free spirit of connection. 
            <br className="hidden md:block" />
            <span className="italic text-brand-muted">Finding purpose in sharing nature’s gifts.</span>
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
              <img 
                src="/images/harvest-table.png"
                alt="Harvest Table"
                className="w-full h-full object-cover grayscale-[30%] sepia-[15%] group-hover:scale-105 transition-transform duration-[2s] ease-out"
              />
              <div className="absolute inset-0 bg-brand-bg/20 group-hover:bg-transparent transition-colors duration-1000"></div>
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
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-brand-accent mb-8 flex items-center gap-6">
                <span className="w-12 h-[1px] bg-brand-accent/50"></span>
                Part I
              </h4>
              <h3 className="font-serif text-5xl md:text-6xl lg:text-6xl mb-10 font-light text-brand-text uppercase leading-tight">
                The Harvest<br/><span className="italic text-[0.8em] text-brand-muted normal-case tracking-normal">Table Experience</span>
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
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-brand-accent mb-8 flex items-center gap-6">
                <span className="w-12 h-[1px] bg-brand-accent/50"></span>
                Part II
              </h4>
              <h3 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-10 font-light text-brand-text">
                The After lunch<br/><span className="italic text-brand-muted">Gathering</span>
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
              <img 
                src="/images/after-party.png" 
                alt="After party gathering"
                className="w-full h-full object-cover grayscale-[20%] sepia-[10%] group-hover:scale-105 transition-transform duration-[2s] ease-out"
              />
              <div className="absolute inset-0 bg-brand-bg/20 group-hover:bg-transparent transition-colors duration-1000"></div>
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
          <h4 className="text-[10px] uppercase tracking-[0.3em] text-brand-accent mb-6">
            A Space To Breathe
          </h4>
          <h3 className="font-serif text-4xl md:text-6xl font-light text-brand-text">
            The <span className="italic text-brand-muted">Memory</span>
          </h3>
        </motion.div>

        <div className="w-full relative mt-8 cursor-ew-resize">
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-r from-brand-bg to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-l from-brand-bg to-transparent z-10 pointer-events-none"></div>
          
          <div className="animate-marquee">
            {[...marqueeImages, ...marqueeImages].map((img, i) => (
              <div key={i} className="w-[240px] md:w-[320px] shrink-0 pr-4 md:pr-8">
                <div className="aspect-[4/5] w-full overflow-hidden relative group rounded-sm shadow-sm">
                  <img 
                    src={img.src} 
                    alt={img.alt} 
                    className="w-full h-full object-cover grayscale-[30%] sepia-[10%] opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1.5s] ease-out" 
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
              <h5 className="text-[9px] uppercase tracking-[0.3em] text-brand-muted">The Date</h5>
              <p className="font-serif text-3xl lg:text-4xl font-light text-brand-text">31 May <span className="italic text-brand-muted">2026</span></p>
            </div>
            <div className="flex flex-col gap-6 items-center text-center px-4">
              <Clock className="w-5 h-5 text-brand-accent mb-4 stroke-1" />
              <h5 className="text-[9px] uppercase tracking-[0.3em] text-brand-muted">The Time</h5>
              <p className="font-serif text-3xl lg:text-4xl font-light text-brand-text">11:00 AM <span className="italic text-brand-muted">to Late</span></p>
            </div>
            <div className="flex flex-col gap-6 items-center text-center px-4">
              <MapPin className="w-5 h-5 text-brand-accent mb-4 stroke-1" />
              <h5 className="text-[9px] uppercase tracking-[0.3em] text-brand-muted">The Setting</h5>
              <p className="font-serif text-3xl lg:text-4xl font-light text-brand-text">Rosebank, <span className="italic text-brand-muted">JHB</span></p>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=16+Baker+St,+Rosebank,+Johannesburg"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-brand-accent hover:text-brand-text transition-colors"
              >
                Get Directions
                <ArrowUpRight className="w-3 h-3 stroke-[1.5] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Countdown Section */}
      <section id="countdown" className="py-20 md:py-32 px-6 relative bg-brand-surface border-y border-brand-border">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl md:text-5xl font-light tracking-tight mb-6 text-brand-text"
            >
              The Second edition is ready for the <span className="italic text-brand-muted">31st of May.</span>
            </motion.h2>
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent">
              Countdown to doors opening at 11:00 AM:
            </p>
          </div>
          <Countdown />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border/50 py-16 px-6 md:px-12 flex flex-col items-center gap-8 md:gap-10 bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="https://gallery.youandmeafrica.com/site-icon/you-me.jpeg" 
            alt="You & Me Africa" 
            className="w-16 h-16 rounded-full object-cover border border-brand-border/50 p-[2px]"
          />
        </div>

        <div className="flex flex-col items-center gap-8 w-full max-w-5xl mx-auto border-t border-brand-border/30 pt-8 mt-2 md:pt-10 md:mt-4">
          <div className="flex items-center gap-4 text-brand-muted">
            <span className="hidden sm:block w-10 h-px bg-brand-border" aria-hidden />
            <span className="text-[9px] uppercase tracking-[0.35em] text-center">Partners & Sponsors</span>
            <span className="hidden sm:block w-10 h-px bg-brand-border" aria-hidden />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center justify-items-center gap-4 sm:gap-6 md:gap-8 w-full">
            <a
              href="#"
              aria-label="Nela's Kitchen"
              className="flex items-center justify-center h-24 w-full max-w-40 sm:h-28 sm:max-w-52 md:h-32"
            >
              <img
                src="/sponsors/nelas brown .png"
                alt="Nela's Kitchen"
                className="max-h-full max-w-full object-contain object-center"
                decoding="async"
              />
            </a>
            <a
              href="https://www.martell.com"
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label="Martell"
              className="flex items-center justify-center h-32 w-full max-w-56 sm:h-40 sm:max-w-72 md:h-48 md:max-w-80"
            >
              <img
                src="/sponsors/martell brown .png"
                alt="Martell"
                className="max-h-full max-w-full object-contain object-center"
                decoding="async"
              />
            </a>
            <a
              href="https://www.stellaartois.com"
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label="Stella Artois"
              className="flex items-center justify-center h-24 w-full max-w-40 sm:h-28 sm:max-w-52 md:h-32"
            >
              <img
                src="/sponsors/stella brown .png"
                alt="Stella Artois"
                className="max-h-full max-w-full object-contain object-center"
                decoding="async"
              />
            </a>
          </div>
        </div>

        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-8 pt-6 mt-6 border-t border-brand-border/30">
          <div className="text-[9px] uppercase tracking-[0.3em] text-brand-muted/60">
            © {new Date().getFullYear()} You & Me Africa. All Rights Reserved.
          </div>
          <div className="flex gap-8 text-[9px] uppercase tracking-[0.3em] text-brand-muted">
            <a href="#" className="hover:text-brand-text transition-colors">Instagram</a>
            <a href="#" className="hover:text-brand-text transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

