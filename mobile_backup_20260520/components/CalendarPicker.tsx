import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { tokens } from '@/constants/tokens';
import { toDateKey } from '@/lib/date';

type Props = {
  value?: string;
  onChange: (dateKey: string) => void;
  countsByDate?: Record<string, number>;
};

const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

export function CalendarPicker({ value, onChange, countsByDate = {} }: Props) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const days = useMemo(() => {
    const firstDay = cursor.getDay();
    const lastDate = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: firstDay }, () => null);
    for (let day = 1; day <= lastDate; day += 1) {
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const moveMonth = (amount: number) => {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.monthButton} onPress={() => moveMonth(-1)}>
          <Text style={styles.monthButtonText}>前</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{cursor.getFullYear()}年 {cursor.getMonth() + 1}月</Text>
        <TouchableOpacity style={styles.monthButton} onPress={() => moveMonth(1)}>
          <Text style={styles.monthButtonText}>次</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
        {days.map((day, index) => {
          const dateKey = day ? toDateKey(day) : '';
          const selected = dateKey === value;
          return (
            <TouchableOpacity
              key={`${dateKey}-${index}`}
              disabled={!day}
              style={[styles.dayCell, selected && styles.dayCellSelected]}
              onPress={() => day && onChange(dateKey)}
            >
              <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day ? day.getDate() : ''}</Text>
              {day && countsByDate[dateKey] ? <Text style={[styles.countText, selected && styles.dayTextSelected]}>{countsByDate[dateKey]}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    gap: tokens.spacing.sm,
    padding: tokens.spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthTitle: {
    color: tokens.color.text,
    fontSize: 14,
    fontWeight: '800',
  },
  monthButton: {
    backgroundColor: tokens.color.surfaceSoft,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 6,
  },
  monthButtonText: {
    color: tokens.color.text,
    fontSize: 12,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekDay: {
    color: tokens.color.mutedText,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
    width: '14.2857%',
  },
  dayCell: {
    alignItems: 'center',
    height: 34,
    borderRadius: tokens.radius.sm,
    justifyContent: 'center',
    width: '14.2857%',
  },
  dayCellSelected: {
    backgroundColor: tokens.color.black,
  },
  dayText: {
    color: tokens.color.text,
    fontSize: 13,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: tokens.color.surface,
  },
  countText: {
    color: tokens.color.mutedText,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 10,
  },
});
