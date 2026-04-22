import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { materialPlaceholders } from '../../utils/materialImages';

export default function ImageGallery({ images = [], className = '' }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [broken, setBroken] = useState({});

  useEffect(() => {
    setBroken({});
  }, [images]);

  const srcFor = (i) => {
    const raw = images[i]?.url || images[i];
    if (broken[i]) return materialPlaceholders.Other;
    return raw;
  };

  if (!images.length) {
    return (
      <div className={`aspect-video bg-hub-surface2 rounded-xl flex items-center justify-center text-hub-muted ${className}`}>
        <span className="text-4xl">📦</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-hub-surface2 group">
        <img
          src={srcFor(active)}
          alt="Material"
          className="w-full h-full object-cover"
          onError={() => setBroken((b) => ({ ...b, [active]: true }))}
        />
        <button onClick={() => setZoom(true)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white">
          <ZoomIn size={16} />
        </button>
        {images.length > 1 && (
          <>
            <button onClick={() => setActive((p) => (p - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setActive((p) => (p + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors">
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${i === active ? 'border-hub-accent' : 'border-hub-border'}`}>
              <img
                src={broken[i] ? materialPlaceholders.Other : img?.url || img}
                alt={`Thumb ${i}`}
                className="w-full h-full object-cover"
                onError={() => setBroken((b) => ({ ...b, [i]: true }))}
              />
            </button>
          ))}
        </div>
      )}
      {zoom && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setZoom(false)}>
          <img src={srcFor(active)} alt="Zoom" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}
