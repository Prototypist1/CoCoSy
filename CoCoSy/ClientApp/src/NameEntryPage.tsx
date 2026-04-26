import React, { useState } from 'react';
import { AppBackground } from './AppBackground';
import { optionStyle, buttonStyle, recessedBackdropFilter, recessedPanelShadow } from './theme';

export function NameEntryPage({ onConfirm }: { onConfirm: (name: string) => void }) {
    const [name, setName] = useState('');
    return (
        <AppBackground>
            {/* backdrop-filter on a parent breaks backdrop-filter on children (browser compositing limitation).
                keeping the input transparent and styling the container avoids the conflict. */}
            <div className="recessed-container" style={{ ...optionStyle, borderRadius: `2000px 9999px 9999px 2000px`, boxShadow: recessedPanelShadow, backdropFilter: recessedBackdropFilter, display: 'flex', flexDirection: 'row', alignItems: 'center', paddingLeft: 14 }}>
                <input
                    type="text"
                    value={name}
                    placeholder="Name"
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onConfirm(name.trim()); }}
                    autoFocus
                    style={{ background: 'none', border: 0, fontFamily: "'Inter Tight', system-ui, sans-serif", fontSize: 16, outline: 'none', color: 'inherit', width: 200 }}
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
