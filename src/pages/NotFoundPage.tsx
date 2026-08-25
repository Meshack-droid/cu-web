import { Link } from 'react-router-dom';
import { ArrowLeft, Home, SearchX } from 'lucide-react';
import { Button } from '@/components/Button';

export function NotFoundPage() {
  return (
    <div className="mesh-hero-bg grid min-h-[70vh] place-items-center px-5 py-20">
      <div className="max-w-lg text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white/70 text-primary-700 shadow-xl backdrop-blur-xl">
          <SearchX size={34} />
        </div>
        <p className="mt-7 text-xs font-black uppercase tracking-[.25em] text-gold-600">404 · Page not found</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-primary-950 sm:text-5xl">That page took a wrong turn.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">The link may be outdated or the page may have moved. Let’s get you back to TUMCU.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/"><Button className="gap-2"><Home size={16} /> Home</Button></Link>
          <Button variant="secondary" className="gap-2" onClick={() => window.history.back()}><ArrowLeft size={16} /> Go back</Button>
        </div>
      </div>
    </div>
  );
}
