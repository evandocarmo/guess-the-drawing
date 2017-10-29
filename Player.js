exports.Player = class {
    constructor(name,lastPlayerId,socket) {
        this.name = name;
        this.id = lastPlayerId + 1;
        this.role = 'player';
        this.socket = socket;
    }
}