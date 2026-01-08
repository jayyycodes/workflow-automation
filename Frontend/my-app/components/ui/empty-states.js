'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Sparkles, Zap, Terminal, Rocket,
    Coffee, Code, Target, TrendingUp
} from 'lucide-react';

export function EmptyAutomations() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 px-6 font-mono"
        >
            {/* Animated Icon */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2
                }}
                className="relative w-32 h-32 mx-auto mb-8"
            >
                {/* Outer glow ring */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                    className="absolute inset-0 rounded-full bg-green-500/20 blur-xl"
                />

                {/* Icon container */}
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-900/50 to-green-950/50 border-2 border-green-700 flex items-center justify-center backdrop-blur-sm">
                    <motion.div
                        animate={{
                            rotate: [0, 5, -5, 0],
                            y: [0, -5, 0]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    >
                        <Terminal className="w-16 h-16 text-green-400" />
                    </motion.div>
                </div>

                {/* Floating sparkles */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: [0, (i - 1) * 30],
                            y: [0, -20 - i * 10]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4
                        }}
                        className="absolute top-1/2 left-1/2"
                    >
                        <Sparkles className="w-4 h-4 text-green-400" />
                    </motion.div>
                ))}
            </motion.div>

            {/* Title */}
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold mb-3 text-green-400"
            >
                {'>'} automation.init()
            </motion.h2>

            {/* Description */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-green-700 mb-8 max-w-md mx-auto text-sm leading-relaxed"
            >
                // No automations detected in current workspace.
                <br />
                // Initialize first workflow by describing task in natural language.
            </motion.p>

            {/* CTA Button */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Link href="/dashboard/create">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 rounded-lg bg-green-900/70 border-2 border-green-700 text-green-300 hover:bg-green-800/70 font-semibold flex items-center gap-2 shadow-lg shadow-green-900/30 hover:shadow-green-700/50 transition-all mx-auto group"
                    >
                        <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        {'>'} create_first_automation()
                        <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            →
                        </motion.div>
                    </motion.button>
                </Link>
            </motion.div>

            {/* Example prompts */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 max-w-2xl mx-auto"
            >
                <p className="text-xs text-green-800 mb-4">// Example workflows to get started:</p>
                <div className="grid md:grid-cols-3 gap-3">
                    {[
                        { icon: TrendingUp, text: 'Track stock prices' },
                        { icon: Coffee, text: 'Daily email digest' },
                        { icon: Target, text: 'Monitor webhooks' }
                    ].map((example, i) => {
                        const Icon = example.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + i * 0.1 }}
                                whileHover={{ y: -2, scale: 1.02 }}
                                className="glass rounded-lg p-3 border border-green-900/50 hover:border-green-700/70 transition-all cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span className="text-xs text-green-600">{example.text}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
}

export function EmptySearchResults({ query, onClear }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-6 font-mono"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-900/30 border-2 border-red-700 flex items-center justify-center"
            >
                <Code className="w-10 h-10 text-red-500" />
            </motion.div>

            <h3 className="text-xl font-bold mb-2 text-green-400">
                {'>'} search.error("no_results")
            </h3>
            <p className="text-green-700 mb-6 text-sm">
                // Query "{query}" returned 0 matches
            </p>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClear}
                className="px-6 py-2 rounded-lg glass border border-green-700 text-green-400 hover:bg-green-900/30 transition-all"
            >
                Clear Search
            </motion.button>
        </motion.div>
    );
}

export function SuccessCelebration({ message, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm font-mono"
            onClick={onClose}
        >
            {/* Confetti effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: '50%',
                            y: '50%',
                            opacity: 1
                        }}
                        animate={{
                            x: `${Math.random() * 100}%`,
                            y: `${Math.random() * 100}%`,
                            opacity: 0,
                            rotate: Math.random() * 360
                        }}
                        transition={{
                            duration: 1.5,
                            delay: i * 0.05
                        }}
                        className="absolute w-3 h-3 rounded-full"
                        style={{
                            backgroundColor: ['#22c55e', '#10b981', '#84cc16', '#eab308'][i % 4]
                        }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="relative glass-strong rounded-2xl p-12 border-2 border-green-500 text-center max-w-md"
            >
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360]
                    }}
                    transition={{ duration: 0.6 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center"
                >
                    <Rocket className="w-12 h-12 text-green-400" />
                </motion.div>

                <h2 className="text-3xl font-bold mb-3 text-green-400">
                    Success!
                </h2>
                <p className="text-green-600 mb-6">{message}</p>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-6 py-3 rounded-lg bg-green-900/70 border-2 border-green-700 text-green-300 font-semibold"
                >
                    Continue
                </motion.button>
            </motion.div>
        </motion.div>
    );
}
