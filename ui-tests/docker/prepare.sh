#!/bin/bash
set -e

yarn install --frozen-lockfile

echo Will run 'wait-for-it' $*
$(dirname $0)/wait-for-it.sh $*
