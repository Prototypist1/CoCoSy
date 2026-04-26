import React from 'react';
import { topGradient, botGradient } from './theme';

function CoSyIcon({ size, circle = false }: { size: number, circle?: boolean }) {
    const fontSize = size * 0.28;
    const letterStyle: React.CSSProperties = {
        fontSize,
        fontFamily: "'Inter Tight', system-ui, sans-serif",
        fontWeight: 600,
        backgroundColor: 'rgba(0,0,0,0.2)',
        color: 'transparent',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        textShadow: `0px ${Math.max(1, size * 0.03)}px ${Math.max(1, size * 0.05)}px rgba(255,255,255,0.2)`,
        margin: 0,
        lineHeight: 1,
        flex: 1,
        textAlign: 'center',
    };
    const rowStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
    };
    return (
        <div style={{
            width: size,
            height: size,
            background: `linear-gradient(180deg, rgb(${topGradient},1) 0%, rgb(${botGradient},1) 100%)`,
            borderRadius: circle ? '50%' : size * 0.2,
            boxShadow: `inset 0px ${size * 0.02}px ${size * 0.08}px rgba(255,255,255,0.7)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'center',
            padding: size * 0.08,
            boxSizing: 'border-box',
            flexShrink: 0,
        }}>
            {size >= 50 && <>
                <div style={rowStyle}>
                    <h1 style={letterStyle}>C</h1>
                    <h1 style={letterStyle}>O</h1>
                </div>
                <div style={rowStyle}>
                    <h1 style={letterStyle}>C</h1>
                    <h1 style={letterStyle}>O</h1>
                </div>
                <div style={rowStyle}>
                    <h1 style={letterStyle}>S</h1>
                    <h1 style={letterStyle}>Y</h1>
                </div>
            </>}
        </div>
    );
}

const sizes: { size: number, circle: boolean }[] = [
    { size: 16, circle: true },
    { size: 24, circle: true },
    { size: 32, circle: true },
    { size: 64, circle: false },
    { size: 192, circle: false },
    { size: 512, circle: false },
];

export function IconPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 32, alignItems: 'flex-start', background: '#ddd', minHeight: '100vh' }}>
            {sizes.map(({ size, circle }) => (
                <div key={size} style={{ display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#666' }}>{size}×{size} black</span>
                        <div style={{ background: '#000', width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CoSyIcon size={size * 0.85} circle={circle} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#666' }}>{size}×{size} white</span>
                        <div style={{ background: '#fff', width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ filter: `drop-shadow(0px ${size * 0.02}px ${size * 0.05}px rgba(0,0,0,0.3))` }}>
                                <CoSyIcon size={size * 0.85} circle={circle} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
