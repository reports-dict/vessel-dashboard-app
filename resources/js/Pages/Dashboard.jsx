import { useCallback, useEffect, useRef, useState } from 'react';

function WaveLoader({ progressPct, fetching }) {
    const waveDuration = fetching ? '1.2s' : '3s';
    return (
        <div style={{ position: 'relative', height: 44, overflow: 'hidden', background: '#0a0e17' }}>
            <style>{`
                @keyframes wave-flow {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-400px); }
                }
                @keyframes boat-bob {
                    0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
                    50%       { transform: translateY(-5px) rotate(1.5deg); }
                }
                @keyframes slide-in-left {
                    from { transform: translateX(60px); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes slide-in-right {
                    from { transform: translateX(-60px); opacity: 0; }
                    to   { transform: translateX(0);     opacity: 1; }
                }
                .wave-anim       { animation: wave-flow var(--wave-dur, 3s) linear infinite; }
                .boat-bob        { animation: boat-bob 2s ease-in-out infinite; }
                .slide-in-left   { animation: slide-in-left  350ms ease-out both; }
                .slide-in-right  { animation: slide-in-right 350ms ease-out both; }
            `}</style>

            {/* Wave SVG */}
            <svg
                width="100%" height="100%"
                viewBox="0 0 1440 44"
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0 }}
            >
                {/* Water body */}
                <rect x="0" y="28" width="1440" height="16" fill="rgba(6,78,115,0.25)" />

                {/* Seamless animated wave — 1840px wide so the -400px shift loops cleanly */}
                <g className="wave-anim" style={{ '--wave-dur': waveDuration }}>
                    {/* Back wave — darker fill */}
                    <path
                        d="M0,30 C100,20 200,38 400,30 C600,22 700,38 900,30
                           C1100,22 1200,38 1400,30 C1600,22 1700,38 1840,30
                           L1840,44 L0,44 Z"
                        fill="rgba(6,78,115,0.35)"
                    />
                    {/* Front wave — cyan stroke */}
                    <path
                        d="M0,33 C120,24 220,42 440,33 C660,24 760,42 980,33
                           C1200,24 1300,42 1520,33 C1680,24 1760,42 1840,33"
                        fill="none"
                        stroke="rgba(34,211,238,0.45)"
                        strokeWidth="1.5"
                    />
                    {/* Highlight ripple */}
                    <path
                        d="M0,28 C80,22 160,34 320,28 C480,22 560,34 720,28
                           C880,22 960,34 1120,28 C1280,22 1360,34 1520,28
                           C1680,22 1760,34 1840,28"
                        fill="none"
                        stroke="rgba(103,232,249,0.2)"
                        strokeWidth="1"
                    />
                </g>

                {/* Thin cyan progress accent at very bottom */}
                <rect x="0" y="42" width={`${progressPct}%`} height="2" fill="rgba(34,211,238,0.7)" rx="1" />
            </svg>

            {/* Vessel — sails left→right with progressPct */}
            <div
                className="boat-bob"
                style={{
                    position: 'absolute',
                    top: 4,
                    left: `calc(${progressPct}% - 22px)`,
                    transition: 'left 1s linear',
                    pointerEvents: 'none',
                }}
            >
                <svg width="44" height="30" viewBox="0 0 44 30">
                    {/* Hull */}
                    <path d="M4,20 L40,20 L35,27 L9,27 Z" fill="#475569" />
                    {/* Cabin */}
                    <rect x="12" y="13" width="15" height="8" fill="#334155" rx="1.5" />
                    {/* Bridge window */}
                    <rect x="14" y="15" width="4" height="3" fill="rgba(34,211,238,0.5)" rx="0.5" />
                    {/* Chimney */}
                    <rect x="24" y="9" width="4" height="5" fill="#1e293b" rx="1" />
                    {/* Smoke puff */}
                    <circle cx="26" cy="7" r="2.5" fill="rgba(148,163,184,0.35)" />
                    <circle cx="29" cy="5" r="1.8" fill="rgba(148,163,184,0.2)" />
                    {/* Mast */}
                    <line x1="17" y1="3" x2="17" y2="13" stroke="#64748b" strokeWidth="1.2" />
                    {/* Flag */}
                    <path d="M17,3 L24,6 L17,9 Z" fill="rgba(34,211,238,0.7)" />
                    {/* Waterline shimmer */}
                    <path d="M6,23 Q16,21 22,23 Q30,25 38,23" fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
                </svg>
            </div>
        </div>
    );
}

function FullscreenButton() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggle = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <button
            onClick={toggle}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-sm"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
            {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
            )}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>
    );
}
import VesselCard from '@/Components/VesselCard';

const REFRESH_INTERVAL = 60;
const SLIDE_INTERVAL   = 30;

export default function Dashboard() {
    const [vessels, setVessels]     = useState([]);
    const [fetchedAt, setFetchedAt] = useState(null);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
    const [fetching, setFetching]   = useState(false);
    const [error, setError]         = useState(null);
    const [activeIdx, setActiveIdx] = useState(0);
    const [slideDir, setSlideDir]             = useState('left');
    const [animating, setAnimating]           = useState(false);
    const [slideCountdown, setSlideCountdown] = useState(SLIDE_INTERVAL);
    const activeIdxRef                        = useRef(0);
    const vesselsRef                          = useRef([]);
    const slideTimerRef                       = useRef(null);
    const slideTickRef                        = useRef(null);

    const fetchData = useCallback(async () => {
        setFetching(true);
        setError(null);
        try {
            const res = await fetch('/api/dashboard-data');
            const json = await res.json();
            const list = json.vessels || [];
            vesselsRef.current = list;
            setVessels(list);
            setActiveIdx(prev => {
                const clamped = Math.min(prev, Math.max(0, list.length - 1));
                activeIdxRef.current = clamped;
                return clamped;
            });
            setFetchedAt(new Date());
        } catch {
            setError('Failed to fetch data. Retrying next cycle.');
        } finally {
            setFetching(false);
        }
    }, []);

    const goTo = useCallback((idx, dir = 'left') => {
        setSlideDir(dir);
        setAnimating(true);
        setTimeout(() => {
            activeIdxRef.current = idx;
            setActiveIdx(idx);
            setAnimating(false);
        }, 350);
    }, []);

    const startSlideTimer = useCallback(() => {
        clearInterval(slideTimerRef.current);
        clearInterval(slideTickRef.current);
        setSlideCountdown(SLIDE_INTERVAL);
        slideTimerRef.current = setInterval(() => {
            const total = vesselsRef.current.length;
            if (total <= 1) return;
            const next = (activeIdxRef.current + 1) % total;
            goTo(next, 'left');
        }, SLIDE_INTERVAL * 1000);
        slideTickRef.current = setInterval(() => {
            setSlideCountdown(prev => (prev <= 1 ? SLIDE_INTERVAL : prev - 1));
        }, 1000);
    }, [goTo]);

    useEffect(() => {
        startSlideTimer();
        return () => {
            clearInterval(slideTimerRef.current);
            clearInterval(slideTickRef.current);
        };
    }, [startSlideTimer]);

    useEffect(() => {
        fetchData();

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    fetchData();
                    return REFRESH_INTERVAL;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [fetchData]);

    const progressPct = ((REFRESH_INTERVAL - countdown) / REFRESH_INTERVAL) * 100;

    return (
        <div
            className="h-screen w-screen overflow-hidden flex flex-col"
            style={{ backgroundColor: '#0a0e17', color: '#e2e8f0' }}
        >
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-1.5 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <img src="/images/logo_1574_x_1064.jpg" alt="Logo" className="h-8 w-auto object-contain" />
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-cyan-400 uppercase leading-none">
                            Vessel Operations
                        </h1>
                        <p className="text-slate-400 text-xs">Live Port Dashboard</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {fetchedAt && (
                        <p className="text-slate-500 text-xs">
                            Updated {fetchedAt.toLocaleTimeString()}
                        </p>
                    )}
                    <FullscreenButton />

                    {/* Countdown badge */}
                    <div className="flex items-center gap-1">
                    <a href="/admin-panel/login" className="w-1.5 h-1.5 rounded-full bg-slate-700 hover:bg-slate-500 transition-colors shrink-0" />
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                        {fetching ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" />
                                <span className="text-cyan-400 text-xs font-mono">Fetching…</span>
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
                                <span className="text-slate-300 text-xs font-mono">
                                    Next refresh in{' '}
                                    <span className="text-cyan-400 font-bold">{countdown}s</span>
                                </span>
                            </>
                        )}
                    </div>
                    </div>
                </div>
            </header>

            {/* Wave loader */}
            <WaveLoader progressPct={progressPct} fetching={fetching} />

            {/* Error banner */}
            {error && (
                <div className="mx-6 mt-4 px-4 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Vessel cards — full-screen slideshow */}
            <main className="flex-1 overflow-hidden px-6 py-3 min-h-0 flex flex-col">
                {vessels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-6">
                        <h2 className="text-5xl font-extrabold text-slate-500 uppercase tracking-widest">
                            No Active Vessel Visits
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="w-4 h-4 rounded-full bg-cyan-500 animate-pulse" />
                            <p className="text-slate-500 text-2xl tracking-wide">
                                {fetching ? 'Checking for vessels…' : 'Monitoring for incoming vessels…'}
                            </p>
                        </div>
                        {fetchedAt && (
                            <p className="text-slate-600 text-lg">
                                Last checked: {fetchedAt.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Single full-height vessel card with slide animation */}
                        <div
                            key={activeIdx}
                            className={`flex-1 min-h-0 ${!animating ? (slideDir === 'left' ? 'slide-in-left' : 'slide-in-right') : ''}`}
                            style={{ opacity: animating ? 0 : undefined }}
                        >
                            <VesselCard
                                vessel={vessels[activeIdx]}
                                isAlone={true}
                            />
                        </div>

                        {/* Dot indicators + countdown — only when multiple vessels */}
                        {vessels.length > 1 && (
                            <div className="shrink-0 flex flex-col items-center gap-1.5 pt-2">
                                {/* Countdown progress bar */}
                                <div className="flex items-center gap-2 w-48">
                                    <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-500 rounded-full transition-all duration-1000 ease-linear"
                                            style={{ width: `${(slideCountdown / SLIDE_INTERVAL) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-slate-400 w-6 text-right">{slideCountdown}s</span>
                                </div>
                                {/* Dots */}
                                <div className="flex items-center gap-2">
                                    {vessels.map((v, i) => (
                                        <button
                                            key={v.ob_ib_id}
                                            onClick={() => {
                                                const dir = i > activeIdx ? 'left' : 'right';
                                                goTo(i, dir);
                                                startSlideTimer();
                                            }}
                                            className={`rounded-full transition-all duration-300 ${
                                                i === activeIdx
                                                    ? 'w-6 h-2.5 bg-cyan-400'
                                                    : 'w-2.5 h-2.5 bg-slate-600 hover:bg-slate-400'
                                            }`}
                                            title={v.vessel_name}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="px-6 py-1 border-t border-slate-700/50 flex items-center gap-3 text-xs text-slate-500">
                <span>Data source: N4 SPARCS</span>
                <span>•</span>
                <span>Auto-refreshes every {REFRESH_INTERVAL}s</span>
            </footer>
        </div>
    );
}
