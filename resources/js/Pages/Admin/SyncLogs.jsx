import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Components/AdminLayout';

function StatusBadge({ status }) {
    const cls =
        status === 'success'
            ? 'bg-green-900/40 text-green-400 border border-green-700'
            : 'bg-red-900/40 text-red-400 border border-red-700';
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
            {status}
        </span>
    );
}

function ErrorCell({ message }) {
    const [expanded, setExpanded] = useState(false);
    if (!message) return <span className="text-slate-600">—</span>;
    const preview = message.length > 80 ? message.slice(0, 80) + '…' : message;
    return (
        <span className="text-red-300 text-xs">
            {expanded ? message : preview}
            {message.length > 80 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="ml-1 text-cyan-400 underline"
                >
                    {expanded ? 'less' : 'more'}
                </button>
            )}
        </span>
    );
}

export default function SyncLogs({ logs }) {
    return (
        <AdminLayout title="Sync Logs">
            <h2 className="text-2xl font-bold text-white mb-6">Sync Logs</h2>

            <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-sm text-slate-300">
                    <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">Ran At</th>
                            <th className="px-4 py-3 text-right">Fetched</th>
                            <th className="px-4 py-3 text-right">Upserted</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Duration (ms)</th>
                            <th className="px-4 py-3 text-left">Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.data.map((log) => (
                            <tr
                                key={log.id}
                                className="border-t border-slate-700/50 hover:bg-slate-800/50"
                            >
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {new Date(log.ran_at).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right">{log.rows_fetched}</td>
                                <td className="px-4 py-3 text-right">{log.rows_upserted}</td>
                                <td className="px-4 py-3 text-center">
                                    <StatusBadge status={log.status} />
                                </td>
                                <td className="px-4 py-3 text-right">{log.duration_ms}</td>
                                <td className="px-4 py-3">
                                    <ErrorCell message={log.error_message} />
                                </td>
                            </tr>
                        ))}
                        {logs.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-slate-500"
                                >
                                    No sync logs yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
                <span>
                    Showing {logs.from ?? 0}–{logs.to ?? 0} of {logs.total}
                </span>
                <div className="flex gap-2">
                    {logs.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? '#'}
                            className={`px-3 py-1 rounded border text-xs ${
                                link.active
                                    ? 'bg-cyan-700 border-cyan-600 text-white'
                                    : 'border-slate-600 hover:bg-slate-700'
                            } ${!link.url ? 'opacity-30 pointer-events-none' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
