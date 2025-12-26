'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function MouseGlow() {
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

    useEffect(() => {
        const updateMousePosition = (e) => {
            // Normalize to viewport percentage for smooth performance
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100,
            });
        };

        window.addEventListener('mousemove', updateMousePosition);
        return () => window.removeEventListener('mousemove', updateMousePosition);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Main glow that follows cursor - Primary green */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-30"
                style={{
                    background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, rgba(22,163,74,0.3) 40%, transparent 70%)',
                    transform: 'translate(-50%, -50%)',
                }}
                animate={{
                    left: `${mousePosition.x}%`,
                    top: `${mousePosition.y}%`,
                }}
                transition={{
                    type: 'spring',
                    damping: 30,
                    stiffness: 100,
                    mass: 0.8,
                }}
            />

            {/* Secondary delayed glow - Emerald */}
            <motion.div
                className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(5,150,105,0.2) 50%, transparent 70%)',
                    transform: 'translate(-50%, -50%)',
                }}
                animate={{
                    left: `${mousePosition.x}%`,
                    top: `${mousePosition.y}%`,
                }}
                transition={{
                    type: 'spring',
                    damping: 25,
                    stiffness: 80,
                    mass: 1.2,
                }}
            />

            {/* Subtle trailing glow - Lime */}
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-15"
                style={{
                    background: 'radial-gradient(circle, rgba(74,222,128,0.3) 0%, rgba(34,197,94,0.1) 50%, transparent 60%)',
                    transform: 'translate(-50%, -50%)',
                }}
                animate={{
                    left: `${mousePosition.x}%`,
                    top: `${mousePosition.y}%`,
                }}
                transition={{
                    type: 'spring',
                    damping: 20,
                    stiffness: 60,
                    mass: 1.5,
                }}
            />
        </div>
    );
}
