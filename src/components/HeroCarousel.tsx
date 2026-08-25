import { useEffect, useState } from 'react';
import { ArrowRight, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import photo1 from '@/assets/community/community-1.jpg';
import photo2 from '@/assets/community/community-2.jpg';
import photo3 from '@/assets/community/community-3.jpg';
import photo4 from '@/assets/community/community-4.jpg';
import photo5 from '@/assets/community/community-5.jpg';

const SLIDES = [
  { src: photo1, caption: 'Prayer & Reflection', eyebrow: 'A people who seek God' },
  { src: photo2, caption: 'Worship in Unity', eyebrow: 'One family. One faith.' },
  { src: photo3, caption: 'Fellowship & Community', eyebrow: 'Growing together' },
  { src: photo4, caption: 'Worship through Music', eyebrow: 'Gifts offered to God' },
  { src: photo5, caption: 'A Community that Serves', eyebrow: 'Faith becoming action' },
];

const ROTATE_MS = 4000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, []);

  const active = SLIDES[index];

  return (
    <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-primary-950 shadow-2xl">
      {SLIDES.map((slide, i) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.caption}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-out ${
            i === index ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
          }`}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/85 via-primary-950/15 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div className="text-white">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-gold-300">
              <Camera size={13} />
              {active.eyebrow}
            </div>
            <div className="text-2xl font-black tracking-tight sm:text-3xl">{active.caption}</div>
            <div className="mt-1 text-xs text-white/65">TUMCU • Growing in Christ • Serving with Purpose</div>
          </div>

          <Link
            to="/about"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 sm:inline-flex"
          >
            Our story <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-5 flex items-center gap-2" aria-label="Photo carousel">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.caption}
              type="button"
              aria-label={`Show ${slide.caption}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? 'w-9 bg-gold-400' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-[10px] font-bold text-white/85 backdrop-blur-md">
        {index + 1} / {SLIDES.length}
      </div>
    </div>
  );
}
