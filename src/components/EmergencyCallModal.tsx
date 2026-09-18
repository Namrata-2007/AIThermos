import React, { useState, useEffect } from 'react';
import { 
  EmergencyCallSession, 
  EmergencyCallRecipient, 
  ResponderRole, 
  CallConnectionState 
} from '../types.ts';
import { 
  playEmergencyAlertChime, 
  speakDispatchAudio, 
  stopDispatchAudio 
} from '../services/emergencyCallingService.ts';
import { 
  Phone, 
  PhoneCall, 
  PhoneForwarded, 
  Flame, 
  HeartPulse, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Clock, 
  CheckCircle2, 
  Radio, 
  AlertOctagon, 
  MapPin, 
  Truck, 
  X, 
  Share2, 
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface EmergencyCallModalProps {
  session: EmergencyCallSession;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledgeCall?: (role: ResponderRole | 'ALL') => void;
}

export const EmergencyCallModal: React.FC<EmergencyCallModalProps> = ({
  session,
  isOpen,
  onClose,
  onAcknowledgeCall
}) => {
  const [activeSession, setActiveSession] = useState<EmergencyCallSession>(session);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeVoiceRole, setActiveVoiceRole] = useState<ResponderRole | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [selectedChannelRole, setSelectedChannelRole] = useState<ResponderRole>('FIRE_FIGHTERS');

  // Keep activeSession updated when prop changes
  useEffect(() => {
    setActiveSession(session);
  }, [session]);

  // When modal opens, play dispatch radio chime & simulate calling connection progression
  useEffect(() => {
    if (!isOpen) {
      stopDispatchAudio();
      setIsSpeaking(false);
      return;
    }

    playEmergencyAlertChime();
    setCallDuration(0);

    // Simulated network connection progression for realism
    const ringTimer = setTimeout(() => {
      setActiveSession(prev => ({
        ...prev,
        channels: {
          fireFighters: { ...prev.channels.fireFighters, connectionState: 'RINGING' },
          doctors: { ...prev.channels.doctors, connectionState: 'RINGING' },
          police: { ...prev.channels.police, connectionState: 'RINGING' }
        }
      }));
    }, 1200);

    const connectTimer = setTimeout(() => {
      setActiveSession(prev => ({
        ...prev,
        channels: {
          fireFighters: { ...prev.channels.fireFighters, connectionState: 'TRANSMITTING_DISPATCH' },
          doctors: { ...prev.channels.doctors, connectionState: 'TRANSMITTING_DISPATCH' },
          police: { ...prev.channels.police, connectionState: 'TRANSMITTING_DISPATCH' }
        }
      }));

      // Automatically speak the primary fire dispatch notification
      const combinedSpeech = `Emergency Alert! ${session.detectedFireType} detected. Satellite FRP ${session.frp} Megawatts. Direct emergency calls dispatched to Fire Brigade, Doctors Burn ICU, and Police Evacuation Wing.`;
      speakDispatchAudio(
        combinedSpeech, 
        () => setIsSpeaking(true), 
        () => setIsSpeaking(false)
      );
    }, 2800);

    // Increment call timer
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(ringTimer);
      clearTimeout(connectTimer);
      clearInterval(interval);
      stopDispatchAudio();
    };
  }, [isOpen, session.sessionId]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSpeakRole = (role: ResponderRole) => {
    const channel = role === 'FIRE_FIGHTERS' 
      ? activeSession.channels.fireFighters 
      : role === 'DOCTORS_EMS' 
        ? activeSession.channels.doctors 
        : activeSession.channels.police;

    setActiveVoiceRole(role);
    speakDispatchAudio(
      channel.speechAudioTranscript,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        setActiveVoiceRole(null);
      }
    );
  };

  const handleStopSpeech = () => {
    stopDispatchAudio();
    setIsSpeaking(false);
    setActiveVoiceRole(null);
  };

  const handleAcknowledge = (role: ResponderRole | 'ALL') => {
    const now = new Date().toISOString();
    setActiveSession(prev => {
      const next = { ...prev };
      if (role === 'ALL' || role === 'FIRE_FIGHTERS') {
        next.channels.fireFighters.connectionState = 'ACKNOWLEDGED';
        next.channels.fireFighters.acknowledgedAt = now;
      }
      if (role === 'ALL' || role === 'DOCTORS_EMS') {
        next.channels.doctors.connectionState = 'ACKNOWLEDGED';
        next.channels.doctors.acknowledgedAt = now;
      }
      if (role === 'ALL' || role === 'POLICE_COMMAND') {
        next.channels.police.connectionState = 'ACKNOWLEDGED';
        next.channels.police.acknowledgedAt = now;
      }

      if (
        next.channels.fireFighters.connectionState === 'ACKNOWLEDGED' &&
        next.channels.doctors.connectionState === 'ACKNOWLEDGED' &&
        next.channels.police.connectionState === 'ACKNOWLEDGED'
      ) {
        next.overallStatus = 'ALL_ACKNOWLEDGED';
      }
      return next;
    });

    if (onAcknowledgeCall) {
      onAcknowledgeCall(role);
    }
  };

  const channelList: { role: ResponderRole; channel: EmergencyCallRecipient; icon: typeof Flame; color: string; bg: string; borderColor: string }[] = [
    {
      role: 'FIRE_FIGHTERS',
      channel: activeSession.channels.fireFighters,
      icon: Flame,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    },
    {
      role: 'DOCTORS_EMS',
      channel: activeSession.channels.doctors,
      icon: HeartPulse,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    },
    {
      role: 'POLICE_COMMAND',
      channel: activeSession.channels.police,
      icon: ShieldAlert,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30'
    }
  ];

  const currentChannel = activeSession.channels[
    selectedChannelRole === 'FIRE_FIGHTERS' ? 'fireFighters' : selectedChannelRole === 'DOCTORS_EMS' ? 'doctors' : 'police'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-red-500/40 rounded-2xl w-full max-w-5xl shadow-2xl shadow-red-950/50 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Top Emergency Alert Header */}
        <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-950 p-4 border-b border-red-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-red-600 shadow-lg shadow-red-600/30 border border-red-400/50">
              <PhoneCall className="w-6 h-6 text-white animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-mono font-bold tracking-wider animate-pulse flex items-center gap-1">
                  <Radio className="w-3 h-3 text-red-400" />
                  AUTOMATED EMERGENCY CALL SYSTEM ACTIVE
                </span>
                {activeSession.isAutoTriggered && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-semibold">
                    AUTO-DISPATCHED ON FIRE DETECTION
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5 tracking-tight flex items-center gap-2">
                {activeSession.detectedFireType}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-0.5 font-mono">
                <span className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {activeSession.locationName} {activeSession.facilityName ? `• ${activeSession.facilityName}` : ''}
                </span>
                <span className="text-amber-300 font-bold">FRP: {activeSession.frp} MW</span>
                <span className="text-slate-400">Temp: {activeSession.brightnessTemperature} K</span>
                <span className="text-red-400 font-bold">Cordon: {activeSession.evacuationPerimeterMeters}m</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono">
              <span className="text-[10px] text-slate-400">CALL DURATION</span>
              <span className="text-sm font-bold text-amber-400">{formatTimer(callDuration)}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Hotline Window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Simultaneous Call Channels Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-3.5 bg-slate-950/90 border-b border-slate-800">
          {channelList.map(({ role, channel, icon: Icon, color, bg, borderColor }) => {
            const isSelected = selectedChannelRole === role;
            const isAck = channel.connectionState === 'ACKNOWLEDGED';
            const isConnected = channel.connectionState === 'CONNECTED' || channel.connectionState === 'TRANSMITTING_DISPATCH';

            return (
              <div
                key={role}
                onClick={() => setSelectedChannelRole(role)}
                className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? `${bg} ${borderColor} ring-2 ring-amber-500/40 shadow-lg` 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${bg} ${borderColor} border`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {channel.title}
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {channel.hotlineShortCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 truncate max-w-[190px]">
                        {channel.departmentName}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator Pill */}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                    isAck 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : isConnected 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}>
                    {channel.connectionState}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <a
                    href={`tel:${channel.contactNumber.replace(/[^0-9+]/g, '')}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-semibold"
                    title="Direct Dial Phone Number"
                  >
                    <Phone className="w-3 h-3" />
                    {channel.contactNumber}
                  </a>
                  <span className="text-slate-400 font-mono">ETA ~{channel.etaMinutes}m</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Channel Detail & Voice Transmission View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Audio Transmission HUD */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="relative p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-2">
                    Automated Voice Call Dispatch Feed
                    {isSpeaking && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Direct automated hotline transmission tailored for <strong className="text-white">{currentChannel.title}</strong>
                  </p>
                </div>
              </div>

              {/* TTS Speech Controls */}
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <button
                    onClick={handleStopSpeech}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-500/40 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Mute Voice Broadcast</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSpeakRole(selectedChannelRole)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Play Dispatch Audio</span>
                  </button>
                )}

                <button
                  onClick={playEmergencyAlertChime}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 cursor-pointer"
                  title="Test Alert Chime Tone"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Audio Waveform Animation when transmitting */}
            <div className="flex items-center justify-center gap-1 h-8 bg-slate-950/80 rounded-lg border border-slate-800/80 px-4">
              {[4, 8, 14, 22, 12, 18, 24, 16, 20, 26, 12, 8, 16, 24, 18, 10, 6, 14, 22, 8].map((height, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isSpeaking 
                      ? 'bg-amber-400 animate-pulse' 
                      : 'bg-slate-700'
                  }`}
                  style={{ 
                    height: isSpeaking ? `${Math.max(4, (height * (Math.sin(callDuration * 2 + i) + 1.2)) % 28)}px` : '4px' 
                  }}
                />
              ))}
            </div>

            {/* Spoken Transcript Box */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-amber-200/90 leading-relaxed">
              <span className="text-slate-500 select-none mr-2 font-bold">[VOICE TRANSMISSION]:</span>
              "{currentChannel.speechAudioTranscript}"
            </div>
          </div>

          {/* Operational Directives Tailored to Fire Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Left: Fire-Type Specific Operational Directives */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <AlertOctagon className="w-3.5 h-3.5 text-orange-400" />
                  Tactical Response Protocol ({currentChannel.title})
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30 font-mono">
                  {activeSession.fireCategory.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-2">
                {currentChannel.fireTypeDirectives.map((directive, index) => (
                  <div key={index} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold text-amber-400 shrink-0 font-mono">
                      {index + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-snug">
                      {directive}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Specialized Responder Fleet & Command Details */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                Deployed Unit & Command Fleet
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[11px]">Specialized Division:</div>
                  <div className="font-bold text-white">{currentChannel.specializedUnit}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[11px]">Assigned Officer / Lead Commander:</div>
                  <div className="font-bold text-amber-300 font-mono">{currentChannel.assignedOfficer}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-slate-400 text-[11px]">Active Fleet Dispatched:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentChannel.responseFleet.map((unit, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-mono">
                        {unit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <a
              href={`tel:${currentChannel.contactNumber.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Direct Dial {currentChannel.contactNumber}</span>
            </a>

            <button
              onClick={() => handleAcknowledge(selectedChannelRole)}
              disabled={currentChannel.connectionState === 'ACKNOWLEDGED'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {currentChannel.connectionState === 'ACKNOWLEDGED' 
                  ? 'Channel Acknowledged' 
                  : `Confirm ${currentChannel.title} Receipt`}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAcknowledge('ALL')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledge All 3 Emergency Agencies</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
