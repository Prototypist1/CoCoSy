import React, { useState } from 'react';
import './App.css';
import { v4 } from 'uuid';
import { useAppState } from './useAppState';
import { getCookie, voterId } from './cookies';
import { AppBackground } from './AppBackground';
import { NameEntryPage } from './NameEntryPage';
import { VoterChip } from './VoterChip';
import {
    optionStyle, buttonStyle, fadingDividerOuter, fadingDividerInner,
    flexTransition, widthTransition, shadow, glow,
} from './theme';
import { Vote } from './types';

function consolidate(votes: Vote[]): [string, number][] {
    const counts = new Map<string, number>();
    for (const vote of votes) {
        counts.set(vote.voterId, (counts.get(vote.voterId) ?? 0) + 1);
    }
    return Array.from(counts.entries());
}

function CanRetractVote(otherSideVotes: Vote[]): string | undefined {
    for (let otherSideVote of otherSideVotes) {
        if (voterId === otherSideVote.voterId) {
            return otherSideVote.voteId;
        }
    }
    return undefined;
}

function App() {
    const { state, actions } = useAppState();
    const [nameConfirmed, setNameConfirmed] = useState(getCookie('playerName') !== '');

    if (!nameConfirmed) {
        return <NameEntryPage onConfirm={(name) => {
            actions.setYourName(name);
            actions.setName({ at: Date.now(), name, voterId, messageId: v4() });
            setNameConfirmed(true);
        }} />;
    }

    const totalSlotsByVoter = new Map<string, number>();
    for (const option of state.options) {
        for (const vote of [...option.supporters, ...option.againsts]) {
            totalSlotsByVoter.set(vote.voterId, (totalSlotsByVoter.get(vote.voterId) ?? 0) + 1);
        }
    }

    const maxSupport = Math.max(...state.options.map(option => Math.abs(option.support)), 0) + 1;

    function barFlex(support: number) {
        return Math.abs(support) / maxSupport;
    }

    return (
        <AppBackground>
            <div style={{ width: '100%' }}>
                {state.options.map(option => {
                    const bf = barFlex(option.support);
                    const bfAgainst = option.support < 0 ? bf : 0;
                    const bfFor = option.support > 0 ? bf : 0;
                    const absSupport = Math.abs(option.support);
                    const tickUnit = 0.1;
                    const tickCount = Math.ceil(absSupport / tickUnit) + 1;

                    const makeTicks = (alignRight: boolean) => Array.from({ length: tickCount }, (_, i) => {
                        const [t, b] = i % 10 === 0 ? [35, 65] : i % 5 === 0 ? [45, 55] : [50, 50];
                        const mask = `linear-gradient(to bottom, transparent ${t - 5}%, black ${t}%, black ${b}%, transparent ${b + 5}%)`;
                        return (
                            <div key={i} style={{ flex: `0 0 auto`, alignSelf: 'stretch', display: 'flex', justifyContent: alignRight ? 'flex-end' : 'flex-start', alignItems: 'stretch', maskImage: mask, WebkitMaskImage: mask, width: `${33.3333 * tickUnit / maxSupport}vw`, transition: widthTransition }}>
                                {/* .8px avoids half-pixel blur at 1px */}
                                <div style={{ width: '.8px', alignSelf: 'stretch', backgroundColor: `rgb(${shadow},0.3)`, boxShadow: `0 0 4px rgb(${glow},0.5)` }} />
                            </div>
                        );
                    });

                    return [
                        <div key={`opt-${option.name}`} className="option-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <div style={{ flex: 1 - bfAgainst, transition: flexTransition }} />
                            <div className="option-card" style={{ ...optionStyle, display: 'flex', flexDirection: 'row', flex: 1 + bfAgainst + bfFor, transition: flexTransition }}>
                                <div className="support-bar" style={{ flex: bfAgainst, alignSelf: 'stretch', overflow: 'hidden', display: 'flex', flexDirection: 'row-reverse', transition: flexTransition }}>
                                    {makeTicks(true)}
                                </div>
                                <div className="card-center" style={{ display: 'flex', flexDirection: 'row', flex: 1, padding: '8px 0' }}>
                                    <button
                                        className="vote-button"
                                        style={{ ...buttonStyle, flex: '0 0 auto' }}
                                        onClick={() => {
                                            const retractVote = CanRetractVote(option.supporters);
                                            if (retractVote !== undefined) {
                                                actions.vote({ at: Date.now(), optionName: option.name, support: true, voterId, messageId: v4(), voteId: retractVote, add: false });
                                            } else {
                                                actions.vote({ at: Date.now(), optionName: option.name, support: false, voterId, messageId: v4(), voteId: v4(), add: true });
                                            }
                                        }}>{"\uf137"}</button>
                                    <div className="option-label" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', fontSize: 20, fontWeight: 400 }}>{option.name}</span>
                                        <span style={{ fontSize: '0.75em', fontWeight: 400 }}>{(option.support ?? 0).toFixed(2)}</span>
                                    </div>
                                    <button
                                        className="vote-button"
                                        style={{ ...buttonStyle, flex: '0 0 auto' }}
                                        onClick={() => {
                                            const retractVote = CanRetractVote(option.againsts);
                                            if (retractVote !== undefined) {
                                                actions.vote({ at: Date.now(), optionName: option.name, support: false, voterId, messageId: v4(), voteId: retractVote, add: false });
                                            } else {
                                                actions.vote({ at: Date.now(), optionName: option.name, support: true, voterId, messageId: v4(), voteId: v4(), add: true });
                                            }
                                        }}>{"\uf138"}</button>
                                </div>
                                <div className="support-bar" style={{ flex: bfFor, alignSelf: 'stretch', overflow: 'hidden', display: 'flex', flexDirection: 'row', transition: flexTransition }}>
                                    {makeTicks(false)}
                                </div>
                            </div>
                            <div style={{ flex: 1 - bfFor, transition: flexTransition }} />
                        </div>,
                        <div key={`voters-${option.name}`} className="voter-row" style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'stretch' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ padding: 8, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        {consolidate(option.againsts).map(([vid, slotsHere]) =>
                                            <VoterChip key={vid} voterId={vid} name={state.players.get(vid) ?? vid} slotsHere={slotsHere} totalSlots={totalSlotsByVoter.get(vid)!} reversed />
                                        )}
                                    </div>
                                </div>
                                <div className="voter-divider" style={fadingDividerOuter}><div style={fadingDividerInner} /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ padding: 8, display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        {consolidate(option.supporters).map(([vid, slotsHere]) =>
                                            <VoterChip key={vid} voterId={vid} name={state.players.get(vid) ?? vid} slotsHere={slotsHere} totalSlots={totalSlotsByVoter.get(vid)!} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>,
                    ];
                })}
            </div>
            <div className="control-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ ...optionStyle, borderRadius: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, padding: '6px 6px 6px 12px' }}>
                    <input
                        type="text"
                        value={state.toAdd}
                        placeholder="New option"
                        onChange={(e) => actions.setToAdd(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && state.toAdd.trim()) {
                                actions.addOption({ at: Date.now(), name: state.toAdd.trim(), messageId: v4() });
                                actions.setToAdd("");
                            }
                        }}
                        style={{ backgroundColor: `rgb(${shadow},0.1)`, border: 0, borderRadius: 5, boxShadow: `inset 0px 1px 3px rgb(${shadow},0.5)`, padding: 10, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 16, outline: 'none', color: 'inherit', width: 200 }}
                    />
                    <button
                        className="vote-button"
                        disabled={!state.toAdd.trim()}
                        style={buttonStyle}
                        onClick={() => {
                            if (state.toAdd.trim()) {
                                actions.addOption({ at: Date.now(), name: state.toAdd.trim(), messageId: v4() });
                                actions.setToAdd("");
                            }
                        }}
                    >{"\uf055"}</button>
                </div>
                <button onClick={() => actions.clear()}>Clear</button>
            </div>

        </AppBackground>
    );
}

export { App };
