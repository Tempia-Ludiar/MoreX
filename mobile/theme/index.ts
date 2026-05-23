export const colors = {
  bg: '#f5f5f7',
  bgElevated: '#ffffff',
  ink: '#1a1a2e',
  inkSub: '#6b6b80',
  inkMuted: '#9090a0',
  border: 'rgba(20,20,40,0.08)',
  borderStrong: 'rgba(20,20,40,0.12)',
  accent: '#6366f1',
  accentDeep: '#4f46e5',
  accentSoft: '#eef0ff',
  pink: '#e84a6f',
  pinkSoft: '#ffeef1',
  orange: '#ff7a30',
  orangeSoft: '#fff1e6',
  yellow: '#c08020',
  yellowSoft: '#fff8e1',
  green: '#10b981',
  greenSoft: '#e6f9f0',
  purple: '#8b5cf6',
  purpleSoft: '#f3f0ff',
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  pill: 100,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.3 },
  body: { fontSize: 13, fontWeight: '400' as const },
  bodyBold: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 11, fontWeight: '600' as const },
  micro: { fontSize: 10, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.3 },
};

export const shadow = {
  card: {
    shadowColor: '#14142a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  cardSoft: {
    shadowColor: '#14142a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  button: {
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
};
