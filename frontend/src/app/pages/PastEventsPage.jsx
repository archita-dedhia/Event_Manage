import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Calendar, ChevronRight, ArrowLeft, Download, Eye, MapPin, Users, X, Activity, FileText, Globe, Sparkles, ChevronLeft } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback.jsx';
import { eventImages } from '../data/eventImages.js';
import FullScreenSlideshow from '../components/figma/FullScreenSlideshow.jsx';

export default function PastEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [slideshowItems, setSlideshowItems] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const user = JSON.parse(localStorage.getItem('user')) || null;

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let interval;
    if (isAutoPlaying && selectedEvent && selectedEvent.images?.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % selectedEvent.images.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, selectedEvent]);

  const handleDownloadReport = async (event) => {
    try {
      const organizerId = localStorage.getItem('userId');
      const response = await fetch(`http://127.0.0.1:8000/api/events/${event.id}/report?organizer_id=${organizerId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${event.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Report error:', err);
      alert('Error downloading report: ' + err.message);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    setFetchError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/events', { signal: controller.signal });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      
      // Filter for past events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const past = data.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < today;
      });
      
      // Sort by date (most recent first)
      const sorted = past.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
      setEvents(sorted);
    } catch (err) {
      clearTimeout(timeoutId);
      const msg = err.name === 'AbortError' ? 'Request timed out. Backend is not responding.' : err.message;
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d1f] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-[#0a0d1f]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl text-white tracking-tight">CampusEvents</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Past Events
          </h1>
          <p className="text-gray-400">Memories from our previous campus gatherings</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : fetchError ? (
          <div className="text-center py-20 text-red-400">
            <p>Error loading past events: {fetchError}</p>
            <button onClick={fetchEvents} className="mt-4 text-purple-400 hover:underline">Try Again</button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>No past events found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div 
                key={event.id}
                className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all duration-500 flex flex-col"
              >
                <div 
                  className="aspect-video relative overflow-hidden cursor-pointer"
                  onClick={() => {
                    setSelectedEvent(event);
                    setCurrentImageIndex(0);
                    setIsAutoPlaying(true);
                  }}
                >
                  <ImageWithFallback 
                    src={event.image?.startsWith('http') ? event.image : eventImages[event.image]} 
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100"
                  />
                  <div className="absolute top-4 right-4 px-4 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-medium text-gray-300">
                    Completed
                  </div>
                  
                  {/* View Details Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="px-6 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium backdrop-blur-md">
                      View Details
                    </div>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-purple-400 text-sm mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors line-clamp-1">{event.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-6 flex-1">{event.description}</p>
                  
                  <div className="flex items-center gap-3 mt-auto">
                    <button 
                      onClick={() => {
                        setSelectedEvent(event);
                        setCurrentImageIndex(0);
                        setIsAutoPlaying(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                    {user?.user_type === 'admin' && (
                      <button 
                        onClick={() => handleDownloadReport(event)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all text-sm font-medium"
                        title="Download Admin Report"
                      >
                        <Download className="w-4 h-4" />
                        Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Full Screen Slideshow */}
      {slideshowItems && (
        <FullScreenSlideshow 
          items={slideshowItems} 
          onClose={() => setSlideshowItems(null)} 
        />
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-[#0a0d1f]/90 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          ></div>
          
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0d1f]/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl text-white font-semibold">Event Details</h2>
                {user?.user_type === 'admin' && (
                  <button 
                    onClick={() => handleDownloadReport(selectedEvent)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Report
                  </button>
                )}
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 lg:p-10">
              <div className="grid lg:grid-cols-2 gap-10">
                {/* Left Side - Image Slideshow */}
                <div className="space-y-6">
                  <div className="relative aspect-video lg:aspect-square rounded-2xl overflow-hidden border border-white/10 group bg-black/20">
                    <ImageWithFallback 
                      key={currentImageIndex}
                      src={
                        selectedEvent.images && selectedEvent.images.length > 0
                          ? selectedEvent.images[currentImageIndex].url
                          : (selectedEvent.image?.startsWith('http') ? selectedEvent.image : eventImages[selectedEvent.image])
                      } 
                      alt={selectedEvent.title}
                      className="w-full h-full object-cover transition-all duration-700 animate-in fade-in zoom-in-105"
                    />
                    
                    {/* Slideshow Trigger Overlay */}
                    <button 
                      onClick={() => {
                        const mainImg = selectedEvent.image?.startsWith('http') ? selectedEvent.image : eventImages[selectedEvent.image];
                        const items = (selectedEvent.images || []).map(img => ({ url: img.url, type: 'image' }));
                        if (selectedEvent.pdf_url) items.push({ url: selectedEvent.pdf_url, type: 'pdf' });
                        if (mainImg && !items.some(item => item.url === mainImg)) {
                          items.unshift({ url: mainImg, type: 'image' });
                        }
                        setSlideshowItems(items);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]"
                    >
                      <div className="px-6 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        View Full Screen
                      </div>
                    </button>

                    {/* Slideshow Controls */}
                    {selectedEvent.images && selectedEvent.images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAutoPlaying(false);
                            setCurrentImageIndex((prev) => (prev === 0 ? selectedEvent.images.length - 1 : prev - 1));
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAutoPlaying(false);
                            setCurrentImageIndex((prev) => (prev === selectedEvent.images.length - 1 ? 0 : prev + 1));
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        
                        {/* Auto-play Status & Dots */}
                        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3">
                          <div className="flex gap-2">
                            {selectedEvent.images.map((_, idx) => (
                              <button 
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsAutoPlaying(false);
                                  setCurrentImageIndex(idx);
                                }}
                                className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-purple-500 w-6' : 'bg-white/30 w-1.5 hover:bg-white/50'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Attachments & Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* PDF Attachment */}
                    {selectedEvent.pdf_url && (
                      <a 
                        href={selectedEvent.pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-purple-500/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-medium text-sm truncate">Attachment</div>
                            <div className="text-xs text-gray-500">PDF Document</div>
                          </div>
                        </div>
                      </a>
                    )}

                    {/* Website Link */}
                    {selectedEvent.website_url && (
                      <a 
                        href={selectedEvent.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-blue-500/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-medium text-sm truncate">Website</div>
                            <div className="text-xs text-gray-500">Official Link</div>
                          </div>
                        </div>
                      </a>
                    )}
                  </div>
                </div>

                {/* Right Side - Info */}
                <div className="flex flex-col">
                  <div className="inline-block self-start px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 mb-4">
                    Past Event
                  </div>
                  <h3 className="text-3xl lg:text-4xl text-white font-bold mb-6">{selectedEvent.title}</h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <Calendar className="w-6 h-6 text-purple-400" />
                      <div>
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Date & Time</div>
                        <div className="text-white font-medium">
                          {selectedEvent.date}
                          {selectedEvent.end_date && ` - ${selectedEvent.end_date}`}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {selectedEvent.time}
                          {selectedEvent.end_time && ` - ${selectedEvent.end_time}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <MapPin className="w-6 h-6 text-blue-400" />
                      <div>
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Location</div>
                        <div className="text-white font-medium">{selectedEvent.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <Users className="w-6 h-6 text-pink-400" />
                      <div>
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Final Attendance</div>
                        <div className="text-white font-medium">{selectedEvent.attendees} / {selectedEvent.capacity} students</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 flex-1">
                    <h4 className="text-white font-semibold mb-3">About this event</h4>
                    <p className="text-gray-400 leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/10 text-center italic text-gray-500 text-sm">
                    This event was successfully completed on {selectedEvent.date}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
