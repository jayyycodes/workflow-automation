'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Clock, Play } from 'lucide-react';

export function ExecutionModal({ execution, onClose }) {
    if (!execution) return null;

    const isSuccess = execution.status === 'success';

    // Handle both direct steps and nested result.steps (from database)
    let steps = execution.steps || [];

    // If steps is empty but result exists, try to parse it
    if (steps.length === 0 && execution.result) {
        const result = typeof execution.result === 'string'
            ? JSON.parse(execution.result)
            : execution.result;
        steps = result.steps || [];
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="glass-strong rounded-2xl p-8 border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-auto"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            {isSuccess ? (
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            ) : (
                                <XCircle className="w-8 h-8 text-red-400" />
                            )}
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {isSuccess ? 'Execution Successful' : 'Execution Failed'}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Execution ID: {execution.execution_id || execution.executionId}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2 mb-6 text-gray-300">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Duration: {execution.duration}ms</span>
                    </div>

                    {/* Steps */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-3">Step Results:</h3>

                        {steps.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p>No step details available</p>
                            </div>
                        ) : (
                            steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass rounded-lg p-4 border border-white/10"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-emerald-400 font-semibold flex-shrink-0">
                                            {step.step || index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white mb-1">{step.type}</h4>
                                            <div className="text-sm text-gray-300 space-y-1">
                                                {step.output && typeof step.output === 'object' ? (
                                                    <div className="mt-2 space-y-1">
                                                        {Object.entries(step.output).map(([key, value]) => (
                                                            <div key={key} className="flex gap-2">
                                                                <span className="text-slate-500">{key}:</span>
                                                                <span className="text-white font-mono text-xs">
                                                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400">No output</p>
                                                )}
                                                <p className="text-xs text-slate-500 mt-2">⏱ {step.duration}ms</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Error (if any) */}
                    {execution.error && (
                        <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-red-400 font-mono">{execution.error}</p>
                        </div>
                    )}

                    {/* Close Button */}
                    <div className="mt-6 flex justify-end">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 font-semibold"
                        >
                            Close
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
