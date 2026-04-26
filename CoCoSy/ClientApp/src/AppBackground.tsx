import React, { useEffect, useRef, useState } from 'react';
import { topGradient, botGradient, shadow, glow } from './theme';
import { AppTitle } from './AppTitle';

const titleStyle: React.CSSProperties = {
    backgroundColor: `rgb(${shadow},0.2)`,
    color: "transparent",
    textShadow: `0px 2px 3px rgb(${glow},0.2)`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    margin: 0,
    fontSize: '3rem',
    fontFamily: "'Inter Tight', system-ui, sans-serif",
    fontWeight: 600,
    textAlign: 'center',
    cursor: 'text',
    userSelect: 'none',
};

const editingInputStyle: React.CSSProperties = {
    fontSize: '3rem',
    fontFamily: "'Inter Tight', system-ui, sans-serif",
    fontWeight: 600,
    textAlign: 'center',
    background: 'none',
    border: 'none',
    outline: 'none',
    color: `rgba(${shadow},0.5)`,
    width: '100%',
    padding: 0,
};

export function AppBackground({ children,  gameName = '', onSetGameName }: {
    children: React.ReactNode,
    gameName?: string,
    onSetGameName?: (name: string) => void,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(gameName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditValue(gameName);
    }, [gameName]);

    useEffect(() => {
        if (isEditing) inputRef.current?.select();
    }, [isEditing]);

    function confirm() {
        setIsEditing(false);
        if (editValue.trim() !== gameName) {
            onSetGameName?.(editValue.trim());
        }
    }

    return (
        <div className="app-background" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 16, width: '100%', minHeight: '100vh', background: `linear-gradient(179.7deg, rgb(${topGradient},1) 0%, rgb(${botGradient},1) 100%)` }}>
            <div style={{ height: '20vh', display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={confirm}
                        onKeyDown={e => {
                            if (e.key === 'Enter') { e.currentTarget.blur(); }
                            if (e.key === 'Escape') { setEditValue(gameName); setIsEditing(false); }
                        }}
                        style={editingInputStyle}
                    />
                ) : gameName ? (
                    <h1 style={titleStyle} onClick={() => setIsEditing(true)}>{gameName}</h1>
                ) : (
                    <div style={{ cursor: 'text' }} onClick={() => setIsEditing(true)}>
                        <AppTitle />
                    </div>
                )}
            </div>
            {children}
            <div style={{ height: '20vh' }} />
        </div>
    );
}
