
export type Claim = {
    count: number,
    diceVal: number,
}

export type Player = {
    name: string,
    id: number,
    lives: number,
    claim: Claim,
    dice: number[],
}

export enum Status {
    WAITING = 'Waiting',
    THINKING = 'Thinking',
    CLAIM = 'Claim',
    DOUBT = 'Doubt',
    OOPS = 'Oops',
    HEH = 'Heh',
    DEAD = 'Dead',
    WINNER = 'Winner',
}