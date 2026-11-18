// F3-01: pantallas del chat (hilo y bandeja) y sus controllers, con el repositorio en memoria.
// Hoy es mar 17 nov 2026, 10:00 en Bogotá.
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { INTERVALO_BANDEJA_MS } from '@/modules/mensajes/aplications/controllers/Bandeja.controller';
import { INTERVALO_SONDEO_HILO_MS } from '@/modules/mensajes/aplications/controllers/Hilo.controller';
import type {
  IResponseConversacion,
  IResponseMensaje,
} from '@/modules/mensajes/domain/entities/Mensajes.entities';
import type { MensajesRepository } from '@/modules/mensajes/domain/models/MensajesRepository';
import { crearMemoriaMensajesRepository } from '@/modules/mensajes/infrastructure/memoriaMensajesRepository';
import { MensajesScreen } from '@/modules/mensajes/presentation/screens/MensajesScreen';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

const AHORA = Date.UTC(2026, 10, 17, 15, 0);

const msg = (m: Partial<IResponseMensaje>): IResponseMensaje => ({
  id: 1,
  idEstudiante: 'memoria',
  remitente: 'student',
  nombre: 'Ana',
  texto: 'Hola',
  tieneImagen: false,
  tieneVoz: false,
  leido: false,
  editado: false,
  reacciones: {},
  creado: '2026-11-17 09:30:00',
  mio: true,
  ...m,
});

const HILO: IResponseMensaje[] = [
  msg({
    id: 1,
    remitente: 'teacher',
    nombre: 'Meli',
    texto: 'Hola Ana',
    mio: false,
    leido: true,
    creado: '2026-11-16 20:00:00',
  }),
  msg({
    id: 2,
    texto: 'Listo profe',
    leido: true,
    creado: '2026-11-17 08:00:00',
  }),
  msg({ id: 3, texto: 'Gracias', leido: false, creado: '2026-11-17 08:05:00' }),
];

const conversacion = (
  c: Partial<IResponseConversacion>,
): IResponseConversacion => ({
  idEstudiante: 'e1',
  nombre: 'Ana Torres',
  noLeidos: 0,
  ultimo: null,
  ...c,
});

const envoltorio = (repo: MensajesRepository) => {
  const dependencias = crearDependenciasDePrueba({ mensajes: repo });
  return ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial="oscuro">
        <DependenciasProvider valor={dependencias}>
          {children}
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>
  );
};

const estudiante = { id: 'memoria', nombre: 'Ana Torres' };
const profe = { id: 'p1', nombre: 'Meli' };

async function montar(
  repo: MensajesRepository,
  props: Partial<React.ComponentProps<typeof MensajesScreen>> = {},
) {
  jest.spyOn(Date, 'now').mockReturnValue(AHORA);
  const Envoltorio = envoltorio(repo);
  return render(
    <Envoltorio>
      <MensajesScreen usuario={estudiante} rol="estudiante" {...props} />
    </Envoltorio>,
  );
}

const hilo = (
  extra: Partial<Parameters<typeof crearMemoriaMensajesRepository>[1]> = {},
) => crearMemoriaMensajesRepository(HILO, { nombre: 'Ana Torres', ...extra });

beforeEach(() => (Toast.show as jest.Mock).mockClear());
afterEach(() => jest.restoreAllMocks());

/** La función que el controller pasó a `setInterval` con ese intervalo. */
function tic(espia: jest.SpyInstance, ms: number): () => void {
  const llamada = espia.mock.calls.find(([, t]) => t === ms);
  expect(llamada).toBeDefined();
  return llamada?.[0] as () => void;
}

describe('hilo del estudiante', () => {
  it('muestra los mensajes por día, el autor ajeno y el estado de los propios', async () => {
    await montar(hilo());
    expect(await screen.findByTestId('chat-lista')).toBeOnTheScreen();
    expect(screen.getByText('Ayer')).toBeOnTheScreen();
    expect(screen.getByText('Hoy')).toBeOnTheScreen();
    expect(screen.getByText('Meli')).toBeOnTheScreen();
    expect(screen.getByText('Hola Ana')).toBeOnTheScreen();
    expect(screen.getByText('Visto')).toBeOnTheScreen();
    expect(screen.getByText('Enviado')).toBeOnTheScreen();
  });

  it('sin mensajes muestra la invitación a escribir', async () => {
    await montar(crearMemoriaMensajesRepository());
    expect(await screen.findByTestId('chat-vacio')).toBeOnTheScreen();
    expect(screen.queryByTestId('chat-lista')).toBeNull();
  });

  it('si no carga muestra el error y reintenta', async () => {
    const repo = hilo();
    jest
      .spyOn(repo, 'hilo')
      .mockResolvedValueOnce(respuestaError('Sin conexión', 0));
    await montar(repo);
    expect(await screen.findByTestId('chat-error')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Reintentar'));
    expect(await screen.findByTestId('chat-lista')).toBeOnTheScreen();
  });

  it('envía: limpia la caja y deja el mensaje en el hilo', async () => {
    const repo = hilo();
    await montar(repo);
    await screen.findByTestId('chat-lista');
    await fireEvent.changeText(
      screen.getByTestId('chat-entrada'),
      '  Nuevo mensaje ',
    );
    await fireEvent.press(screen.getByTestId('chat-enviar'));
    expect(await screen.findByText('Nuevo mensaje')).toBeOnTheScreen();
    expect(screen.getByTestId('chat-entrada').props.value).toBe('');
    expect(repo.mensajes).toHaveLength(4);
    expect(repo.mensajes[3].texto).toBe('Nuevo mensaje');
  });

  it('sin texto aparece el micrófono y no el de enviar; con demasiado texto avisa', async () => {
    const repo = hilo();
    const enviar = jest.spyOn(repo, 'enviar');
    await montar(repo);
    await screen.findByTestId('chat-lista');
    expect(screen.queryByTestId('chat-enviar')).toBeNull();
    expect(screen.getByTestId('chat-grabar')).toBeOnTheScreen();
    expect(enviar).not.toHaveBeenCalled();
    // `maxLength` impide escribirlo a mano; el controller igual lo valida.
    await fireEvent.changeText(
      screen.getByTestId('chat-entrada'),
      'a'.repeat(2001),
    );
    await fireEvent.press(screen.getByTestId('chat-enviar'));
    expect(enviar).not.toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalled();
  });

  it('un envío fallido se marca, avisa y se puede reintentar o descartar', async () => {
    const repo = hilo();
    jest
      .spyOn(repo, 'enviar')
      .mockResolvedValueOnce(respuestaError('Sin conexión', 0));
    await montar(repo);
    await screen.findByTestId('chat-lista');
    await fireEvent.changeText(screen.getByTestId('chat-entrada'), 'Se perdió');
    await fireEvent.press(screen.getByTestId('chat-enviar'));
    expect(await screen.findByText('No se envió')).toBeOnTheScreen();
    expect(Toast.show).toHaveBeenCalled();
    // Un mensaje que no llegó no admite reacción.
    await fireEvent(screen.getByLabelText(/Se perdió/), 'longPress');
    expect(screen.queryByTestId('hoja-reacciones')).toBeNull();

    await fireEvent.press(screen.getByTestId('mensaje-reintentar-1'));
    await waitFor(() => expect(screen.queryByText('No se envió')).toBeNull());
    expect(repo.mensajes.some(m => m.texto === 'Se perdió')).toBe(true);

    jest
      .spyOn(repo, 'enviar')
      .mockResolvedValueOnce(respuestaError('Sin conexión', 0));
    await fireEvent.changeText(screen.getByTestId('chat-entrada'), 'Otro');
    await fireEvent.press(screen.getByTestId('chat-enviar'));
    await fireEvent.press(await screen.findByTestId('mensaje-descartar-2'));
    expect(screen.queryByText('Otro')).toBeNull();
  });

  it('reaccionar: pulsación larga, elegir, ver el chip y quitarla', async () => {
    const repo = hilo();
    await montar(repo);
    await screen.findByTestId('chat-lista');
    await fireEvent(screen.getByLabelText(/Hola Ana/), 'longPress');
    expect(await screen.findByTestId('hoja-reacciones')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('reaccion-👍'));
    expect(await screen.findByLabelText('👍 1, tu reacción')).toBeOnTheScreen();
    expect(screen.queryByTestId('hoja-reacciones')).toBeNull();
    // Tocar la misma la quita.
    await fireEvent(screen.getByLabelText(/Hola Ana/), 'longPress');
    await fireEvent.press(screen.getByTestId('reaccion-👍'));
    await waitFor(() =>
      expect(screen.queryByLabelText('👍 1, tu reacción')).toBeNull(),
    );
  });

  it('cerrar la hoja de reacciones no reacciona; un error de reacción avisa', async () => {
    const repo = hilo();
    const reaccionar = jest.spyOn(repo, 'reaccionar');
    await montar(repo);
    await screen.findByTestId('chat-lista');
    await fireEvent(screen.getByLabelText(/Hola Ana/), 'longPress');
    await fireEvent.press(screen.getByLabelText('Cerrar'));
    expect(reaccionar).not.toHaveBeenCalled();
    reaccionar.mockResolvedValueOnce(respuestaError('No', 500));
    await fireEvent(screen.getByLabelText(/Hola Ana/), 'longPress');
    await fireEvent.press(screen.getByTestId('reaccion-😂'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalled());
  });

  it('sondea solo lo nuevo y muestra el mensaje que llega', async () => {
    const intervalo = jest.spyOn(global, 'setInterval');
    const repo = hilo();
    const hiloSpy = jest.spyOn(repo, 'hilo');
    await montar(repo);
    await screen.findByTestId('chat-lista');
    repo.mensajes.push(
      msg({
        id: 4,
        remitente: 'teacher',
        nombre: 'Meli',
        texto: 'Llegó nuevo',
        mio: false,
        leido: true,
      }),
    );
    await act(async () => tic(intervalo, INTERVALO_SONDEO_HILO_MS)());
    expect(await screen.findByText('Llegó nuevo')).toBeOnTheScreen();
    expect(hiloSpy).toHaveBeenLastCalledWith({
      idEstudiante: 'memoria',
      despuesDe: 3,
    });
  });

  it('un sondeo que falla se calla y no se solapa con otro en curso', async () => {
    const intervalo = jest.spyOn(global, 'setInterval');
    const repo = hilo();
    await montar(repo);
    await screen.findByTestId('chat-lista');
    let soltar: () => void = () => undefined;
    const lento = jest.spyOn(repo, 'hilo').mockImplementation(
      () =>
        new Promise(resolver => {
          soltar = () => resolver(respuestaError('Sin conexión', 0));
        }),
    );
    const sondear = tic(intervalo, INTERVALO_SONDEO_HILO_MS);
    await act(async () => {
      sondear();
      sondear();
    });
    expect(lento).toHaveBeenCalledTimes(1);
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
    expect(screen.getByTestId('chat-lista')).toBeOnTheScreen();
  });

  it('marca como leído lo del otro lado y avisa para bajar la insignia', async () => {
    const repo = crearMemoriaMensajesRepository([
      msg({
        id: 1,
        remitente: 'teacher',
        nombre: 'Meli',
        mio: false,
        leido: false,
        texto: 'Sin leer',
      }),
    ]);
    const marcar = jest.spyOn(repo, 'marcarLeido');
    const alCambiarNoLeidos = jest.fn();
    await montar(repo, { alCambiarNoLeidos });
    await waitFor(() => expect(alCambiarNoLeidos).toHaveBeenCalledWith(0));
    expect(marcar).toHaveBeenCalledWith('memoria');
  });

  it('si marcar como leído falla no avisa', async () => {
    const repo = crearMemoriaMensajesRepository(
      [msg({ id: 1, mio: false, leido: false, texto: 'Sin leer' })],
      { falla: { marcarLeido: { msg: 'x', code: 500 } } },
    );
    const alCambiarNoLeidos = jest.fn();
    await montar(repo, { alCambiarNoLeidos });
    await screen.findByText('Sin leer');
    await act(async () => undefined);
    expect(alCambiarNoLeidos).not.toHaveBeenCalled();
  });

  it('al desmontar con un envío a mitad no se actualiza nada', async () => {
    let soltar: () => void = () => undefined;
    const repo = hilo();
    jest.spyOn(repo, 'enviar').mockImplementation(
      () =>
        new Promise(resolver => {
          soltar = () => resolver(respuestaOk(msg({ id: 9, texto: 'tarde' })));
        }),
    );
    const { unmount } = await montar(repo);
    await screen.findByTestId('chat-lista');
    await fireEvent.changeText(screen.getByTestId('chat-entrada'), 'tarde');
    await fireEvent.press(screen.getByTestId('chat-enviar'));
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('al desmontar durante la carga, la respuesta tardía se ignora', async () => {
    let soltar: () => void = () => undefined;
    const repo = hilo();
    jest.spyOn(repo, 'hilo').mockImplementation(
      () =>
        new Promise(resolver => {
          soltar = () => resolver(respuestaOk({ mensajes: [], estados: [] }));
        }),
    );
    const { unmount } = await montar(repo);
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });
});

describe('bandeja del profe', () => {
  const CONVERSACIONES = [
    conversacion({
      idEstudiante: 'e1',
      nombre: 'Ana Torres',
      noLeidos: 2,
      ultimo: msg({
        id: 5,
        idEstudiante: 'e1',
        texto: 'Profe, una duda',
        mio: false,
      }),
    }),
    conversacion({
      idEstudiante: 'e2',
      nombre: 'Luis Pérez',
      ultimo: msg({ id: 4, idEstudiante: 'e2', texto: 'Ok', mio: true }),
    }),
    conversacion({
      idEstudiante: 'e3',
      nombre: 'Sofía',
      ultimo: msg({
        id: 3,
        idEstudiante: 'e3',
        texto: '',
        tieneVoz: true,
        mio: false,
      }),
    }),
    conversacion({
      idEstudiante: 'e4',
      nombre: 'Carlos',
      ultimo: msg({
        id: 2,
        idEstudiante: 'e4',
        texto: '',
        tieneImagen: true,
        mio: false,
      }),
    }),
    conversacion({ idEstudiante: 'e5', nombre: '' }),
  ];
  const bandeja = () =>
    crearMemoriaMensajesRepository([], {
      rol: 'teacher',
      conversaciones: CONVERSACIONES,
    });

  async function montarProfe(
    repo: MensajesRepository,
    alCambiarNoLeidos = jest.fn(),
  ) {
    await montar(repo, { usuario: profe, rol: 'profe', alCambiarNoLeidos });
    await screen.findByTestId('bandeja-lista');
    return alCambiarNoLeidos;
  }

  it('lista sus estudiantes con vista previa y no leídos, y avisa el total', async () => {
    const alCambiarNoLeidos = await montarProfe(bandeja());
    expect(screen.getByText('Ana Torres')).toBeOnTheScreen();
    expect(screen.getByText('Profe, una duda')).toBeOnTheScreen();
    expect(screen.getByText('Tú: Ok')).toBeOnTheScreen();
    expect(screen.getByText('Nota de voz')).toBeOnTheScreen();
    expect(screen.getByText('Foto')).toBeOnTheScreen();
    expect(screen.getByText('Sin mensajes todavía')).toBeOnTheScreen();
    expect(screen.getByText('?')).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        /Abrir el chat con Ana Torres.*2 mensajes sin leer/,
      ),
    ).toBeOnTheScreen();
    expect(alCambiarNoLeidos).toHaveBeenCalledWith(2);
  });

  it('sin estudiantes muestra el vacío', async () => {
    await montarProfe(crearMemoriaMensajesRepository([], { rol: 'teacher' }));
    expect(screen.getByTestId('bandeja-vacia')).toBeOnTheScreen();
  });

  it('abre el hilo de un estudiante y vuelve con la flecha o con atrás de Android', async () => {
    let atras = (() => false) as () => boolean | null | undefined;
    const quitar = jest.fn();
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_, cb) => {
      atras = cb as never;
      return { remove: quitar };
    });
    await montarProfe(bandeja());
    await fireEvent.press(screen.getByTestId('conversacion-e2'));
    expect(await screen.findByTestId('chat-hilo')).toBeOnTheScreen();
    expect(screen.getAllByText('Luis Pérez').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByTestId('chat-volver'));
    expect(await screen.findByTestId('bandeja-lista')).toBeOnTheScreen();
    expect(quitar).toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('conversacion-e1'));
    await screen.findByTestId('chat-hilo');
    await act(async () => {
      expect(atras()).toBe(true);
    });
    expect(await screen.findByTestId('bandeja-lista')).toBeOnTheScreen();
  });

  it('el profe envía desde el hilo con su propio rol', async () => {
    const repo = crearMemoriaMensajesRepository([], {
      rol: 'teacher',
      conversaciones: CONVERSACIONES,
    });
    await montarProfe(repo);
    await fireEvent.press(screen.getByTestId('conversacion-e1'));
    await screen.findByTestId('chat-vacio');
    await fireEvent.changeText(screen.getByTestId('chat-entrada'), 'Hola Ana');
    await fireEvent.press(screen.getByTestId('chat-enviar'));
    expect(await screen.findByText('Hola Ana')).toBeOnTheScreen();
    expect(repo.mensajes[0]).toMatchObject({
      remitente: 'teacher',
      idEstudiante: 'e1',
    });
  });

  it('un error de carga se reintenta; un refresco que falla avisa y conserva la lista', async () => {
    const repo = bandeja();
    jest
      .spyOn(repo, 'bandeja')
      .mockResolvedValueOnce(respuestaError('Sin conexión', 0));
    await montar(repo, { usuario: profe, rol: 'profe' });
    expect(await screen.findByTestId('bandeja-error')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Reintentar'));
    expect(await screen.findByTestId('bandeja-lista')).toBeOnTheScreen();
    jest
      .spyOn(repo, 'bandeja')
      .mockResolvedValue(respuestaError('Sin conexión', 0));
    const lista = screen.getByTestId('bandeja-lista');
    await act(async () => {
      await lista.props.refreshControl.props.onRefresh();
    });
    expect(Toast.show).toHaveBeenCalled();
    expect(screen.getByTestId('bandeja-lista')).toBeOnTheScreen();
  });

  it('se refresca cada 10 s sin avisar si falla, y no se solapa', async () => {
    const intervalo = jest.spyOn(global, 'setInterval');
    const repo = bandeja();
    await montarProfe(repo);
    let soltar: () => void = () => undefined;
    const lento = jest.spyOn(repo, 'bandeja').mockImplementation(
      () =>
        new Promise(resolver => {
          soltar = () => resolver(respuestaError('Sin conexión', 0));
        }),
    );
    const sondear = tic(intervalo, INTERVALO_BANDEJA_MS);
    await act(async () => {
      sondear();
      sondear();
    });
    expect(lento).toHaveBeenCalledTimes(1);
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
    expect(screen.getByTestId('bandeja-lista')).toBeOnTheScreen();
  });

  it('al desmontar con la carga a mitad se ignora la respuesta', async () => {
    let soltar: () => void = () => undefined;
    const repo = bandeja();
    jest.spyOn(repo, 'bandeja').mockImplementation(
      () =>
        new Promise(resolver => {
          soltar = () =>
            resolver(respuestaOk({ conversaciones: [], noLeidos: 0 }));
        }),
    );
    const { unmount } = await montar(repo, { usuario: profe, rol: 'profe' });
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });
});
