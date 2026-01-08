'use client';

import { motion } from 'framer-motion';
import {
    TrendingUp, Zap, CheckCircle, Clock,
    Activity, BarChart3, Calendar, Target
} from 'lucide-react';

export function DashboardAnalytics({ automations = [], executions = [] }) {
    // Calculate metrics
    const totalAutomations = automations.length;
    const activeAutomations = automations.filter(a => a.status === 'active').length;
    const pausedAutomations = automations.filter(a => a.status === 'paused').length;
    const draftAutomations = automations.filter(a => a.status === 'draft').length;

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'success').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    const successRate = totalExecutions > 0
        ? Math.round((successfulExecutions / totalExecutions) * 100)
        : 0;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentExecutions = executions.filter(e =>
        new Date(e.created_at) >= sevenDaysAgo
    );

    const stats = [
        {
            label: 'Total Automations',
            value: totalAutomations,
            icon: Zap,
            color: 'text-blue-400',
            bgColor: 'bg-blue-900/30',
            borderColor: 'border-blue-700',
            trend: '+12%',
            trendUp: true
        },
        {
            label: 'Active Now',
            value: activeAutomations,
            icon: Activity,
            color: 'text-green-400',
            bgColor: 'bg-green-900/30',
            borderColor: 'border-green-700',
            trend: `${activeAutomations}/${totalAutomations}`,
            trendUp: true
        },
        {
            label: 'Total Executions',
            value: totalExecutions,
            icon: Target,
            color: 'text-purple-400',
            bgColor: 'bg-purple-900/30',
            borderColor: 'border-purple-700',
            trend: 'All time',
            trendUp: true
        },
        {
            label: 'This Week',
            value: recentExecutions.length,
            icon: BarChart3,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-900/30',
            borderColor: 'border-emerald-700',
            trend: 'Last 7 days',
            trendUp: true
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-8"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="mb-6">
                <h2 className="text-2xl font-bold text-green-400 mb-1 font-mono">
                    {'>'} dashboard.stats()
                </h2>
                <p className="text-green-700 text-sm font-mono">
                    // Real-time automation performance metrics
                </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="glass-strong rounded-xl p-6 border border-green-900/50 hover:border-green-700/70 transition-all duration-300 cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className={`w-12 h-12 rounded-lg ${stat.bgColor} border ${stat.borderColor} flex items-center justify-center`}
                                >
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`text-xs px-2 py-1 rounded ${stat.trendUp ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'} font-mono`}
                                >
                                    {stat.trend}
                                </motion.div>
                            </div>

                            <motion.div
                                key={stat.value}
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-3xl font-bold text-white mb-1"
                            >
                                {stat.value}
                            </motion.div>
                            <p className="text-sm text-green-700 font-mono">// {stat.label}</p>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Status Distribution */}
            <motion.div
                variants={itemVariants}
                className="glass rounded-xl p-6 border border-green-900/50"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-400 font-mono">
                        {'>'} status.distribution()
                    </h3>
                    <Calendar className="w-5 h-5 text-green-600" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="text-2xl font-bold text-green-400 mb-1"
                        >
                            {activeAutomations}
                        </motion.div>
                        <p className="text-xs text-green-700 font-mono">Active</p>
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="h-2 bg-green-500/30 rounded-full mt-2 origin-left"
                        />
                    </div>

                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="text-2xl font-bold text-yellow-400 mb-1"
                        >
                            {pausedAutomations}
                        </motion.div>
                        <p className="text-xs text-green-700 font-mono">Paused</p>
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="h-2 bg-yellow-500/30 rounded-full mt-2 origin-left"
                        />
                    </div>

                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: 'spring' }}
                            className="text-2xl font-bold text-gray-400 mb-1"
                        >
                            {draftAutomations}
                        </motion.div>
                        <p className="text-xs text-green-700 font-mono">Draft</p>
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="h-2 bg-gray-500/30 rounded-full mt-2 origin-left"
                        />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
