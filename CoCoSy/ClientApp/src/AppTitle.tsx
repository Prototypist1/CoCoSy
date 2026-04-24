import React from 'react';
import { shadow, glow } from './theme';

export function AppTitle() {
    return (
        <h1 style={{ backgroundColor: `rgb(${shadow},0.8)`, color: "transparent", textShadow: `0px 2px 3px rgb(${glow},0.5)`, backgroundClip: "text", WebkitBackgroundClip: "text", margin: 0, fontSize: '3rem', letterSpacing: '0.05em', fontFamily: "'Inter Display', 'Inter', system-ui, sans-serif", fontWeight: 800 }}>
            CoCoSy
        </h1>
    );
}
