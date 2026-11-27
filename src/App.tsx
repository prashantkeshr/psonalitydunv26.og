import Nav from './components/Nav';
import Hero from './sections/Hero';
import { FaceLab, BodyLab } from './sections/Labs';
import Skills from './sections/Skills';
import Yoga from './sections/Yoga';
import { Food, YourDay } from './sections/Daily';
import { Style, Coach, Everything, Privacy, AppTour, Download } from './sections/More';
import Learn from './sections/Learn';
import SiteFooter from './components/SiteFooter';
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
        <Yoga />
        <YourDay />
        <Food />
        <Style />
        <Coach />
        <Privacy />
        <AppTour />
        <Learn />
        <Download />
      </main>
      <SiteFooter />
    </>
  );
}
