var db = require("./database");

function disaggregate_from(year, region, sector, flows, success, error) {
    var result = [];
    function next(index) {
        function iteration(quality, total_flow, sub_flows) {
            function harmonize_iteration() {
                var sum_exact = 0,
                    sum_not_exact = 0,
                    count_exact = 0;
                sub_flows.forEach(function(f) {
                    if (f.quality == quality) {
                        sum_exact += f.value;
                        count_exact++;
                    } else {
                        sum_not_exact += f.value;
                    }
                });
                if (count_exact > 0) {
                    sub_flows.forEach(function(f) {
                        if (f.quality < quality) {
                            f.value = (total_flow.value - sum_exact) * f.value / sum_not_exact;
                        }
                    });
                }
            }

            switch(quality) {
                case 0:
                    if (region && sector) {
                        db.query("select ?/((select count(regions.id) from regions where parent=?) * (select count(sectors.id) from sectors where parent=?)) as value, regions.id as sub_region_from, sectors.id as sub_sector_from, ? as quality from regions join sectors where regions.parent=? and sectors.parent=? order by sub_region_from, sub_sector_from",
                            [total_flow.value, region, sector, quality, region, sector], function(err, sub_flows) {
                                if (err) {
                                    error(err);
                                } else {
                                    sub_flows.forEach(function(f) {
                                        if (total_flow.sub_region_from) {
                                            f.sub_region_from = total_flow.sub_region_from;
                                        }
                                        f.region_to = total_flow.region_to;
                                        if (total_flow.sub_sector_to) {
                                            f.sub_sector_to = total_flow.sub_sector_to;
                                        }
                                        f.region_from = region;
                                        f.sector_from = sector;

                                    });
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    } else if (region) {
                        db.query("select ?/(select count(regions.id) from regions where parent=?) as value, id as sub_region_from, ? as sector_from, ? as quality from regions where parent=? order by sub_region_from",
                            [total_flow.value, region, total_flow.sector_from, quality, region], function(err, sub_flows) {
                                if (err) {
                                    error(err);
                                } else {
                                    sub_flows.forEach(function(f) {
                                        if (total_flow.sub_region_from) {
                                            f.sub_region_from = total_flow.sub_region_from;
                                        }
                                        if (total_flow.region_to) {
                                            f.region_to = total_flow.region_to;
                                        }
                                        if (total_flow.sub_sector_to) {
                                            f.sub_sector_to = total_flow.sub_sector_to;
                                        }
                                        if (total_flow.sector_to) {
                                            f.sector_to = total_flow.sector_to;
                                        }
                                        f.region_from = region;
                                        f.sector_from = total_flow.sector_from;


                                    });
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    } else if (sector) {
                        db.query("select ?/(select count(sectors.id) from sectors where parent=?) as value, id as sub_sector_from, ? as region_from, ? as quality from sectors where parent=? order by sub_sector_from",
                            [total_flow.value, sector, total_flow.region_from, quality, sector], function(err, sub_flows) {
                                if (err) {
                                    error(err);
                                } else {
                                    sub_flows.forEach(function(f) {
                                        if (total_flow.sub_region_to) {
                                            f.sub_region_to = total_flow.sub_region_to;
                                        }
                                        if (total_flow.region_to) {
                                            f.region_to = total_flow.region_to;
                                        }
                                        if (total_flow.sub_sector_from) {
                                            f.sub_sector_from = total_flow.sub_sector_from;
                                        }
                                        if (total_flow.sector_to) {
                                            f.sector_to = total_flow.sector_to;
                                        }
                                        f.region_from = total_flow.region_from;
                                        f.sector_from = sector;
                                    });
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    }
                    break;

                case 1: // GDP of subregion
                    if (region) { //"(select (sum(value*confidence)*count(confidence)/sum(confidence)) as value from entries where region_from=? and sector_from=''....
                        db.query("select (sum(value*confidence)*count(confidence)/sum(confidence))/"
                            + "(select (sum(value*confidence)*count(confidence)/sum(confidence)) as value from entries where region_from in (select id from regions where parent=?) and sector_from='' and region_to='' and sector_to='' and year=?)"
                            + " as value, region_from as sub_region_from from entries where region_from in (select id from regions where parent=?) and sector_from='' and region_to='' and sector_to='' and year=? group by sub_region_from order by sub_region_from",
                            [region, year, region, year], function(err, db_res) {
                                if (err) {
                                    error(err);
                                } else {
                                    if (db_res.length > 0) {
                                        for (var i = 0; i < db_res.length; i++) {
                                            for (var j = 0; j < sub_flows.length; j++) {                                       
                                                if (sub_flows[j].sub_region_from == db_res[i].sub_region_from) {
                                                    var sum = 0;
                                                    sub_flows.forEach(function(f) {
                                                        if (f.sub_sector_from == sub_flows[j].sub_sector_from) {
                                                            sum += f.value;
                                                        }
                                                    });
                                                    sub_flows[j].value = sum * db_res[i].value;
                                                    sub_flows[j].quality = quality;
                                                }
                                            }
                                        }
                                        harmonize_iteration();
                                    }
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    } else {
                        iteration(quality + 1, total_flow, sub_flows);
                    }
                    break;

                case 2: // GDP of subsector
                    if (region && sector) {
                        db.query("select (sum(value*confidence)*count(confidence)/sum(confidence))/"
                            + "(select (sum(value*confidence)*count(confidence)/sum(confidence)) as value from entries where region_from=? and sector_from=? and region_to='' and sector_to='' and year=?)"
                            + " as value, sector_from as sub_sector_from from entries where region_from=? and sector_from in (select id from sectors where parent=?) and region_to='' and sector_to='' and year=? group by sub_sector_from order by sub_sector_from",
                            [region, sector, year, region, sector, year], function(err, db_res) {
                                if (err) {
                                    error(err);
                                } else {
                                    if (db_res.length > 0) {
                                        var i = 0;
                                        for (var j = 0; j < sub_flows.length; j++) {
                                            if (sub_flows[j].sub_sector_from == db_res[i].sub_sector_from) {
                                                var sum = 0;
                                                sub_flows.forEach(function(f) {
                                                    if (f.sub_region_from == sub_flows[j].sub_region_from) {
                                                        sum += f.value;
                                                    }
                                                });
                                                sub_flows[j].value = sum * db_res[i].value;
                                                sub_flows[j].quality = quality;
                                                i++;
                                                if (i >= db_res.length) {
                                                    break;
                                                }
                                            }
                                        }
                                        harmonize_iteration();
                                    }
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    } else {
                        iteration(quality + 1, total_flow, sub_flows);
                    }
                    break;

                case 3: // GDP of subregional subsector
                    if (region && sector) {
                        db.query("select ?*(sum(value*confidence)*count(confidence)/sum(confidence))/"
                            + "(select (sum(value*confidence)*count(confidence)/sum(confidence)) as value from entries where region_from=? and sector_from=? and region_to='' and sector_to='' and year=?)"
                            + " as value, region_from as sub_region_from, sector_from as sub_sector_from from entries where "
                            + "region_from in (select id from regions where parent=?) and "
                            + "sector_from in (select id from sectors where parent=?) "
                            + "and region_to='' and sector_to='' and year=? group by sub_region_from, sub_sector_from order by sub_region_from, sub_sector_from",
                            [total_flow.value, region, sector, year, region, sector, year], function(err, db_res) {
                                if (err) {
                                    error(err);
                                } else {
                                    if (db_res.length > 0) {
                                        var i = 0;
                                        for (var j = 0; j < sub_flows.length; j++) {
                                            if (sub_flows[j].sub_region_from == db_res[i].sub_region_from
                                                && sub_flows[j].sub_sector_from == db_res[i].sub_sector_from) {
                                                sub_flows[j].value = db_res[i].value;
                                                sub_flows[j].quality = quality;
                                                i++;
                                                if (i >= db_res.length) {
                                                    break;
                                                }
                                            }
                                        }
                                        harmonize_iteration();
                                    }
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    } else if (region) {
                        db.query("select ?*(sum(value*confidence)*count(confidence)/sum(confidence))/"
                            + "(select (sum(value*confidence)*count(confidence)/sum(confidence)) as value from entries where region_from=? and sector_from=? and region_to='' and sector_to='' and year=?)"
                            + " as value, region_from as sub_region_from from entries where "
                            + "region_from in (select id from regions where parent=?) and "
                            + "sector_from=? "
                            + "and region_to='' and sector_to='' and year=? group by sub_region_from order by sub_region_from",
                            [total_flow.value, region, total_flow.sector_from, year, region, total_flow.sector_from, year], function(err, db_res) {
                                if (err) {
                                    error(err);
                                } else {
                                    if (db_res.length > 0) {
                                        var i = 0;
                                        for (var j = 0; j < sub_flows.length; j++) {
                                            if (sub_flows[j].sub_region_from == db_res[i].sub_region_from) {
                                                sub_flows[j].value = db_res[i].value;
                                                sub_flows[j].quality = quality;
                                                i++;
                                                if (i >= db_res.length) {
                                                    break;
                                                }
                                            }
                                        }
                                        harmonize_iteration();
                                    }
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    } else {
                        iteration(quality + 1, total_flow, sub_flows);
                    }
                    break;

                case 4: // Import of subsector into regional sector
                    if (sector) {
                        db.query("select (sum(value*confidence)*count(confidence)/sum(confidence))/"
                            + "(select (sum(value*confidence)*count(confidence)/sum(confidence)) as value from entries where sector_from=? and region_to=? and sector_to=? and year=?)"
                            + " as value, sector_from as sub_sector_from from entries where region_from='' and sector_from in (select id from sectors where parent=?) and region_to=? and sector_to=? and year=? group by sub_sector_from order by sub_sector_from",
                            [sector, total_flow.sub_region_to || total_flow.region_to, total_flow.sub_sector_to || total_flow.sector_to, year,
                             sector, total_flow.sub_region_to || total_flow.region_to, total_flow.sub_sector_to || total_flow.sector_to, year], function(err, db_res) {
                                if (err) {
                                    error(err);
                                } else {
                                    if (db_res.length > 0) {
                                        var i = 0;
                                        for (var j = 0; j < sub_flows.length; j++) {
                                            if (sub_flows[j].sub_sector_from == db_res[i].sub_sector_from) {
                                                var sum = 0;
                                                sub_flows.forEach(function(f) {
                                                    if (f.sub_region_from == sub_flows[j].sub_region_from) {
                                                        sum += f.value;
                                                    }
                                                });
                                                sub_flows[j].value = sum * db_res[i].value;
                                                sub_flows[j].quality = quality;
                                                i++;
                                                if (i >= db_res.length) {
                                                    break;
                                                }
                                            }
                                        }
                                        harmonize_iteration();
                                    }
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    } else {
                        iteration(quality + 1, total_flow, sub_flows);
                    }
                    break;
                case 5: // Export of subregional subsector to region
                    if (region && sector) {
                        db.query("select ?*(sum(value*confidence)*count(confidence)/sum(confidence))/"
                            + "(select (sum(value*confidence)*count(confidence)/sum(confidence)) as value from entries where region_from=? and sector_from=? and region_to=? and year=?)"
                            + " as value, region_from as sub_region_from, sector_from as sub_sector_from from entries where region_from in (select id from regions where parent=?) and sector_from in (select id from sectors where parent=?) and region_to=? and sector_to='' and year=? group by sub_region_from, sub_sector_from order by sub_region_from, sub_sector_from",
                            [total_flow.value, region, sector, total_flow.sub_region_to || total_flow.region_to, year, region, sector, total_flow.sub_region_to || total_flow.region_to, year], function(err, db_res) {

                                if (err) {
                                    error(err);
                                } else {
                                    if (db_res.length > 0) {
                                        var i = 0;
                                        for (var j = 0; j < sub_flows.length; j++) {
                                            if (sub_flows[j].sub_region_from == db_res[i].sub_region_from
                                             && sub_flows[j].sub_sector_from == db_res[i].sub_sector_from) {
                                                sub_flows[j].value = db_res[i].value;
                                                sub_flows[j].quality = quality;
                                                i++;
                                                if (i >= db_res.length) {
                                                    break;
                                                }
                                            }
                                        }
                                        harmonize_iteration();
                                    }
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    } else if (region) {
                        db.query("select ?*(sum(value*confidence)*count(confidence)/sum(confidence))/"
                            + "(select (sum(value*confidence)*count(confidence)/sum(confidence)) as value from entries where region_from=? and sector_from=? and region_to=? and year=?)"
                            + " as value, region_from as sub_region_from from entries where region_from in (select id from regions where parent=?) and sector_from=? and region_to=? and sector_to='' and year=? group by sub_region_from order by sub_region_from",
                            [total_flow.value, region, total_flow.sector_from, total_flow.sub_region_to || total_flow.region_to, year, region, total_flow.sector_from, total_flow.sub_region_to || total_flow.region_to, year], function(err, db_res) {
                                if (err) {
                                    error(err);
                                } else {
                                    if (db_res.length > 0) {
                                        var i = 0;
                                        for (var j = 0; j < sub_flows.length; j++) {
                                            if (sub_flows[j].sub_region_from == db_res[i].sub_region_from) {
                                                sub_flows[j].value = db_res[i].value;
                                                sub_flows[j].quality = quality;
                                                i++;
                                                if (i >= db_res.length) {
                                                    break;
                                                }
                                            }
                                        }
                                        harmonize_iteration();
                                    }
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    } else if (sector) {
                        db.query("select ?*(sum(value*confidence)*count(confidence)/sum(confidence))/"
                            + "(select (sum(value*confidence)*count(confidence)/sum(confidence)) as value from entries where region_from=? and sector_from=? and region_to=? and year=?)"
                            + " as value, sector_from as sub_sector_from from entries where region_from=? and sector_from in (select id from sectors where parent=?) and region_to=? and sector_to='' and year=? group by sub_sector_from order by sub_sector_from",
                            [total_flow.value, total_flow.region_from, sector, total_flow.sub_region_to || total_flow.region_to, year,
                             total_flow.region_from, sector, total_flow.sub_region_to || total_flow.region_to, year], function(err, db_res) {
                                if (err) {
                                    error(err);
                                } else {
                                    if (db_res.length > 0) {
                                        var i = 0;
                                        for (var j = 0; j < sub_flows.length; j++) {
                                            if (sub_flows[j].sub_sector_from == db_res[i].sub_sector_from) {
                                                sub_flows[j].value = db_res[i].value;
                                                sub_flows[j].quality = quality;
                                                i++;
                                                if (i >= db_res.length) {
                                                    break;
                                                }
                                            }
                                        }
                                        harmonize_iteration();
                                    }
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    }
                    break;

                case 6: // According to Peters et al.
                    // TODO
                    iteration(quality + 1, total_flow, sub_flows);
                    break;

                case 7: // Exact value given
                    if (region && sector) {
                        db.query("select (sum(value*confidence)*count(confidence)/sum(confidence)) as value, region_from as sub_region_from, sector_from as sub_sector_from from entries where region_from in (select id from regions where parent=?) and sector_from in (select id from sectors where parent=?) and region_to=? and sector_to=? and year=? group by sub_region_from, sub_sector_from order by sub_region_from, sub_sector_from",
                            [region, sector, total_flow.sub_region_to || total_flow.region_to, total_flow.sub_sector_to || total_flow.sector_to, year], function(err, db_res) {
                                if (err) {
                                    error(err);
                                } else {
                                    if (db_res.length > 0) {
                                        var i = 0;
                                        for (var j = 0; j < sub_flows.length; j++) {
                                            if (sub_flows[j].sub_region_from == db_res[i].sub_region_from
                                             && sub_flows[j].sub_sector_from == db_res[i].sub_sector_from) {
                                                sub_flows[j].value = db_res[i].value;
                                                sub_flows[j].quality = quality;
                                                i++;
                                                if (i >= db_res.length) {
                                                    break;
                                                }
                                            }
                                        }
                                        harmonize_iteration();
                                    }
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    } else if (region) {
                        db.query("select (sum(value*confidence)*count(confidence)/sum(confidence)) as value, region_from as sub_region_from from entries where region_from in (select id from regions where parent=?) and sector_from=? and region_to=? and sector_to=? and year=? group by sub_region_from order by sub_region_from",
                            [region, total_flow.sector_from, total_flow.sub_region_to || total_flow.region_to, total_flow.sub_sector_to || total_flow.sector_to, year], function(err, db_res) {
                                if (err) {
                                    error(err);
                                } else {
                                    if (db_res.length > 0) {
                                        var i = 0;
                                        for (var j = 0; j < sub_flows.length; j++) {
                                            if (sub_flows[j].sub_region_from == db_res[i].sub_region_from) {
                                                sub_flows[j].value = db_res[i].value;
                                                sub_flows[j].quality = quality;
                                                i++;
                                                if (i >= db_res.length) {
                                                    break;
                                                }
                                            }
                                        }
                                        harmonize_iteration();
                                    }
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    } else if (sector) {
                        db.query("select (sum(value*confidence)*count(confidence)/sum(confidence)) as value, sector_from as sub_sector_from from entries where region_from=? and sector_from in (select id from sectors where parent=?) and region_to=? and sector_to=? and year=? group by sub_sector_from order by sub_sector_from",
                            [total_flow.region_from, sector, total_flow.sub_region_to || total_flow.region_to, total_flow.sub_sector_to || total_flow.sector_to, year], function(err, db_res) {
                                if (err) {
                                    error(err);
                                } else {
                                    if (db_res.length > 0) {
                                        var i = 0;
                                        for (var j = 0; j < sub_flows.length; j++) {
                                            if (sub_flows[j].sub_sector_from == db_res[i].sub_sector_from) {
                                                sub_flows[j].value = db_res[i].value;
                                                sub_flows[j].quality = quality;
                                                i++;
                                                if (i >= db_res.length) {
                                                    break;
                                                }
                                            }
                                        }
                                        harmonize_iteration();
                                    }
                                    iteration(quality + 1, total_flow, sub_flows);
                                }
                            });
                    }
                    break;
                default:
                    result = result.concat(sub_flows);
                    setTimeout(function() {
                        next(index + 1);
                    }, 0);
                    break;
            }
        }

        if (index < flows.length) {
            iteration(0, flows[index]);
        } else {
            //console.log(result)
            success(result);
        }
    }
    next(0);
};

exports.flow = function disaggregate_flow(year, total_flow, disaggregate_by, success, error) {
    db.query("select (sum(value*confidence)*count(confidence)/sum(confidence)) as value from entries where year=? and region_from=? and sector_from=? and region_to=? and sector_to=?",
    [year, total_flow.region_from, total_flow.sector_from, total_flow.region_to, total_flow.sector_to], function(err, res) {
        if (err) {
            error(err);
        } else {
            if (res[0].value) { total_flow.value = res[0].value; }
            if (disaggregate_by.indexOf("region_from")!=-1 || disaggregate_by.indexOf("sector_from")!=-1) {
                disaggregate_from(year,
                    disaggregate_by.indexOf("region_from")!=-1 ? total_flow.region_from : undefined,
                    disaggregate_by.indexOf("sector_from")!=-1 ? total_flow.sector_from : undefined,
                    [total_flow], function(result) {
                        if (disaggregate_by.indexOf("region_to")!=-1 || disaggregate_by.indexOf("sector_to")!=-1) {
                            disaggregate_to(year,
                                disaggregate_by.indexOf("region_to")!=-1 ? total_flow.region_to : undefined,
                                disaggregate_by.indexOf("sector_to")!=-1 ? total_flow.sector_to : undefined,
                                result, success, error);
                        } else {
                            success(result);
                        }
                    }, error
                );
            } else { //TODO: disaggregate_to not defined yet
                if (disaggregate_by.indexOf("region_to")!=-1 || disaggregate_by.indexOf("sector_to")!=-1) {
                    disaggregate_to(year,
                        disaggregate_by.indexOf("region_to")!=-1 ? total_flow.region_to : undefined,
                        disaggregate_by.indexOf("sector_to")!=-1 ? total_flow.sector_to : undefined,
                        [total_flow], success, error);
                } else {
                    success([total_flow]);
                }
            }
        }
    });
};

