/*
 * zeean.net
 * Author: Sven Willner (sven.willner@pik-potsdam.de)
 * [apart from function intersect that is marked as being from a different source]
 *
 */
Map = function(div, options) {
    var world,
        regions;
    var projection,
        zoom,
        path;
    var svg,
        g,
        subg,
        selected,
        subselected,
        countries,
        subcountries;
    var width = $(div).width(),
        height = $(div).height();
    var m0,
        r0;
    var data;
    var type;
    var map = {};
    var arcs,
        arc_scale,
        arc;

    svg = d3.select($(div)[0]).append("svg:svg")
        .attr("width", $(div).width())
        .attr("height", $(div).height());
    var defs = svg.append("svg:defs");
    var clipPath = defs.append("svg:clipPath")
        .attr("id", "clipRect")
        .append("svg:rect")
        .attr("x", 0)
        .attr("y", -height/2)
        .attr("width", width)
        .attr("height", 2*height);
    var hash = defs.append("svg:pattern")
        .attr('id', 'hash')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', '5')
        .attr('height', '5')
        .attr("x", 0).attr("y", 0)
        .append("g").attr("fill", "none").attr("stroke", "#989CA3").attr("stroke-width", 2);
    hash.append("path").attr("d", "M-5,5 l10,-10");
    hash.append("path").attr("d", "M0,10 l10,-10");
    hash.append("path").attr("d", "M5,0 l-5,5");
    g = svg.append("svg:g").attr("clip-path", "url(#clipRect)");
    subg = svg.append("svg:g");
    countries = g.selectAll("path.country");
    subcountries = g.selectAll("path.subcountry");

    var colorBar = {
              stepWidth: 90,
              stepWidthLarge: 110,
              stepHeight: 35,
              x: 20,
              y: height-47
    };
    //colorBar.element = svg.append("svg:g").attr("class", "normallyhidden");

    projection = d3.geo.projection(d3.geo.equirectangular.raw)
        .scale(Math.min(width, 2.4*height) / (2*Math.PI))
        .translate([ width/2, height*1.1/2 ]);
    path = d3.geo.path().projection(projection);

    var copyright;
    if (options && options.showCopyright) {
        (function(pos) {
            copyright = g.append("svg:text")
                .text("zeean")
                .style("font-family", '"Abel", "Helvetica Neue", Helvetica, Arial, sans-serif')
                .style("font-size", "11pt")
                .attr("text-anchor", "middle")
                .attr("dy", "1em")
                .attr("fill", "#888")
                .attr("x", pos[0])
                .attr("y", pos[1]);
        })(projection([128.8, -35.6]));
    }

    zoom = d3.behavior.zoom()
        .scaleExtent([1,10])
        .on("zoom", function() {
            var t = d3.event.translate,
                s = d3.event.scale;
            g.attr("transform", "translate(" + t[0] + "," + t[1] + ") scale(" + s + ")").style("stroke-width", 1 / s + "px");
            $(div).trigger("zoom", [ s ]);
        });
    svg.call(zoom);

    var waitingTimeout;
    map.startWaiting = function() {
        $(div).addClass("waiting");
        clearTimeout(waitingTimeout);
        waitingTimeout = setTimeout(function() {
            $(div).addClass("waitingSpinner");
        }, 800);
    };
    map.stopWaiting = function() {
        clearTimeout(waitingTimeout);
        $(div).removeClass("waitingSpinner");
        $(div).removeClass("waiting");
    };

    function handleError(e) {
        if (window.bootbox) {
            bootbox.alert("Sorry, an error occurred: " + e);
        }
        map.stopWaiting();
    }

    map.startWaiting();
    $.ajax({
        url: "/regions",
        type: "GET",
        success: function(data_) {
            regions = data_.regions;
            $.ajax({
                url: "/geojson",
                type: "GET",
                success: function(data_) {
                    //regions = {};
                    world = data_.features;
                    world.forEach(function (country) {
                        if (!country.geometry) return;
                        var area;
                        var centroid;
                        if (country.geometry.type === "Polygon") {
                            area = d3.geo.area(country.geometry);
                            centroid = d3.geo.centroid(country.geometry);
                        } else if (country.geometry.type === "MultiPolygon") {
                            area = 0;
                            country.geometry.coordinates.forEach(function (polygon) {
                                var polygon_ = {
                                    "type": "Polygon",
                                    "coordinates": polygon
                                };
                                var area_ = d3.geo.area(polygon_);
                                if (area_ > area) {
                                    area = area_;
                                    centroid = d3.geo.centroid(polygon_);
                                }
                            });
                        }
                        country.centroid = centroid;
                        country.area = area;
                        if (!regions[country.id]) {
                            regions[country.id] = {
                                added: true,
                                map_: [],
                                centroid: centroid
                            };
                        }
                        if (!regions[country.id].map_) {
                            regions[country.id].map_ = [];
                        }
                        regions[country.id].map_.push(country);
                        if (!regions[country.id].area || regions[country.id].area < area) {
                            regions[country.id].centroid = centroid;
                        }
                    });
                    countries = countries.data(world);
                    countries.exit().remove();
                    countries = countries
                        .enter()
                        .append("svg:path")
                        .attr("class", "country")
                        .attr("d", path)
                        .attr("stroke", "#FFFFFF")
                        .attr("fill", "#989CA3");

                    countries
                        .attr("class", "country hoverable")
                        .on('mouseover', function(d) {
                            $(div).trigger("country_hover", [d, selected]);
                        })
                        .on('mouseout', function(d) {
                            $(div).trigger("country_hover", [null, selected]);
                        });
                    countries.on('click', function(d) {
                        $(div).trigger("country_click", [d, selected]);
                        selected = d;
                        g.selectAll("path").classed("selected", selected && function(d) { return d === selected; });
                    });
                    map.stopWaiting();
                },
                error: handleError
            });
        },
        error: handleError
    });

    map.resize = function() {
        width = $(div).width();
        height = $(div).height();
        projection
            .scale(Math.min(width, 2.4*height) / (2*Math.PI))
            .translate([ width/2, height*1.1/2 ]);
        countries.attr("d", path);
        subcountries.attr("d", path);
        clipPath
            .attr("y", -height/2)
            .attr("width", width)
            .attr("height", 2*height);
        svg.attr("width", width);
        svg.attr("height", height);
        if (arcs) {
            map.setData(data);
        }
        if (copyright) {
            (function(pos) {
                copyright
                    .attr("x", pos[0])
                    .attr("y", pos[1]);
            })(projection([128.8, -35.6]));
        }
    }

    var resize_timeout;
    $(window).on("resize", function(e, a) {
        clearTimeout(resize_timeout);
        resize_timeout = setTimeout(function() {
            map.resize();
        }, 200);
    });

    var sky = d3.geo.projection(d3.geo.azimuthalEquidistant.raw)
        .scale(Math.min(width, 2.4*height) / (2*Math.PI))
        .translate([ width/2, height*1.1/2 ]);

    function location_along_arc(start, end, loc) {
        var interpolator = d3.geo.interpolate(start,end);
        return interpolator(loc)
    }

    var π = Math.PI,
    radians = π / 180,
    ε = 1e-6;

function intersect(a, b) {
  // This function is taken from http://www.jasondavies.com/maps/intersect/
  var λ0 = a[0][0],
      λ1 = a[1][0],
      λ2 = b[0][0],
      λ3 = b[1][0],
      δλ0 = λ1 - λ0,
      δλ1 = λ3 - λ2,
      aδλ0 = Math.abs(δλ0),
      aδλ1 = Math.abs(δλ1),
      sλ0 = aδλ0 > 180,
      sλ1 = aδλ1 > 180,
      φ0 = a[0][1] * radians,
      φ1 = a[1][1] * radians,
      φ2 = b[0][1] * radians,
      φ3 = b[1][1] * radians,
      t;

  // Ensure λ0 ≤ λ1 and λ2 ≤ λ3.
  if (δλ0 < 0) t = λ0, λ0 = λ1, λ1 = t, t = φ0, φ0 = φ1, φ1 = t;
  if (δλ1 < 0) t = λ2, λ2 = λ3, λ3 = t, t = φ2, φ2 = φ3, φ3 = t;

  // Check if longitude ranges overlap.
  // TODO handle antimeridian crossings.
  if (!sλ0 && !sλ1 && (λ0 > λ3 || λ2 > λ1)) return;

  // Check for polar endpoints.
  if (Math.abs(Math.abs(φ0) - π / 2) < ε) λ0 = λ1, aδλ0 = δλ0 = 0, sλ0 = false;
  if (Math.abs(Math.abs(φ1) - π / 2) < ε) λ1 = λ0, aδλ0 = δλ0 = 0, sλ0 = false;
  if (Math.abs(Math.abs(φ2) - π / 2) < ε) λ2 = λ3, aδλ1 = δλ1 = 0, sλ1 = false;
  if (Math.abs(Math.abs(φ3) - π / 2) < ε) λ3 = λ2, aδλ1 = δλ1 = 0, sλ1 = false;

  // Check for arcs along meridians.
  var m0 = aδλ0 < ε || Math.abs(aδλ0 - 180) < ε,
      m1 = aδλ1 < ε || Math.abs(aδλ1 - 180) < ε;

  λ0 *= radians, λ1 *= radians, λ2 *= radians, λ3 *= radians;

  // Intersect two great circles and check the two intersection points against
  // the longitude ranges.  The intersection points are simply the cross
  // product of the great-circle normals ±n1⨯n2.

  // First plane.
  var cosφ,
      x0 = (cosφ = Math.cos(φ0)) * Math.cos(λ0),
      y0 = cosφ * Math.sin(λ0),
      z0 = Math.sin(φ0),
      x1 = (cosφ = Math.cos(φ1)) * Math.cos(λ1),
      y1 = cosφ * Math.sin(λ1),
      z1 = Math.sin(φ1),
      n0x = y0 * z1 - z0 * y1,
      n0y = z0 * x1 - x0 * z1,
      n0z = x0 * y1 - y0 * x1,
      m = length(n0x, n0y, n0z);

  n0x /= m, n0y /= m, n0z /= m;

  // Second plane.
  var x2 = (cosφ = Math.cos(φ2)) * Math.cos(λ2),
      y2 = cosφ * Math.sin(λ2),
      z2 = Math.sin(φ2),
      x3 = (cosφ = Math.cos(φ3)) * Math.cos(λ3),
      y3 = cosφ * Math.sin(λ3),
      z3 = Math.sin(φ3),
      n1x = y2 * z3 - z2 * y3,
      n1y = z2 * x3 - x2 * z3,
      n1z = x2 * y3 - y2 * x3,
      m = length(n1x, n1y, n1z);

  n1x /= m, n1y /= m, n1z /= m;

  var Nx = n0y * n1z - n0z * n1y,
      Ny = n0z * n1x - n0x * n1z,
      Nz = n0x * n1y - n0y * n1x;

  if (length(Nx, Ny, Nz) < ε) return;

  var λ = Math.atan2(Ny, Nx);
  if ((sλ0 ^ (λ0 <= λ && λ <= λ1) || m0 && Math.abs(λ - λ0) < ε) && (sλ1 ^ (λ2 <= λ && λ <= λ3) || m1 && Math.abs(λ - λ2) < ε) || (Nz = -Nz,
      (sλ0 ^ (λ0 <= (λ = (λ + 2 * π) % (2 * π) - π) && λ <= λ1) || m0 && Math.abs(λ - λ0) < ε) && (sλ1 ^ (λ2 <= λ && λ <= λ3) || m1 && Math.abs(λ - λ2) < ε))) {
    var φ = Math.asin(Nz / length(Nx, Ny, Nz));
    if (m0 || m1) {
      if (m1) φ0 = φ2, φ1 = φ3, λ0 = λ2, λ1 = λ3, aδλ0 = aδλ1;
      if (aδλ0 > ε) return φ0 + φ1 > 0 ^ φ < (Math.abs(λ - λ0) < ε ? φ0 : φ1) ? [λ / radians, φ / radians] : null;
      // Ensure φ0 ≤ φ1.
      if (φ1 < φ0) t = φ0, φ0 = φ1, φ1 = t;
      return Math.abs(λ - (m0 ? λ0 : λ2)) < ε && φ0 <= φ && φ <= φ1 ? [λ / radians, φ / radians] : null;
    }
    return [λ / radians, φ / radians];
  }
}

    function length(x, y, z) {
      return Math.sqrt(x * x + y * y + z * z);
    }

    function createArcPoints(d) {
        if (regions[d.region_from] && regions[d.region_to]) {
            var source = (regions[d.region_from] && regions[d.region_to] ? regions[d.region_from].centroid : []) || [],
                target = (regions[d.region_from] && regions[d.region_to] ? regions[d.region_to].centroid : []) || [];
            var mid = intersect([source, target], [[(target[0] + source[0]) / 2, -91], [(target[0] + source[0]) / 2, 91]]);
            var t = projection(source),
                s = projection(target);
            if (!mid) {
                mid = intersect([source, target], [[(target[0] + source[0]) / 2 - 180, -91], [(target[0] + source[0]) / 2 - 180, 91]]);
                if (!mid) return [[]];
                var m = projection(mid);
                if (s[0] < t[0]) {
                    if (m[0] < s[0]) {
                        return [
                            [ s, m, [ t[0] - width, t[1] ] ],
                            [ [ s[0] + width, s[1] ], [ m[0] + width, m[1] ], t ]
                        ];
                    } else {
                        return [
                            [ s, [ m[0] - width, m[1] ], [ t[0] - width, t[1] ] ],
                            [ [ s[0] + width, s[1] ], m, t ]
                        ];
                    }
                } else {
                    if (m[0] > s[0]) {
                        return [
                            [ s, m, [ t[0] + width, t[1] ] ],
                            [ [ s[0] - width, s[1] ], [ m[0] - width, m[1] ], t ]
                        ];
                    } else {
                        return [
                            [ s, [ m[0] + width, m[1] ], [ t[0] + width, t[1] ] ],
                            [ [ s[0] - width, s[1] ], m, t ]
                        ];
                    }
                }

            } else {
                var result = [projection(target),
                     projection(mid),
                     projection(source)]
                return [result];
            }
        } else {
            return [[]];
        }
    }

    var curve = d3.svg.line()
        .interpolate("cardinal")
        .tension(.2);

    function perp(p1, p2) {
        var res = [
            p2[1] - p1[1],
            p1[0] - p2[0]
        ];
        var l = Math.sqrt(res[0] * res[0] + res[1] * res[1]) || 1;
        res[0] /= l;
        res[1] /= l;
        return res;
    }

    function mult(p, s) {
        return [p[0] * s, p[1] * s];
    }

    function add(p1, p2) {
        return [p1[0] + p2[0], p1[1] + p2[1]];
    }

    function sub(p1, p2) {
        return [p1[0] - p2[0], p1[1] - p2[1]];
    }

    var createArc = function (p, s) {
        if (p.length != 3) return "";
        var perp1 = mult(perp(p[0], p[2]), s / 4);
        var perp2 = mult(perp(p[0], p[1]), s / 2);
        var first = sub(p[0], perp2);
        return curve([
            first,
            sub(p[1], perp1),
            p[2]
        ]) + curve([
            p[2],
            add(p[1], perp1),
            add(p[0], perp2)
        ]).replace("M", "L") + "A" + [s / 2, s / 2].join(",") + " 0 1,0 " + first.join(",");
    };

    var format_ = d3.format("n"),
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
    };

    var createArcGroup = function (el, d, s) {
        createArcPoints(d).forEach(function (a) {
            var t = el.append("svg:path")
                .attr("fill", "#A64138")
                .attr("stroke", "#FFF")
                .attr("stroke-width", 0.3)
                .attr("opacity", 0)
                .attr("d", createArc(a, s))
                .transition().duration(500)
                .attr("opacity", 1);
            $(t[0]).tooltip({
                container: "body",
                placement: "pointer",
                title: "Flow from " + d.region_from + " to " + d.region_to + ": " + formatFlow(d.value)
            });
        });
    };

    map.setData = function(data_) {
        data = data_;
        if (!world || !regions) {
            return;
        }
        data.forEach(function(data) {

            if (colorBar.element) {
                colorBar.element.remove();
            }
            colorBar.element = svg.append("svg:g").attr("class", "normallyhidden");

            var typename = data.type;
            if (data.type=="nap") {
                typename="global adaptive pressure";
                if (data.order==="1") {
                    typename+=" (1st order)";
                } else if (data.order==="1") {
                    typename+=" (2nd order)";
                }
                //typename+=" (order "+data.order+")";
                ordername=data.order;
            } else if (data.type=="betweenness"){
                typename="betweeness centrality";
            } else if (data.type=="flow_centrality"){
                typename="flow centrality";
            } else if (data.type=="flows"){
                typename=data.number+" largest flows ";
                if (data.sector!="ALL") {
                    typename+="of "+data.sector
                }
                 if (data.region==="ALL") {
                     typename+=" worldwide";
                 } else {
                     typename+=" to and from "+data.region
                 }
            }
            var printname=typename+" in "+data.year;
            if (data.type==="nap") {
                printname+=" in "+data.region;
            }

            switch (data.dim) {
                case 1:
                    if (arcs) {
                        arcs.transition().duration(500).attr("opacity", 0).remove();
                    }
                    for (r in regions) {
                        if (regions.hasOwnProperty(r)) {
                            if (regions[r].map_) {
                                regions[r].map_.forEach(function(c) {
                                    c.value = data.default0 ? 0 : undefined;
                                });
                            }
                        }
                    }
                    data.forEach(function(d) {
                        if (regions[d.region] && regions[d.region].map_) {
                            regions[d.region].map_.forEach(function(c) {
                                c.value = d.value;
                            });
                        }
                    });
                    countries.transition().duration(500).attr("fill", function(d) {
                         return typeof(d.value)==="undefined" ? "url(#hash)" : data.scale(d.value);
                    });
                     //just for the printed legend
                    var format = function(v) {
                               if (v > 1e-5) {
                                   v = Math.round(v*1e5)/1e5;
                               }
                               return format_(v);
                    };

                    if (data.type=="nap") {
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
                    var count = 0;
                    for (var i = min; i <= max; i+=step) {
                        var value = ticks[Math.floor(i)];
                        if (value!="") {
                            colorBar.element.append("svg:rect")
                                .attr("x", count*(colorBar.stepWidth) + colorBar.x)
                                .attr("y", colorBar.y)
                                .attr("width", colorBar.stepWidth)
                                .attr("height", colorBar.stepHeight)
                                .attr("stroke-width", "0")
                                .attr("style", "stroke:#999;stroke-linecap: round;fill:" + data.scale(value) + ";");
                            colorBar.element.append("svg:text")
                                .attr("x", count*(colorBar.stepWidth) + colorBar.stepWidth/2 + colorBar.x)
                                .attr("y", colorBar.stepHeight*0.5 + colorBar.y + 5)
                                .attr("dy", "0em")
                                .attr("style", "text-anchor:middle;font-family:\"Abel, 'Helvetica Neue', Helvetica, Arial, sans-serif\";font-size:13px;fill:#333;")
                                .text("" + format(value));
                            count+=1;
                        }
                    }
                   colorBar.element.append("svg:text")
                       .attr("x", 7.5*(colorBar.stepWidth) + colorBar.stepWidth/2 + colorBar.x)
                       .attr("y", colorBar.stepHeight*0.5 + colorBar.y)
                       .attr("dy", "0em")
                       //.attr("style", "text-anchor:middle;font-family:\"Gillius ADF\";font-size:70px;fill:#999;")
                       .attr("style", "text-anchor:middle;font-family:\"Abel, 'Helvetica Neue', Helvetica, Arial, sans-serif\";font-size:15px;fill:#333;")
                       .text("" + printname)
                    break;
                case 2:
                    countries.transition().duration(500).attr("fill", "#989CA3");
                    arcs = g.selectAll(".arc")
                        .data(data);
                    arcs.each(function(d) {
                            var el = d3.select(this);
                            el.selectAll("path").transition().duration(500).attr("opacity", 0).remove();
                            createArcGroup(el, d, data.scale(d.value));
                        });
                    arcs.enter()
                        .append("svg:g")
                        .attr("class", "arc")
                        .each(function(d) {
                            createArcGroup(d3.select(this), d, data.scale(d.value));
                        });
                    arcs.exit()
                        .attr("opacity", 1)
                        .transition().duration(500)
                        .attr("opacity", 0)
                        .remove();

                    var min = 0;
                    var ticks = data.scale.ticks();
                    var max = ticks.length - 1;
                    var step = max / 5;
                    var count = 0;
                    for (var i = min; i <= max; i+=step) {
                        var value = ticks[Math.floor(i)];
                        if (value!="") {
                            colorBar.element.append("svg:rect")
                                .attr("x", count*colorBar.stepWidthLarge + colorBar.x)
                                .attr("y", colorBar.y)
                                .attr("width", colorBar.stepWidthLarge)
                                .attr("height", colorBar.stepHeight)
                                .attr("stroke-width", "0.5")
                                .attr("style", "stroke:#999;stroke-linecap: round;fill: #fff ;");
                            colorBar.element.append("svg:text")
                                .attr("x", count*colorBar.stepWidthLarge + 30 + colorBar.x)
                                .attr("y", colorBar.stepHeight*0.5 + colorBar.y + 5)
                                .attr("dy", "0em")
                                  .attr("style", "text-anchor:start;font-family:\"Abel, 'Helvetica Neue', Helvetica, Arial, sans-serif\";font-size:13px;fill:#333;")
                                  .text("" + formatFlow(value));
                              var s = data.scale(value);
                              colorBar.element.append("svg:path")
                                  .attr("d", "M"
                                        + (count*colorBar.stepWidthLarge + 5 + colorBar.x)
                                        + "," + (colorBar.y + colorBar.stepHeight/2)
                                        + " l15," + (-s/2) + " a" + [s/2,s/2].join(",") + " 0 1,1 0," + (s) + "Z")
                                  .attr("stroke-width", "0")
                                  .attr("fill", "#A64138");
                               count+=1;
                        }
                    }
                    colorBar.element.append("svg:text")
                        .attr("x", 7.5*(colorBar.stepWidth*1.18) + colorBar.stepWidth/2 + colorBar.x)
                        .attr("y", colorBar.stepHeight*0.5 + colorBar.y + 6)
                        .attr("dy", "0em")
                        //.attr("style", "text-anchor:middle;font-family:\"Gillius ADF\";font-size:70px;fill:#999;")
                        .attr("style", "text-anchor:middle;font-family:\"Abel, 'Helvetica Neue', Helvetica, Arial, sans-serif\";font-size:15px;fill:#333;")
                        .text("" + printname);
                    break;
                default:
                    if (arcs) {
                        arcs.transition().duration(500).attr("opacity", 0).remove();
                    }
                    countries.transition().duration(500).attr("fill", "#989CA3");
                    break;
            }
        });
    };

    map.getSVG = function() {
       return svg;
    };

    map.zoom = function(s) {
        var t_ = zoom.translate(),
            t = [0,0],
            s_ = zoom.scale();
        t[0] = width / 2 - (width / 2 - t_[0]) / s_ * s;
        t[1] = height / 2 - (height / 2 - t_[1]) / s_ * s;
        zoom.scale(s);
        zoom.translate(t);
        g.transition().duration(800).attr("transform", "translate(" + t[0] + "," + t[1] + ") scale(" + s + ")").style("stroke-width", 1 / s + "px");
    };

    map.zoomCenter = function(callback) {
        zoom.scale(1);
        zoom.translate([0,0]);
        g.transition().duration(800).attr("transform", "").style("stroke-width", "1px").each("end", callback);
    };

    map.selectCountryPath = function(d) {
        selected = d;
        g.selectAll("path").classed("selected", selected && function(d) { return d === selected; });
    };

    map.selectCountry = function(id) {
        if (id) {
            var d = g.selectAll("path")
                .filter(function(d) { return d.id == id; });
            if (d.size() > 0) {
                map.selectCountryPath(d.datum());
            } else {
                map.selectCountryPath(null);
            }
        } else {
            map.selectCountryPath(null);
        }
    }

    map.zoomPath = function(d, callback) {
        var x, y, s, t = [0,0];
        var centroid = path.centroid(d);
        var bounds = path.bounds(d);
        s = Math.min(10, width / (2*Math.PI) / Math.min(Math.abs(bounds[0][0] - bounds[1][0]), Math.abs(bounds[0][1] - bounds[1][1])));
        t[0] = width/2 - centroid[0]*s;
        t[1] = height/2 - centroid[1]*s;
        zoom.scale(s);
        zoom.translate(t);
        g.transition()
            .duration(800)
            .attr("transform", "translate(" + t[0] + "," + t[1] + ") scale(" + s + ")")
            .style("stroke-width", 1 / s + "px")
            .each("end", callback);
        $(div).trigger("zoom", [ s ]);
    };

    map.zoomCountry = function(id, callback) {
        if (regions[id] && (!regions[id].map_ || regions[id].map_.length == 0)) {
            var x, y, s, t = [0,0];
            var centroid = projection(regions[id].centroid);
            s = 10;
            t[0] = width/2 - centroid[0]*s;
            t[1] = height/2 - centroid[1]*s;
            zoom.scale(s);
            zoom.translate(t);
            g.transition()
                .duration(800)
                .attr("transform", "translate(" + t[0] + "," + t[1] + ") scale(" + s + ")")
                .style("stroke-width", 1 / s + "px")
                .each("end", callback);
            $(div).trigger("zoom", [ s ]);
        } else {
            var d = g.selectAll("path")
                .filter(function(d) { return d.id == id; });
            if (d.size() > 0) {
                map.zoomPath(d.datum(), callback);
            }
        }
    };

    map.showSubregions = function(id, callback) {
        if (id) {
            map.startWaiting();
            $.ajax({
                url: "/geojson",
                data: { country: id },
                type: "GET",
                success: function(data_) {
                    g.selectAll("path.subcountry").remove();
                    if (!data_.error) {
                        g.selectAll("path.regionalized")
                            .transition()
                            .duration(800)
                            .attr("fill", function(d) {
                                var tmp = d.last_fill;
                                d.last_fill = undefined;
                                return tmp;
                            })
                            .attr("stroke-width", "0")
                            .each("end", function(d) {
                                d3.select(this).attr("stroke-width", "")
                                    .classed("regionalized", false);
                            });

                        g.selectAll("path")
                            .filter(function(d) { return d.id == id; })
                            .each(function(d) {
                                d.last_fill = d3.select(this).attr("fill");
                                this.parentNode.appendChild(this);
                            })
                            //.attr("fill", "#989CA3")
                            .attr("stroke-width", "0")
                            .classed("regionalized", true)
                            .transition()
                            .duration(800)
                            .attr("fill", "#303947")
                            .attr("stroke-width", "4");

                        subcountries = g.selectAll("path.subcountry").data(data_.features);
                        subcountries.exit().remove();
                        subcountries = subcountries
                            .enter()
                            .append("svg:path")
                            .attr("class", "subcountry hoverable")
                            .attr("d", path)
                            .attr("fill", "white")
                            .on('mouseover', function(d) {
                                $(div).trigger("subcountry_hover", [d, subselected]);
                            })
                            .on('mouseout', function(d) {
                                $(div).trigger("subcountry_hover", [null, subselected]);
                            })
                            .on('click', function(d) {
                                $(div).trigger("subcountry_click", [d, subselected]);
                                subselected = d;
                                g.selectAll("path.subcountry").classed("selected", subselected && function(d) { return d === subselected; });
                            });

                        subcountries
                            .transition()
                            .duration(800)
                            .attr("fill", "#989CA3");

                        if (callback) {
                            callback(data_.features);
                        }
                    } else {
                        if (callback) {
                            callback();
                        }
                    }
                    map.stopWaiting();
                },
                error: handleError
            });
        } else {
            g.selectAll("path.subcountry").remove();
            g.selectAll("path.regionalized")
                .transition()
                .duration(800)
                .attr("fill", "#989CA3")
                .attr("stroke-width", "0")
                .each("end", function(d) {
                    d3.select(this).attr("stroke-width", "")
                        .classed("regionalized", false);
                });
        }
    };

    return map;
};
