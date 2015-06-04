/*
 * zeean.net
 * Sven Willner (sven.willner@pik-potsdam.de)
 *
 */

// TODO display must implement: startWaiting, stopWaiting, setData(data)

var Parameters = (function() {
	var typeSelect;

    function handleError(e) {
        bootbox.alert("Sorry, an error occurred: " + e);
    }

    var parameterTypes = {
    	"region_sector": {
    		describe: function(selection) {
    			var desc = "";
				desc += selection.gui.sector.getName();
    			desc += " in ";
				desc += selection.gui.region.getName();
    			desc += " (in ";
				desc += selection.gui.year.getName();
				desc += ")";
    			return desc;
    		},
    		build: function(div, selection, parameter, reset) {
    			if (reset) {
	    			selection.values.year = parameter.default_year;
	    		}
    			selection.gui.year = new YearSelect({
    				disallowAll: parameter.yearDisallowAll || parameter.disallowAll,
    				multiple: parameter.yearMultiple || parameter.multiple,
    				tooltip: parameter.yearTooltip || "Year of data displayed",
    				placement: parameter.yearPlacement || parameter.placement
    			});
    			selection.gui.year.div.appendTo(div);
    			if (typeof(selection.values.year) !== "undefined") {
	    			selection.gui.year.set(selection.values.year);
	    		}
	    		selection.gui.year.div.on("change_value", function(ev, val) {
	    			selection.values.year = val;
	    			showData();
	    		});

    			if (reset) {
	    			selection.values.region = parameter.default_region;
	    		}
    			selection.gui.region = new RegionSelect({
    				disallowAll: parameter.regionDisallowAll || parameter.disallowAll,
    				multiple: parameter.regionMultiple || parameter.multiple,
    				tooltip: parameter.regionTooltip || "Region to consider",
    				placement: parameter.regionPlacement || parameter.placement
    			});
    			selection.gui.region.div.appendTo(div);
    			selection.gui.region.set(selection.values.region);
	    		selection.gui.region.div.on("change_value", function(ev, val) {
	    			selection.values.region = val;
	    			showData();
	    		});

    			if (reset) {
	    			selection.values.sector = parameter.default_sector;
	    		}
    			selection.gui.sector = new SectorSelect({
    				disallowAll: parameter.sectorDisallowAll || parameter.disallowAll,
    				multiple: parameter.sectorMultiple || parameter.multiple,
    				tooltip: parameter.sectorTooltip || "Sector to consider",
    				placement: parameter.sectorPlacement || parameter.placement
    			});
    			selection.gui.sector.div.appendTo(div);
    			selection.gui.sector.set(selection.values.sector);
	    		selection.gui.sector.div.on("change_value", function(ev, val) {
	    			selection.values.sector = val;
	    			showData();
	    		});
    		},
    		validate: function(selection, parameter) {
    			var val = true;
    			if (typeof(selection.values.region)==="undefined") {
	    			selection.gui.region.setInvalid();
    				val = false;
    			}
    			if (typeof(selection.values.sector)==="undefined") {
	    			selection.gui.sector.setInvalid();
    				val = false;
    			}
    			if (typeof(selection.values.year)==="undefined") {
	    			selection.gui.year.setInvalid();
    				val = false;
    			}
    			return val;
    		}
    	},
    	"region_sector_to_region_sector": {
    		describe: function(selection) {
    			var desc = "from ";
				desc += selection.gui.sector_from.getName();
    			desc += " in ";
				desc += selection.gui.region_from.getName();
				desc += " to ";
				desc += selection.gui.sector_to.getName();
    			desc += " in ";
				desc += selection.gui.region_to.getName();
    			desc += " (in ";
				desc += selection.gui.year.getName();
				desc += ")";
    			return desc;
    		},
    		build: function(div, selection, parameter, reset) {
    			if (reset) {
	    			selection.values.year = parameter.default_year;
	    		}
    			selection.gui.year = new YearSelect({
    				disallowAll: parameter.yearDisallowAll || parameter.disallowAll,
    				multiple: parameter.yearMultiple || parameter.multiple,
    				tooltip: parameter.yearTooltip || "Year of data displayed",
    				placement: parameter.yearPlacement || parameter.placement
    			});
    			selection.gui.year.div.appendTo(div);
    			if (typeof(selection.values.year) !== "undefined") {
	    			selection.gui.year.set(selection.values.year);
	    		}
	    		selection.gui.year.div.on("change_value", function(ev, val) {
	    			selection.values.year = val;
	    			showData();
	    		});

    			if (reset) {
	    			selection.values.region_from = parameter.default_region_from;
	    		}
    			selection.gui.region_from = new RegionSelect({
    				disallowAll: parameter.regionFromDisallowAll || parameter.disallowAll,
    				multiple: parameter.regionFromMultiple || parameter.multiple,
    				tooltip: parameter.regionFromTooltip || "Source region to consider",
    				placement: parameter.regionFromPlacement || parameter.placement
    			});
    			selection.gui.region_from.div.appendTo(div);
    			selection.gui.region_from.set(selection.values.region_from);
	    		selection.gui.region_from.div.on("change_value", function(ev, val) {
	    			selection.values.region_from = val;
	    			showData();
	    		});

    			if (reset) {
	    			selection.values.sector_from = parameter.default_sector_from;
	    		}
    			selection.gui.sector_from = new SectorSelect({
    				disallowAll: parameter.sectorFromDisallowAll || parameter.disallowAll,
    				multiple: parameter.sectorFromMultiple || parameter.multiple,
    				tooltip: parameter.sectorFromTooltip || "Source sector to consider",
    				placement: parameter.sectorFromPlacement || parameter.placement
    			});
    			selection.gui.sector_from.div.appendTo(div);
    			selection.gui.sector_from.set(selection.values.sector_from);
	    		selection.gui.sector_from.div.on("change_value", function(ev, val) {
	    			selection.values.sector_from = val;
	    			showData();
	    		});

    			if (reset) {
	    			selection.values.region_to = parameter.default_region_to;
	    		}
    			selection.gui.region_to = new RegionSelect({
    				disallowAll: parameter.regionToDisallowAll || parameter.disallowAll,
    				multiple: parameter.regionToMultiple || parameter.multiple,
    				tooltip: parameter.regionToTooltip || "Target region to consider",
    				placement: parameter.regionToPlacement || parameter.placement
    			});
    			selection.gui.region_to.div.appendTo(div);
    			selection.gui.region_to.set(selection.values.region_to);
	    		selection.gui.region_to.div.on("change_value", function(ev, val) {
	    			selection.values.region_to = val;
	    			showData();
	    		});

    			if (reset) {
	    			selection.values.sector_to = parameter.default_sector_to;
	    		}
    			selection.gui.sector_to = new SectorSelect({
    				disallowAll: parameter.sectorToDisallowAll || parameter.disallowAll,
    				multiple: parameter.sectorToMultiple || parameter.multiple,
    				tooltip: parameter.sectorToTooltip || "Target sector to consider",
    				placement: parameter.sectorToPlacement || parameter.placement
    			});
    			selection.gui.sector_to.div.appendTo(div);
    			selection.gui.sector_to.set(selection.values.sector_to);
	    		selection.gui.sector_to.div.on("change_value", function(ev, val) {
	    			selection.values.sector_to = val;
	    			showData();
	    		});
    		},
    		validate: function(selection, parameter) {
    			var val = true;
    			if (typeof(selection.values.region_from)==="undefined") {
	    			selection.gui.region_from.setInvalid();
    				val = false;
    			}
    			if (typeof(selection.values.sector_from)==="undefined") {
	    			selection.gui.sector_from.setInvalid();
    				val = false;
    			}
    			if (typeof(selection.values.region_to)==="undefined") {
	    			selection.gui.region_to.setInvalid();
    				val = false;
    			}
    			if (typeof(selection.values.sector_to)==="undefined") {
	    			selection.gui.sector_to.setInvalid();
    				val = false;
    			}
    			if (typeof(selection.values.year)==="undefined") {
	    			selection.gui.year.setInvalid();
    				val = false;
    			}
    			return val;
    		}
    	},
    	"select": {
    		build: function(div, selection, parameter, reset) {
    			if (reset) {
	    			selection.values[parameter.id] = parameter.def;
	    		}
    			selection.gui[parameter.id] = new Select(parameter.values, parameter.text, parameter);
    			selection.gui[parameter.id].div.appendTo(div);
    			if (typeof(selection.values[parameter.id]) !== "undefined") {
	    			selection.gui[parameter.id].set(selection.values[parameter.id]);
	    		}
	    		selection.gui[parameter.id].div.on("change_value", function(ev, val) {
	    			selection.values[parameter.id] = val;
	    			showData();
	    		});
    		},
    		validate: function(selection, parameter) {
    			var val = typeof(selection.values[parameter.id])!=="undefined";
    			if (!val) {
    				selection.gui[parameter.id].setInvalid();
    			}
    			return val;
    		}
    	}
    };
    var selection = {
    	values: {},
    	gui: {},
    	visualization: {},
    	display: null
    };
    var visualizations = {};
    var sidebar;

    function initialize(visualizations_, display_) {
    	typeSelect = $("<select>").appendTo("#toolbarType");
	    $("<option>")
	        .attr("value", "")
	        .html("Please select")
	        .prop("disabled", true)
	        .prop("selected", true)
	        .appendTo(typeSelect);
    	visualizations_.forEach(function(v) {
    		visualizations[v.id] = v;
		    $("<option>")
		        .attr("value", v.id)
		        .html(v.name)
		        .appendTo(typeSelect);
    	});
    	typeSelect.selectpicker({
    		width: "150px"
    	});
    	// TODO Add info-Buttons
    	$(".disabled", typeSelect.parent()).hide();
    	typeSelect.selectpicker("setStyle", "btn-danger", "add");
    	typeSelect.on("change", function() {
    		typeSelect.selectpicker("setStyle", "btn-danger", "remove");
    		selection.values.type = $(this).val();
	    	selection.visualization = visualizations[$(this).val()];
	    	build(true);
    	});
    	selection.display = display_;
    	sidebar = $("#sidebar");
    	$("#btnSettings").on("click", function() {
    		sidebar.fadeToggle();
    	});
    }

    function showData() {
    	for (var i = 0; i < selection.visualization.parameters.length; i++) {
    		if (!parameterTypes[selection.visualization.parameters[i].type]
    			|| !parameterTypes[selection.visualization.parameters[i].type].validate
    			|| !parameterTypes[selection.visualization.parameters[i].type].validate(selection, selection.visualization.parameters[i])) {
    			return false;
    		}
    	}
    	selection.display.startWaiting();
    	selection.visualization.getData(selection.values, function(data) {
	    	window.location.hash = $.param(selection.values);
	    	data.description = selection.visualization.describe(selection);
	    	data.parameters = selection.values;
    		selection.display.setData(data);
    		selection.display.stopWaiting();
    	}, function(err) {
    		handleError(err);
    		selection.display.setData([], "An error occured");
    		selection.display.stopWaiting();
    	});
    }

    function build(reset) {
    	if (reset) {
	    	selection.values = {
	    		type: selection.visualization.id
	    	};
	    }
    	selection.gui = {};
    	var div = $(".popover-content", sidebar).html('');
    	selection.visualization.parameters.forEach(function(p) {
    		var t = parameterTypes[p.type];
    		if (t) {
    			t.build(div, selection, p, reset);
    		}
    	});
    	showData();
    }

    function readFromHash(def) {
    	selection.values = $.deparam(window.location.hash.substring(1));
    	if (typeof(selection.values.type)==="undefined") {
    		selection.values = def;
    	}
    	selection.visualization = visualizations[selection.values.type];
    	if (!selection.visualization) {
    		selection.values = def;
	    	selection.visualization = visualizations[selection.values.type];
    	}
    	typeSelect.val(selection.values.type);
    	typeSelect.selectpicker("setStyle", "btn-danger", "remove");
    	typeSelect.selectpicker("render");
    	build(false);
    }

    function setParameter(name, value) {
    	selection.gui[name] && selection.gui[name].set(value);
    }

    function download(format) {
        $("#convert-form input[name='filename']").val("zeean_visualization." + format);
        $("#convert-form input[name='format']").val(format);
        $("#convert-form input[name='data']").val(selection.display.getSVGString());
        $("#convert-form").submit();
    }

    return {
    	initialize: initialize,
    	readFromHash: readFromHash,
    	parameterTypes: parameterTypes,
    	setParameter: setParameter,
    	download: download
    };
})();
