"use client";

import React, { useState, useEffect } from "react";
import { X, Settings, Check, MessageSquare, Percent } from "lucide-react";
import { fetchCampaignSettings, updateCampaignSettings } from "@/lib/api";

interface CampaignSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const CampaignSettingsModal: React.FC<CampaignSettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [tone, setTone] = useState("HINGLISH");
  const [discount, setDiscount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCampaignSettings()
        .then((res) => {
          setTone(res.campaign_tone);
          setDiscount(res.discount_percent);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateCampaignSettings({
        campaign_tone: tone,
        discount_percent: discount,
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaved();
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Campaign & Dunning Settings</h3>
              <p className="text-xs text-slate-400">Configure messaging tone & dynamic recovery discounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tone Selector */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>Messaging Tone & Persona</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTone("HINGLISH")}
              className={`p-4 rounded-xl border text-left space-y-1 transition-all ${
                tone === "HINGLISH"
                  ? "bg-blue-600/10 border-blue-500 text-slate-100 ring-1 ring-blue-500"
                  : "bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <div className="font-bold text-sm text-blue-400">Hinglish Conversational</div>
              <p className="text-xs text-slate-400 leading-snug">Friendly Indian SaaS persona ("Hii Arjun! Aapka Pro plan renew nahi hua...")</p>
            </button>

            <button
              onClick={() => setTone("FORMAL_ENGLISH")}
              className={`p-4 rounded-xl border text-left space-y-1 transition-all ${
                tone === "FORMAL_ENGLISH"
                  ? "bg-blue-600/10 border-blue-500 text-slate-100 ring-1 ring-blue-500"
                  : "bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <div className="font-bold text-sm text-purple-400">Formal English</div>
              <p className="text-xs text-slate-400 leading-snug">Corporate B2B persona ("Dear Arjun, your payment could not be completed...")</p>
            </button>
          </div>
        </div>

        {/* Discount Incentive Selector */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Percent className="w-4 h-4 text-emerald-400" />
            <span>Dynamic Recovery Discount (24h Urgency Incentive)</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 5, 10, 15].map((pct) => (
              <button
                key={pct}
                onClick={() => setDiscount(pct)}
                className={`py-3 px-2 rounded-xl border font-bold text-sm text-center transition-all ${
                  discount === pct
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {pct === 0 ? "No Discount" : `${pct}% OFF`}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Settings Saved!</span>
              </>
            ) : (
              <span>Save Campaign Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
