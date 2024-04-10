document.getElementById('setup-game')?.addEventListener('click', () => {
    console.log('Starting game...');

    const numPlayersForm = document.getElementById('num-players-form') as HTMLFormElement;

    const numPlayers = Number((numPlayersForm.elements.namedItem('num-players') as RadioNodeList).value);
    // a two-dimensional array of dice values for each player
    const diceVals: number[][] = Array.from({length: numPlayers}, () => 
                                    Array.from({length: 5}, () => Math.floor(Math.random() * 6) + 1));
    createPlayerSections(numPlayers, diceVals[0]);
    const p1section = document.getElementById('player1');
    numPlayersForm.style.display = 'none';
    document.getElementById('setup-game').style.display = 'none';
});

function createPlayerSections(numPlayers: number, p1dice: number[]) {
    const container = document.getElementById('player-container');
    for (let i = 1; i <= numPlayers; i++) {
        const playerSection = document.createElement('section');
        playerSection.id = 'player' + i;

        const playerIcon = document.createElement('img');
        playerIcon.src = 'img/player' + (i%8 +1) + '.png';
        playerIcon.className = 'player-icon';
        playerIcon.width = 100;
        playerSection.appendChild(playerIcon);

        for (let j = 1; j <= 5; j++) {
            const resultImg = document.createElement('img');
            resultImg.id = 'resultImg' + i + '-' + j;
            playerSection.appendChild(resultImg);
            if (i != 1) {
                resultImg.src = 'img/quma.png';
            } else {
                resultImg.src = 'img/testdice' + p1dice[j-1] + '.png';
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