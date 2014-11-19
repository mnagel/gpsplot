#! /usr/bin/env python

import argparse
import errno
import os
import sys
import time
import Image
 
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

    def __init__(self, fn):
        self.fn = fn
        try:
            self._exif = Image.open(fn)._getexif()
        except:
        	self._exif = None

    def has_exif(self):
        return self._exif is not None

    def has_gps(self):
        try:
            if (not self.has_exif()) or (self._raw_gps() is None):
                return False
            x, y = self.gps_coords() # try to actually access them, might fail
            return True
        except:
            return False

#    def has_date(self):
#        return self.get_date() is None

    def get_date(self):
        inp = self._exif.get(self._DATE, None)
        # print result
        date = time.strptime(inp, '%Y:%m:%d %H:%M:%S')
        #print str(date)
        #print time.strftime("new Date(%Y, %m, %d, %H, %M, %S)", date)
        return date

    def _raw_gps(self):
        return self._exif.get(self._GPS, None)

    def gps_coords(self):
        return coord_pair(self._raw_gps())

    def size(self):
        im = Image.open(self.fn)
        return im.size # w, h

    def create_thumbnail(self, dir, size):
        im = Image.open(self.fn)
        im.thumbnail((size, size), Image.ANTIALIAS)
        im.save(self.get_thumbpath(dir), 'JPEG', quality=98)

    def get_thumbpath(self, dir):
        return dir + '/' + os.path.basename(self.fn) + '.thumb.jpg'

def exif_image_to_line(input_image):
    gps_coords = input_image.gps_coords()
    size = input_image.size()
    return """
new Pin(%s, %s, {
    date      : %s,
    comment   : '%s',
    url       : '%s',
    thumbnail : new Thumbnail(%s, %s, '%s')
})

""" % (
        gps_coords[0],
        gps_coords[1],
        time.strftime("new Date(%Y, %m, %d, %H, %M, %S)", input_image.get_date()),
        "", # comment
        input_image.fn,
        size[1], # h
        size[0], # w
        input_image.get_thumbpath(options.thumbdir), # bad bad scope creep
    )

def find_images(basedir):
    datanames = []
    for subdir, dirs, files in os.walk(basedir):
        for file in files:
            datanames.append(os.path.join(subdir, file))
    return datanames

def fill_template(outfile, template, data, debug):
    with open (template, "r") as myfile:
        template = myfile.read()
    result = template.replace('%%MARKERFORDATA%%', ',\n'.join(data))
    result = result.replace('%%UNCOMMENT-IN-DEBUG%%', '//' if debug else '')
    with open(outfile, "w") as text_file:
        text_file.write(result)

def mkdir_p(path):
    # http://stackoverflow.com/a/600612/2536029
    try:
        os.makedirs(path)
    except OSError as exc: # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else: raise

parser = argparse.ArgumentParser()
parser.add_argument('--template', default='template.htm', type=str)
parser.add_argument('--datafile', default='data/img', type=str)
parser.add_argument('--thumbdir', default='data/thumbs', type=str)
parser.add_argument('--thumbsize', default=160, type=int)
parser.add_argument('--outfile', default='index.htm', type=str)
parser.add_argument('--debug', default=False, action="store_true")

options = parser.parse_args()

mkdir_p(options.thumbdir)

lines = []
imagepaths = find_images(options.datafile)
for imagepath in imagepaths:
    exif_image = ExifImage(imagepath)
    if not exif_image.has_gps():
        print >>sys.stderr, "notice: image {0} has no EXIF and/or GPS data".format(exif_image.fn)
        continue
    lines.append(exif_image_to_line(exif_image))
    exif_image.create_thumbnail(options.thumbdir, options.thumbsize)

print "%d/%d images without usable exif data" % (len(imagepaths) - len (lines), len(imagepaths))

fill_template(outfile=options.outfile, template=options.template, data=lines, debug=options.debug)
