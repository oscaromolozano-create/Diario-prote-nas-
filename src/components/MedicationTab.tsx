import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  Copy,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import { MEALS, MEAL_MAP } from '../data/foods';
import { MealId, MedRecord, PautaItem } from '../types';
import {
  ResolvedDayPlanDose,
  getCurrentTimeHHMM,
  shiftDateISO,
} from '../utils/storage';

interface MedicationTabProps {
  selectedDate: string;
  pauta: PautaItem[];
  planDoses: ResolvedDayPlanDose[];
  extraMeds: MedRecord[];
  takenCount: number;
  totalCount: number;
  allMeds: MedRecord[];
  onTogglePlanDose: (dose: ResolvedDayPlanDose) => void;
  onMarkMomentAll: (moment: MealId) => void;
  onAddPautaItem: (qty: string, name: string, mom: MealId) => void;
  onRemovePautaItem: (pid: string) => void;
  onAddExtraMed: (name: string, dose: string, time: string, note: string) => void;
  onToggleExtraMed: (med: MedRecord) => void;
  onEditExtraMed: (
    id: string,
    updates: { name: string; dose: string; time: string; note: string }
  ) => void;
  onDeleteExtraMed: (id: string) => void;
  onCopyPrevDayExtraMeds: () => number;
}

export const MedicationTab: React.FC<MedicationTabProps> = ({
  selectedDate,
  pauta,
  planDoses,
  extraMeds,
  takenCount,
  totalCount,
  allMeds,
  onTogglePlanDose,
  onMarkMomentAll,
  onAddPautaItem,
  onRemovePautaItem,
  onAddExtraMed,
  onToggleExtraMed,
  onEditExtraMed,
  onDeleteExtraMed,
  onCopyPrevDayExtraMeds,
}) => {
  const [showPautaModal, setShowPautaModal] = useState(false);
  const [newPautaQty, setNewPautaQty] = useState('');
  const [newPautaName, setNewPautaName] = useState('');
  const [newPautaMom, setNewPautaMom] = useState<MealId>('desayuno');
  const [pautaError, setPautaError] = useState('');

  // Extra med creation form
  const [extraName, setExtraName] = useState('');
  const [extraDose, setExtraDose] = useState('');
  const [extraTime, setExtraTime] = useState(() => getCurrentTimeHHMM());
  const [extraNote, setExtraNote] = useState('');
  const [extraError, setExtraError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  // Edit extra med modal
  const [editingExtra, setEditingExtra] = useState<MedRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editDose, setEditDose] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNote, setEditNote] = useState('');

  const prevDateISO = shiftDateISO(selectedDate, -1);
  const hasPrevDayExtras = allMeds.some((m) => m.date === prevDateISO && !m.plan);

  let counterClasses =
    'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';
  let counterStatusText = 'Sin tomas';
  if (totalCount > 0) {
    if (takenCount === totalCount) {
      counterClasses =
        'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      counterStatusText = 'Completa';
    } else if (takenCount > 0) {
      counterClasses =
        'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      counterStatusText = 'Parcial';
    } else {
      counterClasses =
        'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800';
      counterStatusText = 'Pendiente';
    }
  }

  const handleAddPauta = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPautaName.trim();
    const qty = newPautaQty.trim();
    if (!name) {
      setPautaError('Escribe el nombre del medicamento o suplemento.');
      return;
    }
    onAddPautaItem(qty, name, newPautaMom);
    setNewPautaQty('');
    setNewPautaName('');
    setPautaError('');
  };

  const handleAddExtra = (e: React.FormEvent) => {
    e.preventDefault();
    const name = extraName.trim();
    if (!name) {
      setExtraError('Escribe el nombre del medicamento.');
      return;
    }
    onAddExtraMed(name, extraDose.trim(), extraTime.trim(), extraNote.trim());
    setExtraName('');
    setExtraDose('');
    setExtraTime(getCurrentTimeHHMM());
    setExtraNote('');
    setExtraError('');
  };

  const handleCopyPrevDay = () => {
    const copied = onCopyPrevDayExtraMeds();
    if (copied > 0) {
      setCopyFeedback(`Copiadas ${copied} ${copied === 1 ? 'toma' : 'tomas'} del día anterior.`);
    } else {
      setCopyFeedback('No había tomas puntuales nuevas que copiar del día anterior.');
    }
    setTimeout(() => setCopyFeedback(''), 3500);
  };

  const openEditExtra = (med: MedRecord) => {
    setEditingExtra(med);
    setEditName(med.name);
    setEditDose(med.dose);
    setEditTime(med.time);
    setEditNote(med.note);
  };

  const handleSaveEditExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExtra || !editName.trim()) return;
    onEditExtraMed(editingExtra.id, {
      name: editName.trim(),
      dose: editDose.trim(),
      time: editTime.trim(),
      note: editNote.trim(),
    });
    setEditingExtra(null);
  };

  return (
    <div className="space-y-6">
      {/* Counter & Pauta Header */}
      <section
        aria-label="Pauta diaria fija"
        className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-950 dark:text-white">
              Pauta diaria fija
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Se repite cada día · Toca cada toma para marcarla
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold tabular-nums ${counterClasses}`}>
              {takenCount} de {totalCount} tomadas · {counterStatusText}
            </div>
            <button
              type="button"
              onClick={() => setShowPautaModal(true)}
              className="min-h-[44px] px-3.5 flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Settings2 className="w-4 h-4" />
              <span>Editar pauta</span>
            </button>
          </div>
        </div>

        {planDoses.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              No tienes ninguna pauta diaria configurada todavía. Añade tus tomas fijas para marcarlas cada día con un toque.
            </p>
            <button
              type="button"
              onClick={() => setShowPautaModal(true)}
              className="min-h-[44px] px-5 inline-flex items-center gap-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Configurar pauta diaria</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {MEALS.map((meal) => {
              const mealDoses = planDoses.filter((d) => d.mom === meal.id);
              if (mealDoses.length === 0) return null;
              const allMealTaken = mealDoses.every((d) => d.taken);
              return (
                <div key={meal.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-xs shrink-0"
                        style={{ backgroundColor: meal.colorHex }}
                        aria-hidden="true"
                      />
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {meal.label}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => onMarkMomentAll(meal.id)}
                      disabled={allMealTaken}
                      className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                        allMealTaken
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default'
                          : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90'
                      }`}
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>{allMealTaken ? 'Completado' : 'Todo'}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {mealDoses.map((dose) => (
                      <button
                        key={dose.id}
                        type="button"
                        onClick={() => onTogglePlanDose(dose)}
                        className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          dose.taken
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                            : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              dose.taken
                                ? 'bg-emerald-800 dark:bg-emerald-600 border-emerald-800 dark:border-emerald-600 text-white'
                                : 'bg-white dark:bg-neutral-900 border-neutral-400 dark:border-neutral-500'
                            }`}
                          >
                            {dose.taken && <Check className="w-4 h-4 stroke-[3]" />}
                          </span>
                          <span
                            className={`text-sm font-semibold break-words ${
                              dose.taken
                                ? 'text-emerald-950 dark:text-emerald-100'
                                : 'text-neutral-900 dark:text-neutral-100'
                            }`}
                          >
                            {dose.dose ? `${dose.dose} · ` : ''}
                            {dose.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold tabular-nums shrink-0 text-neutral-600 dark:text-neutral-400">
                          {dose.taken && dose.takenAt ? `Tomada ${dose.takenAt}` : 'Pendiente'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Otra medicación (tomas puntuales) */}
      <section
        aria-label="Otra medicación"
        className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-neutral-950 dark:text-white">
              Otra medicación
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Tomas puntuales para este día
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyPrevDay}
            disabled={!hasPrevDayExtras}
            className="min-h-[44px] px-3.5 flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer whitespace-nowrap"
          >
            <Copy className="w-4 h-4" />
            <span>Copiar del día anterior</span>
          </button>
        </div>

        {copyFeedback && (
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
            {copyFeedback}
          </p>
        )}

        {/* Add one-off medication form */}
        <form onSubmit={handleAddExtra} className="space-y-2.5 bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={extraName}
              onChange={(e) => setExtraName(e.target.value)}
              placeholder="Nombre (ej. Paracetamol)"
              aria-label="Nombre de medicación puntual"
              className="min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={extraDose}
                onChange={(e) => setExtraDose(e.target.value)}
                placeholder="Dosis (ej. 500 mg)"
                aria-label="Dosis"
                className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
              <input
                type="time"
                value={extraTime}
                onChange={(e) => setExtraTime(e.target.value)}
                aria-label="Hora"
                className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm tabular-nums text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={extraNote}
              onChange={(e) => setExtraNote(e.target.value)}
              placeholder="Nota opcional (ej. con comida)"
              aria-label="Nota opcional"
              className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
            />
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              Añadir toma
            </button>
          </div>
          {extraError && (
            <p className="text-xs font-medium text-red-700 dark:text-red-400">{extraError}</p>
          )}
        </form>

        {/* List of extra meds for the day */}
        {extraMeds.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-2">
            Sin tomas puntuales registradas en este día.
          </p>
        ) : (
          <div className="space-y-2">
            {extraMeds.map((med) => (
              <div
                key={med.id}
                className={`rounded-xl border p-2 flex items-center justify-between gap-2 ${
                  med.taken
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleExtraMed(med)}
                  className="flex-1 min-h-[44px] px-2 py-1 text-left flex items-center gap-3 cursor-pointer min-w-0"
                >
                  <span
                    className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      med.taken
                        ? 'bg-emerald-800 dark:bg-emerald-600 border-emerald-800 dark:border-emerald-600 text-white'
                        : 'bg-white dark:bg-neutral-900 border-neutral-400 dark:border-neutral-500'
                    }`}
                  >
                    {med.taken && <Check className="w-4 h-4 stroke-[3]" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-neutral-950 dark:text-white break-words">
                      {med.name}
                      {med.dose ? ` · ${med.dose}` : ''}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                      {med.taken && med.takenAt
                        ? `Tomada a las ${med.takenAt}`
                        : med.time
                        ? `Prevista ${med.time}`
                        : 'Pendiente'}
                      {med.note ? ` · ${med.note}` : ''}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditExtra(med)}
                    aria-label={`Editar ${med.name}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteExtraMed(med.id)}
                    aria-label={`Borrar ${med.name}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Editar Pauta Modal */}
      {showPautaModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowPautaModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar pauta diaria fija"
            className="w-full sm:max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-300 dark:border-neutral-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-950 dark:text-white">
                  Editar pauta diaria
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Se aplica a todos los días sin borrar lo ya marcado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPautaModal(false)}
                aria-label="Cerrar"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {/* Add new pauta dose */}
              <form
                onSubmit={handleAddPauta}
                className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 space-y-3"
              >
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newPautaQty}
                    onChange={(e) => setNewPautaQty(e.target.value)}
                    placeholder="Cant. (ej. 1)"
                    aria-label="Cantidad"
                    className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newPautaName}
                    onChange={(e) => setNewPautaName(e.target.value)}
                    placeholder="Medicamento"
                    aria-label="Nombre del medicamento"
                    className="col-span-2 min-h-[44px] px-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={newPautaMom}
                    onChange={(e) => setNewPautaMom(e.target.value as MealId)}
                    aria-label="Momento del día"
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white"
                  >
                    {MEALS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="min-h-[44px] px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Añadir a pauta
                  </button>
                </div>
                {pautaError && (
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">{pautaError}</p>
                )}
              </form>

              {/* Current pauta list */}
              {pauta.length === 0 ? (
                <p className="text-sm text-center text-neutral-500 dark:text-neutral-400 py-4">
                  Tu pauta está vacía. Añade arriba tu primera toma fija.
                </p>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                  {pauta.map((item) => {
                    const mealMeta = MEAL_MAP[item.mom];
                    return (
                      <div
                        key={item.pid}
                        className="px-3.5 py-2 flex items-center justify-between gap-2 bg-white dark:bg-neutral-900"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-950 dark:text-white">
                            {item.qty ? `${item.qty} · ` : ''}
                            {item.name}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2 h-2 rounded-xs shrink-0"
                              style={{ backgroundColor: mealMeta.colorHex }}
                              aria-hidden="true"
                            />
                            <span>{mealMeta.label}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemovePautaItem(item.pid)}
                          aria-label={`Quitar ${item.name} de la pauta`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Extra Med Modal */}
      {editingExtra && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setEditingExtra(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar toma puntual"
            className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-300 dark:border-neutral-700 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-950 dark:text-white">
                Editar medicación puntual
              </h3>
              <button
                type="button"
                onClick={() => setEditingExtra(null)}
                aria-label="Cerrar"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExtra} className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nombre
                </span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full min-h-[44px] px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Dosis
                  </span>
                  <input
                    type="text"
                    value={editDose}
                    onChange={(e) => setEditDose(e.target.value)}
                    className="mt-1 w-full min-h-[44px] px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Hora
                  </span>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="mt-1 w-full min-h-[44px] px-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm tabular-nums text-neutral-950 dark:text-white"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nota
                </span>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="mt-1 w-full min-h-[44px] px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExtra(null)}
                  className="min-h-[44px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
