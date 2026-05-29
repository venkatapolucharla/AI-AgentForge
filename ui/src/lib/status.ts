import type { AgentStatus, LogLevel } from '../types';

interface StatusStyle {
  label: string;
  /** Left/full border colour utility */
  border: string;
  /** Small status dot colour */
  dot: string;
  /** Text colour for the status label */
  text: string;
  /** Soft background tint */
  chipBg: string;
}

export const STATUS_STYLES: Record<AgentStatus, StatusStyle> = {
  idle: {
    label: 'Idle',
    border: 'border-slate-700',
    dot: 'bg-slate-500',
    text: 'text-slate-400',
    chipBg: 'bg-slate-700/40',
  },
  awaiting: {
    label: 'Awaiting confirmation',
    border: 'border-amber-400',
    dot: 'bg-amber-400 animate-pulseSoft',
    text: 'text-amber-300',
    chipBg: 'bg-amber-400/10',
  },
  running: {
    label: 'Running',
    border: 'border-sky-400',
    dot: 'bg-sky-400 animate-pulseSoft',
    text: 'text-sky-300',
    chipBg: 'bg-sky-400/10',
  },
  complete: {
    label: 'Complete',
    border: 'border-emerald-500',
    dot: 'bg-emerald-500',
    text: 'text-emerald-300',
    chipBg: 'bg-emerald-500/10',
  },
  failed: {
    label: 'Failed',
    border: 'border-red-500',
    dot: 'bg-red-500',
    text: 'text-red-300',
    chipBg: 'bg-red-500/10',
  },
};

export const LOG_LEVEL_COLOR: Record<LogLevel, string> = {
  info: 'text-slate-300',
  success: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
};

export function now(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
