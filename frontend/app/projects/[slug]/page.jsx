import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { API, fetchProject } from '@/lib/api';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  try {
    const p = await fetchProject(params.slug);
    if (!p) return { title: 'Not found' };
    return { title: p.title, description: p.description };
  } catch {
    return { title: 'Project' };
  }
}

export default async function ProjectPage({ params }) {
  let project;
  try {
    project = await fetchProject(params.slug);
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-slate-300">
        <p>The project service is waking up. Reload in a few seconds.</p>
      </main>
    );
  }
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <Link href="/#projects" className="text-sm text-cyan-300 hover:underline">Back to projects</Link>
      <h1 className="mt-6 text-4xl font-bold text-white">{project.title}</h1>
      <p className="mt-3 text-lg text-slate-300">{project.description}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {project.tags.map((t) => <li key={t} className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">{t}</li>)}
      </ul>
      {project.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${API}${project.thumbnailUrl}`} alt={`${project.title} thumbnail`} className="mt-8 w-full rounded-2xl" />
      )}
      <article className="prose prose-invert mt-8 max-w-none prose-headings:text-white prose-a:text-cyan-300">
        <ReactMarkdown>{project.writeup}</ReactMarkdown>
      </article>
      <div className="mt-8 flex gap-4 text-sm">
        {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">GitHub</a>}
        {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">Live demo</a>}
      </div>
    </main>
  );
}
