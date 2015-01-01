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
  this.thumbnail = aux['thumbnail'];

  this.createPopup = function(marker) {
    var box = document.createElement('div');
    box.innerHTML = this.date.format('Y-m-d H:i:s') + "<br />" + this.comment;
    if (this.url) {
      box.appendChild(document.createElement('p'));
      var link = document.createElement('a');
      link.setAttribute('href', this.url);
      link.setAttribute('target', '_blank');
      link.setAttribute('data-lightbox', 'any_group_name');
      link.setAttribute('data-title', this.date.format('Y-m-d H:i:s'));
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

function onClusterClick(e) {
  var box = document.createElement('div');
  box.setAttribute('style', 'overflow: auto; max-height: 400px;');
  e.layer.getAllChildMarkers().forEach(function(marker){
    var link = document.createElement('a');
    link.setAttribute('href', marker.pin.url);
    link.setAttribute('target', '_blank');
    link.setAttribute('data-lightbox', 'any_group_name');
    link.setAttribute('data-title', marker.pin.date.format('Y-m-d H:i:s'));
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
                    thumbnail: new Thumbnail(dto.thumbnail.height,
                            dto.image.width, dto.image.url,
                            new Date(dto.timestamp).format('Y-m-d H:i:s'))
              });
}

function main(pin_dtos) {
    var pins = pin_dtos.map(dto_to_pin);
    var markers = L.markerClusterGroup({zoomToBoundsOnClick: false});
    pins.forEach(function(pin) {
      plotToLayer(pin, markers);
    });
    markers.on('clusterclick', onClusterClick);
    map.addLayer(markers);
    map.fitBounds(markers.getBounds().pad(0.5));
}
