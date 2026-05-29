import ProgressBar from './ProgressBar';

function PhaseBadge({ phase }) {
    const cls =
        phase === '40WORKING'
            ? 'bg-amber-900/50 text-amber-400 border border-amber-700'
            : 'bg-cyan-900/50 text-cyan-400 border border-cyan-700';
    const label = phase === '40WORKING' ? 'Working' : 'Arrived';
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${cls}`}>
            {label}
        </span>
    );
}

function StatSection({ planItems, doneItems, doneLabel, planTotal, doneTotal }) {
    return (
        <div className="flex-1 min-h-0 flex flex-col gap-1.5 mt-1.5">
            <div className="flex-1 min-h-0 grid grid-cols-4 gap-1.5" style={{ gridAutoRows: '1fr' }}>
                {planItems.map(({ label, value }, i) => (
                    <div key={label} className="rounded-md px-3 py-2 bg-slate-900/60 border border-slate-700/30 flex flex-col justify-center">
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold leading-none mb-2">{label}</p>
                        <p className="flex items-center justify-between text-blue-400">
                            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Planned</span>
                            <span className="text-2xl font-extrabold">{value}</span>
                        </p>
                        <p className="flex items-center justify-between text-green-400">
                            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">{doneLabel}</span>
                            <span className="text-2xl font-extrabold">{doneItems[i].value}</span>
                        </p>
                    </div>
                ))}
            </div>
            <div className="shrink-0 rounded-md px-3 py-2 bg-slate-700/40 border border-slate-600/50 flex items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-blue-400">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Total Planned</span>
                    <span className="text-2xl font-extrabold">{planTotal}</span>
                </p>
                <p className="flex items-center gap-2 text-green-400">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Total {doneLabel}</span>
                    <span className="text-2xl font-extrabold">{doneTotal}</span>
                </p>
            </div>
        </div>
    );
}

export default function VesselCard({ vessel }) {
    const fmt = (dt) => dt ? new Date(dt).toLocaleString() : null;

    return (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex-1 min-h-0 flex flex-col">
            <div className="shrink-0 flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-lg font-extrabold text-white tracking-wide">
                    {vessel.vessel_name}
                </h2>
                <PhaseBadge phase={vessel.phase} />
                <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-xs uppercase tracking-widest">SVC</span>
                    <span className="text-slate-200 text-xs font-bold">{vessel.service}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-xs uppercase tracking-widest">OPR</span>
                    <span className="text-slate-200 text-xs font-bold">{vessel.line_op}</span>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    {fmt(vessel.actual_time_of_arrival) && (
                        <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-xs uppercase tracking-widest">ATA</span>
                            <span className="text-slate-200 text-xs font-bold">{fmt(vessel.actual_time_of_arrival)}</span>
                        </div>
                    )}
                    {fmt(vessel.actual_time_of_departure) && (
                        <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-xs uppercase tracking-widest">ATD</span>
                            <span className="text-slate-200 text-xs font-bold">{fmt(vessel.actual_time_of_departure)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 grid md:grid-cols-2 gap-3">
                <section className="flex flex-col min-h-0">
                    <div className="shrink-0 flex items-center justify-between mb-1">
                        <h3 className="text-cyan-400 font-semibold uppercase text-xs tracking-widest">Loading</h3>
                        <span className="text-slate-300 text-xs font-mono">
                            {vessel.total_loaded_count} / {vessel.total_planned_loading_wi}
                        </span>
                    </div>
                    <div className="shrink-0">
                        <ProgressBar value={vessel.total_loaded_count} max={vessel.total_planned_loading_wi} colorClass="bg-cyan-500" />
                    </div>
                    <StatSection
                        doneLabel="Loaded"
                        planTotal={vessel.total_planned_loading_wi}
                        doneTotal={vessel.total_loaded_count}
                        planItems={[
                            { label: 'FCL 20FT', value: vessel.load_plan_fcl_20ft },
                            { label: 'FCL 40FT', value: vessel.load_plan_fcl_40ft },
                            { label: 'MTY 20FT', value: vessel.load_plan_empty_20ft },
                            { label: 'MTY 40FT', value: vessel.load_plan_empty_40ft },
                        ]}
                        doneItems={[
                            { label: 'FCL 20FT', value: vessel.loaded_fcl_20ft },
                            { label: 'FCL 40FT', value: vessel.loaded_fcl_40ft },
                            { label: 'MTY 20FT', value: vessel.loaded_empty_20ft },
                            { label: 'MTY 40FT', value: vessel.loaded_empty_40ft },
                        ]}
                    />
                </section>

                <section className="flex flex-col min-h-0">
                    <div className="shrink-0 flex items-center justify-between mb-1">
                        <h3 className="text-amber-400 font-semibold uppercase text-xs tracking-widest">Discharge</h3>
                        <span className="text-slate-300 text-xs font-mono">
                            {vessel.total_discharged_count} / {vessel.total_planned_discharge}
                        </span>
                    </div>
                    <div className="shrink-0">
                        <ProgressBar value={vessel.total_discharged_count} max={vessel.total_planned_discharge} colorClass="bg-amber-500" />
                    </div>
                    <StatSection
                        doneLabel="Discharged"
                        planTotal={vessel.total_planned_discharge}
                        doneTotal={vessel.total_discharged_count}
                        planItems={[
                            { label: 'FCL 20FT', value: vessel.discharge_plan_fcl_20ft },
                            { label: 'FCL 40FT', value: vessel.discharge_plan_fcl_40ft },
                            { label: 'MTY 20FT', value: vessel.discharge_plan_mty_20ft },
                            { label: 'MTY 40FT', value: vessel.discharge_plan_mty_40ft },
                        ]}
                        doneItems={[
                            { label: 'FCL 20FT', value: vessel.discharged_fcl_20ft },
                            { label: 'FCL 40FT', value: vessel.discharged_fcl_40ft },
                            { label: 'MTY 20FT', value: vessel.discharged_empty_20ft },
                            { label: 'MTY 40FT', value: vessel.discharged_empty_40ft },
                        ]}
                    />
                </section>
            </div>
        </div>
    );
}
