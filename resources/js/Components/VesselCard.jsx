import ProgressBar from './ProgressBar';
import VesselBarChart from './VesselBarChart';

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

const bal = (planned, done) => Math.max(0, (planned || 0) - (done || 0));

function StatTable({ vessel, isAlone }) {
    const cell       = 'text-center text-3xl font-extrabold px-2 align-middle';
    const label      = `text-left ${isAlone ? 'text-2xl' : 'text-sm'} font-bold uppercase tracking-widest px-2 whitespace-nowrap align-middle`;
    const colHead    = 'text-center text-xl font-bold uppercase tracking-widest px-2 py-0';
    const groupHead  = 'text-center text-xl font-extrabold uppercase tracking-widest px-2 py-0 border-b border-slate-600/50';
    const sectionRow = `${isAlone ? 'text-3xl' : 'text-sm'} font-extrabold uppercase tracking-widest px-2 py-0.5`;
    const totalLabel = isAlone ? 'text-sm' : 'text-xs';
    const totalValue = isAlone ? 'text-xl' : 'text-base';

    return (
        <div className="h-full">
            <table className="w-full h-full border-collapse text-white">
                <thead>
                    <tr className="bg-slate-900/60">
                        <th className="px-3 py-0" />
                        <th colSpan={2} className={`${groupHead} border-l border-slate-600/50`}>20FT</th>
                        <th colSpan={2} className={`${groupHead} border-l border-slate-600/50`}>40FT</th>
                    </tr>
                    <tr className="bg-slate-900/40">
                        <th className="px-3 py-0" />
                        <th className={`${colHead} border-l border-slate-600/50 text-slate-300`}>FCL</th>
                        <th className={`${colHead} text-slate-300`}>MTY</th>
                        <th className={`${colHead} border-l border-slate-600/50 text-slate-300`}>FCL</th>
                        <th className={`${colHead} text-slate-300`}>MTY</th>
                    </tr>
                </thead>
                <tbody>
                    {/* DISCHARGING section */}
                    <tr className="bg-amber-900/20 border-t border-amber-700/40">
                        <td colSpan={5} className={`${sectionRow} text-amber-400`}>Discharging</td>
                    </tr>
                    <tr className="bg-slate-800/60">
                        <td className={`${label} text-blue-400`}>Planned</td>
                        <td className={`${cell} text-blue-300 border-l border-slate-700/30`}>{vessel.discharge_plan_fcl_20ft}</td>
                        <td className={`${cell} text-blue-300`}>{vessel.discharge_plan_mty_20ft}</td>
                        <td className={`${cell} text-blue-300 border-l border-slate-700/30`}>{vessel.discharge_plan_fcl_40ft}</td>
                        <td className={`${cell} text-blue-300`}>{vessel.discharge_plan_mty_40ft}</td>
                    </tr>
                    <tr className="bg-slate-800/40">
                        <td className={`${label} text-green-400`}>Discharged</td>
                        <td className={`${cell} text-green-300 border-l border-slate-700/30`}>{vessel.discharged_fcl_20ft}</td>
                        <td className={`${cell} text-green-300`}>{vessel.discharged_empty_20ft}</td>
                        <td className={`${cell} text-green-300 border-l border-slate-700/30`}>{vessel.discharged_fcl_40ft}</td>
                        <td className={`${cell} text-green-300`}>{vessel.discharged_empty_40ft}</td>
                    </tr>
                    <tr className="bg-slate-800/20">
                        <td className={`${label} text-yellow-400`}>Balance</td>
                        <td className={`${cell} text-yellow-300 border-l border-slate-700/30`}>{bal(vessel.discharge_plan_fcl_20ft, vessel.discharged_fcl_20ft)}</td>
                        <td className={`${cell} text-yellow-300`}>{bal(vessel.discharge_plan_mty_20ft, vessel.discharged_empty_20ft)}</td>
                        <td className={`${cell} text-yellow-300 border-l border-slate-700/30`}>{bal(vessel.discharge_plan_fcl_40ft, vessel.discharged_fcl_40ft)}</td>
                        <td className={`${cell} text-yellow-300`}>{bal(vessel.discharge_plan_mty_40ft, vessel.discharged_empty_40ft)}</td>
                    </tr>
                    <tr className="bg-amber-900/10 border-b border-amber-700/30">
                        <td colSpan={5} className="px-2 py-0.5">
                            <div className="flex items-center justify-between">
                                <span className={`${totalLabel} font-bold text-blue-500 uppercase tracking-widest`}>
                                    Total Planned: <span className={`text-blue-300 ${totalValue} font-extrabold`}>{vessel.total_planned_discharge}</span>
                                </span>
                                <span className={`${totalLabel} font-bold text-green-600 uppercase tracking-widest`}>
                                    Total Discharged: <span className={`text-green-400 ${totalValue} font-extrabold`}>{vessel.total_discharged_count}</span>
                                </span>
                                <span className={`${totalLabel} font-bold text-yellow-600 uppercase tracking-widest`}>
                                    Balance: <span className={`text-yellow-300 ${totalValue} font-extrabold`}>{bal(vessel.total_planned_discharge, vessel.total_discharged_count)}</span>
                                </span>
                            </div>
                        </td>
                    </tr>

                    {/* LOADING section */}
                    <tr className="bg-cyan-900/20 border-t-2 border-slate-600/60">
                        <td colSpan={5} className={`${sectionRow} text-cyan-400`}>Loading</td>
                    </tr>
                    <tr className="bg-slate-800/60">
                        <td className={`${label} text-blue-400`}>Planned</td>
                        <td className={`${cell} text-blue-300 border-l border-slate-700/30`}>{vessel.load_plan_fcl_20ft}</td>
                        <td className={`${cell} text-blue-300`}>{vessel.load_plan_empty_20ft}</td>
                        <td className={`${cell} text-blue-300 border-l border-slate-700/30`}>{vessel.load_plan_fcl_40ft}</td>
                        <td className={`${cell} text-blue-300`}>{vessel.load_plan_empty_40ft}</td>
                    </tr>
                    <tr className="bg-slate-800/40">
                        <td className={`${label} text-green-400`}>Loaded</td>
                        <td className={`${cell} text-green-300 border-l border-slate-700/30`}>{vessel.loaded_fcl_20ft}</td>
                        <td className={`${cell} text-green-300`}>{vessel.loaded_empty_20ft}</td>
                        <td className={`${cell} text-green-300 border-l border-slate-700/30`}>{vessel.loaded_fcl_40ft}</td>
                        <td className={`${cell} text-green-300`}>{vessel.loaded_empty_40ft}</td>
                    </tr>
                    <tr className="bg-slate-800/20">
                        <td className={`${label} text-yellow-400`}>Balance</td>
                        <td className={`${cell} text-yellow-300 border-l border-slate-700/30`}>{bal(vessel.load_plan_fcl_20ft, vessel.loaded_fcl_20ft)}</td>
                        <td className={`${cell} text-yellow-300`}>{bal(vessel.load_plan_empty_20ft, vessel.loaded_empty_20ft)}</td>
                        <td className={`${cell} text-yellow-300 border-l border-slate-700/30`}>{bal(vessel.load_plan_fcl_40ft, vessel.loaded_fcl_40ft)}</td>
                        <td className={`${cell} text-yellow-300`}>{bal(vessel.load_plan_empty_40ft, vessel.loaded_empty_40ft)}</td>
                    </tr>
                    <tr className="bg-cyan-900/10 border-b border-cyan-700/30">
                        <td colSpan={5} className="px-2 py-0.5">
                            <div className="flex items-center justify-between">
                                <span className={`${totalLabel} font-bold text-blue-500 uppercase tracking-widest`}>
                                    Total Planned: <span className={`text-blue-300 ${totalValue} font-extrabold`}>{vessel.total_planned_loading_wi}</span>
                                </span>
                                <span className={`${totalLabel} font-bold text-green-600 uppercase tracking-widest`}>
                                    Total Loaded: <span className={`text-green-400 ${totalValue} font-extrabold`}>{vessel.total_loaded_count}</span>
                                </span>
                                <span className={`${totalLabel} font-bold text-yellow-600 uppercase tracking-widest`}>
                                    Balance: <span className={`text-yellow-300 ${totalValue} font-extrabold`}>{bal(vessel.total_planned_loading_wi, vessel.total_loaded_count)}</span>
                                </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default function VesselCard({ vessel, isAlone }) {
    const fmt = (dt) => dt ? new Date(dt).toLocaleString() : null;
    const meta = isAlone ? 'text-base' : 'text-sm';

    return (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 h-full flex flex-col">
            {/* Vessel header */}
            <div className="shrink-0 flex flex-wrap items-center gap-2 mb-1">
                <h2 className={`${isAlone ? 'text-2xl' : 'text-xl'} font-extrabold text-white tracking-wide`}>
                    {vessel.vessel_name}
                </h2>
                <PhaseBadge phase={vessel.phase} />
                <div className="flex items-center gap-1">
                    <span className={`text-slate-500 ${meta} uppercase tracking-widest`}>SVC</span>
                    <span className={`text-slate-200 ${meta} font-bold`}>{vessel.service}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`text-slate-500 ${meta} uppercase tracking-widest`}>OPR</span>
                    <span className={`text-slate-200 ${meta} font-bold`}>{vessel.line_op}</span>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    {fmt(vessel.actual_time_of_arrival) && (
                        <div className="flex items-center gap-1">
                            <span className={`text-slate-500 ${meta} uppercase tracking-widest`}>ATA</span>
                            <span className={`text-slate-200 ${meta} font-bold`}>{fmt(vessel.actual_time_of_arrival)}</span>
                        </div>
                    )}
                    {fmt(vessel.actual_time_of_departure) && (
                        <div className="flex items-center gap-1">
                            <span className={`text-slate-500 ${meta} uppercase tracking-widest`}>ATD</span>
                            <span className={`text-slate-200 ${meta} font-bold`}>{fmt(vessel.actual_time_of_departure)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Two progress bars side-by-side */}
            <div className="shrink-0 grid grid-cols-2 gap-2 mb-1">
                <div>
                    <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-amber-400 font-semibold uppercase ${meta} tracking-widest`}>Discharge</span>
                        <span className={`text-slate-300 ${meta} font-mono font-bold`}>
                            {vessel.total_discharged_count} / {vessel.total_planned_discharge}
                        </span>
                    </div>
                    <ProgressBar value={vessel.total_discharged_count} max={vessel.total_planned_discharge} colorClass="bg-amber-500" />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-cyan-400 font-semibold uppercase ${meta} tracking-widest`}>Loading</span>
                        <span className={`text-slate-300 ${meta} font-mono font-bold`}>
                            {vessel.total_loaded_count} / {vessel.total_planned_loading_wi}
                        </span>
                    </div>
                    <ProgressBar value={vessel.total_loaded_count} max={vessel.total_planned_loading_wi} colorClass="bg-cyan-500" />
                </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
                {/* Left — stat table, 50% */}
                <div className="w-1/2 min-h-0 overflow-hidden flex flex-col">
                    <StatTable vessel={vessel} isAlone={isAlone} />
                </div>
                {/* Right — chart, 50%, 75% height, centered */}
                <div className="w-1/2 min-h-0 flex items-center justify-center">
                    <div className="w-full h-3/4">
                        <VesselBarChart vesselId={vessel.vessel_id} vesselName={vessel.vessel_name} isAlone={isAlone} />
                    </div>
                </div>
            </div>
        </div>
    );
}
