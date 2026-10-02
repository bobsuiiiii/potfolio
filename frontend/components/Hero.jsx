'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { site } from '@/lib/site';

function useTyping(words) {
  const reduce = useReducedMotion();
  const [text, setText] = useState(reduce ? words[0] : '');
  useEffect(() => {
    if (reduce) return;
    let w = 0, c = 0, deleting = false, t;
    const tick = () => {
      const word = words[w];
      c += deleting ? -1 : 1;
      setText(word.slice(0, c));
      let delay = deleting ? 40 : 85;
      if (!deleting && c === word.length) { deleting = true; delay = 1400; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
      t = setTimeout(tick, delay);
    };
    t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, [words, reduce]);
  return text;
}

export default function Hero() {
  const typed = useTyping(site.roles);
  return (
    <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 pt-24">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <p className="font-mono text-sm text-cyan-300">{site.name}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">{site.headline}</h1>
        <p className="mt-6 h-9 font-mono text-xl text-slate-300 sm:text-2xl" aria-label={site.roles.join(', ')}>
          <span className="caret" aria-hidden="true">{typed}</span>
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a href="#contact" className="rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.45)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Get in touch
          </a>
          <a href="#projects" className="glass rounded-lg px-6 py-3 text-slate-100 transition hover:border-cyan-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
            See my work
          </a>
        </div>
      </motion.div>
    </section>
  );
}
