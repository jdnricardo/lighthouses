#!/usr/bin/env python3
import requests
import json
import os
from pathlib import Path

# Create data directory if it doesn't exist
Path("web/data").mkdir(parents=True, exist_ok=True)

# Natural Earth Data URL for UK coastline (1:10m resolution)
url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson"

print("Downloading coastline data...")
response = requests.get(url)
data = response.json()

# Extract UK feature
uk_feature = None
for feature in data['features']:
    if feature['properties'].get('ADMIN') == 'United Kingdom':
        uk_feature = feature
        break

if uk_feature:
    # Create a new GeoJSON with just the UK
    uk_geojson = {
        "type": "FeatureCollection",
        "features": [uk_feature]
    }
    
    # Save to file
    with open('web/data/uk.json', 'w') as f:
        json.dump(uk_geojson, f)
    print("UK coastline data saved to web/data/uk.json")
else:
    print("Error: Could not find UK feature in the data") 