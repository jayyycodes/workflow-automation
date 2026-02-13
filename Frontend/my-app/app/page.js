'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  ArrowRight, Zap, Brain, GitBranch, Clock, Mail, Database, Bot,
  CheckCircle, Code, Workflow, Bell, TrendingUp, Briefcase, Users, Sparkles, Terminal,
  LayoutDashboard, Activity, Loader2, Shield, Plug, Cpu, Layers, Server, Globe
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
              <a href="#mcp" className="text-gray-400 hover:text-white transition font-medium text-sm">MCP Server</a>
              <a href="#architecture" className="text-gray-400 hover:text-white transition font-medium text-sm">Architecture</a>
              <a href="#tools" className="text-gray-400 hover:text-white transition font-medium text-sm">Tools</a>
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
            <motion.div variants={itemVariants} className="flex justify-center gap-3 mb-8 flex-wrap">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Automation</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium">
                <Plug className="w-4 h-4" />
                <span>MCP Compatible</span>
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
              Build powerful workflows with AI. 25 tools, MCP server, and a self-healing engine that turns plain English into production automations.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-4 mb-20 flex-wrap"
            >
              <Link
                href="/register"
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-green-900/20 hover:shadow-green-500/40 flex items-center gap-2"
              >
                Start Automating Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#mcp"
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-full font-semibold text-lg transition-all backdrop-blur-sm flex items-center gap-2"
              >
                <Plug className="w-5 h-5" /> Explore MCP
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
                      <div className="hover:text-white cursor-pointer transition flex items-center gap-2"><Plug className="w-4 h-4" /> MCP</div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-8 grid md:grid-cols-3 gap-6 bg-[#0c0c0c]">
                  {/* Overview Section */}
                  <div className="col-span-3 mb-4">
                    <h3 className="text-xl font-bold text-white mb-1">Overview</h3>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <span className="flex items-center gap-2 text-green-500">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Operational
                      </span>
                      <span className="flex items-center gap-2 text-purple-400">
                        <Plug className="w-3.5 h-3.5" />
                        MCP: 17 tools live
                      </span>
                    </div>
                  </div>

                  {/* Stat Cards */}
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-green-500/30 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 text-green-500/20 group-hover:text-green-500/40 transition-colors">
                      <Layers className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Layers className="w-5 h-5" /></div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">25</div>
                    <div className="text-sm text-gray-400">Registered Tools</div>
                  </div>

                  <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 text-purple-500/20 group-hover:text-purple-500/40 transition-colors">
                      <Plug className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Plug className="w-5 h-5" /></div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">17</div>
                    <div className="text-sm text-gray-400">MCP-Exposed Tools</div>
                  </div>

                  <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-green-500/30 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 text-green-500/20 group-hover:text-green-500/40 transition-colors">
                      <Activity className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Activity className="w-5 h-5" /></div>
                      <span className="text-xs font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">99.9%</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">340ms</div>
                    <div className="text-sm text-gray-400">Avg Execution Time</div>
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
                          <p className="text-xs text-gray-500">fetch_stock_price → send_email</p>
                        </div>
                        <div className="text-green-500 text-xs font-bold bg-green-900/20 px-3 py-1 rounded-full flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Running
                        </div>
                      </div>

                      <div className="bg-[#111] p-5 rounded-xl border border-white/5 flex items-center justify-between group hover:border-purple-500/30 transition-all">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                            <span className="font-bold text-white">MCP: Weather Monitor</span>
                          </div>
                          <p className="text-xs text-gray-500">fetch_weather → condition → send_sms</p>
                        </div>
                        <div className="text-purple-400 text-xs font-bold bg-purple-900/20 px-3 py-1 rounded-full flex items-center gap-1">
                          <Plug className="w-3 h-3" /> MCP Active
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
              25 tools, MCP protocol, self-healing AI, and production-grade architecture.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: "Natural Language AI",
                description: "Describe your intent in plain English. Google Gemini translates it into executable workflows with auto-retry."
              },
              {
                icon: <Plug className="w-6 h-6" />,
                title: "MCP Server",
                description: "Full Model Context Protocol support. 17 tools discoverable by Claude Desktop, Cursor, and any MCP client.",
                highlight: true
              },
              {
                icon: <Layers className="w-6 h-6" />,
                title: "25 Tool Registry",
                description: "Centralized registry with JSON Schema definitions. 7 categories: data, scraping, transform, notification, and more.",
                highlight: true
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Self-Healing Engine",
                description: "Workflow validator catches errors before execution. AI auto-fixes malformed steps and retries intelligently."
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Smart Scheduling",
                description: "Run cron jobs, set intervals, or trigger from webhooks. Full execution history in Firebase."
              },
              {
                icon: <Cpu className="w-6 h-6" />,
                title: "Context Memory",
                description: "Pass data between workflow steps automatically. Every execution is logged with state transitions."
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className={`bg-[#111] p-8 rounded-2xl border transition-all group ${feature.highlight
                    ? 'border-purple-500/20 hover:border-purple-500/40'
                    : 'border-white/5 hover:border-green-500/20'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.highlight
                    ? 'bg-purple-500/10 text-purple-500'
                    : 'bg-green-500/10 text-green-500'
                  }`}>
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

      {/* MCP Server Section */}
      <section id="mcp" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
              <Plug className="w-4 h-4" />
              <span>Model Context Protocol</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              MCP Server <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-600">Built In</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Any MCP client can discover and execute all 17 tools via standard protocol. Zero integration code needed.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* MCP Code Demo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#0A0A0A] rounded-2xl border border-purple-500/20 overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 bg-black/60 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                </div>
                <span className="text-xs text-gray-500 ml-2 font-mono">MCP Request</span>
              </div>
              <div className="p-6 font-mono text-sm leading-relaxed">
                <div className="text-gray-500">{'// Discover all tools'}</div>
                <div className="text-purple-400">POST <span className="text-white">/mcp</span></div>
                <div className="mt-2 text-gray-300">{'{'}</div>
                <div className="text-green-400 ml-4">{'"method"'}: <span className="text-yellow-300">{'"tools/list"'}</span></div>
                <div className="text-gray-300">{'}'}</div>
                <div className="mt-4 text-gray-500">{'// Execute a tool'}</div>
                <div className="text-purple-400">POST <span className="text-white">/mcp</span></div>
                <div className="mt-2 text-gray-300">{'{'}</div>
                <div className="text-green-400 ml-4">{'"method"'}: <span className="text-yellow-300">{'"tools/call"'}</span>,</div>
                <div className="text-green-400 ml-4">{'"params"'}: {'{'}</div>
                <div className="text-green-400 ml-8">{'"name"'}: <span className="text-yellow-300">{'"fetch_weather"'}</span>,</div>
                <div className="text-green-400 ml-8">{'"arguments"'}: {'{'} <span className="text-yellow-300">{'"city": "Mumbai"'}</span> {'}'}</div>
                <div className="text-green-400 ml-4">{'}'}</div>
                <div className="text-gray-300">{'}'}</div>
              </div>
            </motion.div>

            {/* MCP Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col gap-5"
            >
              {[
                {
                  icon: <Globe className="w-5 h-5" />,
                  title: "Streamable HTTP Transport",
                  desc: "Standard MCP protocol over HTTP POST. Stateless mode — optimized for cloud deployment."
                },
                {
                  icon: <Layers className="w-5 h-5" />,
                  title: "17 Tools with JSON Schema",
                  desc: "Every tool has full parameter schemas. Clients auto-discover capabilities — no manual config."
                },
                {
                  icon: <Cpu className="w-5 h-5" />,
                  title: "Context Memory & Logging",
                  desc: "Each MCP tool call gets execution ID, state tracking, and Firebase persistence."
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: "25s Timeout Protection",
                  desc: "Render-compatible request timeout with graceful error handling."
                },
              ].map((item, i) => (
                <div key={i} className="bg-[#111] p-5 rounded-xl border border-white/5 hover:border-purple-500/20 transition-all flex gap-4 items-start">
                  <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-32 relative bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Production-Grade <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Architecture</span></h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Three-layer system: AI engine, workflow executor, and MCP server — all working together.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {/* Layer 1: AI Engine */}
            <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-green-500/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-green-500/10 rounded-lg text-green-500">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">AI Engine</h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Google Gemini + OpenRouter</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> NL → JSON workflows</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Auto-retry with fallback</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Self-healing validation</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Context-aware clarification</li>
              </ul>
            </div>

            {/* Layer 2: Workflow Engine */}
            <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
                  <Workflow className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Workflow Engine</h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0" /> 25 tools in 7 categories</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0" /> Sequential step execution</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0" /> Context Memory passing</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0" /> Firebase state logging</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0" /> Cron scheduling</li>
              </ul>
            </div>

            {/* Layer 3: MCP Server */}
            <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-purple-500/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-violet-600"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-500">
                  <Plug className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">MCP Server</h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500 shrink-0" /> Streamable HTTP transport</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500 shrink-0" /> 17 MCP-exposed tools</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500 shrink-0" /> JSON-RPC protocol</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500 shrink-0" /> Pre-warmed tool cache</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500 shrink-0" /> Render-ready (stateless)</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">25 Tools, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">7 Categories</span></h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Every tool is MCP-ready with full JSON Schema definitions for automatic discovery.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 max-w-5xl mx-auto">
            {[
              { label: "Data Fetch", count: 4, color: "green", icon: <TrendingUp className="w-5 h-5" /> },
              { label: "Scraping", count: 3, color: "blue", icon: <Globe className="w-5 h-5" /> },
              { label: "Transform", count: 3, color: "cyan", icon: <Code className="w-5 h-5" /> },
              { label: "Notify", count: 5, color: "yellow", icon: <Bell className="w-5 h-5" /> },
              { label: "Action", count: 4, color: "orange", icon: <Zap className="w-5 h-5" /> },
              { label: "Control", count: 4, color: "purple", icon: <GitBranch className="w-5 h-5" /> },
              { label: "AI", count: 2, color: "pink", icon: <Brain className="w-5 h-5" /> },
            ].map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="bg-[#111] p-4 rounded-xl border border-white/5 hover:border-green-500/20 transition-all text-center"
              >
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500 mx-auto mb-3">
                  {cat.icon}
                </div>
                <div className="text-2xl font-bold text-white">{cat.count}</div>
                <div className="text-xs text-gray-500 mt-1">{cat.label}</div>
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
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#mcp" className="hover:text-white transition">MCP Server</a>
            <a href="#architecture" className="hover:text-white transition">Architecture</a>
            <a href="#tools" className="hover:text-white transition">Tools</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              All systems operational
            </div>
            <Link href="/login" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-500 transition">Log In</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 text-center text-xs text-gray-600">
          Built with Google Gemini · MCP Protocol · Express.js · FastAPI · Next.js
        </div>
      </footer>
    </div>
  );
}
