import { Claim } from './types.js';
import * as util from './util.js';

export function npcDecision(currentClaim: Claim, ownDice: number[], numOtherDice: number) : Claim {
    return npcClaim(currentClaim, ownDice, numOtherDice);
}

function npcClaim(currentClaim: Claim, ownDice: number[], numOtherDice: number) : Claim {

    let freqs = getFreqs(ownDice);
    let fav = freqs.indexOf(Math.max(...freqs));
    let val = freqs[fav];

    let stillEarly = currentClaim.count <= numOtherDice / 5;
    const rand = Math.random();

    // bluffing bid
    let bluffFav = Math.floor(Math.random() * 6) + 1;
    while (bluffFav === val || bluffFav === 1) {
        bluffFav = Math.floor(Math.random() * 6) + 1;
    }
    let bluffVal = Math.floor(freqs[fav] + numOtherDice / 3 - Math.floor(Math.random() * 3));
    let bluffClaim = {count: bluffVal, diceVal: bluffFav};
    let safe = safeClaim(currentClaim, numOtherDice, fav, val);

    if (stillEarly && rand > 0.5 && util.isGreater(bluffClaim, currentClaim)) {
        console.log("bluffing: " + bluffClaim.count + " " + bluffClaim.diceVal);
        return bluffClaim;
    } else if (safe.count > 0) {
        return safe;
    } else {
        console.log("no safe claim, dounting or hoping");
        const doubtRand = Math.random();
        if (doubtRand > 0.5) {
            return {count: 0, diceVal: 0};
        } else {
            let _count = fav > currentClaim.diceVal ? currentClaim.count : currentClaim.count + 1;
            let claim = {count: _count, diceVal: fav};
            return claim;
        }
    } 

}

function safeClaim(currentClaim: Claim, numOtherDice: number, fav: number, val: number) {
    console.log("safeClaim: " + fav + " " + val + " " + numOtherDice);
    let expected = Math.floor(numOtherDice / 3) + val;
    let safeClaim = {count: val + expected, diceVal: fav};
    if (util.isGreater(safeClaim, currentClaim)) {
        // pick number between current claim count and safeClaim count
        console.log("safeClaim: " + safeClaim.count + " " + safeClaim.diceVal);
        console.log("picking random number between " + currentClaim.count + " and " + safeClaim.count);
        let claimCount = Math.ceil(Math.random() * (safeClaim.count - currentClaim.count)) + currentClaim.count - 1;
        console.log("picked " + claimCount);
        return {count: claimCount, diceVal: fav};
    } else {
        console.log("deemed not safe")
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