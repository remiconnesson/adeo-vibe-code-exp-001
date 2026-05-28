"use client";

import { useState, useCallback, useMemo } from "react";
import { Demo } from "../Demo";

type DateRange = { start: Date | null; end: Date | null };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(day: Date, range: DateRange) {
  if (!range.start || !range.end) return false;
  const t = day.getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatShort(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function getPresets(): { label: string; range: () => DateRange }[] {
  const today = startOfDay(new Date());
  return [
    { label: "Today", range: () => ({ start: today, end: today }) },
    { label: "Last 7 days", range: () => ({ start: addDays(today, -6), end: today }) },
    { label: "Last 30 days", range: () => ({ start: addDays(today, -29), end: today }) },
    { label: "This month", range: () => ({ start: new Date(today.getFullYear(), today.getMonth(), 1), end: today }) },
    {
      label: "Last month",
      range: () => {
        const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const e = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: s, end: e };
      },
    },
  ];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-based
  const daysInMonth = getDaysInMonth(year, month);
  const days: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function PeriodPickerWidget() {
  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [selecting, setSelecting] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  const days = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const presets = useMemo(getPresets, []);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const handleDayClick = useCallback(
    (day: Date) => {
      if (!selecting || !range.start) {
        setRange({ start: day, end: null });
        setSelecting(true);
      } else {
        const start = range.start;
        if (day.getTime() < start.getTime()) {
          setRange({ start: day, end: start });
        } else {
          setRange({ start, end: day });
        }
        setSelecting(false);
      }
    },
    [selecting, range.start],
  );

  const handlePreset = useCallback((r: DateRange) => {
    setRange(r);
    setSelecting(false);
    if (r.start) {
      setViewMonth(r.start.getMonth());
      setViewYear(r.start.getFullYear());
    }
  }, []);

  // Compute display range including hover
  const displayRange: DateRange = useMemo(() => {
    if (selecting && range.start && hoveredDay) {
      const s = range.start;
      if (hoveredDay.getTime() < s.getTime()) return { start: hoveredDay, end: s };
      return { start: s, end: hoveredDay };
    }
    return range;
  }, [selecting, range, hoveredDay]);

  return (
    <div style={{ display: "flex", gap: 0, border: "1px solid var(--color-border-primary, #e4e4e4)", borderRadius: 12, overflow: "hidden", background: "var(--color-background-primary, #fff)" }}>
      {/* Presets sidebar */}
      <div style={{ width: 160, borderRight: "1px solid var(--color-border-primary, #e4e4e4)", padding: "16px 0", display: "flex", flexDirection: "column", gap: 2, background: "var(--color-background-secondary, #fafafa)" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary, #6e6e6e)", padding: "0 16px 8px" }}>Presets</span>
        {presets.map((p) => {
          const pr = p.range();
          const active = range.start && range.end && pr.start && pr.end && isSameDay(range.start, pr.start) && isSameDay(range.end, pr.end);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p.range())}
              style={{
                display: "block",
                width: "100%",
                padding: "8px 16px",
                border: "none",
                background: active ? "var(--color-brand, #46a610)" : "transparent",
                color: active ? "#fff" : "var(--color-text-primary, #1c1c1c)",
                fontSize: 13,
                textAlign: "left",
                cursor: "pointer",
                fontWeight: active ? 600 : 400,
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Calendar */}
      <div style={{ padding: 16, minWidth: 300 }}>
        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button type="button" onClick={prevMonth} className="mc-button mc-button--s mc-button--bordered" style={{ padding: "4px 8px", minWidth: 0 }}>
            <span className="mc-button__label">{"<"}</span>
          </button>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button type="button" onClick={nextMonth} className="mc-button mc-button--s mc-button--bordered" style={{ padding: "4px 8px", minWidth: 0 }}>
            <span className="mc-button__label">{">"}</span>
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, textAlign: "center" }}>
          {DAY_LABELS.map((d) => (
            <span key={d} style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary, #6e6e6e)", padding: "4px 0", letterSpacing: "0.04em" }}>
              {d}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
          {days.map((day, i) => {
            if (!day) return <span key={`empty-${i}`} />;

            const isToday = isSameDay(day, today);
            const isStart = displayRange.start ? isSameDay(day, displayRange.start) : false;
            const isEnd = displayRange.end ? isSameDay(day, displayRange.end) : false;
            const inRange = isInRange(day, displayRange);
            const isEdge = isStart || isEnd;

            let bg = "transparent";
            let color = "var(--color-text-primary, #1c1c1c)";
            let fontWeight = 400;
            let borderRadius = "0";

            if (isEdge) {
              bg = "var(--color-brand, #46a610)";
              color = "#fff";
              fontWeight = 600;
              borderRadius = isStart && isEnd ? "8px" : isStart ? "8px 0 0 8px" : "0 8px 8px 0";
            } else if (inRange) {
              bg = "var(--color-brand-lightest, #e8f5e1)";
              color = "var(--color-text-primary, #1c1c1c)";
            }

            if (isToday && !isEdge) {
              fontWeight = 700;
            }

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => selecting && setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: 36,
                  border: "none",
                  background: bg,
                  color,
                  fontWeight,
                  fontSize: 13,
                  cursor: "pointer",
                  borderRadius,
                  position: "relative",
                  outline: isToday && !isEdge ? "2px solid var(--color-brand, #46a610)" : "none",
                  outlineOffset: -2,
                }}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        {/* Selected range display */}
        <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--color-background-secondary, #fafafa)", borderRadius: 8, fontSize: 13, color: "var(--color-text-secondary, #6e6e6e)", textAlign: "center" }}>
          {range.start && range.end ? (
            <span>
              <strong style={{ color: "var(--color-text-primary, #1c1c1c)" }}>{formatShort(range.start)}</strong>
              {" \u2192 "}
              <strong style={{ color: "var(--color-text-primary, #1c1c1c)" }}>{formatShort(range.end)}</strong>
            </span>
          ) : range.start ? (
            <span>Select end date...</span>
          ) : (
            <span>Click a day to start</span>
          )}
        </div>
      </div>
    </div>
  );
}

const CODE = `import { PeriodPicker } from "@/components/PeriodPicker";

function MyForm() {
  const [range, setRange] = useState({ start: null, end: null });
  return (
    <PeriodPicker
      value={range}
      onChange={setRange}
      presets={["today", "last7", "last30", "thisMonth", "lastMonth"]}
    />
  );
}`;

export default function PeriodPickerDemo() {
  return (
    <Demo
      title="Period Picker"
      description="Single widget for selecting a date range. Click a start date, then click an end date. Includes quick presets for common periods."
      code={CODE}
    >
      <PeriodPickerWidget />
    </Demo>
  );
}
