import { useEffect, useState } from 'react';

const OVERRIDE_FIELDS = [
    { key: 'total_planned_discharge',  label: 'Total Planned Discharge',  group: 'discharge' },
    { key: 'discharge_plan_fcl_20ft',  label: 'Discharge FCL 20FT',       group: 'discharge' },
    { key: 'discharge_plan_fcl_40ft',  label: 'Discharge FCL 40FT',       group: 'discharge' },
    { key: 'discharge_plan_mty_20ft',  label: 'Discharge MTY 20FT',       group: 'discharge' },
    { key: 'discharge_plan_mty_40ft',  label: 'Discharge MTY 40FT',       group: 'discharge' },
    { key: 'total_planned_loading_wi', label: 'Total Planned Loading',    group: 'loading' },
    { key: 'load_plan_fcl_20ft',       label: 'Loading FCL 20FT',         group: 'loading' },
    { key: 'load_plan_fcl_40ft',       label: 'Loading FCL 40FT',         group: 'loading' },
    { key: 'load_plan_empty_20ft',     label: 'Loading MTY 20FT',         group: 'loading' },
    { key: 'load_plan_empty_40ft',     label: 'Loading MTY 40FT',         group: 'loading' },
];

function authHeaders() {
    const token = localStorage.getItem('admin_token');
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

// ─── Vessel Override Panel ───────────────────────────────────────────────────

const LOADING_SUB_FIELDS = ['load_plan_fcl_20ft', 'load_plan_fcl_40ft', 'load_plan_empty_20ft', 'load_plan_empty_40ft'];

function OverrideForm({ vessel, onSaved, onCancel }) {
    const initial = Object.fromEntries(OVERRIDE_FIELDS.map(f => [f.key, vessel[f.key] ?? '']));
    const [values, setValues] = useState(initial);
    const [saving, setSaving] = useState(false);

    const loadingSubFields = OVERRIDE_FIELDS.filter(f => LOADING_SUB_FIELDS.includes(f.key));

    const autoSum = (vals) =>
        LOADING_SUB_FIELDS.reduce((sum, k) => sum + (Number(vals[k]) || 0), 0);

    const handleChange = (key, value) => {
        setValues(prev => {
            const next = { ...prev, [key]: value };
            if (LOADING_SUB_FIELDS.includes(key)) {
                next.total_planned_loading_wi = autoSum(next);
            }
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        const body = { ob_ib_id: vessel.ob_ib_id };
        OVERRIDE_FIELDS.forEach(f => {
            body[f.key] = values[f.key] === '' ? null : Number(values[f.key]);
        });
        await fetch('/api/admin/vessel-plan-override', {
            method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
        });
        setSaving(false);
        onSaved();
    };

    const handleRemove = async () => {
        setSaving(true);
        await fetch(`/api/admin/vessel-plan-override/${encodeURIComponent(vessel.ob_ib_id)}`, {
            method: 'DELETE', headers: authHeaders(),
        });
        setSaving(false);
        onSaved();
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mt-3">
            <p className="text-slate-400 text-xs mb-4">Leave blank to use the live query value.</p>
            <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">Loading</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
                {loadingSubFields.map(f => (
                    <label key={f.key} className="flex flex-col gap-1">
                        <span className="text-slate-400 text-xs uppercase tracking-wider">{f.label}</span>
                        <input
                            type="number" min="0"
                            value={values[f.key]}
                            onChange={e => handleChange(f.key, e.target.value)}
                            placeholder="Live data"
                            className="bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                        />
                    </label>
                ))}
            </div>
            <label className="flex flex-col gap-1 mb-5">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Total Planned Loading</span>
                <input
                    type="number" readOnly
                    value={autoSum(values)}
                    className="bg-slate-900/60 border border-slate-700 rounded-md px-3 py-1.5 text-cyan-300 text-sm font-bold cursor-not-allowed"
                />
            </label>
            <div className="flex gap-3">
                <button onClick={handleSave} disabled={saving}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-sm uppercase tracking-widest">
                    {saving ? 'Saving…' : 'Save Override'}
                </button>
                {vessel.has_override && (
                    <button onClick={handleRemove} disabled={saving}
                        className="bg-red-900/60 hover:bg-red-800 text-red-300 font-bold py-2 px-4 rounded-lg text-sm uppercase tracking-widest">
                        Remove
                    </button>
                )}
                <button onClick={onCancel}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2 px-4 rounded-lg text-sm uppercase tracking-widest">
                    Cancel
                </button>
            </div>
        </div>
    );
}

function VesselOverridePanel() {
    const [vessels, setVessels] = useState([]);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchVessels = async () => {
        setLoading(true);
        const res = await fetch('/api/dashboard-data');
        const data = await res.json();
        setVessels(data.vessels || []);
        setLoading(false);
    };

    useEffect(() => { fetchVessels(); }, []);

    if (loading) return <p className="text-slate-500">Loading vessels…</p>;
    if (!vessels.length) return <p className="text-slate-500">No active vessel visits.</p>;

    return (
        <div className="flex flex-col gap-4">
            {vessels.map(vessel => (
                <div key={vessel.ob_ib_id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-white font-extrabold text-lg">{vessel.vessel_name}</h3>
                            <span className="text-xs text-slate-400">SVC {vessel.service} · OPR {vessel.line_op}</span>
                            {vessel.has_override && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700">
                                    Override Active
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setEditing(editing === vessel.ob_ib_id ? null : vessel.ob_ib_id)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-1.5 px-4 rounded-lg text-sm uppercase tracking-widest"
                        >
                            {editing === vessel.ob_ib_id ? 'Close' : 'Edit Planned'}
                        </button>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-4 text-sm text-slate-400">
                        <span>Discharge Planned: <b className="text-blue-300">{vessel.total_planned_discharge}</b></span>
                        <span>Discharged: <b className="text-green-300">{vessel.total_discharged_count}</b></span>
                        <span>Loading Planned: <b className="text-blue-300">{vessel.total_planned_loading_wi}</b></span>
                        <span>Loaded: <b className="text-green-300">{vessel.total_loaded_count}</b></span>
                    </div>
                    {editing === vessel.ob_ib_id && (
                        <OverrideForm
                            vessel={vessel}
                            onSaved={() => { fetchVessels(); setEditing(null); }}
                            onCancel={() => setEditing(null)}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── User Management Panel ───────────────────────────────────────────────────

function UserManagement({ currentUser }) {
    const [users, setUsers]   = useState([]);
    const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'admin' });
    const [error, setError]   = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchUsers = async () => {
        const res = await fetch('/api/admin/users', { headers: authHeaders() });
        setUsers(await res.json());
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        const res = await fetch('/api/admin/users', {
            method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
        });
        const data = await res.json();
        setSaving(false);
        if (!res.ok) { setError(data.message || JSON.stringify(data.errors)); return; }
        setForm({ name: '', email: '', password: '', role: 'admin' });
        fetchUsers();
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this user?')) return;
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: authHeaders() });
        fetchUsers();
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Add user form */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-white font-bold text-base uppercase tracking-widest mb-4">Add User</h3>
                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
                    {[['name','Name','text'],['email','Email','email'],['password','Password','password']].map(([k,l,t]) => (
                        <label key={k} className="flex flex-col gap-1">
                            <span className="text-slate-400 text-xs uppercase tracking-wider">{l}</span>
                            <input type={t} value={form[k]} required
                                onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                                className="bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                            />
                        </label>
                    ))}
                    <label className="flex flex-col gap-1">
                        <span className="text-slate-400 text-xs uppercase tracking-wider">Role</span>
                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                            className="bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                        </select>
                    </label>
                    <div className="col-span-2">
                        <button type="submit" disabled={saving}
                            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg text-sm uppercase tracking-widest">
                            {saving ? 'Adding…' : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>

            {/* User list */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs tracking-widest">
                        <tr>
                            <th className="px-5 py-3">Name</th>
                            <th className="px-5 py-3">Email</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3">Created</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                                <td className="px-5 py-3 text-white font-semibold">{u.name}</td>
                                <td className="px-5 py-3 text-slate-300">{u.email}</td>
                                <td className="px-5 py-3">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${u.role === 'superadmin' ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-cyan-900/50 text-cyan-300 border border-cyan-700'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                                <td className="px-5 py-3">
                                    {u.id !== currentUser.id && (
                                        <button onClick={() => handleDelete(u.id)}
                                            className="text-red-400 hover:text-red-300 text-xs uppercase font-bold">
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── App Shell ───────────────────────────────────────────────────────────────

export default function App() {
    const [user, setUser]         = useState(null);
    const [checking, setChecking] = useState(true);
    const [page, setPage]         = useState('vessels');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { window.location.href = '/admin-panel/login'; return; }

        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
            .then(r => {
                if (!r.ok) { localStorage.removeItem('admin_token'); window.location.href = '/admin-panel/login'; return null; }
                return r.json();
            })
            .then(data => { if (data) setUser(data); })
            .finally(() => setChecking(false));
    }, []);

    const logout = async () => {
        const token = localStorage.getItem('admin_token');
        await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin-panel/login';
    };

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0e17' }}>
                <p className="text-slate-500">Verifying session…</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#0a0e17', color: '#e2e8f0' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-4 border-b border-slate-700/50">
                <div>
                    <h1 className="text-2xl font-extrabold text-cyan-400 uppercase tracking-widest">Vessel Operations</h1>
                    <p className="text-slate-500 text-xs mt-0.5">Admin Panel</p>
                </div>
                <div className="flex items-center gap-6">
                    <nav className="flex items-center gap-1">
                        <button
                            onClick={() => setPage('vessels')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors ${page === 'vessels' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Vessel Overrides
                        </button>
                        {user.role === 'superadmin' && (
                            <button
                                onClick={() => setPage('users')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors ${page === 'users' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                User Management
                            </button>
                        )}
                    </nav>
                    <div className="text-right">
                        <p className="text-white text-sm font-semibold">{user.name}</p>
                        <p className="text-slate-500 text-xs">{user.role}</p>
                    </div>
                    <button onClick={logout}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2 px-4 rounded-lg text-sm uppercase tracking-widest">
                        Logout
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="px-8 py-6">
                {page === 'vessels' && <VesselOverridePanel />}
                {page === 'users' && user.role === 'superadmin' && <UserManagement currentUser={user} />}
            </main>
        </div>
    );
}
