import * as util from './util.js';
import { Claim, Player } from './types.js';

export function createElement(type, props, parent) {
    const element = document.createElement(type);
    Object.assign(element, props);
    parent.appendChild(element);
    return element;
}

export function createPlayerSection(i: number) {
    const playerSection = createElement('section', {
        id: `player${i}`,
        style: `--i: ${(i+1.5).toString()}`
    }, document.body);

    createElement('img', {
        src: `img/player${i}.png`,
        className: 'player-icon',
        width: 100
    }, playerSection);

    const playerClaim = createElement('div', {
        className: 'player-claim',
        id: `player-claim${i}`
    }, playerSection);

    createElement('span', {
        id: `player-claim-val${i}`
    }, playerClaim);

    createElement('img', {
        id: `player-claim-die${i}`
    }, playerClaim);

    createElement('div', {
        className: 'dice-container'
    }, playerSection);

    createElement('div', {
        className: 'lives-container',
        id: `lives-container${i}`
    }, playerSection);

    for (let j = 1; j <= 5; j++) {
        const lifeImg = createElement('img', {
            id: `life${i}-${j}`,
            className: 'life-img',
            src: 'img/life.png'
        }, document.getElementById(`lives-container${i}`));
    }

    return playerSection;
}

function drawLives(i: number, livesContainer: HTMLDivElement) {
    console.log('Drawing ' + i + ' lives');
    for (let j = 1; j <= i; j++) {
        const lifeImg = document.createElement('img');
        lifeImg.src = 'img/life.png';
        lifeImg.width = 20;
        lifeImg.className = 'life-img';
        livesContainer.appendChild(lifeImg);
    }
}

export function updatePlayerSection(p: Player, showClaim: boolean, showDice: boolean) {
    const playerSection = document.getElementById('player' + p.id);
    if (p.lives <= 0) {
        playerSection.setAttribute('class', 'player-section dead');
    }
    const playerClaimVal = document.getElementById('player-claim-val' + p.id) as HTMLSpanElement;
    if (playerClaimVal == null) {
        console.log('Player claim val is null: ' + 'player-claim-val' + p.id);
        return;
    }
    const playerClaimDie = document.getElementById('player-claim-die' + p.id) as HTMLImageElement;
    if (showClaim) {
        playerClaimVal.textContent = p.claim.count.toString();
        playerClaimDie.src = util.getDiceImgSrc(p.claim.diceVal);
    } else {
        playerClaimVal.textContent = '';
        playerClaimDie.src = '';
    }
    for (let i = 1; i <= 5; i++) {
        const resultImg = document.getElementById(util.playerDieImgId(p.id, i)) as HTMLImageElement;
        if (showDice || p.id == 0) {
            resultImg.src = util.getDiceImgSrc(p.dice[i-1]);
        } else {
            resultImg.src = 'img/qm.png';
        }
    }
    // redraw lives
    const livesContainer = document.getElementById('lives-container' + p.id) as HTMLDivElement;
    livesContainer.innerHTML = '';
    drawLives(p.lives, livesContainer);
}