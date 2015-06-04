var db = require("./database"),
    logger = require("./logger"),
    disaggregation = require("./disaggregation");

module.exports = function(app) {

    app.get("/data/flows", function(req, res) {
        //if (isNaN(req.query.year)) {
        //    res.send({ result: "error", error: "no year given" });
        //    return;
        //}
        //disaggregate into subregions and subsectors
        var disaggregate_by="";
        if (req.query.regions_from[0].indexOf("*") !=-1 && req.query.regions_from[0]!="*ALL") {
            disaggregate_by+="region_from, ";}
        if (req.query.regions_to[0].indexOf("*") !=-1 && req.query.regions_to[0]!="*ALL") {
            disaggregate_by+="region_to, ";}
        if (req.query.sectors_from[0].indexOf("*") !=-1 && req.query.sectors_from[0]!="*ALL") {
            disaggregate_by+="sector_from, ";}
        if (req.query.sectors_to[0].indexOf("*") !=-1 && req.query.sectors_to[0]!="*ALL") {
            disaggregate_by+="sector_to, ";}

        //sum over entries for query and output of combined values
        var groupby = "";
        var output = "";
        if ( req.query.regions_from[0] != "ALL") {
            output += "region_from, "; }
        if ( req.query.regions_to[0] != "ALL") {
            output += "region_to, "; }

        //years
        var params = [];
        params.push(req.query.year);
        //if ( req.query.year.length > 1 ) {
        //    groupby += "year, "; 
        //    output += "year, "; }

        // region_from
        if ( !req.query.regions_from || req.query.regions_from[0] == "*ALL") {
            groupby += "region_from, "; }
        else if ( req.query.regions_from && req.query.regions_from[0] != "ALL") {
            if ( req.query.regions_from.length == 1 && req.query.regions_from[0].indexOf("*") !=-1 ) {
                // identifies all subregions, e.g. "*DEU"
                //params.push("(select id from regions where parent="+req.query.regions_from[0].substring(1,3)+")");
                params.push(req.query.regions_from[0].substring(1)); //use disaggregation mashinery 
            } else {
                var regfroms = req.query.regions_from[0];//e.g. ["USA04"]
                if (regfroms.length>3) {
                    regfroms=regfroms.substring(0,3);//e.g. ["USA"]
                    disaggregate_by+="region_from, ";
                }
                params.push(regfroms); }
        }
        
        // region_to
        if ( !req.query.regions_to || req.query.regions_to[0] == "*ALL") {
            groupby += "region_to, "; }
        else if ( req.query.regions_to && req.query.regions_to[0] != "ALL") {
            if ( req.query.regions_to.length == 1 && req.query.regions_to[0].indexOf("*") !=-1 ) {
                    // identifies all subregions, e.g. "*DEU"
                    //params.push("(select id from regions where parent="+req.query.regions_to[0].substring(1)+")"); 
                    params.push(req.query.regions_to[0].substring(1)); //use disaggregation mashinery 
            } else { 
                var regtos = req.query.regions_to[0];//e.g. ["USA04"]
                if (regtos.length>3) {
                    regtos=regtos.substring(0,3);//e.g. ["USA"]
                    disaggregate_by+="region_to, ";
                }
                params.push(regtos); }
        }
        // sector_from
        if ( !req.query.sectors_from || req.query.sectors_from[0] == "*ALL" ) {
            groupby += "sector_from, "; 
            if ( req.query.sectors_from[0] == "*ALL") {
                // identifies all sectors, e.g. "*ALL"
                //params.push("select id from sectors where parent='"+req.query.sectors_from[0].replace("*","")+"'");
                //params.push('select id from sectors where parent="ALL"');
                output += "sector_from, "; 
            }
          } else if ( req.query.sectors_from && req.query.sectors_from[0]!="ALL" ) {
          output += "sector_from, "; 
          if ( req.query.sectors_from.length == 1 && req.query.sectors_from[0].indexOf("*") !=-1 ) {
                  // identifies all subsectors, e.g. "*AGRI"
                  //params.push("(select id from sectors where parent="+req.query.sectors_from[0].substring(1)+")"); 
                  params.push(req.query.sectors_from[0].substring(1)); //use disaggregation mashinery 
          } else { //TODO: slice subsectors index numbers as in region_from above
              var secfroms = req.query.sectors_from[0];//e.g. ["AGRI01"]
              if (secfroms.length>4) {
                  secfroms=secfroms.substring(0,4);//e.g. ["AGRI"]
                  disaggregate_by+="sector_from, ";
              }
              params.push(secfroms); }
        }
        // sector_to
        if ( !req.query.sectors_to || req.query.sectors_to[0] == "*ALL" ) {
            groupby += "sector_to, "; 
            if ( req.query.sectors_to[0] == "*ALL") {
                output += "sector_to, "}
       } else if ( req.query.sectors_to && req.query.sectors_to[0]!="ALL" ) {
            output += "sector_to, "; 
            if ( req.query.sectors_to.length == 1 && req.query.sectors_to[0].indexOf("*") !=-1 ) {
                    //params.push("(select id from sectors where parent="+req.query.sectors_to[0].substring(1)+")"); 
                    params.push(req.query.sectors_to[0].substring(1)); //use disaggregation mashinery 
            } else {
                var sectos = req.query.sectors_to[0];//e.g. ["AGRI01"]
                if (sectos.length>4) {
                    sectos=sectos.substring(0,4);//e.g. ["AGRI"]
                    disaggregate_by+="sector_to, ";
                }
                params.push(sectos); }
        }
        // FIXME: limit of flows to be shown should be applied to endresults
        if ( req.query.limit ) {
            params.push(parseInt(req.query.limit, 10));
        }

        // cut off last comma
        if (groupby.length > 0) {
            groupby = " group by " + groupby.substring(0,groupby.length-2);
        }
        if (output.length > 0) {
            output = output.substring(0,output.length-2);
        }
        if (disaggregate_by.length > 0) {
            disaggregate_by = disaggregate_by.substring(0,disaggregate_by.length-2);
        }

        console.log(params);
        console.log(groupby);
        console.log("output:", output);
        console.log("disaggregate by", disaggregate_by);
        logger.log("info", req.query);
        db.query("select round(sum(value*confidence)*count(confidence)/sum(confidence), 3) as value, "
            + output //region_from, region_to, sector_from, sector_to"
            //+ " from entries where year=?"
            + " from entries where year in (?)"
            + ((req.query.regions_from && req.query.regions_from[0].replace("*","")!="ALL")  ? " and region_from in (?)" : "")
            + ((req.query.regions_to && req.query.regions_to[0].replace("*","")!="ALL") ? " and region_to in (?)" : "")
            + ((req.query.sectors_from && req.query.sectors_from[0].replace("*","")!="ALL") ? " and sector_from in (?)" : "")
            + ((req.query.sectors_to && req.query.sectors_to[0].replace("*","")!="ALL") ? " and sector_to in (?)" : "")
            //+ " and region_from!=region_to and sector_to!='FD'"
            + " and sector_from!='' and region_from!='' and sector_to!='' and region_to!=''"
            + groupby
            + " order by value desc limit "
            + (req.query.limit ? "?" : "100"),
            params,
            function(err, results, fields) {
                if (err) {
                    logger.exception(err);
                    res.send({
                        result: "error",
                        error: "db error"
                    });
                } else {
                    console.log(results)
                    if (disaggregate_by=="") {
                        res.send({
                            result: results
                        });
                    } else { //disaggregation
                        var endresults = [];
                        function next(index) {
                            if (index < results.length) {
                                disaggregation.flow(req.query.year[0], results[index], disaggregate_by, function(subresults) {
                                    if (req.query.regions_from[0][0] != "*") {
                                        var subsubresults=subresults.filter(function(subflow) {
                                            return (req.query.regions_from.indexOf(subflow.sub_region_from)!=-1);
                                        });
                                        endresults = endresults.concat(subsubresults);
                                    } else {
                                        endresults = endresults.concat(subresults);
                                    }
                                    next(index + 1);
                                }, err);   
                            } else {
                                //console.log(endresults)
                                res.send({
                                    result: endresults
                                });
                            }
                        }
                        next(0);
                    }
                }
            });
    });

    app.get("/data/betweenness", function(req, res) {
        if (isNaN(req.query.year)) {
            res.send({ result: "error", error: "no year given" });
            return;
        }
        db.query("select max(value) as value, region_from as region"
            + " from visualization_data where visualization in (select id from visualizations where year=? and name='Betweenness') "
            + " group by region_from",
            [ +req.query.year ],
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

    app.get("/data/flow_centrality", function(req, res) {
        if (isNaN(req.query.year)) {
            res.send({ result: "error", error: "no year given" });
            return;
        }
        db.query("select max(value) as value, region_from as region"
            + " from visualization_data where visualization in (select id from visualizations where year=? and name='Flow Centrality') "
            + " group by region_from",
            [ +req.query.year ],
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

    app.get("/data/nap", function(req, res) {
        if (isNaN(req.query.year)) {
            res.send({ result: "error", error: "no year given" });
            return;
        }
        if (!req.query.region) {
            res.send({ result: "error", error: "no region given" });
            return;
        }
        if (+req.query.order!=1 && +req.query.order!=2) {
            res.send({ result: "error", error: "wrong order" });
            return;
        }

        var params = [ +req.query.year, "NAP" + (+req.query.order), req.query.region ];

        // sector
        if ( req.query.sector && req.query.sector!="ALL" ) {
            params.push(req.query.sector); }

        db.query("select value, region_to as region"
            + " from visualization_data where visualization in (select id from visualizations where year=? and name=?) "
            + " and region_from=?"
            + ((req.query.sector && req.query.sector.replace("*","")!="ALL") ? " and sector_from in (?)" : ""),
            params,
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

};

