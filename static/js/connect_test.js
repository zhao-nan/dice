const socket = io.connect("http://127.0.0.1:5000");

// When connected
socket.on("connect", () => {
    console.log("Connected to server");
});

// Send player movement to server
function sendMove(data) {
    socket.emit("player_move", data);
}

// Receive updated game state from server
socket.on("update_game_state", (data) => {
    document.getElementById('message').innerText = data;
});

document.getElementById('send').addEventListener('click', function() {
    sendMove("Test");
        });