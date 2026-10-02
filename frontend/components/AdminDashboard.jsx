'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { API } from '@/lib/api';

const TOKEN_KEY = 'phz_admin_token'; // sessionStorage: cleared when the tab closes

export default function AdminDashboard() {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  const [login, setLogin] = useState({ username: '', password: '' });
  const [idea, setIdea] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [projects, setProjects] = useState([]);
  const abortRef = useRef(null);

  useEffect(() => {
    setToken(sessionStorage.getItem(TOKEN_KEY));
    setReady(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setResult(null);
  }, []);

  async function request(path, { method = 'POST', body, signal } = {}) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
    if (res.status === 204) return {};
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && token) logout();
    if (!res.ok) {
      const detail = data.details?.map((d) => d.message).join(' ');
      throw new Error(detail || data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/projects`);
      if (res.ok) setProjects((await res.json()).projects);
    } catch {
      /* list is a convenience; ignore failures */
    }
  }, []);

  useEffect(() => { if (token) loadProjects(); }, [token, loadProjects]);

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token: t } = await request('/api/admin/login', { body: login });
      sessionStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      setLogin({ username: '', password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    abortRef.current = new AbortController();
    const timeout = setTimeout(() => abortRef.current.abort(), 150_000);
    try {
      const data = await request('/api/admin/ai/generate', {
        body: { idea, githubUrl, liveUrl, publish: true },
        signal: abortRef.current.signal,
      });
      setResult(data);
      setIdea('');
      loadProjects();
    } catch (err) {
      setError(err.name === 'AbortError' ? 'Timed out. Check the project list below before retrying; it may have saved.' : err.message);
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await request(`/api/admin/projects/${p._id}`, { method: 'DELETE' });
      setProjects((list) => list.filter((x) => x._id !== p._id));
    } catch (err) {
      setError(err.message);
    }
  }

  const field =
    'w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400';

  if (!ready) return null;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <form onSubmit={handleLogin} className="glass w-full max-w-sm space-y-4 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white">Admin</h1>
          <input className={field} placeholder="Username" aria-label="Username" autoComplete="username" value={login.username}
            onChange={(e) => setLogin({ ...login, username: e.target.value })} required />
          <input className={field} type="password" placeholder="Password" aria-label="Password" autoComplete="current-password" value={login.password}
            onChange={(e) => setLogin({ ...login, password: e.target.value })} required />
          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-cyan-400 py-2.5 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Auto-Project Creator</h1>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-white">Log out</button>
        </header>

        <form onSubmit={handleGenerate} className="glass space-y-4 rounded-2xl p-6">
          <label htmlFor="idea" className="block text-sm text-slate-300">Describe what you built</label>
          <textarea id="idea" rows={6} maxLength={2000} className={field} value={idea} onChange={(e) => setIdea(e.target.value)} required
            placeholder="I built a Discord bot with a split-or-steal mini-game and a prediction market using Node.js and MongoDB." />
          <div className="grid gap-4 sm:grid-cols-2">
            <input className={field} type="url" aria-label="GitHub URL" placeholder="GitHub URL (optional)" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
            <input className={field} type="url" aria-label="Live demo URL" placeholder="Live demo URL (optional)" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{idea.length}/2000</span>
            <button disabled={busy || idea.trim().length < 20}
              className="rounded-lg bg-cyan-400 px-6 py-2.5 font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:bg-cyan-300 disabled:opacity-40 disabled:shadow-none">
              {busy ? 'Generating… (up to ~60s)' : 'Generate & Publish'}
            </button>
          </div>
          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        </form>

        {result && (
          <section className="space-y-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-6" aria-live="polite">
            <h2 className="text-lg font-semibold text-emerald-300">
              Published: {result.project.title}
              {result.imageStatus === 'failed' && <span className="ml-2 text-sm text-amber-300">(image failed; text saved)</span>}
            </h2>
            {result.project.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${API}${result.project.thumbnailUrl}`} alt="Generated thumbnail" className="w-full rounded-xl" />
            )}
            <p className="text-sm text-slate-300">{result.project.description}</p>
            <div className="prose prose-invert max-w-none"><ReactMarkdown>{result.project.writeup}</ReactMarkdown></div>
          </section>
        )}

        <section aria-labelledby="existing-h" className="space-y-3">
          <h2 id="existing-h" className="text-lg font-semibold">Published projects</h2>
          {projects.length === 0 && <p className="text-sm text-slate-500">Nothing published yet.</p>}
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p._id} className="glass flex items-center justify-between rounded-xl px-4 py-3">
                <span className="truncate pr-4">{p.title}</span>
                <button onClick={() => handleDelete(p)} className="text-sm text-rose-400 hover:text-rose-300">Delete</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
