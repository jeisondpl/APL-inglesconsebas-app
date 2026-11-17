/**
 * Reglas de los planes que la API no expone. Espejo de `PLAN_RULES` de la web de Leap
 * (`app/index.html` ~línea 738), que es lo que ve hoy el estudiante: mínimo de clases del ciclo y
 * nombre visible (sin emoji). Es una constante duplicada más de las que lista `app/CLAUDE.md`: si
 * cambia un plan en Leap, cambia aquí también.
 */
export interface IReglaPlan {
  minimo: number;
  nombre: string;
  flex: boolean;
}

export const REGLAS_PLAN: Readonly<Record<string, IReglaPlan>> = {
  Starter: { minimo: 4, nombre: 'Starter', flex: false },
  Essential: { minimo: 8, nombre: 'Essential', flex: false },
  Progress: { minimo: 12, nombre: 'Progress', flex: false },
  Intensive: { minimo: 16, nombre: 'Intensive', flex: false },
  Master: { minimo: 20, nombre: 'Master', flex: false },
  'Power⚡': { minimo: 8, nombre: 'Power', flex: false },
  'Flex4🎯': { minimo: 4, nombre: 'Starter-Flex', flex: true },
  'Flex8🎯': { minimo: 8, nombre: 'Essential-Flex', flex: true },
  'Flex12🎯': { minimo: 12, nombre: 'Progress-Flex', flex: true },
  'Flex16🎯': { minimo: 16, nombre: 'Intensive-Flex', flex: true },
  'Flex20🎯': { minimo: 20, nombre: 'Master-Flex', flex: true },
};

/** Plan Power⚡: el total del ciclo son sus sesiones, no un mínimo (web, StudentHome). */
export const PLAN_POWER = 'Power⚡';

/**
 * Estados que no cuentan para el ciclo (pierden el número de clase). Web: StudentHome excluye
 * estos tres al contar tomadas y total.
 */
export const ESTADOS_SIN_IMPACTO: readonly string[] = [
  'holiday_no_impact',
  'cancelled_no_impact',
  'cancelled_late_no_impact',
];

/** Antelación para cancelar sin que cuente como tomada: 24 h en Flex, 12 h en el resto. */
export const HORAS_AVISO_FLEX = 24;
export const HORAS_AVISO = 12;

/** La web acompaña la clase hasta el minuto 50: hasta entonces sigue siendo «la próxima». */
export const MINUTOS_CLASE_EN_CURSO = 50;

/** Colombia está en UTC−5 todo el año (sin horario de verano). */
export const DESFASE_BOGOTA_MS = -5 * 60 * 60 * 1000;

/** Máximo de tareas pendientes que se listan en el inicio. */
export const MAX_TAREAS_INICIO = 3;
