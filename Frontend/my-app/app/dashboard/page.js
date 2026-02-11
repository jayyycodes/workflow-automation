'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, LayoutGrid, Zap, Shield, Play, Pause, Trash2, Edit, List, Calendar, CheckCircle } from 'lucide-react';
import { EmptyAutomations } from '@/components/ui/empty-states';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Stats Card Component - matching the screenshot exactly
const StatCard = ({ icon: Icon, label, value, subtext, iconBgColor = "bg-green-500/10", iconColor = "text-green-500" }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors"
    >
        {/* Large background icon on the right */}
        <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10">
            <div className={`w-20 h-20 rounded-full border-4 ${iconColor.replace('text-', 'border-')} flex items-center justify-center`}>
                <Icon className={`w-10 h-10 ${iconColor}`} />
            </div>
        </div>

        <div className="relative z-10">
            <div className={`inline-flex p-1.5 rounded-lg ${iconBgColor} mb-4`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>

            <h3 className="text-4xl font-bold text-white mb-1">{value}</h3>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xs text-gray-600">{subtext}</p>
        </div>
    </motion.div>
);

export default function DashboardPage() {
    const [automations, setAutomations] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [selectedIds, setSelectedIds] = useState([]);
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { success, error: showError } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        loadAutomations();
    }, [isAuthenticated, authLoading, router]);

    const loadAutomations = async () => {
        try {
            setLoading(true);
            const data = await api.getAutomations();

            const automationData = data.automations || [];
            let totalExecutions = 0;
            let dailyExecutions = 0;
            const today = new Date().toDateString();

            const enrichedAutomations = await Promise.all(automationData.map(async (auto) => {
                try {
                    const execs = await api.getAutomationExecutions(auto.id);
                    totalExecutions += execs.length;

                    // Count daily executions
                    const todayExecs = execs.filter(e => new Date(e.created_at).toDateString() === today).length;
                    dailyExecutions += todayExecs;

                    return { ...auto, lastRun: execs[0]?.created_at, executionCount: execs.length };
                } catch (e) {
                    return { ...auto, executionCount: 0 };
                }
            }));

            setAutomations(enrichedAutomations);
            setExecutions({ total: totalExecutions, daily: dailyExecutions });
        } catch (error) {
            console.error('Failed to load automations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        try {
            setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
            await api.updateAutomationStatus(id, newStatus);
            success(`Automation ${newStatus === 'active' ? 'activated' : 'paused'}`);
        } catch (error) {
            showError('Failed to update status');
            loadAutomations();
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this automation?')) {
            try {
                await api.deleteAutomation(id);
                success('Automation deleted');
                loadAutomations();
            } catch (error) {
                showError('Failed to delete automation');
            }
        }
    };

    const handleTestRun = async (id, name) => {
        try {
            setAutomations(prev => prev.map(a =>
                a.id === id ? { ...a, isTestRunning: true } : a
            ));
            await api.runAutomation(id);
            success(`Test run started for "${name}"`);
            // Refresh after a delay to show execution
            setTimeout(() => loadAutomations(), 2000);
        } catch (error) {
            showError('Failed to start test run');
            setAutomations(prev => prev.map(a =>
                a.id === id ? { ...a, isTestRunning: false } : a
            ));
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === automations.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(automations.map(a => a.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Delete ${selectedIds.length} automations?`)) {
            try {
                await Promise.all(selectedIds.map(id => api.deleteAutomation(id)));
                success(`${selectedIds.length} automations deleted`);
                setSelectedIds([]);
                loadAutomations();
            } catch (error) {
                showError('Failed to delete some automations');
                loadAutomations();
            }
        }
    };

    const activeCount = automations.filter(a => a.status === 'active').length;

    return (
        <div className="font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className="text-sm font-bold text-green-500">ONLINE</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    </div>
                </div>

                <Link href="/dashboard/create">
                    <Button className="bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 font-semibold">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Automation
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    icon={Clock}
                    label="TOTAL EXECUTIONS"
                    value={executions.total || 0}
                    subtext="Processing Time: 840ms avg"
                    iconBgColor="bg-green-500/10"
                    iconColor="text-green-500"
                />
                <StatCard
                    icon={LayoutGrid}
                    label="ACTIVE WORKFLOWS"
                    value={activeCount}
                    subtext={`${automations.length} Total Definitions`}
                    iconBgColor="bg-cyan-500/10"
                    iconColor="text-cyan-500"
                />
                <StatCard
                    icon={Zap}
                    label="DAILY EXECUTIONS"
                    value={executions.daily || 0}
                    subtext="Runs in last 24h"
                    iconBgColor="bg-yellow-500/10"
                    iconColor="text-yellow-500"
                />
                <StatCard
                    icon={Shield}
                    label="TOTAL AUTOMATIONS"
                    value={automations.length}
                    subtext="All created workflows"
                    iconBgColor="bg-emerald-500/10"
                    iconColor="text-emerald-500"
                />
            </div>

            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-white">Active Workflows</h2>

                    {/* Bulk Selection Actions */}
                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={automations.length > 0 && selectedIds.length === automations.length}
                                    onChange={toggleSelectAll}
                                    className="peer h-4 w-4 opacity-0 absolute cursor-pointer"
                                />
                                <div className="h-4 w-4 border border-white/20 rounded bg-white/5 peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center">
                                    <CheckCircle className={`w-3 h-3 text-black font-bold ${selectedIds.length === automations.length ? 'block' : 'hidden'}`} />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors uppercase tracking-wider">Select All</span>
                        </label>

                        {selectedIds.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={handleBulkDelete}
                                className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 text-xs font-bold uppercase transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete ({selectedIds.length})
                            </motion.button>
                        )}
                    </div>
                </div>
                <div className="flex gap-1 bg-[#111] p-1 rounded-lg border border-white/5">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="w-8 h-8 mx-auto border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500">Loading your workspace...</p>
                </div>
            ) : automations.length === 0 ? (
                <EmptyAutomations />
            ) : (
                <div className="space-y-4">
                    {automations.map((automation) => (
                        <div
                            key={automation.id}
                            className="bg-[#111] border border-white/5 rounded-xl p-6 group hover:border-green-500/30 transition-all"
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Selection Checkbox */}
                                    <div className="pt-1">
                                        <label className="relative flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(automation.id)}
                                                onChange={() => toggleSelect(automation.id)}
                                                className="peer h-4 w-4 opacity-0 absolute cursor-pointer"
                                            />
                                            <div className="h-4 w-4 border border-white/20 rounded bg-white/5 peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center">
                                                <CheckCircle className={`w-3 h-3 text-black font-bold ${selectedIds.includes(automation.id) ? 'block' : 'hidden'}`} />
                                            </div>
                                        </label>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-white">{automation.name}</h3>
                                            {automation.status === 'paused' && (
                                                <span className="px-2 py-1 rounded text-[10px] bg-orange-500/10 text-orange-500 font-bold border border-orange-500/20 uppercase flex items-center gap-1">
                                                    <Pause className="w-3 h-3" /> Paused
                                                </span>
                                            )}
                                            {automation.status === 'active' && (
                                                <span className="px-2 py-1 rounded text-[10px] bg-green-500/10 text-green-500 font-bold border border-green-500/20 uppercase flex items-center gap-1">
                                                    <Play className="w-3 h-3 fill-green-500" /> Active
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 max-w-2xl">
                                            {automation.description || 'No description provided.'}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {automation.lastRun ? `Last run: ${new Date(automation.lastRun).toLocaleDateString()}` : 'No runs yet'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Activate/Pause Button */}
                                        <Button
                                            onClick={() => handleToggle(automation.id, automation.status)}
                                            className={`h-9 px-4 text-xs font-semibold ${automation.status === 'active'
                                                ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20'
                                                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
                                                }`}
                                        >
                                            {automation.status === 'active' ? (
                                                <><Pause className="w-3.5 h-3.5 mr-1.5" /> Pause</>
                                            ) : (
                                                <><Play className="w-3.5 h-3.5 mr-1.5 fill-white" /> Activate</>
                                            )}
                                        </Button>

                                        {/* Action Icons */}
                                        <div className="flex items-center gap-0.5 bg-black/40 p-1 rounded-lg border border-white/5">
                                            <button
                                                onClick={() => handleTestRun(automation.id, automation.name)}
                                                disabled={automation.isTestRunning}
                                                className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-500/10 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Test Run (Run Once)"
                                            >
                                                {automation.isTestRunning ? (
                                                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Play className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(automation.id)}
                                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

