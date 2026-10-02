'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { site } from '@/lib/site';

export default function Skills() {
  const reduce = useReducedMotion();
  return (
    <section id="skills" className="mx-auto max-w-5xl px-6 py-24" aria-labelledby="skills-h">
      <h2 id="skills-h" className="mb-10 text-3xl font-bold text-white">Skills</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {site.skills.map((s) => (
          <li key={s.name} className="glass rounded-2xl p-5">
            <div className="mb-3 flex justify-between font-mono text-sm">
              <span className="text-white">{s.name}</span>
              <span className="text-cyan-300">{s.level}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={s.level} aria-valuemin={0} aria-valuemax={100} aria-label={s.name}>
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                initial={{ width: reduce ? `${s.level}%` : 0 }}
                whileInView={{ width: `${s.level}%` }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
