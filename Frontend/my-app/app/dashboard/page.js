'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Zap, Loader } from 'lucide-react';
import { AutomationCard } from '@/components/features/automation-card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ExecutionModal } from '@/components/features/execution-modal';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
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

    const loadAutomations = async () => {
        try {
            setLoading(true);
            const data = await api.getAutomations();
            setAutomations(data.automations || []);
        } catch (error) {
            console.error('Failed to load automations:', error);
            showError('Failed to load automations');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id, newStatus) => {
        try {
            await api.updateAutomationStatus(id, newStatus);
            success(`Automation ${newStatus === 'active' ? 'started' : 'stopped'}!`);
            loadAutomations();
        } catch (error) {
            console.error('Failed to toggle automation:', error);
            showError('Failed to update automation status.');
        }
    };

    const handleViewResults = async (id, forceRun = false) => {
        try {
            // If forceRun, execute the automation first
            if (forceRun) {
                const result = await api.runAutomation(id);
                setExecutionResult(result);
                success('Test run completed!');
                loadAutomations();
                return;
            }

            // Otherwise, fetch execution history
            const executions = await api.getAutomationExecutions(id);
            if (executions && executions.length > 0) {
                setExecutionResult(executions[0]);
            } else {
                showError('No execution results found. Click "Test Run" to execute it manually.');
            }
        } catch (error) {
            console.error('Failed to fetch results:', error);
            showError('Failed to load execution results');
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

    const filteredAutomations = automations.filter(automation =>
        automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        automation.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

            {loading && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SkeletonCard count={6} />
                </div>
            )}

            {!loading && filteredAutomations.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-black/60 border border-green-900/50 rounded-lg font-mono"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-900/50 border-2 border-green-700 flex items-center justify-center"
                    >
                        <Zap className="w-10 h-10 text-green-500" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2 text-green-400">// No automations found</h2>
                    <p className="text-green-700 mb-6 max-w-md mx-auto text-sm">
                        {searchQuery
                            ? '// Query returned 0 results. Try different parameters.'
                            : '// Initialize your first automation. Describe workflow in natural language.'
                        }
                    </p>
                    {!searchQuery && (
                        <Link href="/dashboard/create">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 rounded-lg bg-green-900/70 border-2 border-green-700 text-green-300 hover:bg-green-800/70 font-semibold flex items-center gap-2 shadow-lg shadow-green-900/30 hover:shadow-green-700/50 transition-all mx-auto"
                            >
                                <Plus className="w-5 h-5" />
                                {'>'} create_first_automation()
                            </motion.button>
                        </Link>
                    )}
                </motion.div>
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
                            onEdit={handleEdit}
                            onDelete={handleDelete}
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
