
document.getElementById('roll-dice')?.addEventListener('click', () => {
    const results: number[] = Array.from({length: 5}, () => Math.floor(Math.random() * 6) + 1);

    results.forEach((result, index) => {
        const resultImgElement = document.getElementById('resultImg' + (index + 1)) as HTMLImageElement;
        if (resultImgElement) {
            const imgSrc = 'img/testdice' + result + '.png';
            resultImgElement.src = imgSrc;
        } else {
            console.log('No img element found for dice ' + (index + 1));
        }
    });

    createPlayerSections(5);
});

document.getElementById('setup-game')?.addEventListener('click', () => {
    console.log('Starting game...');

    const numPlayersForm = document.getElementById('num-players-form') as HTMLFormElement;

    const numPlayers = Number((numPlayersForm.elements.namedItem('num-players') as RadioNodeList).value);
    const diceVals: number[][] TODO

    console.log('Number of players: ' + numPlayers);
    createPlayerSections(numPlayers);
    numPlayersForm.style.display = 'none';
});

function createPlayerSections(numPlayers) {
    const container = document.getElementById('player-container');
    for (let i = 1; i <= numPlayers; i++) {
        const playerSection = document.createElement('section');
        playerSection.id = 'player' + i;

        const playerIcon = document.createElement('img');
        playerIcon.src = 'img/player' + (i%5 +1) + '.png';
        playerIcon.className = 'player-icon';
        playerIcon.width = 100;
        playerSection.appendChild(playerIcon);

        for (let j = 1; j <= 5; j++) {
            const resultImg = document.createElement('img');
            resultImg.id = 'resultImg' + i + '-' + j;
            playerSection.appendChild(resultImg);
            if (i != 1) {
                resultImg.src = 'img/quma.png';
            }
        }

        container.appendChild(playerSection);
    }
}

function roll5dice() {
    return Array.from({length: 5}, () => Math.floor(Math.random() * 6) + 1);
}