export const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayKey = () => toDateKey(new Date());

export const addDaysKey = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

export const formatDateLabel = (dateKey?: string) => {
  if (!dateKey) return '未定';
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '未定';
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
};

export const isTodayKey = (dateKey?: string) => dateKey === todayKey();

export const isWithinNextDays = (dateKey: string | undefined, days: number) => {
  if (!dateKey) return false;
  const target = new Date(`${dateKey}T00:00:00`).getTime();
  const start = new Date(`${todayKey()}T00:00:00`).getTime();
  const end = new Date(`${addDaysKey(days)}T00:00:00`).getTime();
  return target >= start && target <= end;
};
