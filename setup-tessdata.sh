#!/bin/bash
# Script to download Tesseract language data files

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

echo "Recompressing files (Tesseract.js expects .gz files)..."
gzip -k *.traineddata

echo "Done! Language data files are ready in tessdata/"
ls -lh
