export const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export async function fetchProjects() {
  const res = await fetch(`${API}/api/projects`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Projects request failed (${res.status})`);
  return (await res.json()).projects;
}

export async function fetchProject(slug) {
  const res = await fetch(`${API}/api/projects/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Project request failed (${res.status})`);
  return (await res.json()).project;
}
