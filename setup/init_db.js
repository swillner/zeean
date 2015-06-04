
var fs = require('fs'),
    mysql = require("mysql");

var db = mysql.createConnection({
    host: "localhost",
    user: "zeean"
});

function getCallback() {
    if (!getCallback.count) {
        getCallback.count = 0;
        getCallback.done = 0;
    }
    getCallback.count++;
    return function (err) {
        if (err) {
            throw err;
        }
        getCallback.done++;
        if (getCallback.count===getCallback.done) {
            if (err) {
                throw err;
            }
            db.end(function() {
                console.log("done");
            });
        }
    };
}

db.query('drop database if exists zeean', getCallback());
db.query('create database zeean', getCallback());
db.query('use zeean', getCallback());
db.query('drop table if exists entries', getCallback());
db.query('drop table if exists regions', getCallback());
db.query('create table if not exists regions ('
        + 'id char(6) primary key not null,'
        + 'name varchar(100) not null,'
        + 'parent char(6),'

        + 'foreign key (parent) references regions(id),'
        + 'index (parent) using hash'
    + ')', getCallback());
db.query('insert into regions (id,name) values ("","")', getCallback());

db.query('drop table if exists sectors', getCallback());
db.query('create table if not exists sectors ('
        + 'id char(6) primary key not null,'
        + 'name varchar(100) not null,'
        + 'description varchar(100) not null default "",'
        + 'parent char(6),'

        + 'foreign key (parent) references sectors(id),'
        + 'index (parent) using hash'
    + ')', getCallback());
db.query('insert into sectors (id,name) values ("","")', getCallback());

fs.readFile("../modules/data/sectors.json", function(e, data){
    if (e) throw e;
    data = JSON.parse(data);
    var cb = getCallback();

    function insert(sectors, parent) {
        sectors.forEach(function(s) {
            var sector = data[s];
            getCallback.count++;
            db.query('insert into sectors (id, name, parent, description) values (?, ?, ?, ?)',
                [ s, sector.name, parent || "ALL", sector.desc || "" ],
                function(e) {
                    if (e) throw e;
                    if (data[s].sub && data[s].sub.length > 1) {
                        insert(data[s].sub, s);
                    }
                    cb();
                });
        });
    }

    db.query('insert into sectors (id, name, description) values ("ALL", "All", "All sectors")', [], function() {
        insert(data.order, "ALL");
        cb();
    });
});

db.query('drop table if exists users', getCallback());
db.query('create table if not exists users ('
        + 'id int unsigned primary key not null auto_increment,'
        + 'username varchar(255) not null,'
        + 'password varchar(50) not null,'
        + 'email varchar(50) not null unique,'
        + 'level smallint not null default 0,'
        + 'secret varchar(255),'
        + 'registration timestamp not null default current_timestamp,'
        + 'last_login timestamp not null default 0'
    + ')', getCallback());

["", "pre"].forEach(function(prefix) {
    db.query('create table if not exists ' + prefix + 'entries ('
            + 'region_from char(6) not null default "",'
            + 'region_to char(6) not null default "",'
            + 'sector_from char(6) not null default "",'
            + 'sector_to char(6) not null default "",'
            + 'value decimal(15,3) unsigned not null,'
            + 'year smallint not null,'
            + 'confidence tinyint unsigned not null,'
            + 'source varchar(255) not null default "",'
            + 'comment varchar(1000) not null default "",'
            + 'user int unsigned not null,'
            + 'inserted timestamp not null default current_timestamp,'

            + 'primary key (year, sector_from, region_from, sector_to, region_to, user),'
            + 'foreign key (region_from) references regions(id),'
            + 'foreign key (region_to)   references regions(id),'
            + 'foreign key (sector_from) references sectors(id),'
            + 'foreign key (sector_to)   references sectors(id),'
            + 'foreign key (user)        references users(id),'

            + 'index (year)        using hash,'
            + 'index (region_from) using hash,'
            + 'index (region_to  ) using hash,'
            + 'index (sector_from) using hash,'
            + 'index (sector_to  ) using hash'
        + ')', getCallback());
});

db.query('insert into users (id, username, password, email, level) values (1, ?, password(?), ?, 2)',
    [ "zeean", "commongrid", "info@zeean.net"], getCallback());

db.query('create table if not exists visualizations ('
        + 'id int unsigned primary key not null auto_increment,'
        + 'name varchar(100) not null,'
        + 'description varchar(255),'
        + 'dimension tinyint unsigned not null,'
        + 'year smallint not null,'
        + 'updated timestamp not null default 0,'

        + 'unique index (year, name)'
    + ')', getCallback());

db.query('create table if not exists visualization_data ('
        + 'visualization int unsigned not null,'
        + 'region_from char(6) not null default "",'
        + 'region_to char(6) not null default "",'
        + 'sector_from char(6) not null default "",'
        + 'sector_to char(6) not null default "",'
        + 'value decimal(15,3) not null,'

        + 'primary key (visualization, sector_from, region_from, sector_to, region_to),'
        + 'foreign key (visualization) references visualizations(id),'
        + 'foreign key (region_from)   references regions(id),'
        + 'foreign key (region_to)     references regions(id),'
        + 'foreign key (sector_from)   references sectors(id),'
        + 'foreign key (sector_to)     references sectors(id),'

        + 'index (visualization) using hash,'
        + 'index (region_from  ) using hash,'
        + 'index (region_to    ) using hash,'
        + 'index (sector_from  ) using hash,'
        + 'index (sector_to    ) using hash'
    + ')', getCallback());
/*
db.query('create or replace view flows_ as select \
region_from,\
sector_from,\
region_to,\
sector_to,\
year,\
round(sum(value*confidence)*count(confidence)/sum(confidence), 3) as flow,\
count(value) as num_entries \
from entries group by year, region_from, sector_from, region_to, sector_to', getCallback());

db.query('create or replace view output as select \
sector_from as i,\
region_from as r,\
sum(flow) as output,\
count(flow) as num_out,\
year \
from flows_ group by year, region_from, sector_from', getCallback());

db.query('create or replace view input as select \
sector_to as j,\
region_to as s,\
sum(flow) as input,\
count(flow) as num_in,\
year \
from flows_ group by year, region_to, sector_to', getCallback());

db.query('create or replace view inputs as select \
sector_from as i,\
sector_to as j,\
region_to as s,\
sum(flow) as input,\
count(flow) as num_in,\
sum(flow)/e_in.input as rel_in,\
e.year as year \
from flows_ as e \
join input as e_in on e_in.year=e.year and e_in.j=sector_to and e_in.s=region_to \
group by e.year, region_to, sector_from, sector_to', getCallback());

db.query('create or replace algorithm=merge view flows as select \
e.sector_from as i,\
e.region_from as r,\
e.sector_to as j,\
e.region_to as s,\
e.flow as flow,\
e.flow/e_in.input as rel_in,\
e.flow/e_ins.input as rel_ins,\
e.flow/e_out.output as rel_out,\
e.year \
from flows_ as e \
join input as e_in on e_in.year=e.year and e_in.s=e.region_to and e_in.j=e.sector_to \
join inputs as e_ins on e_ins.year=e.year and e_ins.s=e.region_to and e_ins.j=e.sector_to and e_ins.i=e.sector_from \
join output as e_out on e_out.year=e.year and e_out.r=e.region_from and e_out.i=e.sector_from'
, getCallback());
*/
for (var year = 1990; year <= 2011; year++) {
/*    var year_short = ((year % 100) < 10 ? '0' : '') + '' + (year % 100);
    db.query('create or replace view output' + year_short + ' as select \
    sector_from as i,\
    region_from as r,\
    sum(flow) as output,\
    count(flow) as num_out \
    from flows_ where year=' + year + ' group by region_from, sector_from', getCallback());

    db.query('create or replace view input' + year_short + ' as select \
    sector_to as j,\
    region_to as s,\
    sum(flow) as input,\
    count(flow) as num_in \
    from flows_ where year=' + year + ' group by region_to, sector_to', getCallback());

    db.query('create or replace view inputs' + year_short + ' as select \
    sector_from as i,\
    sector_to as j,\
    region_to as s,\
    sum(flow) as input,\
    count(flow) as num_in,\
    round(sum(flow)/e_in.input,3) as rel_in \
    from flows_\
    join input' + year_short + ' as e_in on e_in.j=sector_to and e_in.s=region_to \
    where year=' + year + ' group by region_to, sector_from, sector_to', getCallback());

    db.query('create or replace algorithm=merge view flows' + year_short + ' as select \
    e.sector_from as i,\
    e.region_from as r,\
    e.sector_to as j,\
    e.region_to as s,\
    round(e.flow,3) as flow,\
    round(e.flow/e_in.input,3) as rel_in,\
    round(e.flow/e_ins.input,3) as rel_ins,\
    round(e.flow/e_out.output,3) as rel_out \
    from flows_ as e \
    join input' + year_short + ' as e_in on e_in.s=e.region_to and e_in.j=e.sector_to \
    join inputs' + year_short + ' as e_ins on e_ins.s=e.region_to and e_ins.j=e.sector_to and e_ins.i=e.sector_from \
    join output' + year_short + ' as e_out on e_out.r=e.region_from and e_out.i=e.sector_from \
    where e.year=' + year, getCallback());
*/
    db.query('insert into visualizations (name, dimension, year) values ("NAP1", 1, ' + year + ')', getCallback());
    db.query('insert into visualizations (name, dimension, year) values ("NAP2", 1, ' + year + ')', getCallback());
    db.query('insert into visualizations (name, dimension, year) values ("Betweenness", 1, ' + year + ')', getCallback());
    db.query('insert into visualizations (name, dimension, year) values ("Flow Centrality", 1, ' + year + ')', getCallback());
}
