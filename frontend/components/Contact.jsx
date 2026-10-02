'use client';

import { useState } from 'react';
import { API } from '@/lib/api';
import { site } from '@/lib/site';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Enter your name.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (v.message.trim().length < 10) e.message = 'Write at least 10 characters.';
  return e;
}

export default function Contact() {
  const [v, setV] = useState({ name: '', email: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', msg: '' });

  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  async function onSubmit(ev) {
    ev.preventDefault();
    const errs = validate(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus({ state: 'sending', msg: '' });
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setStatus({ state: 'ok', msg: 'Message sent. I will reply by email.' });
      setV({ name: '', email: '', message: '', website: '' });
    } catch (err) {
      setStatus({ state: 'error', msg: err.message });
    }
  }

  const input = 'w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400';

  return (
    <section id="contact" className="mx-auto max-w-3xl px-6 py-24" aria-labelledby="contact-h">
      <h2 id="contact-h" className="mb-8 text-3xl font-bold text-white">Contact</h2>
      <form onSubmit={onSubmit} noValidate className="glass space-y-5 rounded-3xl p-8">
        {/* Honeypot: hidden from people and screen readers, bots fill it in. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} /></label>
        </div>

        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-sm text-slate-300">Name</label>
          <input id="c-name" className={input} value={v.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'c-name-e' : undefined} />
          {errors.name && <p id="c-name-e" className="mt-1 text-sm text-rose-400">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-sm text-slate-300">Email</label>
          <input id="c-email" type="email" className={input} value={v.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'c-email-e' : undefined} />
          {errors.email && <p id="c-email-e" className="mt-1 text-sm text-rose-400">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="c-msg" className="mb-1.5 block text-sm text-slate-300">Message</label>
          <textarea id="c-msg" rows={5} maxLength={3000} className={input} value={v.message} onChange={set('message')} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'c-msg-e' : undefined} />
          {errors.message && <p id="c-msg-e" className="mt-1 text-sm text-rose-400">{errors.message}</p>}
        </div>

        <button disabled={status.state === 'sending'} className="rounded-lg bg-cyan-400 px-6 py-2.5 font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:bg-cyan-300 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          {status.state === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        <p role="status" aria-live="polite" className={`text-sm ${status.state === 'ok' ? 'text-emerald-300' : 'text-rose-400'}`}>{status.msg}</p>
      </form>

      <ul className="mt-8 flex gap-6 text-slate-300">
        {Object.entries(site.socials).map(([k, url]) => (
          <li key={k}><a href={url} target="_blank" rel="noopener noreferrer" className="capitalize hover:text-cyan-300">{k}</a></li>
        ))}
      </ul>
    </section>
  );
}
