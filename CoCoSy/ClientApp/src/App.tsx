import { Box, Button, Chip, Input, Stack, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { Reducer, useEffect, useMemo, useReducer, CSSProperties } from 'react';
import * as signalR from "@microsoft/signalr";
import { v4 } from 'uuid';
import Grid from '@mui/material/Unstable_Grid2';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Draggable } from './Draggable';
import { Droppable } from './Droppable';

const voteLimit = 3;

const glow = "255, 255, 255";
const topGradient = "174, 206, 214";
const botGradient = "223, 209, 185";
const shadow = "0, 0, 0";
const backdropFilter = "hue-rotate(-30deg) saturate(105%) brightness(110%) blur(10px)";

const buttonStyle = {
    fontFamily: 'font-awesome',
    color: 'rgb(255,255,255)',
    textShadow: `0 1px 5px rgb(${shadow}, .5)`,
    fontSize: '30px'
}

const baseStyle: CSSProperties = {
    fontFamily: "Roboto,Helvetica,Arial,sans-serif",
    overflowWrap: "break-word",
    userSelect: "none",
    padding: "8px",
    textShadow: `0px 1px 5px rbh(${glow}, 0.5)`,
    borderRadius: "15px",
    boxShadow: `inset 0px 1px 4px rgb(${glow},0.5), 0px 2px 7px rgb(${shadow},0.3), 0px 1px 2px rgb(${shadow},0.5)`,
    backdropFilter: backdropFilter
};

const optionSyle: CSSProperties = {
    ...baseStyle,
    fontSize: 18,
};

const chipStyle: CSSProperties = {
    ...optionSyle,
    maxWidth: 300,
};

type Vote =
    {
        voterId: string,
        voteId: string
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

const testState: State = {
    options: [],
    toAdd: "",
    yourName: "",
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

    const activeByPlayer = new Map<string, number>();
    for (let voteAction of votesAdded.sort((x, y) => x.at - y.at)) {

        const target = optionMap.get(voteAction.optionName)!;
        const vote = { voterId: voteAction.voterId, voteId: voteAction.voteId };
        var currentCount = activeByPlayer.get(vote.voterId) ?? 0;
        if (voteAction.support) {
            if (voteAction.add) {
                if (currentCount < voteLimit) {
                    target.supporters.push(vote);
                    activeByPlayer.set(vote.voterId, currentCount + 1);
                    target.support += now - voteAction.at;
                }
            } else {
                if (TryRemove(target.supporters, vote)) {
                    activeByPlayer.set(vote.voterId, currentCount - 1);
                    target.support -= now - voteAction.at;
                }
            }
        } else {
            if (voteAction.add) {
                if (currentCount < voteLimit) {
                    target.againsts.push(vote);
                    activeByPlayer.set(vote.voterId, currentCount + 1);
                    target.support -= now - voteAction.at;
                }
            } else {
                if (TryRemove(target.againsts, vote)) {
                    activeByPlayer.set(vote.voterId, currentCount - 1);
                    target.support += now - voteAction.at;
                }
            }
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
                dispatch((lastState) => ({ ...lastState, yourName: value }));
            }
        }
    }
}

const voterId: string = v4();

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

    // gross, refresh every second

    const currentVotes = state.options.map(x => x.againsts.filter(y => y.voterId === voterId).length + x.supporters.filter(y => y.voterId === voterId).length).reduce((x, y) => x + y, 0);

    const outOfVotes = currentVotes >= voteLimit;

    function maxSupport() {
        console.log("log please");
        let maxFound = 100000;
        for (let option of state.options) {
            if (Math.abs(option.support) > maxFound) {
                maxFound = Math.abs(option.support)
            }
        }
        return maxFound
    }
    function onDragEnd(event: DragEndEvent) {
        console.log("event", event)
        if (!event.over) {
            return;
        }
        const x = (event.active.id as string).indexOf("|");
        const voteId = (event.active.id as string).substring(0,x);
        const source = (event.active.id as string).substring(x+1);
        const sourceSupport = source.startsWith("+");
        actions.vote({
            at: Date.now(),
            optionName: source.substring(1),
            support: sourceSupport,
            voterId: voterId,
            messageId: v4(),
            voteId: voteId,
            add: false,
        })
        const destinationSupport = (event.over.id as string).startsWith("+");
        actions.vote({
            at: Date.now(),
            optionName: (event.over.id as string).substring(1),
            support: destinationSupport,
            voterId: voterId,
            messageId: v4(),
            voteId: voteId,
            add: true,
        })
        console.log("looking for |",voteId,source)
    }
    return (
        <Stack
            direction="column"
            justifyContent="flex-start"
            alignItems="center"
            spacing={2}
            sx={{ width: 1, background: `linear-gradient( 179.7deg, rgb(${topGradient},1) 0%, rgb(${botGradient},1) 100% )` }}>
            <Typography variant="h1" /*component="h2"*/ sx={{ backgroundColor: `rgb(${shadow},0.8)`, color: "transparent", textShadow: `0px 2px 3px rgb(${glow},0.5)`, backgroundClip: "text" }}>
                CoCoSy
            </Typography>
            <DndContext onDragEnd={onDragEnd}>
                <Grid container columnSpacing={0} sx={{ width: 1 }}>
                    {state.options.map(option => [
                        <Grid xs={4.5}> {/*people who voted against */}
                            <Droppable id={"-" + option.name} >
                                    <Stack
                                        sx={{ height: "100%" }}
                                        padding={1}
                                        direction="row"
                                        justifyContent="flex-end"
                                        alignItems="stretch"
                                        spacing={1}
                                        useFlexGap={true}
                                        flexWrap="wrap" >
                                    {option.againsts.map((against, index) =>
                                        <Draggable id={against.voteId + "|-" + option.name} disabled={voterId !== against.voterId}>
                                            <div style={chipStyle}> {state.players.get(against.voterId) ?? against.voterId} </div>
                                        </Draggable>
                                    )}
                                    </Stack>
                            </Droppable>
                        </Grid>,
                        <Grid xs={3} sx={optionSyle}> {/*buttons, name, number*/}
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="baseline"
                                spacing={2}>
                                <Button
                                    disabled={outOfVotes && (CanRetractVote(option.supporters) === undefined)}
                                    sx={buttonStyle}
                                    onClick={() => {
                                        const retractVote = CanRetractVote(option.supporters);
                                        if (retractVote !== undefined) {
                                            actions.vote({
                                                at: Date.now(),
                                                optionName: option.name,
                                                support: true,
                                                voterId: voterId,
                                                messageId: v4(),
                                                voteId: retractVote,
                                                add: false,
                                            })
                                        } else {
                                            actions.vote({
                                                at: Date.now(),
                                                optionName: option.name,
                                                support: false,
                                                voterId: voterId,
                                                messageId: v4(),
                                                voteId: v4(),
                                                add: true,
                                            })
                                        }
                                    }}>{"\uf137"}</Button>
                                <Typography variant="h5" overflow="hidden" textOverflow="ellipsis" sx={{overflowWrap:"break-word"}} textAlign="center"> {option.name} </Typography> {/* <Typography variant="h6"> {(option.support / 1000).toFixed()}</Typography> */}
                                <Button
                                    disabled={outOfVotes && !CanRetractVote(option.againsts)}
                                    sx={buttonStyle}
                                    onClick={() => {
                                        const retractVote = CanRetractVote(option.againsts);
                                        if (retractVote !== undefined) {
                                            actions.vote({
                                                at: Date.now(),
                                                optionName: option.name,
                                                support: false,
                                                voterId: voterId,
                                                messageId: v4(),
                                                voteId: retractVote,
                                                add: false,
                                            })
                                        } else {
                                            actions.vote({
                                                at: Date.now(),
                                                optionName: option.name,
                                                support: true,
                                                voterId: voterId,
                                                messageId: v4(),
                                                voteId: v4(),
                                                add: true,
                                            })
                                        }
                                    }}>{"\uf138"}</Button>
                            </Stack>
                        </Grid>,
                        <Grid xs={4.5}> {/*people who voted for*/}
                            <Droppable id={"+" + option.name} >
                                <Stack
                                    sx={{ height: "100%", paddingBottom: 2}}
                                    padding={1}
                                    direction="row"
                                    justifyContent="flex-start"
                                    alignItems="baseline"
                                    spacing={1}
                                    useFlexGap={true}
                                    flexWrap="wrap" >
                                    {option.supporters.map((supporter, index) =>
                                        <Draggable id={supporter.voteId + "|+" + option.name} disabled={voterId !== supporter.voterId } >
                                            <div style={chipStyle}> {state.players.get(supporter.voterId) ?? supporter.voterId} </div>
                                        </Draggable>
                                    )}
                                </Stack>
                            </Droppable>
                        </Grid>,
                        <Grid xs={Math.min(6, 6 + 6 * (option.support / maxSupport()))} sx={{ transition: "width 1s linear" }} paddingY={0.5}>
                        </Grid>, /*against progress bar*/
                        <Grid xs={Math.min(6, 6 * (-option.support / maxSupport()))} sx={{ backdropFilter: backdropFilter, transition: "width 1s linear", borderRadius: 5 }} paddingY={0.5}>
                        </Grid>, /*for progress bar*/
                        <Grid xs={Math.min(6, 6 * (option.support / maxSupport()))} sx={{ backdropFilter: backdropFilter, transition: "width 1s linear", boxShadow: `inset 0px -1px 3px rgb(${shadow},1), 0px 0px 6px rgb(${glow},0.2)`, borderRadius: 5 }} paddingY={0.5}>
                        </Grid>,
                        <Grid xs={Math.min(6, 6 - 6 * (option.support / maxSupport()))} sx={{ transition: "width 1s linear" }} paddingY={0.5}>
                        </Grid>,
                        <Grid xs={12} padding={0.5}>
                        </Grid>,
                    ]).flatMap(x => x)}
                </Grid>
            </DndContext>
            <input type="text" style={{ backgroundColor: `rgb(${shadow},0.1)`, border: 0, borderRadius: 5, boxShadow: `inset 0px 1px 3px rgb(${shadow},0.5)`, padding: 10 }}/>
            <TextField
                value={state.toAdd}
                onChange={(value) => actions.setToAdd(value.target.value)}
                
            />
            <Button onClick={() => {
                if (state.toAdd !== "") {
                    actions.addOption({
                        at: Date.now(),
                        name: state.toAdd,
                        messageId: v4(),
                    });
                    actions.setToAdd("");
                }
            }}>Add Option</Button>
            <TextField
                value={state.yourName}
                onChange={(value) => actions.setYourName(value.target.value)}
            />
            <Button onClick={() => {
                actions.setName({
                    at: Date.now(),
                    name: state.yourName,
                    voterId: voterId,
                    messageId: v4(),
                });
            }}>Set Name</Button>
            <Button onClick={() => actions.clear()}>Clear</Button>

            <div style={{padding: 10, borderRadius: 5, boxShadow: `inset 1px 1px 4px rgb(${glow},0.5), 0px 2px 7px rgb(${shadow},0.3), 0px 1px 2px rgb(${shadow},0.5)` }} > hello world
            </div>
            <div style={{ width: 100, height: 100, backgroundColor: botGradient, backdropFilter: backdropFilter }}> 
            </div>
        </Stack>
    );
}

export { App };
