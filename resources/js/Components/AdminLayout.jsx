import { Link, router } from '@inertiajs/react';

const navItems = [
    { label: 'Overview', href: '/admin' },
    { label: 'Sync Logs', href: '/admin/logs' },
];

export default function AdminLayout({ children, title }) {
    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    return (
        <div className="min-h-screen flex bg-slate-900 text-slate-100">
            {/* Sidebar */}
            <aside className="w-56 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col">
                <div className="px-5 py-5 border-b border-slate-700">
                    <p className="text-cyan-400 font-bold text-lg leading-tight">Vessel</p>
                    <p className="text-slate-400 text-xs">Admin Panel</p>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const active =
                            typeof window !== 'undefined' &&
                            window.location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-cyan-700 text-white'
                                        : 'text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="px-3 py-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                <header className="px-8 py-4 border-b border-slate-700 flex items-center">
                    <h1 className="text-lg font-semibold text-white">{title}</h1>
                </header>
                <main className="flex-1 px-8 py-6">{children}</main>
            </div>
        </div>
    );
}
