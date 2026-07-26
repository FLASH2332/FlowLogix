'use client';

import React from 'react';
import { useWidgetSDK, useWidgetState, useTheme } from '@nitrostack/widgets';

interface WarehouseHealthData {
  status: 'RED' | 'AMBER' | 'GREEN';
  activeAlerts: string[];
  metrics: {
    dockUtilization: string;
    inboundProcessing: string;
    outboundShipping: string;
  };
  lastUpdated: string;
}

const STATUS_CONFIG: Record<'RED' | 'AMBER' | 'GREEN', { bg: string; border: string; label: string; icon: string; glow: string }> = {
  RED: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', label: 'CRITICAL', icon: '🔴', glow: 'rgba(239,68,68,0.35)' },
  AMBER: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', label: 'WARNING', icon: '🟡', glow: 'rgba(245,158,11,0.35)' },
  GREEN: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', label: 'HEALTHY', icon: '🟢', glow: 'rgba(16,185,129,0.35)' },
};

export default function WarehouseHealthSummary() {
  const theme = useTheme();
  const { getToolOutput, sendFollowUpMessage } = useWidgetSDK();
  const [state, setState] = useWidgetState<{ expanded: boolean }>(() => ({ expanded: true }));

  const data = getToolOutput<WarehouseHealthData>();
  const isDark = theme === 'dark';

  if (!data) {
    return (
      <div style={{
        padding: 24, textAlign: 'center',
        color: isDark ? '#9ca3af' : '#6b7280',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <span style={{ fontSize: 32 }}>🏭</span>
        <p>Loading warehouse master data...</p>
      </div>
    );
  }

  const config = STATUS_CONFIG[data.status];
  const cardBg = isDark
    ? 'linear-gradient(135deg, #1e2533 0%, #111827 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';

  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textMuted = isDark ? '#9ca3af' : '#6b7280';
  const surfaceBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      background: cardBg,
      borderRadius: 16,
      padding: 24,
      maxWidth: 520,
      boxShadow: isDark
        ? '0 8px 32px rgba(0,0,0,0.4)'
        : '0 8px 32px rgba(0,0,0,0.12)',
      border: `1px solid ${borderColor}`,
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `linear-gradient(135deg, ${config.border}, transparent)`,
            backgroundColor: surfaceBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            boxShadow: `0 0 15px ${config.glow}`
          }}></div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textPrimary }}>
              Warehouse Master Status
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: textMuted }}>
              FlowLogix Overview
            </p>
          </div>
        </div>
        <div style={{
          background: config.bg, border: `1px solid ${config.border}`,
          borderRadius: 8, padding: '4px 10px',
          color: config.border, fontWeight: 'bold', fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          {config.icon} {config.label}
        </div>
      </div>

      {/* ── Alerts ── */}
      {data.activeAlerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 12, color: textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Alerts</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.activeAlerts.map((alert, idx) => (
              <div key={idx} style={{
                background: 'rgba(239,68,68,0.08)',
                borderLeft: '4px solid #ef4444',
                padding: '10px 12px',
                borderRadius: '0 8px 8px 0',
                fontSize: 13,
                color: textPrimary
              }}>
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Metrics ── */}
      <h4 style={{ margin: '0 0 8px', fontSize: 12, color: textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Key Metrics</h4>
      <div style={{
        background: surfaceBg, borderRadius: 10, padding: '12px 16px',
        border: `1px solid ${borderColor}`, marginBottom: 16,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <div style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>Dock Util.</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>{data.metrics.dockUtilization}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>Inbound</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: data.metrics.inboundProcessing === 'Delayed' ? '#ef4444' : textPrimary }}>{data.metrics.inboundProcessing}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>Outbound</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: data.metrics.outboundShipping === 'Delayed' ? '#ef4444' : textPrimary }}>{data.metrics.outboundShipping}</div>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          id="btn-replan-putaway"
          onClick={() =>
            sendFollowUpMessage(`Check the persistent memory rules, then ask the Floor Operations Agent to handle the delayed truck TRK-882 and replan putaway.`)
          }
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
            transition: 'opacity 0.2s',
          }}
        >
           Delegate to Floor Ops
        </button>
        <button
          id="btn-supply-chain-delegate"
          onClick={() =>
            sendFollowUpMessage(`Ask the Supply Chain Agent to address the damaged freight at Dock 2.`)
          }
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(109,40,217,0.35)',
            transition: 'opacity 0.2s',
          }}
        >
           Delegate to Supply Chain
        </button>
      </div>

      <p style={{ margin: '16px 0 0', fontSize: 11, color: textMuted, textAlign: 'center' }}>
        Last Updated {new Date(data.lastUpdated).toLocaleString()}
      </p>
    </div>
  );
}
