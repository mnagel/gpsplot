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

$("#expandable").hover(
  function() {
   $(this).stop().animate({"height":"300px"}, 200).addClass("dropped");
  },
  function() {
    $(this).stop().animate({"height":"20px"}, 200).removeClass("dropped");
  }
);

var THUMBSIZE = 160;

var baseLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '<a href="https://github.com/mnagel/gpsplot">GPSplot: "Your pictures and their origin."</a> | ' +
  'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
  '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
  'Imagery © <a href="http://mapbox.com">Mapbox</a>',
  id: 'examples.map-i875mjb7'
});

var cfg = {
  // radius should be small ONLY if scaleRadius is true (or small radius is intended)
  // if scaleRadius is false it will be the constant radius used in pixels
  "radius": 30,
  "maxOpacity": .7, 
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

function Thumbnail(height, width, url, caption) {
  this.height = height;
  this.width = width;
  this.url = url;
  this.caption = caption;

  this.createElement = function() {
    var box = document.createElement("div");
    box.setAttribute('style', 'width: ' + THUMBSIZE + 'px; height: ' + THUMBSIZE + 'px; position: relative; display: inline-block; margin: 3px; background-image: url("data/assets/loading.png"); background-repeat: no-repeat; background-position: center;');
    var thumbnail = document.createElement("img");
    box.appendChild(thumbnail);
    sizes = scaleIntoBox(this.height, this.width, THUMBSIZE);
    thumbnail.setAttribute('src', this.url);
    thumbnail.setAttribute('style', 'max-height: 100%; max-width: 100%; width: auto; height: auto; position: absolute; top: 0; bottom: 0; left: 0; right: 0; margin: auto;');
    var caption = document.createElement("span");
    box.appendChild(caption);
    caption.setAttribute('style', 'position: absolute; bottom: 0; left: 0; right: 0; text-align: center; color: white; background: rgba(0,0,0,0.4);');
    caption.innerHTML = this.caption;
    return box;
  }
}

function Pin(lat, lon, aux) {
  this.lat = lat;
  this.lon = lon;
  this.date = aux['date'];
  this.comment = aux['comment'];
  this.url = aux['url'];
  this.rotation = aux['exifrotation'];
  this.thumbnail = aux['thumbnail'];
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
  box.setAttribute('style', 'overflow: auto; max-height: 400px;');

  markers.forEach(function(marker){
    var link = document.createElement('a');
    link.setAttribute('href', marker.pin.url);
    link.setAttribute('target', '_blank');
    link.setAttribute('data-lightbox', 'any_group_name');
    link.setAttribute('data-title',
      '<a href="' + marker.pin.url + '" target="_blank">'
      + safeDateFormat(marker.pin.date)
      + " " + marker.pin.url
      + " " + marker.pin.comment
      + '</a>'
    );
    link.setAttribute('data-rotation', marker.pin.rotation);
    if (marker.pin.thumbnail) {
      link.appendChild(marker.pin.thumbnail.createElement());
    } else {
      link.innerHTML = marker.pin.url;
    }
    box.appendChild(link);
  });

  // TODO find a better way to handle these cases uniformly
  if (e.type === "clusterclick") {
    e.layer.bindPopup(box, {maxWidth: 520}).openPopup();
  }
  else if (e.type === "click") {
    console.log("opening single image popup");
    // TODO why is this very strange construct necessary?
    if (!e.target.hasPopup) {
      e.target.bindPopup(box, {maxWidth: 520}).openPopup();
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

function dto_to_pin(dto) {
  var datevalue = dto.timestamp ? new Date(dto.timestamp) : undefined;

  return new Pin(dto.gps.lat, dto.gps.lon, {
                  date: datevalue,
                  comment: dto.comment,
                  url: dto.image.url,
                  exifrotation: dto.image.rotation,
                  thumbnail:
                    new Thumbnail(
                      // TODO this is senseless mixing of image/thumb
                      dto.image.height,
                      dto.image.width,
                      dto.thumbnail.url + '?imagePath=' + dto.image.url,
                      safeDateFormat(datevalue)
                    )
            });
}

// TODO *cry for help* global state hack
// add empty group so that lateron a remove works unchecked
var markerClusterGroup = L.markerClusterGroup({ });

// TODO move *lots* of stuff here...
function init(pin_dtos) {
  // register the handler for clicking the histogram
  Flotr.EventAdapter.observe(document.getElementById("histogram"), 'flotr:select', function(area){
    main(pin_dtos, new Date(parseInt(area.x1, 10)), new Date(parseInt(area.x2, 10)));
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
  
  return new L.DivIcon({ html: '<div class="marker-cluster-outer" style="width: ' + innerSize + 'px; height: ' + innerSize + 'px; border-radius: ' + outerRadius + 'px; background-color: hsla(' + redToGreen + ', 100%, 50%, 0.6);"><div class="marker-cluster-inner" style="width: ' + innerSize + 'px; height: ' + innerSize + 'px; border-radius: ' + innerRadius + 'px;"><span style="line-height: ' + innerSize + 'px;">' + childCount + '</span></div></div>', className: '', iconSize: new L.Point(outerSize, outerSize) });
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

    buckets = calculateTimeBuckets(listOfMarkers);
    console.log(document.getElementById("histogram"))
    plot_histogram(document.getElementById("histogram"), buckets);
  
    heatmapLayer.setData({data: pins});
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
  var d1 = [], options, graph, i;

  for (bucketId in buckets) {
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
      barWidth : 30 /* days */ * (60 * 24 * 100) /* second->day */ * 1000 /* ms */ / 2 /* MAGIC 2*/
    },
    selection : {
      mode : 'x'
    },
    HtmlText : false,
    title : 'Picture Count / Select Range (click to reset)'
  };

  Flotr.draw(
    container,
    [ d1 ],
    options
  );
}
