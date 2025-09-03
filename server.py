import time
import logging
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import eventlet
import json
from game.Claim import Claim
from game.Player import Player
from game.Game import Game



# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
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
    logger.debug(f"Player connected: {player}")
    players.append(player)
    playersString = get_players_list()
    logger.debug(f"Players: {playersString}")
    emit("update_players", playersString, broadcast=True)

@socketio.on("disconnect")
def handle_disconnect():
    disconnected_player = next(player for player in players if player.id == request.sid)
    players.remove(disconnected_player)
    logger.debug(f"Player disconnected: {disconnected_player}")
    playersString = get_players_list()
    emit("update_players", playersString, broadcast=True)

@socketio.on("restart_game")
def handle_restart_game(data):
    game = next((g for g in games if data == g.id), None)
    if game:
        logger.debug(f"Restarting game with id {data}")
        game.restart()
        game.start_game()
        emit("update_game_state", game.toJSON(), broadcast=True)
    else:
        logger.error(f"Game with id {data} not found for restart.")

@socketio.on("start_game")
def handle_create_game():
    """Create a new game and add the player to it."""
    game = Game(players)
    games.append(game)
    for player in players:
        gamesByPlayerId[player.id] = game
    game.start_game()
    logger.debug("Game started")
    emit("game_started", game.toJSON(), broadcast=True)

@socketio.on("claim")
def handle_claim(data):
    """Receives player movement and broadcasts it to all players."""
    claim = Claim(**json.loads(data))
    logger.debug(f"Claim received: {claim}")
    game = gamesByPlayerId[request.sid]
    game.claim(claim)
    broadcastUpdate(game)

@socketio.on("doubt")
def handle_doubt():
    """Receives player movement and broadcasts it to all players."""
    currentGame = gamesByPlayerId[request.sid]
    logger.debug(f"Doubt received from player {request.sid}")
    currentGame.doubt()
    broadcastUpdate(currentGame)

    #time.sleep(3)
    #if sum(1 for pl in currentGame.players if pl.lives > 0) > 1:
        #currentGame.start_new_round()
        #broadcastUpdate(currentGame)

@socketio.on("next_round")
def handle_next_round():
    currentGame = gamesByPlayerId[request.sid]
    logger.debug(f"Next round requested by player {request.sid}")
    if sum(1 for pl in currentGame.players if pl.lives > 0) > 1:
        currentGame.start_new_round()
        broadcastUpdate(currentGame)

def broadcastUpdate(game):
    data = game.toJSON()
    emit("update_game_state", data, broadcast=True)

@app.route("/")
def home():
    return render_template("game.html")

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
