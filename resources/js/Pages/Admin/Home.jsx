import AdminLayout from '@/Components/AdminLayout';

export default function Home({ stats }) {
    const cards = [
        {
            label: 'Total Vessel Visits',
            value: stats.total_visits,
            color: 'text-cyan-400',
        },
        {
            label: 'Last Sync',
            value: stats.last_sync
                ? new Date(stats.last_sync).toLocaleString()
                : 'Never',
            sub: stats.last_sync_status,
            subColor:
                stats.last_sync_status === 'success'
                    ? 'text-green-400'
                    : stats.last_sync_status === 'failed'
                    ? 'text-red-400'
                    : 'text-slate-400',
            color: 'text-white',
            small: true,
        },
        {
            label: 'Successful Syncs (this week)',
            value: stats.success_this_week,
            color: 'text-green-400',
        },
        {
            label: 'Failed Syncs (this week)',
            value: stats.failed_this_week,
            color: 'text-red-400',
        },
    ];

    return (
        <AdminLayout title="Dashboard">
            <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c) => (
                    <div
                        key={c.label}
                        className="bg-slate-800 rounded-xl border border-slate-700 p-5"
                    >
                        <p className="text-slate-400 text-sm">{c.label}</p>
                        <p
                            className={`${c.small ? 'text-lg' : 'text-4xl'} font-bold mt-1 ${c.color}`}
                        >
                            {c.value}
                        </p>
                        {c.sub && (
                            <p className={`text-xs mt-1 capitalize ${c.subColor}`}>
                                {c.sub}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
}
