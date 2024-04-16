import * as npc from './npc.js';
import { Claim } from './types.js';

window.onload = createGameChoices;

let currentClaim: Claim = {count: 0, diceVal: 0};
let currentPlayer: number;
let lives = new Array();
let numPlayers: number;
let diceVals: number[][];
let playerTurnSection: HTMLElement;

function npcTurn() {
    playerTurnSection.style.display = 'none';
    console.log(currentPlayer + ' is taking their turn');
    setTimeout(() => {
        const prob = probOfClaim(currentClaim, diceVals[currentPlayer], (numPlayers - 1) * 5);
        const rand = Math.random();
        if (rand > prob) {
            console.log('Calling bluff because prob is ' + prob + ' and rand is ' + rand);
            callBluff();
        } else {
            claim(npc.npcClaim(currentClaim, diceVals[currentPlayer], numPlayers));
        }
    }, 1000);
}

function nextTurn() {
    currentPlayer = (currentPlayer + 1) % numPlayers;
    if (currentPlayer == 0) {
        playerTurn();
    } else {
        npcTurn();
    }
}

function callBluff() {

}

function claim(claim: Claim) {
    console.log('Player'+ currentPlayer + ' claiming: ' + claim.count + ' dice of value ' + claim.diceVal);
    currentClaim = claim;
    updatePlayerSection(prevPlayer(), false, false);
    updatePlayerSection(currentPlayer, true, false);
    nextTurn();
}

function playerTurn() {
    updatePlayerTurnSection();
    playerTurnSection.style.display = 'block';
}

function createGameChoices() {
    console.log('Running tests...');
    test();
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
    numPlayers = Number(rButts.find(r => r.checked).value);
    for (let i = 0; i < numPlayers; i++) {
        lives.push(3);
    }

    document.body.removeChild(numPlayersForm);
    
    diceVals = Array.from({length: numPlayers}, () => roll5dice());

    console.log('Number of players: ' + numPlayers);
    createPlayerSections(numPlayers, diceVals[0]);
    createPlayerTurnSection();
    currentPlayer = numPlayers - 1;
    nextTurn();
};


function createPlayerTurnSection() {
    playerTurnSection = document.createElement('section');
    playerTurnSection.id = 'player-turn-section';
    playerTurnSection.className = 'player-turn-section';

    const callSection = document.createElement('section');
    callSection.id = 'call-section';
    callSection.className = 'call-section';

    const callButton = document.createElement('button');
    callButton.textContent = 'Call Bluff';
    callSection.appendChild(callButton);
    playerTurnSection.appendChild(callSection);


    const claimSection = document.createElement('section');
    claimSection.id = 'claim-section';
    claimSection.className = 'claim-section';

    // Create slider
    const sliderDiv = document.createElement('div');
    sliderDiv.className = 'slider-div';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'claim-slider';
    slider.min = currentClaim.count.toString();
    slider.max = (numPlayers*5).toString();
    slider.value = currentClaim.count.toString();
    slider.className = 'slider';
    const sliderLabel = document.createElement('label');
    sliderLabel.textContent = slider.value;
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
        img.src = getDiceImgSrc(i);
        img.alt = 'Dice Value ' + i;
        rButtLabel.appendChild(rButt);
        rButtLabel.appendChild(img);
        claimDice.appendChild(rButtLabel);
        console.log('Adding event listener to radio button');
        rButt.addEventListener('change', () => {
            const claimCount = parseInt(slider.value);
            const claimValue = parseInt((document.querySelector('input[name="dice-val-claim"]:checked') as HTMLInputElement).value);
            console.log(' Checked value: ' + claimValue);
            claimButton.disabled = !isGreater({count: claimCount, diceVal: claimValue}, currentClaim);
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
        console.log('Slider value: ' + slider.value + ' Claim value: ' + claimValue);
        claimButton.disabled = !isGreater({count: claimCount, diceVal: claimValue}, currentClaim);
    });
    
    // Update button state when radio button value changes
    document.querySelectorAll('input[name="dice-val-claim"]').forEach(radio => {
        console.log('Adding event listener to radio button');
        radio.addEventListener('change', () => {
            const claimCount = parseInt(slider.value);
            const claimValue = parseInt((document.querySelector('input[name="dice-val-claim"]:checked') as HTMLInputElement).value);
            console.log(' Checked value: ' + claimValue);
            claimButton.disabled = !isGreater({count: claimCount, diceVal: claimValue}, currentClaim);
        });
    });
    claimSection.appendChild(claimButton);
    playerTurnSection.appendChild(claimSection);
    document.body.appendChild(playerTurnSection);
    playerTurnSection.style.display = 'none';
}

function updatePlayerTurnSection() {
    const slider = document.getElementById('claim-slider') as HTMLInputElement;
    slider.min = currentClaim.count.toString();
    slider.value = currentClaim.count.toString();
}

function createPlayerSections(numPlayers: number, p1dice: number[]) {
    const tan = Math.tan(Math.PI / numPlayers);
    const container = document.getElementById('player-container');
    container.style.setProperty('--m', numPlayers.toString());
    container.style.setProperty('--tan', tan.toFixed(2));
    container.style.setProperty('--img-size', '100px');
    for (let i = 0; i < numPlayers; i++) {
        const playerSection = document.createElement('section');
        playerSection.id = 'player' + i;
        playerSection.style.setProperty('--i', i.toString());

        const playerIcon = document.createElement('img');
        playerIcon.src = 'img/player' + i + '.png';
        playerIcon.className = 'player-icon';
        playerIcon.width = 100;
        playerSection.appendChild(playerIcon);

        const playerClaim = document.createElement('div');
        playerClaim.className = 'player-claim';
        playerClaim.id = 'player-claim' + i;
        const playerClaimVal = document.createElement('span');
        playerClaimVal.id = 'player-claim-val' + i;
        const playerClaimDie = document.createElement('img');
        playerClaimDie.id = 'player-claim-die' + i;
        playerClaim.appendChild(playerClaimVal);
        playerClaim.appendChild(playerClaimDie);
        playerSection.appendChild(playerClaim);

        const diceContainer = document.createElement('div');
        diceContainer.className = 'dice-container';
        playerSection.appendChild(diceContainer);

        const livesContainer = document.createElement('div');
        livesContainer.className = 'lives-container';
        playerSection.appendChild(livesContainer);

        for (let j = 1; j <= lives[i-1]; j++) {
            const lifeImg = document.createElement('img');
            lifeImg.src = 'img/life.png';
            lifeImg.width = 20;
            lifeImg.className = 'life-img';
            livesContainer.appendChild(lifeImg);
        }

        for (let j = 1; j <= 5; j++) {
            const resultImg = document.createElement('img');
            resultImg.id = playerDieImgId(i, j);
            resultImg.className = 'dice-img';
            diceContainer.appendChild(resultImg);
            if (i != 0) {
                resultImg.src = 'img/qm.png';
            } else {
                resultImg.src = getDiceImgSrc(p1dice[j-1]);
            }
        }
        container.appendChild(playerSection);
    }
}

function updatePlayerSection(playerNum: number, showClaim: boolean, showDice: boolean) {
    const playerSection = document.getElementById('player' + playerNum);
    if (lives[playerNum] <= 0) {
        playerSection.setAttribute('class', 'player-section dead');
    }
    const playerClaimVal = document.getElementById('player-claim-val' + playerNum) as HTMLSpanElement;
    if (playerClaimVal == null) {
        console.log('Player claim val is null: ' + 'player-claim-val' + playerNum);
        return;
    }
    const playerClaimDie = document.getElementById('player-claim-die' + playerNum) as HTMLImageElement;
    if (showClaim) {
        playerClaimVal.textContent = currentClaim.count.toString();
        playerClaimDie.src = getDiceImgSrc(currentClaim.diceVal);
    } else {
        playerClaimVal.textContent = '';
        playerClaimDie.src = '';
    }
    if (showDice) {
        for (let i = 1; i <= 5; i++) {
            const resultImg = document.getElementById(playerDieImgId(playerNum, i)) as HTMLImageElement;
            resultImg.src = getDiceImgSrc(diceVals[playerNum][i-1]);
        }
    }
}


function playerDieImgId(playerNum: number, dieNum: number) {
    return 'playerDieImg-' + playerNum + '-' + dieNum;
}

function roll5dice() {
    return Array.from({length: 5}, () => Math.floor(Math.random() * 6) + 1);
}

function isGreater(thisClaim: Claim, other: Claim) {
    return thisClaim.count > other.count || (thisClaim.count == other.count && thisClaim.diceVal > other.diceVal);
}


function probOfClaim(claim: Claim, ownDice: number[], numOtherDice: number) {
    let val = claim.diceVal;
    let own = ownDice.filter(d => d == val || d == 1).length;
    return probOfAtLeast(claim.count - own, numOtherDice);
}

// probability of at least k dice that show a number or 1 (in n dice)
function probOfAtLeast(k: number, n: number) {
    let prob = 0;
    for (let i = k; i <= n; i++) {
        prob += binomial(n, i) * Math.pow(1/3, i) * Math.pow(2/3, n-i);
    }
    console.log('Prob of at least ' + k + ' dice: ' + prob);
    return prob;
}

function binomial(n: number, k: number) {
    var coeff = 1;
    for (var x = n - k + 1; x <= n; x++) coeff *= x;
    for (x = 1; x <= k; x++) coeff /= x;
    return coeff;
}

function getDiceImgSrc(diceVal: number) {
    return 'img/dice' + diceVal + '.png';
}

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function prevPlayer() {
    return (currentPlayer -1 + numPlayers) % numPlayers;
}

function test() {
    binomial(4,2);
    console.log(diceVals)
}