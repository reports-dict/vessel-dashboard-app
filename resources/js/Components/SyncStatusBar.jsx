export default function SyncStatusBar({ lastSync }) {
    if (!lastSync) {
        return (
            <footer className="px-8 py-2 border-t border-slate-700/50 flex items-center gap-2 text-slate-500 text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
                No sync data available
            </footer>
        );
    }

    const isSuccess = lastSync.status === 'success';
    const dot = isSuccess ? 'bg-green-500' : 'bg-red-500';
    const label = isSuccess ? 'text-green-400' : 'text-red-400';

    return (
        <footer className="px-8 py-2 border-t border-slate-700/50 flex items-center gap-3 text-xs">
            <span className={`w-2 h-2 rounded-full inline-block ${dot}`} />
            <span className={`font-medium ${label} capitalize`}>{lastSync.status}</span>
            <span className="text-slate-400">
                Last sync: {new Date(lastSync.ran_at).toLocaleString()}
            </span>
            <span className="text-slate-500">
                {lastSync.rows_upserted} rows synced in {lastSync.duration_ms} ms
            </span>
            {lastSync.error_message && (
                <span className="text-red-400 truncate max-w-xs">{lastSync.error_message}</span>
            )}
        </footer>
    );
}
