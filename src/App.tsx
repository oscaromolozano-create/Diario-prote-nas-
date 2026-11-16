import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Download, HelpCircle, Pill, RotateCcw, Utensils, WifiOff, X } from 'lucide-react';
import { ChartTab } from './components/ChartTab';
import { DaySelector } from './components/DaySelector';
import { ExportTab } from './components/ExportTab';
import { FoodsTab } from './components/FoodsTab';
import { MedicationTab } from './components/MedicationTab';
import { NutritionPanel } from './components/NutritionPanel';
import { PWAInstallButton } from './components/PWAInstallButton';
import { formatGrams, getDefaultMealByTime, round2 } from './data/foods';
import { FoodRecord, MealId, MedRecord, TabId } from './types';
import {
  AppDataState,
  ImportResult,
  ResolvedDayPlanDose,
  generateId,
  getCurrentTimeHHMM,
  getDayMedicationSummary,
  getDayProteinStats,
  getTodayISO,
  loadAppData,
  saveAppData,
  shiftDateISO,
} from './utils/storage';

interface ToastState {
  id: number;
  message: string;
  tone: 'ok' | 'warn' | 'over' | 'neutral';
  undoFood?: FoodRecord;
}

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'comidas', label: 'Comidas', Icon: Utensils },
  { id: 'medicacion', label: 'Medicación', Icon: Pill },
  { id: 'grafica', label: 'Gráfica', Icon: BarChart3 },
  { id: 'exportar', label: 'Exportar', Icon: Download },
];

export default function App() {
  const [data, setData] = useState<AppDataState>(() => loadAppData());
  const todayISO = getTodayISO();
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [activeTab, setActiveTab] = useState<TabId>('comidas');
  const [selectedMeal, setSelectedMeal] = useState<MealId>(() => getDefaultMealByTime());
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (
    message: string,
    tone: ToastState['tone'] = 'neutral',
    durationMs = 3800,
    undoFood?: FoodRecord
  ) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    const id = Date.now();
    setToast({ id, message, tone, undoFood });
    toastTimerRef.current = window.setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, durationMs);
  };

  const dayProtein = useMemo(
    () => getDayProteinStats(selectedDate, data.foods, data.settings),
    [selectedDate, data.foods, data.settings]
  );

  const dayMeds = useMemo(
    () => getDayMedicationSummary(selectedDate, data.meds, data.settings.pauta),
    [selectedDate, data.meds, data.settings.pauta]
  );

  // Navigation handlers
  const handlePrevDay = () => {
    setSelectedDate((d) => shiftDateISO(d, -1));
  };

  const handleNextDay = () => {
    setSelectedDate((d) => {
      const next = shiftDateISO(d, 1);
      return next > todayISO ? todayISO : next;
    });
  };

  const handleGoToday = () => {
    setSelectedDate(todayISO);
    setSelectedMeal(getDefaultMealByTime());
  };

  // Limits update
  const handleUpdateLimits = (warn: number, limit: number) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        warn: round2(warn),
        limit: round2(limit),
      },
    }));
  };

  // Food actions
  const handleAddFood = (food: string, grams: number, meal: MealId, ck: string) => {
    const cleanG = round2(grams);
    const newRecord: FoodRecord = {
      id: generateId('p'),
      type: 'p',
      date: selectedDate,
      meal,
      food,
      g: cleanG,
      ck,
      ts: Date.now(),
    };

    const nextTotal = round2(dayProtein.total + cleanG);
    const { warn, limit } = data.settings;
    const remaining = round2(limit - nextTotal);

    if (nextTotal > limit) {
      showToast(
        `Atención: superas el máximo (+${formatGrams(cleanG)} g). Te pasas ${formatGrams(Math.abs(remaining))} g.`,
        'over',
        4500
      );
    } else if (nextTotal >= warn) {
      showToast(
        `Cerca del límite (+${formatGrams(cleanG)} g). Quedan ${formatGrams(remaining)} g.`,
        'warn',
        4000
      );
    } else {
      showToast(
        `+${formatGrams(cleanG)} g. Quedan ${formatGrams(remaining)} g.`,
        'ok',
        3500
      );
    }

    setData((prev) => ({
      ...prev,
      foods: [...prev.foods, newRecord],
    }));
  };

  const handleEditFood = (
    id: string,
    updates: { food: string; g: number; meal: MealId; date: string }
  ) => {
    setData((prev) => ({
      ...prev,
      foods: prev.foods.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  };

  const handleDeleteFood = (record: FoodRecord) => {
    setData((prev) => ({
      ...prev,
      foods: prev.foods.filter((f) => f.id !== record.id),
    }));
    showToast(`Eliminado: ${record.food}`, 'neutral', 5000, record);
  };

  const handleUndoDelete = (record: FoodRecord) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast(null);
    setData((prev) => {
      if (prev.foods.some((f) => f.id === record.id)) return prev;
      return {
        ...prev,
        foods: [...prev.foods, record],
      };
    });
  };

  const handleAddCustomFood = (n: string, por: string, g: number) => {
    const cid = generateId('custom');
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        custom: [...prev.settings.custom, { cid, n, por, g: round2(g) }],
      },
    }));
  };

  const handleDeleteCustomFood = (cid: string) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        custom: prev.settings.custom.filter((c) => c.cid !== cid),
      },
    }));
  };

  // Medication actions
  const handleTogglePlanDose = (dose: ResolvedDayPlanDose) => {
    const nowHHMM = getCurrentTimeHHMM();
    setData((prev) => {
      const existingIdx = prev.meds.findIndex((m) => m.id === dose.id);
      if (existingIdx >= 0) {
        const updated = [...prev.meds];
        const curr = updated[existingIdx];
        const nextTaken = !curr.taken;
        updated[existingIdx] = {
          ...curr,
          taken: nextTaken,
          takenAt: nextTaken ? nowHHMM : '',
        };
        return { ...prev, meds: updated };
      }

      const newRec: MedRecord = {
        id: dose.id,
        type: 'm',
        date: selectedDate,
        name: dose.name,
        dose: dose.dose,
        time: '',
        note: '',
        taken: true,
        takenAt: nowHHMM,
        ts: Date.now(),
        plan: true,
        pid: dose.pid,
        mom: dose.mom,
      };
      return { ...prev, meds: [...prev.meds, newRec] };
    });
  };

  const handleMarkMomentAll = (moment: MealId) => {
    const nowHHMM = getCurrentTimeHHMM();
    const momentDoses = dayMeds.planDoses.filter((d) => d.mom === moment && !d.taken);
    if (momentDoses.length === 0) return;

    setData((prev) => {
      const nextMeds = [...prev.meds];
      for (const dose of momentDoses) {
        const idx = nextMeds.findIndex((m) => m.id === dose.id);
        if (idx >= 0) {
          nextMeds[idx] = { ...nextMeds[idx], taken: true, takenAt: nowHHMM };
        } else {
          nextMeds.push({
            id: dose.id,
            type: 'm',
            date: selectedDate,
            name: dose.name,
            dose: dose.dose,
            time: '',
            note: '',
            taken: true,
            takenAt: nowHHMM,
            ts: Date.now(),
            plan: true,
            pid: dose.pid,
            mom: dose.mom,
          });
        }
      }
      return { ...prev, meds: nextMeds };
    });
  };

  const handleAddPautaItem = (qty: string, name: string, mom: MealId) => {
    const pid = generateId('pid');
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        pauta: [...prev.settings.pauta, { pid, qty, name, mom }],
      },
    }));
  };

  const handleRemovePautaItem = (pid: string) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        pauta: prev.settings.pauta.filter((p) => p.pid !== pid),
      },
    }));
  };

  const handleAddExtraMed = (name: string, dose: string, time: string, note: string) => {
    const newMed: MedRecord = {
      id: generateId('med'),
      type: 'm',
      date: selectedDate,
      name,
      dose,
      time,
      note,
      taken: false,
      takenAt: '',
      ts: Date.now(),
    };
    setData((prev) => ({
      ...prev,
      meds: [...prev.meds, newMed],
    }));
  };

  const handleToggleExtraMed = (med: MedRecord) => {
    const nowHHMM = getCurrentTimeHHMM();
    setData((prev) => ({
      ...prev,
      meds: prev.meds.map((m) =>
        m.id === med.id
          ? { ...m, taken: !m.taken, takenAt: !m.taken ? nowHHMM : '' }
          : m
      ),
    }));
  };

  const handleEditExtraMed = (
    id: string,
    updates: { name: string; dose: string; time: string; note: string }
  ) => {
    setData((prev) => ({
      ...prev,
      meds: prev.meds.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  };

  const handleDeleteExtraMed = (id: string) => {
    setData((prev) => ({
      ...prev,
      meds: prev.meds.filter((m) => m.id !== id),
    }));
  };

  const handleCopyPrevDayExtraMeds = (): number => {
    const prevDateISO = shiftDateISO(selectedDate, -1);
    const prevExtras = data.meds.filter((m) => m.date === prevDateISO && !m.plan);
    if (prevExtras.length === 0) return 0;

    const existingTodaySignatures = new Set(
      dayMeds.extraMeds.map((m) => `${m.name}|${m.dose}|${m.time}`)
    );

    const toAdd: MedRecord[] = [];
    for (const src of prevExtras) {
      const sig = `${src.name}|${src.dose}|${src.time}`;
      if (!existingTodaySignatures.has(sig)) {
        toAdd.push({
          id: generateId('med'),
          type: 'm',
          date: selectedDate,
          name: src.name,
          dose: src.dose,
          time: src.time,
          note: src.note,
          taken: false,
          takenAt: '',
          ts: Date.now() + toAdd.length,
        });
        existingTodaySignatures.add(sig);
      }
    }

    if (toAdd.length > 0) {
      setData((prev) => ({
        ...prev,
        meds: [...prev.meds, ...toAdd],
      }));
    }
    return toAdd.length;
  };

  const handleImportState = (result: ImportResult) => {
    setData(result.newState);
  };

  const toastStyles = toast
    ? {
        ok: 'bg-emerald-950 text-white border-emerald-700',
        warn: 'bg-amber-950 text-amber-50 border-amber-600',
        over: 'bg-red-950 text-red-50 border-red-600',
        neutral: 'bg-neutral-900 text-white border-neutral-700',
      }[toast.tone]
    : '';

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 pb-24 lg:pb-10">
      {/* Compact Non-Sticky Header Bar */}
      <header className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between gap-3">
        <span className="font-condensed text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-400 whitespace-nowrap shrink-0">
          Diario de Proteínas
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {!isOnline && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-300 whitespace-nowrap">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Sin conexión</span>
            </span>
          )}
          <PWAInstallButton variant="compact" />
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="min-h-[40px] px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Cómo usar</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-2.5 sm:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-start">
          {/* Left Column (Mobile Top): Day Selector & Nutrition Facts Panel */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-3.5">
            <DaySelector
              selectedDate={selectedDate}
              todayISO={todayISO}
              onPrevDay={handlePrevDay}
              onNextDay={handleNextDay}
              onSelectDate={setSelectedDate}
              onGoToday={handleGoToday}
            />

            <NutritionPanel
              total={dayProtein.total}
              status={dayProtein.status}
              statusLabel={dayProtein.statusLabel}
              diffFromLimit={dayProtein.diffFromLimit}
              byMeal={dayProtein.byMeal}
              settings={data.settings}
              medTaken={dayMeds.takenCount}
              medTotal={dayMeds.totalCount}
              onUpdateLimits={handleUpdateLimits}
              onSelectMeal={(meal) => {
                setSelectedMeal(meal);
                setActiveTab('comidas');
              }}
              onOpenMedication={() => setActiveTab('medicacion')}
            />
          </div>

          {/* Right Column: 4 Tabs & Active Workspace */}
          <div className="lg:col-span-7 space-y-5">
            {/* Inline 4-Tab Bar (visible right under panel on mobile & top of workspace on desktop) */}
            <nav
              aria-label="Secciones principales"
              className="grid grid-cols-4 gap-1.5 p-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl"
            >
              {TABS.map(({ id, label, Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`min-h-[44px] px-2 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-900 dark:bg-emerald-700 text-white shadow-xs'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </nav>

            {activeTab === 'comidas' && (
              <FoodsTab
                selectedDate={selectedDate}
                todayISO={todayISO}
                selectedMeal={selectedMeal}
                onSelectMeal={setSelectedMeal}
                allFoods={data.foods}
                dayByMeal={dayProtein.byMeal}
                customFoods={data.settings.custom}
                onAddFood={handleAddFood}
                onEditFood={handleEditFood}
                onDeleteFood={handleDeleteFood}
                onAddCustomFood={handleAddCustomFood}
                onDeleteCustomFood={handleDeleteCustomFood}
              />
            )}

            {activeTab === 'medicacion' && (
              <MedicationTab
                selectedDate={selectedDate}
                pauta={data.settings.pauta}
                planDoses={dayMeds.planDoses}
                extraMeds={dayMeds.extraMeds}
                takenCount={dayMeds.takenCount}
                totalCount={dayMeds.totalCount}
                allMeds={data.meds}
                onTogglePlanDose={handleTogglePlanDose}
                onMarkMomentAll={handleMarkMomentAll}
                onAddPautaItem={handleAddPautaItem}
                onRemovePautaItem={handleRemovePautaItem}
                onAddExtraMed={handleAddExtraMed}
                onToggleExtraMed={handleToggleExtraMed}
                onEditExtraMed={handleEditExtraMed}
                onDeleteExtraMed={handleDeleteExtraMed}
                onCopyPrevDayExtraMeds={handleCopyPrevDayExtraMeds}
              />
            )}

            {activeTab === 'grafica' && (
              <ChartTab
                todayISO={todayISO}
                selectedDate={selectedDate}
                foods={data.foods}
                meds={data.meds}
                settings={data.settings}
                onSelectDate={(dateISO) => {
                  setSelectedDate(dateISO);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {activeTab === 'exportar' && (
              <ExportTab
                selectedDate={selectedDate}
                todayISO={todayISO}
                state={data}
                onImportState={handleImportState}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom Thumb Navigation */}
      <nav
        aria-label="Navegación inferior móvil"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-300 dark:border-neutral-800 grid grid-cols-4 items-center px-1"
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-emerald-900 dark:text-emerald-400 font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[11px] leading-tight tracking-tight whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Floating Feedback / Undo Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50"
        >
          <div
            className={`px-4 py-3 rounded-2xl border shadow-xl flex items-center justify-between gap-3 ${toastStyles}`}
          >
            <p className="text-sm font-semibold leading-snug">{toast.message}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {toast.undoFood && (
                <button
                  type="button"
                  onClick={() => handleUndoDelete(toast.undoFood!)}
                  className="min-h-[38px] px-3 rounded-lg bg-white text-neutral-950 text-xs font-bold flex items-center gap-1 hover:bg-neutral-200 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Deshacer</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Cerrar aviso"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple User Guide Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cómo usar Diario de Proteínas"
            className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-300 dark:border-neutral-700 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-neutral-950 dark:text-white">
                Cómo usar la aplicación
              </h2>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Cerrar ayuda"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
              <li>
                <strong className="text-neutral-950 dark:text-white">1. Ajusta tu límite:</strong>{' '}
                toca el botón <em>Límites</em> en el panel superior si tu médico te indicó un máximo distinto a 30 g/día.
              </li>
              <li>
                <strong className="text-neutral-950 dark:text-white">2. Registra lo que comes:</strong>{' '}
                en <em>Comidas</em>, busca un alimento, elige las raciones (de 0,5 en 0,5) y añádelo. Si no aparece, puedes crearlo en <em>Mis alimentos</em> o añadirlo manualmente.
              </li>
              <li>
                <strong className="text-neutral-950 dark:text-white">3. Configura tu medicación (opcional):</strong>{' '}
                en <em>Medicación</em>, usa <em>Editar pauta</em> para añadir tus tomas diarias y marcarlas con un toque cada día.
              </li>
              <li>
                <strong className="text-neutral-950 dark:text-white">4. Privado y sin internet:</strong>{' '}
                todo se guarda únicamente en tu navegador (sin servidores ni IA). Usa la pestaña <em>Exportar</em> para guardar una copia de seguridad o enviárselo a tu médico.
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full min-h-[44px] rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
            >
              Empezar a usar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
