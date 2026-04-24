export type Vote = {
    voterId: string,
    voteId: string,
}

export type Yolo = {
    againsts: Vote[],
    name: string,
    supporters: Vote[],
    support: number,
}

export type VotesSubState = {
    options: Yolo[],
    time: number,
}

export type NamesSubState = {
    players: Map<string, string>,
}

export type State = {
    options: Yolo[],
    toAdd: string,
    yourName: string,
    time: number,
    players: Map<string, string>,
}

export type VoteAction = {
    voterId: string,
    optionName: string,
    at: number,
    support: boolean,
    messageId: string,
    voteId: string,
    add: boolean,
}

export type SetNameAction = {
    voterId: string,
    at: number,
    name: string,
    messageId: string,
}

export type AddOptionAction = {
    name: string,
    at: number,
    messageId: string,
}

export type Hello = {}
export type Clear = {}

export type Messages = {
    votes: Map<string, VoteAction>,
    namings: Map<string, SetNameAction>,
    options: Map<string, AddOptionAction>,
}
