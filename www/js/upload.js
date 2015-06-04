/*
 * zeean.net
 * Author: Sven Willner (sven.willner@pik-potsdam.de)
 *
 */
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
            if (value_==="flow") {
                gdpType.hide();
                flowRegion.show();
            } else if (value_==="gdp") {
                flowRegion.hide();
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
        $("#formUpload")[0].reset();
        $("#blockType").addClass("current").removeClass("ok");
        $("#blockType input").prop("checked", false);
        $("#blockType .btn").removeClass("active");
        gdpType.hide();
        flowRegion.hide();
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
            rowIndex.show();
        }
    }

    function show() {
        $("#blockGDPType input").prop("checked", false);
        $("#blockGDPType .btn").removeClass("active");
        rowIndex.hide();
        $("#blockGDPType").addClass("current").removeClass("ok");
        $("#blockGDPType").fadeIn();
        scrollTo("#blockGDPType");
    }

    function hide() {
        rowIndex.hide();
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

var flowRegion = (function() {
    var value_;

    function value(val) {
        if (typeof(val)==="undefined") {
            return value_;
        } else {
            value_ = val;
            $("#blockFlowRegion").removeClass("current").addClass("ok");
            if (val=="yes") {
                flowSector.show();
            } else {
                rowIndex.show();
            }
        }
    }

    function show() {
        $("#blockFlowRegion input").prop("checked", false);
        $("#blockFlowRegion .btn").removeClass("active");
        flowSector.hide();
        $("#blockFlowRegion").addClass("current").removeClass("ok");
        $("#blockFlowRegion").fadeIn();
        scrollTo("#blockFlowRegion");
    }

    function hide() {
        flowSector.hide();
        $("#blockFlowRegion").fadeOut();
    }

    $(document).ready(function() {
        $("#blockFlowRegion input").change(function() {
            value($(this).attr("value"));
        });
    });

    return {
        value: value,
        show: show,
        hide: hide
    };
})();

var flowSector = (function() {
    var value_;

    function value(val) {
        if (typeof(val)==="undefined") {
            return value_;
        } else {
            value_ = val;
            $("#blockFlowSector").removeClass("current").addClass("ok");
            rowIndex.show();
        }
    }

    function show() {
        $("#blockFlowSector input").prop("selected", false);
        $("#blockFlowSector .btn").removeClass("active");
        rowIndex.hide();
        $("#blockFlowSector").addClass("current").removeClass("ok");
        $("#blockFlowSector").fadeIn();
        scrollTo("#blockFlowSector");
    }

    function hide() {
        rowIndex.hide();
        $("#blockFlowSector").fadeOut();
    }

    $(document).ready(function() {
        $("#blockFlowSector input").change(function() {
            value($(this).attr("value"));
        });
    });

    return {
        value: value,
        show: show,
        hide: hide
    };
})();

var rowIndex = (function() {
    function show() {
        if (type.value()=="flow") {
            if (flowRegion.value()=="yes") {
                $("#blockRowIndex label").html("Please select the indices file for the regional sectors the flow is coming from");
                $("#blockRowIndex .alert").html("<a href='examples/regions.csv'>Possible region indices</a><br/><a href='examples/sectors.csv'>Possible sector indices</a><br/>Download an example file <a href='examples/regional_sectors_example.csv'>here</a>");
            } else if (flowRegion.value()=="no") {
                $("#blockRowIndex label").html("Please select the indices file for the commodities of the flows");
                $("#blockRowIndex .alert").html("<a href='examples/sectors.csv'>Possible commodity indices</a><br/>Download an example file <a href='examples/commodities_example.csv'>here</a>");
            }
        } else if (type.value()=="gdp") {
            if (gdpType.value()=="region") {
                $("#blockRowIndex label").html("Please select the indices file for the regions");
                $("#blockRowIndex .alert").html("<a href='examples/regions.csv'>Possible region indices</a><br/>Download an example file <a href='examples/regions_example.csv'>here</a>");
                $("input[name='type']").val("r");
            } else if (gdpType.value()=="regionalsector") {
                $("#blockRowIndex label").html("Please select the indices file for the regional sectors");
                $("#blockRowIndex .alert").html("<a href='examples/regions.csv'>Possible region indices</a><br/><a href='examples/sectors.csv'>Possible sector indices</a><br/>Download an example file <a href='examples/regional_sectors_example.csv'>here</a>");
                $("input[name='type']").val("ir");
            }
        }
        $("#formUpload")[0].reset();
        $(".file-input-name").remove();
        colIndex.hide();
        $("#blockRowIndex").addClass("current").removeClass("ok");
        $("#blockRowIndex").fadeIn();
        scrollTo("#blockRowIndex");
    }

    function hide() {
        colIndex.hide();
        $("#blockRowIndex").fadeOut();
    }

    $(document).ready(function() {
        $(".upload").bootstrapFileInput();
        $("#blockRowIndex input").change(function() {
            $("#blockRowIndex").removeClass("current").addClass("ok");
            if (type.value()=="flow") {
                colIndex.show();
            } else if (type.value()=="gdp") {
                data.show();
            }
        });
    });

    return {
        show: show,
        hide: hide
    };
})();

var colIndex = (function() {
    function show() {
        if (flowRegion.value()=="yes" && flowSector.value()=="no") {
            $("#blockColIndex label").html("Please select the indices file for the regions the flow is going to");
            $("#blockColIndex .alert").html("<a href='examples/regions.csv'>Possible region indices</a><br/>Download an example file <a href='examples/regions_example.csv'>here</a>");
            $("input[name='type']").val("ir->s");
        } else {
            $("#blockColIndex label").html("Please select the indices file for the regional sectors the flow is going to");
            $("#blockColIndex .alert").html("<a href='examples/regions.csv'>Possible region indices</a><br/><a href='examples/sectors.csv'>Possible sector indices</a><br/>Download an example file <a href='examples/regional_sectors_example.csv'>here</a>");
            if (flowRegion.value()=="yes") {
                $("input[name='type']").val("ir->js");
            } else {
                $("input[name='type']").val("i->js");
            }
        }
        data.hide();
        $("#blockColIndex").addClass("current").removeClass("ok");
        $("#blockColIndex").fadeIn();
        scrollTo("#blockColIndex");
    }

    function hide() {
        data.hide();
        $("#blockColIndex").fadeOut();
    }

    $(document).ready(function() {
        $("#blockColIndex input").change(function() {
            $("#blockColIndex").removeClass("current").addClass("ok");
            data.show();
        });
    });

    return {
        show: show,
        hide: hide
    };
})();

var data = (function() {
    function show() {
        if (type.value()=="flow") {
            $("#blockData label").html("Please select the file containing the flow data");
            $("#blockData .alert").html("Please make sure the data file fits to your indices!<br/>Download an example file <a href='examples/flows_example.csv'>here</a> (Corresponds to <a href='examples/flows_example_rows.csv'>these 'from'/row indices</a> and <a href='examples/flows_example_cols.csv'>these 'to'/column indices</a>");
        } else if (type.value()=="gdp") {
            $("#blockData label").html("Please select the file containing the GDP data");
            $("#blockData .alert").html("Please make sure the data file fits to your indices!<br/>Download an example file <a href='examples/gdp_example.csv'>here</a> (Corresponds to <a href='examples/gdp_example_indices.csv'>these indices</a>)");
        }
        year.hide();
        $("#blockData").addClass("current").removeClass("ok");
        $("#blockData").fadeIn();
        scrollTo("#blockData");
    }

    function hide() {
        year.hide();
        $("#blockData").fadeOut();
    }

    $(document).ready(function() {
        $("#blockData input").change(function() {
            $("#blockData").removeClass("current").addClass("ok");
            year.show();
        });
    });

    return {
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
                $("input[name='year']").val(val);
                metadata.show();
            }
        }
    }

    function show() {
        $("#year a").eq(0).html("Please select");
        if (type.value() == "gdp") {
            $("#blockYear label").html('What is the year the GDP information refers to?');
            $("#blockYear .col-xs-8").html('');
        } else if (type.value() == "flow") {
            $("#blockYear label").html('When where the flows transferred?');
            $("#blockYear .col-xs-8").html('<div class="alert alert-warning">Please note, that each flow should refer to a whole year. If necessary, use projections</div>');
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
        $(".selectpicker").selectpicker();
        $(".selectpicker li.disabled").hide();

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
            }
        });

        $("#blockYear .year").change(function() {
            if ($(this).val() && $(this).val() != "") {
                $("#blockYear").removeClass("current").addClass("ok");
                metadata.show();
                value($(this).val());
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
            source: $("#blockSource input").val(),
            confidence: $("#blockConfidence input:checked").val(),
            comment: $("#blockComment input").val()
        };
    }

    function show() {
        $("#blockConfidence input").prop("selected", false);
        $("#blockConfidence .btn").removeClass("active");
        $("#blockSource input").val("");
        $("#blockComment input").val("");
        submit.hide();
        $("#blockConfidence").addClass("current").removeClass("ok");
        $("#blockSource").addClass("current").removeClass("ok");
        $("#blockSource").fadeIn();
        $("#blockConfidence").fadeIn();
        $("#blockComment").fadeIn();
        scrollTo("#blockComment");
    }

    function hide() {
        submit.hide();
        $("#blockSource").fadeOut();
        $("#blockConfidence").fadeOut();
        $("#blockComment").fadeOut();
    }

    $(document).ready(function() {
        $("#blockSource input").change(function() {
            var source = $(this).val();
            if (source != "") {
                $("#blockSource").removeClass("current").addClass("ok");
                if ($("#blockConfidence input:checked").size() > 0) {
                    submit.show();
                }
            } else {
                $("#blockSource").addClass("current").removeClass("ok");
                submit.hide();
            }
        });
        $("#blockConfidence input").change(function() {
            $("#blockConfidence").removeClass("current").addClass("ok");
            var source = $("#blockSource input").val();
            if (source != "") {
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

var submit = (function() {
    var ready = false;

    function show() {
        $("#blockSubmit").fadeIn();
        scrollTo("#blockSubmit");
        ready = true;
    }

    function hide() {
        $("#blockSubmit").fadeOut();
        ready = false;
    }

    $(document).ready(function() {
        $("#formUpload").submit(function(event) {
            if (ready) {
                $("#blockSubmit button").button("loading");
                bootbox.dialog({
                    message: "Your data is being uploaded and processed. Please wait and do not close or refresh this page...",
                    title: "Processing data",
                    closeButton: false,
                    buttons: {}
                });
            } else {
                event.preventDefault();
            }
        });
    });

    return {
        show: show,
        hide: hide
    };
})();
