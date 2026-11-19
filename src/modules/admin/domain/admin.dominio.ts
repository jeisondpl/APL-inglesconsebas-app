import type { HttpResponse } from '@/shared/lib/HttpResponse';

export interface IAlumnoAlerta {
  id: string;
  nombre: string;
  plan: string;
}

export interface ICicloPorVencer extends IAlumnoAlerta {
  /** `Y-m-d` en que termina el ciclo. */
  fin: string;
  diasRestantes: number;
}

export interface ICicloEmpiezaHoy extends IAlumnoAlerta {
  inicio: string;
}

export interface IFlexSinClases extends IAlumnoAlerta {
  minimo: number;
  usadas: number;
}

export interface ICumpleanos {
  id: string;
  nombre: string;
  /** `Y-m-d` de nacimiento. */
  fecha: string;
  /** Días que faltan (0 = hoy). */
  dias: number;
}

/** Lo que Leap avisa al admin (endpoint `alerts`). */
export interface IAlertasAdmin {
  porVencer: ICicloPorVencer[];
  pagosPendientes: IAlumnoAlerta[];
  empiezanHoy: ICicloEmpiezaHoy[];
  flexSinClases: IFlexSinClases[];
  cumpleanos: ICumpleanos[];
}

/** Clases «por marcar» de una profe (acción `pending_attendance_admin`). */
export interface IAsistenciaPendienteProfe {
  profe: string;
  total: number;
  /** De hace más de 2 días. */
  viejas: number;
  /** `Y-m-d` de la más antigua. */
  masAntigua: string;
}

/** Puerto del inicio del admin (F1-04, 1.19): lecturas que Leap permite solo al admin. */
export interface AdminRepository {
  alertas(): Promise<HttpResponse<IAlertasAdmin>>;
  asistenciasPendientes(): Promise<HttpResponse<IAsistenciaPendienteProfe[]>>;
}

/** Una sección del inicio: cada una carga (y falla) por separado. */
export type SeccionAdmin<T> =
  | { tipo: 'ok'; datos: T }
  | { tipo: 'error'; msg: string };

export interface IResumenAdmin {
  alertas: SeccionAdmin<IAlertasAdmin>;
  asistencias: SeccionAdmin<IAsistenciaPendienteProfe[]>;
}

export const mensajesAdmin = {
  noSeActualizo: 'No pudimos actualizar el inicio',
} as const;
