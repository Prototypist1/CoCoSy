import { Vote } from './types';
import { voterId } from './cookies';

export function consolidate(votes: Vote[]): [string, number][] {
    const counts = new Map<string, number>();
    for (const vote of votes) {
        counts.set(vote.voterId, (counts.get(vote.voterId) ?? 0) + 1);
    }
    return Array.from(counts.entries());
}

export function canRetractVote(otherSideVotes: Vote[]): string | undefined {
    for (const vote of otherSideVotes) {
        if (voterId === vote.voterId) return vote.voteId;
    }
    return undefined;
}
