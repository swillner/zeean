/*
 * zeean.net
 * Author: Sven Willner (sven.willner@pik-potsdam.de)
 *
 */

var RegionSelect = function(options) {
	var sel = { div: $("<div>") };
	if (options.tooltip) {
	    sel.div.tooltip({
	        container: "body",
	        title: options.tooltip,
	        placement: options.placement
    	});
	}
	var val;

	function loadSubregions(id, callback) {
        if (!id || id == "ALL" || id == "") {
            sel.subregion_select.val("");
            sel.subregion_select.selectpicker("hide");
        } else {
            $.ajax({
                url: "/geojson",
                data: {
                    country: id
                },
                type: "GET",
                success: function (data_) {
                	var subregions = data_.features;
	                if (subregions) {
	                    $("option", sel.subregion_select).remove();
			            if (options.disallowAll) {
				            $("<option>")
				                .attr("value", id)
				                .html("Whole region")
				                .prop("selected", true)
				                .appendTo(sel.subregion_select);
				        } else {
				            $("<option>")
				                .attr("value", id)
				                .html("Whole region (aggregated)")
				                .prop("selected", true)
				                .appendTo(sel.subregion_select);
				            $("<option>")
				                .attr("value", "*" + id)
				                .html("All subregions (separated)")
				                .appendTo(sel.subregion_select);
				        }
			            $("<option>")
			                .attr("data-divider", "true")
			                .appendTo(sel.subregion_select);
	                    subregions.sort(function(a, b) {
	                        var textA = a.properties.name.toUpperCase();
	                        var textB = b.properties.name.toUpperCase();
	                        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
	                    }).forEach(function(s) {
	                        $("<option>")
	                            .attr("value", s.properties.id)
	                            .html(s.properties.name)
	                            .appendTo(sel.subregion_select);
	                    });
	                    sel.subregion_select.selectpicker("show");
	                    sel.subregion_select.selectpicker("refresh");
			            $(".disabled", sel.subregion_select).hide();
	                } else {
	                    sel.subregion_select.val(id);
	                    sel.subregion_select.selectpicker("hide");
	                }
	                callback && callback();
	            }, error: function(e) {
	            	callback && callback();
	            	handleError(e);
	            }
	        });
        }
    }

	function loadRegions(callback) {
		if (sel.loaded) {
			callback && callback();
			return;
		}
		$.ajax({
	        url: "/regions",
	        type: "GET",
	        success: function(data) {
	            if (options.disallowAll) {
		            $("<option>")
		                .attr("value", "")
		                .html("Please select")
		                .prop("disabled", true)
		                .prop("selected", true)
		                .appendTo(sel.region_select);
		        } else {
		            $("<option>")
		                .attr("value", "ALL")
		                .html("All regions")
		                .prop("selected", true)
		                .appendTo(sel.region_select);
		            $("<option>")
		                .attr("data-divider", "true")
		                .appendTo(sel.region_select);
		        }
	            for (var r in data.regions) {
	                if (data.regions.hasOwnProperty(r)) {
	                    var region = data.regions[r];
	                    $("<option>")
	                        .attr("value", r)
	                        .html(region.name)
	                        .appendTo(sel.region_select);
	                }
	            }
	            sel.region_select.selectpicker("refresh");
	            $(".disabled", sel.div).hide();
	            sel.loaded = true;
	            callback && callback();
            }, error: function(e) {
            	callback && callback();
            	handleError(e);
            }
	    });
	}

	sel.setInvalid = function() {
		if (options.disallowAll) {
			sel.region_select.selectpicker("setStyle", "btn-danger", "add");
		}
	}

	sel.set = function(value) {
		if (!options.disallowAll) {
			value = value || (options.multiple ? ["ALL"] : "ALL");
		}
		val = value;
		loadRegions(function() {
			if (!value) {
				sel.subregion_select.selectpicker("hide");
				return;
			}
			sel.region_select.selectpicker("setStyle", "btn-danger", "remove");
			if (options.multiple) {
				if (value.length > 0 && value[0].length == 5) { // Subregion
					sel.region_select.val([value[0].substring(0,3)]).selectpicker("render");
					loadSubregions(value[0].substring(0,3), function() {
						sel.region_select.val(value).selectpicker("render");
					});
				} else if (value.length == 1 && value[0][0] == "*" && value[0] != "*ALL") {
					sel.region_select.val(value[0].substring(1,4)).selectpicker("render");
					loadSubregions(value[0].substring(1,4), function() {
						sel.subregion_select.val(value).selectpicker("render");
					});
				} else if (value.length == 1 && value[0] != "*ALL" && value[0] != "ALL") {
					sel.region_select.val(value).selectpicker("render");
					loadSubregions(value[0], function() {
						sel.subregion_select.val(value).selectpicker("render");
					});
				} else {
					sel.region_select.val(value).selectpicker("render");
					sel.subregion_select.selectpicker("hide");
				}
			} else {
				if (value.length == 5) { // Subregion
					sel.region_select.val(value.substring(0,3)).selectpicker("render");
					loadSubregions(value.substring(0,3), function() {
						sel.subregion_select.val(value).selectpicker("render");
					});
				} else if (value[0] == "*" && value != "*ALL") {
					sel.region_select.val(value.substring(1,4)).selectpicker("render");
					loadSubregions(value.substring(1,4), function() {
						sel.subregion_select.val(value).selectpicker("render");
					});
				} else if (value != "*ALL" && value != "ALL") {
					sel.region_select.val(value).selectpicker("render");
					loadSubregions(value, function() {
						sel.subregion_select.val(value).selectpicker("render");
					});
				} else {
					sel.region_select.val(value).selectpicker("render");
					sel.subregion_select.selectpicker("hide");
				}
			}
		});
	};

	sel.getName = function() {
		var val = sel.region_select.val();
		if (!val) {
			return "not selected";
		}
		if (options.multiple) {
			if (val.length == 1) {
				if (val[0] === "ALL" || val[0] === "*ALL") {
					return "all regions";
				} else {
					val = sel.subregion_select.val();
					var res = [];
					if (val && val.length == 1 && val[0].length <= 4) {
						$("option:selected", sel.region_select).each(function() { res.push($(this).html()); });
						return res.join(", ");
					} else {
						$("option:selected", sel.subregion_select).each(function() { res.push($(this).html()); });
						return res.join(", ");
					}
				}
			} else {
				var res = [];
				$("option:selected", sel.region_select).each(function() { res.push($(this).html()); });
				return res.join(", ");
			}
		} else {
			if (val === "ALL" || val === "*ALL") {
				return "all regions";
			} else {
				if (val.length <= 4) {
					return $("option:selected", sel.region_select).text();
				} else {
					return $("option:selected", sel.subregion_select).text();
				}
			}
		}
	};

	sel.get = function() {
		/*if (options.multiple) {
			if (sel.region_select.val().length === 1) {
				return sel.subregion_select.val();
			} else {
				return sel.region_select.val();
			}
		} else {
			return sel.subregion_select.val();
		}*/
		return val;
	};

	sel.region_select = $("<select>").appendTo(sel.div);
	if (options.multiple) {
		 sel.region_select.prop("multiple", true);
	}
	sel.region_select.selectpicker({
		liveSearch: true,
		size: 10,
		selectedTextFormat: "count>3",
		width: "120px"
	});
	sel.region_select.on("change", function() {
		sel.region_select.selectpicker("setStyle", "btn-danger", "remove");
		if (options.multiple) {
			if (($(this).val() || []).length == 0) {
				$(this).val(val).selectpicker("render");
				return;
			}
			if ($(this).val().indexOf("ALL") >= 0) {
				if (val.indexOf("ALL") >= 0) {
					val = $(this).val();
					val.splice(val.indexOf("ALL"), 1);
					$(this).val(val).selectpicker("render");
				} else {
					$(this).val(["ALL"]).selectpicker("render");
				}
			} else if ($(this).val().indexOf("*ALL") >= 0) {
				if (val.indexOf("*ALL") >= 0) {
					val = $(this).val();
					val.splice(val.indexOf("*ALL"), 1);
					$(this).val(val).selectpicker("render");
				} else {
					$(this).val(["*ALL"]).selectpicker("render");
				}
			}
			if ($(this).val().length == 1) {
				loadSubregions($(this).val()[0]);
			} else {
				sel.subregion_select.selectpicker("hide");
			}
		} else {
			loadSubregions($(this).val());
		}
		val = $(this).val();
		sel.div.trigger("change_value", [$(this).val()]);
	});

	sel.subregion_select = $("<select>").appendTo(sel.div);
	if (options.multiple) {
		 sel.subregion_select.prop("multiple", true);
		 val = [];
	}
	sel.subregion_select.selectpicker({
		liveSearch: true,
		size: 10,
		selectedTextFormat: "count>3",
		width: "120px"
	});
	sel.subregion_select.on("change", function() {
		if (options.multiple) {
			if (($(this).val() || []).length == 0) {
				$(this).val(val).selectpicker("render");
				return;
			}
			var id = sel.region_select.val()[0];
			if ($(this).val().indexOf(id) >= 0) {
				if (val.indexOf(id) >= 0) {
					val = $(this).val();
					val.splice(val.indexOf(id), 1);
					$(this).val(val).selectpicker("render");
				} else {
					$(this).val([id]).selectpicker("render");
				}
			} else if ($(this).val().indexOf("*"+id) >= 0) {
				if (val.indexOf("*"+id) >= 0) {
					val = $(this).val();
					val.splice(val.indexOf("*"+id), 1);
					$(this).val(val).selectpicker("render");
				} else {
					$(this).val(["*"+id]).selectpicker("render");
				}
			}
		}
		val = $(this).val();
		sel.div.trigger("change_value", [$(this).val()]);
	});

	return sel;
};



var SectorSelect = function(options) {
	var sel = { div: $("<div>") };
	if (options.tooltip) {
	    sel.div.tooltip({
	        container: "body",
	        title: options.tooltip,
	        placement: options.placement
    	});
	}
	var val;

	function loadSubsectors(id) {
        if (!id || id == "ALL" || id == "") {
            sel.subsector_select.val("");
            sel.subsector_select.selectpicker("hide");
        } else {
            var sector = sel.sectors[id];
            if (sector.sub && sector.sub.length > 1) {
                $("option", sel.subsector_select).remove();
	            if (options.disallowAll) {
		            $("<option>")
		                .attr("value", id)
		                .html("Whole sector")
		                .prop("selected", true)
		                .appendTo(sel.subsector_select);
		        } else {
		            $("<option>")
		                .attr("value", id)
		                .html("Whole sector (aggregated)")
		                .prop("selected", true)
		                .appendTo(sel.subsector_select);
		            $("<option>")
		                .attr("value", "*" + id)
		                .html("All subsectors (separated)")
		                .appendTo(sel.subsector_select);
		        }
	            $("<option>")
	                .attr("data-divider", "true")
	                .appendTo(sel.subsector_select);
                sector.sub.forEach(function(s_id) {
                    var s = sel.sectors[s_id];
                    $("<option>")
                        .attr("value", s_id)
                        .html(s.name)
                        .appendTo(sel.subsector_select);
                });
                sel.subsector_select.selectpicker("show");
                sel.subsector_select.selectpicker("refresh");
	            $(".disabled", sel.div).hide();
            } else {
                sel.subsector_select.val(id);
                sel.subsector_select.selectpicker("hide");
            }
        }
    }

	function loadSectors(callback) {
		if (sel.sectors) {
			callback && callback();
			return;
		}
		$.ajax({
	        url: "/sectors",
	        type: "GET",
	        success: function(data) {
	            sel.sectors = data;
	            if (options.disallowAll) {
		            $("<option>")
		                .attr("value", "")
		                .html("Please select")
		                .prop("disabled", true)
		                .prop("selected", true)
		                .appendTo(sel.sector_select);
		        } else {
		            $("<option>")
		                .attr("value", "ALL")
		                .html("All sectors")
		                .prop("selected", true)
		                .appendTo(sel.sector_select);
		            $("<option>")
		                .attr("data-divider", "true")
		                .appendTo(sel.sector_select);
		        }
	            (data.order || []).forEach(function(s) {
	                if (s!="FD") {
	                    var sector = data[s];
	                    $("<option>")
	                        .attr("value", s)
	                        .attr("data-content", "<span class='sectorlabel' style='background-color:" + sector.color + ";'></span>" + sector.name)
	                        .html(sector.name)
	                        .appendTo(sel.sector_select);
	                }
	            });
	            sel.sector_select.selectpicker("refresh");
	            $(".disabled", sel.div).hide();
	            callback && callback();
            }, error: function(e) {
            	callback && callback();
            	handleError(e);
            }
	    });
	}

	sel.setInvalid = function() {
		if (options.disallowAll) {
			sel.sector_select.selectpicker("setStyle", "btn-danger", "add");
		}
	}

	sel.set = function(value) {
		if (!options.disallowAll) {
			value = value || (options.multiple ? ["ALL"] : "ALL");
		}
		val = value;
		loadSectors(function() {
			if (!value) {
				sel.subsector_select.selectpicker("hide");
				return;
			}
			sel.sector_select.selectpicker("setStyle", "btn-danger", "remove");
			if (options.multiple) {
				if (value.length > 0 && value[0].length == 6) { // Subsector
					sel.sector_select.val([value[0].substring(0,4)]).selectpicker("render");
					loadSubsectors(value[0].substring(0,4));
					sel.subsector_select.val(value).selectpicker("render");
				} else if (value.length == 1 && value[0][0] == "*" && value[0] != "*ALL") {
					sel.sector_select.val(value[0].substring(1,5)).selectpicker("render");
					loadSubsectors(value[0].substring(1,5));
					sel.subsector_select.val(value).selectpicker("render");
				} else if (value.length == 1 && value[0] != "*ALL" && value[0] != "ALL") {
					sel.sector_select.val(value).selectpicker("render");
					loadSubsectors(value);
					sel.subsector_select.val(value).selectpicker("render");
				} else {
					sel.sector_select.val(value).selectpicker("render");
					sel.subsector_select.selectpicker("hide");
				}
			} else {
				if (value.length == 6) { // Subsector
					sel.sector_select.val(value.substring(0,4)).selectpicker("render");
					loadSubsectors(value.substring(0,4));
					sel.subsector_select.val(value).selectpicker("render");
				} else if (value[0] == "*" && value!= "*ALL") {
					sel.sector_select.val(value.substring(1,5)).selectpicker("render");
					loadSubsectors(value.substring(1,5));
					sel.subsector_select.val(value).selectpicker("render");
				} else if (value != "*ALL" && value != "ALL") {
					sel.sector_select.val(value).selectpicker("render");
					loadSubsectors(value);
					sel.subsector_select.val(value).selectpicker("render");
				} else {
					sel.sector_select.val(value).selectpicker("render");
					sel.subsector_select.selectpicker("hide");
				}
			}
		});
	};

	sel.getName = function() {
		var val = sel.sector_select.val();
		if (!val) {
			return "not selected";
		}
		if (options.multiple) {
			if (val.length == 1) {
				if (val[0] === "ALL" || val[0] === "*ALL") {
					return "all sectors";
				} else {
					val = sel.subsector_select.val();
					var res = [];
					if (val && val.length == 1 && val[0].length <= 4) {
						$("option:selected", sel.sector_select).each(function() { res.push($(this).html()); });
						return res.join(", ");
					} else {
						$("option:selected", sel.subsector_select).each(function() { res.push($(this).html()); });
						return res.join(", ");
					}
				}
			} else {
				var res = [];
				$("option:selected", sel.sector_select).each(function() { res.push($(this).html()); });
				return res.join(", ");
			}
		} else {
			if (val === "ALL" || val === "*ALL") {
				return "all sectors";
			} else {
				if (val.length <= 4) {
					return $("option:selected", sel.sector_select).text();
				} else {
					return $("option:selected", sel.subsector_select).text();
				}
			}
		}
	};

	sel.get = function() {
		/*if (options.multiple) {
			if (sel.sector_select.val().length === 1) {
				return sel.subsector_select.val();
			} else {
				return sel.sector_select.val();
			}
		} else {
			return sel.subsector_select.val();
		}*/
		return val;
	};

	sel.sector_select = $("<select>").appendTo(sel.div);
	if (options.multiple) {
		 sel.sector_select.prop("multiple", true);
		 val = [];
	}
	sel.sector_select.selectpicker({
		liveSearch: true,
		size: 10,
		selectedTextFormat: "count>3",
		width: "120px"
	});
	sel.sector_select.on("change", function() {
		sel.sector_select.selectpicker("setStyle", "btn-danger", "remove");
		if (options.multiple) {
			if (($(this).val() || []).length == 0) {
				$(this).val(val).selectpicker("render");
				return;
			}
			if ($(this).val().indexOf("ALL") >= 0) {
				if (val.indexOf("ALL") >= 0) {
					val = $(this).val();
					val.splice(val.indexOf("ALL"), 1);
					$(this).val(val).selectpicker("render");
				} else {
					$(this).val(["ALL"]).selectpicker("render");
				}
			} else if ($(this).val().indexOf("*ALL") >= 0) {
				if (val.indexOf("*ALL") >= 0) {
					val = $(this).val();
					val.splice(val.indexOf("*ALL"), 1);
					$(this).val(val).selectpicker("render");
				} else {
					$(this).val(["*ALL"]).selectpicker("render");
				}
			}
			if ($(this).val().length == 1) {
				loadSubsectors($(this).val()[0]);
			} else {
				sel.subsector_select.selectpicker("hide");
			}
		} else {
			loadSubsectors($(this).val());
		}
		val = $(this).val();
		sel.div.trigger("change_value", [$(this).val()]);
	});

	sel.subsector_select = $("<select>").appendTo(sel.div);
	if (options.multiple) {
		 sel.subsector_select.prop("multiple", true);
	}
	sel.subsector_select.selectpicker({
		liveSearch: true,
		size: 10,
		selectedTextFormat: "count>3",
		width: "120px"
	});
	sel.subsector_select.on("change", function() {
		if (options.multiple) {
			if (($(this).val() || []).length == 0) {
				$(this).val(val).selectpicker("render");
				return;
			}
			var id = sel.sector_select.val()[0];
			if ($(this).val().indexOf(id) >= 0) {
				if (val.indexOf(id) >= 0) {
					val = $(this).val();
					val.splice(val.indexOf(id), 1);
					$(this).val(val).selectpicker("render");
				} else {
					$(this).val([id]).selectpicker("render");
				}
			} else if ($(this).val().indexOf("*"+id) >= 0) {
				if (val.indexOf("*"+id) >= 0) {
					val = $(this).val();
					val.splice(val.indexOf("*"+id), 1);
					$(this).val(val).selectpicker("render");
				} else {
					$(this).val(["*"+id]).selectpicker("render");
				}
			}
		}
		val = $(this).val();
		sel.div.trigger("change_value", [$(this).val()]);
	});

	return sel;
};



var YearSelect = function(options) {
	var sel = { div: $("<div>") };
	if (options.tooltip) {
	    sel.div.tooltip({
	        container: "body",
	        title: options.tooltip,
	        placement: options.placement
    	});
	}
	var val;

	sel.setInvalid = function() {
		if (options.disallowAll) {
			sel.year_select.selectpicker("setStyle", "btn-danger", "add");
		}
	}

	sel.set = function(value) {
		val = value;
		sel.year_select.selectpicker("setStyle", "btn-danger", "remove");
		sel.year_select.val(value);
		sel.year_select.selectpicker("render");
	};

	sel.getName = function() {
		if (!val || val.length == 0) {
			return "not selected";
		}
		if (options.multiple) {
			if (val.length == 1
				&& (val[0] === "ALL" || val[0] === "*ALL")) {
				return "1990-2013";
			} else {
				var res = [];
				$("option:selected", sel.year_select).each(function() { res.push($(this).html()); });
				return res.join(", ");
			}
		} else {
			if (val === "ALL" || val === "*ALL") {
				return "1990-2013";
			} else {
				return $("option:selected", sel.year_select).text();
			}
		}
	};

	sel.get = function() {
		return val;
	};

	sel.year_select = $("<select>").appendTo(sel.div);
	if (options.multiple) {
		 sel.year_select.prop("multiple", true);
		 val = [];
	}
	if (options.disallowAll) {
	    $("<option>")
	        .attr("value", "")
	        .html("Please select")
	        .prop("disabled", true)
	        .prop("selected", true)
	        .appendTo(sel.year_select);
	} else {
	    $("<option>")
	        .attr("value", "ALL")
	        .html("All years (1990-2013)")
	        .prop("selected", true)
	        .appendTo(sel.year_select);
	    $("<option>")
	        .attr("data-divider", "true")
	        .appendTo(sel.year_select);
	}
    for (var year = 2013; year >= 1990; year--) {
        $("<option>")
            .attr("value", year)
            .html(year)
            .appendTo(sel.year_select);
    }
	sel.year_select.selectpicker({
		liveSearch: true,
		size: 10,
		selectedTextFormat: "count>3",
		width: "120px"
	});
	sel.year_select.on("change", function() {
		sel.year_select.selectpicker("setStyle", "btn-danger", "remove");
		if (options.multiple) {
			if (($(this).val() || []).length == 0) {
				$(this).val(val).selectpicker("render");
				return;
			}
			if ($(this).val().indexOf("ALL") >= 0) {
				if (val.indexOf("ALL") >= 0) {
					val = $(this).val();
					val.splice(val.indexOf("ALL"), 1);
					$(this).val(val).selectpicker("render");
				} else {
					$(this).val(["ALL"]).selectpicker("render");
				}
			}
		}
		val = $(this).val();
		sel.div.trigger("change_value", [$(this).val()]);
	});

	return sel;
};



var Select = function(values, text, options) {
	var sel = { div: $("<div>") };
	if (options.tooltip) {
	    sel.div.tooltip({
	        container: "body",
	        title: options.tooltip,
	        placement: options.placement
    	});
	}

	sel.setInvalid = function() {
		sel.select.selectpicker("setStyle", "btn-danger", "add");
	}

	sel.set = function(value) {
		sel.select.selectpicker("setStyle", "btn-danger", "remove");
		sel.select.val(value);
		sel.select.selectpicker("render");
	};

	sel.getName = function() {
		if (options.multiple) {
			var res = [];
			$("option:selected", sel.select).each(function() { res.push($(this).html()); });
			return res.join(", ");
		} else {
			$("option:selected", sel.select).html();
		}
	};

	sel.get = function() {
		return sel.select.val();
	};

	sel.select = $("<select>").appendTo(sel.div);
	if (options.multiple) {
		 sel.select.prop("multiple", true);
	}
	text.forEach(function(t, i) {
        $("<option>")
            .attr("value", values[i])
            .html(t)
            .appendTo(sel.select);
    });
	sel.select.selectpicker({
		liveSearch: options.liveSearch || false,
		size: 10,
		selectedTextFormat: "count>3",
		width: "120px"
	});
	sel.select.on("change", function() {
		sel.select.selectpicker("setStyle", "btn-danger", "remove");
		sel.div.trigger("change_value", [$(this).val()]);
	});

	return sel;
};
