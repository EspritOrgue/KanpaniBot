var Employee = require('../classes/Employee');
var Jimp = require("jimp");

module.exports = {
    handle: function(message, bot) {
        var command = bot.functionHelper.parseCommand(message);
        if (command.commandName !== "~chara" && command.commandName !== "~chara2") return;
        var isChara2 = (command.commandName === "~chara2");

        var name = command.args.join(" ");
        if (name === "") return;
        if (name.length > 100) {
            message.reply("The name is too long!");
            return;
        }

        var employee = bot.employeeDatabase.getEmployeeByCommonName(name);
        if (employee == null) {
            var classId = bot.functionHelper.getClassId(name)
            var suggestions = [];
            if (classId) {
                suggestions = bot.employeeDatabase.getSuggestionsByClass(classId);
            } else {
                suggestions = bot.employeeDatabase.getSuggestionsByName(name);
            }
            text = "Do you mean: ";
            for(var i=0;i<suggestions.length;i++) {
                text += "**" + suggestions[i] + "**" + (i<suggestions.length-1 ? (i<suggestions.length-2?", ":" or ") : "?");
            }
            message.reply(text);

        } else {
            var goldToDeduct = 10000;
            if (message.channel.name === bot.dmmChannelName || message.channel.name === bot.nutakuChannelName) {
                goldToDeduct *= 2;
            }
            if (bot.isPM(message)) goldToDeduct = 0;

            var userId = message.author.id;
            var player = bot.playerManager.getPlayer(userId);
            var playerGold = 0;
            if (player) playerGold = player.gold;
            if (playerGold < goldToDeduct) {
                message.reply("You need to pay **" + goldToDeduct + " Gold** to use this command.");
                return;
            }

            employee = new Employee(employee);

            var bustupUrl = bot.urlHelper.getIllustURL(employee, "bustup");
            var star = 6;
            if (employee.getBaseRarity() === 5) star++;
            var enemySpriteUrl = bot.urlHelper.getCharaSpriteImageURL(employee, true);
            var allySpriteUrl = bot.urlHelper.getCharaSpriteImageURL(employee, false);

            var bustupFileName = "images/bustup/" + employee.characterId + ".png";
            var enemySpriteFileName = "images/enemy/" + bot.urlHelper.getCharaSpriteImageName(employee);
            var allySpriteFileName = "images/ally/" + bot.urlHelper.getCharaSpriteImageName(employee);

            var queue = [
                { fileToDownload: enemySpriteUrl,   fileToSave: enemySpriteFileName},
                { fileToDownload: allySpriteUrl,    fileToSave: allySpriteFileName},
                { fileToDownload: bustupUrl,        fileToSave: bustupFileName}
            ];
            bot.imageHelper.download(queue, function(err) {
                if (err) {
                    message.reply("Error happened. Try again.");
                    bot.log(err);
                    return;
                }

                bot.imageHelper.read([enemySpriteFileName, allySpriteFileName, bustupFileName], function (err, imageList) {
                    if (err) {
                        message.reply("Error happened. Try again.");
                        bot.log(err);
                        return;
                    }
                    enemySpriteImage = imageList[enemySpriteFileName];
                    allySpriteImage = imageList[allySpriteFileName];
                    bustupImage = imageList[bustupFileName];

                    allySpriteImage.crop(0, 0, 360, 270);
                    enemySpriteImage.crop(0, 0, 360, 270);
                    bustupImage.resize(Jimp.AUTO, 600).opacity((isChara2?1.0:0.3));

                    var imageName = "images/chara/" + employee.characterId + ".png";
                    var image = new Jimp(480, 290, function (err, image) {

                        image.composite(bustupImage, 
                            -Math.floor((bustupImage.bitmap.width - image.bitmap.width)/2), 
                            -Math.floor((bustupImage.bitmap.height - image.bitmap.height)/2) - 20
                        );
                        if (!isChara2) {
                            image.composite(enemySpriteImage, 160, 0)
                            .composite(allySpriteImage, -60, 40);
                        }
                        image.crop(1, 0, 478, 290)
                        .write(imageName, function() {
                            var channel = message.channel;
                            if (channel.type === "text" || channel.type === "dm") {
                                var emojiName = 'k' + employee.getClass().toLowerCase();
                                const classEmoji = (message.guild == null ? null : message.guild.emojis.find('name', emojiName));
                                
                                var text = "\n";
                                text += "Employee **No." + (employee.isEx()?"EX":"") + (employee._no == 0? "???":employee._no)  + "**\n";
                                text += "Name: **" + employee.fullName + " (" + employee.japaneseName + ")**\n";
                                text += "Class: **" + employee.getClass() + "** " +  (classEmoji != null? classEmoji : "") + "\n";
                                text += "Rarity: ";
                                for(var i=0;i<employee.getBaseRarity();i++) text += ":star:";
                                text += "\n";
                                channel.sendFile(imageName, "png", text);
                                if (player) {
                                    player.gold -= goldToDeduct;
                                    bot.savePlayer();
                                }
                            }    
                        });
                    });
                });
            });
        }        
    }
}