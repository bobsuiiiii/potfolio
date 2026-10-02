'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { API } from '@/lib/api';

// Deterministic gradient so projects without an image still look intentional.
function Placeholder({ title }) {
  let h = 0;
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <div
      className="flex h-full items-center justify-center font-mono text-5xl font-bold text-white/80"
      style={{ background: `linear-gradient(135deg, hsl(${h} 70% 25%), hsl(${(h + 60) % 360} 70% 12%))` }}
      aria-hidden="true"
    >
      {title.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function ProjectGallery({ projects = [] }) {
  const [active, setActive] = useState('All');
  const tags = useMemo(() => ['All', ...Array.from(new Set(projects.flatMap((p) => p.tags))).sort()], [projects]);
  const visible = active === 'All' ? projects : projects.filter((p) => p.tags.includes(active));

  return (
    <section id="projects" className="mx-auto max-w-6xl px-6 py-24" aria-labelledby="projects-heading">
      <h2 id="projects-heading" className="mb-8 text-3xl font-bold text-white">Projects</h2>

      {tags.length > 1 && (
        <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter projects by tag">
          {tags.map((t) => (
            <button
              key={t}
              aria-pressed={active === t}
              onClick={() => setActive(t)}
              className={`rounded-full border px-4 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                active === t
                  ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 && (
        <p className="text-slate-400">No projects yet. Add one from the admin dashboard and it will appear here.</p>
      )}

      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((p) => (
            <motion.article
              key={p._id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{ transformPerspective: 900 }}
              className="glass group overflow-hidden rounded-2xl hover:border-cyan-400/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
            >
              <div className="aspect-[16/9] overflow-hidden bg-slate-900">
                {p.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${API}${p.thumbnailUrl}`} alt={`${p.title} thumbnail`} loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                ) : (
                  <Placeholder title={p.title} />
                )}
              </div>
              <div className="space-y-3 p-5">
                <h3 className="text-lg font-semibold text-white">
                  <Link href={`/projects/${p.slug}`} className="hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">{p.title}</Link>
                </h3>
                <p className="line-clamp-3 text-sm text-slate-300">{p.description}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <li key={t} className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">{t}</li>
                  ))}
                </ul>
                <div className="flex gap-4 pt-1 text-sm">
                  <Link href={`/projects/${p.slug}`} className="text-slate-300 hover:text-cyan-300">Read more</Link>
                  {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-cyan-300">GitHub</a>}
                  {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-cyan-300">Live demo</a>}
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
