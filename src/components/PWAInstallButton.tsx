import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAction}
        className={
          variant === 'full'
            ? 'w-full min-h-[48px] px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer'
            : 'min-h-[40px] px-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0'
        }
      >
        {isInstallable ? (
          <Download className="w-4 h-4 shrink-0" />
        ) : (
          <Smartphone className="w-4 h-4 shrink-0" />
        )}
        <span>{isInstallable ? 'Instalar app' : 'Instalar en el móvil'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cómo instalar en tu móvil"
            className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-300 dark:border-neutral-700 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-neutral-950 dark:text-white">
                Instalar en tu móvil
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Cerrar"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2.5 text-sm text-neutral-700 dark:text-neutral-300">
                <p className="font-semibold text-neutral-950 dark:text-white">
                  En iPhone o iPad (Safari):
                </p>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>Toca el botón <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba).</li>
                  <li>Baja en el menú y pulsa <strong>Añadir a pantalla de inicio</strong>.</li>
                  <li>Pulsa <strong>Añadir</strong> y tendrás el icono como una app normal, incluso sin internet.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2.5 text-sm text-neutral-700 dark:text-neutral-300">
                <p className="font-semibold text-neutral-950 dark:text-white">
                  En Android (Chrome / Edge):
                </p>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>Toca el menú <strong>⋮</strong> arriba a la derecha del navegador.</li>
                  <li>Pulsa <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</li>
                  <li>Se creará un icono en tu móvil y funcionará incluso sin conexión a internet.</li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-sm font-semibold cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
