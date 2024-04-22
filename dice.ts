import * as npc from './npc.js';
import { Claim, Player } from './types.js';
import * as doc from './docInteraction.js';
import * as util from './util.js';

window.onload = createGameChoices;

let currentPlayer: Player;
let players: Player[] = new Array();
let currentNumPlayers: number;


function npcTurn() {
    deactivatePlayerTurnSection();
    setTimeout(() => {
        const prob = util.probOfClaim(currentClaim(), currentPlayer.dice, (currentNumPlayers - 1) * 5);
        const rand = Math.random();
        if (rand > prob) {
            console.log(`Doubting because prob is ${prob} and rand is ${rand}`);
            doubt();
        } else {
            claim(npc.npcClaim(currentClaim(), currentPlayer.dice, currentNumPlayers));
        }
    }, 1000);
}

function nextTurn() {
    doc.setPlayerStatus(prevPlayer().id, 'waiting');
    currentPlayer = nextPlayer();

    if (currentPlayer.id == 0) {
        playerTurn();
    } else {
        npcTurn();
    }
}

function doubt() {
    doc.activateInfoSection("DOUBT");
    doc.setPlayerStatus(currentPlayer.id, 'doubt');
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
            if (pp.lives <= 0) {
                doc.setInfoMsg(elimMsg(pp));
                doc.setPlayerStatus(pp.id, 'dead');
            }
            currentPlayer = prevPlayer();
            setTimeout(() => {
                startNewRound(prevPlayer())
            }, 3000);
        } else {
            // Claim unsuccessful
            doc.setInfoMsg(noDoubtMsg(tot));
            currentPlayer.lives -= 1;
            if (currentPlayer.lives <= 0) {
                doc.setInfoMsg(elimMsg(currentPlayer));
                doc.setPlayerStatus(currentPlayer.id, 'dead');
                currentPlayer = nextPlayer();
            }
            setTimeout(() => {
                startNewRound(currentPlayer)
            }, 3000);
        }
        currentNumPlayers = players.filter(p => p.lives > 0).length;
    }, 2000);
}

function claim(claim: Claim) {
    currentPlayer.claim = claim;
    doc.setPlayerStatus(currentPlayer.id, 'claim');
    doc.updatePlayerSection(prevPlayer(), false, false);
    doc.updatePlayerSection(currentPlayer, true, false);
    nextTurn();
}

function playerTurn() {
    activatePlayerTurnSection();
    updatePlayerTurnSection();
}

function startNewRound(player: Player) {
    console.log(`Starting new round with ${currentNumPlayers} players! Starting: player ${player.id}`);
    if (players.filter(p => p.lives > 0).length == 1) {
        doc.setInfoMsg('Player ' + players.findIndex(p => p.lives > 0) + ' wins!');
        endGame();
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



function startGame() {
    event.preventDefault();
    doc.activateInfoSection('Starting game...');

    const numPlayersForm = document.getElementById('num-players-form') as HTMLFormElement;

    const rButts = Array.from(document.getElementsByName('num-players')) as HTMLInputElement[];

    currentNumPlayers = Number(rButts.find(r => r.checked).value);

    for (let i = 0; i < currentNumPlayers; i++) {
        players.push({id: i, lives: 3, claim: {count: 0, diceVal: 0}, dice: util.roll5dice()});
    }
    document.body.removeChild(numPlayersForm);

    document.getElementById('player-container').style.display = 'grid';
    document.getElementById('info-section').style.display = 'block';
    
    currentPlayer = players[Math.floor(Math.random() * currentNumPlayers)]
    createPlayerSections(currentNumPlayers, diceVals[0]);
    doc.createPlayerTurnSection(doubt, claim, currentClaim());

    doc.addEvListeners();

    players.forEach((p) => {doc.updatePlayerSection(p, false, false)});

    nextTurn();
};

function endGame() {
    const playerContainer = document.getElementById('player-container');
    playerContainer.innerHTML = '';
    const npcSection = document.getElementById('npc-section');
    npcSection.innerHTML = '';
    playerContainer.style.display = 'none';
    document.getElementById('player-turn-section').style.display = 'none';
    createGameChoices();
}

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
    }
}

function deactivatePlayerTurnSection() {
    const playerTurnSection = document.getElementById('player-turn-section');
    const interactiveElements = playerTurnSection.querySelectorAll('button, input, select, textarea');
    playerTurnSection.setAttribute('active', 'false');
    interactiveElements.forEach(element => {
        element.setAttribute('disabled', 'true');
    });
}

function activatePlayerTurnSection() {
    const playerTurnSection = document.getElementById('player-turn-section');
    const interactiveElements = playerTurnSection.querySelectorAll('button, input, select, textarea');
    playerTurnSection.setAttribute('active', 'true');
    interactiveElements.forEach(element => {
        element.removeAttribute('disabled');
    });
    if (currentClaim().count == 0) {
        const doubtButton = document.getElementById('doubt-section').querySelector('button');
        doubtButton.setAttribute('disabled', 'true');
    }
}

function createGameChoices() {
    const playerContainer = document.getElementById('player-container');
    playerContainer.style.display = 'none';
    document.getElementById('player-turn-section').style.display = 'none';
    document.getElementById('info-section').style.display = 'none';

    const numPlayersForm = doc.createElement('div', { id: 'num-players-form' }, document.body);

    for (let i = 2; i <= 8; i++) {
        const radio = doc.createElement('input', {
            type: 'radio',
            value: i.toString(),
            name: 'num-players',
            id: 'num-players' + i,
            checked: i === 5,
        }, numPlayersForm);

        const label = doc.createElement('label', { textContent: `${i}` }, numPlayersForm);

        numPlayersForm.appendChild(radio);
        numPlayersForm.appendChild(label);
    }

    const startButton = doc.createElement('button', {
        id: 'setup-game',
        textContent: 'Start Game',
        eventListeners: { click: startGame },
    }, numPlayersForm);

    startButton.addEventListener('click', startGame);
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
    return `Justified call! 
        Claim was [${currentClaim().count} ${util.getDiceSymbol(currentClaim().diceVal)}]
        but total was only ${tot}. Player ${pp.id} loses a life!`;
}

function noDoubtMsg(tot: number) {
    return `Player ${prevPlayer().id} was correct: 
    Claim was [${currentClaim().count} ${util.getDiceSymbol(currentClaim().diceVal)}]
    and total was ${tot}. Player ${currentPlayer.id} loses a life!`
}

function elimMsg(pp: Player) {
    return `Player ${pp.id} has been eliminated!`;
}

