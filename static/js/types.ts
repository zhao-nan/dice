
export class GameState {
    players: Player[];
    current_player: Player;
    current_player_id: number;
    claiming_player: Player;
    claiming_player_id: number;

    constructor(players = [], current_player = new Player('', ''), current_player_id = 0, claiming_player_id = 0) {
        this.players = players;
        this.current_player = current_player;
        this.current_player_id = current_player_id;
        this.claiming_player = this.claiming_player;
        this.claiming_player_id = claiming_player_id;
    }
}

export class Claim {
    count: number;
    diceVal: number;
    constructor(count = 0, diceVal = 0) {
        this.count = count;
        this.diceVal = diceVal;
    }
}

export class Player {
    name: string;
    id: string;
    lives: number;
    claim: Claim;
    dice: number[];
    status: Status;
    constructor(name, id, lives = 5, claim = new Claim(), dice = [], status = Status.WAITING) {
        this.name = name;
        this.id = id;
        this.lives = lives;
        this.claim = claim;
        this.dice = dice;
        this.status = status;
    }
}

export enum Status {
    WAITING = 'Waiting',
    THINKING = 'Thinking',
    CLAIM = 'Claim',
    DOUBT = 'Doubt',
    OOPS = 'Oops',
    HEH = 'Heh',
    DEAD = 'Dead',
    WINNER = 'Winner',
}