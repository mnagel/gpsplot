#! /usr/bin/env python

import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--datafile', default='data/position.txt', type=str)
parser.add_argument('--outfile', default='index.htm', type=str)
parser.add_argument('--infile', default='template.htm', type=str)
parser.add_argument('--length', default=100, type=int)

options = parser.parse_args()    

with open (options.infile, "r") as myfile:
    data=myfile.read() # .replace('\n', '')

# print data

