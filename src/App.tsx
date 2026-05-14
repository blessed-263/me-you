/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';

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

type NewsletterStatus = 'idle' | 'loading' | 'success' | 'error';

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<NewsletterStatus>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadySubscribed?: boolean;
      };

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      if (data.alreadySubscribed) {
        setMessage("You're already on the list. Thank you for your interest.");
      } else {
        setMessage("You're subscribed. We'll be in touch.");
      }
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Check your connection and try again.');
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          placeholder="Enter your email address"
          required
          disabled={status === 'loading'}
          autoComplete="email"
          className="px-6 py-4 bg-transparent border border-brand-border text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-text flex-1 transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-8 py-4 bg-brand-text text-brand-bg text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-brand-text/90 transition-colors whitespace-nowrap disabled:opacity-60"
        >
          {status === 'loading' ? 'Sending…' : 'Subscribe'}
        </button>
      </div>
      {status === 'success' && (
        <p className="text-sm text-brand-muted font-light text-center">{message}</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-400/90 font-light text-center">{message}</p>
      )}
    </form>
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

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-brand-text">
      <motion.div
        aria-hidden
        style={{ scaleX: progressScaleX }}
        className="fixed left-0 top-0 right-0 h-[2px] origin-left bg-brand-text/70 z-[60] pointer-events-none"
      />
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-8 md:px-12 flex justify-between items-center">
        <a href="/" className="shrink-0 flex items-center group">
          <img 
            src="https://gallery.youandmeafrica.com/site-icon/you-me.jpeg" 
            alt="You & Me Africa" 
            className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover group-hover:opacity-80 transition-opacity duration-300 border border-brand-text/30 p-[2px]"
          />
        </a>
        <div className="hidden md:flex gap-12 text-[10px] uppercase tracking-[0.25em] font-medium text-brand-text/80">
          <a href="#vision" className="hover:text-brand-text transition-colors">Philosophy</a>
          <a href="#experiences" className="hover:text-brand-text transition-colors">The Gathering</a>
          <a href="#details" className="hover:text-brand-text transition-colors">Location</a>
          <a href="#newsletter" className="hover:text-brand-text transition-colors">Newsletter</a>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <a
            href="#newsletter"
            className="md:hidden text-[10px] uppercase tracking-[0.25em] font-medium text-brand-text/80 hover:text-brand-text transition-colors"
          >
            Newsletter
          </a>
          <a
            href="https://www.ampex.store/event/01KQVZ98HQX52PJ15TACANTR2X"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] border border-brand-text/40 rounded-full px-6 py-3 md:px-8 uppercase tracking-[0.2em] font-medium text-brand-text hover:bg-brand-text hover:text-brand-bg transition-colors"
          >
            Tickets
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
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

        <motion.div style={{ opacity: opacityHero }} className="relative z-10 text-center flex flex-col items-center mt-16 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-serif text-6xl sm:text-8xl md:text-[9rem] xl:text-[11rem] leading-[0.8] font-light tracking-tight text-balance text-brand-text">
              You & Me<br/><span className="italic font-normal text-brand-muted">Africa</span>
            </h1>
            <a href="#tickets" className="mt-12 inline-block px-10 py-4 border border-brand-text/50 text-[10px] uppercase tracking-[0.3em] font-medium text-brand-text hover:bg-brand-text hover:text-brand-bg transition-colors duration-500">
              Buy Tickets
            </a>
          </motion.div>
        </motion.div>

      </section>

      {/* Vision Statement */}
      <section id="vision" className="py-20 md:py-32 px-6 relative bg-brand-bg">
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
      <section id="experiences" className="py-16 md:py-24 px-6 md:px-12 max-w-[1400px] mx-auto">
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
      <section id="details" className="py-20 md:py-24 px-6 mt-8 relative">
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

      {/* Newsletter Section */}
      <section id="newsletter" className="py-24 px-6 relative bg-brand-bg border-y border-brand-border/50 flex justify-center">
        <div className="max-w-xl w-full text-center">
          <span className="text-[9px] uppercase tracking-[0.3em] text-brand-muted mb-6 block">Stay in the Loop</span>
          <h2 className="font-serif text-3xl md:text-5xl font-light text-brand-text mb-8 italic">Join our Newsletter</h2>
          <NewsletterForm />
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
          <div className="flex flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 w-full">
            <a
              href="#"
              aria-label="Nela's Kitchen"
              className="group flex items-center justify-center h-20 w-36 sm:h-24 sm:w-44 md:h-28 md:w-52 rounded-xl bg-brand-surface/40 border border-brand-border/40 px-4 py-3 transition-colors duration-300 hover:bg-brand-surface/70"
            >
              <img
                src="/sponsors/nelas-kitchen.png"
                alt="Nela's Kitchen"
                className="max-h-full max-w-full object-contain object-center"
              />
            </a>
            <a
              href="https://www.martell.com"
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label="Martell — main sponsor"
              className="group flex items-center justify-center h-28 w-56 sm:h-36 sm:w-72 md:h-44 md:w-[22rem] lg:h-48 lg:w-[26rem] rounded-2xl bg-brand-surface/60 border border-brand-border/50 px-6 py-4 shadow-sm transition-colors duration-300 hover:bg-brand-surface"
            >
              <img
                src="/sponsors/martell.png"
                alt="Martell"
                className="max-h-full max-w-full object-contain object-center"
              />
            </a>
            <a
              href="https://www.stellaartois.com"
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label="Stella Artois"
              className="group flex items-center justify-center h-20 w-36 sm:h-24 sm:w-44 md:h-28 md:w-52 rounded-xl bg-brand-surface/40 border border-brand-border/40 px-4 py-3 transition-colors duration-300 hover:bg-brand-surface/70"
            >
              <img
                src="/sponsors/stella-artois.png"
                alt="Stella Artois"
                className="max-h-[80%] max-w-full object-contain object-center"
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

