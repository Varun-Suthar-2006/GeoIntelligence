import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger("geointelligence.stac_service")

STAC_ENDPOINT = "https://earth-search.aws.element84.com/v1/search"

PRESET_HOTSPOTS = [
    {
        "id": "montpellier",
        "name": "Montpellier, France",
        "category": "Urban Expansion",
        "bbox": [3.840, 43.585, 3.890, 43.626],
        "default_date_range": "2023-01-01T00:00:00Z/2023-12-31T23:59:59Z",
        "description": "Mediterranean urban sprawl, university campus development, and conversion of agricultural garrigue."
    },
    {
        "id": "valencia_flood",
        "name": "Valencia Flood Disaster, Spain",
        "category": "Environmental Disaster / Flooding",
        "bbox": [-0.480, 39.380, -0.320, 39.520],
        "default_date_range": "2024-10-25T00:00:00Z/2024-11-05T23:59:59Z",
        "description": "Historic catastrophic flash flooding following the October 2024 DANA meteorological event."
    },
    {
        "id": "amazon_deforestation",
        "name": "Rondônia Deforestation Arc, Brazil",
        "category": "Deforestation",
        "bbox": [-63.150, -10.050, -62.950, -9.850],
        "default_date_range": "2023-06-01T00:00:00Z/2023-09-30T23:59:59Z",
        "description": "Active fishbone pattern rainforest clear-cutting for cattle ranching and soybean monoculture."
    },
    {
        "id": "dubai_coast",
        "name": "Dubai Coastline & Islands, UAE",
        "category": "Urban Expansion",
        "bbox": [55.100, 25.050, 55.250, 25.200],
        "default_date_range": "2023-01-01T00:00:00Z/2023-12-31T23:59:59Z",
        "description": "Large-scale artificial island engineering (Palm Jumeirah) and continuous desert coastline expansion."
    },
    {
        "id": "lake_mead",
        "name": "Lake Mead Reservoir, Nevada/Arizona",
        "category": "Water Depletion",
        "bbox": [-114.550, 36.050, -114.350, 36.250],
        "default_date_range": "2023-05-01T00:00:00Z/2023-08-31T23:59:59Z",
        "description": "Colorado River basin drought, receding shorelines, and exposed reservoir bathtub rings."
    },
    {
        "id": "sf_bay",
        "name": "San Francisco Bay Wetlands, USA",
        "category": "Wetland Dynamics",
        "bbox": [-122.350, 37.450, -122.100, 37.650],
        "default_date_range": "2023-04-01T00:00:00Z/2023-07-31T23:59:59Z",
        "description": "South Bay salt evaporation pond tidal restoration and urban peninsula growth."
    }
]

def search_stac_scenes(
    bbox: List[float],
    datetime_range: str = "2023-01-01T00:00:00Z/2023-12-31T23:59:59Z",
    max_cloud_cover: float = 15.0,
    limit: int = 6
) -> List[Dict[str, Any]]:
    """
    Directly queries AWS Earth Search STAC API for genuine Sentinel-2 Level-2A imagery
    covering any coordinates on Earth.
    """
    payload = {
        "collections": ["sentinel-2-l2a"],
        "bbox": bbox,
        "datetime": datetime_range,
        "query": {
            "eo:cloud_cover": {"lt": max_cloud_cover}
        },
        "limit": limit
    }

    try:
        with httpx.Client(timeout=25.0) as client:
            resp = client.post(STAC_ENDPOINT, json=payload)
            if resp.status_code != 200:
                logger.error(f"STAC search API failed with status {resp.status_code}: {resp.text}")
                return []

            data = resp.json()
            features = data.get("features", [])
            results = []

            for f in features:
                props = f.get("properties", {})
                assets = f.get("assets", {})
                geom = f.get("geometry", {})

                # Extract preview/thumbnail URLs
                thumb_href = None
                if "thumbnail" in assets:
                    thumb_href = assets["thumbnail"].get("href")
                elif "visual" in assets:
                    thumb_href = assets["visual"].get("href")

                # Extract band URLs
                bands = {}
                for b_name in ["blue", "green", "red", "nir", "swir16", "swir22"]:
                    if b_name in assets:
                        bands[b_name] = assets[b_name].get("href")

                results.append({
                    "id": f.get("id"),
                    "datetime": props.get("datetime"),
                    "cloud_cover": round(float(props.get("eo:cloud_cover", 0.0)), 2),
                    "platform": props.get("platform", "Sentinel-2"),
                    "grid_code": props.get("grid:code"),
                    "sun_elevation": round(float(props.get("view:sun_elevation", 0.0)), 2),
                    "thumbnail_url": thumb_href,
                    "visual_url": assets.get("visual", {}).get("href"),
                    "bbox": f.get("bbox", bbox),
                    "geometry": geom,
                    "bands": bands
                })

            return results
    except Exception as e:
        logger.error(f"Error querying STAC API: {e}")
        return []

def get_preset_hotspots() -> List[Dict[str, Any]]:
    """Returns curated Earth observation research hotspots with pre-configured coordinates."""
    return PRESET_HOTSPOTS
