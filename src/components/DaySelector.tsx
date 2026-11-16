import React, { useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { formatDateSpanish } from '../utils/storage';

interface DaySelectorProps {
  selectedDate: string;
  todayISO: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSelectDate: (dateISO: string) => void;
  onGoToday: () => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDate,
  todayISO,
  onPrevDay,
  onNextDay,
  onSelectDate,
  onGoToday,
}) => {
  const isToday = selectedDate >= todayISO;
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Fallback below
      }
    }
    input.focus();
    input.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-1.5">
        <button
          type="button"
          onClick={onPrevDay}
          aria-label="Día anterior"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="relative flex-1 flex items-center justify-center min-w-0">
          <button
            type="button"
            onClick={openPicker}
            className="min-h-[44px] px-3 flex items-center justify-center gap-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer max-w-full"
          >
            <Calendar className="w-4 h-4 shrink-0 text-emerald-800 dark:text-emerald-400" />
            <span className="text-sm sm:text-base font-semibold text-neutral-950 dark:text-neutral-100 truncate">
              {isToday ? `Hoy · ${formatDateSpanish(selectedDate)}` : formatDateSpanish(selectedDate)}
            </span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            max={todayISO}
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value && e.target.value <= todayISO) {
                onSelectDate(e.target.value);
              }
            }}
            aria-label="Seleccionar fecha"
            className="sr-only"
          />
        </div>

        <button
          type="button"
          onClick={onNextDay}
          disabled={isToday}
          aria-label="Día siguiente"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {!isToday && (
        <button
          type="button"
          onClick={onGoToday}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Volver a hoy</span>
        </button>
      )}
    </div>
  );
};
