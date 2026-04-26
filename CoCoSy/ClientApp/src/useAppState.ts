import { Reducer, useEffect, useMemo, useReducer } from 'react';
import * as signalR from "@microsoft/signalr";
import { v4 } from 'uuid';
import { getCookie, setCookie, voterId } from './cookies';
import {
    State, Yolo, Vote, VoteAction, SetNameAction, AddOptionAction, SetGameNameAction,
    VotesSubState, NamesSubState, Messages, Hello
} from './types';

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

function buildNamesState(namings: SetNameAction[]): NamesSubState {
    const players = new Map<string, string>();
    for (let naming of namings.sort((x, y) => x.at - y.at)) {
        players.set(naming.voterId, naming.name);
    }
    return { players };
}

function buildVotesState(votesAdded: VoteAction[], optionsAdded: AddOptionAction[]): VotesSubState {
    const now = Date.now();
    const optionMap = new Map<string, Yolo>();

    for (let optionName of getUniqueStrings(optionsAdded.map(x => x.name))) {
        optionMap.set(optionName, { name: optionName, againsts: [], supporters: [], support: 0 });
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
                    console.log(`couldn't remove vote id ${vote.voteId}`);
                }
            }
        } else {
            if (voteAction.add) {
                target.againsts.push(vote);
            } else {
                if (!TryRemove(target.againsts, vote)) {
                    console.log(`couldn't remove vote id ${vote.voteId}`);
                }
            }
        }
    }

    const votesByPlayer = new Map<string, number>();
    for (let yolo of Array.from(optionMap.values())) {
        for (let vote of yolo.supporters) {
            votesByPlayer.set(vote.voterId, (votesByPlayer.get(vote.voterId) ?? 0) + 1);
        }
        for (let vote of yolo.againsts) {
            votesByPlayer.set(vote.voterId, (votesByPlayer.get(vote.voterId) ?? 0) + 1);
        }
    }

    for (let yolo of Array.from(optionMap.values())) {
        for (let vote of yolo.supporters) {
            // @ts-expect-error
            yolo.support += 1.0 / votesByPlayer.get(vote.voterId);
        }
        for (let vote of yolo.againsts) {
            // @ts-expect-error
            yolo.support -= 1.0 / votesByPlayer.get(vote.voterId);
        }
    }

    return { options: Array.from(optionMap.values()), time: now };
}

function buildGameName(gameNames: SetGameNameAction[]): string {
    return gameNames.reduce<SetGameNameAction | null>((best, g) =>
        g.at > (best?.at ?? -Infinity) ? g : best, null)?.name ?? '';
}

function buildNetworkState(messages: Messages, last: State): State {
    return {
        ...last,
        ...buildVotesState(Array.from(messages.votes.values()), Array.from(messages.options.values())),
        ...buildNamesState(Array.from(messages.namings.values())),
        gameName: buildGameName(Array.from(messages.gameNames.values())),
    };
}

const reducer: Reducer<State, (last: State) => State> = (state, action) => action(state);

const initialState: State = {
    options: [],
    toAdd: "",
    yourName: getCookie('playerName'),
    gameName: '',
    time: Date.now(),
    players: new Map<string, string>(),
};

function getOrCreateGameId(): string {
    const path = window.location.pathname.slice(1);
    if (path) return path;
    const gameId = v4();
    window.history.replaceState(null, '', `/${gameId}`);
    return gameId;
}

export const gameId = getOrCreateGameId();

export const useAppState = () => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const { vote, setName, addOption, setGameName, refresh } = useMemo(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`https://localhost:7277/relayhub?gameId=${gameId}`, {
                withCredentials: false,
                transport: signalR.HttpTransportType.WebSockets,
                skipNegotiation: true,
            })
            // use on local: https://localhost:7277/relayhub
            // use in azure: /relayhub
            .configureLogging(signalR.LogLevel.Information)
            .build();

        const messages: Messages = {
            votes: new Map<string, VoteAction>(),
            namings: new Map<string, SetNameAction>(),
            options: new Map<string, AddOptionAction>(),
            gameNames: new Map<string, SetGameNameAction>(),
        };

        connection.on("VoteAction", (action) => {
            if (messages.votes.get(action.messageId) === undefined) {
                messages.votes.set(action.messageId, action);
                dispatch(last => buildNetworkState(messages, last));
            }
        });
        connection.on("SetNameAction", (action) => {
            if (messages.namings.get(action.messageId) === undefined) {
                messages.namings.set(action.messageId, action);
                dispatch(last => buildNetworkState(messages, last));
            }
        });
        connection.on("AddOptionAction", (action) => {
            if (messages.options.get(action.messageId) === undefined) {
                messages.options.set(action.messageId, action);
                dispatch(last => buildNetworkState(messages, last));
            }
        });
        connection.on("SetGameNameAction", (action) => {
            if (messages.gameNames.get(action.messageId) === undefined) {
                messages.gameNames.set(action.messageId, action);
                dispatch(last => buildNetworkState(messages, last));
            }
        });
async function start() {
            try {
                await connection.start();
messages.votes = new Map<string, VoteAction>();
                messages.namings = new Map<string, SetNameAction>();
                messages.options = new Map<string, AddOptionAction>();
                messages.gameNames = new Map<string, SetGameNameAction>();
                const hello: Hello = {};
                await connection.invoke("Hello", hello);
                const name = getCookie('playerName');
                if (name) {
                    await connection.invoke("SetNameAction", { voterId, at: Date.now(), name, messageId: v4() });
                }
            } catch (err) {
                console.log(err);
            }
        }

        start();

        connection.onclose(async () => {});

        return {
            vote: async (action: VoteAction) => {
                try {
                    await connection.invoke("VoteAction", action);
                } catch (error) {
                    console.error("could not invoke VoteAction", error);
                }
            },
            setName: async (action: SetNameAction) => {
                try {
                    await connection.invoke("SetNameAction", action);
                } catch (error) {
                    console.error("could not invoke SetNameAction", error);
                }
            },
            addOption: async (action: AddOptionAction) => {
                try {
                    await connection.invoke("AddOptionAction", action);
                } catch (error) {
                    console.error("could not invoke AddOptionAction", error);
                }
            },
            setGameName: async (action: SetGameNameAction) => {
                try {
                    await connection.invoke("SetGameNameAction", action);
                } catch (error) {
                    console.error("could not invoke SetGameNameAction", error);
                }
            },
            refresh: () => dispatch(last => buildNetworkState(messages, last)),
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => refresh(), 1000);
        return () => clearTimeout(timer);
    });

    return {
        state,
        actions: {
            vote,
            setName,
            addOption,
            setGameName,
            setToAdd: (value: string) => dispatch(last => ({ ...last, toAdd: value })),
            setYourName: (value: string) => {
                setCookie('playerName', value);
                dispatch(last => ({ ...last, yourName: value }));
            },
        },
    };
};
