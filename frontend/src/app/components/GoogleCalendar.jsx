import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Settings, 
  HelpCircle, 
  Menu,
  Plus,
  User,
  Calendar as CalendarIcon
} from 'lucide-react';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const GoogleCalendar = ({ events = [], onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('Month'); // Month, Week, Day

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days = [];
    
    // Previous month's padding
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDate - i,
        month: currentMonth - 1,
        year: currentYear,
        isPadding: true
      });
    }
    
    // Current month's days
    for (let i = 1; i <= lastDateOfMonth; i++) {
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isPadding: false
      });
    }
    
    // Next month's padding
    const totalDaysSoFar = days.length;
    const nextMonthPadding = 42 - totalDaysSoFar; // 6 rows of 7 days
    for (let i = 1; i <= nextMonthPadding; i++) {
      days.push({
        day: i,
        month: currentMonth + 1,
        year: currentYear,
        isPadding: true
      });
    }
    
    return days;
  }, [currentMonth, currentYear]);

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDay = (day, month, year) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d1f] text-gray-300 font-sans border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Menu className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white transition-colors" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-white font-medium tracking-tight">Calendar</span>
            </div>
          </div>
          
          <button 
            onClick={handleToday}
            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            Today
          </button>
          
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <h2 className="text-2xl text-white font-medium min-w-[150px]">
            {monthName} {currentYear}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative">
            <select 
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none hover:bg-white/10 transition-all appearance-none cursor-pointer pr-10"
            >
              <option value="Month" className="bg-[#0a0d1f]">Month</option>
              <option value="Week" className="bg-[#0a0d1f]">Week</option>
              <option value="Day" className="bg-[#0a0d1f]">Day</option>
            </select>
            <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center border border-white/10 shadow-lg cursor-pointer">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-white/10 p-6 hidden lg:flex flex-col gap-8 bg-white/[0.01]">
          <button className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all shadow-lg group">
            <Plus className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Create</span>
            <ChevronRight className="w-4 h-4 ml-auto rotate-90 text-gray-500" />
          </button>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white uppercase tracking-wider">April 2026</span>
              <div className="flex gap-2">
                <ChevronLeft className="w-4 h-4 cursor-pointer text-gray-500 hover:text-white" />
                <ChevronRight className="w-4 h-4 cursor-pointer text-gray-500 hover:text-white" />
              </div>
            </div>
            
            <div className="grid grid-cols-7 text-center gap-y-2">
              {DAYS.map(day => (
                <div key={day} className="text-[10px] text-gray-500 font-bold">{day[0]}</div>
              ))}
              {daysInMonth.slice(0, 31).map((d, i) => (
                <div key={i} className={`text-xs py-1 cursor-pointer rounded-full hover:bg-white/10 transition-colors ${d.isPadding ? 'text-gray-600' : 'text-gray-400'} ${d.day === new Date().getDate() && d.month === new Date().getMonth() ? 'bg-purple-500 text-white' : ''}`}>
                  {d.day}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search for people"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-400 focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-medium text-white">
              <span>My calendars</span>
              <ChevronRight className="w-4 h-4 rotate-90 text-gray-500" />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/20" />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Archita Dedhia</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/20" />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Birthdays</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/20" />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Tasks</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Main Calendar Grid */}
        <main className="flex-1 overflow-auto bg-black/20">
          <div className="grid grid-cols-7 h-full min-h-[600px]">
            {DAYS.map(day => (
              <div key={day} className="py-3 text-center text-[11px] font-bold text-gray-500 border-b border-white/10 border-r border-white/10 bg-white/[0.01] uppercase tracking-widest">
                {day}
              </div>
            ))}
            
            {daysInMonth.map((d, i) => {
              const dayEvents = getEventsForDay(d.day, d.month, d.year);
              const isToday = d.day === new Date().getDate() && d.month === new Date().getMonth() && d.year === new Date().getFullYear();
              
              return (
                <div 
                  key={i} 
                  className={`min-h-[120px] p-2 border-r border-b border-white/10 relative transition-colors hover:bg-white/[0.02] group ${d.isPadding ? 'bg-black/10' : ''}`}
                >
                  <div className={`text-center w-7 h-7 flex items-center justify-center rounded-full text-sm mb-2 transition-all ${isToday ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-400 group-hover:text-white'}`}>
                    {d.day}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.map((event, idx) => (
                      <div 
                        key={idx}
                        onClick={() => onEventClick && onEventClick(event)}
                        className="px-2 py-1 rounded-md text-[10px] font-medium truncate cursor-pointer transition-all hover:scale-[1.02] shadow-sm bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GoogleCalendar;
