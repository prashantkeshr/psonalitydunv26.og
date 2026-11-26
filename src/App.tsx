import Nav from './components/Nav';
import Hero from './sections/Hero';
import { FaceLab, BodyLab } from './sections/Labs';
import Skills from './sections/Skills';
import { Food, YourDay } from './sections/Daily';
import { Style, Coach, Everything, Privacy, AppTour, Download, Footer } from './sections/More';
import { useReveals, useSmoothScroll } from './lib/motion';

export default function App() {
  useSmoothScroll();
  useReveals();
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Everything />
        <FaceLab />
        <BodyLab />
        <Skills />
        <YourDay />
        <Food />
        <Style />
        <Coach />
        <Privacy />
        <AppTour />
        <Download />
      </main>
      <Footer />
    </>
  );
}
