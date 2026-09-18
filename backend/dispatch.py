"""
AI Fire One - Module 14: Automated Twilio Dispatch
Twilio REST Voice & SMS Emergency Notification Integration
"""

import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from backend.config import settings
from backend.schemas import Coordinates, DispatchTriggerResponse

logger = logging.getLogger("aifireone.dispatch")


def build_emergency_twiml(fire_type: str, lat: float, lon: float, location_name: str = "Industrial Sector") -> str:
    """Generates standard W3C-compliant TwiML XML voice instructions."""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Pause length="1"/>
    <Say voice="Polly.Aditi" language="en-IN">
        Priority Emergency Alert from AI Fire One Disaster Command.
        A verified {fire_type} has been corroborated by satellite and ground optical sensors.
        Coordinates are latitude {lat:.4f}, longitude {lon:.4f}, near {location_name}.
        Immediate response units and containment protocols are requested.
        Press 1 to acknowledge receipt of this dispatch.
    </Say>
    <Gather numDigits="1" action="/api/dispatch/twiml-ack" method="POST">
        <Say voice="Polly.Aditi">Press 1 to confirm dispatch acknowledgement.</Say>
    </Gather>
</Response>"""


def trigger_emergency_voice_call(
    responder_phone: str,
    fire_type: str,
    coordinates: Coordinates,
    responder_name: str = "First Responder Unit",
    simulated: bool = True
) -> DispatchTriggerResponse:
    """
    Triggers automated emergency telephone voice broadcast using Twilio Voice API.
    If real Twilio credentials exist and simulated=False, calls Twilio Client.
    Otherwise, generates verified TwiML payload and logs the dispatch.
    """
    account_sid = settings.twilio_account_sid
    auth_token = settings.twilio_auth_token
    from_phone = settings.twilio_phone_number

    twiml_body = build_emergency_twiml(fire_type, coordinates.latitude, coordinates.longitude)

    has_credentials = bool(
        account_sid and len(account_sid.strip()) > 10 and
        auth_token and len(auth_token.strip()) > 10 and
        from_phone and len(from_phone.strip()) > 3
    )

    if has_credentials and not simulated:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)

            call = client.calls.create(
                to=responder_phone,
                from_=from_phone,
                twiml=twiml_body
            )

            logger.info("Twilio voice call initiated successfully. Call SID: %s", call.sid)
            return DispatchTriggerResponse(
                success=True,
                request_id=call.sid,
                responder_name=responder_name,
                contact_phone=responder_phone,
                communication_method="TWILIO_VOICE_API",
                status="CALL_INITIATED",
                timestamp=datetime.utcnow().isoformat(),
                twiml_preview=twiml_body,
                message=f"Live Twilio voice call placed to {responder_phone} (SID: {call.sid})"
            )

        except Exception as exc:
            logger.error("Twilio Voice API call failed: %s", str(exc))
            return DispatchTriggerResponse(
                success=False,
                request_id=f"ERR-{uuid.uuid4().hex[:10]}",
                responder_name=responder_name,
                contact_phone=responder_phone,
                communication_method="TWILIO_VOICE_API",
                status="FAILED",
                timestamp=datetime.utcnow().isoformat(),
                twiml_preview=twiml_body,
                message=f"Twilio call failure: {str(exc)}"
            )

    # Clearly labeled simulated dispatch for demonstration mode
    sim_id = f"TWILIO-SIM-{uuid.uuid4().hex[:12].upper()}"
    logger.info("Simulated emergency dispatch broadcast generated: %s", sim_id)

    return DispatchTriggerResponse(
        success=True,
        request_id=sim_id,
        responder_name=responder_name,
        contact_phone=responder_phone,
        communication_method="TWILIO_VOICE_SYNTHESIS (SIMULATED)",
        status="DISPATCH_TRANSMITTED_SIMULATED",
        timestamp=datetime.utcnow().isoformat(),
        twiml_preview=twiml_body,
        message=f"Automated Voice Dispatch simulated for {responder_name} at {responder_phone} with valid TwiML payload."
    )
