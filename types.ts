
export type Claim = {
    count: number,
    diceVal: number,
}

export type Player = {
    id: number,
    lives: number,
    claim: Claim,
    dice: number[],
}