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

function letsGo() {
    doc.addDarkListener();
    doc.createRulesSection();
    doc.createGameChoices(startGame);
}

function npcTurn() {
    doc.setInfoMsg(`${currentPlayer.name}'s turn!`); 
    doc.deactivatePlayerTurnSection();
    setTimeout(() => {
        let c: Claim = npc.npcClaim(currentClaim(), currentPlayer.dice, getNumOtherDice(currentPlayer));
        if (c.count == 0) {
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
    doc.setInfoMsg(initialDoubtMsg());
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
            let pp = prevPlayer();
            doc.setInfoMsg(justifiedCallMsg(pp, tot));
            subtractLife(pp);
            currentPlayer = prevPlayer();
            setTimeout(() => {
                doc.setPlayerStatus(nextPlayer(), Status.WAITING);
                startNewRound(prevPlayer())
            }, doubtTimeout);
        } else {
            // Doubt unjustified
            doc.setInfoMsg(noDoubtMsg(tot));
            subtractLife(currentPlayer);
            setTimeout(() => {
                doc.setPlayerStatus(prevPlayer(), Status.WAITING);
                startNewRound(currentPlayer)
            }, doubtTimeout);
        }
        currentNumPlayers = players.filter(p => p.lives > 0).length;
    }, newRoundTimeout);
}

function subtractLife(p: Player) {
    doc.setPlayerStatus(p, Status.OOPS);
    p.lives -= 1;
    doc.drawLives(p);
    if (p.lives == 0) {
        doc.setInfoMsg(elimMsg(p));
        setTimeout(() => {
            doc.setPlayerStatus(p, Status.DEAD);
        }, DeathTimeout);
    }
    setTimeout(() => {
        
    }, doubtTimeout);
}

function claim(claim: Claim) {
    currentPlayer.claim = claim;
    doc.setPlayerStatus(currentPlayer, Status.CLAIM);
    doc.updatePlayerSection(prevPlayer());
    doc.updatePlayerSection(currentPlayer);
    nextTurn();
}

function playerTurn() {
    doc.setInfoMsg(`Your turn!`);
    doc.activatePlayerTurnSection(currentClaim(), claim, currentNumPlayers * 5);
}

function startNewRound(player: Player) {
    doc.hide();
    doc.setInfoMsg(`Starting new round with ${currentNumPlayers} players! Starting: Player ${player.id}`);
    if (players.filter(p => p.lives > 0).length == 1) {
        const winner = players.find(p => p.lives > 0);
        doc.setInfoMsg('Player ' + winner.id + ' wins!');
        doc.setPlayerStatus(winner, Status.WINNER);
        doc.activateNewGameButton();
    } else {
        players.forEach((p) => {
            if (p.lives > 0) {
                p.dice = util.roll5dice();
            } else {
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
    doc.setInfoMsg('Starting game...');

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
    players = [];
    for (let i = 0; i < currentNumPlayers; i++) {
        players.push({name: names[7-i], id: i, lives: 3, claim: {count: 0, diceVal: 0}, dice: util.roll5dice()});
    }

    doc.activateMainSection();

    currentPlayer = players[Math.floor(Math.random() * currentNumPlayers)]
    createPlayerSections(diceVals[0]);
    doc.createPlayerTurnSection(doubt, claim, currentClaim());

    doc.hide();
    players.forEach((p) => {doc.updatePlayerSection(p)});

    nextTurn();
};

function createPlayerSections(p1dice: number[]) {
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

function initialDoubtMsg() {
    return `${currentPlayer.name} doubts ${prevPlayer().name}'s claim of <br>
    ${currentClaim().count} ${util.getDiceSymbol(currentClaim().diceVal)} !`
}

function justifiedCallMsg(pp: Player, tot: number) {
    return `Justified call! Claim was <br>
     ${currentClaim().count} ${util.getDiceSymbol(currentClaim().diceVal)} <br>
        but total was only ${tot}. ${pp.name} loses a life!`;
}

function noDoubtMsg(tot: number) {
    return `${prevPlayer().name} was correct: Claim was <br>
    ${currentClaim().count} ${util.getDiceSymbol(currentClaim().diceVal)} <br>
    and total was ${tot}. ${currentPlayer.name} loses a life!`
}

function elimMsg(pp: Player) {
    return `${pp.name} has been eliminated!`;
}

function getNumOtherDice(p: Player) {
    return players.filter(pl => pl.id != p.id && pl.lives > 0).map(pl => pl.dice).flat().length;
} 

