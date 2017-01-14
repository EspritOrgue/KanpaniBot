var elsa = require('./EmployeeBot');
var config = require('./config');
var dialog = require('./Dialog');
var fs = require('fs');

var trainingController = require('./controllers/TrainingController');

var lastTimePat = {};
var affection = {};
var touches = [
    {
        point: -15,
        text: "You are touching me too much! >\"<"
    },{
        point: -7,
        text: "Yaaa... I'm weak that place... Hey!"
    },{
        point: -5,
        text: "Hey, you are messing my hair >.<"
    },{
        point: 1,
        text: "You have nothing else to do, do you?"
    },{
        point: 2,
        text: "I don't dislike you patting me though."
    },{
        point: 3,
        text: "Is patting me that fun?"
    },{
        point: 5,
        text: "Does patting my head feel good to you?"
    },{
        point: 7,
        text: "You sure do love tails... Hmm.. What is so fun about it..?"
    },{
        point: 9,
        text: "Your touch is so warm and gentle, I like it :heart:"
    }
];

var status = [
    {
        start: -100,
        end: -100,
        text: "Elsa hates you now!!!"
    },{
        start: -99,
        end: -91,
        text: "Elsa thinks you are the worst."
    },{
        start: -90,
        end: -71,
        text: "Elsa feels scared when seeing you."
    },{
        start: -70,
        end: -21,
        text: "Elsa is trying to hide from you."
    },{
        start: -20,
        end: -11,
        text: "Elsa feels uncomfortable with you."
    },{
        start: -10,
        end: -1,
        text: "Elsa feels annoyed a bit."
    },{
        start: 0,
        end: 9,
        text: "Elsa only thinks of you as her boss."
    },{
        start: 10,
        end: 19,
        text: "Elsa is getting used to your touch."
    },{
        start: 20,
        end: 29,
        text: "Elsa feels comfortable with your hands."
    },{
        start: 30,
        end: 39,
        text: "Elsa enjoys working under you."
    },{
        start: 40,
        end: 49,
        text: "Elsa wants to play with you everyday."
    },{
        start: 50,
        end: 69,
        text: "Elsa wants you to pat her more."
    },{
        start: 70,
        end: 89,
        text: "Elsa feels happy when staying by your side."
    },{
        start: 90,
        end: 94,
        text: "Elsa feels anxious when you are not by her side."
    },{
        start: 95,
        end: 100,
        text: "Elsa now entrusts her life to you."
    }
];

elsa.declineNotEnoughBread = elsa.declineNotEnoughBread.concat(dialog.elsa.decline);
var affectionFileName = "affection.json";

function saveAffection() {
    var textToWrite = JSON.stringify(affection, null, 4);
    fs.writeFile(affectionFileName, textToWrite, function(err) {
        if(err) {
            elsa.log(err);
            return;
        }
    }); 
}

function loadAffection() {
    fs.readFile(affectionFileName, 'utf8', function (err, data) {
        if (err) {
            elsa.log(err);
            return;
        }
        affection = JSON.parse(data);
    });
}

const REWARD_ROLE_NAME = 'Ally of Kemomin';

function updateRole(message, member) {
    if (member == null) return;
    if (elsa.isPM(message)) return;
    var allyRole = message.guild.roles.find('name', REWARD_ROLE_NAME);
    if (allyRole == null) return;
    
    var userId = member.id;
    if (affection[userId] >= 100) {
        member.addRole(allyRole).then(guildMember => {
        }).catch(err => {
            elsa.log("Sorry, I don't have permission to add this Role.");
        });
    } else {
        member.removeRole(allyRole).then(guildMember => {
        }).catch(err => {
            elsa.log("Sorry, I don't have permission to remove this Role.");
        });
    }
}

function handlePatCommand(message) {
    var userId = message.author.id;
    if (typeof lastTimePat[userId] === "undefined") lastTimePat[userId] = 0;
    if (typeof affection[userId] === "undefined") affection[userId] = 0;
    if (message.channel.name === elsa.dmmChannelName) return;
    if (!elsa.consumeBread(message)) return;

    var now = new Date();
    var index = 0;
    if (now.valueOf() - lastTimePat[userId] < 2*60*1000) {
        index = elsa.functionHelper.randomIntRange(0, 3);
    } else {
        index = elsa.functionHelper.randomIntRange(1, 8);
    }
    var point = affection[userId] + touches[index].point;
    affection[userId] = Math.max(Math.min(point, 100), -100);
    elsa.total_bread++;
    
    var text = touches[index].text + "\n";
    text += "Affection: " + affection[userId] + "/100 (" + (touches[index].point>=0?"+":"") + touches[index].point + ")\n";
    text += elsa.createRemainingBreadLine(message);
    
    message.reply(text);
    lastTimePat[userId] = now.valueOf();
    saveAffection();
    updateRole(message, message.member);
}

function handleStatusCommand(message) {
    var userId = message.author.id;
    if (typeof lastTimePat[userId] == "undefined") lastTimePat[userId] = 0;
    if (typeof affection[userId] == "undefined") affection[userId] = 0;

    for(var i=0;i<status.length;i++) {
        if (status[i].start <= affection[userId] && affection[userId] <= status[i].end) {
            var text = status[i].text + "\n";
            text += "Affection: " + affection[userId] + "/100";
            message.reply(text);
            updateRole(message, message.member);
            return;
        }
    }
}

function handleRankingCommand(message) {
    if (elsa.preventPM(message)) return;
    var result = [];
    for (key in affection) {
        result.push({
            userId: key,
            point: affection[key]
        });
    }
    result.sort(function(a, b) {
        return b.point - a.point;
    })
    var count = 0;
    var text = "Top 10 players Elsa likes the most:\n";
    
    message.guild.fetchMembers().then(guild => {
        for(var i=0;i<Math.min(result.length, 10);i++) {
            if (i==0 || result[i-1].point != result[i].point) count = i;
            var member = guild.members.get(result[i].userId);
            if (member) {
                text += (count+1) + ". " + member.user.username + " (" + result[i].point + ")\n";
            }
        }
        for(var i=0;i<result.length;i++) {
            var member = guild.members.get(result[i].userId);
            if (member) updateRole(message, member);
        }
        message.channel.sendMessage(text);
    }).catch(err => {
        message.channel.sendMessage("Fetching member error!");
    });
}

function handleMyRankingCommand(message) {
    if (elsa.preventPM(message)) return;
    var result = [];
    for (key in affection) {
        result.push({
            userId: key,
            point: affection[key]
        });
    }
    result.sort(function(a, b) {
        return b.point - a.point;
    })
    
    message.guild.fetchMembers().then(guild => {

        var userId = message.author.id;
        var userOrder = 0;
        for(;userOrder<result.length;userOrder++) {
            if (result[userOrder].userId === userId) break;
        }
        if (userOrder == result.length) {
            message.reply("You are not in the ranking.");
            return;
        } else {
            var count = 0;
            var text = "Your ranking:\n";
            var lower_bound = Math.min(userOrder + 4, result.length-1);
            var upper_bound = Math.max(lower_bound - 9, 0);
            lower_bound = Math.min(upper_bound + 9, result.length-1);
            for(var i=0;i<result.length;i++) {
                if (i==0 || result[i-1].point != result[i].point) count = i;
                var member = guild.members.get(result[i].userId);
                if (member && (upper_bound <= i) && (i<=lower_bound)) {
                    if (i === userOrder) {
                        text += "**" + (count+1) + ". " + member.user.username + " (" + result[i].point + ")**\n";
                    } else {
                        text += (count+1) + ". " + member.user.username + " (" + result[i].point + ")\n";    
                    }
                }
            }
        }

        for(var i=0;i<result.length;i++) {
            var member = guild.members.get(result[i].userId);
            if (member) updateRole(message, member);
        }
        message.channel.sendMessage(text);
    }).catch(err => {
        message.channel.sendMessage("Fetching member error!");
    });
}

function handleReduceCommand(message) {
    if (!elsa.isAdmin(message)) return;
    for(key in affection) {
        affection[key] = Math.floor(affection[key]/2);
    }
    saveAffection();
}

function handleResetCommand(message) {
    if (!elsa.isAdmin(message)) return;
    affection = {};
    saveAffection();
}

elsa.bot.on("message", function(message) {
    if (message.channel.type === "text" && message.channel.name === elsa.nutakuChannelName 
            && message.author.id != elsa.bot.user.id) {
        elsa.hasNewMessage = true;
    }
    elsa.initBreadIfNeed(message.author.id);

    var command = message.content.trim().toLowerCase();
    switch (command) {
    case "~pat":
        handlePatCommand(message);
        break;
    case "~status":
        handleStatusCommand(message);
        break;
    case "~rank":
        handleRankingCommand(message);
        break;
    case "~myrank":
        handleMyRankingCommand(message);
        break;
    case "~reduce":
        handleReduceCommand(message);
        break;
    case "~reset":
        handleResetCommand(message);
        break;
    default:
        elsa.handleCommonCommand(message);
        break;
    }
});

elsa.greetings = dialog.elsa.greetings;
elsa.idleTalks = dialog.elsa.idleTalks;
elsa.commonGoodMorning = elsa.commonGoodMorning.concat(dialog.elsa.commonGoodMorning);
elsa.commonGoodNight = elsa.commonGoodNight.concat(dialog.elsa.commonGoodNight);
elsa.commonThanks = elsa.commonThanks.concat(dialog.elsa.commonThanks);

var isLocal = true;
isLocal = false;

if (isLocal) {
    elsa.playerData = [
        {
            _id: "240097185436270593",  // test-bot
            characterId: "10150002_765306d2",
            exp: 2646190,//2646190,
            gold: 0,
            equipedWeapon: {
                _id: "308119",
                plus: 3
            },
            equipedArmor: {
                _id: "3101140",
                plus: 1
            },
            equipedAccessory: {
                _id: "330206",
                plus: 1
            },
            materialList: {},
            weaponList: {},
            armorList: {},
            accessoryList: {},
            position: "front",
            partnerId: null,
            isTrainer: true
        },{
            _id: "265889287281573918",  // test-bot2
            characterId: "10350003_fcc3ce23",
            exp: 2646190,//2646190,
            gold: 0,
            equipedWeapon: {
                _id: "308320",
                plus: 3
            },
            equipedArmor: {
                _id: "3103071",
                plus: 1
            },
            equipedAccessory: {
                _id: "330006",
                plus: 1
            },
            materialList: {},
            weaponList: {},
            armorList: {},
            accessoryList: {},
            position: "back",
            partnerId: null,
            isTrainer: true
        }
    ];
} else {
    elsa.playerData = [
        {
            _id: "241511566036434945",
            characterId: "10150002_765306d2",
            exp: 5370000,//2646190,
            gold: 0,
            equipedWeapon: {
                _id: "308119",
                plus: 3
            },
            equipedArmor: {
                _id: "3101140",
                plus: 3
            },
            equipedAccessory: {
                _id: "330206",
                plus: 3
            },
            materialList: {},
            weaponList: {},
            armorList: {},
            accessoryList: {},
            position: "front",
            partnerId: null,
            isTrainer: true
        },{
            _id: "269733140635975680",  // Hinano Guest
            characterId: "10350003_fcc3ce23",
            exp: 5370000,//2646190,
            gold: 0,
            equipedWeapon: {
                _id: "308320",
                plus: 3
            },
            equipedArmor: {
                _id: "3107071",
                plus: 3
            },
            equipedAccessory: {
                _id: "330206",
                plus: 3
            },
            materialList: {},
            weaponList: {},
            armorList: {},
            accessoryList: {},
            position: "back",
            partnerId: null,
            isTrainer: true
        }
    ];
}

elsa.bot.on("ready", function() {
    if (elsa.ready()) {
        loadAffection();
        for(var i=0;i<elsa.playerData.length;i++) {
            elsa.unitManager.createUnitForPlayer(elsa.playerData[i]);    
        }
        trainingController.bot = elsa;
        if (isLocal) {
            trainingController.trainerField = [
                [null, "240097185436270593", null],
                [null, "265889287281573918", null]
            ];
        } else {
            trainingController.trainerField = [
                [null, "241511566036434945", null],
                [null, "269733140635975680", null]
            ];    
        }
        
        elsa.battleController = trainingController;
    }
    
});

elsa.token = config.elsa;
elsa.login();