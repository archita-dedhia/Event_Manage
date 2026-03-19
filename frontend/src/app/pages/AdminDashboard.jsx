import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Home,
  LayoutDashboard,
  Settings,
  LogOut,
  Plus,
  Upload,
  Image as ImageIcon,
  FileText,
  Edit,
  Trash2,
  TrendingUp,
  Activity,
  User
} from 'lucide-react';
import { eventImages } from '../data/eventImages.js';
import { ImageWithFallback } from '../components/figma/ImageWithFallback.jsx';

export default function AdminDashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || { full_name: 'Admin' });
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedEventParticipants, setSelectedEventParticipants] = useState(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    category_id: '',
    capacity: 100,
    image: '',
    pdf_url: '',
    website_url: '',
  });

  const [analytics, setAnalytics] = useState({
    total_events: 0,
    total_attendees: 0,
    average_attendance: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const [eventsRes, categoriesRes, analyticsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/events?organizer_id=${userId}`),
        fetch('http://localhost:8000/api/categories'),
        fetch(`http://localhost:8000/api/admin/analytics/${userId}`)
      ]);
      
      const eventsData = await eventsRes.json();
      const categoriesData = await categoriesRes.json();
      const analyticsData = await analyticsRes.json();
      
      setEvents(eventsData);
      setCategories(categoriesData);
      setAnalytics(analyticsData);
      
      // Ensure category_id is set if it's currently empty
      if (categoriesData.length > 0) {
        setFormData(prev => {
          if (!prev.category_id) {
            return { ...prev, category_id: categoriesData[0].id };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkTimeConflict = (date, time, excludeId = null) => {
    return events.some(event => 
      event.date === date && 
      event.time === time && 
      event.id !== excludeId
    );
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (checkTimeConflict(formData.date, formData.time)) {
      alert('Error: Another event is already scheduled for this date and time.');
      return;
    }

    try {
      const categoryId = parseInt(formData.category_id);
      if (isNaN(categoryId)) {
        alert('Please select a valid category');
        return;
      }

      let imageUrl = formData.image;
      let pdfUrl = formData.pdf_url;

      if (imageFile) {
        imageUrl = await handleFileUpload(imageFile);
      }
      if (pdfFile) {
        pdfUrl = await handleFileUpload(pdfFile);
      }

      const organizerId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:8000/api/events?organizer_id=${organizerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id),
          image: imageUrl,
          pdf_url: pdfUrl,
          website_url: formData.website_url,
          website_url: formData.website_url
        }),
      });

      if (response.ok) {
        fetchData();
        resetForm();
      } else {
        const errorData = await response.json();
        // Handle validation errors which are often in errorData.detail as an array
        let errorMessage = 'Failed to create event';
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
        }
        alert(errorMessage);
      }
    } catch (err) {
      console.error('Create error:', err);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    
    if (checkTimeConflict(formData.date, formData.time, editingEvent.id)) {
      alert('Error: Another event is already scheduled for this date and time.');
      return;
    }

    try {
      const categoryId = parseInt(formData.category_id);
      if (isNaN(categoryId)) {
        alert('Please select a valid category');
        return;
      }

      let imageUrl = formData.image;
      let pdfUrl = formData.pdf_url;

      if (imageFile) {
        imageUrl = await handleFileUpload(imageFile);
      }
      if (pdfFile) {
        pdfUrl = await handleFileUpload(pdfFile);
      }

      const organizerId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:8000/api/events/${editingEvent.id}?organizer_id=${organizerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id),
          image: imageUrl,
          pdf_url: pdfUrl
        }),
      });

      if (response.ok) {
        fetchData();
        resetForm();
      } else {
        const errorData = await response.json();
        // Handle validation errors which are often in errorData.detail as an array
        let errorMessage = 'Failed to update event';
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
        }
        alert(errorMessage);
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
      description: '',
      category_id: categories[0]?.id || '',
      capacity: 100,
      image: '',
      pdf_url: '',
      website_url: '',
    });
    setImageFile(null);
    setPdfFile(null);
    setShowCreateForm(false);
    setEditingEvent(null);
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      category_id: event.category_id,
      capacity: event.capacity,
      image: event.image || '',
      pdf_url: event.pdf_url || '',
      website_url: event.website_url || '',
    });
    setShowCreateForm(true);
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const organizerId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:8000/api/events/${id}?organizer_id=${organizerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const fetchParticipants = async (eventId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/participants/event/${eventId}`);
      const data = await response.json();
      setSelectedEventParticipants(data);
      setShowParticipantsModal(true);
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  const totalAttendees = events.reduce((sum, event) => sum + event.attendees, 0);
  const averageAttendance = events.length > 0 ? Math.round(totalAttendees / events.length) : 0;

  // Calculate events this week
  const getEventsThisWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    }).length;
  };

  // Sort events by date - upcoming first
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.time);
    const dateB = new Date(b.date + ' ' + b.time);
    return dateA - dateB;
  });

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

          <div className="mb-6">
            <button
              onClick={() => {
                resetForm();
                setShowCreateForm(!showCreateForm);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </button>
          </div>

          <nav className="space-y-2">
            <Link 
              to="/admin/dashboard" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-600/20 border border-purple-500/30 text-white"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/admin/participants" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Users className="w-5 h-5" />
              <span>All Participants</span>
            </Link>
            <a 
              href="#events" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Calendar className="w-5 h-5" />
              <span>Events</span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                {events.length}
              </span>
            </a>
            <Link 
              to="/profile" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Users className="w-5 h-5" />
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
          <div className="mb-8">
            <h1 className="text-3xl mb-2 text-white">Welcome back, {user.full_name}!</h1>
            <p className="text-gray-400">Manage and create campus events</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-10 h-10 text-purple-400" />
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl text-white mb-1">{analytics.total_events}</div>
              <div className="text-sm text-gray-400">Total Events</div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-10 h-10 text-blue-400" />
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl text-white mb-1">{analytics.total_attendees}</div>
              <div className="text-sm text-gray-400">Total Attendees</div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-10 h-10 text-orange-400" />
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl text-white mb-1">{getEventsThisWeek()}</div>
              <div className="text-sm text-gray-400">This Week</div>
            </div>
          </div>

          {/* Create/Edit Event Form */}
          {showCreateForm && (
            <div className="mb-8 p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl text-white">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-2 text-gray-300">Event Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter event title"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm mb-2 text-gray-300">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-[#0a0d1f]">{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-300">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-300">Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-300">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Event location"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-300">Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      placeholder="Max attendees"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-300">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter event description"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-300">Website URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`p-6 rounded-xl border-2 border-dashed transition-all ${imageFile ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 hover:border-purple-500/30'}`}>
                      <div className="text-center">
                        <ImageIcon className={`w-12 h-12 mx-auto mb-3 transition-colors ${imageFile ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'}`} />
                        <div className="text-sm text-gray-400 mb-1">
                          {imageFile ? imageFile.name : 'Upload Event Image'}
                        </div>
                        <div className="text-xs text-gray-500">PNG, JPG up to 10MB</div>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`p-6 rounded-xl border-2 border-dashed transition-all ${pdfFile ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/30'}`}>
                      <div className="text-center">
                        <FileText className={`w-12 h-12 mx-auto mb-3 transition-colors ${pdfFile ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'}`} />
                        <div className="text-sm text-gray-400 mb-1">
                          {pdfFile ? pdfFile.name : 'Upload PDF Report'}
                        </div>
                        <div className="text-xs text-gray-500">PDF up to 25MB</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-2xl hover:shadow-purple-500/50 transition-all"
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Events Table */}
          <section id="events" className="mb-8">
            <h2 className="text-2xl mb-6 text-white">All Events</h2>
            
            <div className="rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Event</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Category</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Date & Time</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Location</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Attendance</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEvents.map((event) => (
                      <tr key={event.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <ImageWithFallback 
                                src={event.image?.startsWith('http') ? event.image : eventImages[event.image]} 
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="text-white">{event.title}</div>
                              <div className="text-xs text-gray-400">ID: {event.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                            {event.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          <div>{event.date}</div>
                          <div className="text-xs text-gray-500">{event.time}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <button 
                                onClick={() => fetchParticipants(event.id)}
                                className="text-sm text-white mb-1 hover:text-purple-400 transition-colors"
                              >
                                {event.attendees}/{event.capacity}
                              </button>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-blue-600 rounded-full"
                                  style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditClick(event)}
                              className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-[#0a0d1f]/90 backdrop-blur-sm"
            onClick={() => setShowParticipantsModal(false)}
          ></div>
          
          <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0d1f]/50 backdrop-blur-md">
              <h2 className="text-2xl text-white font-semibold">Registered Students</h2>
              <button 
                onClick={() => setShowParticipantsModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {selectedEventParticipants && selectedEventParticipants.length > 0 ? (
                <div className="space-y-4">
                  {selectedEventParticipants.map((participant) => (
                    <div 
                      key={participant.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{participant.user.full_name}</div>
                        <div className="text-sm text-gray-400">{participant.user.email}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Joined {new Date(participant.registered_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No students registered for this event yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
