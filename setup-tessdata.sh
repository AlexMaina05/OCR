#!/bin/bash
# Script to download Tesseract language data files
# Note: Using tessdata 4.0.0 which is compatible with Tesseract.js v6
# The v6 library can work with v4 language data files

echo "Creating tessdata directory..."
mkdir -p tessdata
cd tessdata

echo "Downloading language training data files..."
echo "  - English (eng)..."
wget -q --show-progress https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/eng.traineddata.gz

echo "  - Italian (ita)..."
wget -q --show-progress https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/ita.traineddata.gz

echo "  - Spanish (spa)..."
wget -q --show-progress https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/spa.traineddata.gz

echo "  - French (fra)..."
wget -q --show-progress https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/fra.traineddata.gz

echo "Uncompressing files..."
gunzip *.gz

echo "Recompressing files (keeping both .gz and uncompressed versions)..."
echo "Note: Tesseract.js expects .gz files for browser loading"
gzip -k *.traineddata

echo "Done! Language data files are ready in tessdata/"
ls -lh
