'use client';

import { Component } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full glass-strong rounded-2xl p-8 border border-red-500/20 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center"
                        >
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </motion.div>

                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-gray-400 mb-6">
                            We're sorry for the inconvenience. The application encountered an unexpected error.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="cursor-pointer text-sm text-slate-500 hover:text-gray-400 mb-2">
                                    Error Details
                                </summary>
                                <pre className="text-xs bg-black/30 p-4 rounded-lg overflow-auto max-h-32 text-red-400">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.reload()}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto shadow-lg"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Reload Page
                        </motion.button>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}
