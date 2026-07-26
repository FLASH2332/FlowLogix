'use client';

import React from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface LaborReallocationData {
  from: string;
  to: string;
  countReallocated: number;
  status: string;
  message: string;
}

export default function LaborReallocationCard() {
  const theme = useTheme();
  const { getToolOutput, sendFollowUpMessage } = useWidgetSDK();
  const data = getToolOutput<LaborReallocationData>();
  const isDark = theme === 'dark';

  if (!data) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: isDark ? '#9ca3af' : '#6b7280', fontFamily: 'Inter, sans-serif' }}>
        <span style={{ fontSize: 32 }}>👥</span>
        <p>Reallocating workforce...</p>
      </div>
    );
  }

  const cardBg = isDark ? 'linear-gradient(135deg, #2e1a3b 0%, #1e1029 100%)' : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)';
  const textPrimary = isDark ? '#f8fafc' : '#4c1d95';
  const textMuted = isDark ? '#c084fc' : '#7e22ce';
  const borderColor = isDark ? 'rgba(168,85,247,0.3)' : 'rgba(147,51,234,0.2)';

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif', background: cardBg,
      borderRadius: 16, padding: 24, maxWidth: 450,
      boxShadow: isDark ? '0 10px 40px rgba(147,51,234,0.2)' : '0 10px 40px rgba(147,51,234,0.1)',
      border: `1px solid ${borderColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          boxShadow: '0 0 15px rgba(168,85,247,0.4)'
        }}>👥</div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textPrimary }}>Labor Reallocated</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: textMuted }}>Stage 6 · Workforce Management</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ textAlign: 'center', flex: 1, background: 'rgba(0,0,0,0.05)', padding: '12px 8px', borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: textMuted, textTransform: 'uppercase', marginBottom: 4 }}>From</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>{data.from}</div>
        </div>
        
        <div style={{ flex: '0 0 60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 18, color: '#a855f7', fontWeight: 800, marginBottom: 4 }}>{data.countReallocated}</div>
          <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }} />
          <div style={{ fontSize: 20 }}>➔</div>
        </div>

        <div style={{ textAlign: 'center', flex: 1, background: 'rgba(0,0,0,0.05)', padding: '12px 8px', borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: textMuted, textTransform: 'uppercase', marginBottom: 4 }}>To</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>{data.to}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(168,85,247,0.1)', borderRadius: 8, color: textPrimary, fontSize: 13, marginBottom: 20 }}>
        {data.message}
      </div>

      <button
        onClick={() => sendFollowUpMessage(`Acknowledge labor shift from ${data.from} to ${data.to}.`)}
        style={{
          width: '100%', padding: '12px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(147,51,234,0.4)', transition: 'opacity 0.2s',
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
