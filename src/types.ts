export type MealId = 'desayuno' | 'media' | 'comida' | 'merienda' | 'cena';

export type TabId = 'comidas' | 'medicacion' | 'grafica' | 'exportar';

export interface FoodRecord {
  id: string;
  type: 'p';
  date: string; // AAAA-MM-DD
  meal: MealId;
  food: string;
  g: number;
  ck: string;
  ts: number;
}

export interface MedRecord {
  id: string;
  type: 'm';
  date: string; // AAAA-MM-DD
  name: string;
  dose: string;
  time: string;
  note: string;
  taken: boolean;
  takenAt: string;
  ts: number;
  plan?: boolean;
  pid?: string;
  mom?: MealId;
}

export interface PautaItem {
  pid: string;
  qty: string;
  name: string;
  mom: MealId;
}

export interface CustomFoodItem {
  cid: string;
  n: string;
  por: string;
  g: number;
}

export interface SettingsRecord {
  id: 'ajustes';
  type: 's';
  limit: number;
  warn: number;
  pauta: PautaItem[];
  custom: CustomFoodItem[];
}

export type AnyRecord = FoodRecord | MedRecord | SettingsRecord;

export interface BackupPayload {
  app: 'diario-proteinas';
  version: number;
  exportado: string;
  datos: AnyRecord[];
}

export interface CatalogFood {
  id: string;
  group: string;
  n: string;
  por: string;
  g: number;
}

export interface MealMeta {
  id: MealId;
  label: string;
  shortLabel: string;
  colorHex: string;
  dotClass: string;
  textClass: string;
  bgSoftClass: string;
  borderClass: string;
}
