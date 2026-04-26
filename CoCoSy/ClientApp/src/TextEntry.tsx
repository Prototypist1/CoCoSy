import React, { CSSProperties } from 'react';
import { IconButton } from './IconButton';
import { optionStyle, recessedPanelShadow, recessedBackdropFilter } from './theme';

export function TextEntry({ value, onChange, onCommit, placeholder, icon, style, autoFocus }: {
    value: string,
    onChange: (value: string) => void,
    onCommit: (value: string) => void,
    placeholder?: string,
    icon: string,
    style?: CSSProperties,
    autoFocus?: boolean,
}) {
    const trimmed = value.trim();
    return (
        <div className="recessed-container" style={{ ...optionStyle, boxShadow: recessedPanelShadow, backdropFilter: recessedBackdropFilter, display: 'flex', flexDirection: 'row', alignItems: 'center', ...style }}>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                autoFocus={autoFocus}
                onChange={e => onChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && trimmed) onCommit(trimmed); }}
                style={{ flex: 1, minWidth: 0, background: 'none', border: 0, fontFamily: "'Inter Tight', system-ui, sans-serif", fontSize: 16, outline: 'none', color: 'inherit', padding: '10px 14px' }}
            />
            <IconButton icon={icon} disabled={!trimmed} onClick={() => { if (trimmed) onCommit(trimmed); }} />
        </div>
    );
}
