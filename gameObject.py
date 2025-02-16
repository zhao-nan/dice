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
    current_player_id = 0
    id = 0

    def __init__(self, players):
        self.players = players
        self.current_player = players[0]
        self.current_player_id = 0

    def to_dict(self):
        return {
            'players': [p.to_dict() for p in self.players],
            'currentClaim': self.currentClaim.to_dict(),
            'current_player': self.current_player.to_dict(),
            'current_player_id': self.current_player_id,
            'id': self.id
        }

    def toJSON(self):
        return json.dumps(self,
                            default=lambda o: o.__dict__,
                            sort_keys=True, indent=4)

    def handleMove(self, data):
        if data["action"] == "claim":
            self.current_player.claim = data["claim"]
            self.next_turn()
        elif data["action"] == "doubt":
            self.doubt()

    def claim(self, claim):
        self.current_player.status = Status.CLAIM
        self.current_player.claim = claim
        self.next_turn()

    def next_turn(self):
        self.current_player = self.next_player()

    def doubt(self):
        tot = self.total_num_dice_of(self.current_player.claim.diceVal, self.diceVals())
        if tot < self.current_claim().count:
            # Doubt justified
            pp = self.prev_player()
            self.subtract_life(pp, self.current_claim().count - tot)
            self.current_player = self.prev_player()
            self.start_new_round()
        else:
            # Doubt unjustified
            self.subtract_life(self.current_player, tot - self.current_claim().count)
            self.start_new_round()

    def subtract_life(self, p, diff):
        p.lives -= 1
        if p.lives == 0:
            p.Status = Status.DEAD

    def eliminate_player(self, p):
        p.status = Status.DEAD

    def claim(self, claim):
        self.current_player.claim = claim
        self.current_player.status = Status.CLAIM


    def start_new_round(self):
        for p in self.players:
            if p.lives > 0:
                p.dice = [random.randint(1, 6) for _ in range(5)]
        self.reset_claims()
        self.current_player = self.prev_player()
        self.next_turn()

    def start_game(self):
        self.current_player = self.players[random.randint(0, len(self.players) - 1)]
        self.start_new_round()

    def reset_claims(self):
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