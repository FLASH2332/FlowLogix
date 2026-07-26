'use client';

import React from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface PriorityPickData {
  orderId: string;
  assignedWorker: string;
  zone: string;
  status: string;
  message: string;
}

export default function PriorityPickCard() {
  const theme = useTheme();
  const { getToolOutput, sendFollowUpMessage } = useWidgetSDK();
  const data = getToolOutput<PriorityPickData>();
  const isDark = theme === 'dark';

  if (!data) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: isDark ? '#9ca3af' : '#6b7280', fontFamily: 'Inter, sans-serif' }}>
        <span style={{ fontSize: 32 }}>🚨</span>
        <p>Injecting priority pick...</p>
      </div>
    );
  }

  const cardBg = isDark ? 'linear-gradient(135deg, #2e1010 0%, #1a0808 100%)' : 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)';
  const textPrimary = isDark ? '#f8fafc' : '#881337';
  const textMuted = isDark ? '#fca5a5' : '#e11d48';
  const borderColor = isDark ? 'rgba(244,63,94,0.3)' : 'rgba(225,29,72,0.2)';

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif', background: cardBg,
      borderRadius: 16, padding: 24, maxWidth: 450,
      boxShadow: isDark ? '0 10px 40px rgba(225,29,72,0.2)' : '0 10px 40px rgba(225,29,72,0.1)',
      border: `1px solid ${borderColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, #e11d48, #be123c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          boxShadow: '0 0 15px rgba(225,29,72,0.5)'
        }}>🚨</div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textPrimary, textTransform: 'uppercase' }}>Priority Pick Injected</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: textMuted }}>Stage 4 · Order Picking</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: textMuted, marginBottom: 4, textTransform: 'uppercase' }}>Target Order</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>{data.orderId}</div>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: textMuted, marginBottom: 4, textTransform: 'uppercase' }}>Target Zone</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>{data.zone}</div>
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.15)', padding: 16, borderRadius: 10, marginBottom: 20, borderLeft: '4px solid #f43f5e' }}>
        <div style={{ fontSize: 11, color: textMuted, marginBottom: 4, textTransform: 'uppercase' }}>Worker Interrupted</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, marginBottom: 4 }}>{data.assignedWorker}</div>
        <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.4 }}>{data.message}</div>
      </div>

      <button
        onClick={() => sendFollowUpMessage(`Acknowledge priority pick for ${data.orderId}.`)}
        style={{
          width: '100%', padding: '12px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(225,29,72,0.4)', transition: 'opacity 0.2s',
        }}
      >
        Acknowledge Override
      </button>
    </div>
  );
}
