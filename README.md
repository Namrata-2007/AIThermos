# AI Fire One (SIH 2026 — Problem Statement 162 sponsored by NTRO)

**Evidence-Driven Geospatial Early-Warning & Emergency-Response Pipeline**

---

## 1. Project Overview & Architectural Philosophy

**AI Fire One** is an end-to-end geospatial artificial intelligence platform engineered to detect thermal anomalies globally, correlate satellite data with ground optical camera streams, evaluate safety through a deterministic verification gateway, predict 60-minute fire spread propagation, discover nearby emergency responders, and execute automated multi-agency dispatch.

### Core Architectural Principle
> **"AI does not independently decide that an emergency exists."**

Every emergency response is governed by an evidence-based pipeline:
```
Satellite / Optical Camera Ingestion
           ↓
Normalized Geospatial Data Points
           ↓
Multi-Source Independent Corroboration
           ↓
AI Random Forest Classification
           ↓
Confidence & Historical Baseline Validation
           ↓
Deterministic Safety Verification Gateway
  (ML Conf > 85% + Baseline Corroboration + Multi-Source Evidence)
           ↓
      [VERIFIED EVENT]
           ↓
60-Minute Fire Spread Danger Zone Polygon (Elliptical / Wind Vector)
           ↓
OSM Smart Emergency Responder Discovery (< 75km Radius)
           ↓
Automated Twilio Emergency Voice & Multi-Agency Dispatch
```

---

## 2. Directory Structure

```
.
├── backend/
│   ├── main.py                     # FastAPI application server with all endpoints
│   ├── config.py                   # Pydantic BaseSettings and env loader
│   ├── database.py                 # SQLAlchemy engine and sessionmaker
│   ├── models.py                   # PostGIS ORM schemas (ActiveFire, FirePrediction, etc.)
│   ├── schemas.py                  # Pydantic request and response schemas
│   ├── ingestion.py                # NASA FIRMS pipeline with GeoPandas and Shapely
│   ├── osm_service.py              # OpenStreetMap Overpass spatial querying
│   ├── classifier.py               # Scikit-learn Random Forest fire classifier
│   ├── baseline.py                 # Spatio-temporal baseline clustering and anomaly detection
│   ├── fire_spread.py              # 60-minute forward fire spread elliptical model
│   ├── routing.py                  # Responder discovery, Haversine distancing & smart scoring
│   ├── dispatch.py                 # Twilio emergency voice and TwiML generator
│   ├── camera_processor.py         # OpenCV video downsampler & HSV fire pixel detector
│   ├── global_camera_processor.py  # Nearby camera feed discovery (API + test metadata)
│   ├── verification.py             # Deterministic Safety Verification Gateway
│   ├── requirements.txt            # Python dependencies
│   └── tests/
│       ├── test_ingestion.py       # Ingestion and coordinate boundary tests
│       ├── test_classifier.py      # Random Forest inference tests
│       ├── test_baseline.py        # Baseline clustering and anomaly scoring tests
│       ├── test_routing.py         # Distance and operational radius tests
│       ├── test_fire_spread.py     # Polygon geometry and Shapely tests
│       ├── test_verification.py    # Safety gate deterministic rule tests
│       └── test_dispatch.py        # TwiML structure and simulated call tests
│
├── src/                            # Frontend React 18 + Leaflet + Tailwind CSS
│   ├── components/                 # UI components (Map, Safety Q&A, Location Selector, etc.)
│   ├── data/                       # Global locations hierarchy & spatial benchmarks
│   ├── services/                   # Frontend verification and geocoding engines
│   └── types.ts                    # TypeScript interface definitions
│
├── init_db.sql                     # PostGIS database schema initialization script
├── docker-compose.yml              # Multi-container orchestration (FastAPI + PostGIS + Vite)
├── .env.example                    # Environment variable specification
└── README.md                       # Complete deployment and API manual
```

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

| Variable | Description | Default / Mode |
|---|---|---|
| `NASA_FIRMS_API_KEY` | NASA FIRMS MAP Key for live VIIRS/MODIS | Optional (Benchmark fallback included) |
| `GLOBAL_WEBCAM_API_KEY` | Windy / EarthCam live webcam aggregator key | Optional (Simulated CCTV fallback) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for voice calls | Optional (Simulated audio preview) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Optional |
| `TWILIO_PHONE_NUMBER` | Verified Twilio sender phone number | Optional |
| `DATABASE_URL` | PostgreSQL + PostGIS database connection URL | `postgresql://postgres:postgres@localhost:5432/aifireone` |
| `OVERPASS_URL` | OpenStreetMap Overpass QL endpoint | `https://overpass-api.de/api/interpreter` |
| `DEMO_MODE` | Enable demonstration and benchmark fallback | `true` |
| `SIMULATED_DISPATCH_REGISTRY` | Enable simulated national responder phones | `true` |

---

## 4. Local Development & Installation

### A. Python Backend (FastAPI)

1. Create and activate a Python virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install backend dependencies:
```bash
pip install -r backend/requirements.txt
```

3. Initialize PostgreSQL + PostGIS database:
```bash
psql -U postgres -d aifireone -f init_db.sql
```

4. Launch the FastAPI server:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API Swagger documentation is accessible at: `http://localhost:8000/docs`

5. Run test suite:
```bash
pytest backend/tests/ -v
```

### B. Interactive React Frontend

1. Install frontend dependencies:
```bash
npm install
```

2. Start the development server (configured for Port 3000):
```bash
npm run dev
```
Open browser at: `http://localhost:3000`

---

## 5. Docker Compose Deployment

Run the complete multi-tier system with one command:
```bash
docker compose up --build -d
```

- **Frontend Dashboard**: `http://localhost:3000`
- **FastAPI Backend**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`
- **PostgreSQL / PostGIS**: `localhost:5432`

---

## 6. API Reference & Curl Testing Examples

### 1. Ingest Satellite Points & Trigger Pipeline
```bash
curl -X POST "http://localhost:8000/fires/ingest?source=VIIRS_NOAA21_NRT&days=1"
```

### 2. Retrieve All Active Verified Events
```bash
curl -X GET "http://localhost:8000/fires?status_filter=VERIFIED"
```

### 3. Test Deterministic Verification Gateway Directly
```bash
curl -X POST "http://localhost:8000/fires/verify?latitude=19.9450&longitude=73.7380&ml_confidence=91.4&historical_corroborated=true&camera_confirmed=true&osm_proximity_confirmed=true"
```

### 4. 60-Minute Fire Spread Prediction (Elliptical Wind-Vector Model)
```bash
curl -X POST "http://localhost:8000/fires/FIRE-DEMO-01/predict-spread" \
  -H "Content-Type: application/json" \
  -d '{
    "initial_latitude": 19.9450,
    "initial_longitude": 73.7380,
    "wind_velocity_kmh": 26.5,
    "wind_direction_degrees": 60.0,
    "ambient_temperature": 34.0,
    "relative_humidity": 30.0,
    "frp": 68.0
  }'
```

### 5. Discover Nearby Emergency Responders
```bash
curl -X GET "http://localhost:8000/responders/nearby?latitude=19.9450&longitude=73.7380&radius_km=25.0"
```

### 6. Process Live Video Stream with HSV Fire Pixel Detector
```bash
curl -X POST "http://localhost:8000/camera/process-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "stream_url": "rtsp://simulated-cctv.local/stream/perim_01.sdp",
    "sample_duration_seconds": 5,
    "hsv_threshold": 0.15
  }'
```

### 7. Trigger Emergency Voice Dispatch
```bash
curl -X POST "http://localhost:8000/dispatch/test" \
  -H "Content-Type: application/json" \
  -d '{
    "fire_id": "FIRE-DEMO-01",
    "responder_id": "FS-1092834",
    "responder_phone": "+919876543210",
    "fire_type": "Industrial / Structure Fire",
    "coordinates": {
      "latitude": 19.9450,
      "longitude": 73.7380
    },
    "simulated": true
  }'
```

---

## 7. End-to-End Demo Workflow for Hackathon Jury

1. **Global Location Selection**: Choose Country (*India*) → State (*Maharashtra*) → District (*Nashik*) → Area (*Ambad MIDC*).
2. **Satellite Coordinate Explorer**: Inspect normalized VIIRS NOAA-21 satellite fire point coordinates with FRP, confidence, and brightness.
3. **Ground Camera Corroboration**: View CCTV camera feeds; trigger the HSV downsampled stream processor to inspect fire pixel density.
4. **AI Random Forest Classification**: Inspect probabilities across Wildfire, Industrial Fire, and False Alarm.
5. **Deterministic Safety Verification Gateway**: Validate that all four safety criteria pass (>85% ML confidence, historical persistence, valid coordinates, multi-sensor corroboration).
6. **Fire Spread Danger Polygon**: View the 60-minute projected expansion polygon plotted on the Leaflet map with wind vector orientation.
7. **Emergency Responder Discovery**: Discover nearest fire brigades, burn ICU trauma centers, and police stations with smart suitability scores.
8. **Automated Twilio Dispatch**: Execute automated emergency voice dispatch with live TwiML script generation and audio preview.
9. **Simple-Language Incident Report**: Read multi-lingual incident summaries (English, Hindi, Marathi, etc.) with evacuation perimeters.
10. **Location Safety Q&A Engine**: Query the AI engine ("Is it safe for nearby schools?", "What is the ETA for firefighters?") to receive distance-grounded safety recommendations.
