import Link from 'next/link';
import { site } from '@/lib/site';

const links = [['About', '#about'], ['Skills', '#skills'], ['Projects', '#projects'], ['Contact', '#contact']];

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <nav aria-label="Main" className="glass mx-auto mt-4 flex max-w-5xl items-center justify-between rounded-full px-6 py-3">
        <Link href="/" className="font-mono text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
          {site.name}
        </Link>
        <ul className="flex gap-5 text-sm text-slate-300">
          {links.map(([label, href]) => (
            <li key={href} className={label === 'About' || label === 'Skills' ? 'hidden sm:block' : ''}>
              <a href={`/${href}`} className="hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">{label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
