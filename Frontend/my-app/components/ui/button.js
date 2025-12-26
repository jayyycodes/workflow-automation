'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const variants = {
    default: 'bg-green-900/70 border-2 border-green-700 text-green-300 hover:bg-green-800/70 shadow-lg shadow-green-900/30 hover:shadow-green-700/50 font-mono',
    secondary: 'bg-black/60 border border-green-900 text-green-600 hover:bg-green-950/30 hover:border-green-700 font-mono',
    outline: 'border-2 border-green-700 text-green-500 hover:bg-green-950/30 font-mono',
    ghost: 'hover:bg-green-950/30 text-green-500 font-mono',
    danger: 'bg-red-950/50 border-2 border-red-800 text-red-500 hover:bg-red-900/50 hover:border-red-700 font-mono'
};

const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-12 px-6 text-base',
};

export function Button({
    children,
    variant = 'default',
    size = 'default',
    className,
    ...props
}) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 disabled:pointer-events-none disabled:opacity-50',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
}
