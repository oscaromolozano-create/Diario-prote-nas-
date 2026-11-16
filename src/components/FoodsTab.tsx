import React, { useMemo, useState } from 'react';
import {
  BookmarkPlus,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  FOOD_CATALOG,
  FOOD_GROUPS,
  MEALS,
  MEAL_MAP,
  formatGrams,
  normalizeText,
  parseDecimalInput,
  round2,
} from '../data/foods';
import { CatalogFood, CustomFoodItem, FoodRecord, MealId } from '../types';

interface FoodsTabProps {
  selectedDate: string;
  todayISO: string;
  selectedMeal: MealId;
  onSelectMeal: (meal: MealId) => void;
  allFoods: FoodRecord[];
  dayByMeal: Record<MealId, { grams: number; count: number; items: FoodRecord[] }>;
  customFoods: CustomFoodItem[];
  onAddFood: (food: string, grams: number, meal: MealId, ck: string) => void;
  onEditFood: (id: string, updates: { food: string; g: number; meal: MealId; date: string }) => void;
  onDeleteFood: (record: FoodRecord) => void;
  onAddCustomFood: (n: string, por: string, g: number) => void;
  onDeleteCustomFood: (cid: string) => void;
}

type FilterOption = 'todos' | 'mas-usados' | 'mis-alimentos' | string;

interface SelectableFood {
  id: string;
  ck: string;
  n: string;
  por: string;
  g: number;
  group: string;
  isCustom?: boolean;
}

export const FoodsTab: React.FC<FoodsTabProps> = ({
  selectedDate,
  todayISO,
  selectedMeal,
  onSelectMeal,
  allFoods,
  dayByMeal,
  customFoods,
  onAddFood,
  onEditFood,
  onDeleteFood,
  onAddCustomFood,
  onDeleteCustomFood,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('todos');

  // Portion modal state
  const [pickedFood, setPickedFood] = useState<SelectableFood | null>(null);
  const [portions, setPortions] = useState<number>(1);

  // Custom food form modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPortion, setCustomPortion] = useState('');
  const [customGrams, setCustomGrams] = useState('');
  const [customError, setCustomError] = useState('');

  // Manual entry form
  const [manualName, setManualName] = useState('');
  const [manualGrams, setManualGrams] = useState('');
  const [manualError, setManualError] = useState('');

  // Edit logged food modal
  const [editingRecord, setEditingRecord] = useState<FoodRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrams, setEditGrams] = useState('');
  const [editMeal, setEditMeal] = useState<MealId>('desayuno');
  const [editDate, setEditDate] = useState('');
  const [editError, setEditError] = useState('');

  const usageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of allFoods) {
      const key = f.ck || normalizeText(f.food);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [allFoods]);

  const combinedFoods: SelectableFood[] = useMemo(() => {
    const customList: SelectableFood[] = customFoods.map((c) => ({
      id: c.cid,
      ck: c.cid,
      n: c.n,
      por: c.por,
      g: c.g,
      group: 'Mis alimentos',
      isCustom: true,
    }));
    const catalogList: SelectableFood[] = FOOD_CATALOG.map((item: CatalogFood) => ({
      id: item.id,
      ck: item.id,
      n: item.n,
      por: item.por,
      g: item.g,
      group: item.group,
      isCustom: false,
    }));
    return [...customList, ...catalogList];
  }, [customFoods]);

  const filteredFoods = useMemo(() => {
    const q = normalizeText(searchQuery);
    let list = combinedFoods;

    if (activeFilter === 'mis-alimentos') {
      list = list.filter((f) => f.isCustom);
    } else if (activeFilter === 'mas-usados') {
      list = list
        .filter((f) => (usageCounts.get(f.ck) || 0) > 0)
        .sort((a, b) => (usageCounts.get(b.ck) || 0) - (usageCounts.get(a.ck) || 0));
    } else if (activeFilter !== 'todos') {
      list = list.filter((f) => f.group === activeFilter);
    }

    if (q) {
      list = list.filter(
        (f) => normalizeText(f.n).includes(q) || normalizeText(f.group).includes(q)
      );
    }

    return list;
  }, [combinedFoods, activeFilter, searchQuery, usageCounts]);

  const openFoodPicker = (food: SelectableFood) => {
    setPickedFood(food);
    setPortions(1);
  };

  const handleAddPicked = () => {
    if (!pickedFood) return;
    const totalG = round2(pickedFood.g * portions);
    const label =
      portions === 1
        ? pickedFood.n
        : `${pickedFood.n} (${formatGrams(portions)} raciones)`;
    onAddFood(label, totalG, selectedMeal, pickedFood.ck);
    setPickedFood(null);
  };

  const openCustomCreator = (prefillName = '') => {
    setCustomName(prefillName);
    setCustomPortion('');
    setCustomGrams('');
    setCustomError('');
    setShowCustomModal(true);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim();
    const portion = customPortion.trim() || '1 ración';
    const g = parseDecimalInput(customGrams);
    if (!name) {
      setCustomError('Escribe el nombre del alimento.');
      return;
    }
    if (!Number.isFinite(g) || g < 0) {
      setCustomError('Introduce los gramos de proteína por ración.');
      return;
    }
    onAddCustomFood(name, portion, round2(g));
    setShowCustomModal(false);
    setActiveFilter('mis-alimentos');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = manualName.trim();
    const g = parseDecimalInput(manualGrams);
    if (!name) {
      setManualError('Escribe el nombre del alimento.');
      return;
    }
    if (!Number.isFinite(g) || g < 0) {
      setManualError('Introduce una cantidad de proteína válida.');
      return;
    }
    onAddFood(name, round2(g), selectedMeal, normalizeText(name));
    setManualName('');
    setManualGrams('');
    setManualError('');
  };

  const openEditRecord = (rec: FoodRecord) => {
    setEditingRecord(rec);
    setEditName(rec.food);
    setEditGrams(String(rec.g).replace('.', ','));
    setEditMeal(rec.meal);
    setEditDate(rec.date);
    setEditError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const name = editName.trim();
    const g = parseDecimalInput(editGrams);
    if (!name) {
      setEditError('El nombre no puede estar vacío.');
      return;
    }
    if (!Number.isFinite(g) || g < 0) {
      setEditError('Introduce una cantidad de proteína válida.');
      return;
    }
    if (!editDate || editDate > todayISO) {
      setEditError('La fecha no puede ser futura.');
      return;
    }
    onEditFood(editingRecord.id, {
      food: name,
      g: round2(g),
      meal: editMeal,
      date: editDate,
    });
    setEditingRecord(null);
  };

  const selectedMealMeta = MEAL_MAP[selectedMeal];

  const dayItemsCount = MEALS.reduce((sum, m) => sum + dayByMeal[m.id].items.length, 0);

  return (
    <div className="space-y-6">
      {/* 5-Moment Selector */}
      <section aria-label="Momento del día">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
            Añadir a momento del día
          </h2>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Activo: <strong className={selectedMealMeta.textClass}>{selectedMealMeta.label}</strong>
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {MEALS.map((meal) => {
            const isActive = selectedMeal === meal.id;
            return (
              <button
                key={meal.id}
                type="button"
                onClick={() => onSelectMeal(meal.id)}
                className={`min-h-[44px] px-1.5 py-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  isActive
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white font-bold shadow-xs'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meal.colorHex }}
                  aria-hidden="true"
                />
                <span className="text-[11px] sm:text-xs leading-tight whitespace-nowrap truncate max-w-full">
                  {meal.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Food Catalog Search & Filter */}
      <section
        aria-label="Tabla de alimentos"
        className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-neutral-950 dark:text-white">
              Tabla de alimentos
            </h2>
            <button
              type="button"
              onClick={() => openCustomCreator(searchQuery.trim())}
              className="min-h-[44px] px-3 flex items-center gap-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Crear alimento</span>
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar alimento (ej. platano, pan, queso)..."
              aria-label="Buscar alimento"
              className="w-full min-h-[44px] pl-10 pr-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Group filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'mas-usados', label: 'Más usados' },
              { id: 'mis-alimentos', label: `Mis alimentos (${customFoods.length})` },
              ...FOOD_GROUPS.map((g) => ({ id: g, label: g })),
            ].map((filter) => {
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
                    active
                      ? 'bg-emerald-900 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-700'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Food List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
          {filteredFoods.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {activeFilter === 'mas-usados'
                  ? 'Todavía no tienes alimentos frecuentes registrados.'
                  : activeFilter === 'mis-alimentos' && customFoods.length === 0
                  ? 'Aún no has guardado alimentos propios.'
                  : 'No se encontraron alimentos con esa búsqueda.'}
              </p>
              <button
                type="button"
                onClick={() => openCustomCreator(searchQuery.trim())}
                className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>
                  {searchQuery.trim()
                    ? `Guardar "${searchQuery.trim()}" en Mis alimentos`
                    : 'Guardar nuevo alimento'}
                </span>
              </button>
            </div>
          ) : (
            filteredFoods.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 px-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => openFoodPicker(item)}
                  className="flex-1 min-h-[56px] py-2.5 text-left flex items-center justify-between gap-3 cursor-pointer min-w-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-neutral-950 dark:text-neutral-100 leading-snug">
                      {item.n}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                      {item.group} · Ración: {item.por}
                    </div>
                  </div>
                  <span className="font-condensed text-lg font-bold text-emerald-900 dark:text-emerald-400 shrink-0 tabular-nums">
                    {formatGrams(item.g)} g
                  </span>
                </button>
                {item.isCustom && (
                  <button
                    type="button"
                    onClick={() => onDeleteCustomFood(item.id)}
                    aria-label={`Borrar ${item.n} de Mis alimentos`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Manual Entry Form */}
      <section
        aria-label="Entrada manual"
        className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4"
      >
        <h2 className="text-base font-bold text-neutral-950 dark:text-white mb-3">
          Añadir manualmente a {selectedMealMeta.label}
        </h2>
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Alimento (ej. Sopa de verduras)"
              aria-label="Nombre del alimento manual"
              className="sm:col-span-2 min-h-[44px] px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-emerald-500"
            />
            <input
              type="text"
              inputMode="decimal"
              value={manualGrams}
              onChange={(e) => setManualGrams(e.target.value)}
              placeholder="Proteína (g)"
              aria-label="Gramos de proteína manual"
              className="min-h-[44px] px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm tabular-nums text-neutral-950 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-emerald-500"
            />
          </div>
          {manualError && (
            <p className="text-xs font-medium text-red-700 dark:text-red-400">{manualError}</p>
          )}
          <button
            type="submit"
            className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            Añadir a {selectedMealMeta.label}
          </button>
        </form>
      </section>

      {/* Today's Logged Foods Grouped by Moment */}
      <section aria-label="Comidas registradas del día" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-950 dark:text-white">
            Lo comido este día
          </h2>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 tabular-nums">
            {dayItemsCount} {dayItemsCount === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {dayItemsCount === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No hay alimentos registrados para este día todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {MEALS.map((meal) => {
              const bucket = dayByMeal[meal.id];
              if (bucket.items.length === 0) return null;
              return (
                <div
                  key={meal.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl overflow-hidden"
                >
                  <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-xs shrink-0"
                        style={{ backgroundColor: meal.colorHex }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-bold text-neutral-950 dark:text-white">
                        {meal.label}
                      </span>
                    </div>
                    <span className="font-condensed text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {formatGrams(bucket.grams)} g
                    </span>
                  </div>

                  <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {bucket.items.map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-2 flex items-center justify-between gap-2 min-h-[52px]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 break-words">
                            {item.food}
                          </div>
                          <div className="font-condensed text-base font-bold text-emerald-900 dark:text-emerald-400">
                            {formatGrams(item.g)} g
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditRecord(item)}
                            aria-label={`Editar ${item.food}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteFood(item)}
                            aria-label={`Borrar ${item.food}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Portion Selector Bottom Sheet / Modal */}
      {pickedFood && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setPickedFood(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Seleccionar raciones"
            className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-300 dark:border-neutral-700 p-5 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {pickedFood.group}
                </p>
                <h3 className="text-lg font-bold text-neutral-950 dark:text-white mt-0.5">
                  {pickedFood.n}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                  1 ración: {pickedFood.por} ({formatGrams(pickedFood.g)} g)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickedFood(null)}
                aria-label="Cerrar"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper - / + 0.5 */}
            <div className="bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setPortions((p) => Math.max(0.5, round2(p - 0.5)))}
                  aria-label="Restar media ración"
                  className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 text-neutral-950 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 active:scale-95 cursor-pointer"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <div className="font-condensed text-4xl font-extrabold text-neutral-950 dark:text-white">
                    {formatGrams(portions)}
                  </div>
                  <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {portions === 1 ? 'ración' : 'raciones'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPortions((p) => round2(p + 0.5))}
                  aria-label="Sumar media ración"
                  className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 text-neutral-950 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1, 1.5, 2].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPortions(preset)}
                    className={`min-h-[40px] rounded-lg text-xs font-semibold tabular-nums border cursor-pointer transition-colors ${
                      portions === preset
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white'
                        : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {formatGrams(preset)}×
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddPicked}
              className="w-full min-h-[50px] px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-base font-bold transition-colors cursor-pointer"
            >
              Añadir {formatGrams(round2(pickedFood.g * portions), true)} g a {selectedMealMeta.label}
            </button>
          </div>
        </div>
      )}

      {/* Custom Food Creator Modal */}
      {showCustomModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowCustomModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Crear alimento en Mis alimentos"
            className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-300 dark:border-neutral-700 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-950 dark:text-white">
                Nuevo alimento en Mis alimentos
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                aria-label="Cerrar"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nombre del alimento
                </span>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ej. Pan sin gluten especial"
                  className="mt-1 w-full min-h-[44px] px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Ración
                </span>
                <input
                  type="text"
                  value={customPortion}
                  onChange={(e) => setCustomPortion(e.target.value)}
                  placeholder="Ej. 50 g o 2 rebanadas"
                  className="mt-1 w-full min-h-[44px] px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Gramos de proteína por ración
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={customGrams}
                  onChange={(e) => setCustomGrams(e.target.value)}
                  placeholder="Ej. 1,45"
                  className="mt-1 w-full min-h-[44px] px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm tabular-nums text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </label>
              {customError && (
                <p className="text-xs font-medium text-red-700 dark:text-red-400">{customError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
                >
                  Guardar alimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Logged Food Modal */}
      {editingRecord && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setEditingRecord(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar alimento registrado"
            className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-300 dark:border-neutral-700 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-950 dark:text-white">
                Editar registro
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                aria-label="Cerrar"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nombre
                </span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full min-h-[44px] px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Proteína (g)
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editGrams}
                    onChange={(e) => setEditGrams(e.target.value)}
                    className="mt-1 w-full min-h-[44px] px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm tabular-nums text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Fecha
                  </span>
                  <input
                    type="date"
                    max={todayISO}
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1 w-full min-h-[44px] px-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Momento del día
                </span>
                <select
                  value={editMeal}
                  onChange={(e) => setEditMeal(e.target.value as MealId)}
                  className="mt-1 w-full min-h-[44px] px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                >
                  {MEALS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              {editError && (
                <p className="text-xs font-medium text-red-700 dark:text-red-400">{editError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="min-h-[44px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
