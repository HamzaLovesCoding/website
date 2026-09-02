import Chrome from '@/components/Chrome';
import Hero from '@/components/Hero';
import Manifesto from '@/components/Manifesto';
import Expand from '@/components/Expand';
import Work from '@/components/Work';
import Gallery from '@/components/Gallery';
import Services from '@/components/Services';
import Process from '@/components/Process';
import Statement from '@/components/Statement';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import Footer from '@/components/Footer';

export default function Page() {
  return (
    <>
      <Chrome />
      <main id="main">
        <Hero />
        <Manifesto />
        <Expand />
        <Work />
        <Gallery />
        <Services />
        <Process />
        <Statement />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
