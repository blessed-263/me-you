import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiUrl } from '../lib/api.ts';
import FfRsvpForm from './FfRsvpForm.tsx';
import { EMPTY_FORM, FF_COPY, FF_IMAGES, FF_STORAGE_KEY, normaliseSaMobile, type FfForm } from './content.ts';
import { prefersReducedMotion, useFfReveal } from './useFfReveal.ts';
import './ff.css';

type Gate = 'checking' | 'valid' | 'invalid' | 'error';
type View = 'form' | 'yes' | 'no';

function readSaved(): FfForm | null {
  try {
    const raw = window.localStorage.getItem(FF_STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<FfForm>;
    if (typeof v.attending !== 'boolean') return null;
    return {
      firstName: String(v.firstName ?? ''),
      surname: String(v.surname ?? ''),
      mobile: String(v.mobile ?? ''),
      email: String(v.email ?? ''),
      attending: v.attending,
    };
  } catch {
    return null;
  }
}

function writeSaved(form: FfForm): void {
  try {
    window.localStorage.setItem(FF_STORAGE_KEY, JSON.stringify(form));
  } catch {
    /* storage unavailable: the page still works */
  }
}

function Background() {
  return (
    <div className="ff-bg" aria-hidden="true">
      <div className="ff-bg-layer ff-bg-phone" />
      <div className="ff-bg-layer ff-bg-left" />
      <div className="ff-bg-layer ff-bg-right" />
    </div>
  );
}

function Footer() {
  return (
    <footer className="ff-footer ff-reveal">
      <p className="ff-footer-a">{FF_COPY.footer.lineA}</p>
      <p className="ff-footer-b">{FF_COPY.footer.lineB}</p>
    </footer>
  );
}

export function FfInvitationOnly({ unreachable = false }: { unreachable?: boolean }) {
  return (
    <div className="ff-root" lang="en-ZA">
      <Background />
      <main className="ff-main">
        <div className="ff-gate">
          <img
            className="ff-wordmark"
            src={FF_IMAGES.wordmark.src}
            width={FF_IMAGES.wordmark.width}
            height={FF_IMAGES.wordmark.height}
            alt={FF_COPY.invite.wordmarkAlt}
            style={{ height: 'auto' }}
          />
          <h1 className="ff-box ff-tracked" style={{ margin: 0 }}>
            {FF_COPY.gate.label}
          </h1>
          <p>{unreachable ? FF_COPY.gate.unreachable : FF_COPY.gate.body}</p>
        </div>
      </main>
    </div>
  );
}

export default function FfInvitePage() {
  const { token = '' } = useParams();
  const [gate, setGate] = useState<Gate>(token ? 'checking' : 'invalid');
  const [saved] = useState<FfForm | null>(() => (typeof window === 'undefined' ? null : readSaved()));
  const [form, setForm] = useState<FfForm>(saved ?? EMPTY_FORM);
  const [view, setView] = useState<View>(saved ? (saved.attending ? 'yes' : 'no') : 'form');
  const [animatePanel, setAnimatePanel] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const rsvpRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(apiUrl('/api/ff/invite'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) setGate('valid');
        else if (res.status === 404) setGate('invalid');
        else setGate('error');
      })
      .catch(() => {
        if (!cancelled) setGate('error');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useFfReveal(rootRef, gate === 'valid');

  function revealRsvp(focusSelector?: string) {
    setAnimatePanel(true);
    requestAnimationFrame(() => {
      rsvpRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
      if (focusSelector) {
        rsvpRef.current?.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true });
      }
    });
  }

  async function submit(next: FfForm): Promise<boolean> {
    try {
      const res = await fetch(apiUrl('/api/ff/rsvp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName: next.firstName.trim(),
          surname: next.surname.trim(),
          mobile: normaliseSaMobile(next.mobile) ?? next.mobile.trim(),
          email: next.email.trim(),
          attending: next.attending,
        }),
      });
      if (!res.ok) return false;
    } catch {
      return false;
    }
    const clean: FfForm = {
      ...next,
      firstName: next.firstName.trim(),
      surname: next.surname.trim(),
      mobile: next.mobile.trim(),
      email: next.email.trim(),
    };
    writeSaved(clean);
    setForm(clean);
    setView(clean.attending ? 'yes' : 'no');
    revealRsvp();
    return true;
  }

  if (gate === 'checking') {
    return <div className="ff-root" lang="en-ZA" aria-busy="true" />;
  }
  if (gate !== 'valid') {
    return <FfInvitationOnly unreachable={gate === 'error'} />;
  }

  const i = FF_COPY.invite;
  const firstName = form.firstName.trim();
  const panelClass = animatePanel ? 'ff-panel-in' : undefined;

  return (
    <div className="ff-root" lang="en-ZA" ref={rootRef}>
      <Background />
      <main className="ff-main">
        <header className="ff-header ff-reveal">
          <img
            className="ff-wordmark"
            src={FF_IMAGES.wordmark.src}
            width={FF_IMAGES.wordmark.width}
            height={FF_IMAGES.wordmark.height}
            alt={i.wordmarkAlt}
          />
          <p className="ff-with" style={{ margin: 0 }}>
            {i.withWord}
          </p>
          <img
            className="ff-martell"
            src={FF_IMAGES.martell.src}
            width={FF_IMAGES.martell.width}
            height={FF_IMAGES.martell.height}
            alt={i.martellAlt}
          />
          <span className="ff-cross" aria-hidden="true">
            {i.cross}
          </span>
          <p className="ff-cohost" style={{ margin: 0 }}>
            {i.coHost}
          </p>
          <p className="ff-tracked ff-present" style={{ margin: 0 }}>
            {i.present}
          </p>
        </header>

        <h1 className="ff-title ff-reveal">
          <img
            src={FF_IMAGES.title.src}
            width={FF_IMAGES.title.width}
            height={FF_IMAGES.title.height}
            alt={i.titleAlt}
          />
        </h1>

        <p className="ff-tagline ff-reveal">
          {i.taglineA}
          <br /> {i.taglineB}
        </p>

        <div className="ff-datetime ff-reveal">
          <span>
            {i.dateA}
            <br />
            {i.dateB}
          </span>
          <span className="ff-datetime-rule" aria-hidden="true" />
          <span>{i.time}</span>
        </div>

        <div className="ff-hairline ff-reveal" aria-hidden="true" />

        <address className="ff-venue ff-reveal">
          {i.venueA}
          <br />
          {i.venueB}
        </address>

        <div className="ff-boxwrap ff-reveal">
          <p className="ff-box ff-tracked" style={{ margin: 0 }}>
            {i.invitationOnly}
          </p>
        </div>

        <section className="ff-rsvp ff-reveal" ref={rsvpRef} aria-labelledby="ff-rsvp-heading">
          <div className="ff-ornament" aria-hidden="true">
            <span className="ff-ornament-line" />
            <span className="ff-ornament-oval" />
            <span className="ff-ornament-line" />
          </div>

          {view === 'form' && (
            <div key="form" className={panelClass}>
              <h2 className="ff-h2" id="ff-rsvp-heading">
                {FF_COPY.form.heading}
              </h2>
              <p className="ff-intro">{FF_COPY.form.intro}</p>
              <FfRsvpForm initial={form} onSubmit={submit} />
            </div>
          )}

          {view === 'yes' && (
            <div key="yes" className={`ff-thanks ${panelClass ?? ''}`} role="status">
              <p className="ff-tracked">{FF_COPY.thanksYes.label}</p>
              <h2 className="ff-thanks-h" id="ff-rsvp-heading">
                {FF_COPY.thanksYes.heading(firstName)}
              </h2>
              <p className="ff-thanks-lead">{FF_COPY.thanksYes.lead}</p>
              <p className="ff-thanks-body">{FF_COPY.thanksYes.body}</p>
              <p className="ff-thanks-details">
                {FF_COPY.thanksYes.detailsA}
                <br />
                {FF_COPY.thanksYes.detailsB}
              </p>
              <button
                type="button"
                className="ff-link"
                onClick={() => {
                  setView('form');
                  revealRsvp('#ff-firstName');
                }}
              >
                {FF_COPY.thanksYes.link}
              </button>
            </div>
          )}

          {view === 'no' && (
            <div key="no" className={`ff-thanks ${panelClass ?? ''}`} role="status">
              <p className="ff-tracked">{FF_COPY.thanksNo.label}</p>
              <h2 className="ff-thanks-h" id="ff-rsvp-heading">
                {FF_COPY.thanksNo.heading(firstName)}
              </h2>
              <p className="ff-thanks-lead">{FF_COPY.thanksNo.lead}</p>
              <p className="ff-thanks-body">{FF_COPY.thanksNo.body}</p>
              <button
                type="button"
                className="ff-link"
                onClick={() => {
                  setView('form');
                  revealRsvp('#ff-firstName');
                }}
              >
                {FF_COPY.thanksNo.link}
              </button>
            </div>
          )}
        </section>

        <Footer />
      </main>
    </div>
  );
}
