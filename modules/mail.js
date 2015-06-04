var nodemailer = require("nodemailer"),
    smtp;

function connect() {
    smtp = nodemailer.createTransport("SMTP", {
        host: "localhost",
        port: 25
    });
};

exports.send = function(options, callback) {
    if (!smtp) {
        connect();
    }
    options.from = options.from || "zeean <info@zeean.net>";
    return smtp.sendMail(options, callback);
};

