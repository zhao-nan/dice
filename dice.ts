window.onload = createGameChoices;

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
    const numPlayers = Number(rButts.find(r => r.checked).value);
    
    // numPlayersForm.style.display = 'none';
    document.body.removeChild(numPlayersForm);
    
    const diceVals: number[][] = Array.from({length: numPlayers}, () => roll5dice());
    console.log('Number of players: ' + numPlayers);
    createPlayerSections(numPlayers, diceVals[0]);
};

function createPlayerSections(numPlayers: number, p1dice: number[]) {
    const tan = Math.tan(Math.PI / numPlayers);
    const container = document.getElementById('player-container');
    container.style.setProperty('--m', numPlayers.toString());
    container.style.setProperty('--tan', tan.toFixed(2));
    container.style.setProperty('--img-size', '100px');
    for (let i = 1; i <= numPlayers; i++) {
        const playerSection = document.createElement('section');
        playerSection.id = 'player' + i;
        playerSection.style.setProperty('--i', i.toString());

        const playerIcon = document.createElement('img');
        playerIcon.src = 'img/player' + (i%8 +1) + '.png';
        playerIcon.className = 'player-icon';
        playerIcon.width = 100;
        playerSection.appendChild(playerIcon);

        const diceContainer = document.createElement('div');
        diceContainer.className = 'dice-container';
        playerSection.appendChild(diceContainer);

        for (let j = 1; j <= 5; j++) {
            const resultImg = document.createElement('img');
            resultImg.id = 'resultImg' + i + '-' + j;
            resultImg.className = 'dice-img';
            diceContainer.appendChild(resultImg);
            if (i != 1) {
                resultImg.src = 'img/qm.png';
            } else {
                resultImg.src = getImgSrc(p1dice[j-1]);
            }
        }
        container.appendChild(playerSection);
    }
}

function roll5dice() {
    return Array.from({length: 5}, () => Math.floor(Math.random() * 6) + 1);
}

type Claim = {
    count: number,
    diceVal: number,
}

function isGreater(this: Claim, other: Claim) {
    return this.count > other.count || (this.count == other.count && this.diceVal > other.diceVal);
}

function probOfClaim(claim: Claim, ownDice: number[], numOtherDice: number) {
    let val = claim.diceVal;
    let own = ownDice.filter(d => d == val || d == 1).length;
    let expected = own + numOtherDice / 3;
    return expected / (numOtherDice + 5);
}

function getImgSrc(diceVal: number) {
    return 'img/dice' + diceVal + '.png';
}