import { Button, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { Reducer, useEffect, useMemo, useReducer, useState } from 'react';
import * as signalR from "@microsoft/signalr";
import { v4 } from 'uuid';

// TODO add to git

type Vote =
    {
        id: string
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
    id: string,
    optionName: string,
    at: number,
    support: boolean,
}

type SetNameAction =
    {
        id: string,
        at: number,
        name: string;
    }

type AddOptionAction = {
    name: string;
    at: number,
}

function getUniqueStrings(list: string[]): string[] {
    const uniqueStrings: string[] = [];
    for (const str of list) { 
        if (!uniqueStrings.includes(str)) {
            uniqueStrings.push(str);
        }
    }
    return uniqueStrings;
}

function compareDates(a: Date, b: Date): number {
    return a.getTime() - b.getTime();
}

function TryRemove(array: Vote[], element: Vote): boolean {
    for (let index = 0; index < array.length; index++) {
        if (array[index].id === element.id) {
            array.splice(index, 1);
            return true;
        }
    }
    return false;
}

function buildState2(namings: SetNameAction[]): NamesSubState {
    const players = new Map<string, string>();

    for (let naming of namings.sort((x, y) => x.at- y.at)) {
        players.set(naming.id, naming.name);
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
        const vote = { id: voteAction.id };
        var currentCount = activeByPlayer.get(vote.id) ?? 0;
        if (voteAction.support) {
            if (!TryRemove(target.againsts, vote)) {
                if (currentCount < 3) {
                    target.supporters.push(vote);
                    activeByPlayer.set(vote.id, currentCount + 1);
                    target.support += now - voteAction.at;
                }
            } else {
                activeByPlayer.set(vote.id, currentCount - 1);
                target.support += now - voteAction.at;
            }
        } else {
            if (!TryRemove(target.supporters, vote)) {
                if (currentCount < 3) {
                    target.againsts.push(vote);
                    activeByPlayer.set(vote.id, currentCount + 1);
                    target.support -= now - voteAction.at;
                }
            } else {
                activeByPlayer.set(vote.id, currentCount - 1);
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
    votes: VoteAction[],
    namings: SetNameAction[],
    options: AddOptionAction[]
}


const reducer: Reducer<State, (last: State) => State> = (state, action) => {
    console.log("teducer");
    return action(state);
};

function buildNetworkStateFromMessages(messages: Messages, last: State): State {
    return {
        ...last,
        ...buildState(messages.votes, messages.options),
        ...buildState2(messages.namings)
    }
}

const useAppState = () => {
    const [state, dispatch] = useReducer(reducer, testState);
    console.log("useAppState");

    const { vote, setName, addOption, refresh } = useMemo(() => {
        console.log("useMemo");

        const connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7277/relayhub", { withCredentials: false })
        .configureLogging(signalR.LogLevel.Information)
        .build()

        const messages: Messages = {
            votes: [],
            namings: [],
            options: []
        }
        connection.on("VoteAction", (action) => {
            console.log("got VoteAction message", action);
            messages.votes.push(action);
            dispatch(lastState => buildNetworkStateFromMessages(messages, lastState));
        });
        connection.on("SetNameAction", (action) => {
            console.log("got SetNameAction message", action);
            messages.namings.push(action);
            dispatch(lastState => buildNetworkStateFromMessages(messages, lastState));
        });
        connection.on("AddOptionAction", (action) => {
            console.log("got AddOptionAction message", action);
            messages.options.push(action);
            dispatch(lastState => buildNetworkStateFromMessages(messages, lastState));
        });


        // we need to rebuild constantly...

        async function start() {
            try {
                await connection.start();
                console.log("SignalR Connected.");
                // say hello
                // pull all messages
            } catch (err) {
                console.log(err);
                setTimeout(start, 5000);
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
            await start();
        });

        return {
            vote: async (action: VoteAction) => {
                console.log("sending VoteAction", action);
                try {
                    connection.invoke("VoteAction", action);
                } catch (error){
                    console.error("could not invoke VoteAction", error);
                }
            },
            setName: async (action: SetNameAction) => {
                console.log("sending SetNameAction", action);
                try {
                    connection.invoke("SetNameAction", action);
                } catch (error) {
                    console.error("could not invoke SetNameAction", error);
                }
            },
            addOption: async (action: AddOptionAction) => {
                console.log("sending AddOptionAction", action);
                try {
                    connection.invoke("AddOptionAction", action);
                } catch (error) {
                    console.error("could not invoke AddOptionAction", error);
                }
            },
            refresh: () => dispatch(lastState => buildNetworkStateFromMessages(messages, lastState))
        };
    }
    ,[]);

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
            setToAdd: (value: string) => {
                console.log("setToAdd:" + value);
                return dispatch((lastState) => ({ ...lastState, toAdd: value }))
            },
            setYourName: (value: string) => {
                console.log("setYourName");
                dispatch((lastState) => ({ ...lastState, yourName: value }));
            }
        }
    }
}

const id: string = v4();

//type CountUpParams = {
//    time: number,
//    multiplyer: number,
//    base: number,
//}

//function CountUp(params: CountUpParams) {

//    const [timeLeft, setTimeLeft] = useState(0);

//    useEffect(() => {
//        const timer = setTimeout(() => {
//            setTimeLeft(calculateTimeLeft());
//        }, 1000);

//        return () => clearTimeout(timer);
//    });

//    return <Typography>{params.base + params.multiplyer * (Date.now() - params.time)}</Typography>;
//}

function App() {
    console.log("App");
    const { state, actions } = useAppState();

    // gross, refresh every second


    return (
        <>
            <Typography variant="h1" component="h2">
                CoCoSy
            </Typography >
            <TextField
                value={state.toAdd}
                onChange={(value) => actions.setToAdd(value.target.value)}
            />
            <Button onClick={() => {
                actions.addOption({
                    at: Date.now(),
                    name: state.toAdd
                });
                actions.setToAdd("");
            }}>Add Option</Button>
            {state.options.map(option =>
                <div>
                    <Typography>{option.name} {option.support}</Typography>
                    <Button onClick={() => 
                        actions.vote({
                            at: Date.now(),
                            optionName: option.name,
                            support: false,
                            id: id
                        })
                    }>{"<"}</Button>
                    {option.againsts.map(against =>
                        <Typography>{"<"}{state.players.get(against.id) ?? against.id }</Typography>
                    )}
                    <Button onClick={() =>
                        actions.vote({
                            at: Date.now(),
                            optionName: option.name,
                            support: true,
                            id: id
                        })}>{">"}</Button>
                    {option.supporters.map(supporter =>
                        <Typography>{">"}{state.players.get(supporter.id) ?? supporter.id}</Typography>
                    )}
                </div>
            )}
            <TextField
                value={state.yourName}
                onChange={(value) => actions.setYourName(value.target.value)}
            />
            <Button onClick={() => {
                actions.setName({
                    at: Date.now(),
                    name: state.yourName,
                    id: id
                });
            }}>Set Name</Button>
        </>
    );
}



export { App };
