import { CatalogFood, MealId, MealMeta } from '../types';

export const MEALS: MealMeta[] = [
  {
    id: 'desayuno',
    label: 'Desayuno',
    shortLabel: 'Desay.',
    colorHex: '#d97706',
    dotClass: 'bg-amber-600 dark:bg-amber-500',
    textClass: 'text-amber-700 dark:text-amber-400',
    bgSoftClass: 'bg-amber-50 dark:bg-amber-950/50',
    borderClass: 'border-amber-300 dark:border-amber-800',
  },
  {
    id: 'media',
    label: 'Media mañana',
    shortLabel: 'M. mañ.',
    colorHex: '#16a34a',
    dotClass: 'bg-green-600 dark:bg-green-500',
    textClass: 'text-green-700 dark:text-green-400',
    bgSoftClass: 'bg-green-50 dark:bg-green-950/50',
    borderClass: 'border-green-300 dark:border-green-800',
  },
  {
    id: 'comida',
    label: 'Comida',
    shortLabel: 'Comida',
    colorHex: '#c2410c',
    dotClass: 'bg-[#c2410c] dark:bg-[#ea580c]',
    textClass: 'text-[#b4390a] dark:text-[#fb923c]',
    bgSoftClass: 'bg-orange-50 dark:bg-orange-950/50',
    borderClass: 'border-orange-300 dark:border-orange-800',
  },
  {
    id: 'merienda',
    label: 'Merienda',
    shortLabel: 'Merienda',
    colorHex: '#7c3aed',
    dotClass: 'bg-violet-600 dark:bg-violet-500',
    textClass: 'text-violet-700 dark:text-violet-400',
    bgSoftClass: 'bg-violet-50 dark:bg-violet-950/50',
    borderClass: 'border-violet-300 dark:border-violet-800',
  },
  {
    id: 'cena',
    label: 'Cena',
    shortLabel: 'Cena',
    colorHex: '#2563eb',
    dotClass: 'bg-blue-600 dark:bg-blue-500',
    textClass: 'text-blue-700 dark:text-blue-400',
    bgSoftClass: 'bg-blue-50 dark:bg-blue-950/50',
    borderClass: 'border-blue-300 dark:border-blue-800',
  },
];

export const MEAL_MAP: Record<MealId, MealMeta> = MEALS.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<MealId, MealMeta>
);

export const FOOD_GROUPS: string[] = [
  'Bajos en proteína',
  'Fruta fresca',
  'Fruta seca',
  'Verduras',
  'Patatas',
  'Cereales y pan',
  'Lácteos',
  'Frutos secos y semillas',
  'Legumbres y soja',
  'Huevos',
  'Carne y pescado',
];

export const FOOD_CATALOG: CatalogFood[] = [
  // Bajos en proteína
  { id: 'cat-bp-1', group: 'Bajos en proteína', n: 'Bebida Loprofin LQ (Nutricia)', por: '200 ml', g: 0.8 },
  { id: 'cat-bp-2', group: 'Bajos en proteína', n: 'Salsa de queso (Promin)', por: '30 g', g: 0.98 },
  { id: 'cat-bp-3', group: 'Bajos en proteína', n: 'Hierbas con queso My Snack (Metax)', por: '30 g', g: 1.2 },
  { id: 'cat-bp-4', group: 'Bajos en proteína', n: 'Mezcla para salchichas (Promin)', por: '30 g o 1 sobre', g: 0.9 },

  // Fruta fresca
  { id: 'cat-ff-1', group: 'Fruta fresca', n: 'Plátano', por: '120 g o 1 mediano', g: 1.31 },
  { id: 'cat-ff-2', group: 'Fruta fresca', n: 'Naranja o mandarinas', por: '150 g, 1 mandarina mediana o 2 pequeñas', g: 1.41 },
  { id: 'cat-ff-3', group: 'Fruta fresca', n: 'Zumo de naranja', por: '200 ml', g: 1.47 },
  { id: 'cat-ff-4', group: 'Fruta fresca', n: 'Melocotón o nectarina', por: '150 g o 1 mediano', g: 1.48 },
  { id: 'cat-ff-5', group: 'Fruta fresca', n: 'Granada', por: '100 g o semillas de media fruta grande', g: 1.67 },

  // Fruta seca
  { id: 'cat-fs-1', group: 'Fruta seca', n: 'Pasas o grosellas', por: '30 g o 1 puñado pequeño', g: 1 },
  { id: 'cat-fs-2', group: 'Fruta seca', n: 'Albaricoques secos', por: '40 g o 5 mitades', g: 1.36 },
  { id: 'cat-fs-3', group: 'Fruta seca', n: 'Dátiles', por: '60 g o 2-3 grandes', g: 1.09 },
  { id: 'cat-fs-4', group: 'Fruta seca', n: 'Higos secos', por: '40 g o 2 pequeños', g: 1.32 },
  { id: 'cat-fs-5', group: 'Fruta seca', n: 'Ciruelas pasas', por: '50 g o 5 ciruelas', g: 1.09 },

  // Verduras
  { id: 'cat-ve-1', group: 'Verduras', n: 'Verduras de proteína moderada (brócoli, col, judías verdes, coliflor, espárragos)', por: '80 g', g: 1.57 },
  { id: 'cat-ve-2', group: 'Verduras', n: 'Verduras ricas en proteína (guisantes, maíz, coles de Bruselas, espinacas, col rizada)', por: '80 g', g: 2.62 },

  // Patatas
  { id: 'cat-pa-1', group: 'Patatas', n: 'Patata o boniato, hervido o al horno', por: '150-200 g', g: 3.33 },
  { id: 'cat-pa-2', group: 'Patatas', n: 'Patatas fritas (tipo bastón)', por: '120 g o 1 ración mediana', g: 3.79 },

  // Cereales y pan
  { id: 'cat-cp-1', group: 'Cereales y pan', n: 'Pan de panadería (baguette o masa madre)', por: '60 g o 1 rebanada', g: 7.8 },
  { id: 'cat-cp-2', group: 'Cereales y pan', n: 'Pan italiano, chapata o focaccia', por: '60 g', g: 5.69 },
  { id: 'cat-cp-3', group: 'Cereales y pan', n: 'Pan de centeno o de especias', por: '60 g', g: 5.16 },
  { id: 'cat-cp-4', group: 'Cereales y pan', n: 'Pan de molde, blanco o integral', por: '30 g o 1 rebanada', g: 3.79 },
  { id: 'cat-cp-5', group: 'Cereales y pan', n: 'Pasta, guarnición', por: '80 g cocida', g: 4.31 },
  { id: 'cat-cp-6', group: 'Cereales y pan', n: 'Pasta, plato principal', por: '200 g cocida', g: 10.77 },
  { id: 'cat-cp-7', group: 'Cereales y pan', n: 'Arroz blanco o integral', por: '60 g en seco o 150 g cocido', g: 4.24 },
  { id: 'cat-cp-8', group: 'Cereales y pan', n: 'Tortillas de harina', por: '70 g', g: 5.74 },
  { id: 'cat-cp-9', group: 'Cereales y pan', n: 'Cereales de maíz o arroz', por: '30 g', g: 1.81 },
  { id: 'cat-cp-10', group: 'Cereales y pan', n: 'Cereales de chocolate (Nesquik, Chocapic)', por: '30 g', g: 2.6 },
  { id: 'cat-cp-11', group: 'Cereales y pan', n: 'Cereales integrales (salvado, Cheerios, Weetabix)', por: '45 g', g: 4.84 },
  { id: 'cat-cp-12', group: 'Cereales y pan', n: 'Granola o muesli', por: '40 g', g: 4.4 },
  { id: 'cat-cp-13', group: 'Cereales y pan', n: 'Avena o Farina', por: '40 g en seco', g: 4.43 },
  { id: 'cat-cp-14', group: 'Cereales y pan', n: 'Magdalena', por: '60 g o 1', g: 5.25 },
  { id: 'cat-cp-15', group: 'Cereales y pan', n: 'Bagel', por: '100 g o 1', g: 10.75 },
  { id: 'cat-cp-16', group: 'Cereales y pan', n: 'Crepe', por: '60 g o 1 de 20 cm', g: 3.56 },
  { id: 'cat-cp-17', group: 'Cereales y pan', n: 'Tortitas', por: '40 g o 1 de 10 cm', g: 2.46 },
  { id: 'cat-cp-18', group: 'Cereales y pan', n: 'Gofre', por: '1 normal (120 g)', g: 9.48 },

  // Lácteos
  { id: 'cat-la-1', group: 'Lácteos', n: 'Leche de vaca, soja o guisante', por: '200 ml', g: 6.28 },
  { id: 'cat-la-2', group: 'Lácteos', n: 'Yogur normal (no griego)', por: '125 g o 1 bote', g: 5.64 },
  { id: 'cat-la-3', group: 'Lácteos', n: 'Yogur líquido (no griego)', por: '180 ml', g: 5.91 },
  { id: 'cat-la-4', group: 'Lácteos', n: 'Yogur ácido (ayran)', por: '200 ml', g: 4 },
  { id: 'cat-la-5', group: 'Lácteos', n: 'Kéfir', por: '200 ml', g: 7.5 },
  { id: 'cat-la-6', group: 'Lácteos', n: 'Queso rallado', por: '10 g o 2 cucharadas', g: 3.27 },
  { id: 'cat-la-7', group: 'Lácteos', n: 'Queso en lonchas', por: '20-25 g o 1 loncha', g: 5.46 },
  { id: 'cat-la-8', group: 'Lácteos', n: 'Requesón o ricotta', por: '30 g', g: 3.47 },
  { id: 'cat-la-9', group: 'Lácteos', n: 'Queso cremoso', por: '30 g', g: 3.28 },
  { id: 'cat-la-10', group: 'Lácteos', n: 'Helado', por: '80 g o 1 bola', g: 2.8 },

  // Frutos secos y semillas
  { id: 'cat-fn-1', group: 'Frutos secos y semillas', n: 'Nueces', por: '25-30 g', g: 4.89 },
  { id: 'cat-fn-2', group: 'Frutos secos y semillas', n: 'Mantequilla de frutos secos', por: '15 g o 1 cucharada', g: 3.36 },
  { id: 'cat-fn-3', group: 'Frutos secos y semillas', n: 'Semillas', por: '15 g', g: 3.26 },

  // Legumbres y soja
  { id: 'cat-ls-1', group: 'Legumbres y soja', n: 'Alubias, lentejas o edamame (cocidos)', por: '60 g o 4 cucharadas', g: 5.06 },
  { id: 'cat-ls-2', group: 'Legumbres y soja', n: 'Tofu', por: '100 g', g: 9.51 },
  { id: 'cat-ls-3', group: 'Legumbres y soja', n: 'Hummus', por: '30 g', g: 1.46 },

  // Huevos
  { id: 'cat-hu-1', group: 'Huevos', n: 'Huevo', por: '1 grande', g: 6.19 },

  // Carne y pescado
  { id: 'cat-ca-1', group: 'Carne y pescado', n: 'Carne (vacuno, cerdo, ave, cordero)', por: '30 g cocida', g: 8.2 },
  { id: 'cat-ca-2', group: 'Carne y pescado', n: 'Pescado', por: '30 g cocido', g: 7.13 },
  { id: 'cat-ca-3', group: 'Carne y pescado', n: 'Charcutería', por: '20-25 g', g: 4.37 },
  { id: 'cat-ca-4', group: 'Carne y pescado', n: 'Beicon', por: '12 g (1 loncha)', g: 4.07 },
  { id: 'cat-ca-5', group: 'Carne y pescado', n: 'Salchicha', por: '30 g (1 de cerdo)', g: 5.51 },
  { id: 'cat-ca-6', group: 'Carne y pescado', n: 'Salchicha alemana o italiana', por: '120 g', g: 19.35 },
];

export function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function formatGrams(val: number, forceTwoDecimals = false): string {
  const rounded = round2(val);
  if (forceTwoDecimals) {
    return rounded.toFixed(2).replace('.', ',');
  }
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, '');
  return str.replace('.', ',');
}

export function parseDecimalInput(raw: string): number {
  const cleaned = raw.trim().replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function getDefaultMealByTime(date = new Date()): MealId {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes < 10 * 60) return 'desayuno';
  if (minutes < 13 * 60) return 'media';
  if (minutes < 16 * 60 + 30) return 'comida';
  if (minutes < 20 * 60) return 'merienda';
  return 'cena';
}
