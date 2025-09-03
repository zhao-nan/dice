import random 
import numpy as np
import json

class Claim:
    count = 0
    diceVal = 0

    def __init__(self, count=0, diceVal=0):
        self.count = count
        self.diceVal = diceVal

    def to_dict(self):
        return {
            'count': self.count,
            'diceVal': self.diceVal
        }

class Status:
    WAITING = 'Waiting'
    THINKING = 'Thinking'
    CLAIM = 'Claim'
    DOUBT = 'Doubt'
    OOPS = 'Oops'
    HEH = 'Heh'
    DEAD = 'Dead'
    WINNER = 'Winner'

class Player:
    name = ""
    dice = []
    lives = 5
    claim = None
    id = 0
    status = Status.WAITING

    def __init__(self, id, name):
        self.id = id
        self.name = name
        self.status = Status.WAITING

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'lives': self.lives,
            'claim': self.claim.to_dict(),
            'dice': self.dice,
            'status': self.status
        }

class Game:
    players = []
    currentClaim = Claim(0, 0)
    current_player = None
    claiming_player = None
    current_player_id = 0
    claiming_player_id = 0
    id = 0

    def __init__(self, players, logger):
        self.players = players
        self.current_player = players[0]
        self.current_player_id = 0
        self.claiming_player = players[0]
        self.claiming_player_id = 0
        self.logger = logger
        self.logger.info(f"Game initialized with players: {[p.name for p in players]}")

    def to_dict(self):
        return {
            'players': [p.to_dict() for p in self.players],
            'currentClaim': self.currentClaim.to_dict(),
            'current_player': self.current_player.to_dict(),
            'current_player_id': self.current_player_id,
            'claiming_player': self.claiming_player.to_dict(),
            'claiming_player_id': self.claiming_player_id,
            'id': self.id
        }

    def toJSON(self):
        return json.dumps(self.to_dict(), sort_keys=True, indent=4)

    def handleMove(self, data):
        self.logger.info(f"Handling move: {data}")
        if data["action"] == "claim":
            self.current_player.claim = data["claim"]
            self.logger.info(f"Player {self.current_player.name} made a claim: {data['claim']}")
            self.next_turn()
        elif data["action"] == "doubt":
            self.logger.info(f"Player {self.current_player.name} called doubt")
            self.doubt()

    def claim(self, claim):
        self.logger.info(f"Player {self.current_player.name} claims: {claim.to_dict()}")
        self.current_player.status = Status.CLAIM
        self.current_player.claim = claim
        self.claiming_player = self.current_player
        self.claiming_player_id = self.current_player_id
        self.next_turn()

    def next_turn(self):
        self.logger.info(f"next turn")
        prev_player = self.current_player
        self.current_player = self.next_player()
        self.current_player_id = self.players.index(self.current_player)
        self.logger.info(f"Next turn: {self.current_player.name} (previous: {prev_player.name})")

    def doubt(self):
        self.logger.info(f"Doubt called by {self.current_player.name}")
        tot = self.total_num_dice_of(self.claiming_player.claim.diceVal, self.diceVals())
        self.logger.info(f"Total dice of value {self.claiming_player.claim.diceVal}: {tot}")
        if tot < self.current_claim().count:
            # Doubt justified
            pp = self.claiming_player
            self.logger.info(f"Doubt justified! {self.claiming_player.name} loses a life.")
            self.subtract_life(pp, self.current_claim().count - tot)
            self.current_player = self.prev_player()
            self.start_new_round()
        else:
            # Doubt unjustified
            self.logger.info(f"Doubt unjustified! {self.current_player.name} loses a life.")
            self.subtract_life(self.current_player, tot - self.current_claim().count)
            self.start_new_round()

    def subtract_life(self, p, diff):
        old_lives = p.lives
        p.lives -= 1
        self.logger.info(f"{p.name} loses a life. Lives: {old_lives} -> {p.lives}")
        if p.lives == 0:
            p.status = Status.DEAD
            self.logger.info(f"{p.name} is eliminated!")

    def eliminate_player(self, p):
        p.status = Status.DEAD
        self.logger.info(f"{p.name} eliminated from the game.")


    def start_new_round(self):
        self.logger.info("Starting new round.")
        for p in self.players:
            if p.lives > 0:
                p.dice = [random.randint(1, 6) for _ in range(5)]
                self.logger.info(f"{p.name} rolls: {p.dice}")
        self.reset_claims()
        self.current_player = self.prev_player()
        self.next_turn()

    def start_game(self):
        self.current_player = self.players[random.randint(0, len(self.players) - 1)]
        self.current_player_id = self.players.index(self.current_player)
        self.logger.info(f"Game started. First player: {self.current_player.name}")
        self.start_new_round()

    def reset_claims(self):
        self.logger.info("Resetting claims for all players.")
        for p in self.players:
            p.claim = Claim(0, 0)

    def current_claim(self):
        return self.prev_player().claim

    def next_player(self):
        cur_id = (self.current_player_id + 1) % len(self.players)
        while self.players[cur_id].lives <= 0:
            cur_id = (cur_id + 1) % len(self.players)
        return self.players[cur_id]

    def prev_player(self):
        cur_id = (self.current_player_id - 1) % len(self.players)
        while self.players[cur_id].lives <= 0:
            cur_id = (cur_id + len(self.players) - 1) % len(self.players)
        return self.players[cur_id]

    def diceVals(self):
        return [x for p in self.players for x in p.dice]

    def total_num_dice(self):
        return sum(len(p.dice) for p in self.players)

    def get_num_other_dice(self, p):
        return sum(len(pl.dice) for pl in self.players if pl.id != p.id and pl.lives > 0)

    def total_num_dice_of(self, val, diceVals):
        return sum(1 for d in diceVals if d == val or d == 1)