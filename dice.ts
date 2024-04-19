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
    console.log(currentPlayer.id + ' is taking their turn');
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
    doc.setPlayerStatus(currentPlayer.id, 'doubt');
    for (const p of players) {
        doc.updatePlayerSection(p, false, true);
    }

    const tot = util.totalNumDiceOf(currentClaim().diceVal, diceVals());
    if (tot < currentClaim().count) {
        // Claim successful
        let pp = prevPlayer();
        alert(`Justified call! 
        Claim was [${currentClaim().count} of ${currentClaim().diceVal}]
        but total was only ${tot}. Player ${pp.id} loses a life!`);
        pp.lives -= 1;
        if (pp.lives <= 0) {
            alert(`Player ${pp.id} has been eliminated!`);
            doc.setPlayerStatus(pp.id, 'dead');
            console.log('currentNumPlayers: ' + currentNumPlayers);
        }
        currentPlayer = prevPlayer();
        startNewRound(prevPlayer())
    } else {
        // Claim unsuccessful
        alert(`Player ${prevPlayer().id} was correct: Claim was [${currentClaim().count} of ${currentClaim().diceVal}]
        and total was ${tot}. Player ${currentPlayer.id} loses a life!`);
        currentPlayer.lives -= 1;
        if (currentPlayer.lives <= 0) {
            alert(`Player ${currentPlayer.id} has been eliminated!`);
            doc.setPlayerStatus(currentPlayer.id, 'dead');
            currentPlayer = nextPlayer();
        }
        startNewRound(currentPlayer)
    }
    currentNumPlayers = players.filter(p => p.lives > 0).length;
}

function claim(claim: Claim) {
    console.log(`Player ${currentPlayer.id} claiming: ${claim.count} dice of value ${claim.diceVal}`);
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
    console.log(`Starting new round with player ${player.id}`);
    if (players.filter(p => p.lives > 0).length == 1) {
        alert('Player ' + players.findIndex(p => p.lives > 0) + ' wins!');
    }
    players.forEach((p) => {
        if (p.lives > 0) {
            p.dice = util.roll5dice();
            console.log(`Player ${p.id} rolled: ${diceVals[p.id]}`);
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
    console.log(`currentPlayer: ${currentPlayer.id}`);
    nextTurn();
}



function startGame() {
    event.preventDefault();
    console.log('Starting game...');

    const numPlayersForm = document.getElementById('num-players-form') as HTMLFormElement;

    const rButts = Array.from(document.getElementsByName('num-players')) as HTMLInputElement[];

    currentNumPlayers = Number(rButts.find(r => r.checked).value);

    for (let i = 0; i < currentNumPlayers; i++) {
        players.push({id: i, lives: 3, claim: {count: 0, diceVal: 0}, dice: util.roll5dice()});
    }
    console.log('diceVals: ' + diceVals());
    document.body.removeChild(numPlayersForm);

    document.getElementById('player-container').style.display = 'grid';
    document.getElementById('player-turn-section').style.display = 'grid';

    
    currentPlayer = players[Math.floor(Math.random() * currentNumPlayers)]
    createPlayerSections(currentNumPlayers, diceVals[0]);
    doc.createPlayerTurnSection(doubt, claim, currentClaim());

    doc.addEvListeners();

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
    const tan = Math.tan(Math.PI / numPlayers);
    const container = document.getElementById('player-container');
    container.style.setProperty('--m', numPlayers.toString());
    container.style.setProperty('--tan', tan.toFixed(2));
    container.style.setProperty('--img-size', '100px');
    for (let i = 0; i < numPlayers; i++) {
        const playerSection = doc.createPlayerSection(i);

        
        container.appendChild(playerSection);
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
    console.log('currentPlayer.id: ' + currentPlayer.id);
    let curId = (currentPlayer.id + 1) % players.length;
    console.log('curId: ' + curId);
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
