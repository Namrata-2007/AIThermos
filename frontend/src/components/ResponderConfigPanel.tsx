import React, { useState, useEffect } from 'react';
import { Responder, StandardResponderRole } from '../types.ts';
import { 
  Users, 
  Phone, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  ShieldAlert, 
  HeartPulse, 
  Truck, 
  AlertTriangle,
  RotateCcw,
  PhoneCall,
  Loader2
} from 'lucide-react';

interface ResponderConfigPanelProps {
  onRespondersUpdated?: (responders: Responder[]) => void;
}

export const ResponderConfigPanel: React.FC<ResponderConfigPanelProps> = ({ onRespondersUpdated }) => {
  const [responders, setResponders] = useState<Responder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testingLineId, setTestingLineId] = useState<string | null>(null);
  const [testLineNotice, setTestLineNotice] = useState<{ id: string; message: string } | null>(null);

  // Fetch responders on mount
  const loadResponders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/responders');
      const data = await res.json();
      if (data.success && Array.isArray(data.responders)) {
        setResponders(data.responders);
        if (onRespondersUpdated) {
          onRespondersUpdated(data.responders);
        }
      }
    } catch (err: any) {
      console.error('Failed to load responders:', err);
      setErrorMessage('Could not load configured responders from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResponders();
  }, []);

  const formatDisplayPhone = (phone: string): string => {
    const clean = phone.replace(/[\s\-()]/g, '');
    if (clean.startsWith('+91') && clean.length === 13) {
      return `+91 ${clean.slice(3, 8)} ${clean.slice(8)}`;
    }
    if (clean.startsWith('+') && clean.length > 6) {
      return clean.replace(/(\+\d{2,3})(\d{5})(\d+)/, '$1 $2 $3');
    }
    return phone;
  };

  const validateE164 = (phone: string): { isValid: boolean; error?: string; formatted?: string } => {
    const clean = phone.trim().replace(/[\s\-()]/g, '');
    let formatted = clean;
    if (!formatted.startsWith('+')) {
      formatted = `+${formatted}`;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(formatted)) {
      return { 
        isValid: false, 
        error: 'Phone number must be in valid international E.164 format (e.g. +91XXXXXXXXXX).' 
      };
    }
    return { isValid: true, formatted };
  };

  const handleFieldChange = (id: string, field: keyof Responder, value: any) => {
    setResponders(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleSaveIndividual = async (responder: Responder) => {
    setSavingId(responder.id);
    setErrorMessage(null);
    setSaveSuccess(null);

    // Strict E.164 validation before sending
    const validation = validateE164(responder.phoneNumber);
    if (!validation.isValid) {
      setErrorMessage(`${responder.roleLabel}: ${validation.error}`);
      setSavingId(null);
      return;
    }

    try {
      const res = await fetch(`/api/responders/${responder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: responder.name,
          organization: responder.organization,
          phoneNumber: validation.formatted,
          location: responder.location,
          active: responder.active,
          notes: responder.notes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save responder');
      }

      setSaveSuccess(`Saved ${responder.roleLabel} (${validation.formatted})`);
      setTimeout(() => setSaveSuccess(null), 3500);
      loadResponders();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating responder');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    setErrorMessage(null);
    setSaveSuccess(null);

    try {
      for (const r of responders) {
        const val = validateE164(r.phoneNumber);
        if (!val.isValid) {
          throw new Error(`${r.roleLabel}: ${val.error}`);
        }
        const res = await fetch(`/api/responders/${r.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: r.name,
            organization: r.organization,
            phoneNumber: val.formatted,
            location: r.location,
            active: r.active,
            notes: r.notes
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(`Failed on ${r.roleLabel}: ${data.error}`);
        }
      }

      setSaveSuccess('All 5 emergency responder contacts successfully validated and persisted.');
      setTimeout(() => setSaveSuccess(null), 4000);
      loadResponders();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed saving responders');
    } finally {
      setSavingAll(false);
    }
  };

  const handleTestDiagnosticLine = async (responder: Responder) => {
    setTestingLineId(responder.id);
    setTestLineNotice(null);
    try {
      const res = await fetch(`/api/responders/test-call/${responder.id}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Diagnostic test failed');
      }
      setTestLineNotice({
        id: responder.id,
        message: `Diagnostic test call queued (Call ID: ${data.callId}). Check Call Records below for real-time progression.`
      });
      setTimeout(() => setTestLineNotice(null), 7000);
    } catch (err: any) {
      setErrorMessage(`Line test failed: ${err.message}`);
    } finally {
      setTestingLineId(null);
    }
  };

  const getRoleIcon = (role: StandardResponderRole) => {
    switch (role) {
      case 'FIRE_RESCUE':
        return <Flame className="w-5 h-5 text-red-400" />;
      case 'POLICE':
        return <ShieldAlert className="w-5 h-5 text-cyan-400" />;
      case 'HOSPITAL_MEDICAL':
        return <HeartPulse className="w-5 h-5 text-emerald-400" />;
      case 'AMBULANCE':
        return <Truck className="w-5 h-5 text-amber-400" />;
      case 'DISASTER_MANAGEMENT':
        return <AlertTriangle className="w-5 h-5 text-purple-400" />;
    }
  };

  const getRoleBorderColor = (role: StandardResponderRole) => {
    switch (role) {
      case 'FIRE_RESCUE': return 'border-red-500/30 hover:border-red-500/60 bg-red-950/20';
      case 'POLICE': return 'border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-950/20';
      case 'HOSPITAL_MEDICAL': return 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/20';
      case 'AMBULANCE': return 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/20';
      case 'DISASTER_MANAGEMENT': return 'border-purple-500/30 hover:border-purple-500/60 bg-purple-950/20';
    }
  };

  return (
    <div id="responder-config-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Configure 5 Emergency Responders
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                5 Agencies Loaded
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Customize authorized contact numbers. In each incident dispatch, the operator selects exactly 3 out of these 5 responders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="save-all-responders-btn"
            onClick={handleSaveAll}
            disabled={savingAll || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Responders</span>
          </button>
        </div>
      </div>

      {/* Warning / Safety Notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-bold">Safety Compliance Rule: </span>
          Use authorized numbers or clearly labeled test numbers. Do not dial real emergency numbers (101, 108, 112) for tests. Live Mode will dial real telephone numbers via configured carrier.
        </div>
      </div>

      {/* Status Messages */}
      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 5 Responder Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          <span>Loading responder database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {responders.map((resp, index) => {
            const isSavingThis = savingId === resp.id;
            const isTestingThis = testingLineId === resp.id;
            const testNotice = testLineNotice?.id === resp.id ? testLineNotice.message : null;

            return (
              <div 
                key={resp.id}
                id={`responder-card-${resp.id}`}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${getRoleBorderColor(resp.role)}`}
              >
                {/* Agency Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-lg select-none">
                        {resp.role === 'FIRE_RESCUE' ? '🔥' :
                         resp.role === 'POLICE' ? '👮' :
                         resp.role === 'HOSPITAL_MEDICAL' ? '🏥' :
                         resp.role === 'AMBULANCE' ? '🚑' : '🛡'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{resp.roleLabel}</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                          {formatDisplayPhone(resp.phoneNumber)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {resp.id}
                        </div>
                      </div>
                    </div>

                    {/* Active toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                      <input
                        type="checkbox"
                        checked={resp.active}
                        onChange={(e) => handleFieldChange(resp.id, 'active', e.target.checked)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Active</span>
                    </label>
                  </div>

                  {/* Input Fields */}
                  <div className="mt-3 space-y-2.5">
                    {/* Organization / Agency Name */}
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                        Agency / Organization
                      </label>
                      <input
                        type="text"
                        value={resp.organization}
                        onChange={(e) => handleFieldChange(resp.id, 'organization', e.target.value)}
                        placeholder="Organization name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Station / Contact Name */}
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                        Station / Contact Designation
                      </label>
                      <input
                        type="text"
                        value={resp.name}
                        onChange={(e) => handleFieldChange(resp.id, 'name', e.target.value)}
                        placeholder="Duty Station / Commander"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Phone Number Input */}
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-cyan-400" />
                          Phone Number (with Country Code)
                        </span>
                        <span className="text-[9px] text-slate-500">e.g. +91XXXXXXXXXX</span>
                      </label>
                      <input
                        type="text"
                        value={resp.phoneNumber}
                        onChange={(e) => handleFieldChange(resp.id, 'phoneNumber', e.target.value)}
                        placeholder="+919876543210"
                        className="w-full bg-slate-950 font-mono font-bold text-amber-300 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-400 focus:outline-none transition-colors tracking-wide"
                      />
                    </div>

                    {/* Location / Station address */}
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                        Physical Duty Station
                      </label>
                      <input
                        type="text"
                        value={resp.location}
                        onChange={(e) => handleFieldChange(resp.id, 'location', e.target.value)}
                        placeholder="Base Station Address"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Individual Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  {testNotice && (
                    <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-[11px] text-cyan-200 font-mono">
                      {testNotice}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestDiagnosticLine(resp)}
                      disabled={isTestingThis}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
                      title="Test call in simulation mode"
                    >
                      {isTestingThis ? (
                        <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                      ) : (
                        <PhoneCall className="w-3 h-3 text-cyan-400" />
                      )}
                      <span>Test Line</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveIndividual(resp)}
                      disabled={isSavingThis}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-sm"
                    >
                      {isSavingThis ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
