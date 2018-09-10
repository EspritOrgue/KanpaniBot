var request = require("request");
var employee;

function KTHelper(){
  this.url = "https://kanpanitools.com/master/characters";
  this.employeeList;
}

KTHelper.prototype.contains = function(list,str) {
  return;
};

KTHelper.prototype.load = function(){
  request({
    url: this.url,
    json: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {
        employee = body;
        this.employeeList = employee;
        console.log("Loaded "+this.employeeList.length+" employees");
    }
  });
};

KTHelper.prototype.getList = function () {
  return this.employeeList;
};

KTHelper.prototype.getEmployee = function(shortName){
  if(this.employeeList != undefined){
    shortName = shortName.trim().toLowerCase();
    for(employee in this.employeeList){
      if(this.employeeList[employee].en_short_name.trim().toLowerCase() == shortName ||
        this.employeeList[employee].card_no.trim().toLowerCase() == shortName){
          console.log("Employee found");
          return this.employeeList[employee];
        }
    }
  }else{
    console.log("List not loaded");
  }
  console.log("Employee not found");
  return null;
}

function getMinimumEditDistance(name1, name2) {
    name1 = name1.trim().toLowerCase();
    name2 = name2.trim().toLowerCase();
    if (name2.startsWith(name1)) return 0;
    if (name2.endsWith(name1)) return 0;
    name1 = "#" + name1;
    name2 = "#" + name2;

    var distance = [];
    for(var i=0;i<name1.length;i++) {
        distance.push([]);
        for(var j=0;j<name2.length;j++) distance[i].push(1000000000);
    }
    for(var i=0;i<name1.length;i++) distance[i][0] = i;
    for(var i=0;i<name2.length;i++) distance[0][i] = i;
    for(var i=1;i<name1.length;i++) {
        for(var j=1;j<name2.length;j++) {
            if (name1[i] === name2[j]) {
                distance[i][j] = Math.min(distance[i][j], distance[i-1][j-1]);
            } else {
                distance[i][j] = Math.min(distance[i][j], distance[i-1][j-1]+2);
            }
            distance[i][j] = Math.min(distance[i][j], distance[i-1][j]+1);
            distance[i][j] = Math.min(distance[i][j], distance[i][j-1]+1);
        }
    }
    return distance[name1.length-1][name2.length-1];
}

KTHelper.prototype.getSuggestionsByName = function(shortName){
  if(this.employeeList != undefined){
    shortName = shortName.trim().toLowerCase();
    var nameList = [];
    for(var i=0;i<this.employeeList.length;i++) {
        if (this.employeeList[i].en_full_name === "") continue;

        nameList.push({
            name: this.employeeList[i].en_short_name,
            score: getMinimumEditDistance(shortName, this.employeeList[i].en_short_name)
        });
        nameList.push({
            name: this.employeeList[i].en_short_name,
            score: getMinimumEditDistance(shortName, this.employeeList[i].en_full_name)
        });
        nameList.push({
            name: this.employeeList[i].en_short_name,
            score: getMinimumEditDistance(shortName, this.employeeList[i].full_name)
        });
        nameList.push({
            name: this.employeeList[i].en_short_name,
            score: getMinimumEditDistance(shortName, this.employeeList[i].card_no)
        });
    }
    nameList.sort(function(a,b) {
        if (a.score != b.score) {
            return a.score - b.score;
        } else {
            return a.name < b.name;
        }
    });
    var resultDict = {};
    resultDict[nameList[0].name] = true;
    for(var i=1;i<nameList.length;i++) {
        if (nameList[i].score == nameList[i-1].score) {
            resultDict[nameList[i].name] = true;
        } else break;
    }
    var resultList = [];
    for(key in resultDict) resultList.push(key);
    return resultList;
  }
  console.log("Sugg by name not worked");
  return null;
}

KTHelper.prototype.getSuggestionsByClass = function(classId){
  if(this.employeeList != undefined){
    var resultList = [];
    for(var i=0;i<this.employeeList.length;i++) {
        var employeeId = this.employeeList[i].chara_id;
        if (parseInt(employeeId.substring(2,3)) == classId) {
            resultList.push(this.employeeList[i].en_short_name);
        }
    }
    return resultList;
  }
  return null;
}
module.exports = new KTHelper();
