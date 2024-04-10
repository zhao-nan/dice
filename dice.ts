window.onload = createGameChoices;

var currentClaim: Claim = {count: 0, diceVal: 0};

var lives = new Array();

var numPlayers: number;

function playerTurn() {
    const claimSection = document.createElement('section');
    claimSection.id = 'claim-section';
    claimSection.className = 'claim-section';

    // Create slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = currentClaim.count.toString();
    slider.max = (numPlayers*5).toString(); // Convert to string
    slider.value = currentClaim.count.toString();
    slider.className = 'slider';
    claimSection.appendChild(slider);
    const sliderLabel = document.createElement('label');
    sliderLabel.textContent = slider.value;
    claimSection.appendChild(sliderLabel);

    const claimDice = document.createElement('div');

    for (let i = 2; i <= 6; ++i) {
        const rButtLabel = document.createElement('label');
        const rButt = document.createElement('input');
        rButt.type = 'radio';
        rButt.value = i.toString();
        rButt.name = 'dice-val-claim';

        const img = document.createElement('img');
        img.src = getDiceImgSrc(i);
        img.alt = 'Dice Value ' + i;
        rButtLabel.appendChild(rButt);
        rButtLabel.appendChild(img);
        claimDice.appendChild(rButtLabel);
    }
    claimSection.appendChild(claimDice);
    // Create button
    const claimButton = document.createElement('button');
    claimButton.textContent = 'Make Claim';
    claimButton.disabled = true; // Initially disabled
    claimSection.appendChild(claimButton);

    // Update button state when slider value changes
    slider.addEventListener('input', () => {
        sliderLabel.textContent = slider.value;
        const claimCount = parseInt(slider.value);
        const claimValue = parseInt((document.querySelector('input[name="dice-val-claim"]:checked') as HTMLInputElement).value);
        claimButton.disabled = !isGreater({count: claimCount, diceVal: claimValue}, currentClaim);
    });

    // Update button state when radio button value changes
    document.querySelectorAll('input[name="dice-val-claim"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const claimCount = parseInt(slider.value);
            const claimValue = parseInt((document.querySelector('input[name="dice-val-claim"]:checked') as HTMLInputElement).value);
            claimButton.disabled = !isGreater({count: claimCount, diceVal: claimValue}, currentClaim);
        });
    });
    document.body.appendChild(claimSection);
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
    numPlayers = Number(rButts.find(r => r.checked).value);
    for (let i = 0; i < numPlayers; i++) {
        lives.push(3);
    }
    
    // numPlayersForm.style.display = 'none';
    document.body.removeChild(numPlayersForm);
    
    const diceVals: number[][] = Array.from({length: numPlayers}, () => roll5dice());
    console.log('Number of players: ' + numPlayers);
    createPlayerSections(numPlayers, diceVals[0]);
    playerTurn();
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
            resultImg.id = 'resultImg' + i + '-' + j;
            resultImg.className = 'dice-img';
            diceContainer.appendChild(resultImg);
            if (i != 1) {
                resultImg.src = 'img/qm.png';
            } else {
                resultImg.src = getDiceImgSrc(p1dice[j-1]);
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

function isGreater(thisClaim: Claim, other: Claim) {
    return thisClaim.count > other.count || (thisClaim.count == other.count && thisClaim.diceVal > other.diceVal);
}

function probOfClaim(claim: Claim, ownDice: number[], numOtherDice: number) {
    let val = claim.diceVal;
    let own = ownDice.filter(d => d == val || d == 1).length;
    let expected = own + numOtherDice / 3;
    return expected / (numOtherDice + 5);
}

function getDiceImgSrc(diceVal: number) {
    return 'img/dice' + diceVal + '.png';
}