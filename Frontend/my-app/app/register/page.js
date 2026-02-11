'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Zap, AlertCircle, Phone, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';
import { MouseGlow } from '@/components/ui/mouse-glow';

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
        if (pwd.length < 6) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
        if (pwd.length < 10) return { strength: 2, label: 'Medium', color: 'bg-yellow-500' };
        return { strength: 3, label: 'Strong', color: 'bg-green-500' };
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
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-green-500/30 selection:text-green-200">
            {/* Mouse-interactive background glow */}
            <MouseGlow />

            {/* Subtle Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="bg-green-600 p-1.5 rounded-lg group-hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20">
                            <Zap className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white group-hover:text-green-400 transition-colors">
                            SmartFlow
                        </span>
                    </Link>
                </div>

                {/* Register Card */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Top Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Create an account</h1>
                        <p className="text-gray-400 text-sm">Join the automation revolution today</p>
                    </div>

                    {validationErrors.general && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{validationErrors.general}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                            <Input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                icon={User}
                                required
                                error={validationErrors.name}
                                className="bg-[#111] border-white/5 focus:border-green-500/50 text-white placeholder:text-gray-600 h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                            <Input
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={Mail}
                                required
                                error={validationErrors.email}
                                className="bg-[#111] border-white/5 focus:border-green-500/50 text-white placeholder:text-gray-600 h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                            <Input
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={Lock}
                                required
                                error={validationErrors.password}
                                className="bg-[#111] border-white/5 focus:border-green-500/50 text-white placeholder:text-gray-600 h-11"
                            />
                            {password && (
                                <div className="mt-2 pl-1">
                                    <div className="flex gap-1 mb-1 items-center">
                                        {[1, 2, 3].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength.strength
                                                    ? passwordStrength.color
                                                    : 'bg-white/10'
                                                    }`}
                                            />
                                        ))}
                                        <span className={`text-xs font-medium ml-2 ${passwordStrength.strength === 1 ? 'text-red-500' :
                                                passwordStrength.strength === 2 ? 'text-yellow-500' :
                                                    passwordStrength.strength === 3 ? 'text-green-500' : 'text-gray-500'
                                            }`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">WhatsApp Number</label>
                            <Input
                                type="tel"
                                placeholder="+1234567890"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                icon={Phone}
                                helper="For notifications (with country code)"
                                required
                                error={validationErrors.whatsappNumber}
                                className="bg-[#111] border-white/5 focus:border-green-500/50 text-white placeholder:text-gray-600 h-11"
                            />
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer text-sm group">
                            <input
                                type="checkbox"
                                required
                                className="mt-1 w-4 h-4 rounded border-white/10 bg-[#111] text-green-600 focus:ring-green-500/20 focus:ring-offset-0 transition"
                            />
                            <span className="text-gray-400 group-hover:text-gray-300 transition">
                                I agree to the{' '}
                                <Link href="#" className="text-green-500 hover:text-green-400 font-medium">
                                    Terms of Service
                                </Link>
                                {' '}and{' '}
                                <Link href="#" className="text-green-500 hover:text-green-400 font-medium">
                                    Privacy Policy
                                </Link>
                            </span>
                        </label>

                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-500 text-white h-11 rounded-lg font-semibold shadow-lg shadow-green-900/20 hover:shadow-green-500/20 transition-all duration-300"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Creating Account...</span>
                                </div>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Create Account <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link href="/login" className="text-green-500 hover:text-green-400 font-semibold transition">
                            Log in
                        </Link>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-gray-500 hover:text-gray-300 transition text-sm flex items-center justify-center gap-2">
                        &larr; Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
