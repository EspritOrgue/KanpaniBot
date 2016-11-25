var Jimp = require("jimp");

module.exports = {
    handle: function(message, bot) {
        var text = message.content.trim().toLowerCase();
        if (text !== "~inventory") return;
        if (!bot.isPM(message)) {
            message.reply("You can only check your Inventory in Private Message.");
            return;
        }

        var userId = message.author.id;
        var player = bot.playerManager.getPlayer(userId);
        if (player == null) {
            message.reply("You haven't selected your character.");
            return;
        }

        var backupItemDropText = "";
        var itemNameList = [];
        for(key in player.materialList) {
            if (player.materialList[key] > 0) {
                itemNameList.push(key);
                backupItemDropText += key + " x" + player.materialList[key] + "\n";    
            }
        }

        var itemInfoList = bot.itemInfoDatabase.getItemInfosByNames(itemNameList);
        itemInfoList.sort(function(a, b) {
            if (a._id < b._id) return -1;
            if (a._id > b._id) return 1;
            return 0;
        })

        var queue = [];
        var itemFileNameList = [];
        for(var i=0;i<itemInfoList.length;i++) {
            var itemFileName = "images/item/small/" + itemInfoList[i]._id + ".png";
            var itemUrl = "http://img4.kanpani.jp/img/icon/item/small/" + itemInfoList[i]._id + ".png";
            queue.push({
                fileToDownload: itemUrl, fileToSave: itemFileName
            })
            itemFileNameList.push(itemFileName);
        }

        var text = "Your Inventory:\n";

        bot.imageHelper.download(queue, function(err) {
            if (err) {
                message.author.sendMessage(text + backupItemDropText);
                return;
            }
            bot.imageHelper.read(itemFileNameList, function (err, imageList) {
                if (err) {
                    message.author.sendMessage(text + backupItemDropText);
                    return;
                }

                const ITEM_CELL_WIDTH = 240;
                const ITEM_CELL_HEIGHT = 50;
                const NUM_COL = 3;

                var imageWidth = ITEM_CELL_WIDTH*NUM_COL;
                var imageHeight = Math.ceil(imageList.length/NUM_COL) * ITEM_CELL_HEIGHT;

                var image = new Jimp(imageWidth, imageHeight, 0xFFFFFFFF, function (err, image) {
                    if (err) {
                        message.author.sendMessage(text + backupItemDropText);
                        return;
                    }

                    Jimp.loadFont(Jimp.FONT_SANS_16_BLACK).then(function (font) {
                        image.opacity(0.4);

                        for(var i=0;i<imageList.length;i++) {
                            var row = Math.floor(i/NUM_COL);
                            var col = i%NUM_COL;
                            image.composite(imageList[i], 7 + col*ITEM_CELL_WIDTH, 7 + row*ITEM_CELL_HEIGHT);
                            image.print(font, 55 + col*ITEM_CELL_WIDTH, 7 + row*ITEM_CELL_HEIGHT, itemInfoList[i].itemName);
                            image.print(font, 55 + col*ITEM_CELL_WIDTH, 27 + row*ITEM_CELL_HEIGHT, "x" + player.materialList[itemInfoList[i].itemName]);
                            image.print(font, 125 + col*ITEM_CELL_WIDTH, 27 + row*ITEM_CELL_HEIGHT, "Price: " + itemInfoList[i].price);
                        }
                        var imageName = "images/inventory/" + userId + ".png";
                        image.write(imageName, function() {
                            var channel = message.channel;
                            if (channel.type === "text" || channel.type === "dm") {
                                message.author.sendFile(imageName, "png", text);
                            }   
                        });
                    });
                });
            });
        });
    }
}