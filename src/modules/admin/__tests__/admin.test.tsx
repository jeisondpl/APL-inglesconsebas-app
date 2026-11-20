// F1-04 (1.19): inicio del admin con alertas, asistencias por marcar y cumpleaños.
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import {
  obtenerResumenAdminUseCase,
  useInicioAdminController,
} from '@/modules/admin/aplications/controllers/InicioAdmin.controller';
import type { IAlertasAdmin } from '@/modules/admin/domain/admin.dominio';
import {
  alertasDe,
  ALERTAS_VACIAS,
  crearApiAdminRepository,
  crearMemoriaAdminRepository,
} from '@/modules/admin/infrastructure/adminRepositories';
import { InicioAdminScreen } from '@/modules/admin/presentation/screens/InicioAdminScreen';
import type { ClienteApi } from '@/shared/lib/api';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

const alertas: IAlertasAdmin = {
  porVencer: [
    {
      id: 's1',
      nombre: 'Ana Torres',
      plan: 'Power',
      fin: '2026-11-20',
      diasRestantes: 2,
    },
    {
      id: 's2',
      nombre: 'Luis Pérez',
      plan: 'Flex8',
      fin: '2026-11-18',
      diasRestantes: 0,
    },
  ],
  pagosPendientes: [{ id: 's3', nombre: 'Sofía Ramírez', plan: 'Starter' }],
  empiezanHoy: [
    { id: 's4', nombre: 'Meli Ruiz', plan: 'Master', inicio: '2026-11-19' },
  ],
  flexSinClases: [
    { id: 's5', nombre: 'Caro Díaz', plan: 'Flex4', minimo: 4, usadas: 4 },
  ],
  cumpleanos: [
    { id: 's1', nombre: 'Ana Torres', fecha: '1995-11-19', dias: 0 },
    { id: 's6', nombre: 'Pablo', fecha: '1990-11-20', dias: 1 },
    { id: 's7', nombre: 'Rosa', fecha: '1988-11-25', dias: 6 },
  ],
};

describe('alertasDe (Leap → dominio)', () => {
  it('mapea los cuatro avisos y los cumpleaños; lo que falta queda vacío', () => {
    const a = alertasDe({
      expiring: [
        {
          id: 'a',
          name: 'Ana',
          pkg: 'Power',
          cycleEnd: '2026-11-20',
          daysLeft: '2',
        },
      ],
      paymentPending: [{ id: 'b', name: 'Beto', pkg: 'Starter' }],
      startedToday: [
        { id: 'c', name: 'Cata', pkg: 'Master', cycleStart: '2026-11-19' },
      ],
      flexNoClasses: [
        { id: 'd', name: 'Dani', pkg: 'Flex4', planMin: 4, used: 4 },
      ],
      cumples: [
        { id: 'e', name: 'Eli', birthday: '1990-11-20', daysLeft: 1 },
        'basura',
      ],
    });
    expect(a.porVencer[0]).toEqual({
      id: 'a',
      nombre: 'Ana',
      plan: 'Power',
      fin: '2026-11-20',
      diasRestantes: 2,
    });
    expect(a.flexSinClases[0]).toMatchObject({ minimo: 4, usadas: 4 });
    expect(a.cumpleanos).toEqual([
      { id: 'e', nombre: 'Eli', fecha: '1990-11-20', dias: 1 },
    ]);
    expect(alertasDe({})).toEqual(ALERTAS_VACIAS);
    // Valores raros no rompen.
    expect(
      alertasDe({ expiring: [{ daysLeft: 'x', name: 5 }] }).porVencer[0],
    ).toMatchObject({
      nombre: '',
      diasRestantes: 0,
    });
  });
});

describe('adminRepository (API)', () => {
  it('alertas: pide alerts y valida; error y formato inválido', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce(
        respuestaOk({ paymentPending: [{ id: 'b', name: 'B', pkg: 'P' }] }),
      )
      .mockResolvedValueOnce(respuestaOk([1]))
      .mockResolvedValueOnce(respuestaError('No permitido', 403))
      .mockResolvedValueOnce(respuestaError('', 500));
    const repo = crearApiAdminRepository({
      get,
      post: jest.fn(),
    } as unknown as ClienteApi);
    expect((await repo.alertas()).response?.pagosPendientes).toHaveLength(1);
    expect(get).toHaveBeenCalledWith('api.php', { endpoint: 'alerts' });
    expect((await repo.alertas()).msg).toMatch(/formato/);
    expect((await repo.alertas()).msg).toBe('No permitido');
    expect((await repo.alertas()).msg).toMatch(/inesperado/);
  });

  it('asistencias: pide pending_attendance_admin y mapea las filas', async () => {
    const post = jest
      .fn()
      .mockResolvedValueOnce(
        respuestaOk([
          {
            teacher_name: 'Meli',
            total: '25',
            viejas: '22',
            mas_antigua: '2026-08-31',
          },
          7,
        ]),
      )
      .mockResolvedValueOnce(respuestaOk({}))
      .mockResolvedValueOnce(respuestaError('Sin permiso', 403));
    const repo = crearApiAdminRepository({
      get: jest.fn(),
      post,
    } as unknown as ClienteApi);
    expect((await repo.asistenciasPendientes()).response).toEqual([
      { profe: 'Meli', total: 25, viejas: 22, masAntigua: '2026-08-31' },
    ]);
    expect(post).toHaveBeenCalledWith(
      'api.php',
      { action: 'pending_attendance_admin' },
      { endpoint: 'class_sessions' },
    );
    expect((await repo.asistenciasPendientes()).msg).toMatch(/formato/);
    expect((await repo.asistenciasPendientes()).msg).toBe('Sin permiso');
  });
});

describe('obtenerResumenAdminUseCase', () => {
  it('cada sección falla por separado', async () => {
    const repo = crearMemoriaAdminRepository({
      alertas,
      falla: { asistencias: { msg: 'sin red' } },
    });
    const r = await obtenerResumenAdminUseCase(repo);
    expect(r.alertas.tipo).toBe('ok');
    expect(r.asistencias).toEqual({ tipo: 'error', msg: 'sin red' });
    const sinMsg = await obtenerResumenAdminUseCase(
      crearMemoriaAdminRepository({ falla: { alertas: { msg: '' } } }),
    );
    expect(sinMsg.alertas).toEqual({ tipo: 'error', msg: '' });
  });
});

describe('InicioAdminScreen', () => {
  async function montar(repo = crearMemoriaAdminRepository({ alertas })) {
    const dependencias = crearDependenciasDePrueba({ admin: repo });
    const Envoltorio = ({ children }: { children: ReactNode }) => (
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider valor={dependencias}>
            {children}
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>
    );
    const alCerrarSesion = jest.fn().mockResolvedValue(undefined);
    await render(
      <Envoltorio>
        <InicioAdminScreen
          usuario={{ nombre: 'Admin' }}
          alCerrarSesion={alCerrarSesion}
        />
      </Envoltorio>,
    );
    return { repo, alCerrarSesion };
  }

  beforeEach(() => (Toast.show as jest.Mock).mockClear());

  it('muestra las alertas, las asistencias por profe y los cumpleaños', async () => {
    await montar(
      crearMemoriaAdminRepository({
        alertas,
        asistencias: [
          { profe: 'Meli', total: 25, viejas: 22, masAntigua: '2026-08-31' },
          { profe: 'Caro', total: 1, viejas: 1, masAntigua: '2026-09-01' },
        ],
      }),
    );
    expect(await screen.findByText('Hola, Admin')).toBeOnTheScreen();
    expect(await screen.findByText('Pagos pendientes · 1')).toBeOnTheScreen();
    expect(screen.getByText('Sofía Ramírez')).toBeOnTheScreen();
    expect(screen.getByText('Ciclos por vencer · 2')).toBeOnTheScreen();
    expect(screen.getByText(/termina 20 nov · 2 d/)).toBeOnTheScreen();
    expect(screen.getByText(/termina hoy/)).toBeOnTheScreen();
    expect(screen.getByText('Ciclos que empiezan hoy · 1')).toBeOnTheScreen();
    expect(
      screen.getByText('Flex sin clases por agendar · 1'),
    ).toBeOnTheScreen();
    expect(screen.getByText(/4 de 4 clases/)).toBeOnTheScreen();
    expect(screen.getByText('25 sin marcar')).toBeOnTheScreen();
    expect(screen.getByText('1 sin marcar')).toBeOnTheScreen();
    expect(screen.getByText(/22 de hace más de 2 días/)).toBeOnTheScreen();
    expect(screen.getByText('¡Hoy!')).toBeOnTheScreen();
    expect(screen.getByText('Mañana')).toBeOnTheScreen();
    expect(screen.getByText('En 6 días')).toBeOnTheScreen();
  });

  it('sin nada que atender lo dice en cada sección', async () => {
    await montar(crearMemoriaAdminRepository());
    expect(await screen.findByTestId('admin-alertas-vacio')).toBeOnTheScreen();
    expect(screen.getByTestId('admin-asistencias-vacio')).toBeOnTheScreen();
    expect(screen.getByTestId('admin-cumples-vacio')).toBeOnTheScreen();
  });

  it('una sección que falla tiene su error y «Reintentar» recarga', async () => {
    const repo = crearMemoriaAdminRepository({
      alertas,
      falla: { asistencias: { msg: 'sin red' } },
    });
    await montar(repo);
    expect(await screen.findByText('Ciclos por vencer · 2')).toBeOnTheScreen();
    expect(
      screen.getByText('No pudimos cargar esta sección'),
    ).toBeOnTheScreen();
    jest
      .spyOn(repo, 'asistenciasPendientes')
      .mockResolvedValue(respuestaOk([]));
    await fireEvent.press(screen.getByText('Reintentar'));
    expect(
      await screen.findByTestId('admin-asistencias-vacio'),
    ).toBeOnTheScreen();
  });

  it('«Cerrar sesión» llama a la acción', async () => {
    const { alCerrarSesion } = await montar();
    await fireEvent.press(await screen.findByTestId('admin-cerrar-sesion'));
    expect(alCerrarSesion).toHaveBeenCalled();
  });

  it('al refrescar: si responde, actualiza; si todo falla, conserva lo que se ve y avisa', async () => {
    const repo = crearMemoriaAdminRepository({ alertas });
    await montar(repo);
    await screen.findByText('Pagos pendientes · 1');
    const refrescar = () =>
      act(async () => {
        await screen
          .getByTestId('admin-lista')
          .props.refreshControl.props.onRefresh();
      });
    jest.spyOn(repo, 'alertas').mockResolvedValue(respuestaError('x'));
    jest
      .spyOn(repo, 'asistenciasPendientes')
      .mockResolvedValue(respuestaError('y'));
    await refrescar();
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text1: 'No pudimos actualizar el inicio' }),
      ),
    );
    expect(screen.getByText('Pagos pendientes · 1')).toBeOnTheScreen();
    jest
      .spyOn(repo, 'alertas')
      .mockResolvedValue(respuestaOk({ ...ALERTAS_VACIAS }));
    await refrescar();
    expect(await screen.findByTestId('admin-alertas-vacio')).toBeOnTheScreen();
  });
});

describe('useInicioAdminController: salir a medias', () => {
  it('si se desmonta mientras carga o refresca, no actualiza', async () => {
    (Toast.show as jest.Mock).mockClear();
    const repo = crearMemoriaAdminRepository({ alertas });
    const sueltas: ((r: unknown) => void)[] = [];
    jest
      .spyOn(repo, 'alertas')
      .mockImplementation(() => new Promise(r => sueltas.push(r)) as never);
    const dependencias = crearDependenciasDePrueba({ admin: repo });
    let controlador: ReturnType<typeof useInicioAdminController> | null = null;
    function Sonda() {
      controlador = useInicioAdminController();
      return null;
    }
    const vista = await render(
      <DependenciasProvider valor={dependencias}>
        <Sonda />
      </DependenciasProvider>,
    );
    await act(async () => {
      controlador?._refrescar();
    });
    await vista.unmount();
    await act(async () => sueltas.forEach(f => f(respuestaOk(alertas))));
    expect(Toast.show).not.toHaveBeenCalled();
  });
});
