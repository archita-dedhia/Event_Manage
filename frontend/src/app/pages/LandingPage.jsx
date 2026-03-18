import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Calendar, Users, MapPin, Sparkles, Zap, Shield, FileText, X } from 'lucide-react';
import { eventImages } from '../data/eventImages.js';
import { ImageWithFallback } from '../components/figma/ImageWithFallback.jsx';

export default function LandingPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/events');
      const data = await response.json();
      // Sort by date upcoming
      const sorted = data.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
      setEvents(sorted);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const featuredEvents = events.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#0a0d1f]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-[#0a0d1f]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl text-white tracking-tight">CampusEvents</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#events" className="text-gray-300 hover:text-white transition-colors">Events</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              {user ? (
                <>
                  <Link 
                    to={user.user_type === 'admin' ? '/admin/dashboard' : '/student/dashboard'} 
                    className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('user');
                      localStorage.removeItem('userId');
                      setUser(null);
                    }}
                    className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors">
                    Login
                  </Link>
                  <Link to="/login" className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-600/10 border border-purple-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">New Event Platform Launched</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight">
            Discover Campus Events<br />Like Never Before
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Your ultimate hub for discovering, booking, and managing campus events. 
            Join thousands of students creating unforgettable experiences.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to={user ? (user.user_type === 'admin' ? '/admin/dashboard' : '/student/dashboard') : '/student/dashboard'} 
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
            >
              Explore Events
            </Link>
            <Link 
              to={user ? (user.user_type === 'admin' ? '/admin/dashboard' : '/student/dashboard') : '/admin/dashboard'} 
              className="px-8 py-4 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              Create Event
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">500+</div>
              <div className="text-sm text-gray-400">Events Hosted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">10k+</div>
              <div className="text-sm text-gray-400">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">50+</div>
              <div className="text-sm text-gray-400">Organizations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl mb-4 text-white">Why Choose CampusEvents?</h2>
            <p className="text-gray-400 text-lg">Everything you need to manage campus events in one place</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature Card 1 */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10 hover:border-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-600/20 flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-2xl mb-4 text-white">Easy Discovery</h3>
              <p className="text-gray-400 leading-relaxed">
                Browse and filter through hundreds of campus events with our intuitive search and categorization system.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10 hover:border-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl mb-4 text-white">Instant Booking</h3>
              <p className="text-gray-400 leading-relaxed">
                Reserve your spot at any event with just one click. Get instant confirmation and reminders.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10 hover:border-pink-500/30 transition-all hover:shadow-xl hover:shadow-pink-500/10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-pink-400" />
              </div>
              <h3 className="text-2xl mb-4 text-white">Smart Management</h3>
              <p className="text-gray-400 leading-relaxed">
                Powerful admin tools for event organizers to create, manage, and track events seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid Section */}
      <section id="events" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl mb-4 text-white">Upcoming Events</h2>
            <p className="text-gray-400 text-lg">Don't miss out on these exciting campus happenings</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <div 
                  key={event.id}
                  className="group rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10 overflow-hidden hover:border-purple-500/30 transition-all hover:shadow-2xl hover:shadow-purple-500/20 hover:transform hover:scale-[1.02]"
                >
                  <div className="aspect-video overflow-hidden">
                    <ImageWithFallback 
                      src={event.image?.startsWith('http') ? event.image : eventImages[event.image]} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 mb-3">
                      {event.category?.name || 'General'}
                    </div>
                    <h3 className="text-xl mb-3 text-white line-clamp-1">{event.title}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span>{event.date} • {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Users className="w-4 h-4 text-pink-400" />
                        <span>{event.attendees}/{event.capacity} attending</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="block w-full py-3 text-center rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-600/10 border border-purple-500/20 text-purple-300 hover:from-purple-500 hover:to-blue-600 hover:text-white transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 bg-white/5 rounded-3xl border border-white/10">
              No upcoming events found. Check back later!
            </div>
          )}
        </div>
      </section>

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
              <h2 className="text-2xl text-white font-semibold">Event Details</h2>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 lg:p-10">
              <div className="grid lg:grid-cols-2 gap-10">
                {/* Left Side - Image */}
                <div className="space-y-6">
                  <div className="aspect-video lg:aspect-square rounded-2xl overflow-hidden border border-white/10">
                    <ImageWithFallback 
                      src={selectedEvent.image?.startsWith('http') ? selectedEvent.image : eventImages[selectedEvent.image]} 
                      alt={selectedEvent.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* PDF Attachment */}
                  {selectedEvent.pdf_url && (
                    <a 
                      href={selectedEvent.pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-6 rounded-2xl bg-white/5 border border-white/10 group hover:border-purple-500/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">Event_Attachment.pdf</div>
                          <div className="text-sm text-gray-500">Click to view document</div>
                        </div>
                        <div className="text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          View
                        </div>
                      </div>
                    </a>
                  )}
                </div>

                {/* Right Side - Info */}
                <div className="flex flex-col">
                  <div className="inline-block self-start px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 mb-4">
                    {selectedEvent.category?.name || 'General'}
                  </div>
                  <h3 className="text-3xl lg:text-4xl text-white font-bold mb-6">{selectedEvent.title}</h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <Calendar className="w-6 h-6 text-purple-400" />
                      <div>
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Date & Time</div>
                        <div className="text-white">{selectedEvent.date} • {selectedEvent.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <MapPin className="w-6 h-6 text-blue-400" />
                      <div>
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Location</div>
                        <div className="text-white">{selectedEvent.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <Users className="w-6 h-6 text-pink-400" />
                      <div>
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Availability</div>
                        <div className="text-white">{selectedEvent.attendees} / {selectedEvent.capacity} spots filled</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-white font-semibold mb-3">About this event</h4>
                    <p className="text-gray-400 leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/10">
                    {user ? (
                      <Link 
                        to={user.user_type === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                        className="block w-full py-4 text-center rounded-2xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02]"
                      >
                        Go to Dashboard to Book
                      </Link>
                    ) : (
                      <Link 
                        to="/login"
                        className="block w-full py-4 text-center rounded-2xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02]"
                      >
                        Login to Book This Event
                      </Link>
                    )}
                    <p className="text-center text-xs text-gray-500 mt-4">
                      {user ? 'Admins cannot book events.' : 'You must be a registered student to book events.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg text-white">CampusEvents</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 CampusEvents. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
