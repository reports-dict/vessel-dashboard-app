import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    LabelList, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const Y_MAX = 60;
const THRESHOLD = 20;

const fmtRange = (range) => {
    if (!range) return '';
    const match = range.match(/-(\d+):/);
    return match ? parseInt(match[1], 10) : range;
};

export default function VesselBarChart({ graphData, vesselName, isAlone }) {
    const data = graphData ?? null;

    if (data === null) {
        return <div className="h-full rounded-lg bg-slate-900/40 border border-slate-700/30" />;
    }

    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center rounded-lg bg-slate-900/40 border border-slate-700/30">
                <span className="text-slate-500 text-xs uppercase tracking-widest">No graph data available</span>
            </div>
        );
    }

    const chartData = data.map(d => ({
        label: fmtRange(d.time_range),
        capped: Math.min(d.total_moves || 0, Y_MAX),
        actual: d.total_moves || 0,
    }));

    const tickSize   = isAlone ? 16 : 14;
    const labelSize  = isAlone ? 15 : 13;
    const refSize    = isAlone ? 13 : 12;
    const yLabelSize = isAlone ? 14 : 13;

    return (
        <div className="h-full flex flex-col">
            <p className={`shrink-0 text-center text-slate-400 uppercase tracking-widest mb-1 ${isAlone ? 'text-base' : 'text-xs'}`}>
                {vesselName} — Total Moves Per Extraction Time
            </p>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 22, right: 10, left: isAlone ? 0 : -10, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: '#cbd5e1', fontSize: tickSize, fontWeight: 600 }}
                            axisLine={{ stroke: '#475569' }}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, Y_MAX]}
                            ticks={[0, 15, 30, 45, 60]}
                            tick={{ fill: '#cbd5e1', fontSize: tickSize, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: 'Moves', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: yLabelSize, dy: 30 }}
                        />

                        {/* Bars — visually capped at 60, labels show actual value */}
                        <Bar dataKey="capped" fill="#c8a97e" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                            <LabelList
                                dataKey="actual"
                                position="top"
                                style={{ fill: '#ffffff', fontSize: labelSize, fontWeight: 800 }}
                            />
                        </Bar>

                        {/* Trend line */}
                        <Line
                            dataKey="capped"
                            type="monotone"
                            stroke="#38bdf8"
                            strokeWidth={isAlone ? 2 : 1.5}
                            dot={{ r: isAlone ? 3 : 2, fill: '#38bdf8', strokeWidth: 0 }}
                            activeDot={false}
                            isAnimationActive={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
