import React, { useState } from 'react';
import { AppBackground } from './AppBackground';
import { optionStyle, buttonStyle, shadow } from './theme';

export function NameEntryPage({ onConfirm }: { onConfirm: (name: string) => void }) {
    const [name, setName] = useState('');
    return (
        <AppBackground>
            <div style={{ ...optionStyle, borderRadius: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, padding: '6px 6px 6px 12px' }}>
                <input
                    type="text"
                    value={name}
                    placeholder="Name"
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onConfirm(name.trim()); }}
                    autoFocus
                    style={{ backgroundColor: `rgb(${shadow},0.1)`, border: 0, borderRadius: 5, boxShadow: `inset 0px 1px 3px rgb(${shadow},0.5)`, padding: 10, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 16, outline: 'none', color: 'inherit', width: 200 }}
                />
                <button
                    className="vote-button"
                    disabled={!name.trim()}
                    style={buttonStyle}
                    onClick={() => { if (name.trim()) onConfirm(name.trim()); }}
                >{"\uf058"}</button>
            </div>
        </AppBackground>
    );
}
