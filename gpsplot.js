/*
 * Copyright (C) 2015  Michael Nagel <michael.nagel@devzero.de>
 * Copyright (C) 2015  Fabian Knittel <fabian.knittel@lettink.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var options = {
  'useLightbox': true,
};

$("#expandable").hover(
  function() {
   $(this).stop().animate({"height":"300px"}, 200).addClass("dropped");
  },
  function() {
    $(this).stop().animate({"height":"20px"}, 200).removeClass("dropped");
  }
);

var THUMBSIZE = 160;

var baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '<a href="https://github.com/mnagel/gpsplot">GPSplot: "Your pictures and their origin."</a> | ' +
  '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  + ' | Photography © <a href="http://rabich.de">Dietmar Rabich</a> <a href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA</a>'
});

var cfg = {
  // radius should be small ONLY if scaleRadius is true (or small radius is intended)
  // if scaleRadius is false it will be the constant radius used in pixels
  "radius": 30,
  "maxOpacity": 0.7,
  // scales the radius based on map zoom
  "scaleRadius": false,
  // if set to false the heatmap uses the global maximum for colorization
  // if activated: uses the data maximum within the current map boundaries
  //   (there will always be a red spot with useLocalExtremas true)
  "useLocalExtrema": true,
  // which field name in your data represents the latitude - default "lat"
  latField: 'lat',
  // which field name in your data represents the longitude - default "lng"
  //lngField: 'lng',
  lngField: 'lon',
  // which field name in your data represents the data value - default "value"
  valueField: null
};

// TODO: Fix heatmap misalignment when zooming out too far
// https://github.com/pa7/heatmap.js/issues/145
var heatmapLayer = new HeatmapOverlay(cfg);

var map = new L.Map('map', {
  center: [50.50, 10],
  zoom: 7,
  // heatmapLayer needs to be included here to make the overlay work
  // This seems to be a bug as errors occur when you try to add heatmapLayer dynamically:
  // "leaflet-heatmap.js:125 Uncaught TypeError: Cannot read property 'setData' of undefined"
  layers: [baseLayer, heatmapLayer]
});

// See comment above
map.removeLayer(heatmapLayer);

// Map layers can be added, too but since we have one at the moment it does not make sense yet
L.control.layers({/*"Map": baseLayer*/}, {"Heatmap": heatmapLayer}).addTo(map);
L.control.scale({maxWidth: 400}).addTo(map);

function scaleIntoBox(x, y, boxsize) {
  var scale = boxsize / Math.max(x, y);
  scale = Math.min(scale, 1); // dont go > 1 (dont enlarge)
  return [x*scale, y*scale];
}

// this method is called when right-clicking a thumbnail and exists for q&d debugging purposes...
var global_allpins = "not_yet_debugging";
function gpsplot_debug_thumbnail(pindex) {
    console.log(global_allpins[pindex]);
    return false; // do not show real popup
}

function http_get(url)
{
    var req = new XMLHttpRequest();
    // false for synchronous request
    req.open("GET", url, false);
    req.send(null);
    return req.responseText;
}

function reverse_geocode(latlon) {
    var req = ` http://nominatim.openstreetmap.org/reverse?format=json&lat=${latlon.lat}&lon=${latlon.lng}&zoom=18&addressdetails=1`
    return http_get(req);
}

function gpsplot_debug_map(leafletevent) {
    console.log("reverse geocoding is disabled");
    return false;
        
    var geocode = reverse_geocode(leafletevent.latlng);
    geocode = JSON.parse(geocode)
    console.log(geocode);

    var strink = `
<pre>
{
  "gps" : {
    "lat" : ${leafletevent.latlng.lat},
    "lon" : ${leafletevent.latlng.lng},
    "name": "${geocode.display_name}"
  }
}
</pre>
    `

    var popup = L.popup();
    popup.setLatLng(leafletevent.latlng).setContent(strink).openOn(map);
    return;
}

global_trailstring = "";
global_traillatlon = "";
global_traildate = new Date();

function addToTrail() {
    global_trailstring = global_trailstring + 'new TrailElement(new Date("' + $('#date_jit').val() + ':00"), ' +
        global_traillatlon.lat + ', ' + global_traillatlon.lng + ', "' + $('#date_cmt').val() + '"), <br/>';
    $('#trailresult').html (global_trailstring);
    global_traildate = $('#date_jit').val();
}


function gpsplot_debug_map_trail(leafletevent) {
    var control = document.createElement("div");
    control.innerHTML = `
        <h2>Create Your Own Trail</h2>
        <input type="text" id="date_jit" value="">
        <input type="button" id="btn_generate" value="Pick A Date">
        <input type="text" id="date_cmt" value="no comment">
        <h1><button onclick="addToTrail()">Add To Trail</button></h1>
        Your Trail is:
        <br />
        <div id="trailresult"></div>
    `

    var popup = L.popup();
    global_traillatlon = leafletevent.latlng;
    popup.setLatLng(leafletevent.latlng).setContent(control).openOn(map);

    $('#btn_generate').click(function(){
        $('#date_jit').appendDtpicker({
            "onInit": function(handler){
                handler.setDate(global_traildate);
                handler.show();
            },
            "onHide": function(handler){
                global_traildate = handler.getDate();
                handler.destroy();
            },
            "dateFormat": "yyyy-MM-DDThh:mm",
            "current": global_traildate
        });
    });
}

function Thumbnail(height, width, url, caption, pindex) {
  this.height = height;
  this.width = width;
  this.url = url;
  this.caption = caption;

  this.createElement = function() {
    var box = document.createElement("div");
    // inject some code to aide debugging
    box.setAttribute('oncontextmenu', "javascript:return gpsplot_debug_thumbnail(" + pindex +");");
    box.setAttribute('style',
         'width: ' + THUMBSIZE + 'px;'
      + ' height: ' + THUMBSIZE + 'px;'
      + ' position: relative;'
      + ' display: inline-block;'
      + ' margin: 3px;'
      + ' background-image: url("data/assets/loading.png");'
      + ' background-repeat: no-repeat;'
      + ' background-position: center;'
    );
    var thumbnail = document.createElement("img");
    box.appendChild(thumbnail);
    var sizes = scaleIntoBox(this.height, this.width, THUMBSIZE);
    thumbnail.setAttribute('src', this.url);
    thumbnail.setAttribute('class', 'noselect');
    thumbnail.setAttribute('style',
         'max-height: 100%;'
      + ' max-width: 100%;'
      + ' width: auto;'
      + ' height: auto;'
      + ' position: absolute;'
      + ' top: 0;'
      + ' bottom: 0;'
      + ' left: 0;'
      + ' right: 0;'
      + ' margin: auto;'
    );
    var caption = document.createElement("span");
    box.appendChild(caption);
    caption.innerHTML = this.caption;
    caption.setAttribute('style',
         'position: absolute;'
      + ' bottom: 0;'
      + ' left: 0;'
      + ' right: 0;'
      + ' text-align: center;'
      + ' color: white;'
      + ' background: rgba(0,0,0,0.4);'
    );
    return box;
  }
}

function Pin(lat, lon, aux, pindex) {
  this.lat = lat;
  this.lon = lon;
  this.tag = "";
  this.date = aux.date;
  this.comment = aux.comment;
  this.url = aux.url;
  this.rotation = aux.exifrotation;
  this.thumbnail = aux.thumbnail;
  this.dotfileinfo = aux.dotfileinfo;
  this.pindex = pindex;
}

function compareMarkers(a, b) {
  // TODO check consistency for both undefined
  if (a.pin.date == b.pin.date) {
    return 0;
  }
  if (!a.pin.date) {
    return 1;
  }
  if (!a.pin.date) {
    return -1;
  }
  return (a.pin.date > b.pin.date) ? 1 : -1;
}

function onClusterClick(e) {
  var markers;
  // TODO find a better way to handle these cases uniformly
  if (e.type === "clusterclick") {
    markers = e.layer.getAllChildMarkers();
  }
  else if (e.type === "click") {
    markers = [ e.target ];
  }
  else {
    console.log("clicked on an unrecognized entity");
    return;
  }
  console.log("handling click on " + e.type + " " + e);
  markers = markers.sort(compareMarkers);

  var box = document.createElement('div');

  markers.forEach(function(marker){
    var link = document.createElement('a');
    link.setAttribute('href', marker.pin.url);
    link.setAttribute('target', '_blank');
    if (options.useLightbox) {
      link.setAttribute('data-lightbox', 'any_group_name');
    }
    link.setAttribute('data-title',
      '<a href="' + marker.pin.url + '" target="_blank">'
      + get_thumbnail_caption(marker.pin)
      + " " + marker.pin.url
      + " " + marker.pin.comment
      + '</a>'
    );
    link.setAttribute('data-rotation', marker.pin.rotation);
    if (marker.pin.thumbnail) {
      link.appendChild(marker.pin.thumbnail.createElement());
    } else {
      link.innerHTML = '<div>' + get_thumbnail_caption(marker.pin) + ': ' + marker.pin.comment + '</div>';
    }
    box.appendChild(link);
  });

  // TODO find a better way to handle these cases uniformly
  if (e.type === "clusterclick") {
    e.layer.bindPopup(box, {maxWidth: 520, maxHeight: 400}).openPopup();
  }
  else if (e.type === "click") {
    console.log("opening single image popup");
    // TODO why is this very strange construct necessary?
    if (!e.target.hasPopup) {
      e.target.bindPopup(box, {maxWidth: 520, maxHeight: 400}).openPopup();
    }
    e.target.hasPopup = true;
  }
}

// TODO use everywhere
function safeDateFormat(date) {
  if (date) {
    return date.format('Y-m-d H:i:s');
  }
  return 'unknown date';
}

function plotToLayer(what, layer) {
  var marker = L.marker([what.lat, what.lon]);
  marker.pin = what;
  marker.on('click', onClusterClick);
  layer.addLayer(marker);
  return marker;
}

var heuristic_last_good_lat = 0;
var heuristic_last_good_lon = 0;

function TrailElement(ts, lat, lon, comment) {
    this.ts = ts;
    this.lat = lat;
    this.lon = lon;
    this.comment = comment;
}

function heuristic_gps_magic(dto, pin, trail) {
    if (dto.gps) {
        console.log("using real gps data");
        pin.tag += " EMBEDDED GPS";
        pin.lat = dto.gps.lat;
        pin.lon = dto.gps.lon;
        heuristic_last_good_lat = pin.lat;
        heuristic_last_good_lon = pin.lon;
    }
    else if (dto.dotfileinfo && dto.dotfileinfo.gps) {
        console.log("using dotfile gps data");
        pin.tag += " DOTFILE GPS";
        pin.lat = dto.dotfileinfo.gps.lat;
        pin.lon = dto.dotfileinfo.gps.lon;
        heuristic_last_good_lat = pin.lat;
        heuristic_last_good_lon = pin.lon;
    }
    else if (typeof pin.date === "undefined") {
        // place pictures with no usable timestamp in the ocean
        console.log("using hardcoded fallback");
        pin.lat = 0;
        pin.lon = 65;
    }
    else if (trail.length > 0) {
        console.log("using time correlated gps data");
        var arrayLength = trail.length;
        var bestTrailElement = trail[0];
        // TODO: this is basically len(trail)*len(pins) and could possibly benefit from sorting or other optimization
        for (var i = 0; i < arrayLength; i++) {
            if (trail[i].ts > pin.date) {
                break;
            }
            else {
                bestTrailElement = trail[i];
            }
        }
        pin.tag += " TRAIL-HEURISTIC GPS based on Trail " + bestTrailElement.comment + " at " + safeDateFormat(bestTrailElement.ts);
        // prevent clusters from being inseparable
        var clusterfuzzer = pin.pindex/5000000;
        clusterfuzzer = 0;
        pin.lat = bestTrailElement.lat + clusterfuzzer;
        pin.lon = bestTrailElement.lon + clusterfuzzer;
        heuristic_last_good_lat = pin.lat;
        heuristic_last_good_lon = pin.lon;
    }
    else {
        console.log("using previous gps data");
        pin.tag += " REPEATER-HEURISTIC GPS";
        pin.lat = heuristic_last_good_lat;
        pin.lon = heuristic_last_good_lon;
    }
}

function tag_to_icon(tag) {
    if (/.*EMBEDDED.*/.test(tag)) {
        return '&#x2600;';
    }
    if (/.*DOTFILE.*/.test(tag)) {
        return '&#x270e;';
    }

    return '&#x2718;';
}

function get_thumbnail_caption(pin) {
    return tag_to_icon(pin.tag) + ' ' + (pin.date ? safeDateFormat(pin.date) : (pin.comment ? pin.comment : '&nbsp;'));
}

function dto_to_pin(dto, pindex, alldtos) {
  var datevalue = dto.timestamp ? new Date(dto.timestamp) : undefined;
  var comment = dto.comment;

  var aux = {
    date: datevalue,
    comment: comment,
    url: dto.url ? dto.url : (dto.image ? dto.image.url : undefined),
    exifrotation: dto.image ? dto.image.rotation : undefined,
    dotfileinfo: dto.dotfileinfo
    };
  var pin = new Pin(0, 0, aux, pindex);
  heuristic_gps_magic(dto, pin, typeof trail !== 'undefined' ? trail : []);
  var thumbnail = dto.thumbnail ?
                    new Thumbnail(
                      // TODO this is senseless mixing of image/thumb
                      dto.image ? dto.image.height : 80,
                      dto.image ? dto.image.width : 80,
                      (dto.thumbnail && dto.image) ? (dto.thumbnail.url + '?imagePath=' + dto.image.url) : (dto.thumbnail ? dto.thumbnail.url : undefined),
                      get_thumbnail_caption(pin),
                      pindex
                    ) : undefined;
  pin.thumbnail = thumbnail;
  return pin;
}

// TODO *cry for help* global state hack
// add empty group so that lateron a remove works unchecked
var markerClusterGroup = L.markerClusterGroup({ });

// TODO move *lots* of stuff here...
function init(pin_dtos) {
  // register the handler for clicking the histogram
  Flotr.EventAdapter.observe(document.getElementById("histogram"), 'flotr:select', function(area){
    var start = new Date(parseInt(area.x1, 10));
    start = new Date( bucketTimeForDate(start) ); // beginning of month
    var end = new Date(parseInt(area.x2, 10));
    end = new Date( nextBucketTimeForDate(end) ); // beginning of next month
    main(pin_dtos, start, end);
  });

  Flotr.EventAdapter.observe(document.getElementById("histogram"), 'flotr:click', function () {
    main(pin_dtos);
  });
}

function markerClusterIconCreate(cluster) {
  var childCount = cluster.getChildCount();
  var redToGreen = 120 - Math.min(Math.floor(15 * Math.sqrt(childCount)), 120);
  var innerRadius = Math.max(Math.min(Math.floor(Math.sqrt(childCount)), 25), 15);
  var innerSize = 2 * innerRadius;
  var outerOffset = 5;
  var outerRadius = innerRadius + outerOffset;
  var outerSize = 2 * outerRadius;

  return new L.DivIcon( {
    html :  ' <div class="" style="box-sizing: initial;'
          + ' width: ' + innerSize + 'px;'
          + ' height: ' + innerSize + 'px;'
          + ' background-clip: padding-box;'
          + ' padding: 5px;'
          + ' border-radius: ' + outerRadius + 'px;'
          + ' background-color: hsla(' + redToGreen + ', 100%, 50%, 0.8);">'

          + ' <div class="" style="box-sizing: initial;'
          + ' font: 12px Helvetica Neue, Arial, Helvetica, sans-serif;'
          + ' text-align: center;'
          + ' width: ' + innerSize + 'px;'
          + ' height: ' + innerSize + 'px;'
          + ' border-radius: ' + innerRadius + 'px;'
          + ' background-color: rgba(255, 255, 255, 0.7);">'
          + ' <span style="line-height: ' + innerSize + 'px;">' + childCount + '</span>'
          + '</div></div>',
    className : '',
    iconSize : new L.Point(outerSize, outerSize)
  } );
}

function main(pin_dtos, from, to) {
    map.removeLayer(markerClusterGroup);

    var pins = pin_dtos.map(dto_to_pin);
    if ((typeof from !== "undefined") && (typeof to !== "undefined")) {
      pins = filterPinList(pins, from, to);
    }
    console.log("should see " + pins.length + " pins now");
    var listOfMarkers = [];
    markerClusterGroup = L.markerClusterGroup({
      zoomToBoundsOnClick: false,
      spiderfyOnMaxZoom: false,
      singleMarkerMode: true,
      iconCreateFunction: markerClusterIconCreate
    });
    pins.forEach(function(pin) {
      var result = plotToLayer(pin, markerClusterGroup, listOfMarkers);
      listOfMarkers.push(result);
    });
    markerClusterGroup.on('clusterclick', onClusterClick);
    map.addLayer(markerClusterGroup);
    map.fitBounds(markerClusterGroup.getBounds().pad(0.5));

    var buckets = calculateTimeBuckets(listOfMarkers);
    console.log(document.getElementById("histogram"));
    plot_histogram(document.getElementById("histogram"), buckets);

    global_allpins = pins;
    heatmapLayer.setData({data: pins});

    map.on('click', gpsplot_debug_map);
}

function filterPinList(pins, from, to) {
  pins = pins.filter(function(elem) {
    return (from <= elem.date) && (to > elem.date);
  });
  console.log("filtering from " + from.format('Y-m-d') + " to " + to.format('Y-m-d'));
  return pins;
}

// HISTOGRAM-RELATED STUFF BELOW

function bucketIdForDate(date) {
  if (date) {
    return date.format('Y-m');
  }
  return undefined;
}

function bucketIdForTime(time) {
  var x = parseInt(time, 10);
  return bucketIdForDate(new Date(x));
}

function bucketTimeForDate(date) {
  if (date) {
    var result = new Date(date.getFullYear(), date.getMonth(), 1);
    return result.getTime();
  }
  return undefined;
}

function nextBucketTimeForDate(date) {
  if (date) {
    if (date.getMonth() == 11) {
      var result = new Date(date.getFullYear() + 1, 0, 1);
      return result.getTime();
    }
    else {
      var result = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      return result.getTime();
    }
  }
  return undefined;
}

function calculateTimeBuckets(markers) {
  // dict with: BucketnameId => Marker[]
  var buckets = {};

  markers.forEach(function(marker) {
    var myBucket = bucketIdForDate(marker.pin.date);
    if(!(myBucket in buckets)) {
        buckets[myBucket] = [];
    }
    buckets[myBucket].push(marker);
  });
  console.log(buckets);
  return buckets;
}

function plot_histogram(container, buckets) {
  var d1 = [], options;

  for (var bucketId in buckets) {
    // check if someone tampered with our class
    if (!(buckets.hasOwnProperty(bucketId))) {
      continue;
    }
    var firstPinDate = buckets[bucketId][0].pin.date;
    var x = bucketTimeForDate(firstPinDate);
    var y = buckets[bucketId].length;
    d1.push([x, y]);
  }

  options = {
    xaxis : {
      mode : "time",
      labelsAngle : 0,
      tickFormatter : function(x) {
        if(isNaN(x)) {
          return "";
        } else {
          return bucketIdForTime(x);
        }
      }
    },
    yaxis : {
      min : 0,
      tickFormatter : function(x) {
        return Math.floor(x).toString();
      }
    },
    mouse : {
      track : true,
      relative : true,
      position : 'ne',
      trackFormatter : function(obj){ return bucketIdForTime(obj.x) +': ' + Math.floor(obj.y).toString() + ' pictures'; }
    },
    bars : {
      show : true,
      horizontal : false,
      shadowSize : 0,
      // TODO this encodes info about the bucket width. refactor.
      barWidth : 1000 /* ms->second */ * 60 * 60 * 24 /* second->day */ * 27 /* day->nearly a month */
    },
    selection : {
      mode : 'x'
    },
    HtmlText : false,
    // TODO more bucket width knowledge
    title : 'Pictures per Month (' + bucketIdForTime(d1[0][0]) + ' until ' + bucketIdForTime(d1[d1.length-1][0]) +  ', click to reset filter)'
  };

  Flotr.draw(
    container,
    [ d1 ],
    options
  );
}
