import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Loader2 } from 'lucide-react';
import { getStoredUser } from '@/features/auth/services/auth';

// Lazy so the heavy 3D engine (Babylon.js, ~6.5MB) only downloads on desktop,
// where the simulator actually runs — phones never pull it.
const Ide = lazy(() => import('@/features/simulator/components/Ide'));

// The simulator needs a wide screen (block editor + 3D view side by side).
const DESKTOP_QUERY = '(min-width: 1024px)';

function DesktopOnlyNotice() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-blue-400">
        <Monitor className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold text-white">El simulador se usa en computador</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        Para programar el robot necesitas una pantalla más grande. Ábrelo desde un computador o laptop.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al dashboard
      </Link>
    </div>
  );
}

export default function SimulatorPage() {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
  );

  // Track viewport size so rotating/resizing updates the gate live.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Access guard: the simulator is only reachable from inside a course unit
  // that includes a "Simulador 3D" block (which sets sim_access). Admins can
  // always open it for testing. Anyone else is sent back to their dashboard.
  useEffect(() => {
    const user = getStoredUser();
    const isAdmin = user?.role === 'admin';
    const granted = sessionStorage.getItem('sim_access') === '1';
    if (!isAdmin && !granted) {
      navigate('/student', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="h-screen w-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center px-4 sm:px-6 shrink-0 relative z-20 shadow-lg">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/cirtanitido.svg"
            alt="CIRTA"
            className="h-8 object-contain"
            style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 4px rgba(96, 165, 250, 0.5))' }}
          />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-600">/</span>
            <span className="truncate text-sm text-slate-300 font-medium">Simulador 3D</span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-semibold uppercase tracking-wider ml-1">
              Beta
            </span>
          </div>
        </div>

        <div className="flex-grow" />

        <Link
          to="/dashboard"
          className="group flex items-center gap-2 text-sm px-3 sm:px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all text-slate-300 hover:text-white font-medium shrink-0"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">Volver al Dashboard</span>
        </Link>
      </header>

      <div className="flex-grow w-full relative">
        {isDesktop ? (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            }
          >
            <Ide />
          </Suspense>
        ) : (
          <DesktopOnlyNotice />
        )}
      </div>
    </div>
  );
}
