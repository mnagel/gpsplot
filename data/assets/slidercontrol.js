/*
 * Copyright (c) 2013  Dennis Wilhelm
 * Copyright (C) 2015  Fabian Knittel <fabian.knittel@lettink.de>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Based on https://github.com/dwilhelm89/LeafletSlider
 */

L.Control.SliderControl = L.Control.extend({
    options: {
        position: 'topright',
        layer: null,
        range: false,
        follow: false,

        markers: [],
        maxValue: -1,
        minValue: -1,
    },

    onAdd: function (map) {
        var options = this.options;
        options.map = map;

        // Create a control sliderContainer with a jquery ui slider
        var sliderContainer = L.DomUtil.create('div', 'slider', this._container);
        var leafletSlider = $.parseHTML('<div id="leaflet-slider" style="width:200px"><div class="ui-slider-handle"></div></div>');
        $(sliderContainer).append(leafletSlider);
        var sliderTimestamp = $.parseHTML('<div id="slider-timestamp" style="width:200px; margin-top:10px;background-color:#FFFFFF"></div>');
        $(leafletSlider).append(sliderTimestamp);

        if (options.layer) {
            options.layer.eachLayer(function (layer) {
                if (options.minValue === -1) {
                    options.minValue = layer._leaflet_id;
                }
                options.maxValue = layer._leaflet_id;
                options.markers[layer._leaflet_id] = layer;
            });
        } else {
            console.log("Error: You have to specify a layer via new SliderControl({layer: your_layer});");
        }

        $(leafletSlider).slider({
            range: options.range,
            value: options.minValue + 1,
            min: options.minValue,
            max: options.maxValue +1,
            step: 1,
            start: function( event, ui ) {
                // Prevent map panning/zooming while using the slider
                map.dragging.disable();
            },
            stop: function( event, ui ) {
                map.dragging.enable();
                //Only show the slider timestamp while using the slider
                $(sliderTimestamp).hide();
            },
            slide: function (e, ui) {
                var map = options.map;
                if(!!options.markers[ui.value]) {
                    if (options.markers[ui.value].pin !== undefined) {
                        if (options.markers[ui.value].pin.date){
                            $(sliderTimestamp).html(options.markers[ui.value].pin.date.format('Y-m-d H:i:s'));
                            $(sliderTimestamp).show();
                        } else {
                            console.error("You have to have a time property");
                        }
                    }
                    
                    var i;
                    if(options.range){
                        // jquery ui using range
                        for (i = ui.values[0]; i <= ui.values[1]; i++){
                           if(options.markers[i]) map.addLayer(options.markers[i]);
                        }
                        for (i = options.maxValue; i > ui.values[1]; i--) {
                            if(options.markers[i]) map.removeLayer(options.markers[i]);
                        }
                        for (i = options.minValue; i < ui.values[0]; i++) {
                            if(options.markers[i]) map.removeLayer(options.markers[i]);
                        }
                    }else if(options.follow){
                        for (i = options.minValue; i < (ui.value - options.follow); i++) {
                            if(options.markers[i]) map.removeLayer(options.markers[i]);
                        }
                        for (i = (ui.value - options.follow); i < ui.value ; i++) {
                            if(options.markers[i]) map.addLayer(options.markers[i]);
                        }
                        for (i = ui.value; i <= options.maxValue; i++) {
                            if(options.markers[i]) map.removeLayer(options.markers[i]);
                        }
                    }else{
                        // jquery ui for point before
                        for (i = options.minValue; i <= ui.value ; i++) {
                            if(options.markers[i]) map.addLayer(options.markers[i]);
                        }
                        for (i = (ui.value + 1); i <= options.maxValue; i++) {
                            if(options.markers[i]) map.removeLayer(options.markers[i]);
                        }
                    }
                }
            }
        });
        options.map.addLayer(options.markers[options.minValue]);

        return sliderContainer;
    },
});

L.control.sliderControl = function (options) {
    return new L.Control.SliderControl(options);
};
