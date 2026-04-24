import React from 'react';
import { chipStyle, chipTextStyle, shadow, glow } from './theme';

function idToHue(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
    }
    return hash % 360;
}

export function VoterChip({ name, voterId, slotsHere, totalSlots, reversed = false }: {
    name: string,
    voterId: string,
    slotsHere: number,
    totalSlots: number,
    reversed?: boolean,
}) {
    const hue = idToHue(voterId);
    return (
        <div className="voter-chip" style={{ ...chipStyle, backgroundColor: `hsla(${hue}, 30%, 70%, 0.08)` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, width: 130 }}>
                <span style={chipTextStyle}>{name}</span>
                <span style={{ whiteSpace: 'nowrap', opacity: 0.7, flexShrink: 0 }}>{reversed ? '-' : ''}{slotsHere}/{totalSlots}</span>
            </div>
            <div style={{ height: 4, width: 130, borderRadius: 9999, backgroundColor: `rgb(${shadow},0.1)`, display: 'flex', overflow: 'hidden', boxShadow: `inset 0px 1px 2px rgb(${shadow},0.3), 0px 1px 2px rgb(${glow},0.3)` }}>
                {Array.from({ length: totalSlots }, (_, i) => {
                    const filled = reversed ? i >= totalSlots - slotsHere : i < slotsHere;
                    const shade = reversed ? (i % 2 === 0 ? 0.45 : 0.55) : (i % 2 === 0 ? 0.55 : 0.45);
                    return <div key={i} style={{ flex: 1, height: '100%', backgroundColor: filled ? `rgb(${shadow},${shade})` : 'transparent' }} />;
                })}
            </div>
        </div>
    );
}
