/*
 * zeean.net
 * Author: Sven Willner (sven.willner@pik-potsdam.de)
 *
 */
$(document).ready(function() {
    var type = "",
        map = new Map($("#map").html(''), { showCopyright: true }),
        year = 2011,
        sector = "ALL",
        region = "ALL",
        logic = "and",
        number = 100,
        order = 1,
        zoomslider,
        regions,
        format_ = d3.format("n"),
        formatFlow = function(v) {
            var s = "";
            v *= 1e6;
            if (v >= 1000) {
                s = "k";
                v /= 1000;
                if (v >= 1000) {
                    s = "M";
                    v /= 1000;
                    if (v > 1000) {
                        s = "G";
                        v /= 1000;
                    }
                }
            }
            v = v.toPrecision(6);
            return format_(v) + " " + s + "$";
        },
        format = function(v) {
            if (v > 1e-5) {
                v = Math.round(v*1e5)/1e5;
            }
            return format_(v);
        };

    function handleError(e) {
        bootbox.alert("Sorry, an error occurred: " + e);
        map.stopWaiting();
    }

    function showData(data, dim) {
        data.dim = dim;
        var legend = $("#legend").html("");
        if (typeof(data.min) === "undefined") {
            data.min = d3.min(data, function(d) { return d.value; });
        }
        if (typeof(data.max) === "undefined") {
            data.max = d3.max(data, function(d) { return d.value; });
        }
        if (dim == 1) {
            if (typeof(data.mean) === "undefined") {
                data.mean = d3.mean(data, function(d) { return d.value; });
            }
            if (type=="nap") {
                data.scale = d3.scale.log()
                    .domain([+data.min+0.1, +data.max])
                    .range(["#ccc", "#A64138"])
                    .clamp(true);
            } else {
                data.scale = d3.scale.log()
                    .domain([+data.min+0.1, +data.mean, +data.max])
                    .range(["#ccc", "#caa", "#A64138"])
                    .clamp(true);
            }
            var min = 0;
            var ticks = data.scale.ticks();
            var max = ticks.length - 1;
            var step = max / 5;
            for (var i = min; i <= max; i+=step) {
                var value = ticks[Math.floor(i)];
                if (value!="") {
                    $("<div class='legendBox btn disabled'>")
                        .css("background-color", data.scale(value))
                        .html(format(value))
                        .appendTo(legend);
                }
            }
        } else if (dim == 2) {
            data.scale = d3.scale.log()
                .domain([data.min, data.max])
                .range([1,15])
                .clamp(true);
            var min = 0;
            var ticks = data.scale.ticks();
            var max = ticks.length - 1;
            var step = max / 5;
            for (var i = min; i <= max; i+=step) {
                var value = ticks[Math.floor(i)];
                if (value!="") {
                    var el = $("<div class='legendBox btn disabled btn-default legendBoxFlow'>")
                        .append("<span>" + formatFlow(value) + "</span>")
                        .appendTo(legend);
                    var s = data.scale(value);
                    d3.select(el[0])
                        .append("svg")
                        .attr("width", 25)
                        .attr("height", 20)
                        .append("svg:path")
                        .attr("d", "M0,10 L15," + (10 - s/2) + " A" + [s/2,s/2].join(",") + " 0 1,1 15," + (10 + s/2) + "Z")
                        .attr("stroke", "none")
                        .attr("fill", "#A64138");
                }
            }
        }
        data.type=type;
        data.year=year;
        data.region=region;
        data.order=order;
        data.number=number;
        data.sector=sector;

        map.setData([data]);
        map.stopWaiting();
    }

    function updateMap() {
        switch (type) {
            case "flows":
                map.startWaiting();
                $.ajax({
                    url: "/data/flows",
                    type: "GET",
                    dataType: "json",
                    data: {
                        year: year,
                        region: region==="ALL" ? undefined : region,
                        sector: sector==="ALL" ? undefined : sector,
                        logic: logic,
                        number: number
                    },
                    success: function(data) {
                        showData(data.result, 2);
                    },
                    error: handleError
                });
                break;
            case "betweenness":
                map.startWaiting();
                $.ajax({
                    url: "/data/betweenness",
                    type: "GET",
                    dataType: "json",
                    data: {
                        year: year
                    },
                    success: function(data) {
                        showData(data.result, 1);
                    },
                    error: handleError
                });
                break;
            case "flow_centrality":
                map.startWaiting();
                $.ajax({
                    url: "/data/flow_centrality",
                    type: "GET",
                    dataType: "json",
                    data: {
                        year: year
                    },
                    success: function(data) {
                        showData(data.result, 1);
                    },
                    error: handleError
                });
                break;
            case "nap":
                if (region!=="ALL") {
                    map.startWaiting();
                    $.ajax({
                        url: "/data/nap",
                        type: "GET",
                        dataType: "json",
                        data: {
                            year: year,
                            region: region,
                            order: order
                        },
                        success: function(data) {
                            data.result.default0 = true;
                            data.result.min = 0;
                            showData(data.result, 1);
                        },
                        error: handleError
                    });
                } else {
                    map.setData([[]]);
                    $("#legend").html("");
                }
                break;
            case "chains":
                map.startWaiting();
                $.ajax({
                    url: "/data/chains",
                    type: "GET",
                    dataType: "json",
                    data: {
                        year: year,
                        region: region==="ALL" ? undefined : region,
                        sector: sector==="ALL" ? undefined : sector
                    },
                    success: function(data) {
                        showData(data.result, 1);
                    },
                    error: handleError
                });
                break;
        }
    }

    $("#toolbarType ul li a").click(function(event) {
        $(this).parent().parent().parent().trigger("select", $(this).parent().attr("value"));
        $(".selected", $(this).parent().parent().parent()).html($(this).parent().attr("text"));
        event.preventDefault();
    });
    $("#toolbarType select").on("change", function(event) {
        var value = $(this).val();
        $(this).selectpicker("setStyle", "btn-danger", "remove");
        $("#toolbarType").removeClass("rounded");
        $("#toolbarYear").show();
        $("#toolbarLogic").hide();
        $("#toolbarDamage").hide();
        $("#toolbarNumber").hide();
        $("#toolbarSector").hide();
        $("#toolbarCommodities").hide();
        $("#download").show();
        if (type != value) {
            type = value;
            switch(value) {
                case "flows":
                    //$("#toolbarCommodities").show();
                    $("#toolbarType").removeClass("rounded-left");
                    region = "ALL";
                    sector = "ALL";
                    $("#toolbarNumber select").val("");
                    $("#toolbarNumber").show();
                    $("#toolbarRegion select").selectpicker("val", "ALL");
                    $("#toolbarRegion .only-flow").show();
                    $("#toolbarRegion").show();
                    $("#toolbarSector select").selectpicker("val", "ALL");
                    $("#toolbarSector").show();
                    $("#toolbarLogic").show();
                    $("#toolbarYear select").val("");
                    break;
                case "betweenness":
                    $("#toolbarType").addClass("rounded-left");
                    $("#toolbarRegion").hide();
                    break;
                case "flow_centrality":
                    $("#toolbarType").addClass("rounded-left");
                    $("#toolbarRegion").hide();
                    break;
                case "nap":
                    $("#toolbarType").addClass("rounded-left");
                    $("#toolbarRegion select").selectpicker("val", "");
                    region = "ALL";
                    $("#toolbarRegion .only-flow").hide();
                    $("#toolbarRegion").show();
                    $("#toolbarDamage select").val("");
                    $("#toolbarDamage").show();
                    break;
                case "chains":
                    $("#toolbarType").addClass("rounded-left");
                    $("#toolbarCommodities").show();
                    $("#toolbarRegion select").val("");
                    $("#toolbarRegion").show();
                    break;
            }
            updateMap();
        }
    });

    $(".with-tooltip").tooltip({
        container: "body"
    });

    $("#map").on("country_click", function(e, d) {
        $("#popover .popover-title").html(d.properties.name + " (" + d.id + ")");
        var content = $("<ul>")
            .addClass("dropdown-menu")
            .appendTo($("#popover .popover-content").html(""));
        if (typeof(d.value)!=="undefined") {
            content.append(
                $("<li><span>Value: " + format(d.value) + "</span></li>")
            );
        }
        content.append(
            $("<li><a href='#'>Zoom in</a></li>").on("click", function() {
                map.zoomPath(d);
            })
        );
        if (type === "flows" || type === "nap") {
            content.append(
                $("<li><a href='#'>Select</a></li>").on("click", function() {
                    region = d.id;
                    $("#toolbarRegion select").selectpicker("val", region);
                    updateMap();
                })
            );
        }
        content.append(
            $("<li><a href='#'>Close</a></li>").on("click", function() {
                popover.fadeOut();
                map.selectCountryPath(null);
            })
        );
        var popover = $("#popover");
        if (d3.event.layerX < $("#map").width()/2) {
            popover.removeClass("left").addClass("right")
                .css("left", d3.event.layerX + 10);
        } else {
            popover.addClass("left").removeClass("right")
            .css("left", d3.event.layerX - popover.width() - 10);
        }
        popover
            .css("top", d3.event.layerY + 20)
            .fadeIn();
    });

    $("#popover").on("click", function() {
        $(this).fadeOut();
        map.selectCountryPath(null);
    });

    $(".selectpicker").selectpicker({
        //dropupAuto: false
    });
    $(".selectpicker li.disabled").hide();
    $("<span class='glyphicon glyphicon-question-sign'></span>")
        .appendTo("#toolbarType ul.dropdown-menu.inner li[rel='2']")
        .click(function(event) {
            bootbox.dialog({
                title: "Betweenness Centrality",
                message: "<div style='text-align:justify;'>The <i>Betweenness Centrality</i> reflects a country’s importance within the global supply network considering two factors: its connectivity to other regions and the amount of products (measured in US $) it exchanges with them. Concretely, it counts the number of shortest paths from all regional sectors to all other regional sectors that pass through that country. The size of the flows along those paths is not taken into account (either there is a flow > 1M$ or none).<br/><br/>This visualization illustrates the maximum Betweenness Centrality of all regional sectors in each country.<br/><br/><i>Algorithm based on</i>: Brandes, U. (2001). A faster algorithm for betweenness centrality. The Journal of Mathematical Sociology, 25(2), 163-177.</div>",
                buttons: {
                    main: {
                        label: "Close",
                        className: "btn-primary"
                    }
                }
            });
        });
    $("<span class='glyphicon glyphicon-question-sign'></span>")
        .appendTo("#toolbarType ul.dropdown-menu.inner li[rel='3']")
        .click(function(event) {
            bootbox.dialog({
                title: "Flow Centrality",
                message: "<div style='text-align:justify;'>The <i>Flow Centrality</i> measures the number of maximum through-flow paths in the network of regional sectors passing through each of the regional sectors. A <i>through-flow path</i> between two regional sectors is a path connecting these two network nodes via flows associated with the minimum of all flows along that path. The through-flow paths associated with the maximal value of all these paths are <i>maximum through-flow paths</i> between those two nodes.<br/>The Flow Centrality is thus similar to the Betweenness Centrality but unlike the latter takes the size of flows into account.<br/><br/>This visualization illustrates the maximum Flow Centrality of all regional sectors in each country.</div>",
                buttons: {
                    main: {
                        label: "Close",
                        className: "btn-primary"
                    }
                }
            });
        });
    $("<span class='glyphicon glyphicon-question-sign'></span>")
        .appendTo("#toolbarType ul.dropdown-menu.inner li[rel='4']")
        .click(function(event) {
            bootbox.dialog({
                title: "Global Adaptive Pressure",
                message: "<div style='text-align:justify;'>The <i>Global Adaptive Pressure</i> (GAP) reflects a country’s importance within the global supply network. It measures how dependent all other regions are on direct (1<sup>st</sup> order) and indirect (2<sup>nd</sup> order) supplies from this country.<br/><br/>The value of GAP provides the percentage production failure of the total production of a country due to the direct or indirect effects of a complete production failure in the selected country (1=100%). GAP is thereby an upper limit of the direct or indirect influence mainly because it assumes that the supply failure is not compensated by enhanced supply from other regions and because it assumes perfect complementarity of the production process.<br/><br/><i>Howto:</i> Since GAP refers to a certain region you first have to select one of the regions from the list. You can then see some countries coloring. The redder the country the more it is relying on exports from the region you chose. To see the indirect dependencies on this region, switch to 2<sup>nd</sup> order. Choose another year to explore how GAP changed over the years. Up to now all calculations are based on the <a href='http://www.worldmrio.com' target='_blank'>EORA world MRIO</a>.<br/><br/><a href='http://www.nature.com/news/climate-economics-make-supply-chains-climate-smart-1.14636' target='_blank'>Read here</a> to learn more about GAP.</div>",
                buttons: {
                    main: {
                        label: "Close",
                        className: "btn-primary"
                    }
                }
            });
        });

    // // Year slider
    // yearslider = d3.slider().axis(true).min(1990).max(2011).step(1).value(year).on("slide", function(evt, value) {
    //     d3.select("#toolbarYear a").html(value);
    //     year = value;
    //     updateMap();
    //     evt.stopPropagation();
    // });
    // d3.select("#toolbarYear .dropdown-menu div").call(yearslider);
    //
    // // Number slider
    // numberslider = d3.slider().axis(true).min(25).max(200).step(5).value(number).on("slide", function(evt, value) {
    //     d3.select("#toolbarNumber a").html(value);
    //     number = value;
    //     updateMap();
    //     evt.stopPropagation();
    // });
    // d3.select("#toolbarNumber .dropdown-menu div").call(numberslider);

    // Zoom slider
    var zoomValue = 1;
    zoomslider = d3.slider().min(1).max(10).step(1).value(1).orientation("vertical");
    zoomslider.on("slide", function(e, value) {
        map.zoom(value);
        zoomValue = value;
        $("#popover").fadeOut();
        map.selectCountryPath(null);
    });
    $("#map").on("zoom", function(e, value) {
        zoomslider.set(value);
        zoomValue = value;
        $("#popover").fadeOut();
        map.selectCountryPath(null);
    });
    d3.select("#zoomslider").call(zoomslider);
    $("#zoomIn").click(function() {
        if (zoomValue < 10) {
            zoomValue++;
            zoomslider.set(zoomValue);
            map.zoom(zoomValue);
            $("#popover").fadeOut();
            map.selectCountryPath(null);
        }
    });
    $("#zoomOut").click(function() {
        if (zoomValue > 1) {
            zoomValue--;
            zoomslider.set(zoomValue);
            map.zoom(zoomValue);
            $("#popover").fadeOut();
            map.selectCountryPath(null);
        }
    });
    $("#zoomReset").click(function() {
        zoomValue = 1;
        zoomslider.set(1);
        map.zoomCenter();
        $("#popover").fadeOut();
        map.selectCountryPath(null);
    });

    $("#toolbarDamage select").change(function() {
        var value = +$(this).val();
        if (!isNaN(value) && value!==order) {
            order = value;
            updateMap();
        }
    });

    $.ajax({
        url: "/regions",
        type: "GET",
        success: function(data) {
            regions = data.regions;
            var sel = $("#toolbarRegion select");
            $("<option>")
                .attr("value", "ALL")
                .addClass("only-flow")
                .html("All regions")
                .appendTo(sel);
            $("<option>")
                .attr("data-divider", "true")
                .addClass("only-flow")
                .appendTo(sel);
            for (var r in data.regions) {
                if (data.regions.hasOwnProperty(r)) {
                    var region = data.regions[r];
                    $("<option>")
                        .attr("value", r)
                        .html(region.name)
                        .appendTo(sel);
                }
            }
            $("#toolbarRegion select").selectpicker("refresh");
        }, error: handleError
    });
    $("#toolbarRegion select").on("change", function(event) {
        var value = $(this).val();
        if (value==="") {
            $(this).selectpicker("setStyle", "btn-danger", "add");
        } else {
            $(this).selectpicker("setStyle", "btn-danger", "remove");
            if (region !== value) {
                region = value;
                updateMap();
            }
        }
    });


    $.ajax({
        url: "/sectors",
        type: "GET",
        success: function(data) {
            var sel = $("#toolbarSector select");
            $("<option>")
                .attr("value", "ALL")
                .addClass("only-flow")
                .html("All sectors")
                .appendTo(sel);
            $("<option>")
                .attr("data-divider", "true")
                .addClass("only-flow")
                .appendTo(sel);
            for (var s in data) {
                if (s.length==4) { //no subsectors
                    var sector = data[s];
                    $("<option>")
                        .attr("value", s)
                         //.attr("data-content", "<span class='sectorlabel' style='background-color:" + sector.color + ";'></span>" + sector.name) //TODO: color indicators?
                         .html(sector.name)
                         .appendTo(sel);
                }
            }
            $("#toolbarSector select").selectpicker("refresh");
        }, error: handleError
    });
    $("#toolbarSector select").on("change", function(event) {
        var value = $(this).val();
        if (value==="") {
            $(this).selectpicker("setStyle", "btn-danger", "add");
        } else {
            $(this).selectpicker("setStyle", "btn-danger", "remove");
             if (sector !== value) {
                sector = value;
                updateMap();
             }
        }
    });

   $.ajax({
         success: function(data) {
             var sel = $("#toolbarYear select");
             for (var r = 2011; r >= 1990; r--) {
                     var year = r;
                     $("<option>")
                         .attr("value", r)
                         .html(r)
                         .appendTo(sel);
             }
             $("#toolbarYear select").selectpicker("refresh");
         }, error: handleError
     });
     $("#toolbarYear select").on("change", function(event) {
         var value = $(this).val();
         if (value==="") {
             $(this).selectpicker("setStyle", "btn-danger", "add");
         } else {
             $(this).selectpicker("setStyle", "btn-danger", "remove");
             if (year !== value) {
                 year = value;
                 updateMap();
             }
         }
   });

    $.ajax({
         success: function(data) {
             var sel = $("#toolbarNumber select");
             for (var n = 5; n <=40; n++) {
                     var number = n*5;
                     $("<option>")
                         .attr("value", number)
                         .html(number)
                         .appendTo(sel);
             }
             $("#toolbarNumber select").selectpicker("refresh");
         }, error: handleError
     });
     $("#toolbarNumber select").on("change", function(event) {
         var value = $(this).val();
         if (value==="") {
             $(this).selectpicker("setStyle", "btn-danger", "add");
         } else {
             $(this).selectpicker("setStyle", "btn-danger", "remove");
             if (number !== value) {
                 number = value;
                 updateMap();
             }
         }
    });

    $("#download").hide();
    $("#download ul a").on("click", function () {
        var typename = type;
        var ordername = "";
        var regionname = "world";
        if (typename == "nap") {
            typename = "gap";
            ordername = order;
            regionname = region;
        } else if (typename == "flow_centrality") {
            typename = "centrality";
        } else if (typename == "flows") {
            regionname = region;
            if (region === "ALL") {
                regionname = "world";
            }
            if (sector != "ALL") {
                regionname += "_" + sector;
            }
        }
        var format = $(this).attr("id") == "download-png" ? "png" : "pdf";
        $("#convert-form input[name='filename']").val("zeean_" + regionname + "_" + year + "_" + typename + ordername + "." + format);
        $("#convert-form input[name='format']").val(format);
        $("#convert-form input[name='data']").val(map.getSVG().attr("version", "1.1").attr("xmlns", "http://www.w3.org/2000/svg").node().parentNode.innerHTML);
        $("#convert-form").submit();
    });
});
