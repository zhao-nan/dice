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
function letsGo() {
    doc.addDarkListener();
    doc.createRulesSection();
    doc.createGameChoices(startGame);
}
function npcTurn() {
    doc.appendInfoNewline(`${currentPlayer.name}'s turn..  `);
    doc.deactivatePlayerTurnSection();
    setTimeout(() => {
        let c = npc.npcClaim(currentClaim(), currentPlayer.dice, getNumOtherDice(currentPlayer));
        if (c.count == 0) {
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
    doc.appendInfo('Doubt!');
    doc.setPlayerStatus(currentPlayer, Status.DOUBT);
    doc.reveal(currentClaim().diceVal);
    for (const p of players) {
        doc.updatePlayerSection(p);
    }
    doc.updatePlayerSection(prevPlayer());
    setTimeout(() => {
        const tot = util.totalNumDiceOf(currentClaim().diceVal, diceVals());
        if (tot < currentClaim().count) {
            // Doubt justified
            doc.setPlayerStatus(currentPlayer, Status.HEH);
            let pp = prevPlayer();
            doc.appendInfoNewline(justifiedCallMsg(pp, tot));
            subtractLife(pp);
            currentPlayer = prevPlayer();
            setTimeout(() => {
                doc.setPlayerStatus(nextPlayer(), Status.WAITING);
                startNewRound(prevPlayer());
            }, doubtTimeout);
        }
        else {
            // Doubt unjustified
            doc.appendInfoNewline(noDoubtMsg(tot));
            doc.setPlayerStatus(prevPlayer(), Status.HEH);
            subtractLife(currentPlayer);
            setTimeout(() => {
                doc.setPlayerStatus(prevPlayer(), Status.WAITING);
                startNewRound(currentPlayer);
            }, doubtTimeout);
        }
        currentNumPlayers = players.filter(p => p.lives > 0).length;
    }, newRoundTimeout);
}
function subtractLife(p) {
    doc.setPlayerStatus(p, Status.OOPS);
    p.lives -= 1;
    doc.drawLives(p);
    if (p.lives == 0) {
        setTimeout(() => {
            doc.appendInfo(elimMsg(p));
            doc.setPlayerStatus(p, Status.DEAD);
        }, DeathTimeout);
    }
}
function claim(claim) {
    doc.appendInfo(`Claim: ${claim.count} ${util.getDiceSymbol(claim.diceVal)}`);
    currentPlayer.claim = claim;
    doc.setPlayerStatus(currentPlayer, Status.CLAIM);
    doc.updatePlayerSection(prevPlayer());
    doc.updatePlayerSection(currentPlayer);
    nextTurn();
}
function playerTurn() {
    doc.appendInfoNewline(`Your turn..  `);
    doc.activatePlayerTurnSection(currentClaim(), claim, currentNumPlayers * 5);
}
function startNewRound(player) {
    doc.hide();
    doc.appendInfoNewline(`${player.name} starts the new round.`);
    if (players.filter(p => p.lives > 0).length == 1) {
        const winner = players.find(p => p.lives > 0);
        doc.appendInfo(winnerMsg(winner));
        doc.setPlayerStatus(winner, Status.WINNER);
        doc.activateNewGameButton();
    }
    else {
        players.forEach((p) => {
            if (p.lives > 0) {
                p.dice = util.roll5dice();
            }
            else {
                p.dice = [0, 0, 0, 0, 0];
            }
            doc.updatePlayerSection(p);
        });
        resetClaims();
        currentPlayer = prevPlayer();
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
    players = [];
    for (let i = 0; i < currentNumPlayers; i++) {
        players.push({ name: names[7 - i], id: i, lives: 3, claim: { count: 0, diceVal: 0 }, dice: util.roll5dice() });
    }
    doc.activateMainSection();
    currentPlayer = players[Math.floor(Math.random() * currentNumPlayers)];
    createPlayerSections(diceVals[0]);
    doc.createPlayerTurnSection(doubt, claim, currentClaim());
    doc.hide();
    players.forEach((p) => { doc.updatePlayerSection(p); });
    nextTurn();
}
;
function createPlayerSections(p1dice) {
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
    return `Justified! Actual number of ${util.getDiceSymbol(currentClaim().diceVal)}: ${tot}`;
}
function noDoubtMsg(tot) {
    return `${goodBidMsg(prevPlayer())} number of ${util.getDiceSymbol(currentClaim().diceVal)}: ${tot}`;
}
function goodBidMsg(p) {
    if (p.id == 0)
        return `Your bid was correct:`;
    return `${p.name}'s bid was correct:`;
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
function loseLifeMsg(loser) {
    if (loser.id == 0)
        return `You lose a life!`;
    else
        return `${loser.name} loses a life!`;
}
function getNumOtherDice(p) {
    return players.filter(pl => pl.id != p.id && pl.lives > 0).map(pl => pl.dice).flat().length;
}
//# sourceMappingURL=dice.js.map