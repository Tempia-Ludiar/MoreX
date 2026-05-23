export const clampPriority = (priority: number) => Math.min(100, Math.max(1, Math.round(priority)));

export function getPriorityMeta(priority: number) {
  const value = clampPriority(priority);
  if (value >= 90) {
    return {
      label: 'Execute Now',
      color: '#E11D48',
      background: '#FFF1F2',
      border: '#FDA4AF',
      cardBackground: '#FFFBFB',
      cardBorder: '#FB7185',
      shadowOpacity: 0.16,
      elevation: 5,
      lineWidth: 6,
      topBand: true,
    };
  }
  if (value >= 75) {
    return {
      label: 'High Value',
      color: '#EA580C',
      background: '#FFF7ED',
      border: '#FDBA74',
      cardBackground: '#FFFCF8',
      cardBorder: '#FDBA74',
      shadowOpacity: 0.12,
      elevation: 4,
      lineWidth: 5,
      topBand: false,
    };
  }
  if (value >= 50) {
    return {
      label: 'Worth Reviewing',
      color: '#A16207',
      background: '#FEFCE8',
      border: '#FDE68A',
      cardBackground: '#FFFDF2',
      cardBorder: '#FDE68A',
      shadowOpacity: 0.09,
      elevation: 3,
      lineWidth: 4,
      topBand: false,
    };
  }
  if (value >= 25) {
    return {
      label: 'Maybe Later',
      color: '#475569',
      background: '#F1F5F9',
      border: '#CBD5E1',
      cardBackground: '#FFFFFF',
      cardBorder: '#CBD5E1',
      shadowOpacity: 0.06,
      elevation: 2,
      lineWidth: 3,
      topBand: false,
    };
  }
  return {
    label: 'Low Priority',
    color: '#64748B',
    background: '#F8FAFC',
    border: '#E2E8F0',
    cardBackground: '#FFFFFF',
    cardBorder: '#E2E8F0',
    shadowOpacity: 0.04,
    elevation: 1,
    lineWidth: 3,
    topBand: false,
  };
}

const gradientAnchors = [
  '#CBD5E1',
  '#94A3B8',
  '#FDE68A',
  '#FACC15',
  '#FDBA74',
  '#F97316',
  '#FB7185',
  '#E11D48',
];

const hexToRgb = (hex: string) => ({
  r: Number.parseInt(hex.slice(1, 3), 16),
  g: Number.parseInt(hex.slice(3, 5), 16),
  b: Number.parseInt(hex.slice(5, 7), 16),
});

const mix = (from: string, to: string, amount: number) => {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const r = Math.round(start.r + (end.r - start.r) * amount);
  const g = Math.round(start.g + (end.g - start.g) * amount);
  const b = Math.round(start.b + (end.b - start.b) * amount);
  return `rgb(${r}, ${g}, ${b})`;
};

export const priorityGradientStops = Array.from({ length: 96 }, (_, index) => {
  const progress = index / 95;
  const scaled = progress * (gradientAnchors.length - 1);
  const anchorIndex = Math.min(gradientAnchors.length - 2, Math.floor(scaled));
  const localProgress = scaled - anchorIndex;
  return mix(gradientAnchors[anchorIndex], gradientAnchors[anchorIndex + 1], localProgress);
});
