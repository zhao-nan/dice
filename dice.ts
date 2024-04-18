import * as npc from './npc.js';
import { Claim, Player } from './types.js';
import * as doc from './docInteraction.js';
import * as util from './util.js';

window.onload = createGameChoices;

let currentClaim: Claim = {count: 1, diceVal: 0};
let currentPlayer: Player;
let players : Player[] = new Array();
let currentNumPlayers: number;
let origNumPlayers: number;
let playerTurnSection: HTMLElement;

function npcTurn() {
    deactivatePlayerTurnSection();
    console.log(currentPlayer.id + ' is taking their turn');
    setTimeout(() => {
        const prob = util.probOfClaim(currentClaim, diceVals[currentPlayer.id], (currentNumPlayers - 1) * 5);
        const rand = Math.random();
        if (rand > prob) {
            console.log(`Doubting because prob is ${prob} and rand is ${rand}`);
            doubt();
        } else {
            claim(npc.npcClaim(currentClaim, diceVals[currentPlayer.id], currentNumPlayers));
        }
    }, 2000);
}

function nextTurn() {
    currentPlayer = nextPlayer();

    if (currentPlayer.id == 0) {
        playerTurn();
    } else {
        npcTurn();
    }
}

function doubt() {
    for (let i = 0; i < origNumPlayers; i++) {
        doc.updatePlayerSection(players[i], false, true);
    }
    setTimeout(() => {
        const tot = util.totalNumDiceOf(currentClaim.diceVal, diceVals());
        if (tot < currentClaim.count) {
            // Claim successful
            prevPlayer().lives -= 1;
            alert('Justified call! \n Claim was [' + currentClaim.count + ' of ' + currentClaim.diceVal + '] but total was only ' + tot + '. Player ' + prevPlayer() + ' loses a life!');
            startNewRound(prevPlayer())
        } else {
            // Claim unsuccessful
            currentPlayer.lives -= 1;
            alert('Player ' + prevPlayer() + ' was correct! Player ' + currentPlayer + ' loses a life!');
            startNewRound(currentPlayer)
        }
    }, 5000);
}

function claim(claim: Claim) {
    console.log(`Player ${currentPlayer} claiming: ${claim.count} dice of value ${claim.diceVal}`);
    currentClaim = claim;
    doc.updatePlayerSection(prevPlayer(), false, false);
    doc.updatePlayerSection(currentPlayer, true, false);
    nextTurn();
}

function playerTurn() {
    updatePlayerTurnSection();
    activatePlayerTurnSection();
}

function startNewRound(player: Player) {
    console.log(`Starting new round with player ${player}`);
    if (player.lives <= 0) {
        alert('Player ' + player + ' has been eliminated!');
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
    currentClaim = {count: 0, diceVal: 0};
    currentPlayer = prevPlayer();
    console.log('currentPlayer: ' + currentPlayer);
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
    
    createPlayerSections(currentNumPlayers, diceVals[0]);
    createPlayerTurnSection();

    addEvListeners();

    currentPlayer = players[Math.floor(Math.random() * currentNumPlayers)]
    nextTurn();
};


function createPlayerTurnSection() {
    playerTurnSection = document.createElement('section');
    playerTurnSection.id = 'player-turn-section';
    playerTurnSection.className = 'player-turn-section';

    const doubtSection = document.createElement('section');
    doubtSection.id = 'doubt-section';
    doubtSection.className = 'doubt-section';

    const doubtButton = document.createElement('button');
    doubtButton.textContent = 'Doubt!';
    doubtSection.appendChild(doubtButton);
    doubtButton.addEventListener('click', doubt);
    playerTurnSection.appendChild(doubtSection);
    doubtButton.disabled = true; // Initially disabled

    const claimSection = document.createElement('section');
    claimSection.id = 'claim-section';
    claimSection.className = 'claim-section';

    // Create slider
    const sliderDiv = document.createElement('div');
    sliderDiv.className = 'slider-div';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'claim-slider';
    slider.max = (currentNumPlayers*5).toString();
    slider.className = 'slider';
    const sliderLabel = document.createElement('label');
    sliderLabel.id = 'claim-slider-label';
    sliderDiv.appendChild(sliderLabel);
    sliderDiv.appendChild(slider);
    claimSection.appendChild(sliderDiv);

    const claimDice = document.createElement('div');
    claimDice.className = 'claim-dice';

    for (let i = 2; i <= 6; ++i) {
        const rButtLabel = document.createElement('label');
        const rButt = document.createElement('input');
        rButt.type = 'radio';
        rButt.value = i.toString();
        rButt.name = 'dice-val-claim';
        if (i == 2) {
            rButt.checked = true;
        }
        const img = document.createElement('img');
        img.src = util.getDiceImgSrc(i);
        img.alt = 'Dice Value ' + i;
        rButtLabel.appendChild(rButt);
        rButtLabel.appendChild(img);
        claimDice.appendChild(rButtLabel);
        rButt.addEventListener('change', () => {
            const claimCount = parseInt(slider.value);
            const claimValue = parseInt((document.querySelector('input[name="dice-val-claim"]:checked') as HTMLInputElement).value);
            console.log(' Checked value: ' + claimValue);
            claimButton.disabled = !util.isGreater({count: claimCount, diceVal: claimValue}, currentClaim);
        });
    }
    claimSection.appendChild(claimDice);
    // Create button
    const claimButton = document.createElement('button');
    claimButton.textContent = 'Make Claim';
    claimButton.disabled = true; // Initially disabled
    claimButton.addEventListener('click', () => {
        const claimCount = parseInt(slider.value);
        const claimValue = parseInt((document.querySelector('input[name="dice-val-claim"]:checked') as HTMLInputElement).value);
        claim({count: claimCount, diceVal: claimValue});
    });
    
    // Update button state when slider value changes
    slider.addEventListener('input', () => {
        sliderLabel.textContent = slider.value;
        const claimCount = parseInt(slider.value);
        const claimValue = parseInt((document.querySelector('input[name="dice-val-claim"]:checked') as HTMLInputElement).value);
        claimButton.disabled = !util.isGreater({count: claimCount, diceVal: claimValue}, currentClaim);
    });
    
    // Update button state when radio button value changes
    document.querySelectorAll('input[name="dice-val-claim"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const claimCount = parseInt(slider.value);
            const claimValue = parseInt((document.querySelector('input[name="dice-val-claim"]:checked') as HTMLInputElement).value);
            console.log(' Checked value: ' + claimValue);
            claimButton.disabled = !util.isGreater({count: claimCount, diceVal: claimValue}, currentClaim);
        });
    });
    claimSection.appendChild(claimButton);
    playerTurnSection.appendChild(claimSection);
    document.body.appendChild(playerTurnSection);
}

function updatePlayerTurnSection() {
    const slider = document.getElementById('claim-slider') as HTMLInputElement;
    const minVal = Math.max(currentClaim.count, 1);
    slider.min = minVal.toString();
    slider.value = minVal.toString();
    document.getElementById('claim-slider-label').textContent = slider.value;
    const doubtButton = document.getElementById('doubt-section').querySelector('button');
    doubtButton.disabled = currentClaim.count == 0;
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
    if (currentClaim.count == 0) {
        const doubtButton = document.getElementById('doubt-section').querySelector('button');
        doubtButton.setAttribute('disabled', 'true');
    }
}

function addEvListeners() {
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Add' || event.key === 'ArrowUp') {
            const slider = document.getElementById('claim-slider') as HTMLInputElement;
            const sliderValue = parseInt(slider.value);
            if (sliderValue < parseInt(slider.max)) {
                slider.value = (sliderValue + 1).toString();
                // Trigger the input event manually to update the button state and label
                slider.dispatchEvent(new Event('input'));
            }
        } else if (event.key === 'Minus' || event.key === 'ArrowDown') {
            const slider = document.getElementById('claim-slider') as HTMLInputElement;
            const sliderValue = parseInt(slider.value);
            if (sliderValue > parseInt(slider.min)) {
                slider.value = (sliderValue - 1).toString();
                // Trigger the input event manually to update the button state and label
                slider.dispatchEvent(new Event('input'));
            }
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            const radioButtons = Array.from(document.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
            const selectedRadioButton = radioButtons.find(radio => radio.checked);
            if (selectedRadioButton) {
                const selectedIndex = radioButtons.indexOf(selectedRadioButton);
                if (event.key === 'ArrowLeft' && selectedIndex > 0) {
                    const previousRadioButton = radioButtons[selectedIndex - 1];
                    previousRadioButton.checked = true;
                } else if (event.key === 'ArrowRight' && selectedIndex < radioButtons.length - 1) {
                    const nextRadioButton = radioButtons[selectedIndex + 1];
                    nextRadioButton.checked = true;
                }
            }
        }
    });
}

function nextPlayer() {
    let curId = (currentPlayer.id + 1) % players.length;
    while (players[curId].lives <= 0) {
        curId = (curId + 1) % players.length;
    }
    return players[curId];
}

function prevPlayer() {
    let curId = (currentPlayer.id - 1) % players.length;
    while (players[curId].lives <= 0) {
        curId = (curId - 1) % players.length;
    }
    return players[curId];
}

function diceVals() {
    let diceVals = Array.from({length: players.length}, (_, i) => players[i].dice);
    return diceVals;
}
