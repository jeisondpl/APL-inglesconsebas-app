import type { ClienteApi } from '@/shared/lib/api';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  AdminRepository,
  IAlertasAdmin,
  IAlumnoAlerta,
  IAsistenciaPendienteProfe,
  ICicloEmpiezaHoy,
  ICicloPorVencer,
  ICumpleanos,
  IFlexSinClases,
} from '../domain/admin.dominio';

const API = 'api.php';

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const texto = (v: unknown): string => (typeof v === 'string' ? v : '');
const numero = (v: unknown): number => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
};

/** Lista de objetos de Leap pasados por `f`; lo que no es objeto se descarta. */
function lista<T>(v: unknown, f: (o: Record<string, unknown>) => T): T[] {
  return Array.isArray(v) ? v.filter(esObjeto).map(f) : [];
}

const alumno = (o: Record<string, unknown>): IAlumnoAlerta => ({
  id: texto(o.id),
  nombre: texto(o.name),
  plan: texto(o.pkg),
});

/** `alerts` de Leap → el modelo del dominio. Todo lo que falte queda vacío. */
export function alertasDe(v: Record<string, unknown>): IAlertasAdmin {
  return {
    porVencer: lista(
      v.expiring,
      (o): ICicloPorVencer => ({
        ...alumno(o),
        fin: texto(o.cycleEnd),
        diasRestantes: numero(o.daysLeft),
      }),
    ),
    pagosPendientes: lista(v.paymentPending, alumno),
    empiezanHoy: lista(
      v.startedToday,
      (o): ICicloEmpiezaHoy => ({ ...alumno(o), inicio: texto(o.cycleStart) }),
    ),
    flexSinClases: lista(
      v.flexNoClasses,
      (o): IFlexSinClases => ({
        ...alumno(o),
        minimo: numero(o.planMin),
        usadas: numero(o.used),
      }),
    ),
    cumpleanos: lista(
      v.cumples,
      (o): ICumpleanos => ({
        id: texto(o.id),
        nombre: texto(o.name),
        fecha: texto(o.birthday),
        dias: numero(o.daysLeft),
      }),
    ),
  };
}

const fallo = <T>(r: HttpResponse<unknown>): HttpResponse<T> =>
  respuestaError(r.msg || textosComunes.errores.desconocido, r.code);
const invalida = <T>(code?: number): HttpResponse<T> =>
  respuestaError(textosComunes.errores.respuestaInvalida, code);

/** Adaptador de `alerts` y `class_sessions · pending_attendance_admin` (solo admin). */
export function crearApiAdminRepository(api: ClienteApi): AdminRepository {
  return {
    async alertas() {
      const r = await api.get<unknown>(API, { endpoint: 'alerts' });
      if (r.error) {
        return fallo(r);
      }
      return esObjeto(r.response)
        ? respuestaOk(alertasDe(r.response), r.code)
        : invalida(r.code);
    },
    async asistenciasPendientes() {
      const r = await api.post<unknown>(
        API,
        { action: 'pending_attendance_admin' },
        { endpoint: 'class_sessions' },
      );
      if (r.error) {
        return fallo(r);
      }
      if (!Array.isArray(r.response)) {
        return invalida(r.code);
      }
      const filas: IAsistenciaPendienteProfe[] = lista(
        r.response,
        (o): IAsistenciaPendienteProfe => ({
          profe: texto(o.teacher_name),
          total: numero(o.total),
          viejas: numero(o.viejas),
          masAntigua: texto(o.mas_antigua),
        }),
      );
      return respuestaOk(filas, r.code);
    },
  };
}

export interface IOpcionesMemoriaAdmin {
  alertas?: IAlertasAdmin;
  asistencias?: IAsistenciaPendienteProfe[];
  falla?: Partial<
    Record<'alertas' | 'asistencias', { msg: string; code?: number }>
  >;
}

/** Alertas vacías: lo que ve el admin cuando no hay nada que atender. */
export const ALERTAS_VACIAS: IAlertasAdmin = {
  porVencer: [],
  pagosPendientes: [],
  empiezanHoy: [],
  flexSinClases: [],
  cumpleanos: [],
};

/** Puerto en memoria para pruebas (vacío por defecto). */
export function crearMemoriaAdminRepository(
  o: IOpcionesMemoriaAdmin = {},
): AdminRepository {
  return {
    async alertas() {
      const f = o.falla?.alertas;
      return f
        ? respuestaError(f.msg, f.code)
        : respuestaOk(o.alertas ?? ALERTAS_VACIAS);
    },
    async asistenciasPendientes() {
      const f = o.falla?.asistencias;
      return f
        ? respuestaError(f.msg, f.code)
        : respuestaOk(o.asistencias ?? []);
    },
  };
}
