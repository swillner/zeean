var db = require("./database"),
    logger = require("./logger"),
    mail = require("./mail");

module.exports = function(app) {
    var Recaptcha = require('recaptcha').Recaptcha;
    var captchaPublic, captchaPrivate;

    app.configure('production', function() {
        captchaPublic = "XXX";
        captchaPrivate = "XXX";
    });

    app.requireLogin = function(req, res, next) {
        if (!req.session || !req.session.user || !req.session.user.name || typeof(req.session.id)==="undefined") {
            res.send({
                result: "error",
                error: "not logged in"
            });
        } else {
            next();
        }
    };

    app.get("/users/recaptcha", function(req, res) {
        res.send({
            recaptcha: captchaPublic
        });
    });

    app.get("/users/session", function(req, res) {
        res.send({
            username: (req.session && req.session.user ? req.session.user.name : undefined)
        });
    });

    app.post("/users/session", function(req, res) {
        db.query("select id, username, level from users where email=? and password=password(?) and secret is null",
            [ req.body.email || "", req.body.password || "" ],
            function(err, results, fields) {
                if (err) {
                    logger.exception(err);
                    res.send({
                        result: "error",
                        error: "db error"
                    });
                    return;
                }
                if (results.length===1) {
                    // Successful login
                    req.session.user = {
                        id: +results[0].id,
                        name: results[0].username,
                        trusted: (results[0].level>0),
                        level: results[0].level,
                        email: req.body.email
                    };
                    db.query("update users set last_login=now() where id=?", [ results[0].id ]);
                    res.send({
                        result: "success",
                        username: results[0].username
                    });
                } else {
                    // User/password mismatch
                    res.send({
                        result: "error",
                        error: "Login failed"
                    });
                }
            }
        );
    });

    app.get("/users/logout", function(req, res) {
        req.session.destroy();
        res.redirect("/");
    });

    app.post("/users/register", function(req, res) {
        var recaptcha = new Recaptcha(captchaPublic, captchaPrivate, {
            remoteip:  req.connection.remoteAddress,
            challenge: req.body.recaptcha_challenge_field,
            response:  req.body.recaptcha_response_field
        });

        recaptcha.verify(function(success, error_code) {
            if (success) {
                if ((req.body.email + "").length < 5) {
                    res.send({
                        result: "error",
                        error: "email invalid"
                    });
                    return;
                }
                if ((req.body.username + "").length < 5) {
                    res.send({
                        result: "error",
                        error: "email invalid"
                    });
                    return;
                }
                db.query("select id from users where email=?",
                    [ req.body.email ],
                    function(err, results, fields) {
                        if (err) {
                            logger.exception(err);
                            res.send({
                                result: "error",
                                error: "db error"
                            });
                            return;
                        }
                        if (results.length===1) {
                            res.send({
                                result: "error",
                                error: "user exists"
                            });
                        } else {
                            var rand = function() {
                                return Math.random().toString(36).substr(2);
                            };
                            var secret = rand() + rand();
                            var link = "http://www.zeean.net/users/validate?secret=" + secret;
                            mail.send({
                                to: req.body.email,
                                subject: "You have registered to zeean - please confirm",
                                text: "Welcome to the zeean-team!\
\r\nIt is really great that you are joining in. We would like to better understand the global economic network and very much appreciate your help.\
\r\n\
\r\nPlease confirm that it was you who has registered by following this link (you might have to copy it into the adress bar of your browser):\n" + link + "\
\r\nYes, I have registered to zeean.\
\r\n\
\r\nAfter confirmation you will be able to contribute data to the network. Your status will be that of a novice which means that your input will not directly enter the database but needs to be validated by a mentor first. With time you can become a mentor yourself. \
\r\n\
\r\nRelevant for becoming a mentor is the quality of your entries. To that end, please try to give the source of your input as precisely as possible, so that it can be checked. While we really want to collect as much data as possible, we need to keep the quality at very high standards.\
\r\n\
\r\nThe Howto link is meant to help you understand what kind of data you may enter and where to find it. Please use it extensively. \
\r\n\
\r\nWe are almost as new to this as you are so please help us get better by providing constructive feedback to info@zeean.net\
\r\n\
\r\nYour zeean-team\r\n\
",
                                html: "Welcome to the zeean-team!<br/>\
<br/>\
It is really great that you are joining in. We would like to better understand the <b>global economic network</b> and very much appreciate your help.<br/>\
<br/>\
Please confirm that it was you who has registered by following this link:<br/>\
<b><a href='" + link + "'>Yes, I have registered to zeean</a></b>.<br/>\
<br/>\
After confirmation you will be able to contribute data to the network. Your status will be that of a <b>novice</b> which means that your input will not directly enter the database but needs to be validated by a mentor first. With time you can become a mentor yourself.<br/>\
<br/>\
Relevant for becoming a mentor is the <b>quality</b> of your entries. To that end, please try to give the source of your input as precisely as possible, so that it can be checked. While we really want to collect as much data as possible, we need to keep the quality at very high standards.<br/>\
<br/>\
The <b>Howto</b> link is meant to help you understand what kind of data you may enter and where to find it. Please use it extensively.<br/>\
<br/>\
We are almost as new to this as you are so please help us get better by providing <b>constructive feedback to <a href='mailto:info@zeean.net'>info@zeean.net</a></b><br/>\
<br/>\
Your zeean-team<br/>\
"
                            }, function(err) {
                                if (err) {
                                    logger.exception(err);
                                    res.send({
                                        result: "error",
                                        error: "mail error"
                                    });
                                } else {
                                    db.query("insert into users (email, username, password, secret) values (?, ?, password(?), ?)",
                                        [ req.body.email, req.body.username, req.body.password, secret ],
                                        function(err, results, fields) {
                                            if (err) {
                                                logger.exception(err);
                                                res.send({
                                                    result: "error",
                                                    error: "db error"
                                                });
                                                return;
                                            }
                                            if (typeof(results.insertId)!=="undefined") {
                                                res.send({
                                                    result: "success",
                                                    username: req.body.username
                                                });
                                            } else {
                                                res.send({
                                                    result: "error",
                                                    error: "db error"
                                                });
                                            }
                                        }
                                    );
                                }
                            });
                        }
                    }
                );
            } else {
                res.send({
                    result: "error",
                    error: "recaptcha invalid"
                });
            }
        });
    });

    app.get("/users/validate", function(req, res) {
        if (req.query.secret) {
            db.query("select id, username, email from users where secret=?",
                [ req.query.secret ],
                function(err, results, fields) {
                    if (err) {
                        logger.exception(err);
                        req.session.error = "Error: Database error";
                        res.redirect("/signin");
                        return;
                    }
                    if (results.length!==1) {
                        req.session.error = "Error: User not found. Sorry, you have to sign up again";
                        res.redirect("/signup");
                        return;
                    }
                    db.query("update users set secret=NULL where secret=?",
                        [ req.query.secret ],
                        function(er) {
                            if (err) {
                                logger.exception(err);
                                req.session.error = "Error: Database error";
                                res.redirect("/signin");
                                return;
                            }
                            req.session.message = "Great! Your account has been activated. Welcome to zeean, please log in...";
                            res.redirect("/signin");
                        }
                    );
                }
            );
        } else {
            req.session.error = "Error: Parameter 'secret' missing";
            res.redirect("/signin");
        }
    });

};

