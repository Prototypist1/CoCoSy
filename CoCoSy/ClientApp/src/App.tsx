import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';
import { v4 } from 'uuid';
import { useAppState } from './useAppState';
import { getCookie, voterId } from './cookies';
import { AppBackground } from './AppBackground';
import { NameEntryPage } from './NameEntryPage';
import { VoterChip } from './VoterChip';
import {
    optionStyle, buttonStyle, fadingDividerOuter, fadingDividerInner,
    flexTransition, widthTransition, shadow, glow, primaryOpacity, secondaryOpacity, primaryTextGlow, secondaryTextGlow, backdropFilter, halfBackdropFilter, recessedBackdropFilter, nintyBackdropFilter, recessedPanelShadow,
} from './theme';
import { Vote } from './types';

const popupShadow = '0 4px 16px rgba(0,0,0,0.3)';

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
    const [showInvite, setShowInvite] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

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

    let maxSupport = Math.max(...state.options.map(option => Math.abs(option.support)), 0) + 1;


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

                    const tickWidthVw = `${33.3333 * tickUnit / maxSupport}vw`;
                    const tickColor = `rgb(${shadow},${secondaryOpacity})`;
                    const tickGlow = `0 0 3px rgb(${glow},0.6), 0 0 8px rgb(${glow},0.4)`;

                    const makeTick = (i: number, alignRight: boolean, widthVw = tickWidthVw, opacity = 1) => {
                        const fontSize = '.6em';
                        return (
                            <div key={i} style={{ flex: `0 0 auto`, display: 'flex', justifyContent: alignRight ? 'flex-end' : 'flex-start', alignItems: 'center', width: widthVw, transition: widthTransition, opacity }}>
                                <span style={{ fontSize, color: tickColor, textShadow: tickGlow, lineHeight: 1, userSelect: 'none' }}>|</span>
                            </div>
                        );
                    };

                    const makeTicks = (alignRight: boolean) => Array.from({ length: tickCount }, (_, i) => makeTick(i, alignRight));

                    const makePaddingTicks = (support: number, alignRight: boolean) => {
                        const n = Math.ceil(support / tickUnit);
                        const offsetVw = (n * tickUnit - support) / maxSupport * 33.3333;
                        return <>
                            {offsetVw > 0 && <div key={n} style={{ flex: '0 0 auto', width: `${offsetVw}vw`, transition: widthTransition }} />}
                            {Array.from({ length: 10 }, (_, i) => makeTick(n + i, alignRight, tickWidthVw, 1 - i * 0.1))}
                        </>;
                    };

                    return [
                        <div key={`opt-${option.name}`} className="option-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
                            <div style={{ flex: 1 - bfAgainst, transition: flexTransition, display: 'flex', flexDirection: 'row-reverse', overflow: 'hidden', alignItems: 'stretch' }}>
                                {/*{makePaddingTicks(Math.max(-option.support, 0), true)}*/}
                            </div>
                            <div className="option-card" style={{ ...optionStyle, backdropFilter, display: 'flex', flexDirection: 'row', flex: 1 + bfAgainst + bfFor, transition: flexTransition }}>
                                <div className="support-bar" style={{ flex: bfAgainst, alignSelf: 'stretch', overflow: 'hidden', display: 'flex', flexDirection: 'row-reverse', transition: flexTransition }}>
                                    {makeTicks(true)}
                                </div>
                                <div className="card-center" style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
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
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', fontSize: 20, fontWeight: 400, opacity: primaryOpacity, textShadow: primaryTextGlow }}>{option.name}</span>
                                        <span style={{ fontSize: '0.75em', fontWeight: 400, opacity: secondaryOpacity, textShadow: secondaryTextGlow }}>{(option.support ?? 0).toFixed(2)}</span>
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
                            <div style={{ flex: 1 - bfFor, transition: flexTransition, display: 'flex', flexDirection: 'row', overflow: 'hidden', alignItems: 'stretch' }}>
                                {/*{makePaddingTicks(Math.max(option.support, 0), false)}*/}
                            </div>
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
                <div className="control-panel" style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                    <div style={{ flex: 1 }} />
                    <div className="recessed-container" style={{ ...optionStyle, boxShadow: recessedPanelShadow, backdropFilter: recessedBackdropFilter, flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
                        <div style={{ aspectRatio: '1', flex: '0 0 auto' }} />
                        <div style={{ flex: 1, minWidth: 0, alignItems: 'stretch', display: 'flex' }}>
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
                                style={{ flex: 1, minWidth: 0, background: 'none', border: 0, fontFamily: "'Inter Tight', system-ui, sans-serif", fontSize: 16, outline: 'none', color: 'inherit', textAlign: 'center' }}
                            />
                        </div>
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
                    <div style={{ flex: 1 }} />
                </div>
            </div>
            
            {showInvite && (
                <div style={{ position: 'fixed', top: 24, right: 24, backgroundColor: 'white', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: popupShadow, zIndex: 100 }}>
                    <button
                        className="vote-button dark"
                        style={{ color: '#333', fontSize: 16, backgroundColor: 'rgba(0,0,0,0)', padding: '8px 16px', border: 0, alignSelf: 'flex-end' }}
                        onClick={() => setShowInvite(false)}
                    >✕</button>
                    <div style={{ padding: '0px 16px' }}>
                        <QRCodeSVG value={window.location.href} size={180} />
                    </div>
                    <button
                        className="vote-button dark"
                        style={{ ...buttonStyle, color: '#333', textShadow: 'none', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, aspectRatio: 'unset', width: '100%', justifyContent: 'center', paddingTop: '8px', paddingBottom: '16px' }}
                        onClick={() => navigator.clipboard.writeText(window.location.href)}
                    >
                        <span style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontSize: 13 }}>Copy link</span>
                        <span style={{ fontFamily: 'font-awesome', fontSize: 16, lineHeight: 1 }}>{"\uf0c5"}</span>
                    </button>
                </div>
            )}
            {!showInvite && (

                <button
                    className="vote-button dark"
                    style={{ ...buttonStyle, ...optionStyle, position: 'fixed', top: 24, right: 24, borderRadius: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, aspectRatio: 'unset', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.95)', color: '#333', textShadow: 'none' }}
                    onClick={() => setShowInvite(v => !v)}
                    title="Invite"
                >
                    <span style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontSize: 16 }}>Invite</span>
                    <span style={{ fontFamily: 'font-awesome', fontSize: 16, lineHeight: 1 }}>{"\uf029"}</span>
                </button>)
            }

            <button
                className="vote-button dark"
                style={{ ...buttonStyle, ...optionStyle, position: 'fixed', top: 24, left: 24, borderRadius: 8, aspectRatio: 'unset', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.95)', color: '#333', textShadow: 'none' }}
                onClick={() => setShowMenu(v => !v)}
                title="Menu"
            >
                <span style={{ fontFamily: 'font-awesome', fontSize: 16, lineHeight: 1 }}>{"\uf0c9"}</span>
            </button>

            {showMenu && (
                <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, zIndex: 200, backgroundColor: 'rgba(255,255,255,0.95)', boxShadow: popupShadow, display: 'flex', flexDirection: 'column', padding: 24, gap: 16 }}>
                    <button
                        className="vote-button dark"
                        style={{ color: '#333', fontSize: 16, background: 'none', border: 0, alignSelf: 'flex-end', cursor: 'pointer' }}
                        onClick={() => setShowMenu(false)}
                    >✕</button>
                </div>
            )}

        </AppBackground>
    );
}

export { App };
