log2trail
=========

Usage
-----

```
user@host:~/gpsplot$ python tools/log2trail.py --infile data/position-small.txt --outfile data/pins.js
done. processed 5 entries
```

Input
-----

gps log file with contents like this:

```
09-11-2014 19.50 @ 49.002932966686785,8.413221817463636 / 50
09-11-2014 19.55 @ 49.002932966686785,8.413221817463636 / 50
09-11-2014 20.00 @ 49.00280443020165,8.412774559110403 / 10
09-11-2014 20.05 @ 49.00280443020165,8.412774559110403 / 10
09-11-2014 20.10 @ 49.00280443020165,8.412774559110403 / 10
```

Output
------

trails.js for gpsplot
