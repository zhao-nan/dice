import { Claim } from './types.js';

export function roll5dice() {
    return Array.from({length: 5}, () => Math.floor(Math.random() * 6) + 1);
}

export function isGreater(thisClaim: Claim, other: Claim) {
    return thisClaim.count > other.count || (thisClaim.count == other.count && thisClaim.diceVal > other.diceVal);
}

export function probOfClaim(claim: Claim, ownDice: number[], numOtherDice: number) {
    let val = claim.diceVal;
    let own = ownDice.filter(d => d == val || d == 1).length;
    return probOfAtLeast(claim.count - own, numOtherDice);
}

// probability of at least k dice that show a number or 1 (in n dice)
export function probOfAtLeast(k: number, n: number) {
    let prob = 0;
    for (let i = k; i <= n; i++) {
        prob += binomial(n, i) * Math.pow(1/3, i) * Math.pow(2/3, n-i);
    }
    console.log('Prob of at least ' + k + ' dice: ' + prob);
    return prob;
}

export function binomial(n: number, k: number) {
    var coeff = 1;
    for (var x = n - k + 1; x <= n; x++) coeff *= x;
    for (x = 1; x <= k; x++) coeff /= x;
    return coeff;
}

export function getDiceImgSrc(diceVal: number) {
    return 'img/dice' + diceVal + '.png';
}

export function totalNumDiceOf(diceVal: number, diceVals: number[][]) {
    const dice = diceVals.flat();
    return dice.filter(d => d == diceVal || d == 1).length;
}

export function playerDieImgId(playerNum: number, dieNum: number) {
    return 'playerDieImg-' + playerNum + '-' + dieNum;
} 