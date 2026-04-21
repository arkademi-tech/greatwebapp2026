import React from 'react';

type BadgeColor = 'blue' | 'green' | 'red' | 'amber' | 'grey';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  dot?: boolean;
}

const styles: Record<BadgeColor, { bg: string; text: string; dot: string }> = {
  blue:  { bg: '#EFF6FF', text: '#2563EB', dot: '#2563EB' },
  green: { bg: '#F0FDF4', text: '#16A34A', dot: '#16A34A' },
  red:   { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626' },
  amber: { bg: '#FFFBEB', text: '#D97706', dot: '#D97706' },
  grey:  { bg: '#F1F5F9', text: '#64748B', dot: '#64748B' },
};

export function Badge({ children, color = 'grey', dot }: BadgeProps) {
  const s = styles[color];
  return (
    <span
      style={{ background: s.bg, color: s.text }}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: s.dot }}
        />
      )}
      {children}
    </span>
  );
}
