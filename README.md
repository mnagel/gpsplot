GPSplot
=======

"Your pictures and their origin."

Display on a map where your photos were taken.



Live Demo
=========

A live demo can be found at [http://gpsplot-demo.lettink.de/](http://gpsplot-demo.lettink.de/)



Screenshot
==========

![gpsplot screenshot](doc/gpsplot.png?raw=true "gpsplot screenshot")

Photography: (c) Dietmar Rabich, [rabich.de](http://rabich.de), CC BY-SA 4.0, Wikimedia Commons.


Features
========

* images are diplayed on an interactive map
* extraction of exif metadata
* heuristic location detection
* location based dynamic clustering
* time based filtering via histogram
* fullscreen slideshow of selected images
* image location heatmap

* local preprocessing in python
* browser-based javascript runtime
* tested on Linux and Windows
* optional go server
* images are *not* uploaded to the cloud



Installation
============

No special installation is required. You need python and a browser.
You can run `bash doc/demo.sh` to download some pictures to run a demo.



Usage
=====

* place all pictures you want to plot in `./data/img/` or look at the `--inputdir $FOLDER` argument.
* run the python program to create the html page: `python preproc.py`
* open the resulting `index.html` in your browser



Used Libraries
==============

* Leaflet: [https://github.com/Leaflet/Leaflet](https://github.com/Leaflet/Leaflet)
* Leaflet Markercluster: [https://github.com/Leaflet/Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
* Lightbox: [https://github.com/lokesh/lightbox2/](https://github.com/lokesh/lightbox2/)
* Flotr2: [https://github.com/HumbleSoftware/Flotr2](https://github.com/HumbleSoftware/Flotr2)
* Leaflet Heatmap: [https://github.com/Leaflet/Leaflet.heat](https://github.com/Leaflet/Leaflet.heat)
* date.format: [https://github.com/jacwright/date.format](https://github.com/jacwright/date.format)
* jQuery: [https://github.com/jquery/jquery](https://github.com/jquery/jquery)



License
=======

GNU GPL v3+
