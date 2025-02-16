from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import eventlet


app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

players = {}  # Store connected players

def get_players_list():
    """Generate a string of all currently connected players."""
    return ", ".join(players.values())

@socketio.on("connect")
def handle_connect():
    players[request.sid] = "Player " + str(len(players) + 1)
    playersString = get_players_list()
    emit("update_game_state", playersString, broadcast=False)

@socketio.on("disconnect")
def handle_disconnect():
    players.pop(request.sid)
    print(players)
    print("A player disconnected!")

@socketio.on("player_move")
def handle_player_move(data):
    """Receives player movement and broadcasts it to all players."""
    print(players[request.sid] + " moved to " + str(data))
    emit("update_game_state", data, broadcast=True)

@app.route("/")
def home():
    return render_template("index2.html")

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
