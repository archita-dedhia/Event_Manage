import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Search, 
  Home,
  Bookmark,
  User,
  LogOut,
  Filter,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe
} from 'lucide-react';
import { eventImages } from '../data/eventImages.js';
import { ImageWithFallback } from '../components/figma/ImageWithFallback.jsx';
import FullScreenSlideshow from '../components/figma/FullScreenSlideshow.jsx';

export default function StudentDashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || { full_name: 'Student' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookedEvents, setBookedEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [slideshowItems, setSlideshowItems] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let interval;
    if (isAutoPlaying && selectedEvent && selectedEvent.images?.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % selectedEvent.images.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, selectedEvent]);

  useEffect(() => {
    fetchEventsAndBookings();
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchEventsAndBookings = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      
      // Fetch all events
      const eventsRes = await fetch('http://127.0.0.1:8000/api/events');
      console.log('Student Dashboard - Events API Response:', eventsRes);
      const eventsData = await eventsRes.json();
      console.log('Student Dashboard - Events API Data:', eventsData);
      setEvents(eventsData);

      // Fetch user's bookings
      const bookingsRes = await fetch(`http://127.0.0.1:8000/api/participants/user/${userId}`);
      console.log('Student Dashboard - Bookings API Response:', bookingsRes);
      const bookingsData = await bookingsRes.json();
      console.log('Student Dashboard - Bookings API Data:', bookingsData);
      setBookedEvents(bookingsData.map(b => b.event_id.toString()));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Technology', 'Cultural', 'Business', 'Workshop', 'Entertainment', 'Career'];

  // Sort events by date - upcoming first
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.time);
    const dateB = new Date(b.date + ' ' + b.time);
    return dateA - dateB;
  });

  const filteredEvents = sortedEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category?.name === selectedCategory || event.category_id === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const categoryName = event.category?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(event);
    return acc;
  }, {});

  const handleBookEvent = async (eventId) => {
    const userId = localStorage.getItem('userId');
    const isBooked = bookedEvents.includes(eventId.toString());

    try {
      if (isBooked) {
        // Find the participant record to delete
        const response = await fetch(`http://127.0.0.1:8000/api/participants/user/${userId}`);
        const bookingsData = await response.json();
        const booking = bookingsData.find(b => b.event_id.toString() === eventId.toString());
        
        if (booking) {
          const deleteRes = await fetch(`http://127.0.0.1:8000/api/participants/${booking.id}?user_id=${userId}`, {
            method: 'DELETE',
          });
          
          if (deleteRes.ok) {
            setBookedEvents(bookedEvents.filter(id => id !== eventId.toString()));
          }
        }
      } else {
        const response = await fetch(`http://127.0.0.1:8000/api/participants?user_id=${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: parseInt(eventId) }),
        });
        
        if (response.ok) {
          setBookedEvents([...bookedEvents, eventId.toString()]);
        } else {
          const errorData = await response.json();
          alert(errorData.detail || 'Failed to book event');
        }
      }
      // Refresh events to update attendee counts
      const eventsRes = await fetch('http://127.0.0.1:8000/api/events');
      const eventsData = await eventsRes.json();
      setEvents(eventsData);
    } catch (err) {
      console.error('Booking error:', err);
    }
  };

  const myBookings = sortedEvents.filter(event => bookedEvents.includes(event.id.toString()));

  // Calculate dynamic stats
  const totalAttendees = events.reduce((sum, event) => sum + (event.attendees || 0), 0);
  
  const getEventsThisWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    }).length;
  };

  return (
    <div className="min-h-screen bg-[#0a0d1f] flex">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-lg hidden lg:block">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-white tracking-tight">CampusEvents</span>
          </Link>

          <nav className="space-y-2">
            <a 
              href="#" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-600/20 border border-purple-500/30 text-white"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            <a 
              href="#events" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Calendar className="w-5 h-5" />
              <span>Events</span>
            </a>
            <a 
              href="#bookings" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Bookmark className="w-5 h-5" />
              <span>My Bookings</span>
              {myBookings.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                  {myBookings.length}
                </span>
              )}
            </a>
            <Link 
              to="/profile" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <Link 
              to="/login"
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('userId');
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl mb-2 text-white">Welcome back, {user.full_name}!</h1>
              <p className="text-gray-400">Discover and book amazing campus events</p>
            </div>
            {/* Logo moved to the right */}
            <div className="flex items-center gap-2 border-l border-white/10 pl-6">
              <span className="text-xl text-white tracking-tight hidden sm:inline">CampusEvents</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for events, speakers, topics..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <Calendar className="w-8 h-8 text-purple-400" />
                <div className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">All</div>
              </div>
              <div className="text-3xl text-white mb-1">{events.length}</div>
              <div className="text-sm text-gray-400">Available Events</div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-8 h-8 text-orange-400" />
                <div className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">Soon</div>
              </div>
              <div className="text-3xl text-white mb-1">{getEventsThisWeek()}</div>
              <div className="text-sm text-gray-400">This Week</div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
              <div className="flex items-center justify-between mb-3">
                <Bookmark className="w-8 h-8 text-green-400" />
                <div className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">Mine</div>
              </div>
              <div className="text-3xl text-white mb-1">{myBookings.length}</div>
              <div className="text-sm text-gray-400">My Bookings</div>
            </div>
          </div>

          {/* Events Grid */}
          <section id="events" className="mb-12">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : Object.keys(groupedEvents).length > 0 ? (
              <div className="space-y-12">
                {Object.entries(groupedEvents).map(([category, eventsInCategory]) => (
                  <div key={category}>
                    <h2 className="text-2xl mb-6 text-white">{category}</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {eventsInCategory.map((event) => {
                        const isBooked = bookedEvents.includes(event.id.toString());
                        return (
                          <div 
                            key={event.id}
                            className="group rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10 overflow-hidden hover:border-purple-500/30 transition-all hover:shadow-2xl hover:shadow-purple-500/20"
                          >
                            <div className="aspect-video overflow-hidden relative">
                              <ImageWithFallback 
                                src={event.image?.startsWith('http') ? event.image : eventImages[event.image]} 
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              {isBooked && (
                                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-500/90 backdrop-blur-sm text-white text-xs flex items-center gap-1">
                                  <Bookmark className="w-3 h-3" />
                                  Booked
                                </div>
                              )}

                              {/* Slideshow Trigger Overlay */}
                              {(event.images?.length > 0 || event.pdf_url) && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const items = (event.images || []).map(img => ({ url: img.url, type: 'image' }));
                                    if (event.pdf_url) items.push({ url: event.pdf_url, type: 'pdf' });
                                    const mainImg = event.image?.startsWith('http') ? event.image : eventImages[event.image];
                                    if (mainImg && !items.some(item => item.url === mainImg)) {
                                      items.unshift({ url: mainImg, type: 'image' });
                                    }
                                    setSlideshowItems(items);
                                  }}
                                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]"
                                >
                                  <div className="px-6 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium">
                                    View Gallery / Report
                                  </div>
                                </button>
                              )}
                            </div>
                            <div className="p-5">
                              <h3 className="text-lg mb-2 text-white line-clamp-1">{event.title}</h3>
                              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{event.description}</p>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-gray-400 text-xs">
                                  <Calendar className="w-4 h-4 text-purple-400" />
                                  <span>{event.date} • {event.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-xs">
                                  <MapPin className="w-4 h-4 text-blue-400" />
                                  <span>{event.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-xs">
                                  <Users className="w-4 h-4 text-pink-400" />
                                  <span>{event.attendees}/{event.capacity} spots filled</span>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-4">
                                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-600 rounded-full"
                                    style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setCurrentImageIndex(0);
                                  }}
                                  className="flex-1 py-3 text-center rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm"
                                >
                                  Details
                                </button>
                                <button
                                  onClick={() => handleBookEvent(event.id)}
                                  className={`flex-[2] py-3 text-center rounded-xl transition-all text-sm font-medium ${
                                    isBooked
                                      ? 'bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30'
                                      : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-500/50'
                                  }`}
                                >
                                  {isBooked ? 'Booked ✓' : 'Book Now'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500 bg-white/5 rounded-3xl border border-white/10">
                No events found matching your criteria.
              </div>
            )}
          </section>

          {/* My Bookings Section */}
          {myBookings.length > 0 && (
            <section id="bookings" className="mb-12">
              <h2 className="text-2xl mb-6 text-white">My Bookings</h2>
              <div className="space-y-4">
                {myBookings.map((event) => (
                  <div 
                    key={event.id}
                    className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10 hover:border-purple-500/30 transition-all"
                  >
                    <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0">
                      <ImageWithFallback 
                        src={event.image?.startsWith('http') ? event.image : eventImages[event.image]} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-300 mb-2">
                        Confirmed
                      </div>
                      <h3 className="text-lg mb-2 text-white">{event.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-pink-400" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBookEvent(event.id)}
                      className="px-6 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all self-start md:self-center"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[110] w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all"
        >
          <ChevronRight className="w-6 h-6 -rotate-90" />
        </button>
      )}

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
                        const items = selectedEvent.images?.length > 0 
                          ? selectedEvent.images.map(img => ({ url: img.url, type: 'image' }))
                          : [{ url: (selectedEvent.image?.startsWith('http') ? selectedEvent.image : eventImages[selectedEvent.image]), type: 'image' }];
                        
                        if (selectedEvent.pdf_url) items.push({ url: selectedEvent.pdf_url, type: 'pdf' });
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
                    {selectedEvent.category?.name || 'General'}
                  </div>
                  <h3 className="text-3xl lg:text-4xl text-white font-bold mb-6">{selectedEvent.title}</h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <Calendar className="w-6 h-6 text-purple-400" />
                      <div>
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Date & Time</div>
                        <div className="text-white">
                          {selectedEvent.date}
                          {selectedEvent.end_date && ` - ${selectedEvent.end_date}`}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {selectedEvent.time}
                          {selectedEvent.end_time && ` - ${selectedEvent.end_time}`}
                          {selectedEvent.duration && ` (${selectedEvent.duration})`}
                        </div>
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
                    <button
                      onClick={() => {
                        handleBookEvent(selectedEvent.id);
                        setSelectedEvent(null);
                      }}
                      className={`block w-full py-4 text-center rounded-2xl font-semibold transition-all transform hover:scale-[1.02] ${
                        bookedEvents.includes(selectedEvent.id.toString())
                          ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                          : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-2xl hover:shadow-purple-500/50'
                      }`}
                    >
                      {bookedEvents.includes(selectedEvent.id.toString()) ? 'Cancel Booking' : 'Book This Event'}
                    </button>
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
