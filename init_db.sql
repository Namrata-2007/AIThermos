-- ==========================================================
-- AI Fire One - PostgreSQL + PostGIS Schema Initialization
-- Smart India Hackathon 2026 - Problem Statement 162 (NTRO)
-- ==========================================================

-- Enable PostGIS spatial extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS dispatch_logs CASCADE;
DROP TABLE IF EXISTS fire_predictions CASCADE;
DROP TABLE IF EXISTS responder_registry CASCADE;
DROP TABLE IF EXISTS active_fires CASCADE;

-- 1. Active Fire Events Table with PostGIS Geometry
CREATE TABLE active_fires (
    id VARCHAR(64) PRIMARY KEY,
    source VARCHAR(32) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fire_class VARCHAR(64),
    confidence DOUBLE PRECISION NOT NULL,
    frp DOUBLE PRECISION NOT NULL,
    brightness_temperature DOUBLE PRECISION,
    historical_persistence DOUBLE PRECISION,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'DETECTED',
    industrial_distance_m DOUBLE PRECISION,
    country VARCHAR(64),
    region VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index on fire point coordinates
CREATE INDEX idx_active_fires_geom ON active_fires USING GIST (geom);
CREATE INDEX idx_active_fires_status ON active_fires (verification_status);
CREATE INDEX idx_active_fires_detected ON active_fires (detected_at);

-- Trigger to automatically synchronize point geometry from lat/lon
CREATE OR REPLACE FUNCTION update_fire_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_active_fires_geom
BEFORE INSERT OR UPDATE ON active_fires
FOR EACH ROW EXECUTE FUNCTION update_fire_geom();


-- 2. Fire Spread Predictions Table (60-minute danger-zone polygons)
CREATE TABLE fire_predictions (
    id VARCHAR(64) PRIMARY KEY,
    fire_id VARCHAR(64) NOT NULL REFERENCES active_fires(id) ON DELETE CASCADE,
    predicted_polygon_geojson TEXT NOT NULL,
    polygon_geom GEOMETRY(Polygon, 4326),
    horizon_minutes INTEGER DEFAULT 60,
    wind_velocity_kmh DOUBLE PRECISION NOT NULL,
    wind_direction_degrees DOUBLE PRECISION NOT NULL,
    ambient_temperature DOUBLE PRECISION NOT NULL,
    relative_humidity DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fire_predictions_geom ON fire_predictions USING GIST (polygon_geom);
CREATE INDEX idx_fire_predictions_fire_id ON fire_predictions (fire_id);


-- 3. Emergency Responder Registry Table
CREATE TABLE responder_registry (
    id VARCHAR(64) PRIMARY KEY,
    osm_id VARCHAR(64),
    responder_type VARCHAR(32) NOT NULL, -- 'fire_station', 'hospital', 'police'
    name VARCHAR(128) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    phone VARCHAR(32),
    phone_source VARCHAR(32),
    availability VARCHAR(32) DEFAULT 'AVAILABLE',
    country VARCHAR(64),
    region VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_responder_geom ON responder_registry USING GIST (geom);
CREATE INDEX idx_responder_type ON responder_registry (responder_type);

CREATE TRIGGER trg_responder_geom
BEFORE INSERT OR UPDATE ON responder_registry
FOR EACH ROW EXECUTE FUNCTION update_fire_geom();


-- 4. Emergency Dispatch Communication Logs Table
CREATE TABLE dispatch_logs (
    id VARCHAR(64) PRIMARY KEY,
    fire_id VARCHAR(64) NOT NULL REFERENCES active_fires(id) ON DELETE CASCADE,
    responder_id VARCHAR(64) NOT NULL,
    communication_method VARCHAR(32) NOT NULL, -- 'TWILIO_VOICE', 'TWILIO_SMS', 'WEBHOOK'
    twilio_request_id VARCHAR(64),
    status VARCHAR(32) NOT NULL, -- 'INITIATED', 'DELIVERED', 'FAILED', 'ACKNOWLEDGED'
    twiml_payload TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    error TEXT
);

CREATE INDEX idx_dispatch_fire_id ON dispatch_logs (fire_id);
CREATE INDEX idx_dispatch_status ON dispatch_logs (status);
