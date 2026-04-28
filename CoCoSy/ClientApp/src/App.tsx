import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';
import { v4 } from 'uuid';
import { useAppState, gameId } from './useAppState';
import { getCookie, voterId } from './cookies';
import { AppBackground } from './AppBackground';
import { NameEntryPage } from './NameEntryPage';
import { VoterChip } from './VoterChip';
import { IconButton } from './IconButton';
import { TextEntry } from './TextEntry';
import { MobileApp } from './MobileApp';
import { useIsMobile } from './useIsMobile';
import { consolidate, canRetractVote } from './voteUtils';
import {
    optionStyle, buttonStyle, fadingDividerOuter, fadingDividerInner,
    flexTransition, widthTransition, shadow, glow, primaryOpacity, secondaryOpacity, primaryTextGlow, secondaryTextGlow, backdropFilter, halfBackdropFilter, nintyBackdropFilter, overlayBackdropFilter, overlayShadow, overlayTopGradient, overlayBotGradient, sidebarTitlePaddingTop, sidebarTitlePaddingBottom,
} from './theme';
import { Vote } from './types';
import { getRecentGames, RecentGame, touchGame, updateTopOption, updateGameName, removeGame } from './recentGames';


function App() {
    const isMobile = useIsMobile();
    const { state, actions } = useAppState();
    const [nameConfirmed, setNameConfirmed] = useState(getCookie('playerName') !== '');
    const [showMenu, setShowMenu] = useState(false);
    const [pendingName, setPendingName] = useState(state.yourName);
    const [recentGames, setRecentGames] = useState<RecentGame[]>(() => {
        touchGame(gameId);
        return getRecentGames();
    });

    useEffect(() => {
        const top = state.options.reduce<{ name: string, support: number } | null>((best, o) =>
            o.support > (best?.support ?? -Infinity) ? { name: o.name, support: o.support } : best, null);
        updateTopOption(gameId, top?.name ?? null);
        setRecentGames(getRecentGames());
    }, [state.options]);

    useEffect(() => {
        setPendingName(state.yourName);
    }, [state.yourName]);

    useEffect(() => {
        updateGameName(gameId, state.gameName);
        setRecentGames(getRecentGames());
    }, [state.gameName]);

    if (isMobile) return <MobileApp />;

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

    let maxSupport = Math.max(...state.options.map(option => Math.abs(option.support)), 0) + .1;


    function barFlex(support: number) {
        return Math.abs(support) / maxSupport;
    }

    return (
        <AppBackground gameName={state.gameName} onSetGameName={name => actions.setGameName({ at: Date.now(), name, messageId: v4() })}>
            <div style={{ width: '100%' }}>
                {state.options.map(option => {
                    const bf = barFlex(option.support);
                    const bfAgainst = option.support < 0 ? bf : 0;
                    const bfFor = option.support > 0 ? bf : 0;
                    const absSupport = Math.abs(option.support);
                    const tickUnit = 0.1;
                    const tickCount = Math.ceil(absSupport / tickUnit) + 1;

                    const tickWidthVw = `${(100 / 3.0) * tickUnit / maxSupport}vw`;
                    const tickColor = `rgb(${shadow},${secondaryOpacity})`;
                    const tickGlow = `0 0 3px rgb(${glow},0.6), 0 0 8px rgb(${glow},0.4)`;

                    const makeTick = (i: number, alignRight: boolean, width = tickWidthVw, opacity = 1) => {
                        const fontSize = '.6em';
                        return (
                            <div key={i} style={{ flex: `0 0 auto`, display: 'flex', justifyContent: alignRight ? 'flex-end' : 'flex-start', alignItems: 'center', width: width, transition: widthTransition, opacity }}>
                                <span style={{ fontSize, color: tickColor, textShadow: tickGlow, lineHeight: 1, userSelect: 'none' }}>|</span>
                            </div>
                        );
                    };

                    const makeTicks = (alignRight: boolean) => Array.from({ length: tickCount }, (_, i) => makeTick(i, alignRight));

                    const makePaddingTicks = (support: number, alignRight: boolean) => {
                        const n = Math.ceil(support / tickUnit);
                        const offsetVw = (n * tickUnit - support) / maxSupport * (100 / 3.0);
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
                                <div className="card-center" style={{ display: 'flex', flexDirection: 'row', flex: 1, minWidth: 0 }}>
                                    <IconButton icon={"\uf137"} style={{ flex: '0 0 auto' }} onClick={() => {
                                        const retractVote = canRetractVote(option.supporters);
                                        if (retractVote !== undefined) {
                                            actions.vote({ at: Date.now(), optionName: option.name, support: true, voterId, messageId: v4(), voteId: retractVote, add: false });
                                        } else {
                                            actions.vote({ at: Date.now(), optionName: option.name, support: false, voterId, messageId: v4(), voteId: v4(), add: true });
                                        }
                                    }} />
                                    <div className="option-label" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', fontSize: 20, fontWeight: 400, opacity: primaryOpacity, textShadow: primaryTextGlow }}>{option.name}</span>
                                        <span style={{ fontSize: '0.75em', fontWeight: 400, opacity: secondaryOpacity, textShadow: secondaryTextGlow }}>{(option.support ?? 0).toFixed(2)}</span>
                                    </div>
                                    <IconButton icon={"\uf138"} style={{ flex: '0 0 auto' }} onClick={() => {
                                        const retractVote = canRetractVote(option.againsts);
                                        if (retractVote !== undefined) {
                                            actions.vote({ at: Date.now(), optionName: option.name, support: false, voterId, messageId: v4(), voteId: retractVote, add: false });
                                        } else {
                                            actions.vote({ at: Date.now(), optionName: option.name, support: true, voterId, messageId: v4(), voteId: v4(), add: true });
                                        }
                                    }} />
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
                    <TextEntry
                        value={state.toAdd}
                        onChange={actions.setToAdd}
                        onCommit={name => { actions.addOption({ at: Date.now(), name, messageId: v4() }); actions.setToAdd(""); }}
                        placeholder="New option"
                        icon={"\uf055"}
                        style={{ flex: 1 }}
                    />
                    <div style={{ flex: 1 }} />
                </div>
            </div>

            {!showMenu
                && <IconButton icon={"\uf0c9"} style={{ position: 'fixed', top: 0, left: 0, zIndex: 201 }} onClick={() => setShowMenu(true)} title="Open menu" />
            }

            {showMenu && (
                <div className="sidebar-scroll" style={{
                    position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, zIndex: 200, boxShadow: overlayShadow, background: `linear-gradient(179.7deg, rgb(${overlayTopGradient},1) 0%, rgb(${overlayBotGradient},1) 100%)`, overflowY: 'auto', fontFamily: "'Inter Tight', system-ui, sans-serif", color: '#333'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 0, minHeight: '100%', boxSizing: 'border-box' }}>
                        <div>
                            <IconButton icon={"\uf0c9"} onClick={() => setShowMenu(false)} title="Close menu" />
                        </div>
                        <div style={{ padding: 24, paddingTop: 0 }}>
                            <span style={{ display: 'block', paddingBottom: sidebarTitlePaddingBottom, fontSize: 12, fontWeight: 600, opacity: secondaryOpacity, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Set User Name</span>
                            <TextEntry
                                value={pendingName}
                                onChange={setPendingName}
                                onCommit={name => { actions.setYourName(name); actions.setName({ at: Date.now(), name, voterId, messageId: v4() }); }}
                                placeholder="Your name"
                                icon={"\uf058"}
                            />
                            <span style={{ display: 'block', paddingTop: sidebarTitlePaddingTop, paddingBottom: sidebarTitlePaddingBottom, fontSize: 12, fontWeight: 600, opacity: secondaryOpacity, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scan to Join</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <QRCodeSVG value={window.location.href} size={180} style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.2))' }} fgColor="rgba(0,0,0,0.8)" bgColor="rgba(255,255,255,0.6)" />
                                <IconButton dark style={{ color: '#333', textShadow: 'none', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, aspectRatio: 'unset', justifyContent: 'center', paddingTop: '4px', paddingBottom: '4px' }} onClick={() => navigator.clipboard.writeText(window.location.href)}>
                                    <span style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontSize: 13 }}>Copy link</span>
                                    <span style={{ fontFamily: 'font-awesome', fontSize: 16, lineHeight: 1 }}>{"\uf0c5"}</span>
                                </IconButton>
                            </div>
                            <span style={{ display: 'block', paddingTop: sidebarTitlePaddingTop, paddingBottom: sidebarTitlePaddingBottom, fontSize: 12, fontWeight: 600, opacity: secondaryOpacity, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rounds</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', borderRadius: 8, border: '1px dashed rgba(0,0,0,0.18)', cursor: 'pointer' }} onClick={() => { window.location.href = '/' + v4(); }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.45 }}>New round</span>
                                            <span style={{ fontFamily: 'font-awesome', fontSize: 13, opacity: 0.45, lineHeight: 1 }}>{"\uf055"}</span>
                                        </div>
                                        <span style={{ fontSize: 11, opacity: 0 }}>.</span>
                                    </div>
                                </div>
                                {recentGames.map(g => (
                                    <div key={g.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', borderRadius: 8, backgroundColor: g.id === gameId ? 'rgba(0,0,0,0.08)' : 'transparent' }}>
                                        <a
                                            href={`/${g.id}`}
                                            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px', textDecoration: 'none', color: '#333', minWidth: 0 }}
                                        >
                                            <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: primaryOpacity, textShadow: primaryTextGlow }}>{g.gameName ?? g.topOption ?? '(empty game)'}</span>
                                            <span style={{ fontSize: 11, opacity: secondaryOpacity, textShadow: secondaryTextGlow }}>{new Date(g.firstAccessed).toLocaleDateString()}</span>
                                        </a>
                                        <IconButton dark icon={"\uf00d"} style={{ color: '#333', textShadow: 'none', flexShrink: 0, fontSize: 12, opacity: 0.5 }} onClick={() => { removeGame(g.id); setRecentGames(getRecentGames()); }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppBackground>
    );
}

export { App };
