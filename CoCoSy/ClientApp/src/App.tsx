import React, { Reducer, useEffect, useMemo, useReducer, CSSProperties } from 'react';
import './App.css';
import * as signalR from "@microsoft/signalr";
import { v4 } from 'uuid';


const glow = "255, 255, 255";
const topGradient = "238, 220, 206";
const botGradient = "126, 157, 143";
const shadow = "0, 0, 0";
const backdropFilter = "hue-rotate(-30deg) saturate(105%) brightness(110%) blur(10px)";
const halfBackdropFilter = "hue-rotate(-15deg) saturate(102.5%) brightness(105%) blur(5px)";

const buttonStyle: CSSProperties = {
    fontFamily: 'font-awesome',
    color: 'rgb(255,255,255)',
    textShadow: `0 1px 5px rgb(${shadow}, .5)`,
    fontSize: '30px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 8px',
    zIndex: 1,
}

const panelShadow = `inset 0px 1px 4px rgb(${glow},0.5), 0px 2px 7px rgb(${shadow},0.3), 0px 1px 2px rgb(${shadow},0.5)`;
const halfPanelShadow = `inset 0px 1px 4px rgb(${glow},0.5), 0px 1px 3px rgb(${shadow},0.65), 0px 1px 1px rgb(${shadow},0.75)`;
const flexTransition = 'flex 0.1s linear';
const widthTransition = 'width 0.1s linear';
const fadingDividerOuter: CSSProperties = {
    width: 9,
    margin: '6px 0',
    alignSelf: 'stretch',
    display: 'flex',
    alignItems: 'stretch',
    maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
};
const fadingDividerInner: CSSProperties = {
    flex: 1,
    margin: '0 4px',
    backgroundColor: `rgb(${shadow},0.15)`,
    boxShadow: `0 0 4px rgb(${glow},0.4)`,
};

const baseStyle: CSSProperties = {
    fontFamily: "Roboto,Helvetica,Arial,sans-serif",
    overflowWrap: "break-word",
    userSelect: "none",
    //padding: "8px",
    textShadow: `0px 1px 5px rbh(${glow}, 0.5)`,
    borderRadius: "8px",
    boxShadow: panelShadow,
    backdropFilter: backdropFilter,
    zIndex: 1,
};

const optionSyle: CSSProperties = {
    ...baseStyle,
    fontSize: 18,
    overflow: 'hidden',
    borderRadius: '9999px',
};

const chipStyle: CSSProperties = {
    ...optionSyle,
    maxWidth: 300,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 0,
    padding: '4px',
    gap: 3,
    borderRadius: '6px',
    backdropFilter: halfBackdropFilter,
    boxShadow: halfPanelShadow,
};

const chipTextStyle: CSSProperties = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
};

type Vote =
    {
        voterId: string,
        voteId: string,
    }

type VotesSubState = {
    options: Yolo[],
    time: number,
}

type NamesSubState = {
    players: Map<string, string>,
}

type State = {
    options: Yolo[],
    toAdd: string,
    yourName: string,
    time: number,
    players: Map<string, string>,
}

type Yolo =
    {
        againsts: Vote[]
        name: string,
        supporters: Vote[],
        support: number,
    }

function getCookie(name: string): string {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
}

function setCookie(name: string, value: string) {
    document.cookie = `${name}=${encodeURIComponent(value)};max-age=${60 * 60 * 24 * 365};path=/`;
}

const testState: State = {
    options: [],
    toAdd: "",
    yourName: getCookie('playerName'),
    time: Date.now(),
    players: new Map<string, string>()
}

type VoteAction = {
    voterId: string,
    optionName: string,
    at: number,
    support: boolean,
    messageId: string,
    voteId: string,
    add: boolean, // or remove
}

type SetNameAction =
    {
        voterId: string,
        at: number,
        name: string,
        messageId: string
    }

type AddOptionAction = {
    name: string;
    at: number,
    messageId: string
}

// requests all the old messages
type Hello = {
}
type Clear = {}

function getUniqueStrings(list: string[]): string[] {
    const uniqueStrings: string[] = [];
    for (const str of list) {
        if (!uniqueStrings.includes(str)) {
            uniqueStrings.push(str);
        }
    }
    return uniqueStrings;
}

function TryRemove(array: Vote[], element: Vote): boolean {
    for (let index = 0; index < array.length; index++) {
        if (array[index].voteId === element.voteId) {
            array.splice(index, 1);
            return true;
        }
    }
    return false;
}

function buildState2(namings: SetNameAction[]): NamesSubState {
    const players = new Map<string, string>();

    for (let naming of namings.sort((x, y) => x.at - y.at)) {
        players.set(naming.voterId, naming.name);
    }
    return { players: players };
}

function buildState(votesAdded: VoteAction[], optionsAdded: AddOptionAction[]): VotesSubState {
    const now = Date.now();

    const optionMap = new Map<string, Yolo>();;
    for (let optionName of getUniqueStrings(optionsAdded.map(x => x.name))) {
        optionMap.set(optionName, {
            name: optionName,
            againsts: [],
            supporters: [],
            support: 0,
        });
    }

    for (let voteAction of votesAdded.sort((x, y) => x.at - y.at)) {

        const target = optionMap.get(voteAction.optionName);
        if (!target) continue;
        const vote = { voterId: voteAction.voterId, voteId: voteAction.voteId };
        if (voteAction.support) {
            if (voteAction.add) {
                target.supporters.push(vote);
            } else {
                if (!TryRemove(target.supporters, vote)) {
                    console.log(`couldn't remove vote id ${vote.voteId}`)
                }
            }
        } else {
            if (voteAction.add) {
                target.againsts.push(vote);
            } else {
                if (!TryRemove(target.againsts, vote)) {
                    console.log(`couldn't remove vote id ${vote.voteId}`)
                }
            }
        }
    }

    const votesByPlayer = new Map<string, number>();
    for (let yolo of Array.from(optionMap.values())) {
        for (let vote of yolo.supporters) {
            var currentCount = votesByPlayer.get(vote.voterId) ?? 0;
            votesByPlayer.set(vote.voterId, currentCount + 1);
        }
        for (let vote of yolo.againsts) {
            var currentCount = votesByPlayer.get(vote.voterId) ?? 0;
            votesByPlayer.set(vote.voterId, currentCount + 1);
        }
    }

    for (let yolo of Array.from(optionMap.values())) {

        for (let vote of yolo.supporters) {
            // activeByPlayer.get is not undefined because you can't vote without being active
            // @ts-expect-error
            yolo.support += 1.0 / votesByPlayer.get(vote.voterId);
        }
        for (let vote of yolo.againsts) {
            // activeByPlayer.get is not undefined because you can't vote without being active
            // @ts-expect-error
            yolo.support -= 1.0 / votesByPlayer.get(vote.voterId);
        }
    }

    return {
        options: Array.from(optionMap.values()),
        time: now
    }
}

type Messages = {
    votes: Map<string, VoteAction>,
    namings: Map<string, SetNameAction>,
    options: Map<string, AddOptionAction>
}


const reducer: Reducer<State, (last: State) => State> = (state, action) => {
    return action(state);
};

function buildNetworkStateFromMessages(messages: Messages, last: State): State {
    return {
        ...last,
        ...buildState(Array.from(messages.votes.values()), Array.from(messages.options.values())),
        ...buildState2(Array.from(messages.namings.values()))
    }
}

const useAppState = () => {
    const [state, dispatch] = useReducer(reducer, testState);

    const { vote, setName, addOption, refresh, clear } = useMemo(() => {

        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:7277/relayhub", {
                withCredentials: false,
                transport: signalR.HttpTransportType.WebSockets,
                skipNegotiation: true
            })
            // use on local: https://localhost:7277/relayhub
            // use in azure: /relayhub
            .configureLogging(signalR.LogLevel.Information)
            .build()

        const messages: Messages = {
            votes: new Map<string, VoteAction>(),
            namings: new Map<string, SetNameAction>(),
            options: new Map<string, AddOptionAction>()
        }
        connection.on("VoteAction", (action) => {
            console.log("got VoteAction message", action);
            if (messages.votes.get(action.messageId) === undefined) {
                messages.votes.set(action.messageId, action);
                dispatch(lastState => buildNetworkStateFromMessages(messages, lastState));
            }
        });
        connection.on("SetNameAction", (action) => {
            console.log("got SetNameAction message", action);
            if (messages.namings.get(action.messageId) === undefined) {
                messages.namings.set(action.messageId, action);
                dispatch(lastState => buildNetworkStateFromMessages(messages, lastState));
            }
        });
        connection.on("AddOptionAction", (action) => {
            console.log("got AddOptionAction message", action);
            if (messages.options.get(action.messageId) === undefined) {
                messages.options.set(action.messageId, action);
                dispatch(lastState => buildNetworkStateFromMessages(messages, lastState));
            }
        });
        connection.on("Clear", (action) => {
            console.log("got Clear message", action);
            messages.votes = new Map<string, VoteAction>();
            messages.namings = new Map<string, SetNameAction>();
            messages.options = new Map<string, AddOptionAction>();
            dispatch(lastState => buildNetworkStateFromMessages(messages, lastState));
        });


        // we need to rebuild constantly...

        async function start() {
            try {
                await connection.start();
                console.log("SignalR Connected.");
                // clear old the old message
                messages.votes = new Map<string, VoteAction>();
                messages.namings = new Map<string, SetNameAction>();
                messages.options = new Map<string, AddOptionAction>();
                const hello: Hello = {};
                await connection.invoke("Hello", hello);
            } catch (err) {
                console.log(err);
                //setTimeout(start, 5000);
            }
        };

        start();

        // TODO add message to queue
        // try to send
        // if ther isn't and error
        // remove from queue
        // on start
        // send que

        // .. or just no queing
        // don't see an update?
        // click the button again
        // some of these being sent to far from when they happened could be trouble

        connection.onclose(async () => {
            //await start();
        });

        return {
            vote: async (action: VoteAction) => {
                console.log("sending VoteAction", action);
                try {
                    await connection.invoke("VoteAction", action);
                } catch (error) {
                    console.error("could not invoke VoteAction", error);
                }
            },
            setName: async (action: SetNameAction) => {
                console.log("sending SetNameAction", action);
                try {
                    await connection.invoke("SetNameAction", action);
                } catch (error) {
                    console.error("could not invoke SetNameAction", error);
                }
            },
            addOption: async (action: AddOptionAction) => {
                console.log("sending AddOptionAction", action);
                try {
                    await connection.invoke("AddOptionAction", action);
                } catch (error) {
                    console.error("could not invoke AddOptionAction", error);
                }
            },
            refresh: () => dispatch(lastState => buildNetworkStateFromMessages(messages, lastState)),
            clear: async () => {
                console.log("clearing");
                try {
                    const clear: Clear = {};
                    await connection.invoke("Clear", clear);
                } catch (error) {
                    console.error("could not invoke Clear", error);
                }
            }
        };
    }
        , []);

    useEffect(() => {
        const timer = setTimeout(() => refresh()
            , 1000);
        return () => clearTimeout(timer);
    });

    return {
        state: state,
        actions: {
            vote: vote,
            setName: setName,
            addOption: addOption,
            clear: clear,
            setToAdd: (value: string) => {
                return dispatch((lastState) => ({ ...lastState, toAdd: value }))
            },
            setYourName: (value: string) => {
                setCookie('playerName', value);
                dispatch((lastState) => ({ ...lastState, yourName: value }));
            }
        }
    }
}

const voterId: string = (() => {
    const saved = getCookie('voterId');
    if (saved) return saved;
    const id = v4();
    setCookie('voterId', id);
    return id;
})();

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

function VoteShareIcon({ slotsHere, totalSlots }: { slotsHere: number, totalSlots: number }) {
    const size = 14;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 0.5;

    const sliceAngle = (2 * Math.PI) / totalSlots;

    const slices = Array.from({ length: slotsHere }, (_, i) => {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;
        const startX = cx + r * Math.sin(startAngle);
        const startY = cy - r * Math.cos(startAngle);
        const endX = cx + r * Math.sin(endAngle);
        const endY = cy - r * Math.cos(endAngle);
        const largeArcFlag = (endAngle - startAngle) > Math.PI ? 1 : 0;
        const opacity = i % 2 === 0 ? 0.7 : 0.45;
        return <path key={i} d={`M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`} fill="black" opacity={opacity} />;
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ verticalAlign: 'middle', marginLeft: 4 }}>
            <circle cx={cx} cy={cy} r={r} fill="black" opacity={0.15} />
            {slices}
        </svg>
    );
}

function idToHue(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
    }
    return hash % 360;
}

function VoterChip({ name, voterId, slotsHere, totalSlots, reversed = false }: { name: string, voterId: string, slotsHere: number, totalSlots: number, reversed?: boolean }) {
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

function App() {
    const { state, actions } = useAppState();

    // gross, refresh every second

    const totalSlotsByVoter = new Map<string, number>();
    for (const option of state.options) {
        for (const vote of [...option.supporters, ...option.againsts]) {
            totalSlotsByVoter.set(vote.voterId, (totalSlotsByVoter.get(vote.voterId) ?? 0) + 1);
        }
    }

    const maxSupport = Math.max(...state.options.map(option => Math.abs(option.support)), 0) + 1;

    function barFlex(support: number) {
        return Math.abs(support) / maxSupport; // 0 to ~1, never quite reaches 1
    }

    return (
        <div className="app-background" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 16, width: '100%', background: `linear-gradient( 179.7deg, rgb(${topGradient},1) 0%, rgb(${botGradient},1) 100% )` }}>
            <h1 style={{ backgroundColor: `rgb(${shadow},0.8)`, color: "transparent", textShadow: `0px 2px 3px rgb(${glow},0.5)`, backgroundClip: "text", WebkitBackgroundClip: "text", margin: 0 }}>
                CoCoSy
            </h1>
            <div style={{ width: '100%' }}>
                {state.options.map(option => {
                    const bf = barFlex(option.support);
                    const bfAgainst = option.support < 0 ? bf : 0;
                    const bfFor = option.support > 0 ? bf : 0;
                    const absSupport =Math.abs(option.support);
                    const tickUnit = 0.1;
                    const tickCount = Math.ceil(absSupport / tickUnit) + 1;

                    const makeTicks = (alignRight: boolean) => Array.from({ length: tickCount }, (_, i) => {
                        const [t, b] = i % 10 === 0 ? [35, 65] : i % 5 === 0 ? [45, 55] : [50, 50];
                        const mask = `linear-gradient(to bottom, transparent ${t - 5}%, black ${t}%, black ${b}%, transparent ${b + 5}%)`;
                        return (
                            <div key={i} style={{ flex: `0 0 auto`, alignSelf: 'stretch', display: 'flex', justifyContent: alignRight ? 'flex-end' : 'flex-start', alignItems: 'stretch', maskImage: mask, WebkitMaskImage: mask, width: `${33.3333 * tickUnit / (maxSupport)}vw`, transition: widthTransition }}>
                                {/** .8 is a bit of a hack, at 1px it was sometime burring acorss mutiple pixels. I suspect it was trying to draw at a half pixel so it ended up part on two pixels. */ }
                                <div style={{ width: '.8px', alignSelf: 'stretch', backgroundColor: `rgb(${shadow},0.3)`, boxShadow: `0 0 4px rgb(${glow},0.5)` }} />
                            </div>
                        );
                    });
                    return [
                        <div key={`opt-${option.name}`} className="option-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <div style={{ flex: 1 - bfAgainst, transition: flexTransition }} />
                            <div className="option-card" style={{ ...optionSyle, display: 'flex', flexDirection: 'row', flex: 1 + bfAgainst + bfFor, transition: flexTransition}}>
                                <div className="support-bar" style={{ flex: bfAgainst, alignSelf: 'stretch', overflow: 'hidden', display: 'flex', flexDirection: 'row-reverse', transition: flexTransition }}>
                                    {makeTicks(true)}
                                </div>
                                <div className="card-center" style={{ display: 'flex', flexDirection: 'row', flex: 1, }}>
                                    <button
                                        className="vote-button"
                                        style={{ ...buttonStyle, flex: '0 0 auto' }}
                                        onClick={() => {
                                            const retractVote = CanRetractVote(option.supporters);
                                            if (retractVote !== undefined) {
                                                actions.vote({ at: Date.now(), optionName: option.name, support: true, voterId: voterId, messageId: v4(), voteId: retractVote, add: false })
                                            } else {
                                                actions.vote({ at: Date.now(), optionName: option.name, support: false, voterId: voterId, messageId: v4(), voteId: v4(), add: true })
                                            }
                                        }}>{"\uf137"}</button>
                                    <div className="option-label" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        <h5 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, maxWidth: '100%' }}>{option.name}</h5>
                                        <span style={{ fontSize: '0.75em', fontWeight: 400 }}>{(option.support ?? 0).toFixed(2)}</span>
                                    </div>
                                    <button
                                        className="vote-button"
                                        style={{ ...buttonStyle, flex: '0 0 auto' }}
                                        onClick={() => {
                                            const retractVote = CanRetractVote(option.againsts);
                                            if (retractVote !== undefined) {
                                                actions.vote({ at: Date.now(), optionName: option.name, support: false, voterId: voterId, messageId: v4(), voteId: retractVote, add: false })
                                            } else {
                                                actions.vote({ at: Date.now(), optionName: option.name, support: true, voterId: voterId, messageId: v4(), voteId: v4(), add: true })
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
                        </div>
                    ]
                })}

            </div>
            <div className="control-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <input
                    type="text"
                    value={state.toAdd}
                    onChange={(e) => actions.setToAdd(e.target.value)}
                    style={{ backgroundColor: `rgb(${shadow},0.1)`, border: 0, borderRadius: 5, boxShadow: `inset 0px 1px 3px rgb(${shadow},0.5)`, padding: 10 }}
                />
                <button onClick={() => {
                    if (state.toAdd !== "") {
                        actions.addOption({
                            at: Date.now(),
                            name: state.toAdd,
                            messageId: v4(),
                        });
                        actions.setToAdd("");
                    }
                }}>Add Option</button>
                <input
                    type="text"
                    value={state.yourName}
                    onChange={(e) => actions.setYourName(e.target.value)}
                    style={{ backgroundColor: `rgb(${shadow},0.1)`, border: 0, borderRadius: 5, boxShadow: `inset 0px 1px 3px rgb(${shadow},0.5)`, padding: 10 }}
                />
                <button onClick={() => {
                    actions.setName({
                        at: Date.now(),
                        name: state.yourName,
                        voterId: voterId,
                        messageId: v4(),
                    });
                }}>Set Name</button>
                <button onClick={() => actions.clear()}>Clear</button>
            </div>

            <div style={{ padding: 10, borderRadius: 5, boxShadow: `inset 1px 1px 4px rgb(${glow},0.5), 0px 2px 7px rgb(${shadow},0.3), 0px 1px 2px rgb(${shadow},0.5)` }} > hello world
            </div>
            <div style={{ width: 100, height: 100, backgroundColor: botGradient, backdropFilter: backdropFilter }}>
            </div>
        </div>
    );
}

export { App };
