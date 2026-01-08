'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Zap, Loader } from 'lucide-react';
import { AutomationCard } from '@/components/features/automation-card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ExecutionModal } from '@/components/features/execution-modal';
import { DashboardAnalytics } from '@/components/features/dashboard-analytics';
import { EmptyAutomations, EmptySearchResults } from '@/components/ui/empty-states';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
    const [automations, setAutomations] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false); // For toggle operations
    const [searchQuery, setSearchQuery] = useState('');
    const [executionResult, setExecutionResult] = useState(null);
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { success, error: showError } = useToast();
    const router = useRouter();

    useEffect(() => {
        // Don't redirect while auth is still loading
        if (authLoading) return;

        if (!isAuthenticated) {
            console.log('🚫 Redirecting to login...');
            router.push('/login');
            return;
        }
        loadAutomations();
    }, [isAuthenticated, authLoading, router]);

    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'paused', 'draft'
    const [sortBy, setSortBy] = useState('created'); // 'created', 'name', 'lastRun'

    const loadAutomations = async (skipExecutions = false) => {
        try {
            if (!skipExecutions) setLoading(true);
            const data = await api.getAutomations();

            if (skipExecutions) {
                // Fast update - just refresh automation data, keep execution metrics
                setAutomations(data.automations || []);
                return;
            }

            // PARALLEL execution fetching for 3-5x faster loading
            const automationsWithMetrics = await Promise.all(
                (data.automations || []).map(async (automation) => {
                    try {
                        const execs = await api.getAutomationExecutions(automation.id);
                        const executionCount = execs?.length || 0;
                        const successCount = execs?.filter(e => e.status === 'success').length || 0;
                        const successRate = executionCount > 0
                            ? Math.round((successCount / executionCount) * 100)
                            : 0;

                        return {
                            ...automation,
                            execution_count: executionCount,
                            success_rate: successRate,
                            executions: execs || []
                        };
                    } catch (err) {
                        return {
                            ...automation,
                            execution_count: 0,
                            success_rate: 0,
                            executions: []
                        };
                    }
                })
            );

            setAutomations(automationsWithMetrics);
            const allExecutions = automationsWithMetrics.flatMap(a => a.executions || []);
            setExecutions(allExecutions);
        } catch (error) {
            console.error('Failed to load automations:', error);
            showError('Failed to load automations');
        } finally {
            if (!skipExecutions) setLoading(false);
        }
    };

    const handleToggle = async (id, newStatus) => {
        // Optimistic update - update UI immediately
        setAutomations(prevAutomations =>
            prevAutomations.map(auto =>
                auto.id === id ? { ...auto, status: newStatus } : auto
            )
        );

        setUpdating(true);

        try {
            await api.updateAutomationStatus(id, newStatus);
            success(`Automation ${newStatus === 'active' ? 'started' : 'stopped'}!`);

            // NO reload - optimistic update is enough!
            // Backend state is now in sync with UI
        } catch (error) {
            console.error('Failed to toggle automation:', error);
            showError('Failed to update automation status.');

            // Revert optimistic update on error
            setAutomations(prevAutomations =>
                prevAutomations.map(auto =>
                    auto.id === id ? { ...auto, status: newStatus === 'active' ? 'paused' : 'active' } : auto
                )
            );
        } finally {
            setUpdating(false);
        }
    };

    const handleViewResults = async (id, testRun = false) => {
        try {
            // Test run mode - execute and show results
            if (testRun) {
                const result = await api.runAutomation(id);

                // API returns: { execution_id, status, steps, duration, error }
                if (result && result.execution_id) {
                    // Fetch the full execution details
                    const executions = await api.getAutomationExecutions(id);
                    const latestExecution = executions[0];

                    setExecutionResult(latestExecution);

                    // Show toast based on status
                    if (result.status === 'success') {
                        success('✅ Automation executed successfully!');
                    } else if (result.status === 'failed') {
                        showError('❌ Some steps failed. Check results for details.');
                    } else {
                        success('🚀 Automation started!');
                    }

                    // Refresh to show new execution
                    loadAutomations(false);
                } else {
                    showError('Failed to execute automation');
                }
                return;
            }

            // Otherwise, fetch execution history
            const executions = await api.getAutomationExecutions(id);
            if (executions && executions.length > 0) {
                setExecutionResult(executions[0]);
            } else {
                showError('No execution results found. Click "Test Run" to execute manually.');
            }
        } catch (error) {
            console.error('Failed to fetch results:', error);

            if (error.response?.status === 404) {
                showError('Execution results not found. The automation may not have run yet.');
            } else {
                showError('Failed to load execution results');
            }
        }
    };

    const handleEdit = (id) => {
        router.push(`/dashboard/automations/${id}`);
    };

    const handleDelete = async (id) => {
        try {
            await api.deleteAutomation(id);
            setAutomations(automations.filter(a => a.id !== id));
            success('Automation deleted successfully');
        } catch (error) {
            console.error('Failed to delete automation:', error);
            showError('Failed to delete automation. Please try again.');
        }
    };

    const filteredAutomations = automations
        .filter(automation => {
            // Filter by search query
            const matchesSearch = automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                automation.description?.toLowerCase().includes(searchQuery.toLowerCase());

            // Filter by status
            const matchesStatus = filterStatus === 'all' || automation.status === filterStatus;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'lastRun':
                    return (b.last_run || 0) - (a.last_run || 0);
                case 'created':
                default:
                    return (b.created_at || 0) - (a.created_at || 0);
            }
        });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto font-mono">
            <div className="mb-8">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold mb-2 text-green-400"
                >
                    {'>'} automations.list()
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-green-700 text-sm"
                >
                    // Manage and monitor your automated workflows
                </motion.p>
            </div>

            {/* Analytics Widget - Show only if there are automations */}
            {!loading && automations.length > 0 && (
                <DashboardAnalytics
                    automations={automations}
                    executions={executions}
                />
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row gap-4 mb-8"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-700" />
                    <input
                        type="text"
                        placeholder="$ search --query"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-lg bg-black/60 border border-green-900 text-green-400 placeholder-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-600 transition-all font-mono"
                    />
                </div>

                <Link href="/dashboard/create">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 rounded-lg bg-green-900/70 border-2 border-green-700 text-green-300 hover:bg-green-800/70 font-semibold flex items-center gap-2 shadow-lg shadow-green-900/30 hover:shadow-green-700/50 transition-all whitespace-nowrap font-mono"
                    >
                        <Plus className="w-5 h-5" />
                        Create Automation
                    </motion.button>
                </Link>
            </motion.div>

            {/* Filters and Sort */}
            {!loading && automations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center gap-3 mb-6"
                >
                    {/* Status Filters */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-green-700 font-mono">Filter:</span>
                        {['all', 'active', 'paused', 'draft'].map((status) => (
                            <motion.button
                                key={status}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded font-mono text-xs transition-all ${filterStatus === status
                                    ? 'bg-green-900/70 border-2 border-green-700 text-green-300'
                                    : 'glass border border-green-900 text-green-700 hover:text-green-500'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </motion.button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-green-700 font-mono">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1.5 rounded glass border border-green-900 text-green-400 text-xs font-mono bg-black/60 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-600 transition-all"
                        >
                            <option value="created">Created Date</option>
                            <option value="name">Name</option>
                            <option value="lastRun">Last Run</option>
                        </select>
                    </div>

                    {/* Results count */}
                    <div className="ml-auto text-xs text-green-700 font-mono">
                        {filteredAutomations.length} / {automations.length} automations
                    </div>
                </motion.div>
            )}

            {loading && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SkeletonCard count={6} />
                </div>
            )}

            {!loading && filteredAutomations.length === 0 && !searchQuery && (
                <EmptyAutomations />
            )}

            {!loading && filteredAutomations.length === 0 && searchQuery && (
                <EmptySearchResults
                    query={searchQuery}
                    onClear={() => setSearchQuery('')}
                />
            )}

            {!loading && filteredAutomations.length > 0 && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredAutomations.map((automation) => (
                        <AutomationCard
                            key={automation.id}
                            automation={automation}
                            onToggle={handleToggle}
                            onViewResults={handleViewResults}
                            onEdit={(id) => router.push(`/dashboard/edit/${id}`)}
                            onDelete={async (id) => {
                                try {
                                    await api.deleteAutomation(id);
                                    success('Automation deleted successfully!');
                                    loadAutomations(true);
                                } catch (error) {
                                    showError('Failed to delete automation');
                                }
                            }}
                            onUpdate={() => loadAutomations(true)}
                        />
                    ))}
                </motion.div>
            )}

            {executionResult && (
                <ExecutionModal
                    execution={executionResult}
                    onClose={() => setExecutionResult(null)}
                />
            )}
        </div>
    );
}
