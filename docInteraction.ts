import * as util from './util.js';
import { Claim, Player } from './types.js';
import { startGame } from './dice.js';

let listenersAlreadyAdded: boolean = false;

export function createElement(type, props, parent) {
    const element = document.createElement(type);
    Object.assign(element, props);
    parent.appendChild(element);
    return element;
}

export function createRulesSection() {
    const dialog: HTMLDialogElement = document.querySelector('.rules');
    const rulesButton = document.getElementById('rules-button');

    rulesButton.addEventListener('click', () => {
        dialog.showModal();
    });

    // Close the dialog when the Escape key is pressed
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            dialog.close();
        }
    });

    // Close the dialog when a click occurs outside the dialog
    window.addEventListener('click', (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
}

export function setInfoMsg(text: string) {
    const infoSection = document.getElementById('info-section');
    infoSection.innerHTML = text;
}

export function createPlayerSection(i: number) {

    const container = i === 0 ?
     document.getElementById('player-container') :
     document.getElementById('npc-container');

    const playerSection = createElement('section', {
        id: `player${i}`,
        style: `--i: ${(i+1.5).toString()}`,
        className: 'player-section'
    }, container);

    createElement('label', {
        textContent: 'Player ' + i,
        className: 'player-label'
    }, playerSection);

    createElement('img', {
        src: `img/player${i}.png`,
        className: 'player-icon',
        width: 100
    }, playerSection);

    const playerActivity = createElement('span', {
        className: 'player-activity',
        id: `player-activity${i}`,
        status: 'waiting'
    }, playerSection);

    createElement('label', {
        textContent: 'waiting',
        className: 'player-status',
        id: `player-status${i}`
    }, playerActivity);

    const playerClaim = createElement('span', {
        className: 'player-claim',
        id: `player-claim${i}`
    }, playerActivity);

    createElement('span', {
        id: `player-claim-val${i}`
    }, playerClaim);

    createElement('img', {
        id: `player-claim-die${i}`
    }, playerClaim);

    createElement('div', {
        id: `dice-container${i}`,
        className: 'dice-container'
    }, playerSection);

    createElement('div', {
        className: 'lives-container',
        id: `lives-container${i}`
    }, playerSection);

    for (let j = 1; j <= 5; j++) {
        createElement('img', {
            id: util.playerDieImgId(i, j),
            className: 'player-die-img',
        }, document.getElementById(`dice-container${i}`));
    }

    return playerSection;
}

export function drawLives(player: Player) {
    const livesContainer = document.getElementById('lives-container' + player.id) as HTMLDivElement;
    livesContainer.innerHTML = '';
    livesContainer.textContent = '❤️ '.repeat(player.lives);
}

export function updatePlayerSection(p: Player, showClaim: boolean, showDice: boolean) {
    const playerClaimVal = document.getElementById('player-claim-val' + p.id) as HTMLSpanElement;
    if (playerClaimVal == null) {
        console.log('Player claim val is null: ' + 'player-claim-val' + p.id);
        return;
    }
    const playerClaimDie = document.getElementById('player-claim-die' + p.id) as HTMLImageElement;
    if (showClaim) {
        playerClaimVal.textContent = p.claim.count.toString();
        playerClaimVal.style.display = 'inline';
        playerClaimDie.src = util.getDiceImgSrc(p.claim.diceVal);
        playerClaimDie.style.display = 'inline';
    } else {
        playerClaimVal.style.display = 'none';
        playerClaimDie.style.display = 'none';
    }
    for (let i = 1; i <= 5; i++) {
        const resultImg = document.getElementById(util.playerDieImgId(p.id, i)) as HTMLImageElement;
        if (p.lives <= 0) {
            resultImg.style.display = 'none';
        } else if (showDice || p.id == 0) {
            resultImg.src = util.getDiceImgSrc(p.dice[i-1]);
        } else {
            resultImg.src = 'img/qm.png';
        }
    }
    
    drawLives(p);
}

export function deactivatePlayerTurnSection() {
    const playerTurnSection = document.getElementById('player-turn-section');
    const interactiveElements = playerTurnSection.querySelectorAll('button, input, select, textarea');
    playerTurnSection.setAttribute('active', 'false');
    interactiveElements.forEach(element => {
        element.setAttribute('disabled', 'true');
    });
}

export function activatePlayerTurnSection(currentClaim: Claim) {
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

export function createGameChoices(startGame: () => void) {
    setInfoMsg('Choose game options! :)');
    const optionsPanel = createElement('div', { id: 'options-panel' }, document.body);
    createNumPlayerChoice(optionsPanel);

    createGameSpeedChoice(optionsPanel);    

    const startButton = createElement('button', {
        id: 'setup-game',
        textContent: 'Start Game',
        eventListeners: { click: startGame },
    }, optionsPanel);

    startButton.addEventListener('click', startGame);
}

function createNumPlayerChoice(optionsPanel: HTMLDivElement) {
    const numPlayersForm = createElement('div',
        { id: 'num-players-form', textContent: 'Number of players:'  }, 
        optionsPanel);

    for (let i = 2; i <= 8; i++) {
        const radio = createElement('input', {
            type: 'radio',
            value: i.toString(),
            name: 'num-players',
            id: 'num-players' + i,
            checked: i === 5,
        }, numPlayersForm);

        const label = createElement('label', { textContent: `${i}` }, numPlayersForm);

        numPlayersForm.appendChild(radio);
        numPlayersForm.appendChild(label);
    }
}

function createGameSpeedChoice(optionsPanel: HTMLDivElement) {
    const gameSpeedForm = createElement('div',
        { id: 'game-speed-form', textContent: 'Game speed:'  }, 
        optionsPanel);

    const speeds = ['Fast', 'Medium', 'Slow'];
    for (let i = 0; i < speeds.length; i++) {
        const radio = createElement('input', {
            type: 'radio',
            value: i+1,
            name: 'game-speed',
            id: 'game-speed' + speeds[i],
            checked: i === 1,
        }, gameSpeedForm);

        const label = createElement('label', { textContent: speeds[i] }, gameSpeedForm);

        gameSpeedForm.appendChild(radio);
        gameSpeedForm.appendChild(label);
    }
}

export function activateMainSection() {
    document.getElementById('options-panel').remove();
    document.getElementById('player-container').style.display = 'grid';
    document.getElementById('info-section').style.display = 'block';
}

export function activateNewGameButton() {
    const infoSection = document.getElementById('info-section');
    const newGameButton = createElement('button', {
        id: 'new-game-button',
        textContent: 'New Game'
    }, infoSection);
    newGameButton.addEventListener('click', restartGame);
}

function restartGame() {
    console.log('Restarting game...');
    document.getElementById('player-container').innerHTML = '';
    document.getElementById('player-turn-section').innerHTML = '';
    document.getElementById('npc-container').innerHTML = '';
    createGameChoices(startGame);
}

export function setPlayerStatus(playerNum: number, status: string) {
    const activity = document.getElementById('player-activity' + playerNum);
    activity.setAttribute('status', status.toLowerCase().replace('!',''));
    const statusLabel = document.getElementById('player-status' + playerNum);
    statusLabel.textContent = status;
}

export function updateClaimEventListeners(claim: (Claim) => void, currentClaim: Claim) {

    const claimButton = document.getElementById('claim-button');
    const slider = document.getElementById('claim-slider') as HTMLInputElement;
    const label = document.getElementById('claim-slider-label');
    const radioButtons = document.querySelectorAll('input[name="dice-val-claim"]');

    radioButtons.forEach((radio) => {
        const clone = radio.cloneNode(true);
        radio.parentNode.replaceChild(clone, radio);
    });

    // Remove old event listeners
    claimButton.replaceWith(claimButton.cloneNode(true));
    slider.replaceWith(slider.cloneNode(true));

    // Get fresh references after cloning
    const newClaimButton: HTMLButtonElement = document.getElementById('claim-button') as HTMLButtonElement;
    const newSlider = document.getElementById('claim-slider') as HTMLInputElement;

    newClaimButton.addEventListener('click', () => {
        const claimCount = parseInt(newSlider.value);
        const claimValue = getClaimDiceVal();
        claim({count: claimCount, diceVal: claimValue});
    });

    newSlider.addEventListener('input', () => {
        label.textContent = newSlider.value;
        updateClaimButton(currentClaim);
    });
    
    // Update button state when radio button value changes
    document.querySelectorAll('input[name="dice-val-claim"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateClaimButton(currentClaim);
        });
    });
}

export function createPlayerTurnSection(doubt: () => void, claim: (Claim) => void, currentClaim: Claim) {
    const playerTurnSection = document.getElementById('player-turn-section');
    playerTurnSection.innerHTML = '';
    const doubtSection = createElement('section', {
        id: 'doubt-section',
        className: 'doubt-section'
    }, playerTurnSection);

    const doubtButton = createElement('button', {
        textContent: 'Doubt!',
        disabled: true
    }, doubtSection);
    doubtButton.addEventListener('click', doubt);

    const claimSection = createElement('section', {
        id: 'claim-section',
        className: 'claim-section'
    }, playerTurnSection);

    const sliderDiv = createElement('div', {
        className: 'slider-div'
    }, claimSection);

    createElement('input', {
        type: 'range',
        id: 'claim-slider',
        className: 'slider'
    }, sliderDiv);

    createElement('label', {
        id: 'claim-slider-label'
    }, sliderDiv);

    const claimDice = document.createElement('div');
    claimDice.className = 'claim-dice';

    for (let i = 2; i <= 6; ++i) {
        const rButtLabel = document.createElement('label');
        const rButt = createElement('input', {
            type: 'radio',
            value: i.toString(),
            name: 'dice-val-claim'
        }, rButtLabel);
        if (i == 2) {
            rButt.checked = true;
        }
        createElement('img', {
            src: util.getDiceImgSrc(i)
        }, rButtLabel);
        claimDice.appendChild(rButtLabel);
        rButt.addEventListener('change', () => {
            updateClaimButton(currentClaim);
        });
    }
    claimSection.appendChild(claimDice);

    createElement('button', {
        id: 'claim-button',
        textContent: 'Make Claim',
        disabled: true
    }, claimSection);

    addEvListeners();

    playerTurnSection.appendChild(claimSection);
    playerTurnSection.style.display = 'grid';
}

export function updateClaimButton(currentClaim: Claim) {
    const slider = document.getElementById('claim-slider') as HTMLInputElement;
    const claimCount = parseInt(slider.value);
    const claimValue = getClaimDiceVal();
    const claimButton = document.getElementById('claim-button') as HTMLButtonElement;
    claimButton.disabled = !util.isGreater({count: claimCount, diceVal: claimValue}, currentClaim);
    claimButton.focus();
}

export function addEvListeners() {
    if (listenersAlreadyAdded) return;
    window.addEventListener('keydown', (event) => {
        if (event.key === 'd') {
            const doubtButton = document.getElementById('doubt-section').querySelector('button');
            if (!doubtButton.disabled) {
                doubtButton.click();
            }
        }
        if (event.key === 'ArrowUp') {
            const slider = document.getElementById('claim-slider') as HTMLInputElement;
            const sliderValue = parseInt(slider.value);
            if (sliderValue < parseInt(slider.max)) {
                slider.value = (sliderValue + 1).toString();
                // Trigger the input event manually to update the button state and label
                slider.dispatchEvent(new Event('input'));
            }
        } else if (event.key === 'ArrowDown') {
            const slider = document.getElementById('claim-slider') as HTMLInputElement;
            const sliderValue = parseInt(slider.value);
            if (sliderValue > parseInt(slider.min)) {
                slider.value = (sliderValue - 1).toString();
                // Trigger the input event manually to update the button state and label
                slider.dispatchEvent(new Event('input'));
            }
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            const radioButtons: HTMLInputElement[] = Array.from(document.querySelectorAll('input[type="radio"]')) ;
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
                // Trigger change event manually to update the button state
                selectedRadioButton.dispatchEvent(new Event('change'));
            }
        }
    });
    listenersAlreadyAdded = true;
}

export function getClaimDiceVal() {
    const rButt: HTMLInputElement = document.querySelector('input[name="dice-val-claim"]:checked');
    return parseInt(rButt.value);
}