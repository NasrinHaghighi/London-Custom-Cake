'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CalendarView from './CalendarView.tsx';
import OperationsView from './OperationsView.tsx';
import { useOrders } from '@/hooks/useOrders';

function monthStart(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthEnd(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function weekStartMonday(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0=Mon
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekIdForDate(date: Date) {
  const w = weekStartMonday(date);
  return `${w.getFullYear()}-${String(w.getMonth() + 1).padStart(2, '0')}-${String(w.getDate()).padStart(2, '0')}`;
}

export default function CalendarContainer() {
  const search = useSearchParams();
  const router = useRouter();
  const initial = (search.get('mode') as 'calendar' | 'list' | null) || 'calendar';
  const [mode, setMode] = useState<'calendar' | 'list'>(initial || 'calendar');

  const [monthDate, setMonthDate] = useState<Date>(() => new Date());

  const start = useMemo(() => monthStart(monthDate), [monthDate]);
  const end = useMemo(() => monthEnd(monthDate), [monthDate]);

  const from = useMemo(() => start.toISOString(), [start]);
  const to = useMemo(() => end.toISOString(), [end]);

  const { data: orders = [], isLoading, error } = useOrders({ from, to, page: 1, limit: 100 });

  // build weeks for the month (Mon-Sun)
  const weeks = useMemo(() => {
    const weeksArr: { id: string; start: Date; end: Date }[] = [];
    const firstWeekStart = weekStartMonday(start);
    let cursor = new Date(firstWeekStart);
    while (cursor <= end) {
      const s = new Date(cursor);
      const e = new Date(cursor);
      e.setDate(e.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      weeksArr.push({ id: weekIdForDate(s), start: new Date(s), end: new Date(e) });
      cursor.setDate(cursor.getDate() + 7);
    }
    return weeksArr;
  }, [start, end]);

  // default expanded week: if viewing current month, expand week that contains today
  const today = useMemo(() => new Date(), []);
  const isCurrentMonth = monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth();
  const defaultWeekId = isCurrentMonth ? weekIdForDate(today) : null;
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(defaultWeekId);

  useEffect(() => {
    // when month changes, reset expanded week per rules
    if (isCurrentMonth) {
      setExpandedWeekId(defaultWeekId);
    } else {
      setExpandedWeekId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthDate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') !== mode) {
      params.set('mode', mode);
      const url = `${window.location.pathname}?${params.toString()}`;
      router.replace(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const goPrevMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('calendar')}
            className={`px-3 py-2 rounded-md font-medium ${mode === 'calendar' ? 'bg-gray-800 text-white' : 'bg-white border'}`}>
            Calendar
          </button>
          <button
            onClick={() => setMode('list')}
            className={`px-3 py-2 rounded-md font-medium ${mode === 'list' ? 'bg-gray-800 text-white' : 'bg-white border'}`}>
            Operations
          </button>
        </div>
      </div>

      <div>
        {mode === 'calendar' ? (
          <CalendarView
            monthDate={monthDate}
            weeks={weeks}
            orders={orders}
            isLoading={isLoading}
            error={error}
            expandedWeekId={expandedWeekId}
            onToggleWeek={(id: string) => setExpandedWeekId((prev) => (prev === id ? null : id))}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
          />
        ) : (
          <OperationsView orders={orders} isLoading={isLoading} error={error} />
        )}
      </div>
    </div>
  );
}
