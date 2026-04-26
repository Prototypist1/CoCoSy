import React from 'react';
import { shadow, glow, titleFontSize } from './theme';

const h1Style: React.CSSProperties = {
    backgroundColor: `rgb(${shadow},0.2)`,
    color: "transparent",
    textShadow: `0px 2px 3px rgb(${glow},0.2)`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    margin: 0,
    fontSize: titleFontSize,
    fontFamily: "'Inter Tight', system-ui, sans-serif",
    fontWeight: 600,
    flex: 1,
    textAlign: 'center',
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
};

export function AppTitle() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}>
            <div style={{ ...rowStyle, marginTop: 'auto' }}>
                <h1 style={h1Style}>C</h1>
                <h1 style={h1Style}>O</h1>
            </div>
            <div style={rowStyle}>
                <h1 style={h1Style}>C</h1>
                <h1 style={h1Style}>O</h1>
            </div>
            <div style={rowStyle}>
                <h1 style={h1Style}>S</h1>
                <h1 style={h1Style}>Y</h1>
            </div>
        </div>
    );
}
