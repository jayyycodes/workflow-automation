'use client';

import { motion } from 'framer-motion';

export function SkeletonCard({ count = 1 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass rounded-xl p-6 border border-white/10"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="h-6 w-3/4 bg-slate-700/50 rounded animate-pulse mb-2" />
                            <div className="h-4 w-full bg-slate-700/30 rounded animate-pulse" />
                        </div>
                        <div className="h-8 w-20 bg-slate-700/50 rounded-full animate-pulse ml-4" />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-4 w-32 bg-slate-700/30 rounded animate-pulse" />
                    </div>

                    {/* Actions (hidden on skeleton) */}
                    <div className="flex gap-2">
                        <div className="h-9 w-20 bg-slate-700/30 rounded animate-pulse" />
                        <div className="h-9 w-20 bg-slate-700/30 rounded animate-pulse" />
                        <div className="h-9 w-20 bg-slate-700/30 rounded animate-pulse" />
                    </div>
                </motion.div>
            ))}
        </>
    );
}

export function SkeletonList({ count = 5 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-lg p-4 border border-white/10"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700/50 animate-pulse flex-shrink-0" />
                        <div className="flex-1">
                            <div className="h-5 w-1/3 bg-slate-700/50 rounded animate-pulse mb-2" />
                            <div className="h-4 w-2/3 bg-slate-700/30 rounded animate-pulse" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export function SkeletonText({ lines = 3, className = '' }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-slate-700/30 rounded animate-pulse"
                    style={{ width: `${100 - i * 10}%` }}
                />
            ))}
        </div>
    );
}

export function SkeletonWorkflowStep({ count = 3 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass rounded-lg p-4 border border-white/10"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700/50 animate-pulse flex-shrink-0" />
                        <div className="flex-1">
                            <div className="h-5 w-1/2 bg-slate-700/50 rounded animate-pulse mb-2" />
                            <div className="h-4 w-full bg-slate-700/30 rounded animate-pulse" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
