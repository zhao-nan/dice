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

function createPlayerSections(numPlayers) {
    const container = document.getElementById('player-container');
    for (let i = 1; i <= numPlayers; i++) {
        const playerSection = document.createElement('section');
        playerSection.id = 'player' + i;

        const playerIcon = document.createElement('img');
        playerIcon.src = 'img/player' + i + '.png';
        playerIcon.className = 'player-icon';
        playerIcon.width = 100;
        playerSection.appendChild(playerIcon);

        for (let j = 1; j <= 5; j++) {
            const resultImg = document.createElement('img');
            resultImg.id = 'resultImg' + i + '-' + j;
            playerSection.appendChild(resultImg);
        }

        container.appendChild(playerSection);
    }
}