import { io } from 'socket.io-client';
import { Claim, Player, Status, GameState } from './types.js';
import * as doc from './docInteraction.js';

const socket = io("http://127.0.0.1:5000");
socket.on('update_game_state', (gameState) => {updateUI(gameState);});
socket.on('update_players', (playerString) => {
    document.getElementById('info-section').innerText = playerString;
    createButton('info-section', 'startGame', 'Start Game', startGame);
});
socket.on('game_started', (gameStateString) => {
    const gameState : GameState = JSON.parse(gameStateString);
    players = gameState.players;
    currentPlayer = players[gameState.current_player.id];
    currentNumPlayers = players.filter(p => p.lives > 0).length;
    doc.activateMainSection();

    createPlayerSections();
    doc.createPlayerTurnSection(doubt, claim, new Claim(0, 0));

    doc.hide();
    players.forEach((p) => {doc.updatePlayerSection(p)});
    updateUI(gameStateString);
})

function createButton(parentId, buttonId, buttonText, onClickFunction) {
    // Get the parent element by ID
    const parentElement = document.getElementById(parentId);

    // Create a new button element
    const button = document.createElement('button');

    // Set the button's ID
    button.id = buttonId;

    // Set the button's text
    button.innerText = buttonText;

    // Set the button's click event handler
    button.onclick = onClickFunction;
    // Append the button to the parent element
    parentElement.appendChild(button);
}

export function startGame() {
    // Send start game request to server
    // Example: socket.emit('start_game');
    socket.emit('start_game');
}

window.onload = letsGo;

var currentPlayer: Player;
var players: Player[] = new Array();
let currentNumPlayers: number;
let lossModeDice: boolean = false;

function letsGo() {
    doc.addDarkListener();
    //doc.createRulesSection();
    doc.createGameChoices(startGame);
    document.getElementById('info-section').innerText = 'Waiting for players...';
}



function updateUI(gameStateString: string) {
    const gameState : GameState = JSON.parse(gameStateString);
    console.log(gameState);
    players = gameState.players;
    currentPlayer = players[gameState.current_player_id];
    currentNumPlayers = players.filter(p => p.lives > 0).length;
    console.log(currentPlayer);

    players.forEach((p) => {
        doc.updatePlayerSection(p);
        doc.setPlayerStatus(p, p.status);
    });

    doc.appendInfoNewline(startRoundMsg(currentPlayer));
    if (currentPlayer.id == socket.id) {
        doc.appendInfoNewline('Waiting for your turn...');
        doc.activatePlayerTurnSection(currentPlayer.claim, claim, numActiveDice());
    } else {
        doc.deactivatePlayerTurnSection();
    }
}

function claim(claim: Claim) {
    // Send claim to server
    socket.emit('claim', JSON.stringify(claim));
}

function doubt() {
    // Send doubt to server
    socket.emit('doubt');
}

function startRoundMsg(p: Player) {
    if (p.id == socket.id) return `You start the round.`;
    return `${p.name} starts the round.`;
}

function winnerMsg(winner: Player) {
    if (winner.id == socket.id) return `You win!`;
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

export function getPlayerIdxByPlayer(player: Player) {
    return players.indexOf(player);
}
// Example socket event listeners
// socket.on('game_state', (gameState) => {
//     updateUI(gameState);
// });

// socket.on('player_turn', () => {
//     playerTurn();
// });