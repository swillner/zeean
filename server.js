var express = require("express"),
    db      = require("./modules/database"),
    cron    = require("./modules/cron"),
    logger  = require("./modules/logger"),
    app     = express();

app.configure(function(){
    app.use(express.limit('50mb'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser("3&DlkncJ82$%j"));
    app.use(express.session({
        secret: "3&DlkncJ82$%j",
        maxAge: 3600000
    }));
    app.use(function(req, res, next) {
        res.locals.ip = req.connection.remoteAddress;
        res.locals.user = req.session.user;
        res.locals.message = req.session.message;
        delete req.session.message;
        res.locals.error = req.session.error;
        delete req.session.error;
        next();
    });
    app.use(app.router);
    app.use(express.static(__dirname + '/www'));
});

db.connect(function(err) {
    if (err) {
        logger.error("Database error: ", err);
    }
});

require("./modules/users")(app);
require("./modules/data")(app);
require("./modules/entries")(app);
require("./modules/convert")(app);
require("./modules/routes")(app);

app.get("/favicon.ico", function(req, res) {
    res.sendfile(__dirname + "/www/images/favicon.ico");
});

app.listen(80);

cron.init();
cron.start();

logger.info("Started");

