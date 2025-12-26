'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Terminal, AlertCircle, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const getPasswordStrength = (pwd) => {
        if (!pwd) return { strength: 0, label: '', color: '' };
        if (pwd.length < 6) return { strength: 1, label: '[WEAK]', color: 'bg-red-800' };
        if (pwd.length < 10) return { strength: 2, label: '[MEDIUM]', color: 'bg-yellow-800' };
        return { strength: 3, label: '[STRONG]', color: 'bg-green-800' };
    };

    const passwordStrength = getPasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setValidationErrors({});

        try {
            const errors = {};
            if (!name.trim()) errors.name = 'Name is required';
            if (!email.trim()) errors.email = 'Email is required';
            if (!password) errors.password = 'Password is required';
            if (!whatsappNumber.trim()) errors.whatsappNumber = 'Phone number is required for notifications';

            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (email && !emailRegex.test(email)) {
                errors.email = 'Please enter a valid email address';
            }

            const fakeDomains = ['test.com', 'example.com', 'fake.com', 'temp.com'];
            const emailDomain = email.split('@')[1]?.toLowerCase();
            if (fakeDomains.includes(emailDomain)) {
                errors.email = 'Please use a real email address';
            }

            if (whatsappNumber) {
                const phoneRegex = /^\+?[1-9]\d{1,14}$/;
                if (!phoneRegex.test(whatsappNumber.replace(/\s/g, ''))) {
                    errors.whatsappNumber = 'Use international format with country code (e.g., +919876543210)';
                }
            }

            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                setIsLoading(false);
                return;
            }

            await register(name, email, password, whatsappNumber || null);
            router.push('/dashboard');
        } catch (err) {
            setValidationErrors({ general: err.message || 'Registration failed. Please try again.' });
        } finally {
            setIsLoading(false);
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
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="flex items-center justify-center gap-2 mb-8"
                >
                    <Terminal className="w-10 h-10 text-green-500" />
                    <span className="text-2xl font-bold text-green-500 tracking-wider">
                        [USER_INIT]
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-black/60 border border-green-800 rounded p-8 shadow-2xl shadow-green-900/30"
                >
                    <h1 className="text-3xl font-bold mb-2 text-green-400">{'>'} create_account()</h1>
                    <p className="text-green-700 mb-8 text-sm">// Initialize new user credentials</p>

                    {validationErrors.general && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-6 p-4 rounded bg-red-900/20 border border-red-800 flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-500">{validationErrors.general}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="$ username"
                            type="text"
                            placeholder="john_doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            icon={User}
                            required
                            error={validationErrors.name}
                        />

                        <Input
                            label="$ email"
                            type="email"
                            placeholder="user@system.net"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={Mail}
                            required
                            error={validationErrors.email}
                        />

                        <div>
                            <Input
                                label="$ password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={Lock}
                                required
                                error={validationErrors.password}
                            />
                            {password && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 flex-1 rounded ${level <= passwordStrength.strength
                                                        ? passwordStrength.color
                                                        : 'bg-gray-800'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-green-700">{passwordStrength.label}</p>
                                </div>
                            )}
                        </div>

                        <Input
                            label="$ phone (Required for Notifications)"
                            type="tel"
                            placeholder="+91987XXXXX0"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            icon={Phone}
                            helper="Used for WhatsApp & SMS notifications (with country code)"
                            required
                            error={validationErrors.whatsappNumber}
                        />

                        <label className="flex items-start gap-3 cursor-pointer text-sm">
                            <input
                                type="checkbox"
                                required
                                className="mt-1 rounded border-green-800 bg-black"
                            />
                            <span className="text-green-700">
                                // I agree to the{' '}
                                <a href="#" className="text-green-500 hover:text-green-300 underline">
                                    Terms of Service
                                </a>
                            </span>
                        </label>

                        <Button
                            type="submit"
                            className="w-full bg-green-900/70 border-2 border-green-700 text-green-300 hover:bg-green-800/70 shadow-lg shadow-green-900/30"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                '// initializing...'
                            ) : (
                                <>
                                    {'>'} register_user <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-green-700">
                        // Already registered?{' '}
                        <Link href="/login" className="text-green-500 hover:text-green-300 font-semibold transition">
                            login()
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
