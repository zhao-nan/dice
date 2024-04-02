document.getElementById('roll-dice')?.addEventListener('click', () => {
    const result: number = Math.floor(Math.random() * 6) + 1;
    const resultElement = document.getElementById('result');
    if (resultElement) {
        resultElement.textContent = 'You rolled a ' + result;
    }

    const resultImgElement = document.getElementById('resultImg') as HTMLImageElement;
    if (resultImgElement) {
        const imgSrc = 'img/testdice' + result + '.png';
        resultImgElement.src = imgSrc;
    } else {
        console.log('No img element found');
    }
});