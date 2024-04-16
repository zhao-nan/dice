import { Claim } from './types';

export function npcClaim(currentClaim: Claim, ownDice: number[], playerCount: number) : Claim{
    console.log('ownDice:', ownDice);
    let freqs = Array.from({ length: 7 }, (_, i) => ownDice.filter(num => num === i).length);
    for (let i = 2; i <= 6; i++) {
        freqs[i] += freqs[1];
    }
    freqs[1] = 0;
    console.log('freqs:', freqs);
    const { maxVal, idx: favorite } = 
        freqs.reduce((acc, val, i) => 
            val > acc.maxVal ? 
            { maxVal: val, idx: i } : 
            acc, { maxVal: -Infinity, idx: -1 });
    
    console.log(`NPC's favorite number is ${favorite}`);

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