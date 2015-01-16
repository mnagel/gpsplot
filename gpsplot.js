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

var THUMBSIZE = 160;

var map = L.map('map').setView([50.50, 10], 7);

L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '<a href="https://github.com/mnagel/gpsplot">GPSplot: "Your pictures and their origin."</a> | ' +
  'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
  '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
  'Imagery © <a href="http://mapbox.com">Mapbox</a>',
  id: 'examples.map-i875mjb7'
}).addTo(map);
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

function exifrotation2string(exif) {
  var map = {
    '1': "not at all",
    '2': "x-mirror",
    '3': "180 clock",
    '4': "180 clock + x-mirror",
    '5': "90 clock + x-mirror",
    '6': "90 clock",
    '7': "270 clock + x-mirror",
    '8': "270 clock",
  };
  return map[exif];
}

function Pin(lat, lon, aux) {
  this.lat = lat;
  this.lon = lon;
  this.date = aux['date'];
  this.comment = aux['comment'];
  this.url = aux['url'];
  this.rotation = aux['exifrotation'];
  this.thumbnail = aux['thumbnail'];

  this.createPopup = function(marker) {
    var box = document.createElement('div');
    if (this.url) {
      box.appendChild(document.createElement('p'));
      // TODO code duplication of below lines + onClusterClick
      var link = document.createElement('a');
      link.setAttribute('href', this.url);
      link.setAttribute('target', '_blank');
      link.setAttribute('data-lightbox', 'any_group_name');
      link.setAttribute('data-title', this.date.format('Y-m-d H:i:s') + " " + this.url + " " + this.comment + " please rotate " + exifrotation2string(this.rotation));
      if (this.thumbnail) {
        link.appendChild(this.thumbnail.createElement());
      } else {
        link.innerHTML = this.url;
      }
      box.appendChild(link);
    } else {
      if (this.thumbnail) {
        box.appendChild(document.createElement('p'));
        box.appendChild(this.thumbnail.createElement());
      }
    }
    return marker.bindPopup(box);
  }
}

function onMarkerClick(e) {
  var marker = e.target;
  var what = marker.pin;
  if (!what.hasPopup) {
    what.hasPopup = true;
    what.createPopup(marker).openPopup();
  }
}

function compareMarkers(a, b) {
  if (a.pin.date == b.pin.date) {
    return 0;
  }
  return (a.pin.date > b.pin.date) ? 1 : -1;
}

function onClusterClick(e) {
  var box = document.createElement('div');
  box.setAttribute('style', 'overflow: auto; max-height: 400px;');
  markers = e.layer.getAllChildMarkers()
  markers = markers.sort(compareMarkers);
  markers.forEach(function(marker){
    var link = document.createElement('a');
    link.setAttribute('href', marker.pin.url);
    link.setAttribute('target', '_blank');
    link.setAttribute('data-lightbox', 'any_group_name');
    link.setAttribute('data-title', marker.pin.date.format('Y-m-d H:i:s') + " " + marker.pin.url + " " + marker.pin.comment + " please rotate " + exifrotation2string(marker.pin.rotation));
    if (marker.pin.thumbnail) {
      link.appendChild(marker.pin.thumbnail.createElement());
    } else {
      link.innerHTML = marker.pin.url;
    }
    box.appendChild(link);
  });
  e.layer.bindPopup(box, {maxWidth: 520}).openPopup();
}

function plotToLayer(what, layer) {
  var marker = L.marker([what.lat, what.lon]);
  marker.pin = what;
  marker.on('click', onMarkerClick);
  layer.addLayer(marker);
  return marker;
}

function activateDebug() {
  // click in nowhere -> show some info
  var popup = L.popup();
  function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
  }
  map.on('click', onMapClick);
}

function dto_to_pin(dto) {
    return new Pin(dto.gps.lat, dto.gps.lon, {
                    date: new Date(dto.timestamp),
                    comment: dto.comment,
                    url: dto.image.url,
                    exifrotation: dto.image.rotation,
                    thumbnail:
                      new Thumbnail(
                        dto.image.height,
                        dto.image.width,
                        dto.thumbnail.url,
                        new Date(dto.timestamp).format('Y-m-d H:i:s')
                      )
              });
}

// TODO *cry for help* global state hack
var markerClusterGroup = "hack";

function main(pin_dtos, from, to) {
    if (markerClusterGroup !== "hack") {
      map.removeLayer(markerClusterGroup);
    }

    var pins = pin_dtos.map(dto_to_pin);
    if ((typeof from !== "undefined") && (typeof to !== "undefined")) {
      pins = filterPinList(pins, from, to);
    }
    var listOfMarkers = [];
    markerClusterGroup = L.markerClusterGroup({zoomToBoundsOnClick: false});
    pins.forEach(function(pin) {
      var result = plotToLayer(pin, markerClusterGroup, listOfMarkers);
      listOfMarkers.push(result);
    });
    markerClusterGroup.on('clusterclick', onClusterClick);
    map.addLayer(markerClusterGroup);
    map.fitBounds(markerClusterGroup.getBounds().pad(0.5));

    buckets = calculateTimeBuckets(listOfMarkers);
    console.log(document.getElementById("example"))
    basic_time(document.getElementById("example"), buckets);
}

function filterPinList(pins, from, to) {
  pins = pins.filter(function(elem) {
    return (from <= elem.date) && (to > elem.date);
  });
  console.log("filtering from " + from.format('Y-m-d') + " to " + to.format('Y-m-d'));
  console.log("should see " + pins.length + " pins now");
  return pins;
}

// HISTOGRAM-RELATED STUFF BELOW

function bucketIdForDate(date) {
  return date.format('Y-m');
}

function bucketIdForTime(time) {
  var x = parseInt(time, 10);
  return bucketIdForDate(new Date(x));
}

function bucketTimeForDate(date) {
  var result = new Date(date.getFullYear(), date.getMonth(), 1);
  return result.getTime();
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

function basic_time(container, buckets) {
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
    title : 'Picture Count'
  };

  Flotr.draw(
    container,
    [ d1 ],
    options
  );

  Flotr.EventAdapter.observe(container, 'flotr:select', function(area){
    // in a spectacular case of scope creep, we access the global input variable
    main(pin_dtos, new Date(parseInt(area.x1, 10)), new Date(parseInt(area.x2, 10)));
  });

  Flotr.EventAdapter.observe(container, 'flotr:click', function () {
    console.log("resetting histo");
    // in a spectacular case of scope creep, we access the global input variable
    main(pin_dtos);
  });

}
