var mysql  = require("mysql"),
    db;

function handleDisconnect(callback) {
    callback();

    db = mysql.createConnection({
        host: "localhost",
        user: "zeean",
        database: "zeean",
        multipleStatements: true
    });

    db.connect(function(err) {
        if(err) {
            callback(err);
            setTimeout(function() {
                handleDisconnect(callback);
            }, 2000);
        }
    });

    db.on('error', function(err) {
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            setTimeout(function() {
                handleDisconnect(callback);
            }, 2000);
        } else {
            callback(err);
            throw err;
        }
    });
}

exports.connect = function(callback) {
    handleDisconnect(callback);
};

exports.query = function(query, parameters, callback) {
    return db.query(query, parameters, callback);
};

exports.disconnect = function(callback) {
    db.end(callback);
};

