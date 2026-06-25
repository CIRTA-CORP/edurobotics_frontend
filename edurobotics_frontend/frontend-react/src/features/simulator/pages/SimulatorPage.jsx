import { useEffect } from 'react';
import Ide from '@/features/simulator/components/Ide';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getStoredUser } from '@/features/auth/services/auth';

export default function SimulatorPage() {
  const navigate = useNavigate();

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
      <header className="h-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center px-6 shrink-0 relative z-20 shadow-lg">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/cirtanitido.svg"
            alt="CIRTA"
            className="h-8 object-contain"
            style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 4px rgba(96, 165, 250, 0.5))' }}
          />
          <div className="flex items-center gap-2">
            <span className="text-slate-600">/</span>
            <span className="text-sm text-slate-300 font-medium">Simulador 3D</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-semibold uppercase tracking-wider ml-1">
              Beta
            </span>
          </div>
        </div>

        <div className="flex-grow" />

        <Link
          to="/dashboard"
          className="group flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all text-slate-300 hover:text-white font-medium"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Volver al Dashboard
        </Link>
      </header>

      <div className="flex-grow w-full relative">
        <Ide />
      </div>
    </div>
  );
}
