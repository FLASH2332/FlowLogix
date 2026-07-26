'use client';

import React from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface CarrierRateData {
  orderId: string;
  defaultCarrier: { name: string; costUsd: number; arrival: string };
  recommendedCarrier: { name: string; costUsd: number; arrival: string };
  savingsUsd: number;
  slaMet: boolean;
  message: string;
}

export default function CarrierRateWidget() {
  const theme = useTheme();
  const { getToolOutput, sendFollowUpMessage } = useWidgetSDK();
  const data = getToolOutput<CarrierRateData>();
  const isDark = theme === 'dark';

  if (!data) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: isDark ? '#9ca3af' : '#6b7280', fontFamily: 'Inter, sans-serif' }}>
        <span style={{ fontSize: 32 }}>📦</span>
        <p>Calculating rates...</p>
      </div>
    );
  }

  const cardBg = isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif', background: cardBg,
      borderRadius: 16, padding: 24, maxWidth: 500,
      boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.1)',
      border: `1px solid ${borderColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
        }}>🚚</div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textPrimary }}>Carrier Rate Optimized</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: textMuted }}>Order: {data.orderId}</p>
        </div>
        <div style={{
          marginLeft: 'auto', background: data.slaMet ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: data.slaMet ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700
        }}>
          {data.slaMet ? 'SLA MET' : 'SLA MISSED'}
        </div>
      </div>

      <div style={{
        background: isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.05)',
        border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 16, marginBottom: 12
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700, letterSpacing: 0.5 }}>RECOMMENDED</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: textPrimary }}>${data.recommendedCarrier.costUsd.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary, marginBottom: 4 }}>{data.recommendedCarrier.name}</div>
        <div style={{ fontSize: 13, color: textMuted }}>Est. Arrival: {data.recommendedCarrier.arrival}</div>
      </div>

      <div style={{
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${borderColor}`, borderRadius: 12, padding: 16, marginBottom: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: textMuted, fontWeight: 700, letterSpacing: 0.5 }}>DEFAULT CARRIER</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: textMuted }}>${data.defaultCarrier.costUsd.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: textMuted, marginBottom: 4 }}>{data.defaultCarrier.name}</div>
        <div style={{ fontSize: 13, color: textMuted }}>Est. Arrival: {data.defaultCarrier.arrival}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '0 4px' }}>
        <span style={{ fontSize: 14, color: textPrimary, fontWeight: 500 }}>Total Savings:</span>
        <span style={{ fontSize: 18, color: '#10b981', fontWeight: 800 }}>${data.savingsUsd.toFixed(2)}</span>
      </div>

      <button
        onClick={() => sendFollowUpMessage(`Select ${data.recommendedCarrier.name} for ${data.orderId} and generate shipping label.`)}
        style={{
          width: '100%', padding: '12px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(16,185,129,0.4)', transition: 'opacity 0.2s',
        }}
      >
        Lock in Savings & Ship
      </button>
    </div>
  );
}
