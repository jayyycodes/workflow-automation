'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Plus, Settings, LogOut, Menu, X, Terminal,
    ChevronRight, User
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const router = useRouter();

    const menuItems = [
        { icon: Home, label: 'Automations', href: '/dashboard' },
        { icon: Plus, label: 'Create', href: '/dashboard/create' },
        { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
    ];

    return (
        <div className="min-h-screen bg-black text-green-400 font-mono">
            {/* Scanline Effect */}
            <div className="fixed inset-0 pointer-events-none opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_50%,rgba(34,197,94,0.03)_50%)] bg-[length:100%_4px]" />
            </div>

            {/* Mobile Menu Button */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="fixed top-4 left-4 z-50 md:hidden bg-black/60 border border-green-900 p-2 rounded-lg"
            >
                {mobileMenuOpen ? <X className="w-6 h-6 text-green-500" /> : <Menu className="w-6 h-6 text-green-500" />}
            </motion.button>

            {/* Sidebar - Desktop */}
            <motion.aside
                initial={{ x: 0 }}
                animate={{ x: sidebarOpen ? 0 : -280 }}
                className="fixed left-0 top-0 h-full w-72 bg-black/90 border-r border-green-900/50 z-40 hidden md:block backdrop-blur-sm"
            >
                <div className="flex flex-col h-full p-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 mb-8 group">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        >
                            <Terminal className="w-8 h-8 text-green-500" />
                        </motion.div>
                        <span className="text-xl font-bold text-green-500 tracking-wider">
                            [WORKFLOW]
                        </span>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3 rounded bg-black/40 border border-green-900/50 hover:border-green-700 hover:bg-green-950/30 transition-all group"
                            >
                                <item.icon className="w-5 h-5 text-green-700 group-hover:text-green-500 transition" />
                                <span className="text-green-600 group-hover:text-green-400 transition">{'>'} {item.label.toLowerCase()}</span>
                                <ChevronRight className="w-4 h-4 ml-auto text-green-900 group-hover:text-green-700 transition" />
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile */}
                    <div className="border-t border-green-900/50 pt-4">
                        <div className="bg-black/40 border border-green-900/50 rounded p-4 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-900/50 border-2 border-green-700 flex items-center justify-center">
                                    <User className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-green-400 truncate">{user?.name || 'User'}</p>
                                    <p className="text-xs text-green-800 truncate">{user?.email || 'user@system.net'}</p>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded bg-red-950/50 border border-red-800 text-red-500 hover:bg-red-900/50 hover:border-red-700 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>{'>'} logout</span>
                        </motion.button>
                    </div>
                </div>
            </motion.aside>

            {/* Sidebar - Mobile */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/80 z-30 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="fixed left-0 top-0 h-full w-72 bg-black/95 border-r border-green-900/50 z-40 md:hidden backdrop-blur-sm"
                        >
                            <div className="flex flex-col h-full p-6">
                                {/* Logo */}
                                <Link href="/" className="flex items-center gap-2 mb-8">
                                    <Terminal className="w-8 h-8 text-green-500" />
                                    <span className="text-xl font-bold text-green-500 tracking-wider">
                                        [WORKFLOW]
                                    </span>
                                </Link>

                                {/* Navigation */}
                                <nav className="flex-1 space-y-2">
                                    {menuItems.map((item, index) => (
                                        <Link
                                            key={index}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded bg-black/40 border border-green-900/50 hover:border-green-700 hover:bg-green-950/30 transition-all group"
                                        >
                                            <item.icon className="w-5 h-5 text-green-700 group-hover:text-green-500 transition" />
                                            <span className="text-green-600 group-hover:text-green-400 transition">{'>'} {item.label.toLowerCase()}</span>
                                        </Link>
                                    ))}
                                </nav>

                                {/* User Profile */}
                                <div className="border-t border-green-900/50 pt-4">
                                    <div className="bg-black/40 border border-green-900/50 rounded p-4 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-900/50 border-2 border-green-700 flex items-center justify-center">
                                                <User className="w-5 h-5 text-green-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-green-400 truncate">{user?.name || 'User'}</p>
                                                <p className="text-xs text-green-800 truncate">{user?.email || 'user@system.net'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded bg-red-950/50 border border-red-800 text-red-500 hover:bg-red-900/50 hover:border-red-700 transition-all"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span>{'>'} logout</span>
                                    </button>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className={`min-h-screen transition-all duration-300 ${sidebarOpen ? 'md:ml-72' : 'md:ml-0'}`}>
                <div className="p-6 md:p-8">
                    {children}
                </div>
            </main>

            {/* Toggle Sidebar Button - Desktop */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed bottom-6 left-6 bg-black/60 border border-green-900 p-3 rounded-full hidden md:block z-50 hover:border-green-700 transition"
            >
                <motion.div
                    animate={{ rotate: sidebarOpen ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronRight className="w-5 h-5 text-green-500" />
                </motion.div>
            </motion.button>
        </div>
    );
}
