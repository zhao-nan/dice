import { Claim } from './types.js';
import * as util from './util.js';

export function npcClaim(currentClaim: Claim, ownDice: number[], numOtherDice: number) : Claim {

    const rand = Math.random();
    // doubt if current claim is just too unlikely
    let prob = util.probOfClaim(currentClaim, ownDice, numOtherDice);
    if (prob < 0.5 && (rand - prob) > 0.5 || prob < 0.15) {
        return {count: 0, diceVal: 0};
    }

    let freqs = getFreqs(ownDice);
    let fav = freqs.indexOf(Math.max(...freqs));
    let val = freqs[fav];

    let stillEarly = currentClaim.count <= numOtherDice / 5;

    // bluffing bid
    let bluffFav = Math.floor(Math.random() * 6) + 1;
    while (bluffFav === val || bluffFav === 1) {
        bluffFav = Math.floor(Math.random() * 6) + 1;
    }
    let bluffVal = Math.floor(freqs[fav] + numOtherDice / 3 - Math.ceil(Math.random() * 4));
    let bluffClaim = {count: bluffVal, diceVal: bluffFav};
    let safe = safeClaim(currentClaim, numOtherDice, fav, val);

    if (stillEarly && rand > 0.5 && util.isGreater(bluffClaim, currentClaim)) {
        // can't read my poker face
        return bluffClaim;
    } else if (safe.count > 0) {
        // playing it safe
        return safe;
    } else {
        // no safe bet, so just go with the most likely
        const doubtRand = Math.random();
        if (doubtRand > prob) {
            console.log("doubting because of prob: " + prob + " and rand: " + doubtRand);
            return {count: 0, diceVal: 0};
        } else {
            let _count = fav > currentClaim.diceVal ? currentClaim.count : currentClaim.count + 1;
            let claim = {count: _count, diceVal: fav};
            return claim;
        }
    } 

}

function safeClaim(currentClaim: Claim, numOtherDice: number, diceVal: number, ownNumOf: number) {
    let expected = Math.floor(numOtherDice / 3) + ownNumOf;
    let safeClaim = {count: expected, diceVal: diceVal};
    if (util.isGreater(safeClaim, currentClaim)) {
        // pick number between current claim count and safeClaim count
        let claimCount = Math.ceil(Math.random() * (safeClaim.count - currentClaim.count)) + currentClaim.count;
        return {count: claimCount, diceVal: diceVal};
    } else {
        return {count: 0, diceVal: 0};
    }
}

function getFreqs(ownDice: number[]) {
    let freqs = Array.from({ length: 7 }, (_, i) => ownDice.filter(num => num === i).length);
    for (let i = 2; i <= 6; i++) {
        freqs[i] += freqs[1];
    }
    freqs[1] = 0;
    return freqs;
}