var Employee = require('../classes/Employee');
var Jimp = require('jimp');

const COSTUME_CODE = {
    'xmas1'             : 99,
    'valentine1'        : 98,
    'formal'            : 97,
    'kemomin-cat'       : 96,
    'kemomin-dog'       : 95,
    'kemomin-rabbit'    : 94,
    'summer-blue'       : 93,
    'summer-yellow'     : 92,
    'summer-red'        : 91,
    'halloween-orange'  : 90,
    'halloween-white'   : 89,
    'xmas2-white'       : 88,
    'xmas2-red'         : 87,
    'valentine2-white'  : 86,
    'valentine2-black'  : 85,
    'school-sailor'     : 84,
    'school-blazer'     : 83,
    'plate'             : 82,
    'bikini'            : 81,
    'onsen'             : 80,
    'xmas3-white'       : 79,
    'xmas3-black'       : 78,
    'alice-white'       : 77,
    'alice-red'         : 76
}

module.exports = {
    handle: function(message, bot) {
        var command = bot.functionHelper.parseCommand(message);
        if (command.commandName !== '~chara' && command.commandName !== '~chara2') return;
        var isChara2 = (command.commandName === '~chara2');

        var costume = -1;
        // if (command.args.length > 0) {
        //     if (typeof COSTUME_CODE[command.args[0]] != 'undefined') {
        //         costume = COSTUME_CODE[command.args[0]];
        //         command.args.splice(0, 1);
        //     }
        // }

        var name = command.args.join(' ');
        if (name === '') return;
        if (name.length > 100) {
            message.reply('The name is too long!');
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
            text = 'Do you mean: ';
            for(var i=0;i<suggestions.length;i++) {
                text += '**' + suggestions[i] + '**' + (i<suggestions.length-1 ? (i<suggestions.length-2?', ':' or ') : '?');
            }
            message.reply(text);

        } else {
            var goldToDeduct = 10000;
            if (message.channel.name === bot.dmmChannelName || message.channel.name === bot.mainChannelName) {
                goldToDeduct *= 2;
            }

            if (typeof bot.freeChara[userId] == 'undefined') {
                bot.freeChara[userId] = 2;
            }

            if (bot.isPM(message)) {
                goldToDeduct = 0;
            } else if (bot.freeChara[userId] > 0) {
                bot.freeChara[userId]--;
                goldToDeduct = 0;
            }

            var userId = message.author.id;
            var player = bot.playerManager.getPlayer(userId);
            var playerGold = 0;
            if (player) playerGold = player.gold;
            if (playerGold < goldToDeduct) {
                //message.reply('You need to pay **' + goldToDeduct + ' Gold** to use this command.');
                //return;
                if (!bot.consumeBread(message)) return;
            }

            employee = new Employee(employee);

            var bustupUrl = bot.urlHelper.getIllustURL(employee, 'bustup');
            var star = 6;
            if (employee.getBaseRarity() === 5) star++;
            var enemySpriteUrl = bot.urlHelper.getCharaSpriteImageURL(employee, true, costume);
            var allySpriteUrl = bot.urlHelper.getCharaSpriteImageURL(employee, false, costume);

            var bustupFileName = 'images/bustup/' + employee.characterId + '.png';
            var enemySpriteFileName = 'images/enemy/' + bot.urlHelper.getCharaSpriteImageName(employee, costume);
            var allySpriteFileName = 'images/ally/' + bot.urlHelper.getCharaSpriteImageName(employee, costume);

            var queue = [
                { fileToDownload: enemySpriteUrl,   fileToSave: enemySpriteFileName},
                { fileToDownload: allySpriteUrl,    fileToSave: allySpriteFileName},
                { fileToDownload: bustupUrl,        fileToSave: bustupFileName}
            ];
            bot.imageHelper.download(queue, function(err) {
                if (err) {
                    message.reply('Error happened. Try again.');
                    bot.log(err);
                    return;
                }

                bot.imageHelper.read([enemySpriteFileName, allySpriteFileName, bustupFileName], function (err, imageList) {
                    if (err) {
                        message.reply('Error happened. Try again.');
                        bot.log(err);
                        return;
                    }
                    enemySpriteImage = imageList[enemySpriteFileName];
                    allySpriteImage = imageList[allySpriteFileName];
                    bustupImage = imageList[bustupFileName];

                    allySpriteImage.crop(0, 0, 360, 270);
                    enemySpriteImage.crop(0, 0, 360, 270);
                    bustupImage.resize(Jimp.AUTO, 600).opacity((isChara2?1.0:0.3));

                    var imageName = 'images/chara/' + employee.characterId + '.png';
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
                            if (channel.type === 'text' || channel.type === 'dm') {
                                var emojiName = 'k' + employee.getClass().toLowerCase();
                                const classEmoji = (message.guild == null ? null : message.guild.emojis.find('name', emojiName));
                                
                                var text = '\n';
                                text += 'Employee **No.' + employee._no + '**\n';
                                text += 'Name: **' + employee.fullName + ' (' + employee.japaneseName + ')**\n';
                                text += 'Class: **' + employee.getClass() + '** ' +  (classEmoji != null? classEmoji : '') + '\n';
                                text += 'Rarity: ';
                                for(var i=0;i<employee.getBaseRarity();i++) text += ':star:';
                                text += '\n';
                                text += 'Height: **' + (employee.height > 0 ? employee.height + ' cm' : '???') + '**\n';
                                channel.send(text, { 'files': [imageName] });
                                if (player && player.gold >= goldToDeduct) {
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