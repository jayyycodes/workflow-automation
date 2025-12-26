'use client';

import { motion } from 'framer-motion';
import { Play, Edit, Trash2, Clock, CheckCircle, XCircle, Pause, Loader } from 'lucide-react';
import { useState } from 'react';

const statusConfig = {
    active: {
        icon: CheckCircle,
        label: 'Active',
        color: 'text-green-500',
        bgColor: 'bg-green-900/30',
        borderColor: 'border-green-700'
    },
    paused: {
        icon: Pause,
        label: 'Paused',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-900/30',
        borderColor: 'border-yellow-700'
    },
    failed: {
        icon: XCircle,
        label: 'Failed',
        color: 'text-red-500',
        bgColor: 'bg-red-900/30',
        borderColor: 'border-red-700'
    }
};

export function AutomationCard({ automation, onToggle, onViewResults, onEdit, onDelete }) {
    const [isHovered, setIsHovered] = useState(false);
    const [testing, setTesting] = useState(false);
    const status = statusConfig[automation.status] || statusConfig.active;
    const StatusIcon = status.icon;
    const isActive = automation.status === 'active';

    const handleTestRun = async (e) => {
        e.stopPropagation();
        setTesting(true);
        try {
            await onViewResults?.(automation.id, true);
        } finally {
            setTesting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, scale: 1.02 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="bg-black/60 border border-green-900/50 rounded-lg p-6 transition-all duration-300 group cursor-pointer relative overflow-hidden font-mono hover:border-green-700/70"
        >
            {/* Subtle green glow on hover */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 0.05 : 0 }}
                className="absolute inset-0 bg-green-500"
            />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{automation.name}</h3>
                        <p className="text-sm text-green-700 line-clamp-2">{automation.description}</p>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded ${status.bgColor} border ${status.borderColor} ml-4`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 mb-4 text-sm text-green-800">
                    <Clock className="w-4 h-4" />
                    <span>
                        {automation.lastRun
                            ? `Last run ${new Date(automation.lastRun).toLocaleDateString()}`
                            : 'Never run'
                        }
                    </span>
                </div>

                {/* Actions - Always visible */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Start/Stop Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle?.(automation.id, isActive ? 'active' : 'paused');
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded font-medium text-sm transition ${isActive
                            ? 'bg-yellow-900/50 border border-yellow-700 text-yellow-400 hover:bg-yellow-800/50'
                            : 'bg-green-900/50 border border-green-700 text-green-400 hover:bg-green-800/50'
                            }`}
                    >
                        {isActive ? (
                            <>
                                <Pause className="w-3.5 h-3.5" />
                                Pause
                            </>
                        ) : (
                            <>
                                <Play className="w-3.5 h-3.5" />
                                Start
                            </>
                        )}
                    </motion.button>

                    {/* Test Run */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleTestRun}
                        disabled={testing}
                        className="flex items-center gap-1.5 px-4 py-2 rounded bg-blue-900/50 border border-blue-700 text-blue-400 hover:bg-blue-800/50 font-medium text-sm transition disabled:opacity-50"
                    >
                        {testing ? (
                            <>
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Play className="w-3.5 h-3.5" />
                                Test Run
                            </>
                        )}
                    </motion.button>

                    {/* View Results */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewResults?.(automation.id, false);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded bg-gray-900/50 border border-gray-700 text-gray-400 hover:bg-gray-800/50 font-medium text-sm transition"
                    >
                        <Clock className="w-3.5 h-3.5" />
                        Results
                    </motion.button>

                    {/* Edit */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(automation.id);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded bg-black/50 border border-green-900 text-green-600 hover:bg-green-950/50 hover:border-green-700 font-medium text-sm transition"
                    >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                    </motion.button>

                    {/* Delete */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this automation?')) {
                                onDelete?.(automation.id);
                            }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded bg-red-950/50 border border-red-800 text-red-500 hover:bg-red-900/50 font-medium text-sm transition"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
