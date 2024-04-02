var _a;
(_a = document.getElementById('roll-dice')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
    var result = Math.floor(Math.random() * 6) + 1;
    var resultElement = document.getElementById('result');
    if (resultElement) {
        resultElement.textContent = 'You rolled a ' + result;
    }
    var resultImgElement = document.getElementById('resultImg');
    if (resultImgElement) {
        var imgSrc = 'img/testdice' + result + '.png';
        resultImgElement.src = imgSrc;
        console.log('Setting img src to ' + imgSrc);
    }
    else {
        console.log('No img element found');
    }
});
