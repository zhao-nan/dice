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
});