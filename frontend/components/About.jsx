import { site } from '@/lib/site';

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl px-6 py-24" aria-labelledby="about-h">
      <div className="glass rounded-3xl p-8 sm:p-12">
        <h2 id="about-h" className="text-3xl font-bold text-white">About me</h2>
        <div className="mt-6 max-w-2xl space-y-4 text-lg leading-relaxed text-slate-300">
          {site.about.map((p) => <p key={p}>{p}</p>)}
        </div>
      </div>
    </section>
  );
}
