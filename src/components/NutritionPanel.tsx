import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Pill,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { MEALS, formatGrams, parseDecimalInput } from '../data/foods';
import { MealId, SettingsRecord } from '../types';

interface NutritionPanelProps {
  total: number;
  status: 'ok' | 'warn' | 'over';
  statusLabel: string;
  diffFromLimit: number;
  byMeal: Record<MealId, { grams: number; count: number }>;
  settings: SettingsRecord;
  medTaken: number;
  medTotal: number;
  onUpdateLimits: (warn: number, limit: number) => void;
  onSelectMeal: (meal: MealId) => void;
  onOpenMedication: () => void;
}

export const NutritionPanel: React.FC<NutritionPanelProps> = ({
  total,
  status,
  statusLabel,
  diffFromLimit,
  byMeal,
  settings,
  medTaken,
  medTotal,
  onUpdateLimits,
  onSelectMeal,
  onOpenMedication,
}) => {
  const [editingLimits, setEditingLimits] = useState(false);
  const [warnInput, setWarnInput] = useState(String(settings.warn).replace('.', ','));
  const [limitInput, setLimitInput] = useState(String(settings.limit).replace('.', ','));
  const [limitError, setLimitError] = useState('');

  const openEditor = () => {
    setWarnInput(String(settings.warn).replace('.', ','));
    setLimitInput(String(settings.limit).replace('.', ','));
    setLimitError('');
    setEditingLimits(true);
  };

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseDecimalInput(warnInput);
    const l = parseDecimalInput(limitInput);
    if (!Number.isFinite(w) || w < 0) {
      setLimitError('Introduce un valor de aviso válido (0 o superior).');
      return;
    }
    if (!Number.isFinite(l) || l <= 0) {
      setLimitError('Introduce un límite máximo válido mayor que 0.');
      return;
    }
    if (w > l) {
      setLimitError('El aviso no puede ser mayor que el límite máximo.');
      return;
    }
    onUpdateLimits(w, l);
    setEditingLimits(false);
  };

  // Scale domain so 25g, 30g and current total all fit proportionally
  const scaleMax = Math.max(settings.limit * 1.15, total * 1.05, 1);
  const warnPct = Math.min((settings.warn / scaleMax) * 100, 100);
  const limitPct = Math.min((settings.limit / scaleMax) * 100, 100);

  const statusStyles = {
    ok: {
      text: 'text-emerald-800 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-300 dark:border-emerald-800',
      Icon: CheckCircle2,
    },
    warn: {
      text: 'text-amber-800 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-300 dark:border-amber-800',
      Icon: AlertTriangle,
    },
    over: {
      text: 'text-red-800 dark:text-red-300',
      bg: 'bg-red-50 dark:bg-red-950/60',
      border: 'border-red-300 dark:border-red-800',
      Icon: AlertOctagon,
    },
  }[status];

  const StatusIcon = statusStyles.Icon;

  return (
    <section
      aria-label="Resumen nutricional del día"
      className="bg-white dark:bg-neutral-900 border-[3px] border-neutral-950 dark:border-neutral-200 rounded-xl overflow-hidden"
    >
      {/* Nutrition Label Header */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2 border-b-[6px] border-neutral-950 dark:border-neutral-200">
        <div>
          <h1 className="font-condensed text-2xl sm:text-[26px] font-extrabold tracking-tight leading-none text-neutral-950 dark:text-white">
            Resumen de Proteínas
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            Aviso {formatGrams(settings.warn)} g · Límite máx. {formatGrams(settings.limit)} g/día
          </p>
        </div>

        <button
          type="button"
          onClick={editingLimits ? () => setEditingLimits(false) : openEditor}
          className="min-h-[44px] px-3 flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          {editingLimits ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
          <span>{editingLimits ? 'Cerrar' : 'Límites'}</span>
        </button>
      </div>

      {/* Inline Limits Editor */}
      {editingLimits && (
        <form
          onSubmit={handleSaveLimits}
          className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800/80 border-b-2 border-neutral-950 dark:border-neutral-200 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Aviso desde (g)
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={warnInput}
                onChange={(e) => setWarnInput(e.target.value)}
                className="mt-1 w-full min-h-[44px] px-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 text-base font-semibold tabular-nums text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-emerald-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Límite máximo (g)
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                className="mt-1 w-full min-h-[44px] px-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 text-base font-semibold tabular-nums text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-emerald-500"
              />
            </label>
          </div>
          {limitError && (
            <p className="text-xs font-medium text-red-700 dark:text-red-400">{limitError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingLimits(false)}
              className="min-h-[44px] px-4 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-lg bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
            >
              Guardar límites
            </button>
          </div>
        </form>
      )}

      {/* Big Protein Readout + Status */}
      <div className="px-4 py-3.5 border-b border-neutral-300 dark:border-neutral-700">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-2">
            <span className="font-condensed text-5xl sm:text-[54px] font-extrabold leading-none tracking-tight text-neutral-950 dark:text-white">
              {formatGrams(total)}
            </span>
            <span className="font-condensed text-xl font-bold text-neutral-600 dark:text-neutral-400">
              g / {formatGrams(settings.limit)} g máx.
            </span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border ${statusStyles.bg} ${statusStyles.border} ${statusStyles.text} flex items-center gap-2`}
          >
            <StatusIcon className="w-4 h-4 shrink-0" />
            <div className="leading-tight">
              <div className="text-xs font-bold">{statusLabel}</div>
              <div className="text-xs font-medium tabular-nums">
                {diffFromLimit >= 0
                  ? `Quedan ${formatGrams(diffFromLimit)} g`
                  : `Te pasas ${formatGrams(Math.abs(diffFromLimit))} g`}
              </div>
            </div>
          </div>
        </div>

        {/* Stacked Horizontal Bar with 25g & 30g Markers */}
        <div className="mt-4">
          <div className="relative h-6 w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-950 dark:border-neutral-400 rounded-sm overflow-visible">
            <div className="h-full w-full flex overflow-hidden rounded-[1px]">
              {MEALS.map((meal) => {
                const grams = byMeal[meal.id]?.grams || 0;
                if (grams <= 0) return null;
                const widthPct = (grams / scaleMax) * 100;
                return (
                  <div
                    key={meal.id}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: meal.colorHex,
                    }}
                    title={`${meal.label}: ${formatGrams(grams)} g`}
                    className="h-full transition-all duration-200 border-r border-white/40 dark:border-black/30 last:border-r-0"
                  />
                );
              })}
            </div>

            {/* Warning Marker */}
            <div
              style={{ left: `${warnPct}%` }}
              className="absolute -top-1 -bottom-1 w-0.5 border-l-2 border-dashed border-amber-600 dark:border-amber-400 pointer-events-none"
              aria-hidden="true"
            />
            {/* Maximum Limit Marker */}
            <div
              style={{ left: `${limitPct}%` }}
              className="absolute -top-1.5 -bottom-1.5 w-0.5 bg-red-600 dark:bg-red-400 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          <div className="relative h-5 mt-1 text-[11px] font-semibold tabular-nums">
            <span className="absolute left-0 text-neutral-500 dark:text-neutral-400">0 g</span>
            <span
              style={{ left: `${warnPct}%` }}
              className="absolute -translate-x-1/2 text-amber-700 dark:text-amber-400 whitespace-nowrap"
            >
              {formatGrams(settings.warn)} g
            </span>
            <span
              style={{ left: `${limitPct}%` }}
              className="absolute -translate-x-1/2 text-red-700 dark:text-red-400 font-bold whitespace-nowrap"
            >
              {formatGrams(settings.limit)} g
            </span>
          </div>
        </div>
      </div>

      {/* 5-Moment Breakdown */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border-b-[3px] border-neutral-950 dark:border-neutral-200">
        {MEALS.map((meal) => {
          const data = byMeal[meal.id] || { grams: 0, count: 0 };
          return (
            <button
              key={meal.id}
              type="button"
              onClick={() => onSelectMeal(meal.id)}
              className="w-full px-4 min-h-[44px] py-2 flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-xs shrink-0"
                  style={{ backgroundColor: meal.colorHex }}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {meal.label}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                  · {data.count} {data.count === 1 ? 'alimento' : 'alimentos'}
                </span>
              </div>
              <span className="font-condensed text-lg font-bold text-neutral-950 dark:text-white shrink-0">
                {formatGrams(data.grams)} g
              </span>
            </button>
          );
        })}
      </div>

      {/* Medication Summary Line */}
      <button
        type="button"
        onClick={onOpenMedication}
        className="w-full px-4 min-h-[44px] py-2.5 flex items-center justify-between gap-2 bg-neutral-50 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <Pill className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
          <span>
            Medicación tomada:{' '}
            <span className="font-condensed text-base font-bold">
              {medTaken} de {medTotal}
            </span>
          </span>
        </div>
        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 whitespace-nowrap">
          {medTotal === 0 ? 'Configurar pauta' : medTaken === medTotal ? 'Completa' : 'Ver tomas'}
        </span>
      </button>
    </section>
  );
};
