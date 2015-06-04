var fs = require('fs'),
    db = require("../modules/database");

db.connect(function(err) {
    if (err) throw err;
});

var regions = [];

function nextSubregion(index) {
    if (index >= regions.length) {
        db.disconnect(function() {
            console.log("Done");
        });
        return;
    }
    fs.readFile("data/regions_raw/" + regions[index] + ".json", function(e,data) {
        if (e) {
            nextSubregion(index+1);
        } else {
            var cbCount = 1, cbDone = 0;
            function cb(err) {
                if (err) throw err;
                cbDone++;
                if (cbCount == cbDone) {
                    fs.writeFile("../modules/data/regions/" +regions[index] + ".json", JSON.stringify(data), function(e) {
                        if (e) throw e;
                        console.log(regions[index]);
                        nextSubregion(index+1);
                    });
                }
            }
            data = JSON.parse(data);
            var i = 0;
            data.features.sort(function(a,b) {
                var textA = a.properties.name.toUpperCase();
                var textB = b.properties.name.toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            }).forEach(function(country) {
                cbCount++;
                country.id = country.properties.id = regions[index] + (i < 10 ? "0" : "") + "" + i;
                db.query('insert ignore into regions (id, name, parent) values (?, ?, ?)',
                    [ country.id, country.properties.name, regions[index]],
                    cb);
                i++;
            });
            cb();
        }
    });
}

fs.readFile("../modules/data/regions.json", function(e, data) {
    if (e) throw e;
    data = JSON.parse(data);
    var cbCount = 1, cbDone = 0;
    function cb(err) {
        if (err) {
            throw err;
        }
        cbDone++;
        if (cbCount == cbDone) {
            nextSubregion(0);
        }
    }
    for (r in data.regions) {
        if (data.regions.hasOwnProperty(r)) {
            var region = data.regions[r];
            regions.push(r);
            cbCount++;
            db.query('insert ignore into regions (id, name) values (?, ?)',
                [ r, region.name ],
                cb);
        }
    }
    cb();
});
