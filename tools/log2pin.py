#! /usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import print_function

import argparse
import datetime
import json
import re
import sys

def read_arguments(args):
    parser = argparse.ArgumentParser(prog='log2pin')
    parser.add_argument('--infile', default=None, type=str)
    parser.add_argument('--outfile', default=None, type=str)

    options = parser.parse_args(args)
    return options

def main(options):
    if not options.infile:
        exit("--infile argument is mandatory")
    if not options.outfile:
        exit("--outfile argument is mandatory")

    result = []
    with open(options.infile) as f:
      for line in f:
        exp = "(\d\d-\d\d-\d\d\d\d \d\d\.\d\d) @ (\d+\.\d+),(\d+\.\d+) / (\d+)"
        try:
          match = re.match(exp, line)
          ts = transform(match.group(1), 'date')
          lat = transform(match.group(2), 'float')
          lon = transform(match.group(3), 'float')
          prec = transform(match.group(4), 'float')
          point = {
            'gps': {
                'lat': lat,
                'lon': lon,
                'prec': prec,
                },
            'comment': 'precision is %s' % (prec),
            'timestamp': ts.isoformat(),
          }
          result.append(point)
        except Exception as e:
          print("{} failed with: {}".format(line, e))
    fill_template(outfile=options.outfile, dtos=result)
    print('done. processed %s entries' % (len(result)))

def fill_template(outfile, dtos):
    with open(outfile, "w") as text_file:
        text_file.write("var pin_dtos = {0};".format(json.dumps(dtos, indent=2, separators=(',', ': '))))

def transform(value, transformation):
    if transformation == "float":
        return float(value)
    if transformation == "date":
        dt = datetime.datetime.strptime(value, '%d-%m-%Y %H.%M')
        return dt

if __name__ == '__main__':
    options = read_arguments(sys.argv[1:])
    main(options)
