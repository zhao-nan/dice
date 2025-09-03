import { Claim, Status } from './types.js';
import * as doc from './docInteraction.js';
const socket = io("http://127.0.0.1:5000");
socket.on('update_game_state', (gameState) => { updateUI(gameState); });
socket.on('update_players', (playerString) => {
    document.getElementById('info-section').innerText = playerString;
    createButton('info-section', 'startGame', 'Start Game', startGame);
});
socket.on('game_started', (gameStateString) => {
    const gameState = JSON.parse(gameStateString);
    gameID = gameState.gameID;
    players = gameState.players;
    currentPlayer = players[gameState.current_player.id];
    currentNumPlayers = players.filter(p => p.lives > 0).length;
    doc.activateMainSection();
    createPlayerSections();
    doc.createPlayerTurnSection(doubt, claim, new Claim(0, 0));
    doc.hide();
    players.forEach((p) => { doc.updatePlayerSection(p); });
    updateUI(gameStateString);
});
function createButton(parentId, buttonId, buttonText, onClickFunction) {
    const parentElement = document.getElementById(parentId);
    const button = document.createElement('button');
    button.id = buttonId;
    button.innerText = buttonText;
    button.onclick = onClickFunction;
    parentElement.appendChild(button);
}
export function startGame() {
    socket.emit('start_game');
}
export function restartGame() {
    socket.emit('restart_game', gameID);
}
window.onload = letsGo;
var currentPlayer;
var claimingPlayer;
var players = new Array();
var gameID = 0;
let currentNumPlayers;
let lossModeDice = false;
function letsGo() {
    doc.addDarkListener();
    //doc.createRulesSection();
    doc.createGameChoices(startGame);
    document.getElementById('info-section').innerText = 'Waiting for players...';
}
function updateUI(gameStateString) {
    const gameState = JSON.parse(gameStateString);
    console.log(gameState);
    players = gameState.players;
    currentPlayer = gameState.current_player;
    claimingPlayer = gameState.claiming_player;
    currentNumPlayers = players.filter(p => p.lives > 0).length;
    document.getElementById('info-section').innerText = gameState.statusMessages.join('\n');
    players.forEach((p) => {
        doc.updatePlayerSection(p);
        doc.setPlayerStatus(p, p.status);
    });
    if (currentNumPlayers <= 1) {
        doc.deactivatePlayerTurnSection();
        createButton('info-section', 'startGame', 'Play again', restartGame);
        // Remove the 'dead' class for all players
        players.forEach((player) => {
            const diceContainer = document.getElementById('dice-container' + players.indexOf(player));
            if (diceContainer) {
                diceContainer.classList.remove('dead');
            }
        });
    }
    else {
        console.log(currentPlayer, socket.id);
        if (currentPlayer.id == socket.id) {
            doc.appendInfoNewline('Your turn!');
            if (!claimingPlayer) {
                doc.activatePlayerTurnSection(new Claim(0, 0), claim, numActiveDice());
            }
            else {
                doc.activatePlayerTurnSection(claimingPlayer.claim, claim, numActiveDice());
            }
        }
        else {
            doc.deactivatePlayerTurnSection();
            doc.appendInfoNewline('Waiting for your turn...');
        }
    }
    if (gameState.revealDiceVal > 0) {
        doc.reveal(gameState.revealDiceVal);
        if (currentPlayer.id == socket.id && currentNumPlayers > 1) {
            document.getElementById('claim-button').innerText = 'Next Round!';
            doc.activatePlayerTurnSection(new Claim(0, 0), next_round, numActiveDice());
            document.getElementById('claim-button').setAttribute('disabled', 'false');
            doc.updateClaimButton(new Claim(0, 0));
        }
    }
    else {
        doc.hide();
        document.getElementById('claim-button').innerText = '❗ Claim ❗';
    }
}
function claim(claim) {
    // Send claim to server
    socket.emit('claim', JSON.stringify(claim));
}
function doubt() {
    // Send doubt to server
    socket.emit('doubt');
}
function next_round(claim) {
    // Send doubt to server
    socket.emit('next_round');
}
function startRoundMsg(p) {
    if (p.id == socket.id)
        return `You start the round.`;
    return `${p.name} starts the round.`;
}
function winnerMsg(winner) {
    if (winner.id == socket.id)
        return `You win!`;
    return `${winner.name} wins!`;
}
function totalNumDice() {
    return players.map(p => p.dice).flat().length;
}
function numActiveDice() {
    return players.filter(p => p.lives > 0).map(p => p.dice).flat().length;
}
function createPlayerSections() {
    players.forEach((p) => {
        doc.createPlayerSection(p, p.id == socket.id);
        doc.setPlayerStatus(p, Status.WAITING);
    });
}
export function getPlayerIdxByPlayer(player) {
    return players.indexOf(player);
}
//# sourceMappingURL=dice.js.map