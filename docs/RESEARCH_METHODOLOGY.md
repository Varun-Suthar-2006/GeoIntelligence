# GeoIntelligence AI — Research Methodology

## 1. Methodological Framework
The core research pipeline of GeoIntelligence AI is structured across five sequential stages:

```
[1. Sensor Ingestion & Metadata Normalization]
                     │
                     ▼
[2. Spatial Co-Registration & Radiometric Trimming]
                     │
                     ▼
[3. Deep Siamese Feature Comparison & Baseline Differencing]
                     │
                     ▼
[4. Spectral Transition Classification (NDVI / NDWI / NDBI)]
                     │
                     ▼
[5. Equal-Area Polygonization & Explainability Synthesis]
```

---

## 2. Mathematical Rigor in Geospatial Measurement

A pervasive flaw in naive geospatial applications is calculating ground areas by multiplying degrees of latitude and longitude:
$$\text{Area}_{\text{incorrect}} \neq \Delta\text{lat} \times \Delta\text{lon} \times 111,320^2$$
Because longitudinal distance converges toward the poles as $\cos(\text{latitude})$, planar degree calculations introduce severe distortion (up to 40-60% error at high latitudes).

GeoIntelligence AI enforces **equal-area metric projection**:
Every polygon geometry $G$ in geographic coordinates (EPSG:4326) is projected onto a standard equal-area coordinate reference system (such as **EPSG:6933 — World Cylindrical Equal Area** or appropriate local UTM zones) prior to computing area:
$$G_{\text{proj}} = \mathcal{T}_{\text{EPSG:4326} \to \text{EPSG:6933}}(G)$$
$$\text{Area}_{\text{true}} = \iint_{G_{\text{proj}}} dx \, dy \quad [\text{m}^2]$$
$$\text{Area}_{\text{ha}} = \frac{\text{Area}_{\text{true}}}{10,000}, \quad \text{Area}_{\text{km}^2} = \frac{\text{Area}_{\text{true}}}{1,000,000}$$

---

## 3. Spectral Index Decision Rules
Transition classification does not rely on arbitrary labeling; it evaluates spectral signatures across corresponding bands:
1. **Deforestation / Vegetation Loss**:
   $$\Delta \text{NDVI} = \text{NDVI}_{t_2} - \text{NDVI}_{t_1} < -0.20 \quad \text{where } \text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$$
2. **Flood / Water Inundation**:
   $$\Delta \text{NDWI} = \text{NDWI}_{t_2} - \text{NDWI}_{t_1} > +0.20 \quad \text{where } \text{NDWI} = \frac{\text{Green} - \text{NIR}}{\text{Green} + \text{NIR}}$$
3. **Urban Expansion**:
   Concomitant drop in vegetation with significant increase in built-up index (NDBI) or visible concrete/roof reflectance.
4. **Unclassified Change**:
   Assigned whenever the spectral delta does not cross class significance thresholds, preventing unverified claims.
