var db = require("./database"),
    fs = require("fs"),
    logger = require("./logger"),
    lineReader = require('line-reader');

module.exports = function(app) {
    var regions,
        sectors;

    app.post("/data/entry", app.requireLogin, function(req, res) {
        var query = "";
        var values = "";
        var values_array = [];
        if (!isNaN(req.body.year)) {
            if (+req.body.year >= 1990 && +req.body.year <= 2013) {
                query += "year,";
                values += "?,";
                values_array.push(+req.body.year);
            } else {
                res.send({
                    result: "error",
                    error: "year out of range"
                });
                return;
            }
        } else {
            res.send({
                result: "error",
                error: "no year given"
            });
            return;
        }
        if (!isNaN(req.body.value)) {
            if (+req.body.value >= 100) {
                query += "value,";
                values += "?,";
                values_array.push(+req.body.value);
            } else {
                res.send({
                    result: "error",
                    error: "value out of range"
                });
                return;
            }
        } else {
            res.send({
                result: "error",
                error: "no value given"
            });
            return;
        }
        if (!isNaN(req.body.confidence)) {
            if (+req.body.confidence >= 1 && +req.body.confidence <= 5) {
                query += "confidence,";
                values += "?,";
                values_array.push(+req.body.confidence);
            } else {
                res.send({
                    result: "error",
                    error: "confidence out of range"
                });
                return;
            }
        } else {
            res.send({
                result: "error",
                error: "no confidence given"
            });
            return;
        }
        if (!req.body.sector_from && !req.body.region_from) {
            res.send({
                result: "error",
                error: "incomplete data"
            });
            return;
        }
        if (req.body.sector_from) {
            query += "sector_from,";
            values += "?,";
            values_array.push(req.body.sector_from);
        }
        if (req.body.region_from) {
            query += "region_from,";
            values += "?,";
            values_array.push(req.body.region_from);
        }
        if (req.body.sector_to) {
            query += "sector_to,";
            values += "?,";
            values_array.push(req.body.sector_to);
        }
        if (req.body.region_to) {
            query += "region_to,";
            values += "?,";
            values_array.push(req.body.region_to);
        }

        query += "source,";
        values += "?,";
        values_array.push(req.body.source || "");

        query += "comment,";
        values += "?,";
        values_array.push(req.body.comment || "");

        query += "user";
        values += "?";
        values_array.push(+req.session.user.id);

        db.query("replace into "
            + (req.session.user.trusted ? "entries" : "preentries")
            + " (" + query + ") values (" + values + ")",
            values_array, function (err) {
            if (err) {
                logger.exception(err);
                res.send({
                    result: "error",
                    error: "db error"
                });
            } else {
                res.send({
                    result: "success"
                });
            }
        });
    });

    app.get("/data/entry", function(req, res) {
        var query = "";
        var values_array = [];
        query += "sector_from=? and ";
        values_array.push(req.query.sector_from || "");
        query += "region_from=? and ";
        values_array.push(req.query.region_from || "");
        query += "sector_to=? and ";
        values_array.push(req.query.sector_to || "");
        query += "region_to=? and ";
        values_array.push(req.query.region_to || "");
        if (!isNaN(req.query.year)) {
            query += "year=?";
            values_array.push(+req.query.year);
        } else {
            res.send({
                result: "error",
                error: "no year given"
            });
            return;
        }
        db.query("(select value, confidence, source, comment, username, true as trusted"
            + " from entries join users on users.id=entries.user where " + query + ")"
            + " union (select value, confidence, source, comment, username, false as trusted"
            + " from preentries join users on users.id=preentries.user where " + query + ")",
            values_array.concat(values_array),
            function(err, results, fields) {
                if (err) {
                    logger.exception(err);
                    res.send({
                        result: "error",
                        error: "db error"
                    });
                } else {
                    res.send({
                        result: results
                    });
                }
            });
    });

    app.post("/data/file", function(req, res) {
        if (!req.session || !req.session.user || !req.session.user.name || typeof(req.session.id)==="undefined") {
            req.session.error = "Error: You are not logged in";
            res.redirect("/upload");
            return;
        }
        if (isNaN(req.body.year)) {
            req.session.error = "Error: No year given";
            res.redirect("/upload");
            return;
        }
        if (+req.body.year < 1990 || +req.body.year > 2013) {
            req.session.error = "Error: Year must be between 1990 and 2013 (including)";
            res.redirect("/upload");
            return;
        }
        if (["ir->s", "ir->js", "i->js", "ir", "r"].indexOf(req.body.type)==-1) {
            req.session.error = "Error: Unknown data type";
            res.redirect("/upload");
            return;
        }
        if (!req.files || !req.files.rowindex || !req.files.data
            || ((req.body.type=="ir->s" || req.body.type=="ir->js" || req.body.type=="i->js") && !req.files.colindex)) {
            req.session.error = "Error: File missing";
            res.redirect("/upload");
            return;
        }

        var parseCsvFileControlled = function(fileName, callback, success, error) {
            var lineNumber = 0, err;
            lineReader.eachLine(fileName, function(line, last, cb) {
                if (line!="" && line!="\r") {
                    callback(line.split(","), lineNumber, cb, function(e) {
                        err = e;
                        cb(false);
                    });
                    lineNumber++;
                } else {
                    cb();
                }
            }).then(function() {
                if (err) {
                    error(err);
                } else {
                    success();
                }
            });
        }

        var rowindex = {
            length: 0
        };
        var colindex = {
            length: 0
        };
        var doImport = function(success, error) {
            var importedCount = 0, ignoredCount = 0;
            parseCsvFileControlled(req.files.data.path, function(rec, from, next, error) {
                var values = [];
                if ((colindex && rec.length != colindex.length)
                    || (!colindex && rec.length != 1)) {
                    error({
                        name: "Import",
                        message: "Wrong number of column entries in line " + (from + 1) + " in " + req.files.data.name,
                        advanced: req.body.type + " " + colindex + " " + (colindex && colindex.length) + " " + rec.length + " " + rec.join(",")
                    });
                    return;
                }
                if (from >= rowindex.length) {
                    error({
                        name: "Import",
                        message: "Too many rows in " + req.files.data.name + " compared to " + req.files.rowindex.name,
                        advanced: req.body.type + " " + rowindex + " " + (rowindex.length) + " " + from
                    });
                    return;
                }
                for (var to = 0; to < rec.length; to++) {
                    var value = rec[to];
                    if (isNaN(value)) {
                        error({
                            name: "Import",
                            message: "Entry '" + value + "' is not a number (line " + (from + 1) + " in " + req.files.data.name
                        });
                        return;
                    }
                    if (+value >= 100) { 
                        values.push([
                            rowindex[from].region || "",
                            colindex ? (colindex[to].region || "") : "",
                            rowindex[from].sector || "",
                            colindex ? (colindex[to].sector || ""): "",
                            +value,
                            +req.body.year,
                            +req.body.confidence || 0,
                            req.body.source || "",
                            req.body.comment || "",
                            +req.session.user.id
                        ]);
                        importedCount++;
                    } else {
                        ignoredCount++;
                    }
                }
                if (values.length > 0) {
                    db.query("replace into "
                        + (!req.session.user.trusted ? "pre" : "")
                        + "entries (region_from, region_to, sector_from, sector_to, value, year, confidence, source, comment, user)"
                        + " values ?",
                        [values],
                        function (e, res) {
                            if (e) {
                                error(e);
                            } else {
                                values = undefined;
                                setTimeout(next, 1);
                            }
                        });
                } else {
                    setTimeout(next, 1);
                }
            }, function() {
                success(importedCount, ignoredCount);
            }, error);
        };

        var readIndices = function(success, error) {
            parseCsvFileControlled(req.files.rowindex.path, function(rec, line, next, error) {
                var res = {};
                if (req.body.type=="ir" || req.body.type=="ir->js" || req.body.type=="ir->s") {
                    if (rec.length != 2) {
                        error({
                            name: "Import",
                            message: "Wrong number of columns in line " + (line + 1) + " in " + req.files.rowindex.name
                        });
                        return;
                    }
                    res.region = (rec[0] + "").replace("\r", "");
                    res.sector = (rec[1] + "").replace("\r", "");
                } else {
                    if (rec.length != 1) {
                        error({
                            name: "Import",
                            message: "Wrong number of columns in line " + (line + 1) + " in " + req.files.rowindex.name
                        });
                        return;
                    }
                    if (req.body.type=="i->js") {
                        res.sector = (rec[0] + "").replace("\r", "");
                    } else {
                        res.region = (rec[0] + "").replace("\r", "");
                    }
                }
                if (res.region && regions.indexOf(res.region)==-1) {
                    error({
                        name: "Import",
                        message: "Region " + res.region + " (line " + (line + 1) + " in " + req.files.rowindex.name + ") does not exist in database"
                    });
                    return;
                }
                if (res.sector && sectors.indexOf(res.sector)==-1) {
                    error({
                        name: "Import",
                        message: "Sector " + res.sector + " (line " + (line + 1) + " in " + req.files.rowindex.name + ") does not exist in database"
                    });
                    return;
                }
                rowindex[line] = res;
                rowindex.length++;
                setTimeout(next, 1);
            }, function() {
                if (req.body.type=="i->js" || req.body.type=="ir->js" || req.body.type=="ir->s") {
                    parseCsvFileControlled(req.files.colindex.path, function(rec, line, next, error) {
                        var res = {};
                        if (req.body.type=="i->js" || req.body.type=="ir->js") {
                            if (rec.length != 2) {
                                error({
                                    name: "Import",
                                    message: "Wrong number of columns in line " + line + " in " + req.files.colindex.name
                                });
                                return;
                            }
                            res.region = (rec[0] + "").replace("\r", "");
                            res.sector = (rec[1] + "").replace("\r", "");
                        } else {
                            if (rec.length != 1) {
                                error({
                                    name: "Import",
                                    message: "Wrong number of columns in line " + line + " in " + req.files.colindex.name
                                });
                                return;
                            }
                            res.sector = (rec[0] + "").replace("\r", "");
                        }
                        if (res.region && regions.indexOf(res.region)==-1) {
                            error({
                                name: "Import",
                                message: "Region " + res.region + " (line " + line + " in " + req.files.colindex.name + ") does not exist in database"
                            });
                            return;
                        }
                        if (res.sector && sectors.indexOf(res.sector)==-1) {
                            error({
                                name: "Import",
                                message: "Sector " + res.sector + " (line " + line + " in " + req.files.colindex.name + ") does not exist in database"
                            });
                            return;
                        }
                        colindex[line] = res;
                        colindex.length++;
                        setTimeout(next, 1);
                    }, success, error);
                } else {
                    colindex = null;
                    success();
                }
            }, error);
        };

        var error = function(err) {
            if (err.name=="Import") {
                logger.error("Error: " + err.message + " (" + err.advanced + ")");
                req.session.error = "Error: " + err.message;
            } else {
                logger.error("Error importing file, ", err.stack);
                req.session.error = "Error: Import failed";
            }
            res.redirect("/upload");
        };

        var start = function() {
            readIndices(function() {
                db.query("start transaction", [], function(err) {
                    if (err) {
                        error(err)
                    } else {
                        doImport(function(importedCount, ignoredCount) {
                            db.query("commit", [], function (e) {
                                if (e) {
                                    db.query("rollback", [], function() {
                                        error(err);
                                    });
                                } else {
                                    req.session.message = "Thank you! Your data has been successfully imported ("
                                        + importedCount + " entries imported"
                                        + (ignoredCount > 0 ? " / " + ignoredCount + " ignored for being < 1000k$" : "")
                                        + " in "
                                        + rowindex.length + " rows"
                                        + (colindex ? " / " + colindex.length + " columns" : "")
                                        + ").";
                                    res.redirect("/upload");
                                }
                            });
                        }, function(err) {
                            db.query("rollback", [], function() {
                                error(err);
                            });
                        });
                    }
                });
            }, error);
        };

        if (!regions || !sectors) {
            db.query("select id from regions", [], function(err, results) {
                if (err) {
                    error(err);
                } else {
                    regions = results.map(function(r) { return r.id; });
                    db.query("select id from sectors", [], function(err, results) {
                        if (err) {
                            error(err);
                        } else {
                            sectors = results.map(function(r) { return r.id; });
                            start();
                        }
                    });
                }
            });
        } else {
            start();
        }
    });

};

