"""
AI Fire One - Unit Tests: Twilio Dispatch & Voice Generation
"""

import pytest
from backend.dispatch import build_emergency_twiml, trigger_emergency_voice_call
from backend.schemas import Coordinates


def test_build_emergency_twiml():
    twiml = build_emergency_twiml(
        fire_type="Industrial Chemical Fire",
        lat=19.9450,
        lon=73.7380,
        location_name="Ambad MIDC"
    )
    assert "<Response>" in twiml
    assert "</Response>" in twiml
    assert "<Say" in twiml
    assert "Industrial Chemical Fire" in twiml
    assert "19.9450" in twiml
    assert "73.7380" in twiml


def test_trigger_emergency_voice_call_simulated():
    coords = Coordinates(latitude=19.9450, longitude=73.7380)
    resp = trigger_emergency_voice_call(
        responder_phone="+919876543210",
        fire_type="Industrial / Structure Fire",
        coordinates=coords,
        responder_name="Nashik Central Fire Station",
        simulated=True
    )
    assert resp.success is True
    assert "TWILIO-SIM" in resp.request_id
    assert resp.status == "DISPATCH_TRANSMITTED_SIMULATED"
    assert "<Response>" in resp.twiml_preview
