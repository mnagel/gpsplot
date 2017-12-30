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
import errno
import hashlib
import json
import logging
import os
import re
import shutil
import sys
import webbrowser
from datetime import datetime

from PIL import Image, ExifTags


def read_arguments(args):
    os.environ['COLUMNS'] = str(shutil.get_terminal_size().columns)
    parser = argparse.ArgumentParser()
    parser.add_argument('--inputdir', default='../data/img/', type=str,
                        help='display pictures from this folder on the map')
    parser.add_argument('--outfile', default='../data/trail.dcim.js', type=str,
                        help='save the generated JSON data needed at runtime to this file')
    parser.add_argument('--allfileextensions', default=False, action="store_true",
                        help='scan all files for exif data, do not restrict to jpeg files')
    parser.add_argument('--verbose', default=False, action="store_true",
                        help='show more log messages')

    options = parser.parse_args(args)
    return options


# begin http://www.leancrew.com/all-this/2014/02/photo-locations-with-apple-maps/
# noinspection PyShadowingBuiltins
def degrees(dms):
    """Return decimal degrees from degree, minute, second tuple.

    Each item in the tuple is itself a two-item tuple of a numerator and a denominator.
    @param dms: degree, minute, second tuple
    """

    deg, min, sec = dms
    deg = float(deg[0]) / deg[1]
    min = float(min[0]) / min[1]
    sec = float(sec[0]) / sec[1]
    return deg + min / 60 + sec / 3600


# noinspection PyPep8Naming
def coord_pair(gps):
    """Return the latitude, longitude pair from GPS EXIF data.

    @param gps: exif entry for gps.
    """

    # Magic GPS EXIF numbers.
    LATREF = 1
    LAT = 2
    LONGREF = 3
    LONG = 4

    lat = degrees(gps[LAT])
    if gps[LATREF] == 'S':
        lat = -lat
    lon = degrees(gps[LONG])
    if gps[LONGREF] == 'W':
        lon = -lon
    return lat, lon


# end http://www.leancrew.com/all-this/2014/02/photo-locations-with-apple-maps/

# TODO import code from preproc
class ExifImage(object):
    # Magic EXIF number.
    _GPS = 34853
    _DATE = 36867
    for _ORIENTATION in ExifTags.TAGS.keys():
        if ExifTags.TAGS[_ORIENTATION] == 'Orientation':
            break

    def __init__(self, fn, referencethumb):
        self.fn = fn
        self.referencethumb = referencethumb
        self.comment = ''
        try:
            # noinspection PyProtectedMember
            self._exif = Image.open(fn)._getexif()
        except RuntimeError:
            self._exif = None

    def has_exif(self):
        return self._exif is not None

    def has_gps(self, showatzero=False):
        # noinspection PyBroadException
        try:
            # endless ways for the data to be completely borken
            # best way: just access it and watch for errors
            self.gps_coords()
            if not showatzero and self.is_at_zero():
                return False
            return True
        except (TypeError, Exception):
            pass
        #    logging.exception("Failed to parse GPS info in %s", self.fn)
        return False

    def has_date(self):
        # noinspection PyBroadException
        try:
            # endless ways for the data to be completely borken
            # best way: just access it and watch for errors
            tmp = self._exif.get(self._DATE, None)
            datetime.strptime(tmp, '%Y:%m:%d %H:%M:%S')
            return True
        except (TypeError, Exception):
            pass
        #    logging.exception("Failed to parse date info in %s", self.fn)
        return False

    def get_date(self):
        inp = self._exif.get(self._DATE, None)
        if not inp:
            return None
        return datetime.strptime(inp, '%Y:%m:%d %H:%M:%S')

    @staticmethod
    def get_dotfilepath(path):
        return os.path.dirname(path) + "/.gpsplot"

    @staticmethod
    def get_parents(path):
        parents = []
        path = os.path.normpath(path)
        path = os.path.dirname(path)
        while path:
            parents.append(path)
            if path == '/':
                path = ''
            else:
                path = os.path.dirname(path)

        return parents

    def get_effective_dotfilepath(self):
        for parent in ExifImage.get_parents(self.fn):
            candidate = ExifImage.get_dotfilepath(parent)
            if os.path.isfile(candidate):
                return candidate

    def has_dotfileinfo(self):
        for parent in ExifImage.get_parents(self.fn):
            if os.path.isfile(ExifImage.get_dotfilepath(parent)):
                return True
        return False

    def get_dotfileinfo(self):
        with open(self.get_effective_dotfilepath()) as json_file:
            json_data = json.load(json_file)
            return json_data

    def get_rotation(self):
        std = 1
        # noinspection PyBroadException
        try:
            return self._exif.get(self._ORIENTATION, std)
        except:
            return std

    def _raw_gps(self):
        return self._exif.get(self._GPS, None)

    def gps_coords(self):
        return coord_pair(self._raw_gps())

    def is_at_zero(self):
        return self.gps_coords() == (0, 0)

    def size(self):
        im = Image.open(self.fn)
        return im.size  # w, h

    def create_thumbnail(self, basedir, size):
        if self.get_thumbpath(basedir) == self.fn:
            logging.error("Skipping thumbnail generation for %s as you are about to overwrite your input data", self.fn)
            return

        # generate a correctly rotated thumbnail
        # inspired by http://stackoverflow.com/a/11543365/2536029
        image = Image.open(self.fn)
        orientation = self.get_rotation()

        if orientation == 3:
            image = image.transpose(Image.ROTATE_180)
        elif orientation == 6:
            image = image.transpose(Image.ROTATE_270)
        elif orientation == 8:
            image = image.transpose(Image.ROTATE_90)

        image.thumbnail((size, size), Image.ANTIALIAS)
        image.save(self.get_thumbpath(basedir), 'JPEG', quality=98)

    def get_thumbpath(self, basedir):
        if not self.referencethumb:
            return self.fn
        try:
            md5_object = hashlib.md5()
            logger.debug(self.fn)
            md5_object.update(self.fn.encode("utf-8"))

            return basedir + '/' + md5_object.hexdigest() + '.jpg'
        except UnicodeDecodeError:
            logging.error("either use python3 or paths without umlauts")
            sys.exit(1)


def exif_image_to_dto(input_image, thumbdir):
    size = input_image.size()
    result = {
        'comment': input_image.comment,
        'image': {
            'url': input_image.fn,
            'height': size[1],
            'width': size[0],
            'rotation': input_image.get_rotation(),
        },
        'thumbnail': {
            'url': input_image.get_thumbpath(thumbdir),  # bad bad scope creep
        }
    }

    if input_image.has_gps():
        gps_coords = input_image.gps_coords()
        subdata = {
            'lat': gps_coords[0],
            'lon': gps_coords[1],
        }
        result['gps'] = subdata

    if input_image.has_date():
        result['timestamp'] = input_image.get_date().isoformat()

    if input_image.has_dotfileinfo():
        result['dotfileinfo'] = input_image.get_dotfileinfo()

    return result


def find_images(basedir, allfileextensions=False):
    datanames = []
    re_jpeg = re.compile('^\.jpe?g$', re.IGNORECASE)

    for subdir, dirs, files in os.walk(basedir, followlinks=True):
        dirs.sort()
        files.sort()
        for f in files:
            if not allfileextensions:
                _, extension = os.path.splitext(f)
                if not re_jpeg.match(extension):
                    continue
            datanames.append(os.path.join(subdir, f))
    return datanames


def fill_template(outfile, dtos):
    with open(outfile, "w") as result:

        result.write("""
        var trail = [
        // timestamp, lat, lon
        """)

        for location in dtos:
            result.write(
                'new TrailElement(new Date("%s"), %f, %f, "%s"),\n'
                % (location["timestamp"], location["gps"]["lat"], location["gps"]["lon"], "phone trail from: " + location["image"]["url"])
            )

        result.write("""
        ]
        """)


def mkdir_p(path):
    # http://stackoverflow.com/a/600612/2536029
    try:
        os.makedirs(path)
    except OSError as exc:  # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else:
            raise


def main(options):
    dtos = []

    logging.info("Processing image folder: %s" % options.inputdir)
    imagepaths = find_images(options.inputdir, allfileextensions=options.allfileextensions)
    stat_input = len(imagepaths)
    stat_output = 0
    stat_nogps = 0
    stat_exceptions = 0
    logging.info("There are %d images to process", len(imagepaths))

    try:
        for index, imagepath in enumerate(imagepaths):
            # noinspection PyBroadException
            try:
                exif_image = ExifImage(imagepath, False)

                if exif_image.has_exif():
                    if not exif_image.has_gps():
                        logging.warning("%d/%d Image %s has no GPS data in EXIF.", index, stat_input, exif_image.fn)
                        stat_nogps += 1

                    if not exif_image.has_date():
                        logging.warning("%d/%d Image %s has no TIME data in EXIF.", index, stat_input, exif_image.fn)
                        # TODO: account for in stats

                    if exif_image.has_gps() and exif_image.has_date():
                        dto = exif_image_to_dto(exif_image, "there are no thumbs in trail!")
                        dtos.append(dto)
                        stat_output += 1

                else:
                    logging.warning("%d/%d Image %s has no EXIF data attached.", index, stat_input, exif_image.fn)
                    stat_nogps += 1

                logging.debug("%d/%d Added image %s", index, stat_input, exif_image.fn)
            except Exception:
                logging.exception("%d/%d Single picture exception on %s", index, stat_input, imagepath)
                stat_exceptions += 1
    except KeyboardInterrupt:
        # we stop the image processing, but still continue with the program.
        # this way long-running preproc runs can be stopped and partial results can still be used.
        logging.warning("Doing partial JSON writeout after KeyboardInterrupt.")

    logging.info("%d -> %d/%d/%d/%d (input -> output/nogps/skipped/error)",
                 stat_input,
                 stat_output,
                 stat_nogps,
                 stat_input - (stat_output + stat_exceptions),
                 stat_exceptions
                 )
    fill_template(outfile=options.outfile, dtos=dtos)



if __name__ == '__main__':
    myoptions = read_arguments(sys.argv[1:])

    formatter = logging.Formatter('%(asctime)s %(levelname)s: %(message)s')

    stdout = logging.StreamHandler(sys.stdout)
    stdout.setFormatter(formatter)

    logger = logging.getLogger()
    logger.addHandler(stdout)
    logger.setLevel(logging.INFO if not myoptions.verbose else logging.DEBUG)

    main(myoptions)
