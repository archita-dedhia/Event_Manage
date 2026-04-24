import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, FileText, Play, Pause, Maximize, Minimize } from 'lucide-react';

export default function FullScreenSlideshow({ items, initialIndex = 0, onClose, autoPlayInterval = 5000 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMouseIdle, setIsMouseIdle] = useState(false);
  const containerRef = useRef(null);
  const idleTimerRef = useRef(null);

  const resetIdleTimer = useCallback(() => {
    setIsMouseIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsMouseIdle(true);
    }, 3000); // Hide UI after 3 seconds of inactivity
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      }
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleMouseMove = () => resetIdleTimer();
    window.addEventListener('mousemove', handleMouseMove);
    resetIdleTimer();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  const filteredItems = items.filter(item => {
    const url = typeof item === 'string' ? item : item.url;
    return !url?.toLowerCase().endsWith('.pdf');
  });

  const handleNext = useCallback(() => {
    if (filteredItems.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
  }, [filteredItems.length]);

  const handlePrev = useCallback(() => {
    if (filteredItems.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  }, [filteredItems.length]);

  useEffect(() => {
    let interval;
    if (isPlaying && filteredItems.length > 1) {
      interval = setInterval(handleNext, autoPlayInterval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, handleNext, autoPlayInterval, filteredItems.length]);

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

  if (filteredItems.length === 0) return null;

  const currentItem = filteredItems[currentIndex];
  const url = typeof currentItem === 'string' ? currentItem : currentItem.url;

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300 ${isMouseIdle ? 'cursor-none' : ''}`}
    >
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-30 transition-all duration-500 ${isMouseIdle ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}`}>
        <div className="flex items-center gap-4">
          <div className="text-white font-medium bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            {currentIndex + 1} / {filteredItems.length}
          </div>
          {filteredItems.length > 1 && (
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md"
              title={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
          )}
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10"
            title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full h-full flex items-center justify-center p-0 overflow-hidden">
        <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center gap-0">
          {/* Main Image Container */}
          <div className="relative flex-1 h-full flex items-center justify-center bg-black">
            <img 
              key={url}
              src={url} 
              alt={`Slide ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none shadow-2xl animate-in zoom-in-95 duration-500"
            />
          </div>

          {/* Side Thumbnails */}
          {filteredItems.length > 1 && (
            <div className={`fixed right-6 top-1/2 -translate-y-1/2 w-24 flex flex-col gap-4 py-4 max-h-[70vh] overflow-y-auto hide-scrollbar bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 z-20 transition-all duration-500 ${isMouseIdle ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}>
              {filteredItems.map((item, idx) => {
                const itemUrl = typeof item === 'string' ? item : item.url;
                return (
                  <button
                    key={idx}
                    onClick={() => { setCurrentIndex(idx); setIsPlaying(false); }}
                    className={`w-20 h-20 mx-auto rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 relative ${idx === currentIndex ? 'border-purple-500 scale-105 shadow-lg shadow-purple-500/30' : 'border-white/10 opacity-40 hover:opacity-100 hover:scale-105'}`}
                  >
                    <img src={itemUrl} className="w-full h-full object-cover" alt="" />
                    {idx === currentIndex && isPlaying && (
                      <div className="absolute bottom-0 left-0 h-1 bg-purple-500 animate-progress-bar" style={{ width: '100%', animationDuration: `${autoPlayInterval}ms` }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons (Floating) */}
      {filteredItems.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsPlaying(false); handlePrev(); }}
            className={`absolute left-4 md:left-12 p-4 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all group backdrop-blur-sm border border-white/5 z-20 ${isMouseIdle ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}`}
          >
            <ChevronLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsPlaying(false); handleNext(); }}
            className={`absolute right-4 md:right-32 p-4 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all group backdrop-blur-sm border border-white/5 z-20 ${isMouseIdle ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
          >
            <ChevronRight className="w-10 h-10 group-hover:translate-x-1 transition-transform" />
          </button>
        </>
      )}
    </div>
  );
}
