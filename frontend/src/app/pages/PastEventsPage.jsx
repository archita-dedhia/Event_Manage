import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Calendar, ChevronRight, ArrowLeft, Download, Eye, MapPin, Users, X, Activity, FileText, Globe, Sparkles, ChevronLeft, Search, Edit2, Upload, Image as ImageIcon, Menu, Plus } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback.jsx';
import { eventImages } from '../data/eventImages.js';
import FullScreenSlideshow from '../components/figma/FullScreenSlideshow.jsx';
import Sidebar from '../components/Sidebar.jsx';

export default function PastEventsPage() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [slideshowItems, setSlideshowItems] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImages, setNewImages] = useState([]); // Array of { file, preview }
  const [newReport, setNewReport] = useState(null);
  const user = JSON.parse(localStorage.getItem('user')) || null;

  const handleAddImage = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const existingCount = (editingEvent?.images?.length || 0);
    const newCount = newImages.length;
    const remainingSlots = 10 - (existingCount + newCount);
    
    if (remainingSlots <= 0) {
      alert('Maximum 10 images allowed');
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    const addedImages = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setNewImages(prev => [...prev, ...addedImages]);
    
    if (files.length > remainingSlots) {
      alert(`Only added ${remainingSlots} images. Maximum 10 allowed.`);
    }
  };

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => {
      const removed = prev[index];
      if (removed && removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const containsCross = (text) => {
    if (!text) return false;
    const crossSymbols = ['×', '✕', '✖', '❌'];
    return crossSymbols.some(symbol => text.includes(symbol));
  };

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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/api/events/${event.id}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/events`, { signal: controller.signal });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      
      // Filter for past events and check for cross symbols
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const past = data.filter(event => {
        // Calendar Cross-Items Restriction
        if (containsCross(event.title) || containsCross(event.description)) {
          return false;
        }

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

  const handleUpdatePastEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      // 1. Upload new images if any
      let updatedImages = [...(editingEvent.images || [])];
      if (newImages.length > 0) {
        for (const item of newImages) {
          const formData = new FormData();
          formData.append('file', item.file);
          const uploadRes = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            updatedImages.push({ url: uploadData.url }); // Match the EventImageOut schema
          }
        }
      }

      // 2. Upload new report if any
      let updatedReportUrl = editingEvent.pdf_url;
      if (newReport) {
        const formData = new FormData();
        formData.append('file', newReport);
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          updatedReportUrl = uploadData.url;
        }
      }

      // 3. Update event in backend
      const response = await fetch(`${API_URL}/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          images: updatedImages.map(img => typeof img === 'string' ? img : img.url),
          pdf_url: updatedReportUrl,
          
        })
      });

      if (response.ok) {
        alert('Event updated successfully!');
        setEditingEvent(null);
        setNewImages([]);
        setNewReport(null);
        fetchEvents();
      } else {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update event');
      }
    } catch (err) {
      alert('Error updating event: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d1f] flex">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Sticky Mobile Header */}
        <div className="sticky top-0 z-40 lg:hidden flex items-center justify-between p-4 bg-[#0a0d1f]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-menu'))}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-white font-semibold">Past Events</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <div className="mb-12 hidden lg:flex items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Past Events
              </h1>
              <p className="text-gray-400">Memories from our previous campus gatherings</p>
            </div>
          </div>

          <div className="mb-12 lg:hidden">
            <h1 className="text-3xl font-bold mb-2 text-white">
              Past Events
            </h1>
            <p className="text-sm text-gray-400">Our previous campus gatherings</p>
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
                  
                  <div className="flex items-center gap-3 mt-auto flex-wrap">
                    <button 
                      onClick={() => {
                        setSelectedEvent(event);
                        setCurrentImageIndex(0);
                        setIsAutoPlaying(true);
                      }}
                      className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                    {user?.user_type === 'admin' && (
                      <>
                        <button 
                          onClick={() => handleDownloadReport(event)}
                          className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all text-sm font-medium"
                          title="Download Admin Report"
                        >
                          <Download className="w-4 h-4" />
                          Report
                        </button>
                        <button 
                          onClick={() => {
                            setEditingEvent(event);
                            setNewImages([]);
                            setNewReport(null);
                          }}
                          className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-medium"
                          title="Edit Images & Report"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
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
                      className="w-full h-full object-cover transition-all duration-700"
                    />
                    
                    {/* Image Navigation Dots */}
                    {selectedEvent.images && selectedEvent.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                        {selectedEvent.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(idx);
                              setIsAutoPlaying(false);
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              idx === currentImageIndex ? 'bg-purple-500 w-4' : 'bg-white/30 hover:bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Full Screen Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlideshowItems(selectedEvent.images?.length > 0 
                          ? selectedEvent.images 
                          : [{ url: selectedEvent.image?.startsWith('http') ? selectedEvent.image : eventImages[selectedEvent.image] }]);
                      }}
                      className="absolute top-4 right-4 p-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail Strip */}
                  {selectedEvent.images && selectedEvent.images.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {selectedEvent.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentImageIndex(idx);
                            setIsAutoPlaying(false);
                          }}
                          className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                            idx === currentImageIndex ? 'border-purple-500 scale-95' : 'border-transparent opacity-50 hover:opacity-100'
                          }`}
                        >
                          <ImageWithFallback src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side - Info */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold border border-purple-500/30">
                        {selectedEvent.category?.name || 'Event'}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">{selectedEvent.title}</h1>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <Calendar className="w-6 h-6 text-purple-400" />
                      <div>
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Date</div>
                        <div className="text-white">{selectedEvent.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <MapPin className="w-6 h-6 text-blue-400" />
                      <div>
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Location</div>
                        <div className="text-white">{selectedEvent.location}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-white font-semibold mb-3">About this event</h4>
                    <p className="text-gray-400 leading-relaxed mb-6">
                      {selectedEvent.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setEditingEvent(null)}
          ></div>
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0a0d1f] border border-white/10 p-8 shadow-2xl">
            <h2 className="text-2xl text-white font-bold mb-6">Update Past Event</h2>
            <form onSubmit={handleUpdatePastEvent} className="space-y-8">
              {/* Images Section */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-purple-400 uppercase tracking-widest">
                  <ImageIcon className="w-4 h-4" />
                  Event Photos (Geo-tagged)
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {/* Existing Images */}
                  {editingEvent.images?.map((img, idx) => (
                    <div key={`existing-${idx}`} className="aspect-square rounded-2xl overflow-hidden border border-white/10 relative group">
                      <ImageWithFallback src={img.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = editingEvent.images.filter((_, i) => i !== idx);
                            setEditingEvent({ ...editingEvent, images: updated });
                          }}
                          className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-all hover:scale-110"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* New Image Previews */}
                  {newImages.map((item, idx) => (
                    <div key={`new-${idx}`} className="aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-purple-500/50 relative group">
                      <img src={item.preview} className="w-full h-full object-cover" alt="New Preview" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <button 
                          type="button"
                          onClick={() => handleRemoveNewImage(idx)}
                          className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-all hover:scale-110"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 bg-blue-500 text-[9px] font-bold text-white rounded-full uppercase tracking-wider shadow-lg">New</span>
                      </div>
                    </div>
                  ))}

                  {/* Add Button */}
                  {(editingEvent.images?.length || 0) + newImages.length < 10 && (
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 flex flex-col items-center justify-center cursor-pointer transition-all group active:scale-95">
                      <div className="p-3 rounded-full bg-white/5 group-hover:bg-purple-500/10 transition-colors">
                        <Plus className="w-6 h-6 text-gray-400 group-hover:text-purple-400" />
                      </div>
                      <span className="text-xs text-gray-500 mt-2 font-medium group-hover:text-purple-400">Add Photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleAddImage}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* PDF Section */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-400 uppercase tracking-widest">
                  <FileText className="w-4 h-4" />
                  1-Page Event Report (PDF)
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setNewReport(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {newReport || editingEvent.pdf_url ? (
                    <div className="w-full p-10 rounded-3xl bg-white/5 border border-white/10 border-dashed group-hover:border-blue-500/50 transition-all flex flex-col items-center justify-center text-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform">
                        <FileText className="w-10 h-10 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-bold text-xl truncate mb-2">
                          {newReport ? newReport.name : (editingEvent.pdf_url?.split('/').pop().split('?')[0])}
                        </div>
                        <div className="text-sm text-gray-500 uppercase tracking-widest font-medium">
                          {newReport ? `${(newReport.size / (1024 * 1024)).toFixed(2)} MB` : '0.04 MB'} • PDF Document
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewReport(null);
                          if (!newReport) setEditingEvent({ ...editingEvent, pdf_url: null });
                        }}
                        className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                      >
                        Remove Report
                      </button>
                    </div>
                  ) : (
                    <div className="w-full p-10 rounded-3xl bg-white/5 border border-white/10 border-dashed group-hover:border-blue-500/50 transition-all flex flex-col items-center justify-center text-center gap-4">
                      <Upload className="w-10 h-10 text-gray-600 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                      <div>
                        <p className="text-gray-400 group-hover:text-white font-medium">Upload PDF Report</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Drag and drop or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:shadow-[0_0_30px_-5px_rgba(147,51,234,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? "Updating..." : "Update Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
