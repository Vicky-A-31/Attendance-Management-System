import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
  Lock,
  Bell
} from 'lucide-react';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Staff', href: '/admin/staff', icon: UserCheck },
    { name: 'Attendance', href: '/admin/attendance', icon: ClipboardList },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  ];

  const staffNavigation = [
    { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
    { name: 'My Students', href: '/staff/students', icon: Users },
    { name: 'Mark Attendance', href: '/staff/attendance', icon: ClipboardList },
  ];

  const navigation = user?.role === 'admin' ? adminNavigation : staffNavigation;

  return (
    <div className="min-h-screen bg-pattern">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-[70] h-full w-72 bg-white shadow-2xl transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 border-r border-slate-200/50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-slate-50/50">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">Queens</h2>
                <p className="text-[10px] font-bold text-primary-600 tracking-[0.2em] uppercase mt-1 opacity-80">College</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="px-6 pb-6">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner">
                    {user?.name?.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate group-hover:text-primary-600 transition-colors">
                    {user?.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {user?.role}
                  </p>
                </div>
              </div>
              
              {user?.role === 'staff' && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Assignments</p>
                  <div className="max-h-32 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                    {user.assignments && user.assignments.length > 0 ? (
                      user.assignments.map((assign, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded-lg text-left group/item hover:bg-white hover:border-slate-200 border border-transparent transition-all">
                          <p className="text-[10px] font-bold text-slate-700 leading-tight">• {assign.department}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 font-medium ml-2">Years: {assign.yearTaught?.join(', ')}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-lg border border-transparent">
                        <p className="text-[10px] font-bold text-slate-700 leading-tight">• {user?.department}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 font-medium ml-2">Years: {user?.yearTaught?.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar">
            <ul className="space-y-1.5">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/30 font-bold'
                          : 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-900 border border-transparent hover:border-slate-200'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-600'}`} />
                      <span className="text-sm">{item.name}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"></div>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 mt-auto border-t border-slate-200/50 space-y-2 bg-slate-50/50">
            <Link
              to="/change-password"
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-200 transition-all duration-300 font-bold text-sm"
              onClick={() => setSidebarOpen(false)}
            >
              <Lock className="w-5 h-5 text-slate-400" />
              <span>Security Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-300 font-bold text-sm group"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 group-hover:rotate-12 transition-transform">
                <LogOut className="w-4 h-4" />
              </div>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-72 min-h-screen flex flex-col transition-all duration-300">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all duration-300 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Queens College Arts & Science
                </p>
              </div>
              <div className="sm:hidden">
                 <h1 className="text-lg font-black text-slate-800 tracking-tight">
                    Attendance
                 </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
               <div className="p-2 transition-transform hover:scale-110">
                 <Bell className="w-6 h-6 text-slate-400 hover:text-primary-600 cursor-pointer" />
               </div>
               <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
               <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-slate-800 leading-tight">{user?.name}</p>
                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{user?.role}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/20 border-2 border-white ring-1 ring-slate-100">
                    {user?.name?.charAt(0)}
                  </div>
               </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto w-full">
          <div className="page-container">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full border-t border-slate-200 mt-auto no-print">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
            <p>© {new Date().getFullYear()} Queens College Arts & Science</p>
            <div className="flex items-center gap-6">
               <a href="#" className="hover:text-primary-600 transition-colors">Support</a>
               <a href="#" className="hover:text-primary-600 transition-colors">Privacy</a>
               <a href="#" className="hover:text-primary-600 transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
