import React from 'react';
import { topGradient, botGradient } from './theme';
import { AppTitle } from './AppTitle';

export function AppBackground({ children, centered = false }: { children: React.ReactNode, centered?: boolean }) {
    return (
        <div className="app-background" style={{ display: 'flex', flexDirection: 'column', justifyContent: centered ? 'center' : 'flex-start', alignItems: 'center', gap: 16, width: '100%', minHeight: '100vh', background: `linear-gradient(179.7deg, rgb(${topGradient},1) 0%, rgb(${botGradient},1) 100%)` }}>
            <div style={{ height: '20vh', display: 'flex', alignItems: 'flex-end' }}>
                <AppTitle />
            </div>
            {children}
            <div style={{ height: '20vh' }} />
        </div>
    );
}
