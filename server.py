import logging
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import eventlet
import json
from gameObject import Game, Player, Claim

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

games = []  # Store connected players
gamesByPlayerId = {} # Mapping player id to game
players = []

def get_players_list():
    """Generate a string of all currently connected players."""
    return ", ".join(player.name for player in players)

@socketio.on("connect")
def handle_connect():
    player = Player(request.sid, "Player" + str(len(players)))
    logger.info(f"Player connected: {player}")
    players.append(player)
    playersString = get_players_list()
    logger.info(f"Players: {playersString}")
    emit("update_players", playersString, broadcast=True)

@socketio.on("disconnect")
def handle_disconnect():
    disconnected_player = next(player for player in players if player.id == request.sid)
    players.remove(disconnected_player)
    logger.info(f"Player disconnected: {disconnected_player}")
    playersString = get_players_list()
    emit("update_players", playersString, broadcast=True)

@socketio.on("start_game")
def handle_create_game():
    """Create a new game and add the player to it."""
    game = Game(players, logger)
    games.append(game)
    for player in players:
        gamesByPlayerId[player.id] = game
    game.start_game()
    logger.info("Game started")
    emit("game_started", game.toJSON(), broadcast=True)

@socketio.on("claim")
def handle_claim(data):
    """Receives player movement and broadcasts it to all players."""
    claim = Claim(**json.loads(data))
    logger.info(f"Claim received: {claim}")
    gamesByPlayerId[request.sid].claim(claim)
    broadcastUpdate(gamesByPlayerId[request.sid])

@socketio.on("doubt")
def handle_doubt():
    """Receives player movement and broadcasts it to all players."""
    currentGame = gamesByPlayerId[request.sid]
    logger.info(f"Doubt received from player {request.sid}")
    currentGame.doubt()
    broadcastUpdate(currentGame)

def broadcastUpdate(game):
    game.current_player_id = game.players.index(game.current_player)
    data = gamesByPlayerId[request.sid].toJSON()
    emit("update_game_state", data, broadcast=True)

@app.route("/")
def home():
    return render_template("game.html")

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
