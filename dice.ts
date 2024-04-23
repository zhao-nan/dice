import * as npc from './npc.js';
import { Claim, Player } from './types.js';
import * as doc from './docInteraction.js';
import * as util from './util.js';

window.onload = letsGo;

let currentPlayer: Player;
let players: Player[] = new Array();
let currentNumPlayers: number;
let npcTimeout: number = 500;
let doubtTimeout: number = 500;
let newRoundTimeout: number = 500;

function letsGo() {
    doc.createRulesSection();
    doc.createGameChoices(startGame);
}

function npcTurn() {
    doc.setInfoMsg(`Player ${currentPlayer.id}'s turn!`); 
    doc.deactivatePlayerTurnSection();
    setTimeout(() => {
        let c: Claim = npc.npcDecision(currentClaim(), currentPlayer.dice, currentNumPlayers);
        if (c.count == 0) {
            doubt();
        } else {
            claim(c);
        }
    }, npcTimeout);
}

function nextTurn() {
    doc.setPlayerStatus(prevPlayer().id, 'Waiting');
    currentPlayer = nextPlayer();

    if (currentPlayer.id == 0) {
        playerTurn();
    } else {
        npcTurn();
    }
}

function doubt() {
    doc.setInfoMsg(initialDoubtMsg());
    doc.setPlayerStatus(currentPlayer.id, 'Doubt');
    for (const p of players) {
        doc.updatePlayerSection(p, false, true);
    }
    setTimeout(() => {
        const tot = util.totalNumDiceOf(currentClaim().diceVal, diceVals());
        if (tot < currentClaim().count) {
            // Claim successful
            let pp = prevPlayer();
            doc.setInfoMsg(justifiedCallMsg(pp, tot));
            pp.lives -= 1;
            doc.drawLives(pp);
            if (pp.lives <= 0) {
                doc.setInfoMsg(elimMsg(pp));
                doc.setPlayerStatus(pp.id, 'dead');
            }
            currentPlayer = prevPlayer();
            setTimeout(() => {
                startNewRound(prevPlayer())
            }, doubtTimeout);
        } else {
            // Claim unsuccessful
            doc.setInfoMsg(noDoubtMsg(tot));
            currentPlayer.lives -= 1;
            doc.drawLives(currentPlayer);
            if (currentPlayer.lives <= 0) {
                doc.setInfoMsg(elimMsg(currentPlayer));
                doc.setPlayerStatus(currentPlayer.id, 'dead');
                currentPlayer = nextPlayer();
            }
            setTimeout(() => {
                startNewRound(currentPlayer)
            }, doubtTimeout);
        }
        currentNumPlayers = players.filter(p => p.lives > 0).length;
    }, newRoundTimeout);
}

function claim(claim: Claim) {
    currentPlayer.claim = claim;
    doc.setPlayerStatus(currentPlayer.id, 'Claim');
    doc.updatePlayerSection(prevPlayer(), false, false);
    doc.updatePlayerSection(currentPlayer, true, false);
    nextTurn();
}

function playerTurn() {
    doc.setInfoMsg(`Your turn!`);
    doc.activatePlayerTurnSection(currentClaim());
    updatePlayerTurnSection();
}

function startNewRound(player: Player) {
    doc.setInfoMsg(`Starting new round with ${currentNumPlayers} players! Starting: Player ${player.id}`);
    if (players.filter(p => p.lives > 0).length == 1) {
        const winner = players.find(p => p.lives > 0);
        doc.setInfoMsg('Player ' + winner.id + ' wins!');
        doc.setPlayerStatus(winner.id, 'Winner!');
        doc.activateNewGameButton();
    } else {
        players.forEach((p) => {
            if (p.lives > 0) {
                p.dice = util.roll5dice();
            } else {
                p.dice = [0, 0, 0, 0, 0];
            }
            if (p.id == 0) {
                doc.updatePlayerSection(p, false, true);
            } else {
                doc.updatePlayerSection(p, false, false);
            }
        });
        resetClaims();
        currentPlayer = prevPlayer();
        nextTurn();
    }
}

export function startGame() {
    doc.setInfoMsg('Starting game...');

    const rButts = Array.from(document.getElementsByName('num-players')) as HTMLInputElement[];
    currentNumPlayers = Number(rButts.find(r => r.checked).value);

    const gameSpeed = Number((document.querySelector('input[name="game-speed"]:checked') as HTMLInputElement).value);
    npcTimeout = gameSpeed * 500;
    doubtTimeout = gameSpeed * 1000;
    newRoundTimeout = gameSpeed * 1500;
    console.log(npcTimeout, doubtTimeout, newRoundTimeout);
    players = [];
    for (let i = 0; i < currentNumPlayers; i++) {
        players.push({id: i, lives: 3, claim: {count: 0, diceVal: 0}, dice: util.roll5dice()});
    }

    doc.activateMainSection();

    currentPlayer = players[Math.floor(Math.random() * currentNumPlayers)]
    createPlayerSections(currentNumPlayers, diceVals[0]);
    doc.createPlayerTurnSection(doubt, claim, currentClaim());

    players.forEach((p) => {doc.updatePlayerSection(p, false, false)});

    nextTurn();
};


function updatePlayerTurnSection() {
    const slider = document.getElementById('claim-slider') as HTMLInputElement;
    const minVal = Math.max(currentClaim().count, 1);
    slider.min = minVal.toString();
    slider.max = (currentNumPlayers * 5).toString();
    slider.value = minVal.toString();
    document.getElementById('claim-slider-label').textContent = slider.value;
    const doubtButton = document.getElementById('doubt-section').querySelector('button');
    doubtButton.disabled = currentClaim().count == 0;
    doc.updateClaimEventListeners(claim, currentClaim());
    doc.updateClaimButton(currentClaim());
}

function createPlayerSections(numPlayers: number, p1dice: number[]) {
    for (let i = 0; i < numPlayers; i++) {
        doc.createPlayerSection(i);
        doc.setPlayerStatus(i, 'waiting');
    }
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

function initialDoubtMsg() {
    return `Player ${currentPlayer.id} doubts Player ${prevPlayer().id}'s claim of <br>
    ${currentClaim().count} ${util.getDiceSymbol(currentClaim().diceVal)} !`
}

function justifiedCallMsg(pp: Player, tot: number) {
    return `Justified call! Claim was <br>
     ${currentClaim().count} ${util.getDiceSymbol(currentClaim().diceVal)} <br>
        but total was only ${tot}. Player ${pp.id} loses a life!`;
}

function noDoubtMsg(tot: number) {
    return `Player ${prevPlayer().id} was correct: Claim was <br>
    ${currentClaim().count} ${util.getDiceSymbol(currentClaim().diceVal)} <br>
    and total was ${tot}. Player ${currentPlayer.id} loses a life!`
}

function elimMsg(pp: Player) {
    return `Player ${pp.id} has been eliminated!`;
}

