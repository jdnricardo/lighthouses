#!/usr/bin/env python3
import sys
from pathlib import Path

# Add the project root directory to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

import json

import requests

from utils.logger import get_logger

# Initialize logger
logger = get_logger()

# Create data directory if it doesn't exist
data_dir = project_root / "data" / "processed"
data_dir.mkdir(parents=True, exist_ok=True)

# Natural Earth Data URL for UK coastline (1:10m resolution)
url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson"

logger.info("Downloading coastline data...")
response = requests.get(url)
data = response.json()

# Extract UK feature
uk_feature = None
for feature in data["features"]:
    if feature["properties"].get("ADMIN") == "United Kingdom":
        uk_feature = feature
        break

if uk_feature:
    # Create a new GeoJSON with just the UK
    uk_geojson = {"type": "FeatureCollection", "features": [uk_feature]}

    # Save to file
    output_file = data_dir / "uk.json"
    with open(output_file, "w") as f:
        json.dump(uk_geojson, f)
    logger.info(f"UK coastline data saved to {output_file}")
else:
    logger.error("Error: Could not find UK feature in the data")
