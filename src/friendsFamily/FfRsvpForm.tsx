import { useRef, useState, type FormEvent } from 'react';
import { FF_COPY, FIELD_ORDER, validateForm, type FfForm, type FfFormErrors } from './content.ts';

type Props = {
  initial: FfForm;
  onSubmit: (form: FfForm) => Promise<boolean>;
};

function Tick() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" aria-hidden="true" focusable="false">
      <path d="M1 5.5 5 9.5 13 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function FfRsvpForm({ initial, onSubmit }: Props) {
  const c = FF_COPY.form;
  const [form, setForm] = useState<FfForm>(initial);
  const [errors, setErrors] = useState<FfFormErrors>({});
  const [sending, setSending] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const refs = useRef<Partial<Record<keyof FfForm, HTMLElement | null>>>({});

  const setField = <K extends keyof FfForm>(key: K, value: FfForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSaveFailed(false);
    const found = validateForm(form);
    setErrors(found);
    const first = FIELD_ORDER.find((k) => found[k]);
    if (first) {
      refs.current[first]?.focus();
      return;
    }
    setSending(true);
    const ok = await onSubmit(form);
    setSending(false);
    if (!ok) setSaveFailed(true);
  }

  const text = (
    key: 'firstName' | 'surname' | 'mobile' | 'email',
    label: string,
    props: {
      type: string;
      autoComplete: string;
      maxLength: number;
      inputMode?: 'tel' | 'email';
      placeholder?: string;
    },
  ) => {
    const id = `ff-${key}`;
    const err = errors[key];
    return (
      <div className="ff-field">
        <label className="ff-label" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          name={key}
          className="ff-input"
          value={form[key]}
          onChange={(e) => setField(key, e.target.value)}
          aria-invalid={err ? 'true' : undefined}
          aria-describedby={err ? `${id}-error` : undefined}
          ref={(el) => {
            refs.current[key] = el;
          }}
          {...props}
        />
        {err && (
          <p className="ff-error" id={`${id}-error`}>
            {err}
          </p>
        )}
      </div>
    );
  };

  return (
    <form className="ff-form" noValidate onSubmit={handleSubmit}>
      <div className="ff-row">
        {text('firstName', c.firstName, { type: 'text', autoComplete: 'given-name', maxLength: 80 })}
        {text('surname', c.surname, { type: 'text', autoComplete: 'family-name', maxLength: 80 })}
      </div>
      {text('mobile', c.mobile, {
        type: 'tel',
        inputMode: 'tel',
        autoComplete: 'tel',
        maxLength: 20,
        placeholder: c.mobilePlaceholder,
      })}
      {text('email', c.email, { type: 'email', inputMode: 'email', autoComplete: 'email', maxLength: 160 })}

      <fieldset
        className="ff-fieldset"
        aria-describedby={errors.attending ? 'ff-attending-error' : undefined}
      >
        <legend className="ff-label ff-legend">{c.question}</legend>
        <div className="ff-choices">
          {([
            [true, c.accept],
            [false, c.decline],
          ] as const).map(([value, label], i) => (
            <button
              key={label}
              type="button"
              className="ff-choice"
              aria-pressed={form.attending === value}
              aria-invalid={errors.attending ? 'true' : undefined}
              onClick={() => setField('attending', value)}
              ref={
                i === 0
                  ? (el) => {
                      refs.current.attending = el;
                    }
                  : undefined
              }
            >
              {form.attending === value && <Tick />}
              {label}
            </button>
          ))}
        </div>
        {errors.attending && (
          <p className="ff-error" id="ff-attending-error">
            {errors.attending}
          </p>
        )}
      </fieldset>

      <div className="ff-submit-wrap">
        {saveFailed && (
          <p className="ff-alert" role="alert">
            {FF_COPY.errors.saveFailed}
          </p>
        )}
        <button type="submit" className="ff-btn" disabled={sending}>
          {sending ? c.submitting : c.submit}
        </button>
        <p className="ff-popia">{c.popia}</p>
      </div>
    </form>
  );
}
