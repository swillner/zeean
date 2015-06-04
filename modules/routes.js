var fs = require("fs"),
    db = require("./database"),
    logger = require("./logger");

module.exports = function(app) {

    app.set('views', __dirname + '/../views');
    app.engine('html', require('ejs').renderFile);

    app.get("/", function(req, res) {
        res.render("home.ejs");
    });

    app.get("/about", function(req, res) {
        res.render("about.ejs");
    });

    app.get("/media", function(req, res) {
        res.render("media.ejs");
    });

    app.get("/team", function(req, res) {
        res.render("team.ejs");
    });

    app.get("/impressum", function(req, res) {
        res.render("impressum.ejs");
    });

    app.get("/visualization", function(req, res) {
        //req.session.error = "Our database is currently under maintenance and will be back online in a few hours. Sorry for the inconvenience.";
        //res.redirect("/");
        res.render("visualization.ejs");
    });

    app.get("/documentation", function(req, res) {
        res.render("documentation.ejs");
    });

    app.get("/videos", function(req, res) {
        res.render("videos.ejs");
    });

    app.get("/todo", function(req, res) {
        db.query('SELECT visualization, region_from, name, value FROM visualization_data, regions WHERE visualization>=90 and visualization<=113 and region_from=id', function(err, datainserted) {
        res.render("todo.ejs", {regions: datainserted});
        });
    });

    app.get("/input", function(req, res) {
        res.render("input.ejs");
    });

    app.get("/upload", function(req, res) {
        res.render("upload.ejs");
    });

    app.get("/signup", function(req, res) {
        res.render("signup.ejs");
    });

    app.get("/signin", function(req, res) {
        res.render("signin.ejs");
    });

    app.get("/regions", function(req, res) {
        res.sendfile(__dirname + "/data/regions.json");
    });

    app.get("/geojson", function(req, res) {
        if (req.query && req.query.country) {
            var file = __dirname + "/data/regions/" + (""+req.query.country).substr(0,3) + ".json";
            fs.exists(file, function(exists) {
                if (exists) {
                    res.sendfile(file);
                } else {
                    res.send({
                        result: "error",
                        error: "no subregions found"
                    });
                }
            });
        } else {
            res.sendfile(__dirname + "/data/world.json");
        }
    });

    app.get("/sectors", function(req, res) {
        res.sendfile(__dirname + "/data/sectors.json");
    });

};

