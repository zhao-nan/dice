import * as npc from './npc.js';
import { Status } from './types.js';
import * as doc from './docInteraction.js';
import * as util from './util.js';
window.onload = letsGo;
let currentPlayer;
let players = new Array();
let currentNumPlayers;
let npcTimeout = 500;
let doubtTimeout = 500;
let newRoundTimeout = 500;
let DeathTimeout = 500;
let lossModeDice = false;
function letsGo() {
    doc.addDarkListener();
    doc.createRulesSection();
    doc.createGameChoices(startGame);
}
function npcTurn() {
    doc.deactivatePlayerTurnSection();
    setTimeout(() => {
        let c = npc.npcClaim(currentClaim(), currentPlayer.dice, getNumOtherDice(currentPlayer));
        if (c.diceVal == 0 && c.count == 0) {
            doubt();
        }
        else {
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
    }
    else {
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
                startNewRound();
            }, doubtTimeout);
        }
        else {
            // Doubt unjustified
            doc.appendInfoNewline(noDoubtMsg(tot));
            doc.setPlayerStatus(prevPlayer(), Status.HEH);
            subtractLife(currentPlayer, tot - currentClaim().count);
            setTimeout(() => {
                doc.setPlayerStatus(prevPlayer(), Status.WAITING);
                startNewRound();
            }, doubtTimeout);
        }
        currentNumPlayers = players.filter(p => p.lives > 0).length;
    }, newRoundTimeout);
}
function subtractLife(p, diff) {
    doc.setPlayerStatus(p, Status.OOPS);
    if (lossModeDice) {
        if (diff == 0)
            diff = 1;
        doc.appendInfoNewline(loseLifeMsg(p, Math.min(diff, p.lives)));
        p.lives -= diff;
        if (p.lives < 0)
            p.lives = 0;
    }
    else {
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
function claim(claim) {
    currentPlayer.claim = claim;
    doc.appendInfoNewline(claimMsg(currentPlayer));
    doc.setPlayerStatus(currentPlayer, Status.CLAIM);
    doc.updatePlayerSection(prevPlayer());
    doc.updatePlayerSection(currentPlayer);
    nextTurn();
}
function playerTurn() {
    doc.appendInfoNewline(`Your turn..  `);
    doc.activatePlayerTurnSection(currentClaim(), claim, totalNumDice());
}
function startNewRound() {
    doc.hide();
    if (players.filter(p => p.lives > 0).length == 1) {
        const winner = players.find(p => p.lives > 0);
        doc.clearInfo();
        doc.appendInfo(winnerMsg(winner));
        doc.setPlayerStatus(winner, Status.WINNER);
        doc.activateNewGameButton();
    }
    else {
        players.forEach((p) => {
            if (p.lives > 0) {
                if (lossModeDice) {
                    p.dice = util.rollNdice(p.lives);
                }
                else {
                    p.dice = util.roll5dice();
                }
            }
            else {
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
    let names = ['Stag', 'Fishy', 'Meow', 'Runner', 'Butterfly', 'Tank', 'Klaus'];
    // permute the names
    for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [names[i], names[j]] = [names[j], names[i]];
    }
    names.push('You');
    const rButts = Array.from(document.getElementsByName('num-players'));
    currentNumPlayers = Number(rButts.find(r => r.checked).value);
    const gameSpeed = Number(document.querySelector('input[name="game-speed"]:checked').value);
    npcTimeout = gameSpeed * 500;
    doubtTimeout = gameSpeed * 1000;
    DeathTimeout = gameSpeed * 1000;
    newRoundTimeout = gameSpeed * 1500;
    const lossModeThing = document.querySelector('input[name="loss-mode"]:checked');
    console.log(lossModeThing.value);
    lossModeDice = lossModeThing.value == 'Dice';
    let numLives = lossModeDice ? 5 : 3;
    players = [];
    for (let i = 0; i < currentNumPlayers; i++) {
        players.push({ name: names[7 - i], id: i, lives: numLives, claim: { count: 0, diceVal: 0 }, dice: [] });
    }
    doc.activateMainSection();
    currentPlayer = players[Math.floor(Math.random() * currentNumPlayers)];
    createPlayerSections();
    doc.createPlayerTurnSection(doubt, claim, currentClaim());
    doc.hide();
    players.forEach((p) => { doc.updatePlayerSection(p); });
    startNewRound();
}
;
function createPlayerSections() {
    players.forEach((p) => {
        doc.createPlayerSection(p);
        doc.setPlayerStatus(p, Status.WAITING);
    });
}
function resetClaims() {
    players.forEach(p => p.claim = { count: 0, diceVal: 0 });
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
    let diceVals = Array.from({ length: players.length }, (_, i) => players[i].dice);
    return diceVals;
}
function justifiedCallMsg(pp, tot) {
    return `Justified! Actually only ${tot} ${util.getDiceSymbol(currentClaim().diceVal)}`;
}
function noDoubtMsg(tot) {
    return `${goodBidMsg(prevPlayer())}: Actually ${tot} ${util.getDiceSymbol(currentClaim().diceVal)}`;
}
function goodBidMsg(p) {
    if (p.id == 0)
        return `Your bid was correct`;
    return `${p.name}'s bid was correct`;
}
function elimMsg(pp) {
    if (pp.id == 0)
        return `You have been eliminated!`;
    else
        return `${pp.name} has been eliminated!`;
}
function winnerMsg(winner) {
    if (winner.id == 0)
        return `You win!`;
    else
        return `${winner.name} wins!`;
}
function loseLifeMsg(loser, num) {
    if (lossModeDice) {
        if (loser.id == 0)
            return `You lose ${num} dice!`;
        else
            return `${loser.name} loses ${num} dice!`;
    }
    if (loser.id == 0)
        return `You lose a life!`;
    else
        return `${loser.name} loses a life!`;
}
function claimMsg(p) {
    if (p.id == 0)
        return `You claim ${p.claim.count} ${util.getDiceSymbol(p.claim.diceVal)}`;
    return `${p.name} claims ${p.claim.count} ${util.getDiceSymbol(p.claim.diceVal)}`;
}
function startRoundMsg(p) {
    if (p.id == 0)
        return `You start the round.`;
    return `${p.name} starts the round.`;
}
function totalNumDice() {
    return players.map(p => p.dice).flat().length;
}
function getNumOtherDice(p) {
    return players.filter(pl => pl.id != p.id && pl.lives > 0).map(pl => pl.dice).flat().length;
}
//# sourceMappingURL=dice.js.map