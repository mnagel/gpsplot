#! /usr/bin/env python

import argparse
import re
import sys

import Image
 
# begin http://www.leancrew.com/all-this/2014/02/photo-locations-with-apple-maps/
# Magic EXIF number.
GPS = 34853

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
  long = degrees(gps[LONG])
  if gps[LONGREF] == 'W':
      long = -long
  return (lat, long)

def get_exif(fn):
	try:
	  # Open the photo file and read the EXIF data.
	  exif = Image.open(fn)._getexif()
	  gps = exif[GPS]
	  return coord_pair(gps)
	except KeyError:
	  print "No GPS data for %s" % fn
	  sys.exit(1)
# end http://www.leancrew.com/all-this/2014/02/photo-locations-with-apple-maps/

print get_exif("data/img/iphone060.jpg")

parser = argparse.ArgumentParser()
parser.add_argument('--template', default='template.htm', type=str)
parser.add_argument('--datafile', default='data/img', type=str)
parser.add_argument('--outfile', default='index.htm', type=str)
parser.add_argument('--length', default=100, type=int)

options = parser.parse_args()    

with open (options.template, "r") as myfile:
    template=myfile.read() # .replace('\n', '')


import os

datanames = []
for subdir, dirs, files in os.walk(options.datafile):
    for file in files:
        datanames.append(os.path.join(subdir, file))

def dataname2dataob(dn):
	result = {
		"file" 	: dn,
		"lat"	: get_exif(dn)[0],
		"lon"	: get_exif(dn)[1],
	}
	return result

def dataob2line(d):
	return 'new pin(%s, %s, %s, %s, %s, "%s", "%s", "%s")' % (
		d["lat"],
		d["lon"],
		"new Date(%s, %s, %s, %s, %s, 0)" % (2011, 12, 03, 14, 30),
		800,
		600,
		d["file"],
		d["file"],
		"comment"
	)

dataobs = map(dataname2dataob, datanames)
lines = map(dataob2line, dataobs)

# result = re.sub('%%MARKERFORDATA%%', '\n'.join(data), template)
result = template.replace('%%MARKERFORDATA%%', ',\n'.join(lines))

with open(options.outfile, "w") as text_file:
    text_file.write(result)
