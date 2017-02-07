module.exports = {
    handle: function(message, bot) {
        var command = bot.functionHelper.parseCommand(message);
        if (command.commandName != "~trainer") return;

        if (!bot.battleController.trainerField) {
            message.reply("Trainer is not available at the moment.");
            return;
        }

        if (message.channel.name != "battlefield") {
            message.reply("You cannot use this command outside of Battlefield.");
            return;
        }

        var text = "";
        for(var i=0;i<2;i++) {
            for(var j=0;j<3;j++) {
                var trainerId = bot.battleController.trainerField[i][j];
                var trainerUnit = bot.playerManager.getPlayerUnit(trainerId);
                var trainerUser = bot.userManager.getUser(trainerId);

                if (trainerId && trainerUnit && trainerUser) {
                    const elementEmoji = (message.guild == null ? trainerUnit.element : message.guild.emojis.find('name', 'k' + trainerUnit.element));
                    text += "User: **" + trainerUser.username + "**\n";
                    text += "Character: **" + trainerUnit.fullName + "** (" + (elementEmoji?elementEmoji+", ":"") + "Lv.**" + trainerUnit.levelCached  + "**)\n";
                    var now = new Date();
                    var percentHP = Math.floor(trainerUnit.getCurrentHP()/trainerUnit.getMaxHP()*100);
                    text += "HP: **" + trainerUnit.getCurrentHP() + "/" + trainerUnit.getMaxHP() + " (" + percentHP +"%)**" + (trainerUnit.respawnTime?" (Respawn in " + bot.functionHelper.parseTime(trainerUnit.respawnTime - now.valueOf()) + ")":"") + "\n";
                    text += "Status: ";
                    for(key in trainerUnit.status) {
                        var statusName = key;
                        if (trainerUnit.status[statusName]) text += "**" + trainerUnit.status[statusName] + "** ";    
                    }
                    text += "\n";
                    
                    text += "Position: **" + (i == 0?"Frontline":"Backline") + "** " + "\n";
                    text += "Skill: **" + trainerUnit.getCurrentSkill() + "**\n";
                    text += "\n";   
                }
            }
        }
        var now = new Date();
        if (bot.battleController.endTime) {
            var remainTime = bot.battleController.endTime - now.valueOf();
            var time = bot.functionHelper.parseTime(remainTime);
            text += "\Remaining Time: " + time;    
        }
        if (bot.battleController.respawnTime) {
            var remainTime = bot.battleController.respawnTime - now.valueOf();
            var time = bot.functionHelper.parseTime(remainTime);
            text += "\uRespawn Time: " + time;    
        }
        
        if (text.length > 0) {
            message.channel.sendMessage(text);    
        } else {
            message.channel.sendMessage("There is no trainer at the moment.");
        }
    }
};