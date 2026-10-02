import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Skills from '@/components/Skills';
import ProjectGallery from '@/components/ProjectGallery';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { fetchProjects } from '@/lib/api';

export const revalidate = 60; // new AI-generated projects appear within ~1 minute

export default async function Home() {
  let projects = [];
  try {
    projects = await fetchProjects();
  } catch (e) {
    console.error('project fetch failed:', e.message); // page still renders without projects
  }
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Skills />
        <ProjectGallery projects={projects} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
