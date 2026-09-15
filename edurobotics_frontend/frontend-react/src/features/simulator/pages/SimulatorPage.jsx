import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Monitor } from 'lucide-react';
import { getStoredUser } from '@/features/auth/services/auth';
import { getSimulatorCapacity, getSimulatorStatus, stopSimulator } from '@/features/simulator/services/simulator';

// Lazy so the heavy 3D engine only downloads on desktop, where the simulator
// actually runs — phones never pull it.
const Ide = lazy(() => import('@/features/simulator/components/Ide'));

const DESKTOP_QUERY = '(min-width: 1024px)';


/** Estado del servidor para la pill de la cabecera (canvas SimuladorInicio). */
const SERVER_META = {
  running: { text: 'Servidor en línea', dot: 'bg-[#34d399]', cls: 'text-[#6ee7b7] border-[#34d399]/20 bg-[#34d399]/[0.1]' },
  starting: { text: 'Levantando…', dot: 'bg-[#a5a1ee] animate-pulse', cls: 'text-[#a5a1ee] border-[#7d79e3]/30 bg-[#7d79e3]/[0.12]' },
  stopped: { text: 'Servidor apagado', dot: 'bg-[#6e6d78]', cls: 'text-[#6e6d78] border-[#2c2c34] bg-white/[0.05]' },
};

/** Ilustración del brazo para las pantallas de estado de la página. */
function RobotIllustration() {
  return (
    <svg viewBox="0 0 260 170" className="mx-auto block h-[170px] w-[260px]">
      <ellipse cx="118" cy="138" rx="52" ry="8" fill="rgba(0,0,0,0.55)" />
      <path d="M100 137h36l-5-19h-26z" fill="rgba(255,255,255,0.12)" stroke="#5a5a66" strokeWidth="1.8" strokeLinejoin="round" />
      <g stroke="#dcdbe4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M118 118V72" strokeWidth="12" />
        <path d="M118 72l46-24" strokeWidth="10" />
        <path d="M164 48l30 20" strokeWidth="8" />
      </g>
      <g stroke="#a5a1ee" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M194 68l11 7 M194 68l2-12" />
      </g>
      <circle cx="118" cy="118" r="9.5" fill="#0a0a0c" stroke="#dcdbe4" strokeWidth="2.4" />
      <circle cx="118" cy="72" r="8.5" fill="#0a0a0c" stroke="#dcdbe4" strokeWidth="2.4" />
      <circle cx="164" cy="48" r="7.5" fill="#0a0a0c" stroke="#dcdbe4" strokeWidth="2.4" />
      <circle cx="194" cy="68" r="6.5" fill="#0a0a0c" stroke="#a5a1ee" strokeWidth="2.4" />
    </svg>
  );
}

/** Fondo de banda de marca para los estados de la página. */
function BrandBand({ children }) {
  return (
    <div className="relative grid h-full place-items-center overflow-hidden px-10 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.42) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          WebkitMaskImage: 'radial-gradient(58% 70% at 50% 76%, #000 5%, transparent 68%)',
          maskImage: 'radial-gradient(58% 70% at 50% 76%, #000 5%, transparent 68%)',
        }}
      />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[190px] w-[40%] -translate-x-1/2 translate-y-1/2 rounded-full bg-white/[0.32] blur-[90px]" />
      <div className="relative z-10 w-full text-center">{children}</div>
    </div>
  );
}

function DesktopOnlyNotice({ onBack }) {
  return (
    <BrandBand>
      <div className="mx-auto w-[480px]">
        <div className="mx-auto grid h-[62px] w-[62px] place-items-center rounded-[18px] border border-[#2c2c34] bg-white/[0.06]">
          <Monitor className="h-7 w-7 text-[#a1a0ab]" strokeWidth={1.6} />
        </div>
        <h2 className="mt-6 text-[34px] font-bold leading-[1.14] tracking-[-0.016em] text-[#f4f4f6]">
          El simulador pide computador
        </h2>
        <p className="mx-auto mt-3.5 max-w-[420px] text-[15.5px] leading-[1.66] text-[#a1a0ab]">
          El editor y la vista 3D van lado a lado; en un teléfono no caben. Ábrelo desde un computador o un notebook.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-[#f4f4f6] px-6 text-[14.5px] font-semibold text-[#16151b] transition-colors hover:bg-white"
          >
            Volver al curso
          </button>
        </div>
        <p className="mt-5 font-mono text-[11px] text-[#55555f]">El resto del curso sí funciona en el teléfono</p>
      </div>
    </BrandBand>
  );
}

export default function SimulatorPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() || '?';

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
  );
  const [capacity, setCapacity] = useState(null); // null = checking
  const [capacityError, setCapacityError] = useState(false);
  const [serverStatus, setServerStatus] = useState('stopped');
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Access guard + capacity check (#43), async so no synchronous setState in the effect.
  useEffect(() => {
    const isAdmin = user?.role === 'admin';
    const granted = sessionStorage.getItem('sim_access') === '1';
    if (!isAdmin && !granted) {
      navigate('/student', { replace: true });
      return;
    }

    let cancelled = false;
    getSimulatorCapacity()
      .then((data) => {
        if (!cancelled) {
          setCapacity(data);
          setCapacityError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCapacityError(true);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Pill de estado del servidor en la cabecera.
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await getSimulatorStatus();
        setServerStatus(res.status === 'running' ? 'running' : res.status === 'starting' ? 'starting' : 'stopped');
      } catch {
        setServerStatus('stopped');
      }
    };
    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStopServer = async () => {
    setStopping(true);
    try {
      await stopSimulator();
      setServerStatus('stopped');
    } catch { /* ignore */ } finally {
      setStopping(false);
    }
  };

  const handleBack = () => navigate(-1);

  // Ya no se bloquea la entrada por ocupación: escribir código no necesita la
  // máquina, solo ejecutar. Antes, alguien que abría el simulador mientras otro
  // corría un programa de tres segundos se encontraba la puerta cerrada. Ahora
  // entra, escribe, y la cola se hace al pulsar Ejecutar.
  const statusMeta = SERVER_META[serverStatus] || SERVER_META.stopped;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0a0a0c]">
      {/* Cabecera — sin degradado, escala única (canvas SimuladorPiezas §01) */}
      <header className="flex h-[52px] flex-shrink-0 items-center justify-between border-b border-[#23232a] bg-[#0f0f12] px-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <button
            onClick={handleBack}
            className="inline-flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 text-[12.5px] text-[#a1a0ab] transition-colors hover:bg-[#1f1f26] hover:text-[#f4f4f6]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
            Volver al curso
          </button>
          <div className="h-5 w-px bg-[#26262d]" />
          <div className="flex min-w-0 items-center gap-2.5">
            {/* El SVG de CIRTA es negro, así que sobre la cabecera oscura se invierte —
                mismo tratamiento que en AuthLayout y StudentHeader. */}
            <img src="/cirtanitido.svg" alt="CIRTA" className="h-[22px] shrink-0 brightness-0 invert" />
            <span className="h-4 w-px shrink-0 bg-[#33333c]" aria-hidden="true" />
            <span className="truncate text-[13.5px] font-semibold text-[#f4f4f6]">Simulador</span>
            <span className="hidden font-mono text-[11px] text-[#6e6d78] sm:inline">UR5e · ROS 2</span>
            <span className="hidden rounded-full bg-[#7d79e3]/[0.16] px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.1em] text-[#a5a1ee] sm:inline">BETA</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`inline-flex h-8 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold ${statusMeta.cls}`}>
            <span className={`h-[7px] w-[7px] rounded-full ${statusMeta.dot}`} />
            {statusMeta.text}
          </div>
          {/* Detener la máquina es de administrador: es compartida, así que
              pararla echa a todos los que estén usándola, no solo a quien pulsa.
              El backend lo rechaza con 403; aquí no se ofrece el botón para no
              enseñar una acción que va a fallar. */}
          {user?.role === 'admin' && (
            <>
              <button
                onClick={handleStopServer}
                disabled={stopping || serverStatus !== 'running'}
                className="inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-[#33333c] px-3.5 text-[12.5px] font-semibold text-[#a1a0ab] transition-colors hover:text-[#f4f4f6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="block h-[9px] w-[9px] rounded-[2px] bg-current" />
                {stopping ? 'Deteniendo…' : 'Detener servidor'}
              </button>
              <div className="h-5 w-px bg-[#26262d]" />
            </>
          )}
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[#26262d] font-mono text-[10.5px] font-bold text-[#f4f4f6]">
            {initials}
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {!isDesktop ? (
          <DesktopOnlyNotice onBack={handleBack} />
        ) : capacity === null && !capacityError ? (
          <div className="grid h-full place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#a5a1ee]" />
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="grid h-full place-items-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#a5a1ee]" />
              </div>
            }
          >
            <Ide />
          </Suspense>
        )}
      </div>
    </div>
  );
}
