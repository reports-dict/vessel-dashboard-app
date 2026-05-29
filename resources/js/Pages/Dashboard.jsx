import { useCallback, useEffect, useState } from 'react';

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

export default function Dashboard() {
    const [vessels, setVessels] = useState([]);
    const [fetchedAt, setFetchedAt] = useState(null);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setFetching(true);
        setError(null);
        try {
            const res = await fetch('/api/dashboard-data');
            const json = await res.json();
            setVessels(json.vessels || []);
            setFetchedAt(new Date());
        } catch {
            setError('Failed to fetch data. Retrying next cycle.');
        } finally {
            setFetching(false);
        }
    }, []);

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
            className="min-h-screen w-screen overflow-hidden flex flex-col"
            style={{ backgroundColor: '#0a0e17', color: '#e2e8f0' }}
        >
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-4 border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                    <img src="/images/logo_1574_x_1064.jpg" alt="Logo" className="h-12 w-auto object-contain" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-cyan-400 uppercase">
                            Vessel Operations
                        </h1>
                        <p className="text-slate-400 text-sm mt-0.5">Live Port Dashboard</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {fetchedAt && (
                        <p className="text-slate-500 text-sm">
                            Updated {fetchedAt.toLocaleTimeString()}
                        </p>
                    )}
                    <FullscreenButton />

                    {/* Countdown badge */}
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
                        {fetching ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" />
                                <span className="text-cyan-400 text-sm font-mono">Fetching…</span>
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
                                <span className="text-slate-300 text-sm font-mono">
                                    Next refresh in{' '}
                                    <span className="text-cyan-400 font-bold">{countdown}s</span>
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Countdown progress bar */}
            <div className="h-0.5 bg-slate-800/80">
                <div
                    className="h-full bg-cyan-500/60 transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            {/* Error banner */}
            {error && (
                <div className="mx-6 mt-4 px-4 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Vessel cards */}
            <main className="flex-1 overflow-hidden px-6 py-3 flex flex-col gap-2 min-h-0">
                {vessels.length === 0 ? (
                    <div className="flex items-center justify-center flex-1">
                        <p className="text-slate-500 text-2xl">
                            {fetching ? 'Loading…' : 'No active vessel visits'}
                        </p>
                    </div>
                ) : (
                    vessels.map((vessel) => (
                        <VesselCard key={vessel.ob_ib_id} vessel={vessel} />
                    ))
                )}
            </main>

            {/* Footer */}
            <footer className="px-8 py-2 border-t border-slate-700/50 flex items-center gap-3 text-xs text-slate-500">
                <span>Data source: N4 SPARCS</span>
                <span>•</span>
                <span>Auto-refreshes every {REFRESH_INTERVAL}s</span>
            </footer>
        </div>
    );
}
