'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Terminal, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-green-400 flex items-center justify-center p-6 relative overflow-hidden font-mono">
            {/* Matrix Background */}
            <div className="fixed inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-900/30 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-950/30 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Scanline Effect */}
            <div className="fixed inset-0 pointer-events-none opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_50%,rgba(34,197,94,0.03)_50%)] bg-[length:100%_4px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="flex items-center justify-center gap-2 mb-8"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    >
                        <Terminal className="w-10 h-10 text-green-500" />
                    </motion.div>
                    <span className="text-2xl font-bold text-green-500 tracking-wider">
                        [AUTH_SYSTEM]
                    </span>
                </motion.div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-black/60 border border-green-800 rounded p-8 shadow-2xl shadow-green-900/30"
                >
                    <h1 className="text-3xl font-bold mb-2 text-green-400">{'>'} user.login()</h1>
                    <p className="text-green-700 mb-8 text-sm">// Authenticate to access system</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-6 p-4 rounded bg-red-900/20 border border-red-800 flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-500">{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="$ email"
                            type="email"
                            placeholder="user@system.net"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={Mail}
                            required
                        />

                        <Input
                            label="$ password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={Lock}
                            required
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-green-800 bg-black" />
                                <span className="text-green-700">remember_session</span>
                            </label>
                            <a href="#" className="text-green-600 hover:text-green-400 transition">
                                forgot_pwd?
                            </a>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-green-900/70 border-2 border-green-700 text-green-300 hover:bg-green-800/70 shadow-lg shadow-green-900/30"
                            disabled={loading}
                        >
                            {loading ? (
                                '// authenticating...'
                            ) : (
                                <>
                                    {'>'} authenticate <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-green-700">
                        // No account?{' '}
                        <Link href="/register" className="text-green-500 hover:text-green-300 font-semibold transition">
                            create_user()
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-center"
                >
                    <Link href="/" className="text-green-700 hover:text-green-500 transition text-sm">
                        {'<'} return_home
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
