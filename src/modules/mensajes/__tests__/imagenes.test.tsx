// F3-01 (3.3): fotos en el chat: elegir y enviar, ver la recibida y abrirla a pantalla completa.
import {
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
import { obtenerMediaUseCase } from '@/modules/mensajes/aplications/hilo/hilo';
import type { IResponseMensaje } from '@/modules/mensajes/domain/entities/Mensajes.entities';
import { crearMemoriaMensajesRepository } from '@/modules/mensajes/infrastructure/memoriaMensajesRepository';
import { crearApiMensajesRepository } from '@/modules/mensajes/infrastructure/apiMensajesRepository';
import { MensajesScreen } from '@/modules/mensajes/presentation/screens/MensajesScreen';
import type {
  ResultadoImagen,
  SelectorImagenPort,
} from '@/native/ports/SelectorImagenPort';
import type { ClienteApi } from '@/shared/lib/api';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

const AHORA = Date.UTC(2026, 10, 17, 15, 0);
const FOTO = 'data:image/jpeg;base64,QUJD';

const msg = (m: Partial<IResponseMensaje>): IResponseMensaje => ({
  id: 1,
  idEstudiante: 'memoria',
  remitente: 'teacher',
  nombre: 'Meli',
  texto: '',
  tieneImagen: false,
  tieneVoz: false,
  leido: true,
  editado: false,
  reacciones: {},
  creado: '2026-11-17 09:30:00',
  mio: false,
  ...m,
});

function selector(...resultados: ResultadoImagen[]) {
  const elegir = jest.fn();
  resultados.forEach(r => elegir.mockResolvedValueOnce(r));
  return { elegir } as SelectorImagenPort & { elegir: jest.Mock };
}

async function montar(
  repo: ReturnType<typeof crearMemoriaMensajesRepository>,
  imagenes: SelectorImagenPort,
) {
  jest.spyOn(Date, 'now').mockReturnValue(AHORA);
  const dependencias = crearDependenciasDePrueba({
    mensajes: repo,
    imagenes,
  });
  const Envoltorio = ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial="oscuro">
        <DependenciasProvider valor={dependencias}>
          {children}
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>
  );
  await render(
    <Envoltorio>
      <MensajesScreen
        usuario={{ id: 'memoria', nombre: 'Ana Torres' }}
        rol="estudiante"
      />
    </Envoltorio>,
  );
  await screen.findByTestId('chat-lista').catch(() => undefined);
}

beforeEach(() => (Toast.show as jest.Mock).mockClear());
afterEach(() => jest.restoreAllMocks());

describe('enviar una foto', () => {
  it('elige de la galería y la envía con el texto escrito como pie', async () => {
    const repo = crearMemoriaMensajesRepository([
      msg({ id: 1, texto: 'Hola' }),
    ]);
    const enviar = jest.spyOn(repo, 'enviar');
    const imagenes = selector({ tipo: 'ok', dataUrl: FOTO });
    await montar(repo, imagenes);
    await screen.findByTestId('chat-lista');
    await fireEvent.changeText(screen.getByTestId('chat-entrada'), ' Mira ');
    await fireEvent.press(screen.getByTestId('chat-adjuntar'));
    await fireEvent.press(screen.getByTestId('adjuntar-galeria'));
    await waitFor(() => expect(enviar).toHaveBeenCalledTimes(1));
    expect(imagenes.elegir).toHaveBeenCalledWith('galeria');
    expect(enviar.mock.calls[0][0]).toMatchObject({
      texto: 'Mira',
      imagen: FOTO,
    });
    expect(screen.getByTestId('chat-entrada').props.value).toBe('');
    // La foto propia sale del teléfono, sin pedirla otra vez.
    expect(await screen.findByTestId('imagen-2')).toBeOnTheScreen();
    expect(repo.mensajes[1].tieneImagen).toBe(true);
  });

  it('con la cámara y sin texto envía solo la foto', async () => {
    const repo = crearMemoriaMensajesRepository([
      msg({ id: 1, texto: 'Hola' }),
    ]);
    const enviar = jest.spyOn(repo, 'enviar');
    const imagenes = selector({ tipo: 'ok', dataUrl: FOTO });
    await montar(repo, imagenes);
    await screen.findByTestId('chat-lista');
    await fireEvent.press(screen.getByTestId('chat-adjuntar'));
    await fireEvent.press(screen.getByTestId('adjuntar-camara'));
    await waitFor(() => expect(enviar).toHaveBeenCalledTimes(1));
    expect(imagenes.elegir).toHaveBeenCalledWith('camara');
    expect(enviar.mock.calls[0][0]).toMatchObject({ texto: '', imagen: FOTO });
  });

  it('si no se envía, la foto queda como fallida y se reintenta con la misma foto', async () => {
    const repo = crearMemoriaMensajesRepository([
      msg({ id: 1, texto: 'Hola' }),
    ]);
    const enviar = jest
      .spyOn(repo, 'enviar')
      .mockResolvedValueOnce(respuestaError('Sin conexión', 0));
    await montar(repo, selector({ tipo: 'ok', dataUrl: FOTO }));
    await screen.findByTestId('chat-lista');
    await fireEvent.press(screen.getByTestId('chat-adjuntar'));
    await fireEvent.press(screen.getByTestId('adjuntar-galeria'));
    await screen.findByText('No se envió');
    enviar.mockRestore();
    const reenviar = jest.spyOn(repo, 'enviar');
    await fireEvent.press(await screen.findByTestId('mensaje-reintentar-1'));
    await waitFor(() => expect(reenviar).toHaveBeenCalledTimes(1));
    expect(reenviar.mock.calls[0][0]).toMatchObject({ imagen: FOTO });
  });

  it('cancelar no envía nada; un error del selector avisa', async () => {
    const repo = crearMemoriaMensajesRepository([
      msg({ id: 1, texto: 'Hola' }),
    ]);
    const enviar = jest.spyOn(repo, 'enviar');
    await montar(
      repo,
      selector(
        { tipo: 'cancelado' },
        { tipo: 'error', msg: 'Falta el permiso' },
      ),
    );
    await screen.findByTestId('chat-lista');
    await fireEvent.press(screen.getByTestId('chat-adjuntar'));
    await fireEvent.press(screen.getByTestId('adjuntar-galeria'));
    expect(Toast.show).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('chat-adjuntar'));
    await fireEvent.press(screen.getByTestId('adjuntar-camara'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledTimes(1));
    expect(enviar).not.toHaveBeenCalled();
  });

  it('una foto demasiado grande no se envía', async () => {
    const repo = crearMemoriaMensajesRepository([
      msg({ id: 1, texto: 'Hola' }),
    ]);
    const enviar = jest.spyOn(repo, 'enviar');
    await montar(
      repo,
      selector({
        tipo: 'ok',
        dataUrl: `data:image/jpeg;base64,${'A'.repeat(2000001)}`,
      }),
    );
    await screen.findByTestId('chat-lista');
    await fireEvent.press(screen.getByTestId('chat-adjuntar'));
    await fireEvent.press(screen.getByTestId('adjuntar-galeria'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledTimes(1));
    expect(enviar).not.toHaveBeenCalled();
  });

  it('cerrar la hoja sin elegir no abre el selector', async () => {
    const repo = crearMemoriaMensajesRepository([
      msg({ id: 1, texto: 'Hola' }),
    ]);
    const imagenes = selector();
    await montar(repo, imagenes);
    await screen.findByTestId('chat-lista');
    await fireEvent.press(screen.getByTestId('chat-adjuntar'));
    expect(screen.getByTestId('hoja-adjuntar')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Cerrar'));
    expect(imagenes.elegir).not.toHaveBeenCalled();
  });
});

describe('ver una foto recibida', () => {
  const conFoto = () =>
    crearMemoriaMensajesRepository(
      [msg({ id: 5, tieneImagen: true, texto: 'Tarea' })],
      { media: { 5: { imagen: FOTO, voz: null } } },
    );

  it('la pide al servidor al mostrarse y se abre a pantalla completa', async () => {
    const repo = conFoto();
    const media = jest.spyOn(repo, 'media');
    await montar(repo, selector());
    expect(await screen.findByTestId('imagen-5')).toBeOnTheScreen();
    expect(media).toHaveBeenCalledWith(5);
    await fireEvent.press(screen.getByTestId('imagen-5'));
    expect(screen.getByTestId('visor-imagen')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('visor-cerrar'));
    await waitFor(() =>
      expect(screen.queryByTestId('visor-imagen')).toBeNull(),
    );
  });

  it('si no carga muestra el reintento y vuelve a pedirla', async () => {
    const repo = conFoto();
    jest
      .spyOn(repo, 'media')
      .mockResolvedValueOnce(respuestaError('Sin conexión', 0));
    await montar(repo, selector());
    await fireEvent.press(await screen.findByTestId('imagen-reintentar-5'));
    expect(await screen.findByTestId('imagen-5')).toBeOnTheScreen();
  });

  it('mantener pulsada la foto abre las reacciones', async () => {
    await montar(conFoto(), selector());
    await fireEvent(await screen.findByTestId('imagen-5'), 'longPress');
    expect(await screen.findByTestId('hoja-reacciones')).toBeOnTheScreen();
  });
});

describe('media en la capa de datos', () => {
  it('el caso de uso rechaza un id inválido y llama al repositorio con uno válido', async () => {
    const repo = crearMemoriaMensajesRepository([], {
      media: { 3: { imagen: FOTO, voz: null } },
    });
    expect((await obtenerMediaUseCase(repo, 0)).error).toBe(true);
    expect((await obtenerMediaUseCase(repo, 3)).response?.imagen).toBe(FOTO);
    expect((await obtenerMediaUseCase(repo, 9)).error).toBe(true);
  });

  it('la memoria falla a pedido', async () => {
    const repo = crearMemoriaMensajesRepository([], {
      falla: { media: { msg: 'No', code: 500 } },
    });
    expect((await repo.media(1)).error).toBe(true);
  });

  it('el adaptador pide view=media con el id y lee imagen y voz', async () => {
    const get = jest
      .fn()
      .mockResolvedValue(respuestaOk({ imagen: FOTO, voz: null }, 200));
    const api = { get, post: jest.fn() } as unknown as ClienteApi;
    const r = await crearApiMensajesRepository(api).media(7);
    expect(get).toHaveBeenCalledWith('api.php', {
      endpoint: 'chat',
      view: 'media',
      id: '7',
    });
    expect(r.response).toEqual({ imagen: FOTO, voz: null });
  });

  it('el adaptador responde error con formato inválido o fallo del servidor', async () => {
    const con = (r: unknown) =>
      crearApiMensajesRepository({
        get: jest.fn().mockResolvedValue(r),
        post: jest.fn(),
      } as unknown as ClienteApi);
    expect((await con(respuestaOk('x', 200)).media(1)).error).toBe(true);
    expect((await con(respuestaError('Caído', 500)).media(1)).error).toBe(true);
  });
});
