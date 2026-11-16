import React, { useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  AppDataState,
  ImportResult,
  buildCsvExport,
  buildDayTextSummary,
  buildJsonBackup,
  buildMultiDayTextSummary,
  importJsonBackup,
} from '../utils/storage';

interface ExportTabProps {
  selectedDate: string;
  todayISO: string;
  state: AppDataState;
  onImportState: (result: ImportResult) => void;
}

export const ExportTab: React.FC<ExportTabProps> = ({
  selectedDate,
  todayISO,
  state,
  onImportState,
}) => {
  const [copiedMode, setCopiedMode] = useState<'day' | '7days' | null>(null);
  const [importMessage, setImportMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dayText = useMemo(
    () => buildDayTextSummary(selectedDate, state),
    [selectedDate, state]
  );

  const handleCopy = async (mode: 'day' | '7days') => {
    const text =
      mode === 'day' ? dayText : buildMultiDayTextSummary(selectedDate, 7, state);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMode(mode);
      setTimeout(() => setCopiedMode(null), 2500);
    } catch {
      // Fallback textarea copy
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedMode(mode);
      setTimeout(() => setCopiedMode(null), 2500);
    }
  };

  const triggerDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csv = buildCsvExport(state);
    triggerDownload(csv, `diario-proteinas-${todayISO}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleDownloadJson = () => {
    const payload = buildJsonBackup(state);
    triggerDownload(
      JSON.stringify(payload, null, 2),
      `diario-proteinas-copia-${todayISO}.json`,
      'application/json;charset=utf-8;'
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const result = importJsonBackup(raw, state);
      onImportState(result);

      const parts: string[] = [];
      if (result.addedFoods > 0) parts.push(`${result.addedFoods} comidas`);
      if (result.addedMeds > 0) parts.push(`${result.addedMeds} tomas`);
      if (result.addedPauta > 0) parts.push(`${result.addedPauta} en pauta`);
      if (result.addedCustom > 0) parts.push(`${result.addedCustom} alimentos propios`);
      if (result.updatedLimits) parts.push('límites actualizados');

      setImportMessage({
        type: 'ok',
        text:
          parts.length > 0
            ? `Importación completada: ${parts.join(', ')}.`
            : 'Copia revisada: no había registros nuevos que añadir.',
      });
    } catch (err) {
      setImportMessage({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : 'No se pudo leer el archivo JSON seleccionado.',
      });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Text Summary for WhatsApp / Email */}
      <section
        aria-label="Resumen en texto"
        className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 space-y-4"
      >
        <div>
          <h2 className="text-base font-bold text-neutral-950 dark:text-white">
            Resumen para WhatsApp o correo
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Incluye fecha, total y límite, comidas por momento y medicación con ✓/✗.
          </p>
        </div>

        <pre className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
          {dayText}
        </pre>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleCopy('day')}
            className="min-h-[48px] px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copiedMode === 'day' ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Resumen del día copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar resumen del día</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleCopy('7days')}
            className="min-h-[48px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copiedMode === '7days' ? (
              <>
                <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>¡Resumen de 7 días copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar resumen de 7 días</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Excel CSV Download */}
      <section
        aria-label="Exportar CSV para Excel"
        className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 space-y-3"
      >
        <div>
          <h2 className="text-base font-bold text-neutral-950 dark:text-white">
            Exportar hoja de cálculo
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Archivo CSV separado por punto y coma (;), con decimales con coma y codificación UTF-8 para Excel.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="w-full sm:w-auto min-h-[48px] px-5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Descargar CSV (Excel)</span>
        </button>
      </section>

      {/* JSON Backup & Restore */}
      <section
        aria-label="Copia de seguridad JSON"
        className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 space-y-3"
      >
        <div>
          <h2 className="text-base font-bold text-neutral-950 dark:text-white">
            Copia de seguridad e importación
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Guarda todos tus datos en formato JSON o recupera una copia. Al importar, se añaden los registros nuevos sin sobrescribir los ya existentes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="min-h-[48px] px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Copia de seguridad (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[48px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Importar copia</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>

        {importMessage && (
          <p
            className={`text-xs font-semibold p-3 rounded-xl border ${
              importMessage.type === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
            }`}
          >
            {importMessage.text}
          </p>
        )}
      </section>

      {/* Install as Mobile App */}
      <section
        aria-label="Instalar aplicación en el móvil"
        className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 space-y-3"
      >
        <div>
          <h2 className="text-base font-bold text-neutral-950 dark:text-white">
            Usar como aplicación en el móvil
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Funciona 100 % en tu dispositivo, sin cuentas, sin conexión a internet y sin IA. Puedes añadir un icono a la pantalla de inicio para abrirla al instante.
          </p>
        </div>

        <PWAInstallButton variant="full" />
      </section>
    </div>
  );
};
