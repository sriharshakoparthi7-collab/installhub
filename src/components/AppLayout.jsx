import { useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, Zap, Settings, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isOnHome = location.pathname === '/';
  // Remember last non-settings path so Home tab restores it
  const lastMainPath = useRef('/');
  if (location.pathname !== '/settings') {
    lastMainPath.current = location.pathname;
  }
  return (
    <div className="min-h-screen bg-background" style={{ overscrollBehavior: 'none' }}>
      {/* Top Header */}
      <header className="no-print sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm hidden sm:inline">InstallHub</span>
          </Link>
          <div className="flex items-center gap-3">
            {!isOnHome && (
              <Link
                to="/"
                className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors select-none"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            )}
            <Link
              to="/settings"
              className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors select-none"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
            <button
              onClick={() => base44.auth.logout()}
              className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors border border-border rounded-md px-3 py-1.5 select-none"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 sm:pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border flex no-print"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {[
          { path: '/', icon: Home, label: 'Home' },
          { path: '/settings', icon: Settings, label: 'Settings' },
        ].map(({ path, icon: Icon, label }) => {
          const active = path === '/settings' ? location.pathname === '/settings' : location.pathname !== '/settings';
          const dest = path === '/' ? lastMainPath.current : path;
          return (
            <Link
              key={path}
              to={dest}
              className={`flex-1 flex flex-col items-center gap-1 py-3 min-h-[56px] select-none transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}