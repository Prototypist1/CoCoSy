import { Box, Button, Chip, Stack, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { Reducer, useEffect, useMemo, useReducer } from 'react';
import * as signalR from "@microsoft/signalr";
import { v4 } from 'uuid';
import Grid from '@mui/material/Unstable_Grid2';
import { DragDropContext, Droppable, Draggable, ResponderProvided, DropResult } from "react-beautiful-dnd";

// TODO add to git

const voteLimit = 3;

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
    voteId: string
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
        if (array[index].voterId === element.voterId) {
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
            if (!TryRemove(target.againsts, vote)) {
                if (currentCount < voteLimit) {
                    target.supporters.push(vote);
                    activeByPlayer.set(vote.voterId, currentCount + 1);
                    target.support += now - voteAction.at;
                }
            } else {
                activeByPlayer.set(vote.voterId, currentCount - 1);
                target.support += now - voteAction.at;
            }
        } else {
            if (!TryRemove(target.supporters, vote)) {
                if (currentCount < voteLimit) {
                    target.againsts.push(vote);
                    activeByPlayer.set(vote.voterId, currentCount + 1);
                    target.support -= now - voteAction.at;
                }
            } else {
                activeByPlayer.set(vote.voterId, currentCount - 1);
                target.support -= now - voteAction.at;
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

function CanRetractVote(otherSideVotes :Vote[]): boolean {
    for (let otherSideVote of otherSideVotes) {
        if (voterId === otherSideVote.voterId) {
            return true;
        }
    }
    return false;
}

function App() {
    const { state, actions } = useAppState();

    // gross, refresh every second

    const currentVotes = state.options.map(x => x.againsts.filter(y => y.voterId === voterId).length + x.supporters.filter(y => y.voterId === voterId).length).reduce((x, y) => x + y, 0);

    const outOfVotes = currentVotes >= voteLimit;

    function maxSupport() {
        let maxFound = 10000;
        for (let option of state.options) {
            if (Math.abs(option.support) > maxFound) {
                maxFound = Math.abs(option.support)     
            }
        }
        return maxFound
    } 
    function onDragEnd(result: DropResult, provided: ResponderProvided) {
        if (!result.destination) {
            return;
        }
        actions.vote({
            at: Date.now(),
            optionName: result.source.droppableId,
            support: true,
            voterId: voterId,
            messageId: v4(),
            voteId: v4(),
        })
        actions.vote({
            at: Date.now(),
            optionName: result.destination.droppableId,
            support: false,
            voterId: voterId,
            messageId: v4(),
            voteId: v4(),
        })
    }
    return (
        <Stack
            direction="column"
            justifyContent="flex-start"
            alignItems="center"
            spacing={2}
            sx={{ width: 1 }}>
            <Typography variant="h1" /*component="h2"*/>
                CoCoSy
            </Typography>
            <DragDropContext onDragEnd={onDragEnd}>
                <Grid container columnSpacing={0} sx={{width:1}}>
                    {state.options.map(option => [
                        <Grid xs={5}> {/*people who voted against */}
                            <Droppable droppableId={option.name} direction="horizontal">
                                {(provided, snapshot) => (
                                    <Stack
                                        direction="row"
                                        justifyContent="flex-end"
                                        alignItems="baseline"
                                        spacing={2}
                                        useFlexGap={true}
                                        flexWrap="wrap"
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}>
                                            {option.againsts.map((against, index) =>
                                                <Draggable draggableId={against.voteId} index={index}>
                                                    {(provided, snapshot) => (
                                                        <Chip label={(state.players.get(against.voterId) ?? against.voterId) + (against.voteId)} sx={{ width: 150 }} ref={provided.innerRef}
                                                            {...provided.draggableProps}{...provided.dragHandleProps} />
                                                    )}
                                                </Draggable>
                                            )}
                                    </Stack>
                                )}
                                </Droppable>
                        </Grid>,
                        <Grid xs={2} > {/*buttons, name, number*/}
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="baseline"
                                spacing={2}>
                                <Button
                                    disabled={outOfVotes && !CanRetractVote(option.supporters)}
                                    onClick={() =>
                                        actions.vote({
                                            at: Date.now(),
                                            optionName: option.name,
                                            support: false,
                                            voterId: voterId,
                                            messageId: v4(),
                                            voteId: v4(),
                                        })
                                    }>{"<"}</Button>
                                <Typography>{option.name}</Typography> <Typography variant="h6"> {(option.support / 1000).toFixed()}</Typography>
                                <Button
                                    disabled={outOfVotes && !CanRetractVote(option.againsts)}
                                    onClick={() =>
                                        actions.vote({
                                            at: Date.now(),
                                            optionName: option.name,
                                            support: true,
                                            voterId: voterId,
                                            messageId: v4(),
                                            voteId: v4(),
                                        })
                                    }>{">"}</Button>
                            </Stack>
                        </Grid>,
                        <Grid xs={5}> {/*people who voted for*/}
                            <Stack
                                direction="row"
                                justifyContent="flex-start"
                                alignItems="baseline"
                                spacing={2}
                                useFlexGap={true}
                                flexWrap="wrap">
                                {option.supporters.map(supporter =>
                                    <Chip label={state.players.get(supporter.voterId) ?? supporter.voterId} sx={{ width: 150 }} />
                                )}
                            </Stack>
                        </Grid>,
                        <Grid xs={12} sx={{ backgroundColor: "black", height: "1px" }}>
                        </Grid>,
                        <Grid xs={Math.min(6, 6 + 6*(option.support / maxSupport()))} sx={{ height: "10px", transition: "width 1s linear" }}>
                        </Grid>,
                        <Grid xs={Math.min(6, 6*(-option.support / maxSupport()))} sx={{ backgroundColor: "lightgreen", height: "10px", transition: "width 1s linear" }}>
                        </Grid>,
                        <Grid xs={Math.min(6, 6*(option.support / maxSupport()))} sx={{ backgroundColor: "lightgreen", height: "10px", transition: "width 1s linear" }}>
                        </Grid>,
                        <Grid xs={Math.min(6, 6 - 6*(option.support / maxSupport()))} sx={{height: "10px", transition: "width 1s linear" }}>
                        </Grid>,
                    ]).flatMap(x=>x)}
                </Grid>
            </DragDropContext>
            <TextField
                value={state.toAdd}
                onChange={(value) => actions.setToAdd(value.target.value)}
            />
            <Button onClick={() => {
                actions.addOption({
                    at: Date.now(),
                    name: state.toAdd,
                    messageId: v4(),
                });
                actions.setToAdd("");
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
        </Stack>
    );
}

export { App };
