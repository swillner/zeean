/*
 * zeean.net
 * Author: Sven Willner (sven.willner@pik-potsdam.de)
 *
 */
var sectors;

function handleError(e) {
    bootbox.alert("Sorry, an error occurred: " + e);
    map.stopWaiting();
}

function scrollTo(selector) {
    var dest = 0;
    //if ($(selector).offset().top > $(document).height() - $(window).height()) {
        dest = $(document).height() - $(window).height();
    //} else {
    //    dest = $(selector).offset().top;
    //}
    $('html,body').animate({
        scrollTop: dest
    }, 800, "linear");
}

var type = (function() {
    var value_;

    function value(val) {
        if (typeof(val)==="undefined") {
            return value_;
        } else {
            value_ = val;
            $("#blockType").removeClass("current").addClass("ok");
            $("#infoBox").fadeOut();
            if (value_==="flow") {
                gdpType.hide();
                flowType.show();
            } else if (value_==="gdp") {
                flowType.hide();
                gdpType.show();
            }
        }
    }

    $(document).ready(function() {
        $("#blockType input").change(function() {
            value($(this).attr("value"));
        });
    });

    function reset() {
        $("#blockType").addClass("current").removeClass("ok");
        $("#blockType input").prop("checked", false);
        $("#blockType .btn").removeClass("active");
        gdpType.hide();
        flowType.hide();
    }

    return {
        value: value,
        reset: reset
    };
})();

var gdpType = (function() {
    var value_;

    function value(val) {
        if (typeof(val)==="undefined") {
            return value_;
        } else {
            value_ = val;
            $("#blockGDPType").removeClass("current").addClass("ok");
            if (val == "regionalsector") {
                sector2.show();
            } else if (val == "region") {
                sector2.hide();
                region2.show();
            }
        }
    }

    function show() {
        $("#blockGDPType input").prop("checked", false);
        $("#blockGDPType .btn").removeClass("active");
        sector2.hide();
        $("#blockGDPType").addClass("current").removeClass("ok");
        $("#blockGDPType").fadeIn();
        scrollTo("#blockGDPType");
    }

    function hide() {
        sector2.hide();
        $("#blockGDPType").fadeOut();
    }

    $(document).ready(function() {
        $("#blockGDPType input").change(function() {
            value($(this).attr("value"));
        });
    });

    return {
        value: value,
        show: show,
        hide: hide
    };
})();

var flowType = (function() {
    var value_;

    function value(val) {
        if (typeof(val)==="undefined") {
            return value_;
        } else {
            value_ = val;
            $("#blockFlowType").removeClass("current").addClass("ok");
            targetType.show();
        }
    }

    function show() {
        $("#blockFlowType input").prop("checked", false);
        $("#blockFlowType .btn").removeClass("active");
        targetType.hide();
        $("#blockFlowType").addClass("current").removeClass("ok");
        $("#blockFlowType").fadeIn();
        scrollTo("#blockFlowType");
    }

    function hide() {
        targetType.hide();
        $("#blockFlowType").fadeOut();
    }

    $(document).ready(function() {
        $("#blockFlowType input").change(function() {
            value($(this).attr("value"));
        });
    });

    return {
        value: value,
        show: show,
        hide: hide
    };
})();

var targetType = (function() {
    var value_;

    function value(val) {
        if (typeof(val)==="undefined") {
            return value_;
        } else {
            value_ = val;
            $("#blockTargetType").removeClass("current").addClass("ok");
            sector1.show();
        }
    }

    function show() {
        $("#blockTargetType input").prop("selected", false);
        $("#blockTargetType .btn").removeClass("active");
        sector1.hide();
        $("#blockTargetType").addClass("current").removeClass("ok");
        $("#blockTargetType").fadeIn();
        scrollTo("#blockTargetType");
    }

    function hide() {
        sector1.hide();
        $("#blockTargetType").fadeOut();
    }

    $(document).ready(function() {
        $("#blockTargetType input").change(function() {
            value($(this).attr("value"));
        });
    });

    return {
        value: value,
        show: show,
        hide: hide
    };
})();

var sector1 = (function() {
    function value(val) {
        if (typeof(val)==="undefined") {
            var sector_id = $("#blockSector1 .sector").selectpicker("val");
            var sector = sectors[sector_id];
            if (sector && sector.sub && sector.sub.length > 1) {
                var subsector_id = $("#blockSector1 .subsector").selectpicker("val");
                if (subsector_id !== "ALL") {
                    return subsector_id;
                } else {
                    return sector_id;
                }
            } else {
                return sector_id;
            }
        } else {
            $("#blockSector1 .sector").selectpicker("val", val);
        }
    }

    function show() {
        if (targetType.value() == "finaldemand") {
            $("#blockSector1 label").html('Which good (commodity) was consumed?');
        } else {
            $("#blockSector1 label").html('Which commodity was transferred?');
        }
        $("#blockSector1 .sector").selectpicker("val", "");
        $("#blockSector1 .subsector").selectpicker("hide");
        region1.hide();
        $("#blockSector1").addClass("current").removeClass("ok");
        $("#blockSector1").fadeIn();
        scrollTo("#blockSector1");
    }

    function hide() {
        region1.hide();
        $("#blockSector1").fadeOut();
    }

    $(document).ready(function() {
        $("#blockSector1 .sector, #blockSector1 .subsector").change(function() {
            if ($(this).val() && $(this).val() != "") {
                $("#blockSector1").removeClass("current").addClass("ok");
                if (flowType.value() == "domestic") {
                    if (targetType.value() == "finaldemand" || targetType.value() == "both") {
                        region2.show();
                    } else {
                        sector2.show();
                    }
                } else if (flowType.value() == "international") {
                    region1.show();
                }
            } else {
                $("#blockSector1").addClass("current").removeClass("ok");
                region1.hide();
            }
        });
    });

    return {
        value: value,
        show: show,
        hide: hide
    };
})();

var region1 = (function() {
    var map1;

    function value() {
        var subregion = $("#blockRegion1 .subregion").selectpicker("val");
        return subregion=="" || subregion=="ALL" ? $("#blockRegion1 .region").selectpicker("val") : subregion;
    }

    function show() {
        $("#blockRegion1 .region").selectpicker("val", "");
        $("#blockRegion1 .subregion").selectpicker("hide");
        sector2.hide();
        $("#blockRegion1").addClass("current").removeClass("ok");
        $("#blockRegion1").fadeIn(400, function() {
            map1.resize();
        });
        scrollTo("#blockRegion1");
    }

    function hide() {
        sector2.hide();
        $("#blockRegion1").fadeOut();
    }

    $(document).ready(function() {
        map1 = new Map($("#blockRegion1 .data_map").html(''));
        $("#blockRegion1 .region").data("map", map1).change(function() {
            var val = $(this).val();
            if (val && val!="") {
                $("#blockRegion1").removeClass("current").addClass("ok");
                if (targetType.value() == "finaldemand" || targetType.value() == "both") {
                    if (flowType.value() == "international") {
                        region2.show();
                    } else if (flowType.value() == "domestic") {
                        year.show();
                    }
                } else {
                    sector2.show();
                }
            }
        });
        $("#blockRegion1 .subregion").data("map", map1);
    });

    return {
        value: value,
        show: show,
        hide: hide
    };
})();

var sector2 = (function() {
    function value(val) {
        if (typeof(val)==="undefined") {
            var sector_id = $("#blockSector2 .sector").selectpicker("val");
            var sector = sectors[sector_id];
            if (sector && sector.sub && sector.sub.length > 1) {
                var subsector_id = $("#blockSector2 .subsector").selectpicker("val");
                if (subsector_id !== "ALL") {
                    return subsector_id;
                } else {
                    return sector_id;
                }
            } else {
                return sector_id;
            }
        } else {
            $("#blockSector2 .sector").selectpicker("val", val);
        }
    }

    function show() {
        if (type.value() == "gdp") {
            $("#blockSector2 label").html('For which sector do you want to share GDP data?');
        } else if (type.value() == "flow") {
            $("#blockSector2 label").html('Which sector was the commodity transferred to?');
        }
        $("#blockSector2 .sector").selectpicker("val", "");
        $("#blockSector2 .subsector").selectpicker("hide");
        region2.hide();
        $("#blockSector2").addClass("current").removeClass("ok");
        $("#blockSector2").fadeIn();
        scrollTo("#blockSector2");
    }

    function hide() {
        region2.hide();
        $("#blockSector2").fadeOut();
    }

    $(document).ready(function() {
        $("#blockSector2 .sector, #blockSector2 .subsector").change(function() {
            if ($(this).val() && $(this).val() != "") {
                $("#blockSector2").removeClass("current").addClass("ok");
                region2.show();
            } else {
                $("#blockSector2").addClass("current").removeClass("ok");
                region2.hide();
            }
        });
    });

    return {
        value: value,
        show: show,
        hide: hide
    };
})();

var region2 = (function() {
    var map2;

    function value(val) {
        var subregion = $("#blockRegion2 .subregion").selectpicker("val");
        return subregion=="" || subregion=="ALL" ? $("#blockRegion2 .region").selectpicker("val") : subregion;
    }

    function show() {
        if (type.value() == "gdp") {
            $("#blockRegion2 label").html('For which country do you want to enter the GDP?');
        } else if (type.value() == "flow") {
            if (targetType.value() == "finaldemand") {
                $("#blockRegion2 label").html('Where was the good consumed?');
            } else {
                if (flowType.value() == "domestic") {
                    $("#blockRegion2 label").html('In which country did the flow take place?');
                } else if (flowType.value() == "international") {
                    $("#blockRegion2 label").html('Which was the destination country of your flow?');
                }
            }
        }
        $("#blockRegion2 .region").selectpicker("val", "");
        $("#blockRegion2 .subregion").selectpicker("hide");
        year.hide();
        $("#blockRegion2").addClass("current").removeClass("ok");
        $("#blockRegion2").fadeIn(400, function() {
            map2.resize();
        });
        scrollTo("#blockRegion2");
    }

    function hide() {
        year.hide();
        $("#blockRegion2").fadeOut();
    }

    $(document).ready(function() {
        map2 = new Map($("#blockRegion2 .data_map").html(''));
        $("#blockRegion2 .region").data("map", map2).change(function() {
            var val = $(this).val();
            if (val && val!="") {
                $("#blockRegion2").removeClass("current").addClass("ok");
                year.show();
            }
        });
        $("#blockRegion2 .subregion").data("map", map2);
    });

    return {
        value: value,
        show: show,
        hide: hide
    };
})();

var year = (function() {
    var value_;

    function value(val) {
        if (typeof(val)==="undefined") {
            value_ = $("#blockYear .year").selectpicker("val");
            return value_;
        } else {
            if (val != value_) {
                value_ = val;
                $("#blockYear").removeClass("current").addClass("ok");
                metadata.show();
            }
        }
    }

    function show() {
        $("#year a").eq(0).html("Please select");
        if (type.value() == "gdp") {
            $("#blockYear label").html('What is the year the GDP refers to?');
            $("#blockYear .col-xs-8").html('');
        } else if (type.value() == "flow") {
            $("#blockYear label").html('When did the flow take place?');
            $("#blockYear .col-xs-8").html('<div class="alert alert-warning">Please note, that a flow should always refer to a whole year. If necessary, use projections</div>');
        }
        metadata.hide();
        $("#blockYear").addClass("current").removeClass("ok");
        $("#blockYear").fadeIn();
        scrollTo("#blockYear");
    }

    function hide() {
        metadata.hide();
        $("#blockYear").fadeOut();
    }

    $(document).ready(function() {

        $.ajax({
            success: function(data) {
                var sel = $(".year");
                for (var r = 2013; r >= 1990; r--) {
                    var year = r;
                    $("<option>")
                        .attr("value", r)
                        .html(r)
                        .appendTo(sel);
                }
                sel.selectpicker("refresh");
            }, error: handleError
        });
     
       $("#blockYear .year").change(function() {
           if ($(this).val() && $(this).val() != "") {
               $("#blockYear").removeClass("current").addClass("ok");
               metadata.show();
           } else {
               $("#blockYear").addClass("current").removeClass("ok");
               metadata.hide();
           }
       });
    });

    return {
        value: value,
        show: show,
        hide: hide
    };
})();

var metadata = (function() {
    function value() {
        return {
            value: +$("#blockValue input").val(),
            source: $("#blockSource input").val(),
            confidence: $("#blockConfidence input:checked").val(),
            comment: $("#blockComment input").val()
        };
    }

    function show() {
        if (type.value() == "gdp") {
            $("#blockValue label").html('What is the exact GDP value in US k$?');
            $("#blockValue .col-xs-8").html('<div class="alert alert-warning">Please note that you should enter the nominal GDP and that the base year (i.e. the year of reference concerning taxes, margins and the like) for the given amount should equal the year selected above</div>');
        } else if (type.value() == "flow") {
            if (targetType.value() == "finaldemand") {
                $("#blockValue label").html('How much (in US k$) of the good was consumed within one year?');
            } else {
                $("#blockValue label").html('How much (in US k$) of the commodity was transferred to the sector within one year?');
            }
            $("#blockValue .col-xs-8").html('<div class="alert alert-warning">Please note that the base year (i.e. the year of reference concerning taxes, margins and the like) for the given amount should equal the year selected above</div>');
        }
        $("#blockValue input").val("");
        $("#blockConfidence input").prop("selected", false);
        $("#blockConfidence .btn").removeClass("active");
        $("#blockSource input").val("");
        $("#blockComment input").val("");
        submit.hide();
        $("#blockValue").addClass("current").removeClass("ok");
        $("#blockSource").addClass("current").removeClass("ok");
        $("#blockConfidence").addClass("current").removeClass("ok");
        $("#blockValue").fadeIn();
        $("#blockSource").fadeIn();
        $("#blockConfidence").fadeIn();
        $("#blockComment").fadeIn();
        data.showInfo();
    }

    function hide() {
        submit.hide();
        data.hideInfo();
        $("#blockValue").fadeOut();
        $("#blockSource").fadeOut();
        $("#blockConfidence").fadeOut();
        $("#blockComment").fadeOut();
    }

    $(document).ready(function() {
        $("#blockValue input").change(function() {
            var val = $(this).val();
            var source = $("#blockSource input").val();
            if (val != "" && !isNaN(val)) {
                $("#blockValue").removeClass("current").addClass("ok");
                if ($("#blockConfidence input:checked").size() > 0 && source != "") {
                    submit.show();
                }
            } else {
                $("#blockValue").addClass("current").removeClass("ok");
                submit.hide();
            }
        });
        $("#blockSource input").change(function() {
            var val = $("#blockValue input").val();
            var source = $(this).val();
            if (source != "") {
                $("#blockSource").removeClass("current").addClass("ok");
                if ($("#blockConfidence input:checked").size() > 0 && val != "" && !isNaN(val)) {
                    submit.show();
                }
            } else {
                $("#blockSource").addClass("current").removeClass("ok");
                submit.hide();
            }
        });
        $("#blockConfidence input").change(function() {
            $("#blockConfidence").removeClass("current").addClass("ok");
            var val = $("#blockValue input").val();
            var source = $("#blockSource input").val();
            if (source != "" && val != "" && !isNaN(val)) {
                submit.show();
            }
        });
    });

    return {
        value: value,
        show: show,
        hide: hide
    };
})();

var data = (function() {
    var data;

    function fill() {
        data = {
            year: year.value()
        };
        if (type.value() == "gdp") {
            if (gdpType.value() == "regionalsector") {
                data.sector_from = sector2.value();
                data.region_from = region2.value();
            } else if (gdpType.value() == "region") {
                data.region_from = region2.value();
            } else {
                // ERROR
                return;
            }
        } else if (type.value() == "flow") {
            data.sector_from = sector1.value();
            if (targetType.value() == "finaldemand") {
                data.sector_to = "FD";
            } else if (targetType.value() == "intersectoral") {
                data.sector_to = sector2.value();
            }
            if (flowType.value() == "domestic") {
                data.region_from = data.region_to = region2.value();
            } else if (flowType.value() == "international") {
                data.region_from = region1.value();
                data.region_to = region2.value();
            } else {
                // ERROR
                return;
            }
        } else {
            // ERROR
            return;
        }
        var m = metadata.value();
        data.value = m.value;
        data.source = m.source;
        data.confidence = m.confidence;
        data.comment = m.comment;
        return true;
    }

    function showInfo() {
        if (fill()) {
            var sel = $("#blockInfo .alert").html("<h4>Data for this configuration entered already</h4>").addClass("waiting").addClass("waitingSpinner");
            $.ajax({
                url: "/data/entry",
                type: "GET",
                dataType: "json",
                data: data,
                success: function(data) {
                    sel.removeClass("waiting").removeClass("waitingSpinner");
                    if (data.result && data.result !== "error") {
                        if (data.result.length > 0) {
                            var table = $("<table>").appendTo(sel).addClass("table").css("display", "none");
                            var row = $("<tr>").appendTo($("<thead>").appendTo(table));
                            row.append("<th>Value (US k$)</th>");
                            //row.append("<th>Confidence</th>");
                            row.append("<th>Source</th>");
                            row.append("<th>Comment</th>");
                            //row.append("<th>User</th>");
                            var tbody = $("<tbody>").appendTo(table);
                            data.result.forEach(function(d) {
                                var row = $("<tr>").appendTo(tbody);
                                $("<td>").text(d.value + (d.trusted ? "" : " (preliminary)")).appendTo(row);
                                //$("<td>").text(d.confidence).appendTo(row);
                                $("<td>").text(d.source || "").appendTo(row);
                                $("<td>").text(d.comment || "").appendTo(row);
                                //$("<td>").text(d.username || "").appendTo(row);
                            });
                            table.fadeIn();
                        } else {
                            sel.html("No data has been entered for this configuration yet.");
                        }
                    } else {
                        sel.html("An error occurred while trying to receive data already entered for this configuration: " + data.error);
                    }
                }, error: function(err) {
                    sel.removeClass("waiting").removeClass("waitingSpinner");
                    sel.html("An error occurred while trying to receive data already entered for this configuration.");
                }
            });
        }

        $("#blockInfo").fadeIn();
        scrollTo("#blockInfo");
    }

    function hideInfo() {
        $("#blockInfo").fadeOut();
    }

    function submit(callback) {
        if (fill()) {
            $.ajax({
                url: "/data/entry",
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(data),
                success: function(data) {
                    if (data.result==="success") {
                        callback();
                    } else {
                        callback(data.error);
                    }
                },
                error: function(jqXHR, err) {
                    callback(err || "Network error");
                }
            });
        } else {
            callback("Data invalid");
        }
    }

    return {
        showInfo: showInfo,
        hideInfo: hideInfo,
        submit: submit
    }
})();

var submit = (function() {
    function show() {
        $("#blockSubmit").fadeIn();
        scrollTo("#blockSubmit");
    }

    function hide() {
        $("#blockSubmit").fadeOut();
    }

    $(document).ready(function() {
        $("#blockSubmit button").click(function(event) {
            $("#blockSubmit button").button("loading");
            data.submit(function(err) {
                $("#blockSubmit button").button("reset");
                if (err){
                    bootbox.alert("Sorry, an error occurred: " + err);
                } else {
                    $("#infoBox").html("Your data input has been saved. Thank you!").fadeIn();
                    type.reset();
                }
            });
        });
    });

    return {
        show: show,
        hide: hide
    };
})();

$(document).ready(function() {
    $(".selectpicker").selectpicker();
    $(".selectpicker li.disabled").hide();

    $.ajax({
        url: "/regions",
        type: "GET",
        success: function(data) {
            var region1 = $("#blockRegion1 .region");
            $("<option>")
                .attr("value", "ALL")
                .addClass("only-flow")
                .html("All regions")
                .appendTo(region1);
            $("<option>")
                .attr("data-divider", "true")
                .addClass("only-flow")
                .appendTo(region1);
            var sel = $(".region");
            for (var r in data.regions) {
                if (data.regions.hasOwnProperty(r)) {
                    var region = data.regions[r];
                    $("<option>")
                        .attr("value", r)
                        .html(region.name)
                        .appendTo(sel);
                }
            }
            sel.selectpicker("refresh");
            $(".selectpicker li.disabled").hide();
        }, error: handleError
    });
    $(".data_map").on("country_click", function(evt, country) {
        $(".region", $(this).parents(".block")).selectpicker("val", country.id);
    });
    $(".data_map").on("subcountry_click", function(evt, country) {
        $(".subregion", $(this).parents(".block")).selectpicker("val", country.id);
    });
    $(".region").change(function() {
        var id = $(this).val();
        var sel = $(".subregion", $(this).parents(".block"));
        var map = $(this).data("map");
        if (!id || id == "ALL" || id == "") {
            map.zoomCenter();
            map.showSubregions();
            $(sel).selectpicker("val", "");
            $(sel).selectpicker("hide");
        } else {
            map.selectCountry(id);
            map.zoomCountry(id);
            map.showSubregions(id, function(subregions) {
                if (subregions) {
                    $("option", sel).remove();
                    $("<option>")
                        .attr("value", "ALL")
                        .addClass("only-flow")
                        .html("Whole country")
                        .appendTo(sel);
                    $("<option>")
                        .attr("data-divider", "true")
                        .addClass("only-flow")
                        .appendTo(sel);
                    subregions.sort(function(a, b) {
                        var textA = a.properties.name.toUpperCase();
                        var textB = b.properties.name.toUpperCase();
                        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                    }).forEach(function(s) {
                        $("<option>")
                            .attr("value", s.properties.id)
                            .html(s.properties.name)
                            .appendTo(sel);
                    });
                    sel.selectpicker("show");
                    sel.selectpicker("refresh");
                } else {
                    $(sel).selectpicker("val", "");
                    $(sel).selectpicker("hide");
                }
            });
        }
    });
    $(".subregion").change(function() {
        var id = $(this).val();
        var map = $(this).data("map");
        if (!id || id == "ALL" || id == "") {
            map.selectCountry();
        } else {
            map.selectCountry(id);
        }
    });

    $(".sector").change(function() {
        var sel = $(".subsector", $(this).parents(".block"));
        if ($(this).val() && $(this).val() != "ALL" && $(this).val() != "") {
            var sector = sectors[$(this).val()];
            if (sector.sub && sector.sub.length > 1) {
                $("option", sel).remove();
                $("<option>")
                    .attr("value", "ALL")
                    .addClass("only-flow")
                    .html("Whole sector")
                    .appendTo(sel);
                $("<option>")
                    .attr("data-divider", "true")
                    .addClass("only-flow")
                    .appendTo(sel);
                sector.sub.forEach(function(s_id) {
                    var s = sectors[s_id];
                    $("<option>")
                        .attr("value", s.id)
                        .html(s.name)
                        .appendTo(sel);
                });
                sel.selectpicker("show");
                sel.selectpicker("refresh");
            } else {
                $(sel).selectpicker("hide");
            }
        } else {
            $(sel).selectpicker("hide");
        }
    });
    $.ajax({
        url: "/sectors",
        type: "GET",
        success: function(data) {
            sectors = data;
            var sel = $(".sector");
            $("<option>")
                .attr("value", "ALL")
                .addClass("only-flow")
                .html("All sectors")
                .appendTo(sel);
            $("<option>")
                .attr("data-divider", "true")
                .addClass("only-flow")
                .appendTo(sel);
            (data.order || []).forEach(function(s) {
                if (s!="FD") {
                    var sector = data[s];
                    $("<option>")
                        .attr("value", s)
                        .attr("data-content", "<span class='sectorlabel' style='background-color:" + sector.color + ";'></span>" + sector.name)
                        .html(sector.name)
                        .appendTo(sel);
                }
            });
            sel.selectpicker("refresh");
            $(".selectpicker li.disabled").hide();
        }, error: handleError
    });

   // $.ajax({
   //     success: function(data) {
   //         var sel = $(".year");
   //         for (var r = 2011; r >= 1990; r--) {
   //             var year = r;
   //             $("<option>")
   //                 .attr("value", r)
   //                 .html(r)
   //                 .appendTo(sel);
   //         }
   //         sel.selectpicker("refresh");
   //     }, error: handleError
   // });

});
