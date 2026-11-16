import { MEALS, MEAL_MAP, formatGrams, round2 } from '../data/foods';
import {
  AnyRecord,
  BackupPayload,
  FoodRecord,
  MealId,
  MedRecord,
  PautaItem,
  SettingsRecord,
} from '../types';

const STORAGE_KEY = 'diario_proteinas_v1';

export const DEFAULT_SETTINGS: SettingsRecord = {
  id: 'ajustes',
  type: 's',
  limit: 30,
  warn: 25,
  // Pauta diaria fija vacía por defecto para que cada persona añada su propia medicación
  pauta: [],
  custom: [],
};

export interface AppDataState {
  foods: FoodRecord[];
  meds: MedRecord[];
  settings: SettingsRecord;
}

export function getTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCurrentTimeHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function shiftDateISO(dateISO: string, deltaDays: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function getDatesRangeEndingOn(endDateISO: string, days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    result.push(shiftDateISO(endDateISO, -i));
  }
  return result;
}

const WEEKDAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function formatDateSpanish(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = WEEKDAYS_ES[dt.getDay()];
  const month = MONTHS_ES[m - 1];
  return `${weekday}, ${d} de ${month} de ${y}`;
}

export function formatShortDate(dateISO: string): string {
  const [, m, d] = dateISO.split('-');
  return `${Number(d)}/${Number(m)}`;
}

export function formatShortWeekday(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return WEEKDAYS_ES[dt.getDay()];
}

export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadAppData(): AppDataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        foods: [],
        meds: [],
        settings: { ...DEFAULT_SETTINGS, pauta: [], custom: [] },
      };
    }
    const parsed = JSON.parse(raw) as Partial<AppDataState>;
    return {
      foods: Array.isArray(parsed.foods) ? parsed.foods : [],
      meds: Array.isArray(parsed.meds) ? parsed.meds : [],
      settings: parsed.settings
        ? {
            id: 'ajustes',
            type: 's',
            limit: Number(parsed.settings.limit) > 0 ? Number(parsed.settings.limit) : 30,
            warn: Number(parsed.settings.warn) >= 0 ? Number(parsed.settings.warn) : 25,
            pauta: Array.isArray(parsed.settings.pauta) ? parsed.settings.pauta : [],
            custom: Array.isArray(parsed.settings.custom) ? parsed.settings.custom : [],
          }
        : { ...DEFAULT_SETTINGS, pauta: [], custom: [] },
    };
  } catch {
    return {
      foods: [],
      meds: [],
      settings: { ...DEFAULT_SETTINGS, pauta: [], custom: [] },
    };
  }
}

export function saveAppData(state: AppDataState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors silently in restricted storage contexts
  }
}

export interface ResolvedDayPlanDose {
  id: string;
  pid: string;
  mom: MealId;
  name: string;
  dose: string;
  taken: boolean;
  takenAt: string;
  fromActivePauta: boolean;
  record?: MedRecord;
}

export function getDayMedicationSummary(
  dateISO: string,
  meds: MedRecord[],
  pauta: PautaItem[]
): {
  planDoses: ResolvedDayPlanDose[];
  extraMeds: MedRecord[];
  takenCount: number;
  totalCount: number;
} {
  const dayMeds = meds.filter((m) => m.date === dateISO);
  const planRecordsById = new Map<string, MedRecord>();
  const extraMeds: MedRecord[] = [];

  for (const m of dayMeds) {
    if (m.plan) {
      planRecordsById.set(m.id, m);
    } else {
      extraMeds.push(m);
    }
  }

  const resolvedMap = new Map<string, ResolvedDayPlanDose>();

  // First, include all active pauta items for this day
  for (const p of pauta) {
    const planId = `plan-${dateISO}-${p.pid}`;
    const existing = planRecordsById.get(planId);
    resolvedMap.set(planId, {
      id: planId,
      pid: p.pid,
      mom: existing?.mom || p.mom,
      name: existing?.name || p.name,
      dose: existing?.dose || p.qty,
      taken: existing ? Boolean(existing.taken) : false,
      takenAt: existing?.takenAt || '',
      fromActivePauta: true,
      record: existing,
    });
  }

  // Second, preserve any previously marked plan records whose pid was later removed from pauta
  for (const [planId, existing] of planRecordsById.entries()) {
    if (!resolvedMap.has(planId) && existing.taken) {
      resolvedMap.set(planId, {
        id: planId,
        pid: existing.pid || planId,
        mom: existing.mom || 'desayuno',
        name: existing.name,
        dose: existing.dose,
        taken: true,
        takenAt: existing.takenAt || '',
        fromActivePauta: false,
        record: existing,
      });
    }
  }

  const planDoses = Array.from(resolvedMap.values());
  const extraSorted = [...extraMeds].sort((a, b) => a.ts - b.ts);

  const takenPlan = planDoses.filter((d) => d.taken).length;
  const takenExtra = extraSorted.filter((d) => d.taken).length;

  return {
    planDoses,
    extraMeds: extraSorted,
    takenCount: takenPlan + takenExtra,
    totalCount: planDoses.length + extraSorted.length,
  };
}

export function getDayProteinStats(
  dateISO: string,
  foods: FoodRecord[],
  settings: SettingsRecord
) {
  const dayFoods = foods.filter((f) => f.date === dateISO);
  const byMeal: Record<MealId, { grams: number; count: number; items: FoodRecord[] }> = {
    desayuno: { grams: 0, count: 0, items: [] },
    media: { grams: 0, count: 0, items: [] },
    comida: { grams: 0, count: 0, items: [] },
    merienda: { grams: 0, count: 0, items: [] },
    cena: { grams: 0, count: 0, items: [] },
  };

  let total = 0;
  for (const item of dayFoods) {
    const bucket = byMeal[item.meal] || byMeal.desayuno;
    bucket.items.push(item);
    bucket.grams = round2(bucket.grams + item.g);
    bucket.count += 1;
    total = round2(total + item.g);
  }

  for (const meal of MEALS) {
    byMeal[meal.id].items.sort((a, b) => a.ts - b.ts);
  }

  let status: 'ok' | 'warn' | 'over' = 'ok';
  let statusLabel = 'Dentro del límite';
  if (total > settings.limit) {
    status = 'over';
    statusLabel = 'Límite superado';
  } else if (total >= settings.warn) {
    status = 'warn';
    statusLabel = 'Cerca del límite';
  }

  const diffFromLimit = round2(settings.limit - total);

  return {
    total,
    byMeal,
    status,
    statusLabel,
    diffFromLimit,
    dayFoods,
  };
}

export function buildDayTextSummary(dateISO: string, state: AppDataState): string {
  const { total, byMeal, statusLabel, diffFromLimit } = getDayProteinStats(
    dateISO,
    state.foods,
    state.settings
  );
  const medSummary = getDayMedicationSummary(dateISO, state.meds, state.settings.pauta);

  const lines: string[] = [];
  lines.push(`*Diario de Proteínas — ${formatDateSpanish(dateISO)}*`);
  const diffText =
    diffFromLimit >= 0
      ? `Quedan ${formatGrams(diffFromLimit)} g`
      : `Te pasas ${formatGrams(Math.abs(diffFromLimit))} g`;
  lines.push(
    `Total: ${formatGrams(total)} g / ${formatGrams(state.settings.limit)} g (${statusLabel} · ${diffText})`
  );

  lines.push('');
  lines.push('Comidas:');
  let hasAnyFood = false;
  for (const meal of MEALS) {
    const bucket = byMeal[meal.id];
    if (bucket.items.length > 0) {
      hasAnyFood = true;
      lines.push(`• ${meal.label} (${formatGrams(bucket.grams)} g):`);
      for (const item of bucket.items) {
        lines.push(`  - ${item.food}: ${formatGrams(item.g)} g`);
      }
    }
  }
  if (!hasAnyFood) {
    lines.push('  Sin comidas registradas.');
  }

  lines.push('');
  if (medSummary.totalCount > 0) {
    lines.push(`Medicación (${medSummary.takenCount} de ${medSummary.totalCount}):`);
    for (const meal of MEALS) {
      const mealDoses = medSummary.planDoses.filter((d) => d.mom === meal.id);
      if (mealDoses.length > 0) {
        for (const d of mealDoses) {
          const mark = d.taken ? '✓' : '✗';
          const dosePart = d.dose ? `${d.dose} ` : '';
          const timePart = d.taken && d.takenAt ? ` (${d.takenAt})` : '';
          lines.push(`  ${mark} [${meal.label}] ${dosePart}${d.name}${timePart}`);
        }
      }
    }
    for (const m of medSummary.extraMeds) {
      const mark = m.taken ? '✓' : '✗';
      const dosePart = m.dose ? ` (${m.dose})` : '';
      const timeInfo = m.taken && m.takenAt ? ` · tomada ${m.takenAt}` : m.time ? ` · ${m.time}` : '';
      const noteInfo = m.note ? ` — ${m.note}` : '';
      lines.push(`  ${mark} [Puntual] ${m.name}${dosePart}${timeInfo}${noteInfo}`);
    }
  } else {
    lines.push('Medicación: sin tomas registradas.');
  }

  return lines.join('\n');
}

export function buildMultiDayTextSummary(endDateISO: string, days: number, state: AppDataState): string {
  const dates = getDatesRangeEndingOn(endDateISO, days);
  return dates.map((d) => buildDayTextSummary(d, state)).join('\n\n────────────────────\n\n');
}

function escapeCsvCell(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsvExport(state: AppDataState): string {
  const header = [
    'Fecha',
    'Tipo',
    'Momento',
    'Alimento',
    'Proteína (g)',
    'Medicamento',
    'Dosis',
    'Hora',
    'Tomada',
    'Nota',
  ];

  const allDatesSet = new Set<string>();
  for (const f of state.foods) allDatesSet.add(f.date);
  for (const m of state.meds) allDatesSet.add(m.date);
  const allDates = Array.from(allDatesSet).sort();

  const rows: string[] = [header.map(escapeCsvCell).join(';')];

  allDates.forEach((dateISO, idx) => {
    const dayStats = getDayProteinStats(dateISO, state.foods, state.settings);
    const dayMeds = getDayMedicationSummary(dateISO, state.meds, state.settings.pauta);

    const orderedFoods: FoodRecord[] = [];
    for (const meal of MEALS) {
      orderedFoods.push(...dayStats.byMeal[meal.id].items);
    }

    for (const f of orderedFoods) {
      rows.push(
        [
          dateISO,
          'Alimento',
          MEAL_MAP[f.meal]?.label || f.meal,
          f.food,
          formatGrams(f.g),
          '',
          '',
          '',
          '',
          '',
        ]
          .map(escapeCsvCell)
          .join(';')
      );
    }

    if (orderedFoods.length > 0) {
      rows.push(
        [
          dateISO,
          'Total del día',
          '',
          'Total proteína del día',
          formatGrams(dayStats.total),
          '',
          '',
          '',
          '',
          '',
        ]
          .map(escapeCsvCell)
          .join(';')
      );
    }

    for (const d of dayMeds.planDoses) {
      rows.push(
        [
          dateISO,
          'Medicación (pauta)',
          MEAL_MAP[d.mom]?.label || d.mom,
          '',
          '',
          d.name,
          d.dose,
          d.taken ? d.takenAt : '',
          d.taken ? 'Sí' : 'No',
          '',
        ]
          .map(escapeCsvCell)
          .join(';')
      );
    }

    for (const m of dayMeds.extraMeds) {
      rows.push(
        [
          dateISO,
          'Medicación (puntual)',
          '',
          '',
          '',
          m.name,
          m.dose,
          m.taken && m.takenAt ? m.takenAt : m.time,
          m.taken ? 'Sí' : 'No',
          m.note,
        ]
          .map(escapeCsvCell)
          .join(';')
      );
    }

    if (idx < allDates.length - 1) {
      rows.push('');
    }
  });

  // UTF-8 BOM + CRLF for Excel compatibility in Spain
  return '\uFEFF' + rows.join('\r\n');
}

export function buildJsonBackup(state: AppDataState): BackupPayload {
  const datos: AnyRecord[] = [
    ...state.foods,
    ...state.meds,
    state.settings,
  ];

  return {
    app: 'diario-proteinas',
    version: 1,
    exportado: new Date().toISOString(),
    datos,
  };
}

export interface ImportResult {
  newState: AppDataState;
  addedFoods: number;
  addedMeds: number;
  addedPauta: number;
  addedCustom: number;
  updatedLimits: boolean;
}

export function importJsonBackup(rawJson: string, current: AppDataState): ImportResult {
  const parsed = JSON.parse(rawJson) as Partial<BackupPayload>;
  if (!parsed || parsed.app !== 'diario-proteinas' || !Array.isArray(parsed.datos)) {
    throw new Error('El archivo no tiene el formato de copia de seguridad de Diario de Proteínas.');
  }

  const existingFoodIds = new Set(current.foods.map((f) => f.id));
  const existingMedIds = new Set(current.meds.map((m) => m.id));
  const existingPautaIds = new Set(current.settings.pauta.map((p) => p.pid));
  const existingCustomIds = new Set(current.settings.custom.map((c) => c.cid));

  const nextFoods = [...current.foods];
  const nextMeds = [...current.meds];
  let nextSettings: SettingsRecord = {
    ...current.settings,
    pauta: [...current.settings.pauta],
    custom: [...current.settings.custom],
  };

  let addedFoods = 0;
  let addedMeds = 0;
  let addedPauta = 0;
  let addedCustom = 0;
  let updatedLimits = false;

  for (const item of parsed.datos) {
    if (!item || typeof item !== 'object') continue;

    if (item.type === 'p' && typeof item.id === 'string' && !existingFoodIds.has(item.id)) {
      if (typeof item.date === 'string' && typeof item.food === 'string') {
        nextFoods.push({
          id: item.id,
          type: 'p',
          date: item.date,
          meal: item.meal || 'desayuno',
          food: item.food,
          g: round2(Number(item.g) || 0),
          ck: String(item.ck || item.food),
          ts: Number(item.ts) || Date.now(),
        });
        existingFoodIds.add(item.id);
        addedFoods += 1;
      }
    } else if (item.type === 'm' && typeof item.id === 'string' && !existingMedIds.has(item.id)) {
      if (typeof item.date === 'string' && typeof item.name === 'string') {
        const medRec: MedRecord = {
          id: item.id,
          type: 'm',
          date: item.date,
          name: item.name,
          dose: String(item.dose || ''),
          time: String(item.time || ''),
          note: String(item.note || ''),
          taken: Boolean(item.taken),
          takenAt: String(item.takenAt || ''),
          ts: Number(item.ts) || Date.now(),
        };
        if (item.plan) {
          medRec.plan = true;
          if (item.pid) medRec.pid = String(item.pid);
          if (item.mom) medRec.mom = item.mom;
        }
        nextMeds.push(medRec);
        existingMedIds.add(item.id);
        addedMeds += 1;
      }
    } else if (item.type === 's' && item.id === 'ajustes') {
      if (Array.isArray(item.pauta)) {
        for (const p of item.pauta) {
          if (p && typeof p.pid === 'string' && !existingPautaIds.has(p.pid)) {
            nextSettings.pauta.push({
              pid: p.pid,
              qty: String(p.qty || ''),
              name: String(p.name || ''),
              mom: p.mom || 'desayuno',
            });
            existingPautaIds.add(p.pid);
            addedPauta += 1;
          }
        }
      }
      if (Array.isArray(item.custom)) {
        for (const c of item.custom) {
          if (c && typeof c.cid === 'string' && !existingCustomIds.has(c.cid)) {
            nextSettings.custom.push({
              cid: c.cid,
              n: String(c.n || ''),
              por: String(c.por || '1 ración'),
              g: round2(Number(c.g) || 0),
            });
            existingCustomIds.add(c.cid);
            addedCustom += 1;
          }
        }
      }
      // If user still has default untouched limits and zero data, apply imported limits too
      const hasDefaultLimits =
        current.settings.limit === 30 &&
        current.settings.warn === 25 &&
        current.foods.length === 0 &&
        current.meds.length === 0;
      if (hasDefaultLimits && Number(item.limit) > 0) {
        nextSettings.limit = Number(item.limit);
        nextSettings.warn = Number(item.warn) >= 0 ? Number(item.warn) : 25;
        updatedLimits = true;
      }
    }
  }

  return {
    newState: {
      foods: nextFoods,
      meds: nextMeds,
      settings: nextSettings,
    },
    addedFoods,
    addedMeds,
    addedPauta,
    addedCustom,
    updatedLimits,
  };
}
