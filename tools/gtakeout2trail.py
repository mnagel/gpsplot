from __future__ import print_function

import argparse
import json
import sys
from datetime import datetime


def read_arguments(args):
    parser = argparse.ArgumentParser(prog='gtakeout2trail')
    parser.add_argument('--infile', default="../data/takeout.location.json", type=str)
    parser.add_argument('--outfile', default="../data/trail.js", type=str)
    options = parser.parse_args(args)
    return options


def main(options):
    with open(options.infile) as json_file:
        json_data = json.load(json_file)

    json_data = json_data["locations"]

    locations = [
        {
            "ts": datetime.fromtimestamp(1e-3 * int(location["timestampMs"], 10)),
            "lat": location["latitudeE7"] * 1e-7,
            "lon": location["longitudeE7"] * 1e-7,
        } for location in json_data
    ]

    with open(options.outfile, 'w') as result:
        result.write("""
        var trail = [
        // timestamp, lat, lon
        """)

        for location in locations:
            result.write(
                'new TrailElement(new Date("%s"), %f, %f, "%s"),\n'
                % (location["ts"].isoformat(), location["lat"], location["lon"], "gtimeline")
            )

        result.write("""
        ]
        """)

    print("processed %d elements from takeout" % len(locations))


if __name__ == '__main__':
    tmp = read_arguments(sys.argv[1:])
    main(tmp)
