export default function ProgressBar({ value, max, colorClass = 'bg-cyan-500' }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${colorClass}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs text-slate-400 w-10 text-right">{pct}%</span>
        </div>
    );
}
