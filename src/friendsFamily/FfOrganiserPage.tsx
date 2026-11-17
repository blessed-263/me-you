import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../lib/api.ts';
import { FF_BASE_PATH, FF_COPY, FF_IMAGES, FF_LABELS } from './content.ts';
import {
  filterRows,
  formatSast,
  formatSastTime,
  labelCounts,
  toCsv,
  totals,
  type FfRsvp,
  type LabelFilter,
  type FfStatus,
  type ResponseFilter,
  type StatusFilter,
} from './organiserData.ts';
import './ff.css';

const SESSION_KEY = 'yme-ff-organiser-session';

type DecisionEmailResult = 'none' | 'sent' | 'already-sent' | 'not-attending' | 'failed';
type Decision = 'approved' | 'declined';

function sentAt(r: FfRsvp, d: Decision): string | null | undefined {
  return d === 'approved' ? r.approvedEmailSentAt : r.declinedEmailSentAt;
}

/** Pop-up to set a guest's internal labels (no email, no status change). */
function LabelEditor({
  row,
  onSave,
  onCancel,
}: {
  row: FfRsvp;
  onSave: (tags: string[], guestOf: string | null) => void;
  onCancel: () => void;
}) {
  const [tags, setTags] = useState<string[]>(row.tags ?? []);
  const [guestOf, setGuestOf] = useState<string | null>(row.guestOf ?? null);
  const toggle = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  return (
    <div className="ffo-modal-backdrop" onClick={onCancel}>
      <div
        className="ffo-modal ffo-modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ffo-labels-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      >
        <h2 id="ffo-labels-title" className="ffo-modal-title">
          {o.labelsTitle(`${row.firstName} ${row.surname}`)}
        </h2>
        <fieldset className="ffo-labelset">
          <legend className="ffo-label">{o.labelsType}</legend>
          {FF_LABELS.types.map((t) => (
            <button
              key={t}
              type="button"
              className="ffo-chip ffo-chip-btn ffo-chip-lg"
              aria-pressed={tags.includes(t)}
              onClick={() => toggle(t)}
            >
              {t}
            </button>
          ))}
        </fieldset>
        <fieldset className="ffo-labelset">
          <legend className="ffo-label">{o.labelsGuestOf}</legend>
          <p className="ffo-small" style={{ margin: '0 0 8px', width: '100%' }}>
            {o.labelsGuestOfHint}
          </p>
          {FF_LABELS.guestOf.map((g) => (
            <button
              key={g}
              type="button"
              className="ffo-chip ffo-chip-btn ffo-chip-lg"
              aria-pressed={guestOf === g}
              onClick={() => setGuestOf(guestOf === g ? null : g)}
            >
              {g}
            </button>
          ))}
        </fieldset>
        <p className="ffo-small">{o.labelsNote}</p>
        <div className="ffo-modal-actions">
          <button type="button" className="ffo-btn" onClick={onCancel}>
            {o.cancel}
          </button>
          <button
            type="button"
            className="ffo-btn ffo-btn-solid"
            onClick={() => onSave(FF_LABELS.types.filter((t) => tags.includes(t)), guestOf)}
          >
            {o.save}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Confirmation pop-up before Approve / Decline (which may email the guest). */
function ConfirmDecision({
  row,
  decision,
  onConfirm,
  onCancel,
}: {
  row: FfRsvp;
  decision: Decision;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const name = `${row.firstName} ${row.surname}`;
  const already = sentAt(row, decision);
  const willEmail = row.attending && !already;
  const text = !row.attending
    ? o.confirmNoEmailNotAttending(name, decision)
    : already
      ? o.confirmNoEmailAlready(name, decision, formatSast(already))
      : o.confirmSend(name, row.email, decision);
  const action = willEmail ? o.send : decision === 'approved' ? o.approve : o.decline;
  return (
    <div className="ffo-modal-backdrop" onClick={onCancel}>
      <div
        className="ffo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ffo-modal-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      >
        <h2 id="ffo-modal-title" className="ffo-modal-title">
          {decision === 'approved' ? o.confirmTitleApprove : o.confirmTitleDecline}
        </h2>
        <p>{text}</p>
        <div className="ffo-modal-actions">
          <button type="button" className="ffo-btn" onClick={onCancel}>
            {o.cancel}
          </button>
          <button type="button" className="ffo-btn ffo-btn-solid" onClick={onConfirm} autoFocus>
            {action}
          </button>
        </div>
      </div>
    </div>
  );
}
const o = FF_COPY.organiser;

function loadSession(): string | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { session, expiresAt } = JSON.parse(raw) as { session: string; expiresAt: number };
    return expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function storeSession(value: { session: string; expiresAt: number } | null): void {
  try {
    if (value) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* memory-only session */
  }
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<{ status: number; data: T | null }> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  return { status: res.status, data };
}

function Login({ onSignedIn, notice }: { onSignedIn: (s: string) => void; notice: string }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(notice);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) {
      setError(o.emptyPasscode);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { status, data } = await post<{ session: string; expiresAt: number }>(
        '/api/ff/organiser/login',
        { passcode },
      );
      if (status === 200 && data?.session) {
        storeSession(data);
        onSignedIn(data.session);
        return;
      }
      setError(status === 401 ? o.wrongPasscode : status === 429 ? o.tooMany : o.unreachable);
    } catch {
      setError(o.unreachable);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ffo-login">
      <img
        src={FF_IMAGES.wordmark.src}
        width={FF_IMAGES.wordmark.width}
        height={FF_IMAGES.wordmark.height}
        alt="You&Me"
      />
      <h1 className="ffo-h1">{o.loginHeading}</h1>
      <p className="ffo-sub">{o.loginSub}</p>
      <form onSubmit={submit} noValidate>
        <label className="ffo-label" htmlFor="ffo-passcode">
          {o.passcode}
        </label>
        <input
          id="ffo-passcode"
          className="ffo-input"
          type="password"
          autoComplete="current-password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'ffo-passcode-error' : undefined}
        />
        {error && (
          <p id="ffo-passcode-error" className="ff-error" role="alert">
            {error}
          </p>
        )}
        <button className="ffo-btn ffo-btn-solid" type="submit" disabled={busy}>
          {o.enter}
        </button>
      </form>
    </div>
  );
}

function StatusBadge({ status }: { status: FfStatus }) {
  return <span className={`ffo-badge ffo-badge-${status}`}>{status.toUpperCase()}</span>;
}

export default function FfOrganiserPage() {
  const [session, setSession] = useState<string | null>(() => loadSession());
  const [rows, setRows] = useState<FfRsvp[] | null>(null);
  const [notice, setNotice] = useState('');
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [csvFallback, setCsvFallback] = useState('');
  const [response, setResponse] = useState<ResponseFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ row: FfRsvp; decision: Decision } | null>(null);
  const [labelFilter, setLabelFilter] = useState<LabelFilter>('all');
  const [labelEdit, setLabelEdit] = useState<FfRsvp | null>(null);
  const [loading, setLoading] = useState(false);

  const signOut = useCallback((reason = '') => {
    storeSession(null);
    setSession(null);
    setRows(null);
    setNotice(reason);
  }, []);

  const load = useCallback(
    async (s: string, manual = false) => {
      setLoading(true);
      try {
        const { status: code, data } = await post<{ rsvps: FfRsvp[] }>('/api/ff/organiser/list', {
          session: s,
        });
        if (code === 401) {
          signOut(o.sessionEnded);
          return;
        }
        if (code !== 200 || !data) throw new Error(String(code));
        setRows(data.rsvps);
        if (manual) setMessage(null);
      } catch {
        setMessage({ text: manual ? o.refreshFailed : o.unreachable, error: true });
      } finally {
        setLoading(false);
      }
    },
    [signOut],
  );

  useEffect(() => {
    if (session) void load(session);
  }, [session, load]);

  const shown = useMemo(
    () => (rows ? filterRows(rows, response, status, search, labelFilter) : []),
    [rows, response, status, search, labelFilter],
  );
  const t = useMemo(() => totals(rows ?? []), [rows]);
  const counts = useMemo(() => labelCounts(rows ?? [], FF_LABELS.types, FF_LABELS.guestOf), [rows]);

  async function update(id: string, path: string, body: Record<string, unknown>, savedText?: string) {
    if (!session) return;
    setBusyId(id);
    try {
      const { status: code, data } = await post<{ rsvp: FfRsvp; email?: DecisionEmailResult }>(path, {
        session,
        id,
        ...body,
      });
      if (code === 401) {
        signOut(o.sessionEnded);
        return;
      }
      if (code !== 200 || !data?.rsvp) throw new Error(String(code));
      setRows((prev) => prev?.map((r) => (r.id === id ? data.rsvp : r)) ?? prev);
      const name = `${data.rsvp.firstName} ${data.rsvp.surname}`;
      const email = data.email ?? 'none';
      if (email === 'sent') setMessage({ text: o.emailSent(name, data.rsvp.email) });
      else if (email === 'failed') setMessage({ text: o.emailFailed(name), error: true });
      else if (email === 'already-sent') setMessage({ text: o.emailAlready(name) });
      else if (email === 'not-attending') setMessage({ text: o.emailNotAttending(name) });
      else setMessage(savedText ? { text: savedText } : null);
    } catch {
      setMessage({ text: o.saveFailed, error: true });
    } finally {
      setBusyId(null);
    }
  }

  async function copyCsv() {
    const csv = toCsv(shown);
    try {
      await navigator.clipboard.writeText(csv);
      setCsvFallback('');
      setMessage({ text: o.copied(shown.length) });
    } catch {
      setCsvFallback(csv);
      setMessage({ text: o.copyBlocked });
    }
  }

  function downloadCsv() {
    const blob = new Blob(['﻿', toCsv(shown)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'friends-and-family-rsvps.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!session) {
    return (
      <div className="ffo-root" lang="en-ZA">
        <Login
          notice={notice}
          onSignedIn={(s) => {
            setNotice('');
            setSession(s);
          }}
        />
        <p style={{ textAlign: 'center', margin: 0 }}>
          <Link className="ffo-back" to={FF_BASE_PATH}>
            {/* Guests reach the invite through their own token link; this goes to the gate. */}
            Back to the RSVP page
          </Link>
        </p>
      </div>
    );
  }

  const responseOptions: [ResponseFilter, string][] = [
    ['all', 'All'],
    ['yes', 'Attending'],
    ['no', 'Not attending'],
  ];
  const statusOptions: [StatusFilter, string][] = [
    ['all', 'All'],
    ['pending', 'Pending'],
    ['approved', 'Approved'],
    ['declined', 'Declined'],
    ['arrived', 'Arrived'],
  ];
  const stats = [t.responses, t.attending, t.notAttending, t.pending, t.arrived];

  return (
    <div className="ffo-root" lang="en-ZA">
      <header className="ffo-header">
        <div>
          <h1>{o.title}</h1>
          <p className="ffo-sub">{o.sub}</p>
        </div>
        <div className="ffo-actions">
          <button className="ffo-btn" type="button" onClick={() => void load(session, true)} disabled={loading}>
            {o.refresh}
          </button>
          <button className="ffo-btn" type="button" onClick={() => void copyCsv()} disabled={!rows}>
            {o.copyCsv}
          </button>
          <button className="ffo-btn" type="button" onClick={downloadCsv} disabled={!rows}>
            {o.downloadCsv}
          </button>
          <button className="ffo-btn" type="button" onClick={() => signOut()}>
            {o.signOut}
          </button>
        </div>
      </header>

      <main className="ffo-body">
        <div className="ffo-search">
          <label className="ffo-label" htmlFor="ffo-search">
            {o.search}
          </label>
          <input
            id="ffo-search"
            className="ffo-input"
            type="search"
            placeholder={o.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="ffo-stats">
          {o.totals.map((label, idx) => (
            <div className="ffo-stat" key={label}>
              <div className="ffo-stat-n">{stats[idx]}</div>
              <div className="ffo-stat-l">{label}</div>
            </div>
          ))}
        </div>

        <div className="ffo-labelcounts" aria-label={o.labelCountsHeading}>
          <span className="ffo-label">{o.labelCountsHeading}</span>
          {counts.length === 0 ? (
            <span className="ffo-small">{o.noLabelsYet}</span>
          ) : (
            counts.map((c) => (
              <button
                key={c.key}
                type="button"
                className="ffo-chip ffo-chip-btn"
                aria-pressed={labelFilter === c.key}
                onClick={() => setLabelFilter(labelFilter === c.key ? 'all' : c.key)}
              >
                {c.label} <strong>{c.n}</strong>
              </button>
            ))
          )}
        </div>

        <div className="ffo-filters">
          <fieldset className="ffo-filter-group">
            <legend className="ffo-label">{o.response}</legend>
            {responseOptions.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="ffo-btn"
                aria-pressed={response === value}
                onClick={() => setResponse(value)}
              >
                {label}
              </button>
            ))}
          </fieldset>
          <fieldset className="ffo-filter-group">
            <legend className="ffo-label">{o.status}</legend>
            {statusOptions.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="ffo-btn"
                aria-pressed={status === value}
                onClick={() => setStatus(value)}
              >
                {label}
              </button>
            ))}
          </fieldset>
          <div className="ffo-filter-group">
            <label className="ffo-label" htmlFor="ffo-labelfilter">
              {o.labelFilter}
            </label>
            <select
              id="ffo-labelfilter"
              className="ffo-select ffo-select-inline"
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
            >
              <option value="all">{o.allLabels}</option>
              {FF_LABELS.types.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
              {FF_LABELS.guestOf.map((g) => (
                <option key={g} value={`guestof:${g}`}>
                  {o.guestOfLabel(g)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <p className={`ffo-msg ${message.error ? 'ffo-msg-error' : ''}`} role={message.error ? 'alert' : 'status'}>
            {message.text}
          </p>
        )}
        {csvFallback && (
          <textarea className="ffo-csv" readOnly value={csvFallback} aria-label="CSV" onFocus={(e) => e.target.select()} />
        )}

        <div className="ffo-table-wrap">
          <table className="ffo-table">
            <thead>
              <tr>
                {o.headings.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="ffo-name">
                      {r.firstName} {r.surname}
                    </div>
                    <div className="ffo-chips">
                      {(r.tags ?? []).map((tag) => (
                        <span key={tag} className={`ffo-chip ${tag === 'Important' ? 'ffo-chip-strong' : ''}`}>
                          {tag}
                        </span>
                      ))}
                      {r.guestOf && <span className="ffo-chip ffo-chip-guestof">{o.guestOfLabel(r.guestOf)}</span>}
                      <button
                        type="button"
                        className="ffo-chip ffo-chip-btn ffo-chip-edit"
                        disabled={busyId === r.id}
                        onClick={() => setLabelEdit(r)}
                        aria-label={`${o.labels}: ${r.firstName} ${r.surname}`}
                      >
                        + {o.labels}
                      </button>
                    </div>
                  </td>
                  <td data-label={o.headings[1]}>
                    <a href={`tel:${r.mobile}`} style={{ color: 'inherit' }}>
                      {r.mobile}
                    </a>
                  </td>
                  <td data-label={o.headings[2]} style={{ wordBreak: 'break-all' }}>
                    {r.email}
                  </td>
                  <td data-label={o.headings[3]}>{r.attending ? o.attending : o.notAttending}</td>
                  <td data-label={o.headings[4]} className="ffo-small">
                    {formatSast(r.createdAt)}
                  </td>
                  <td data-label={o.headings[5]}>
                    <StatusBadge status={r.status} />
                    {(r.status === 'approved' || r.status === 'declined') && (
                      <div className="ffo-small">
                        {!r.attending
                          ? o.noEmailNotAttending
                          : sentAt(r, r.status)
                            ? o.emailedAt(formatSast(sentAt(r, r.status) ?? null))
                            : o.emailNotSent}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="ffo-rowbtns">
                      {([
                        ['approved', o.approve],
                        ['declined', o.decline],
                      ] as const).map(([decision, label]) => (
                        <button
                          key={decision}
                          type="button"
                          className="ffo-btn"
                          aria-pressed={r.status === decision}
                          disabled={busyId === r.id}
                          onClick={() =>
                            r.status === decision
                              ? void update(r.id, '/api/ff/organiser/status', { status: 'pending' })
                              : setConfirm({ row: r, decision })
                          }
                        >
                          {label}
                        </button>
                      ))}
                      {(r.status === 'approved' || r.status === 'declined') &&
                        r.attending &&
                        !sentAt(r, r.status) && (
                          <button
                            type="button"
                            className="ffo-btn ffo-btn-solid"
                            disabled={busyId === r.id}
                            onClick={() => setConfirm({ row: r, decision: r.status as Decision })}
                          >
                            {o.retryEmail}
                          </button>
                        )}
                    </div>
                  </td>
                  <td>
                    <div className="ffo-rowbtns">
                      <button
                        type="button"
                        className={`ffo-btn ${r.arrived ? '' : 'ffo-btn-solid'}`}
                        disabled={busyId === r.id}
                        onClick={() => void update(r.id, '/api/ff/organiser/checkin', { arrived: !r.arrived })}
                      >
                        {r.arrived ? o.undoCheckIn : o.checkIn}
                      </button>
                    </div>
                    {r.arrived && <div className="ffo-small">{o.arrivedAt(formatSastTime(r.checkedInAt))}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows && shown.length === 0 && (
            <p className="ffo-empty">{rows.length === 0 ? o.noneYet : o.noneMatch}</p>
          )}
        </div>
        {rows && <p className="ffo-footer">{o.footer(shown.length, rows.length)}</p>}
      </main>
      {labelEdit && (
        <LabelEditor
          row={labelEdit}
          onCancel={() => setLabelEdit(null)}
          onSave={(tags, guestOf) => {
            const row = labelEdit;
            setLabelEdit(null);
            void update(
              row.id,
              '/api/ff/organiser/labels',
              { tags, guestOf },
              o.labelsSaved(`${row.firstName} ${row.surname}`),
            );
          }}
        />
      )}
      {confirm && (
        <ConfirmDecision
          row={confirm.row}
          decision={confirm.decision}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const { row, decision } = confirm;
            setConfirm(null);
            void update(row.id, '/api/ff/organiser/status', { status: decision });
          }}
        />
      )}
    </div>
  );
}
