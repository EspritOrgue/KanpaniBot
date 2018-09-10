var Employee = function(employeeInfo) {
    this.DOMAIN = "http://img4.kanpani.jp";

    this.playerId = playerId;
    this._no = employeeInfo.card_no;
    this.characterId = employeeInfo.id;
    this.fullName = employeeInfo.fen_full_name;
    this.shortName = employeeInfo.en_short_name;
    this.japaneseName = employeeInfo.full_name;
    this.cwId = employeeInfo.cw_id;
    this.height = employeeInfo.height;

}

Employee.prototype.getClassId = function() {
    return parseInt(this.characterId.substring(2,3));
}

Employee.prototype.getClass = function() {
    var classValue = this.getClassId();
    if (classValue === 1) return "Fighter";
    if (classValue === 2) return "Ronin";
    if (classValue === 3) return "Archer";
    if (classValue === 4) return "Soldier";
    if (classValue === 5) return "Warrior";
    if (classValue === 6) return "Cleric";
    if (classValue === 7) return "Rogue";
    return "Magician";
}

Employee.prototype.getBaseRarity = function() {
    return parseInt(this.characterId.substring(3,4));
}

Employee.prototype.getRarity = function() {
    var rarity = 1;

    if (this.promotion == 0) {
        if (this.levelCached < 10) {
            rarity = 1;
        } else if (this.levelCached < 20) {
            rarity = 2;
        } else if (this.levelCached < 30) {
            rarity = 3;
        } else if (this.levelCached < 50) {
            rarity = 4;
        } else if (this.levelCached < 70) {
            rarity = 5;
        } else if (this.levelCached < 90) {
            rarity = 6;
        } else {
            if (this.getBaseRarity() == 5) {
                rarity = 7;
            } else {
                rarity = 6;
            }
        }
    } else {
        if (this.getBaseRarity() == 5) {
            rarity = 7;
        } else {
            rarity = 6;
        }
    }

    return Math.max(this.getBaseRarity(), rarity);
}

Employee.prototype.isEx = function() {
    return parseInt(this.characterId.substring(4,5)) == 9;
}

module.exports = Employee;
