'use client';

import { useAuth } from '@/providers/auth-provider';
import { motion } from 'framer-motion';
import { User, Trophy, Calendar, Zap, Activity, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function ProfilePage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalCreated: 0,
        successRate: 100,
        dayStreak: 0,
        totalExecutions: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        // Mock data loading or fetch from API
        // For now, we'll shim it with some realistic default data if API fails or is empty
        const loadProfileData = async () => {
            try {
                const automations = await api.getAutomations();
                const totalCreated = automations.automations?.length || 0;
                // Calculate other stats...
                setStats({
                    totalCreated,
                    successRate: 100, // Placeholder
                    dayStreak: 1,     // Placeholder
                    totalExecutions: 1 // Placeholder
                });
            } catch (e) {
                console.error("Failed to load profile stats", e);
            }
        };
        loadProfileData();
    }, []);

    // Generate heatmap data (mock for now to match visual)
    const heatmapData = Array.from({ length: 52 * 7 }).map((_, i) => ({
        level: Math.random() > 0.9 ? Math.floor(Math.random() * 4) : 0
    }));

    return (
        <div className="font-sans max-w-5xl mx-auto">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-6"
            >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 flex items-center justify-center relative">
                    <span className="text-4xl font-bold text-green-500">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                    <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-amber-500 text-[10px] font-bold text-black border border-amber-400">
                        Bronze
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-white mb-1">{user?.name || 'Aditya Hawaldar'}</h1>
                    <p className="text-gray-400 mb-2">@{user?.email?.split('@')[0] || 'adityahawaldar07'} • Joined Dec 2024</p>

                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500 font-medium">Rank: Bronze</span>
                    </div>
                </div>

                <button className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-medium text-white transition">
                    Edit Profile
                </button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Automation Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <ShieldIcon className="w-4 h-4 text-gray-500" />
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Automation Stats</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-2xl font-bold text-white mb-1">{stats.totalCreated}</div>
                            <div className="text-xs text-gray-400">Total Created</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-2xl font-bold text-green-500 mb-1">{stats.successRate}%</div>
                            <div className="text-xs text-gray-400">Success Rate</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-2xl font-bold text-white mb-1">{stats.dayStreak}</div>
                            <div className="text-xs text-gray-400">Day Streak</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-2xl font-bold text-blue-500 mb-1">{stats.totalExecutions}</div>
                            <div className="text-xs text-gray-400">Executions</div>
                        </div>
                    </div>
                </motion.div>

                {/* Heatmap & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Heatmap */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-bold text-white">1 executions in the last year</h2>
                            <span className="text-xs text-gray-500">Total active days: 1</span>
                        </div>

                        <div className="flex gap-1 overflow-x-auto pb-2">
                            {/* Simplistic Heatmap Render */}
                            <div className="grid grid-rows-7 grid-flow-col gap-1">
                                {heatmapData.map((d, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-sm ${d.level === 0 ? 'bg-[#1a1a1a]' :
                                            d.level === 1 ? 'bg-green-900' :
                                                d.level === 2 ? 'bg-green-700' :
                                                    d.level === 3 ? 'bg-green-500' : 'bg-green-400'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 justify-end text-xs text-gray-500">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-sm bg-[#1a1a1a]" />
                                <div className="w-3 h-3 rounded-sm bg-green-900" />
                                <div className="w-3 h-3 rounded-sm bg-green-500" />
                            </div>
                            <span>More</span>
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6"
                    >
                        <h2 className="text-sm font-bold text-white mb-6">Recent Activity</h2>

                        <div className="space-y-4">
                            {/* Activity Item */}
                            <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-white">Morning Stock Price Update</h3>
                                    <p className="text-xs text-gray-500">Status: COMPLETED</p>
                                </div>
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                    about 1 hour ago
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Small Badges Section */}
            <div className="mt-6">
                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 w-full md:w-1/3">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-4 h-4 text-gray-500" />
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Badges</h2>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                            <Trophy className="w-3 h-3" />
                            Novice Builder
                        </div>
                        <div className="w-8 h-8 rounded-lg border border-dashed border-gray-700 flex items-center justify-center text-gray-700">
                            +
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShieldIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
    )
}
