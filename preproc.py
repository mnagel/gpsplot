#! /usr/bin/env python

import argparse
import re

parser = argparse.ArgumentParser()
parser.add_argument('--template', default='template.htm', type=str)
parser.add_argument('--datafile', default='data/position.txt', type=str)
parser.add_argument('--outfile', default='index.htm', type=str)
parser.add_argument('--length', default=100, type=int)

options = parser.parse_args()    

with open (options.template, "r") as myfile:
    template=myfile.read() # .replace('\n', '')

with open (options.datafile, "r") as myfile:
    data=myfile.read() # .replace('\n', '')
data = [s for s in data.splitlines()]
data = data[:options.length]

def transformline(line):
	return line + '\\n\\'

data = map(transformline, data)
data[-1] = data[-1][:-3]
print data

# result = re.sub('%%MARKERFORDATA%%', '\n'.join(data), template)
result = template.replace('%%MARKERFORDATA%%', '\n'.join(data))

with open(options.outfile, "w") as text_file:
    text_file.write(result)
