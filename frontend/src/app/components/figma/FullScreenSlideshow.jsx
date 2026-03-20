import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, FileText, Play, Pause } from 'lucide-react';

export default function FullScreenSlideshow({ items, initialIndex = 0, onClose, autoPlayInterval = 5000 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    let interval;
    if (isPlaying && items.length > 1) {
      interval = setInterval(handleNext, autoPlayInterval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, handleNext, autoPlayInterval, items.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        setIsPlaying(false);
        handlePrev();
      }
      if (e.key === 'ArrowRight') {
        setIsPlaying(false);
        handleNext();
      }
      if (e.key === ' ') {
        setIsPlaying(!isPlaying);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, handleNext, handlePrev, isPlaying]);

  const currentItem = items[currentIndex];
  const isPdf = typeof currentItem === 'string' ? currentItem.toLowerCase().endsWith('.pdf') : currentItem.url?.toLowerCase().endsWith('.pdf');
  const url = typeof currentItem === 'string' ? currentItem : currentItem.url;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
        <div className="flex items-center gap-4">
          <div className="text-white font-medium bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            {currentIndex + 1} / {items.length}
          </div>
          {items.length > 1 && (
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md"
              title={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full h-full flex items-center justify-center p-4 md:p-12 overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          {isPdf ? (
            <div className="w-full h-full max-w-5xl bg-white rounded-lg overflow-hidden shadow-2xl">
              <iframe 
                src={url} 
                className="w-full h-full border-none"
                title="PDF Viewer"
              />
            </div>
          ) : (
            <img 
              key={url}
              src={url} 
              alt={`Slide ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none shadow-2xl animate-in zoom-in-95 duration-500"
            />
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      {items.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsPlaying(false); handlePrev(); }}
            className="absolute left-4 md:left-8 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all group backdrop-blur-sm border border-white/5"
          >
            <ChevronLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsPlaying(false); handleNext(); }}
            className="absolute right-4 md:right-8 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all group backdrop-blur-sm border border-white/5"
          >
            <ChevronRight className="w-10 h-10 group-hover:translate-x-1 transition-transform" />
          </button>
        </>
      )}

      {/* Thumbnails */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 px-4 overflow-x-auto pb-4 hide-scrollbar">
        {items.map((item, idx) => {
          const itemUrl = typeof item === 'string' ? item : item.url;
          const itemIsPdf = itemUrl?.toLowerCase().endsWith('.pdf');
          return (
            <button
              key={idx}
              onClick={() => { setCurrentIndex(idx); setIsPlaying(false); }}
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 relative ${idx === currentIndex ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/20' : 'border-white/10 opacity-40 hover:opacity-100'}`}
            >
              {itemIsPdf ? (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white">
                  <FileText className="w-6 h-6" />
                </div>
              ) : (
                <img src={itemUrl} className="w-full h-full object-cover" alt="" />
              )}
              {idx === currentIndex && isPlaying && (
                <div className="absolute bottom-0 left-0 h-1 bg-purple-500 animate-progress-bar" style={{ width: '100%', animationDuration: `${autoPlayInterval}ms` }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
