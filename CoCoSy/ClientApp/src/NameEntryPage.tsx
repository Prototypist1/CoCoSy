import React, { useState } from 'react';
import { AppBackground } from './AppBackground';
import { optionStyle, buttonStyle, buttonPadding, shadow, recessedBackdropFilter, recessedPanelShadow, backdropFilter } from './theme';

export function NameEntryPage({ onConfirm }: { onConfirm: (name: string) => void }) {
    const [name, setName] = useState('');
    return (
        <AppBackground>
            <div style={{ ...optionStyle, borderRadius: `2000px 9999px 9999px 2000px`, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 12, backdropFilter }}>
                <input
                    type="text"
                    value={name}
                    placeholder="Name"
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onConfirm(name.trim()); }}
                    autoFocus
                    style={{ backgroundColor: `rgb(${shadow},0.1)`, border: 0, borderRadius: 5, boxShadow: recessedPanelShadow, backdropFilter: recessedBackdropFilter, padding: 10, fontFamily: "'Inter Tight', system-ui, sans-serif", fontSize: 16, outline: 'none', color: 'inherit', width: 200 }}
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
