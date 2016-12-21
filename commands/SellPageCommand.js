module.exports = {
    handle: function(message, bot) {
        var command = bot.functionHelper.parseCommand(message);
        if (command.commandName != "~sellpage") return;
        if (!bot.isPM(message)) {
            message.reply("You can only sell items in Private Message.");
            return;
        }
        var category = command.args[0];
        if (category != "wp" && category != "ar" && category != "acc") {
            message.reply("The category must be either `wp`, `ar` or `acc`.");
            return;
        }
        var pageInText = command.args[1];
        if (isNaN(pageInText)) {
            message.reply("You need to specify the page to sell.");
            return;
        }
        var page = parseInt(pageInText);
        if (page < 1) {
            message.reply("The page number is invalide.");
            return;
        }

        var equipmentDict = {};
        if (category == "wp") {
            equipmentDict = player.weaponList;
        } else if (category == "ar") {
            equipmentDict = player.armorList;
        } else if (category == "acc") {
            equipmentDict = player.accessoryList;
        }
        var equipmentList = [];
        for(key in equipmentDict) {
            for(var i=0;i<5;i++) {
                if (equipmentDict[key]['+'+i]) {
                    equipmentList.push({
                        _id: key,
                        plus: i
                    });
                }
            }
        }
        equipmentList.sort(function(a, b) {
            if (b.plus != a.plus) return b.plus - a.plus;
            if (a._id < b._id) return -1;
            if (a._id > b._id) return 1;
        });
        var NUM_EQUIPMENT_PER_PAGE = 10;
        var soldCount = 0;
        var userId = message.author.id;
        var text = "";
        var totalGoldGained = 0;
        for(var i=(page-1)*NUM_EQUIPMENT_PER_PAGE; i<Math.min((page-1)*NUM_EQUIPMENT_PER_PAGE, equipmentList.length); i++) {
            var itemInfo = null;
            var itemName = "";
            if (category === "wp") {
                itemInfo = bot.weaponDatabase.getWeaponById(equipmentList[i]._id);  
                itemName = itemInfo.weaponName;
            } else if (category === "ar") {
                itemInfo = bot.armorDatabase.getArmorByName(equipmentList[i]._id);
                itemName = itemInfo.armorName;
            } else if (category === "acc") {
                itemInfo = bot.accessoryDatabase.getAccessoryByName(equipmentList[i]._id);
                itemName = itemInfo.accessoryName;
            }
            if (!itemInfo) continue;
            var itemPrice = itemInfo.stats["+"+equipmentList[i].plus].price;    
            var amount = equipmentDict[equipmentList[i]._id]['+'+equipmentList[i].plus];
            var goldGained = itemPrice * amount;
            bot.playerManager.addGold(userId, goldGained);
            if (category === "wp") {
                bot.playerManager.removeWeapon(userId, itemInfo._id, equipmentList[i].plus, amount);
            } else if (category === "ar") {
                bot.playerManager.removeArmor(userId, itemInfo._id, equipmentList[i].plus, amount);
            } else if (category === "acc") {
                bot.playerManager.removeAccessory(userId, itemInfo._id, equipmentList[i].plus, amount);
            }
            bot.savePlayer();

            text = amount + " " + itemName + " +" + equipmentList[i].plus + " for **" + goldGained + " Gold**.\n";
            message.reply(text);
            soldCount += amount;
            totalGoldGained += goldGained;
        }
        text = "You have sold **" + soldCount + " item(s)**:\n" + text;
        text += "Total: **" + totalGoldGained + " Gold**";
        message.reply(text);
    }
}