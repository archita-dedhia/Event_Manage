import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  Users, 
  Search, 
  ArrowLeft, 
  Mail, 
  Calendar, 
  MapPin,
  Download,
  Filter,
  User as UserIcon,
  LayoutDashboard,
  LogOut
} from 'lucide-react';

export default function AllParticipantsPage() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('All');
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || null);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:8000/api/admin/participants/${userId}`);
      const data = await response.json();
      setParticipants(data);
    } catch (err) {
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueEvents = ['All', ...new Set(participants.map(p => p.event.title))];

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = p.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = selectedEvent === 'All' || p.event.title === selectedEvent;
    return matchesSearch && matchesEvent;
  });

  return (
    <div className="min-h-screen bg-[#0a0d1f] flex">
      {/* Sidebar (Copy of Admin Sidebar) */}
      <aside className="w-72 border-r border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-lg hidden lg:block">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-white tracking-tight">CampusEvents</span>
          </Link>

          <nav className="space-y-2">
            <Link 
              to="/admin/dashboard" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/admin/participants" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-600/20 border border-purple-500/30 text-white"
            >
              <Users className="w-5 h-5" />
              <span>All Participants</span>
            </Link>
            <Link 
              to="/profile" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <UserIcon className="w-5 h-5" />
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
          <div className="mb-8">
            <Link 
              to="/admin/dashboard" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
            <h1 className="text-3xl text-white font-bold">All Event Participants</h1>
            <p className="text-gray-400">View and search through all students registered for your events</p>
          </div>

          {/* Filters & Search */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name or email..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
              >
                {uniqueEvents.map(event => (
                  <option key={event} value={event} className="bg-[#0a0d1f]">{event}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Participants Table */}
          <div className="rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : filteredParticipants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-6 py-4 text-sm text-gray-400">Student Name</th>
                      <th className="px-6 py-4 text-sm text-gray-400">Email Address</th>
                      <th className="px-6 py-4 text-sm text-gray-400">Event Registered</th>
                      <th className="px-6 py-4 text-sm text-gray-400">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                              <UserIcon className="w-5 h-5" />
                            </div>
                            <span className="text-white font-medium">{p.user.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Mail className="w-4 h-4 text-blue-400" />
                            <span>{p.user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                            {p.event.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(p.registered_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No participants found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
