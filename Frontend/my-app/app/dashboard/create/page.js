'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Loader, Send, Zap, ArrowRight,
    CheckCircle, AlertCircle, Code, Eye, Save
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AIThinkingLoader, ProgressBar } from '@/components/ui/loading-states';
import api from '@/lib/api';

export default function CreateAutomationPage() {
    const [description, setDescription] = useState('');
    const [generatedAutomation, setGeneratedAutomation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState('input'); // 'input', 'preview', 'saving'
    const [progress, setProgress] = useState(0);
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { success, error: showError } = useToast();
    const router = useRouter();

    // Handle authentication redirect
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    // Show loading while checking auth
    if (authLoading) {
        return null;
    }

    // Don't render if not authenticated (will redirect)
    if (!isAuthenticated) {
        return null;
    }

    const handleGenerate = async () => {
        if (!description.trim()) {
            setError('Please describe what you want to automate');
            return;
        }

        setError('');
        setLoading(true);
        setProgress(0);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 300);

            const result = await api.generateAutomation(description);

            clearInterval(progressInterval);
            setProgress(100);

            console.log('AI Response:', result);
            console.log('Steps:', result.steps);
            console.log('Automation object:', result.automation);

            // Handle both result.automation and direct result
            const automation = result.automation || result;
            setGeneratedAutomation(automation);
            setStep('preview');
        } catch (err) {
            console.error('Generation failed:', err);
            setError(err.message || 'Failed to generate automation. Please try again.');
            setProgress(0);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Ensure automation has ALL required fields matching backend validation
        const automationToSave = {
            // Required: name (string, non-empty)
            name: generatedAutomation.name && generatedAutomation.name !== 'Untitled Automation'
                ? generatedAutomation.name
                : description.slice(0, 50) + (description.length > 50 ? '...' : ''),

            // Required: description (string)
            description: generatedAutomation.description || description,

            // Required: trigger (object with type and config)
            trigger: generatedAutomation.trigger && typeof generatedAutomation.trigger === 'object'
                ? generatedAutomation.trigger
                : {
                    type: 'interval',
                    config: { every: '5m' }
                },

            // Required: steps (non-empty array)
            steps: Array.isArray(generatedAutomation.steps) && generatedAutomation.steps.length > 0
                ? generatedAutomation.steps
                : [
                    {
                        type: 'placeholder',
                        action: 'This automation needs proper steps configuration',
                        description: 'Please edit the automation to add proper workflow steps'
                    }
                ],

            // Optional: status (defaults to 'draft' on backend if not provided)
            // REMOVED - let backend handle status defaulting
        };

        setLoading(true);
        setStep('saving');

        try {
            await api.createAutomation(automationToSave);
            router.push('/dashboard');
        } catch (err) {
            console.error('Save failed:', err);
            setError(err.message || 'Failed to save automation. Please try again.');
            setStep('preview');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setDescription('');
        setGeneratedAutomation(null);
        setError('');
        setStep('input');
    };

    const examplePrompts = [
        "Send me an email every morning with stock prices for AAPL and GOOGL",
        "Email me [Your_github_username] GitHub stars summary every Monday",
        "Track Apple stock and sms if it drops below $150.",
        "Notify me with weather updates of Mumbai everyday at 9AM"
    ];

    return (
        <div className="max-w-4xl mx-auto font-mono">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold mb-2 text-green-400">{'>'} automation.create()</h1>
                <p className="text-green-700 text-sm">// Describe your workflow in natural language</p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column - Input */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="glass-strong rounded-2xl p-8 border border-white/10">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-bold">Describe Your Automation</h2>
                        </div>

                        {/* AI Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-300 mb-3">
                                What do you want to automate?
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Example: Send me an email every day at 9 AM with the weather forecast..."
                                className="w-full h-40 px-4 py-3 rounded-lg glass border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-emerald-500/50 transition-all resize-none"
                                disabled={loading || step !== 'input'}
                            />
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400">{error}</p>
                                </motion.div>
                            )}
                        </div>

                        {/* Example Prompts */}
                        {step === 'input' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-6"
                            >
                                <p className="text-sm text-gray-400 mb-3">Try one of these examples:</p>
                                <div className="space-y-2">
                                    {examplePrompts.map((prompt, i) => (
                                        <motion.button
                                            key={i}
                                            whileHover={{ scale: 1.02, x: 5 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setDescription(prompt)}
                                            className="w-full text-left px-4 py-3 rounded-lg glass border border-white/10 hover:border-emerald-500/30 text-sm text-gray-300 hover:text-white transition-all"
                                        >
                                            <div className="flex items-start gap-2">
                                                <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                                <span>{prompt}</span>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {step === 'input' && (
                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading || !description.trim()}
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            Generate Automation
                                        </>
                                    )}
                                </Button>
                            )}

                            {step === 'preview' && (
                                <>
                                    <Button onClick={handleReset} variant="secondary" className="flex-1">
                                        Start Over
                                    </Button>
                                    <Button onClick={handleSave} disabled={loading} className="flex-1">
                                        {loading ? (
                                            <>
                                                <Loader className="w-5 h-5 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5 mr-2" />
                                                Save Automation
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Progress indicator during loading */}
                        {loading && step === 'input' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4"
                            >
                                <ProgressBar
                                    progress={progress}
                                    steps={['Analyzing', 'Generating', 'Optimizing']}
                                    currentStep={Math.floor(progress / 33)}
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* Tips */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 glass rounded-xl p-6 border border-white/10"
                    >
                        <h3 className="text-sm font-semibold text-emerald-400 mb-3">💡 Tips for better results</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <span>Be specific about timing (e.g., "every day at 9 AM")</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <span>Mention the data source and destination</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <span>Include conditions or filters if needed</span>
                            </li>
                        </ul>
                    </motion.div>
                </motion.div>

                {/* Right Column - Preview */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:sticky lg:top-8"
                >
                    <AnimatePresence mode="wait">
                        {generatedAutomation ? (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-strong rounded-2xl p-8 border border-white/10"
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <Eye className="w-6 h-6 text-purple-400" />
                                    <h2 className="text-2xl font-bold">Preview</h2>
                                </div>

                                {/* Automation Details */}
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-400 mb-1 block">Name</label>
                                        <p className="text-lg font-semibold text-white">{generatedAutomation.name || 'Untitled Automation'}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-400 mb-1 block">Description</label>
                                        <p className="text-gray-300">{generatedAutomation.description || description}</p>
                                    </div>

                                    {generatedAutomation.schedule && (
                                        <div>
                                            <label className="text-sm font-semibold text-gray-400 mb-1 block">Schedule</label>
                                            <p className="text-gray-300">{generatedAutomation.schedule}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Workflow Steps */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-400 mb-3 block">Workflow Steps</label>
                                    <div className="space-y-3">
                                        {generatedAutomation.steps?.map((step, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="glass rounded-lg p-4 border border-white/10"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-emerald-400 font-semibold flex-shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-white mb-1">{step.type}</h4>
                                                        <p className="text-sm text-gray-400">{step.description || 'No description'}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* JSON View (Collapsible) */}
                                <details className="mt-6">
                                    <summary className="cursor-pointer text-sm font-semibold text-gray-400 hover:text-white transition flex items-center gap-2">
                                        <Code className="w-4 h-4" />
                                        View JSON
                                    </summary>
                                    <pre className="mt-3 p-4 rounded-lg bg-black/30 border border-white/10 text-xs text-gray-300 overflow-auto max-h-64">
                                        {JSON.stringify(generatedAutomation, null, 2)}
                                    </pre>
                                </details>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="glass-strong rounded-2xl p-12 border border-white/10 text-center"
                            >
                                <motion.div
                                    animate={{
                                        scale: [1, 1.05, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center"
                                >
                                    <Sparkles className="w-10 h-10 text-white" />
                                </motion.div>
                                <h3 className="text-xl font-semibold mb-2">AI is Ready</h3>
                                <p className="text-gray-400">
                                    Describe your automation and click "Generate" to see the magic happen
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
