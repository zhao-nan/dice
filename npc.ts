import { Claim } from './types.js';
import * as util from './util.js';

export function npcDecision(currentClaim: Claim, ownDice: number[], playerCount: number) : Claim {
    const prob = util.probOfClaim(currentClaim, ownDice, (playerCount - 1) * 5);
        const rand = Math.random();
        if (rand > prob) {
            console.log(`Doubting because prob is ${prob} and rand is ${rand}`);
            return {count: 0, diceVal: 0};
        } else {
            return npcClaim(currentClaim, ownDice, playerCount);
        }
    }

export function npcClaim(currentClaim: Claim, ownDice: number[], playerCount: number) : Claim{
    let freqs = getFreqs(ownDice);
    const { maxVal, idx: favorite } = 
        freqs.reduce((acc, val, i) => 
            val > acc.maxVal ? 
            { maxVal: val, idx: i } : 
            acc, { maxVal: -Infinity, idx: -1 });
    

    let retClaim: Claim;

    const rand = Math.random();
    if (currentClaim.count <= playerCount*5/3 && rand > 0.5) {
        // draw random number between 2 and 6
        let claimVal = Math.floor(Math.random() * 5) + 2;
        retClaim = {count: currentClaim.count + 1, diceVal: claimVal};
    } else {
        // claim favorite number
        retClaim = {count: currentClaim.count + 1, diceVal: favorite};
    }
    return retClaim;
}

function getFreqs(ownDice: number[]) {
    let freqs = Array.from({ length: 7 }, (_, i) => ownDice.filter(num => num === i).length);
    for (let i = 2; i <= 6; i++) {
        freqs[i] += freqs[1];
    }
    freqs[1] = 0;
    return freqs;
}