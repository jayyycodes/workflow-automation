'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  ArrowRight, Zap, Brain, GitBranch, Clock, Mail, Database, Bot,
  CheckCircle, Code, Workflow, Bell, TrendingUp, Briefcase, Users, Sparkles, Terminal
} from 'lucide-react';
import { MouseGlow } from '@/components/ui/mouse-glow';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
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

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden font-mono">
      {/* Mouse-interactive background glow */}
      <MouseGlow />

      {/* Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-10 z-10">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_50%,rgba(34,197,94,0.03)_50%)] bg-[length:100%_4px]" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="fixed w-full z-50 top-0"
      >
        <div className="glass-strong border-b border-green-900/50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Terminal className="w-6 h-6 text-green-500" />
              </motion.div>
              <span className="text-xl font-bold text-green-500">
                [SMART_WORKFLOW]
              </span>
            </motion.div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-green-600 hover:text-green-400 transition hidden md:block">{'>'}features()</a>
              <a href="#how-it-works" className="text-green-600 hover:text-green-400 transition hidden md:block">{'>'}how_it_works()</a>
              <a href="#use-cases" className="text-green-600 hover:text-green-400 transition hidden md:block">{'>'}use_cases()</a>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/login"
                  className="text-green-600 hover:text-green-400 transition font-medium"
                >
                  {'>'}login()
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/register"
                  className="bg-green-900/70 border-2 border-green-700 px-6 py-2 rounded-lg font-medium shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-shadow text-green-300"
                >
                  +register()
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-4xl mx-auto text-center relative z-10"
          >
            <motion.div variants={itemVariants}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-green-500/20 text-green-400 text-sm mb-8 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                // AI-Powered Workflow Automation
              </motion.div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            >
              {'>'}BUILD_POWERFUL_AUTOMATIONS{' '}
              <span className="gradient-text">
                JUST_BY_DESCRIBING_THEM
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-green-600 mb-12 max-w-2xl mx-auto"
            >
              // Visual automation for humans. Extensible for developers.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-4 flex-wrap"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/register"
                  className="bg-green-900/70 border-2 border-green-700 px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all group text-green-300"
                >
                  {'>'}start_automating()
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/register"
                  className="glass px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:glass-strong text-green-400"
                >
                  {'>'}view_demo()
                </Link>
              </motion.div>
            </motion.div>

            {/* Visual Placeholder with Floating Animation */}
            <motion.div
              variants={floatingVariants}
              animate="animate"
              className="mt-16 rounded-2xl glass-strong p-8 border border-green-900/50 shadow-2xl"
            >
              <div className="aspect-video rounded-lg bg-black/50 flex items-center justify-center border border-green-700/50 relative overflow-hidden">
                {/* Animated grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#15803d12_1px,transparent_1px),linear-gradient(to_bottom,#15803d12_1px,transparent_1px)] bg-[size:14px_24px]" />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-center relative z-10"
                >
                  <motion.div
                    animate={{
                      rotateY: [0, 360],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  >
                    <Workflow className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-green-600">// Interactive workflow diagram</p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            {/* Old Way */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-strong p-8 rounded-2xl border border-red-900/30"
            >
              <h2 className="text-sm uppercase tracking-wider text-red-500 mb-4">// THE_OLD_WAY</h2>
              <h3 className="text-3xl font-bold mb-6 text-red-500">automation_shouldnt_be_this_hard()</h3>
              <div className="space-y-4">
                {[
                  'Manual scripts for everything',
                  'Brittle hard-coded logic',
                  'Fragmented cron jobs',
                  'Disposable one-off automations',
                  'Overcomplicated simple tasks'
                ].map((pain, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 text-green-700"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0 animate-pulse" />
                    <span className="text-red-500">// {pain}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* New Way */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-strong p-8 rounded-2xl border border-green-500/30"
            >
              <h2 className="text-sm uppercase tracking-wider text-green-400 mb-4">// THE_NEW_WAY</h2>
              <h3 className="text-4xl font-bold mb-6 text-green-400">describe_it.done()</h3>
              <div className="space-y-4">
                {[
                  'Describe → Deploy',
                  'Visual control, zero constraints',
                  'Reusable primitives',
                  'Unified automation platform',
                  'Intent-aware AI'
                ].map((solution, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-green-400">{solution}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 gradient-text">{'>'}HOW_IT_WORKS()</h2>
            <p className="text-xl text-green-600">// From idea to automation in seconds</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                icon: <Brain className="w-8 h-8" />,
                title: 'describe_task',
                description: 'Plain English instructions. Zero jargon.'
              },
              {
                step: '02',
                icon: <Sparkles className="w-8 h-8" />,
                title: 'ai_extracts_intent',
                description: 'AI infers execution primitives.'
              },
              {
                step: '03',
                icon: <GitBranch className="w-8 h-8" />,
                title: 'workflow_built',
                description: 'Automated assembly. Visual graph.'
              },
              {
                step: '04',
                icon: <Zap className="w-8 h-8" />,
                title: 'automation_runs',
                description: 'Instant deployment. Infinite triggers.'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="relative group"
              >
                <div className="glass-strong rounded-xl p-6 h-full border border-green-900/50 hover:border-green-500/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-green-500/20">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="text-green-500 mb-4"
                  >
                    {item.icon}
                  </motion.div>
                  <div className="text-6xl font-bold text-green-950 mb-2 opacity-20">{item.step}</div>
                  <h4 className="text-xl font-semibold mb-3 text-green-400">${item.title}()</h4>
                  <p className="text-green-700 text-sm">// {item.description}</p>
                </div>
                {i < 3 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + 0.3, duration: 0.5 }}
                    className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-green-500 to-green-700 origin-left"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 text-green-400">{'>'}EVERYTHING_YOU_NEED()</h2>
            <p className="text-xl text-green-600">// Powerful features for any automation workflow</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: 'natural_language_input',
                description: 'English → Executable steps'
              },
              {
                icon: <GitBranch className="w-6 h-6" />,
                title: 'visual_workflow_builder',
                description: 'Compose visually. Deploy instantly.'
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: 'smart_scheduling',
                description: 'Cron, webhooks, events, manual'
              },
              {
                icon: <Mail className="w-6 h-6" />,
                title: 'email_automation',
                description: 'Full SMTP/IMAP orchestration'
              },
              {
                icon: <Database className="w-6 h-6" />,
                title: 'api_integration',
                description: 'Universal REST. Auth + retries built-in.'
              },
              {
                icon: <Bot className="w-6 h-6" />,
                title: 'ai_agents',
                description: 'Embedded intelligence. Autonomous decisions.'
              },
              {
                icon: <Code className="w-6 h-6" />,
                title: 'custom_code_steps',
                description: 'JS/Python escape hatch. Full control.'
              },
              {
                icon: <Bell className="w-6 h-6" />,
                title: 'smart_notifications',
                description: 'Multi-channel alerts. Instant delivery.'
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'production_ready',
                description: 'Scale-tested. Observable. Resilient.'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass rounded-xl p-6 border border-green-900/50 hover:border-green-500/30 transition-all duration-300 group cursor-pointer"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 rounded-lg bg-green-900/50 border border-green-700/50 p-2.5 flex items-center justify-center text-green-400 mb-4 shadow-lg group-hover:shadow-xl transition-shadow"
                >
                  {feature.icon}
                </motion.div>
                <h4 className="text-lg font-semibold mb-2 text-green-400">${feature.title}()</h4>
                <p className="text-green-700 text-sm">// {feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 gradient-text">{'>'}WHAT_YOU_CAN_BUILD()</h2>
            <p className="text-xl text-green-600">// Real workflows people are automating right now</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'stock_price_alerts',
                description: 'Real-time market surveillance. Threshold-based alerts.',
                tags: ['Finance', 'Monitoring']
              },
              {
                icon: <Briefcase className="w-6 h-6" />,
                title: 'job_alert_system',
                description: 'Intelligent aggregation. Curated daily digests.',
                tags: ['Career', 'Scraping']
              },
              {
                icon: <Mail className="w-6 h-6" />,
                title: 'email_automation',
                description: 'Smart triage. Conditional routing. Auto-responses.',
                tags: ['Productivity', 'Email']
              },
              {
                icon: <Bell className="w-6 h-6" />,
                title: 'monitoring_alerts',
                description: 'Uptime tracking. Health checks. Proactive notifications.',
                tags: ['DevOps', 'Observability']
              },
              {
                icon: <Database className="w-6 h-6" />,
                title: 'data_pipelines',
                description: 'Automated ETL. Cross-system orchestration.',
                tags: ['Data', 'Integration']
              },
              {
                icon: <Bot className="w-6 h-6" />,
                title: 'ai_driven_decisions',
                description: 'Autonomous analysis. Intelligent classification.',
                tags: ['AI', 'Automation']
              }
            ].map((useCase, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass rounded-xl p-6 border border-green-900/50 hover:border-green-500/30 transition-all duration-300 group cursor-pointer"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-12 h-12 rounded-lg bg-green-900/50 border border-green-700/50 p-2.5 flex items-center justify-center text-green-400 mb-4 shadow-lg"
                >
                  {useCase.icon}
                </motion.div>
                <h4 className="text-xl font-semibold mb-2 text-green-400">${useCase.title}()</h4>
                <p className="text-green-700 mb-4 text-sm">// {useCase.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {useCase.tags.map((tag, j) => (
                    <motion.span
                      key={j}
                      whileHover={{ scale: 1.1 }}
                      className="text-xs px-3 py-1 rounded-full glass text-green-500 border border-green-900/50"
                    >
                      [{tag}]
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Different */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 text-green-400">{'>'}WHY_CHOOSE_US()</h2>
            <p className="text-xl text-green-600">// Built different from the ground up</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid md:grid-cols-2 gap-8"
          >
            {[
              {
                title: 'ai_first_approach',
                description: 'Intent → Implementation. AI architects optimal workflows.',
                comparison: 'vs. manual_configuration_everywhere'
              },
              {
                title: 'intent_driven_design',
                description: 'Declare outcomes. System handles mechanics.',
                comparison: 'vs. imperative_step_building'
              },
              {
                title: 'developer_friendly',
                description: 'Full API. Custom code. Version control. Testing primitives.',
                comparison: 'vs. constrained_no_code'
              },
              {
                title: 'non_technical_friendly',
                description: 'Progressive disclosure. Natural → Visual → Code.',
                comparison: 'vs. all_or_nothing_complexity'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className="glass-strong rounded-xl p-8 border border-green-900/50 hover:border-green-500/30 transition-all duration-300"
              >
                <h4 className="text-2xl font-bold mb-3 gradient-text">
                  ${item.title}()
                </h4>
                <p className="text-green-400 mb-4">// {item.description}</p>
                <div className="text-sm text-green-800 italic">// {item.comparison}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-6xl font-bold mb-6">
              {'>'}stop_writing_scripts()
              <br />
              <span className="gradient-text">
                {'>'}start_automating_ideas()
              </span>
            </h2>
            <p className="text-xl text-green-600 mb-12">
              // Join the automation revolution
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/register"
                  className="bg-green-900/70 border-2 border-green-700 px-10 py-5 rounded-lg font-semibold text-xl flex items-center gap-2 shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all group text-green-300"
                >
                  {'>'}start_automating_free()
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </motion.div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button className="text-green-600 hover:text-green-400 transition text-lg">
                  {'>'}talk_to_our_team() →
                </button>
              </motion.div>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-sm text-green-800 mt-8"
            >
              // No credit card required • 14-day free trial • Cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-900/50 py-12 px-6 glass">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-6 h-6 text-green-500" />
                <span className="text-lg font-bold text-green-400">[SMART_WORKFLOW]</span>
              </div>
              <p className="text-green-700 text-sm">
                // Automate anything. Visually. Intelligently.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-3 text-green-400">$product()</h5>
              <ul className="space-y-2 text-green-700 text-sm">
                <li><a href="#features" className="hover:text-green-400 transition">{'>'}features</a></li>
                <li><a href="#" className="hover:text-green-400 transition">{'>'}pricing</a></li>
                <li><a href="#" className="hover:text-green-400 transition">{'>'}documentation</a></li>
                <li><a href="#" className="hover:text-green-400 transition">{'>'}api_reference</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3 text-green-400">$company()</h5>
              <ul className="space-y-2 text-green-700 text-sm">
                <li><a href="#" className="hover:text-green-400 transition">{'>'}about</a></li>
                <li><a href="#" className="hover:text-green-400 transition">{'>'}blog</a></li>
                <li><a href="#" className="hover:text-green-400 transition">{'>'}careers</a></li>
                <li><a href="#" className="hover:text-green-400 transition">{'>'}contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3 text-green-400">$legal()</h5>
              <ul className="space-y-2 text-green-700 text-sm">
                <li><a href="#" className="hover:text-green-400 transition">{'>'}privacy</a></li>
                <li><a href="#" className="hover:text-green-400 transition">{'>'}terms</a></li>
                <li><a href="#" className="hover:text-green-400 transition">{'>'}security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-green-900/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-green-700 text-sm">// © 2024 Smart Workflow. All rights reserved.</p>
            <div className="flex gap-6 text-green-700">
              <a href="#" className="hover:text-green-400 transition">{'>'}twitter</a>
              <a href="#" className="hover:text-green-400 transition">{'>'}github</a>
              <a href="#" className="hover:text-green-400 transition">{'>'}linkedin</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-600 to-green-700 origin-left z-50"
        style={{ scaleX: scaleProgress }}
      />
    </div>
  );
}
