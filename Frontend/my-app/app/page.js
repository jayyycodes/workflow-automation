'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  ArrowRight, Zap, Brain, GitBranch, Clock, Mail, Database, Bot,
  CheckCircle, Code, Workflow, Bell, TrendingUp, Briefcase, Users, Sparkles, Terminal,
  LayoutDashboard, Activity, Loader2
} from 'lucide-react';
import { MouseGlow } from '@/components/ui/mouse-glow';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => setMounted(true), []);

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
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
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans selection:bg-green-500/30 selection:text-green-200">
      {/* Mouse-interactive background glow */}
      <MouseGlow />

      {/* Subtle Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="fixed w-full z-50 top-0 backdrop-blur-md border-b border-white/5 bg-black/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-green-600 p-1.5 rounded-lg group-hover:bg-green-500 transition-colors">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-green-400 transition-colors">
                SmartFlow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition font-medium text-sm">Features</a>
              <a href="#how-it-works" className="text-gray-400 hover:text-white transition font-medium text-sm">How it Works</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition font-medium text-sm">Pricing</a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-300 hover:text-white transition font-medium text-sm uppercase tracking-wider"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-lg shadow-green-900/20 hover:shadow-green-500/30 uppercase tracking-wide"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-5xl mx-auto"
          >
            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Workflow Automation</span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-6xl md:text-7xl font-sans font-extrabold tracking-tight mb-8 leading-[1.1]"
            >
              AUTOMATE FASTER
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                THAN YOU CAN THINK
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Build powerful workflows with AI. Connect your favorite tools, schedule tasks, and save hours every week.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-4 mb-20"
            >
              <Link
                href="/register"
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-green-900/20 hover:shadow-green-500/40 flex items-center gap-2"
              >
                Start Automating Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#demo"
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-full font-semibold text-lg transition-all backdrop-blur-sm"
              >
                View Demo
              </Link>
            </motion.div>

            {/* Dashboard Preview UI */}
            <motion.div
              variants={itemVariants}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative max-w-5xl mx-auto"
            >
              {/* Glow Effect behind Dashboard */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur-lg opacity-20 pointer-events-none" />

              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
                {/* Dashboard Header */}
                <div className="border-b border-white/10 p-4 flex items-center justify-between bg-black/40 backdrop-blur-sm">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-600/20 p-1.5 rounded-lg">
                        <Zap className="w-4 h-4 text-green-500 fill-green-500" />
                      </div>
                      <span className="font-bold text-white">SmartFlow</span>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm text-gray-400 font-medium">
                      <div className="text-white px-3 py-1 bg-white/5 rounded-md cursor-pointer hover:bg-white/10 transition">+ New Workflow</div>
                      <div className="text-green-500 flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</div>
                      <div className="hover:text-white cursor-pointer transition flex items-center gap-2"><Activity className="w-4 h-4" /> My Automations</div>
                      <div className="hover:text-white cursor-pointer transition">Security</div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-8 grid md:grid-cols-3 gap-6 bg-[#0c0c0c]">
                  {/* Overview Section */}
                  <div className="col-span-3 mb-4">
                    <h3 className="text-xl font-bold text-white mb-1">Overview</h3>
                    <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      System Operational
                    </div>
                  </div>

                  {/* Stat Cards */}
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-green-500/30 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 text-green-500/20 group-hover:text-green-500/40 transition-colors">
                      <Zap className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Zap className="w-5 h-5" /></div>
                      <span className="text-xs font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">+12%</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">1,284</div>
                    <div className="text-sm text-gray-400">Total Executions</div>
                  </div>

                  <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-green-500/30 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 text-green-500/20 group-hover:text-green-500/40 transition-colors">
                      <Activity className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Activity className="w-5 h-5" /></div>
                      <span className="text-xs font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">+0.2%</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                    <div className="text-sm text-gray-400">Success Rate</div>
                  </div>

                  <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-green-500/30 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 text-green-500/20 group-hover:text-green-500/40 transition-colors">
                      <Clock className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Clock className="w-5 h-5" /></div>
                      <span className="text-xs font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">-15ms</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">340ms</div>
                    <div className="text-sm text-gray-400">Avg Duration</div>
                  </div>

                  {/* Recent Workflows */}
                  <div className="col-span-3 mt-4">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Workflows</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-[#111] p-5 rounded-xl border border-white/5 flex items-center justify-between group hover:border-green-500/30 transition-all">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="font-bold text-white">Daily Stock Analysis</span>
                          </div>
                          <p className="text-xs text-gray-500">Fetch AAPL close price, analyze with Gemini...</p>
                        </div>
                        <div className="text-green-500 text-xs font-bold bg-green-900/20 px-3 py-1 rounded-full flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Running
                        </div>
                      </div>

                      <div className="bg-[#111] p-5 rounded-xl border border-white/5 flex items-center justify-between group hover:border-green-500/30 transition-all">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="font-bold text-white">New Lead Enrichment</span>
                          </div>
                          <p className="text-xs text-gray-500">Enrich email from webhook using Clearbit...</p>
                        </div>
                        <div className="text-gray-500 text-xs font-bold bg-white/5 px-3 py-1 rounded-full flex items-center gap-1">
                          paused
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything you need to <span className="text-white">scale</span></h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful primitives for any automation workflow. Built for developers and humans alike.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: "Natural Language",
                description: "Describe your intent in plain English. Our AI engine translates it into executable code."
              },
              {
                icon: <GitBranch className="w-6 h-6" />,
                title: "Visual Builder",
                description: "Visualize your logic with our graph-based editor. Drag, drop, and connect nodes."
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Smart Scheduling",
                description: "Run cron jobs, set intervals, or trigger based on external webhooks."
              },
              {
                icon: <Database className="w-6 h-6" />,
                title: "Integrations",
                description: "Connect with Postgres, Firebase, Airtable, and any REST API effortlessly."
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Enterprise Secure",
                description: "Your data is encrypted. Execution runs in isolated sandboxes for maximum security."
              },
              {
                icon: <LayoutDashboard className="w-6 h-6" />,
                title: "Instant Deploy",
                description: "One click to production. We handle the infrastructure, scaling, and monitoring."
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-[#111] p-8 rounded-2xl border border-white/5 hover:border-green-500/20 transition-all group"
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-1 rounded-md">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">SmartFlow</span>
          </div>

          <div className="flex gap-8 text-sm text-gray-500 font-medium">
            <a href="#" className="hover:text-white transition">Features</a>
            <a href="#" className="hover:text-white transition">How it Works</a>
            <a href="#" className="hover:text-white transition">Pricing</a>
          </div>

          <div className="flex gap-6">
            <a href="#" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-500 transition">Log In</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm font-medium py-2">Get Started</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
