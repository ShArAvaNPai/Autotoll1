import React, { useEffect, useRef } from 'react';

interface Props {
    type: string;
    color: string;
}

export function VehicleModel3D({ type, color }: Props) {
    // Holographic CSS 3D
    // We create a rotating wireframe cube/prism representation

    // Map detected color to CSS hue/color
    const getColorHex = (c: string) => {
        const map: Record<string, string> = {
            'Red': '#ef4444',
            'Blue': '#3b82f6',
            'Green': '#10b981',
            'Black': '#52525b',
            'White': '#e4e4e7',
            'Yellow': '#eab308',
            'Silver': '#a1a1aa'
        };
        return map[c] || '#3b82f6'; // Default cyan/blue
    };

    const hex = getColorHex(color);

    return (
        <div className="w-full h-full flex items-center justify-center perspective-1000">
            <style>
                {`
                    @keyframes rotate3d {
                        0% { transform: rotateX(-15deg) rotateY(0deg); }
                        100% { transform: rotateX(-15deg) rotateY(360deg); }
                    }
                    .preserve-3d { transform-style: preserve-3d; }
                    .hologram-face {
                        position: absolute;
                        width: 100px;
                        height: 60px;
                        border: 2px solid ${hex};
                        background: ${hex}20; /* 20% opacity */
                        box-shadow: 0 0 15px ${hex}80;
                    }
                `}
            </style>

            <div className="relative w-[100px] h-[60px] preserve-3d animate-[rotate3d_8s_linear_infinite]">
                {/* Front */}
                <div className="hologram-face translate-z-[50px]"></div>
                {/* Back */}
                <div className="hologram-face -translate-z-[50px]"></div>
                {/* Right */}
                <div className="hologram-face rotate-y-90 translate-z-[50px] !w-[100px]"></div>
                {/* Left */}
                <div className="hologram-face -rotate-y-90 translate-z-[50px] !w-[100px]"></div>
                {/* Top */}
                <div className="hologram-face rotate-x-90 translate-z-[30px] !h-[100px]"></div>
                {/* Bottom */}
                <div className="hologram-face -rotate-x-90 translate-z-[30px] !h-[100px]"></div>

                {/* Inner Core */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-md animate-pulse"></div>
            </div>

            <div className="absolute bottom-10 text-center">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 animate-pulse">
                    Analysis Mode
                </div>
                <div className="text-[10px] text-cyan-600 font-mono mt-1">
                    {type.toUpperCase()} // CHASSIS-01
                </div>
            </div>
        </div>
    );
}

// Add Tailwind perspective utility if missing
// But since we use style tag, we can rely on standard CSS
