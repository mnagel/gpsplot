GPSplot
=======

"Your pictures and their origin."

Display on a map where your photos were taken.



Screenshot
==========

![gpsplot screenshot](https://raw.githubusercontent.com/mnagel/gpsplot/master/doc/gpsplot.png "gpsplot screenshot")



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
* optional go server
* images are *not* uploaded to the cloud



Installation
============

No special installation is required. You need python and a browser.
You can run `bash doc/demo.sh` to download some pictures to run a demo.



Usage
=====

* place all pictures you want to plot in `./data/img/`
* run the python program to create the html page: `python preproc.py`
* open the resulting `index.html` in your browser


License
=======

GNU GPL v3+
