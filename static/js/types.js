export class GameState {
    constructor(players = [], current_player = new Player('', ''), current_player_id = 0) {
        this.players = players;
        this.current_player = current_player;
        this.current_player_id = current_player_id;
    }
}
export class Claim {
    constructor(count = 0, diceVal = 0) {
        this.count = count;
        this.diceVal = diceVal;
    }
}
export class Player {
    constructor(name, id, lives = 5, claim = new Claim(), dice = [], status = Status.WAITING) {
        this.name = name;
        this.id = id;
        this.lives = lives;
        this.claim = claim;
        this.dice = dice;
        this.status = status;
    }
}
export var Status;
(function (Status) {
    Status["WAITING"] = "Waiting";
    Status["THINKING"] = "Thinking";
    Status["CLAIM"] = "Claim";
    Status["DOUBT"] = "Doubt";
    Status["OOPS"] = "Oops";
    Status["HEH"] = "Heh";
    Status["DEAD"] = "Dead";
    Status["WINNER"] = "Winner";
})(Status || (Status = {}));
//# sourceMappingURL=types.js.map