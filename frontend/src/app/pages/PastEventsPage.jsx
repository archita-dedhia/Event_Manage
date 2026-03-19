import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback.jsx';

export default function PastEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const user = JSON.parse(localStorage.getItem('user')) || null;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/events');
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      
      // Filter for past events
      const now = new Date();
      const past = data.filter(event => {
        const eventDate = new Date(event.date + ' ' + event.time);
        return eventDate < now;
      });
      
      // Sort by date (most recent first)
      const sorted = past.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
      setEvents(sorted);
    } catch (err) {
      setFetchError(err.message);
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
                className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all duration-500"
              >
                <div className="aspect-video relative overflow-hidden">
                  <ImageWithFallback 
                    src={event.image || (event.images && event.images.length > 0 ? event.images[0].url : '')} 
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 grayscale"
                  />
                  <div className="absolute top-4 right-4 px-4 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-medium text-gray-300">
                    Completed
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 text-purple-400 text-sm mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">{event.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
