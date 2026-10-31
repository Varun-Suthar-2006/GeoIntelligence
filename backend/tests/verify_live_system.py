import httpx
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"
client = httpx.Client(timeout=30.0)

def test_live_system():
    print("--- 1. Testing GET /datasets ---")
    r = client.get(f"{BASE_URL}/datasets")
    assert r.status_code == 200, f"Datasets failed: {r.text}"
    datasets = r.json()
    print(f"Retrieved {len(datasets)} datasets: {[d['name'] for d in datasets]}")

    print("\n--- 2. Testing GET /images ---")
    r = client.get(f"{BASE_URL}/images")
    assert r.status_code == 200, f"Images failed: {r.text}"
    images = r.json()
    print(f"Retrieved {len(images)} satellite images: {[img['filename'] for img in images]}")
    assert len(images) >= 2, "Expected at least 2 seeded images"

    print("\n--- 3. Testing GET /models ---")
    r = client.get(f"{BASE_URL}/models")
    assert r.status_code == 200, f"Models failed: {r.text}"
    models = r.json()
    print(f"Retrieved {len(models)} AI models: {[m['model_name'] for m in models]}")

    earlier = images[0]
    later = images[1]
    siamese = next(m for m in models if "Siamese" in m["architecture"])

    print(f"\n--- 4. Executing Change Detection: {earlier['filename']} vs {later['filename']} using {siamese['model_name']} ---")
    payload = {
        "title": "Toulouse Multi-Temporal Deforestation & Land Use Analysis",
        "earlier_image_id": earlier["id"],
        "later_image_id": later["id"],
        "model_id": siamese["id"],
        "threshold": 0.45,
        "min_area_m2": 150.0,
        "apply_spectral_classification": True
    }
    r = client.post(f"{BASE_URL}/analysis/change-detection", json=payload)
    assert r.status_code == 200, f"Change detection failed: {r.text}"
    analysis = r.json()
    print(f"Analysis ID: {analysis['id']}, Status: {analysis['status']}")
    assert analysis["status"] == "COMPLETED", f"Analysis did not complete: {analysis}"
    
    res = analysis["results"][0]
    print(f"Detected Change Type: {res['change_type']}")
    print(f"Measured Affected Area: {res['area_hectares']} ha ({res['area_sq_km']} km², {res['area_sq_meters']} m²)")
    print(f"Relative Scene Change: {res['change_percentage']}%")
    print(f"Delineated Contours: {res['polygon_count']} polygons")
    print(f"Class Breakdown (ha): {json.dumps(res['class_breakdown'], indent=2)}")

    print("\n--- 5. Testing GET /analysis/{id}/geojson ---")
    r = client.get(f"{BASE_URL}/analysis/{analysis['id']}/geojson")
    assert r.status_code == 200, f"GeoJSON failed: {r.text}"
    geojson = r.json()
    print(f"GeoJSON Type: {geojson['type']}, Features Count: {len(geojson['features'])}")
    if len(geojson["features"]) > 0:
        first_feat = geojson["features"][0]
        print(f"Sample Polygon Properties: {first_feat['properties']}")

    print("\n--- 6. Testing POST /reports/generate ---")
    r = client.post(f"{BASE_URL}/reports/generate", json={"analysis_id": analysis["id"], "title": "Scientific EO Research Report"})
    assert r.status_code == 200, f"Report generation failed: {r.text}"
    report = r.json()
    print(f"Report ID: {report['id']}, PDF Path: {report['report_path']}")

    print("\n--- 7. Testing GET /dashboard/overview ---")
    r = client.get(f"{BASE_URL}/dashboard/overview")
    assert r.status_code == 200, f"Dashboard failed: {r.text}"
    dash = r.json()
    print(f"Dashboard Stats: Total Analyses: {dash['total_analyses']}, Total Images: {dash['total_images']}, Total Changed Area: {dash['total_area_analyzed_ha']} ha, Polygons: {dash['total_change_polygons']}")

    print("\n=======================================================")
    print("ALL LIVE END-TO-END PIPELINES VERIFIED SUCCESSFULLY!")
    print("=======================================================")

if __name__ == "__main__":
    test_live_system()
