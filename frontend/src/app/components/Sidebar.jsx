import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Home, 
  Calendar, 
  Bookmark, 
  Clock, 
  User, 
  LogOut,
  LayoutDashboard,
  Users,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [eventsCount, setEventsCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleToggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
    window.addEventListener('toggle-mobile-menu', handleToggleMobileMenu);
    return () => window.removeEventListener('toggle-mobile-menu', handleToggleMobileMenu);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        const eventsRes = await fetch(`${API_URL}/api/events`);
        const eventsData = await eventsRes.json();
        setEventsCount(eventsData.length);

        if (user && user.user_type === 'student') {
          const bookingsRes = await fetch(`${API_URL}/api/participants/user/${user.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const bookingsData = await bookingsRes.json();
          setBookingsCount(bookingsData.length);
        }
      } catch (err) {
        console.error('Error fetching counts:', err);
      }
    };
    if (user) fetchCounts();
  }, [user]);

  if (!user) return null;

  const isAdmin = user.user_type === 'admin';
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/student/dashboard';

  const menuItems = isAdmin ? [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'All Participants', path: '/admin/participants', icon: Users },
    { name: 'Events', path: '/admin/dashboard#events', icon: Calendar },
    { name: 'Past Events', path: '/past-events', icon: Clock },
    { name: 'Profile', path: '/profile', icon: User },
  ] : [
    { name: 'Dashboard', path: '/student/dashboard', icon: Home },
    { name: 'Events', path: '/student/dashboard#events', icon: Calendar },
    { name: 'My Bookings', path: '/student/dashboard#bookings', icon: Bookmark },
    { name: 'Past Events', path: '/past-events', icon: Clock },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCalendarClick = () => {
    if (location.pathname === dashboardPath) {
      // Trigger global event or use state if possible
      window.dispatchEvent(new CustomEvent('toggle-calendar'));
    } else {
      navigate(dashboardPath, { state: { openCalendar: true } });
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 border-r border-white/10 bg-gradient-to-b from-[#0f1129] to-[#0a0d1f] lg:bg-gradient-to-b lg:from-white/[0.02] lg:to-transparent backdrop-blur-xl lg:backdrop-blur-lg flex flex-col flex-shrink-0 z-[101] lg:z-auto transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:flex`}>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-12">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl text-white tracking-tight">CampusEvents</span>
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname + location.hash === item.path;
            
            // Check if it's a hash link
            if (item.path.includes('#')) {
              const [path, hash] = item.path.split('#');
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (location.pathname === path) {
                      const el = document.getElementById(hash);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-500/20 to-blue-600/20 border border-purple-500/30 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {item.name === 'Events' && eventsCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      {eventsCount}
                    </span>
                  )}
                  {item.name === 'My Bookings' && bookingsCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                      {bookingsCount}
                    </span>
                  )}
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-600/20 border border-purple-500/30 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.name === 'Events' && eventsCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                    {eventsCount}
                  </span>
                )}
                {item.name === 'My Bookings' && bookingsCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                    {bookingsCount}
                  </span>
                )}
              </Link>
            );
          })}
          
          {/* Calendar View Button */}
          <button 
            onClick={handleCalendarClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent transition-all"
          >
            <Calendar className="w-5 h-5" />
            <span>Calendar View</span>
          </button>
        </nav>
      </div>

      <div className="p-6 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
}
