import * as npc from './npc.js';
import { Claim, Player, Status } from './types.js';
import * as doc from './docInteraction.js';
import * as util from './util.js';

window.onload = letsGo;

let currentPlayer: Player;
let players: Player[] = new Array();
let currentNumPlayers: number;
let npcTimeout: number = 500;
let doubtTimeout: number = 500;
let newRoundTimeout: number = 500;
let DeathTimeout: number = 500;
let lossModeDice: boolean = false;

function letsGo() {
    doc.addDarkListener();
    doc.createRulesSection();
    doc.createGameChoices(startGame);
}

function npcTurn() {
    doc.deactivatePlayerTurnSection();
    setTimeout(() => {
        let c: Claim = npc.npcClaim(currentClaim(), currentPlayer.dice, getNumOtherDice(currentPlayer));
        if (c.diceVal == 0 && c.count == 0) {
            doubt();
        } else {
            claim(c);
        }
    }, npcTimeout);
}

function nextTurn() {
    doc.setPlayerStatus(prevPlayer(), Status.WAITING);
    currentPlayer = nextPlayer();
    doc.setPlayerStatus(currentPlayer, Status.THINKING);

    if (currentPlayer.id == 0) {
        playerTurn();
    } else {
        npcTurn();
    }
}

function doubt() {
    doc.appendInfoNewline(`${currentPlayer.name}: Doubt!`);
    doc.setPlayerStatus(currentPlayer, Status.DOUBT);
    for (const p of players) {
        doc.updatePlayerSection(p);
    }
    doc.updatePlayerSection(prevPlayer());
    doc.reveal(currentClaim().diceVal);
    setTimeout(() => {
        const tot = util.totalNumDiceOf(currentClaim().diceVal, diceVals());
        if (tot < currentClaim().count) {
            // Doubt justified
            doc.setPlayerStatus(currentPlayer, Status.HEH);
            let pp = prevPlayer();
            doc.appendInfoNewline(justifiedCallMsg(pp, tot));
            subtractLife(pp, currentClaim().count - tot);
            currentPlayer = prevPlayer();
            setTimeout(() => {
                doc.setPlayerStatus(nextPlayer(), Status.WAITING);
                startNewRound()
            }, doubtTimeout);
        } else {
            // Doubt unjustified
            doc.appendInfoNewline(noDoubtMsg(tot));
            doc.setPlayerStatus(prevPlayer(), Status.HEH);
            subtractLife(currentPlayer, tot - currentClaim().count);
            setTimeout(() => {
                doc.setPlayerStatus(prevPlayer(), Status.WAITING);
                startNewRound()
            }, doubtTimeout);
        }
        currentNumPlayers = players.filter(p => p.lives > 0).length;
    }, newRoundTimeout);
}

function subtractLife(p: Player, diff: number) {
    doc.setPlayerStatus(p, Status.OOPS);
    if (lossModeDice) {
        if (diff == 0) diff = 1;
        doc.appendInfoNewline(loseLifeMsg(p, Math.min(diff, p.lives)));
        p.lives -= diff;
        if (p.lives < 0) p.lives = 0;
    } else {
        p.lives -= 1;
        doc.appendInfoNewline(loseLifeMsg(p, 1));
    }
    doc.drawLives(p);
    if (p.lives == 0) {
        setTimeout(() => {
            doc.appendInfoNewline(elimMsg(p));
            doc.setPlayerStatus(p, Status.DEAD);
        }, DeathTimeout);
    }
}

function claim(claim: Claim) {
    currentPlayer.claim = claim;
    doc.appendInfoNewline(claimMsg(currentPlayer));
    doc.setPlayerStatus(currentPlayer, Status.CLAIM);
    doc.updatePlayerSection(prevPlayer());
    doc.updatePlayerSection(currentPlayer);
    nextTurn();
}

function playerTurn() {
    doc.appendInfoNewline(`Your turn..  `);
    doc.activatePlayerTurnSection(currentClaim(), claim, currentNumPlayers * 5);
}

function startNewRound() {
    doc.hide();
    if (players.filter(p => p.lives > 0).length == 1) {
        const winner = players.find(p => p.lives > 0);
        doc.clearInfo();
        doc.appendInfo(winnerMsg(winner));
        doc.setPlayerStatus(winner, Status.WINNER);
        doc.activateNewGameButton();
    } else {
        players.forEach((p) => {
            if (p.lives > 0) {
                if (lossModeDice) {
                    p.dice = util.rollNdice(p.lives);
                } else {
                    p.dice = util.roll5dice();
                }
            } else {
                p.dice = [];
            }
            doc.updatePlayerSection(p);
        });
        resetClaims();
        currentPlayer = prevPlayer();
        doc.appendInfoNewline(startRoundMsg(nextPlayer()));
        nextTurn();
    }
}

export function startGame() {
    doc.appendInfoNewline('Starting game...');

    let names = ['Stag', 'Fishy', 'Meow', 'Runner', 'Butterfly', 'Tank', 'Klaus']

    // permute the names
    for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [names[i], names[j]] = [names[j], names[i]];
    }
    names.push('You');

    const rButts = Array.from(document.getElementsByName('num-players')) as HTMLInputElement[];
    currentNumPlayers = Number(rButts.find(r => r.checked).value);

    const gameSpeed = Number((document.querySelector('input[name="game-speed"]:checked') as HTMLInputElement).value);
    npcTimeout = gameSpeed * 500;
    doubtTimeout = gameSpeed * 1000;
    DeathTimeout = gameSpeed * 1000;
    newRoundTimeout = gameSpeed * 1500;

    const lossModeThing = (document.querySelector('input[name="loss-mode"]:checked') as HTMLInputElement);
    console.log(lossModeThing.value);
    lossModeDice = lossModeThing.value == 'Dice';
    let numLives = lossModeDice ? 5 : 3;

    players = [];
    for (let i = 0; i < currentNumPlayers; i++) {
        players.push({name: names[7-i], id: i, lives: numLives, claim: {count: 0, diceVal: 0}, dice: []});
    }

    doc.activateMainSection();

    currentPlayer = players[Math.floor(Math.random() * currentNumPlayers)]
    createPlayerSections();
    doc.createPlayerTurnSection(doubt, claim, currentClaim());

    doc.hide();
    players.forEach((p) => {doc.updatePlayerSection(p)});

    startNewRound();
};

function createPlayerSections() {
    players.forEach((p) => {
        doc.createPlayerSection(p);
        doc.setPlayerStatus(p, Status.WAITING);
    });
}

function resetClaims() {
    players.forEach(p => p.claim = {count: 0, diceVal: 0});
}

function currentClaim() {
    return prevPlayer().claim;
}

function nextPlayer() {
    let curId = (currentPlayer.id + 1) % players.length;
    while (players[curId].lives <= 0) {
        curId = (curId + 1) % players.length;
    }
    return players[curId];
}

function prevPlayer() {
    let curId = (currentPlayer.id + players.length - 1) % players.length;
    
    while (players[curId].lives <= 0) {
        curId = (curId + players.length - 1) % players.length;
    }
    return players[curId];
}

function diceVals() {
    let diceVals = Array.from({length: players.length}, (_, i) => players[i].dice);
    return diceVals;
}

function justifiedCallMsg(pp: Player, tot: number) {
    return `Justified! Actual number of ${util.getDiceSymbol(currentClaim().diceVal)}: ${tot}`
}

function noDoubtMsg(tot: number) {
    return `${goodBidMsg(prevPlayer())} number of ${util.getDiceSymbol(currentClaim().diceVal)}: ${tot}`
}

function goodBidMsg(p: Player) {
    if (p.id == 0) return `Your bid was correct:`;
    return `${p.name}'s bid was correct:`;
}

function elimMsg(pp: Player) {
    if (pp.id == 0) return `You have been eliminated!`;
        else return `${pp.name} has been eliminated!`;
}

function winnerMsg(winner: Player) {
    if (winner.id == 0) return `You win!`;
        else return `${winner.name} wins!`;
}

function loseLifeMsg(loser: Player, num: number) {
    if (lossModeDice) {
        if (loser.id == 0) return `You lose ${num} dice!`;
        else return `${loser.name} loses ${num} dice!`;
    } 
    if (loser.id == 0) return `You lose a life!`;
    else return `${loser.name} loses a life!`;
}

function claimMsg(p: Player) {
    if (p.id == 0) return `You claim ${p.claim.count} ${util.getDiceSymbol(p.claim.diceVal)}`;
    return `${p.name} claims ${p.claim.count} ${util.getDiceSymbol(p.claim.diceVal)}`;
}

function startRoundMsg(p: Player) {
    if (p.id == 0) return `You start the round.`;
    return `${p.name} starts the round.`;
}

function getNumOtherDice(p: Player) {
    return players.filter(pl => pl.id != p.id && pl.lives > 0).map(pl => pl.dice).flat().length;
} 

