var logger = require("./logger"),
    cron   = require("cron");

var jobs = [];

exports.init = function() {
    jobs.push(new cron.CronJob({
        cronTime: "10 0 * * *", // minute(0-59) hour(0-23) day_of_month(0-31) month(0-12 or names) day_of_week(0-7 [0+7 Sun] or names))
        onTick: function() {
            // Cleean up users who did not follow their link in time
            db.query("delete from users where secret is not null and timestampdiff(day, registration, now())>3", [], function(err, results) {
                if (err) {
                    logger.error("Error cleaning up users", err);
                } else {
                    if (results.affectedRows > 0) {
                        logger.log("Cleaned up " + results.affectedRows + " users");
                    }
                }
            });
        }
    }));
};

exports.start = function() {
    jobs.forEach(function(job) {
        job.start;
    });
};

