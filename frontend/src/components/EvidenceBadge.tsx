'use client';

import React from 'react';
import { EvidenceStatus } from '@/types';
import { ShieldCheck, HelpCircle, AlertOctagon } from 'lucide-react';

interface EvidenceBadgeProps {
  status: EvidenceStatus;
  showIcon?: boolean;
  className?: string;
  onClickEvidence?: () => void;
}

export function EvidenceBadge({
  status,
  showIcon = true,
  className = '',
  onClickEvidence,
}: EvidenceBadgeProps) {
  let label = 'Verified';
  let badgeClasses =
    'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800';
  let Icon = ShieldCheck;

  if (status === 'unverified') {
    label = 'Unverified (Leaver Statement)';
    badgeClasses =
      'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800';
    Icon = HelpCircle;
  } else if (status === 'missing_conflicting') {
    label = 'Missing / Conflicting';
    badgeClasses =
      'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800';
    Icon = AlertOctagon;
  }

  return (
    <span
      onClick={onClickEvidence}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm transition-all ${badgeClasses} ${
        onClickEvidence ? 'cursor-pointer hover:opacity-85' : ''
      } ${className}`}
      title={
        status === 'verified'
          ? 'Supported by verified project sources (commits, documents, or tasks)'
          : status === 'unverified'
          ? 'Provided by departing member, not yet independently verified by source evidence'
          : 'Information missing from sources or sources contradict each other'
      }
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{label}</span>
    </span>
  );
}

