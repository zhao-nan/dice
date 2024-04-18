import * as npc from './npc.js';
import { Claim, Player } from './types.js';
import * as doc from './docInteraction.js';
import * as util from './util.js';

window.onload = createGameChoices;

let currentPlayer: Player;
let players : Player[] = new Array();
let currentNumPlayers: number;
let playerTurnSection: HTMLElement;

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
    }, 2000);
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
    setTimeout(() => {
        const tot = util.totalNumDiceOf(currentClaim().diceVal, diceVals());
        if (tot < currentClaim().count) {
            // Claim successful
            prevPlayer().lives -= 1;
            alert(`Justified call! 
                Claim was [${currentClaim().count} of ${currentClaim().diceVal}]
                but total was only ${tot}. Player ${prevPlayer().id} loses a life!`);
            startNewRound(prevPlayer())
        } else {
            // Claim unsuccessful
            currentPlayer.lives -= 1;
            alert(`Player ${prevPlayer().id} was correct: Claim was [${currentClaim().count} of ${currentClaim().diceVal}]
            and total was ${tot}. Player ${currentPlayer.id} loses a life!`);
            startNewRound(currentPlayer)
        }
    }, 5000);
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
    if (player.lives <= 0) {
        alert(`Player ${player.id} has been eliminated!`);
        currentNumPlayers -= 1;
    }
    if (players.filter(p => p.lives > 0).length == 1) {
        alert('Player ' + players.findIndex(p => p.lives > 0) + ' wins!');
    }
    players.forEach((p) => {
        if (p.lives > 0) {
            diceVals[p.id] = util.roll5dice();
        } else {
            diceVals[p.id] = [0, 0, 0, 0, 0];
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

function createGameChoices() {
    console.log('Creating game choices...');
    const numPlayersForm = document.createElement('form');
    numPlayersForm.id = 'num-players-form';
    for (let i = 2; i <= 8; i++) {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = i.toString();
        radio.name = 'num-players';
        radio.id = 'num-players' + i;
        if (i == 5) {
            radio.checked = true;
        }
        const label = document.createElement('label');
        label.textContent = `${i}`; // Add some text to the label
        numPlayersForm.appendChild(radio);
        numPlayersForm.appendChild(label);
    }
   
    const startButton = document.createElement('button');
    startButton.id = 'setup-game';
    startButton.textContent = 'Start Game';
    startButton.addEventListener('click', startGame);
    numPlayersForm.appendChild(startButton);
    document.body.appendChild(numPlayersForm);
}

function startGame(event: Event) {
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
    doc.updateClaimEventListeners(doubt, claim, currentClaim());
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
        curId = (curId - 1) % players.length;
    }
    return players[curId];
}

function diceVals() {
    let diceVals = Array.from({length: players.length}, (_, i) => players[i].dice);
    return diceVals;
}
