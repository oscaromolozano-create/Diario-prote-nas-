import React, { useMemo, useState } from 'react';
import { MEALS, formatGrams, round2 } from '../data/foods';
import { FoodRecord, MedRecord, SettingsRecord } from '../types';
import {
  formatShortDate,
  formatShortWeekday,
  getDatesRangeEndingOn,
  getDayMedicationSummary,
  getDayProteinStats,
} from '../utils/storage';

interface ChartTabProps {
  todayISO: string;
  selectedDate: string;
  foods: FoodRecord[];
  meds: MedRecord[];
  settings: SettingsRecord;
  onSelectDate: (dateISO: string) => void;
}

export const ChartTab: React.FC<ChartTabProps> = ({
  todayISO,
  selectedDate,
  foods,
  meds,
  settings,
  onSelectDate,
}) => {
  const [daysCount, setDaysCount] = useState<7 | 14 | 30>(7);

  const daySeries = useMemo(() => {
    const dates = getDatesRangeEndingOn(todayISO, daysCount);
    return dates.map((dateISO) => {
      const protein = getDayProteinStats(dateISO, foods, settings);
      const med = getDayMedicationSummary(dateISO, meds, settings.pauta);
      const hasFoods = protein.dayFoods.length > 0;
      let medStatus: 'all' | 'pending' | 'none' = 'none';
      if (med.totalCount > 0) {
        medStatus = med.takenCount === med.totalCount ? 'all' : 'pending';
      }
      return {
        dateISO,
        total: protein.total,
        byMeal: protein.byMeal,
        hasFoods,
        overLimit: protein.total > settings.limit,
        medTaken: med.takenCount,
        medTotal: med.totalCount,
        medStatus,
      };
    });
  }, [todayISO, daysCount, foods, meds, settings]);

  // Statistics over registered days in the selected window
  const stats = useMemo(() => {
    const registeredProteinDays = daySeries.filter((d) => d.hasFoods);
    const registeredCount = registeredProteinDays.length;
    const totalProteinSum = registeredProteinDays.reduce((acc, d) => acc + d.total, 0);
    const avgProtein = registeredCount > 0 ? round2(totalProteinSum / registeredCount) : 0;
    const withinLimitCount = registeredProteinDays.filter((d) => !d.overLimit).length;

    let medTotalAll = 0;
    let medTakenAll = 0;
    for (const d of daySeries) {
      if (d.hasFoods || d.medTaken > 0 || d.dateISO === todayISO) {
        medTotalAll += d.medTotal;
        medTakenAll += d.medTaken;
      }
    }
    const medPct = medTotalAll > 0 ? Math.round((medTakenAll / medTotalAll) * 100) : null;

    return {
      registeredCount,
      avgProtein,
      withinLimitCount,
      medPct,
      medTakenAll,
      medTotalAll,
    };
  }, [daySeries, todayISO]);

  const maxDataVal = Math.max(...daySeries.map((d) => d.total), 0);
  const yMax = Math.max(settings.limit * 1.2, maxDataVal * 1.15, 36);
  const warnBottomPct = (settings.warn / yMax) * 100;
  const limitBottomPct = (settings.limit / yMax) * 100;

  return (
    <div className="space-y-6">
      {/* Chart Card */}
      <section
        aria-label="Gráfica de evolución"
        className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-950 dark:text-white">
              Evolución diaria
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Toca cualquier barra para abrir ese día
            </p>
          </div>

          {/* 7 / 14 / 30 days selector */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            {([7, 14, 30] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDaysCount(n)}
                className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  daysCount === n
                    ? 'bg-emerald-900 dark:bg-emerald-700 text-white shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                {n} días
              </button>
            ))}
          </div>
        </div>

        {/* Reference lines legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-red-600 dark:bg-red-400 inline-block" aria-hidden="true" />
            <span>Máximo ({formatGrams(settings.limit)} g)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-4 h-0 border-t-2 border-dashed border-amber-600 dark:border-amber-400 inline-block"
              aria-hidden="true"
            />
            <span>Aviso ({formatGrams(settings.warn)} g)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" aria-hidden="true" />
            <span>Medicación completa</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" aria-hidden="true" />
            <span>Medicación pendiente</span>
          </span>
        </div>

        {/* Chart Area */}
        <div className="overflow-x-auto pb-1">
          <div
            className={`relative pt-7 ${
              daysCount === 7
                ? 'w-full'
                : daysCount === 14
                ? 'min-w-[540px] sm:min-w-full'
                : 'min-w-[920px]'
            }`}
          >
            {/* Plot Area with horizontal threshold lines */}
            <div className="relative h-56 border-b border-neutral-300 dark:border-neutral-700 flex items-end gap-1 sm:gap-2 px-1">
              {/* Dashed amber warning line */}
              <div
                style={{ bottom: `${warnBottomPct}%` }}
                className="absolute left-0 right-0 border-t-2 border-dashed border-amber-600/85 dark:border-amber-400/85 pointer-events-none z-10"
                aria-hidden="true"
              >
                <span className="absolute right-1 -top-4 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-white/85 dark:bg-neutral-900/85 px-1 rounded">
                  {formatGrams(settings.warn)} g
                </span>
              </div>

              {/* Solid red maximum line */}
              <div
                style={{ bottom: `${limitBottomPct}%` }}
                className="absolute left-0 right-0 border-t-2 border-red-600 dark:border-red-400 pointer-events-none z-10"
                aria-hidden="true"
              >
                <span className="absolute right-1 -top-4 text-[10px] font-bold text-red-700 dark:text-red-400 bg-white/85 dark:bg-neutral-900/85 px-1 rounded">
                  {formatGrams(settings.limit)} g
                </span>
              </div>

              {/* Bars */}
              {daySeries.map((day) => {
                const isSelected = day.dateISO === selectedDate;
                const barHeightPct = Math.min((day.total / yMax) * 100, 100);
                return (
                  <button
                    key={day.dateISO}
                    type="button"
                    onClick={() => onSelectDate(day.dateISO)}
                    aria-label={`${day.dateISO}: ${formatGrams(day.total)} gramos`}
                    className={`group relative flex-1 h-full flex flex-col justify-end items-center rounded-t-lg transition-colors cursor-pointer px-0.5 ${
                      isSelected
                        ? 'bg-emerald-900/10 dark:bg-emerald-500/15 ring-1 ring-emerald-800/40 dark:ring-emerald-400/40'
                        : 'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    {/* Value above bar */}
                    <span
                      style={{ bottom: `calc(${barHeightPct}% + 4px)` }}
                      className={`absolute text-[10px] sm:text-[11px] font-condensed font-bold tabular-nums leading-none whitespace-nowrap z-20 ${
                        day.overLimit
                          ? 'text-red-700 dark:text-red-400'
                          : day.total > 0
                          ? 'text-neutral-800 dark:text-neutral-200'
                          : 'text-neutral-400 dark:text-neutral-600'
                      }`}
                    >
                      {day.total > 0 ? formatGrams(day.total) : '0'}
                    </span>

                    {/* Stacked Bar */}
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className="w-full max-w-[34px] flex flex-col-reverse rounded-t-sm overflow-hidden transition-all z-20"
                    >
                      {MEALS.map((meal) => {
                        const mealG = day.byMeal[meal.id]?.grams || 0;
                        if (mealG <= 0 || day.total <= 0) return null;
                        const segPct = (mealG / day.total) * 100;
                        return (
                          <div
                            key={meal.id}
                            style={{
                              height: `${segPct}%`,
                              backgroundColor: meal.colorHex,
                            }}
                            className="w-full"
                          />
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* X-axis dates + medication dots */}
            <div className="flex items-start gap-1 sm:gap-2 px-1 pt-2">
              {daySeries.map((day) => {
                const isSelected = day.dateISO === selectedDate;
                return (
                  <button
                    key={day.dateISO}
                    type="button"
                    onClick={() => onSelectDate(day.dateISO)}
                    className="flex-1 flex flex-col items-center gap-1 cursor-pointer py-0.5"
                  >
                    <span
                      className={`text-[10px] leading-tight tabular-nums ${
                        isSelected
                          ? 'font-bold text-emerald-900 dark:text-emerald-400'
                          : 'font-medium text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {daysCount === 7
                        ? formatShortWeekday(day.dateISO)
                        : formatShortDate(day.dateISO)}
                    </span>
                    {daysCount === 7 && (
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 tabular-nums leading-none">
                        {formatShortDate(day.dateISO)}
                      </span>
                    )}
                    <span
                      title={
                        day.medStatus === 'all'
                          ? `Medicación completa (${day.medTaken}/${day.medTotal})`
                          : day.medStatus === 'pending'
                          ? `Medicación pendiente (${day.medTaken}/${day.medTotal})`
                          : 'Sin medicación programada'
                      }
                      className={`w-2.5 h-2.5 rounded-full mt-0.5 ${
                        day.medStatus === 'all'
                          ? 'bg-emerald-600 dark:bg-emerald-500'
                          : day.medStatus === 'pending'
                          ? 'bg-amber-500 dark:bg-amber-400'
                          : 'border border-neutral-300 dark:border-neutral-600 bg-transparent'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Meal Colors Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
          {MEALS.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-xs inline-block"
                style={{ backgroundColor: m.colorHex }}
                aria-hidden="true"
              />
              <span>{m.label}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Statistics Strip */}
      <section aria-label="Estadísticas del periodo" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Media en días registrados
          </div>
          <div className="font-condensed text-3xl font-extrabold text-neutral-950 dark:text-white mt-1">
            {stats.registeredCount > 0 ? `${formatGrams(stats.avgProtein)} g` : '—'}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
            {stats.registeredCount} {stats.registeredCount === 1 ? 'día con comidas' : 'días con comidas'}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Días sin pasarse
          </div>
          <div className="font-condensed text-3xl font-extrabold text-emerald-900 dark:text-emerald-400 mt-1">
            {stats.registeredCount > 0
              ? `${stats.withinLimitCount} / ${stats.registeredCount}`
              : '0 / 0'}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Por debajo de {formatGrams(settings.limit)} g
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Medicación tomada
          </div>
          <div className="font-condensed text-3xl font-extrabold text-neutral-950 dark:text-white mt-1">
            {stats.medPct !== null ? `${stats.medPct}%` : '—'}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
            {stats.medTotalAll > 0
              ? `${stats.medTakenAll} de ${stats.medTotalAll} tomas`
              : 'Sin pauta configurada'}
          </div>
        </div>
      </section>
    </div>
  );
};
