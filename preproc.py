#!/usr/bin/env python
# Tool to process EXIF-tagged images into a nice HTML page with geo-location
# information.
#
# Copyright (C) 2015  Michael Nagel <michael.nagel@devzero.de>
# Copyright (C) 2015  Fabian Knittel <fabian.knittel@lettink.de>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from __future__ import print_function

import argparse
from datetime import datetime
import errno
from PIL import Image
import json
import os
import re
import sys

# begin http://www.leancrew.com/all-this/2014/02/photo-locations-with-apple-maps/
def degrees(dms):
    '''Return decimal degrees from degree, minute, second tuple.

    Each item in the tuple is itself a two-item tuple of a
    numerator and a denominator.'''

    deg, min, sec = dms
    deg = float(deg[0])/deg[1]
    min = float(min[0])/min[1]
    sec = float(sec[0])/sec[1]
    return deg + min/60 + sec/3600

def coord_pair(gps):
    'Return the latitude, longitude pair from GPS EXIF data.'

# Magic GPS EXIF numbers.
    LATREF = 1; LAT = 2
    LONGREF = 3; LONG = 4

    lat = degrees(gps[LAT])
    if gps[LATREF] == 'S':
        lat = -lat
    lon = degrees(gps[LONG])
    if gps[LONGREF] == 'W':
        lon = -lon
    return (lat, lon)
# end http://www.leancrew.com/all-this/2014/02/photo-locations-with-apple-maps/

class ExifImage(object):
    # Magic EXIF number.
    _GPS = 34853
    _DATE = 36867

    def __init__(self, fn, skipthumbs=False):
        self.fn = fn
        self.skipthumbs = skipthumbs
        try:
            self._exif = Image.open(fn)._getexif()
        except:
            self._exif = None

    def has_exif(self):
        return self._exif is not None

    def has_gps(self, showatzero=False):
        try:
            if (not self.has_exif()) or (self._raw_gps() is None):
                return False
            x, y = self.gps_coords() # try to actually access them, might fail
            if not showatzero and self.is_at_zero():
                return False
            return True
        except Exception as e:
            print("{}: {}".format(self.fn, e))
            return False

#    def has_date(self):
#        return self.get_date() is None

    def get_date(self):
        inp = self._exif.get(self._DATE, None)
        return datetime.strptime(inp, '%Y:%m:%d %H:%M:%S')

    def _raw_gps(self):
        return self._exif.get(self._GPS, None)

    def gps_coords(self):
        return coord_pair(self._raw_gps())
    
    def is_at_zero(self):
        return self.gps_coords() == (0, 0)

    def size(self):
        im = Image.open(self.fn)
        return im.size # w, h

    def create_thumbnail(self, basedir, size):
        if self.get_thumbpath(basedir) == self.fn:
            print >>sys.stderr, "skipping as you are about to overwrite your input data at %s" % self.fn
            return
        im = Image.open(self.fn)
        im.thumbnail((size, size), Image.ANTIALIAS)
        im.save(self.get_thumbpath(basedir), 'JPEG', quality=98)

    def get_thumbpath(self, basedir):
        if self.skipthumbs: # bad bad scope creep
            return self.fn
        return basedir + '/' + os.path.basename(self.fn) + '.thumb.jpg'

def exif_image_to_dto(input_image, thumbdir):
    gps_coords = input_image.gps_coords()
    size = input_image.size()
    return {
        'gps': {
            'lat': gps_coords[0],
            'lon': gps_coords[1],
            },
        'timestamp': input_image.get_date().isoformat(),
        'comment': "",
        'image': {
            'url': input_image.fn,
            'height': size[1],
            'width': size[0],
            },
        'thumbnail': {
            'url': input_image.get_thumbpath(thumbdir), # bad bad scope creep
            },
        }

def find_images(basedir, allfileextensions=False):
    datanames = []
    re_jpeg = re.compile('^\.jpe?g$', re.IGNORECASE)
    
    for subdir, dirs, files in os.walk(basedir):
        for file in files:
            if not allfileextensions:
                _, extension = os.path.splitext(file)
                if not re_jpeg.match(extension):
                    continue
            datanames.append(os.path.join(subdir, file))
    return datanames

def fill_template(outfile, dtos):
    with open(outfile, "w") as text_file:
        text_file.write("var pin_dtos = {0};".format(json.dumps(dtos, indent=4,
            separators=(',', ': '))))

def mkdir_p(path):
    # http://stackoverflow.com/a/600612/2536029
    try:
        os.makedirs(path)
    except OSError as exc: # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else: raise

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--datafile', default='data/img', type=str)
    parser.add_argument('--skipthumbs', default=False, action="store_true")
    parser.add_argument('--thumbdir', default='data/thumbs', type=str)
    parser.add_argument('--thumbsize', default=160, type=int)
    parser.add_argument('--outfile', default='data/pins.js', type=str)
    parser.add_argument('--showatzero', default=False, action="store_true", help='Regard lat,log = 0,0 as valid coordinates')
    parser.add_argument('--allfileextensions', default=False, action="store_true", help='Scan all files for exif data, do not restrict to jpeg files')
    options = parser.parse_args()

    mkdir_p(options.thumbdir)

    dtos = []

    imagepaths = find_images(options.datafile, allfileextensions=options.allfileextensions)
    for imagepath in imagepaths:
        try:
            exif_image = ExifImage(imagepath, options.skipthumbs)
            if not exif_image.has_gps(showatzero=options.showatzero):
                print("notice: image {0} has no EXIF and/or GPS data".format(exif_image.fn), file=sys.stderr)
                continue
            dtos.append(exif_image_to_dto(exif_image, options.thumbdir))
            if not options.skipthumbs:
                exif_image.create_thumbnail(options.thumbdir, options.thumbsize)
        except Exception as exc:
            print(exc, file=sys.stderr)

    print("%d/%d images with usable exif data. %d without usable exif data." % (len(dtos), len(imagepaths), len(imagepaths) - len (dtos)))

    fill_template(outfile=options.outfile, dtos=dtos)

if __name__ == '__main__':
    main()
