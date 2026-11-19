// F3-01 (3.2): notas de voz: grabar y enviar, y reproducir las recibidas.
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
import type { IResponseMensaje } from '@/modules/mensajes/domain/entities/Mensajes.entities';
import {
  duracionDeVoz,
  MAX_VOZ,
} from '@/modules/mensajes/domain/validations/mensajes.validations';
import { crearMemoriaMensajesRepository } from '@/modules/mensajes/infrastructure/memoriaMensajesRepository';
import { MensajesScreen } from '@/modules/mensajes/presentation/screens/MensajesScreen';
import type { AudioPort } from '@/native/ports/AudioPort';
import { respuestaError } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

const AHORA = Date.UTC(2026, 10, 17, 15, 0);
const VOZ = 'data:audio/mp4;base64,QUJD';

const msg = (m: Partial<IResponseMensaje>): IResponseMensaje => ({
  id: 1,
  idEstudiante: 'memoria',
  remitente: 'teacher',
  nombre: 'Meli',
  texto: 'Hola',
  tieneImagen: false,
  tieneVoz: false,
  leido: true,
  editado: false,
  reacciones: {},
  creado: '2026-11-17 09:30:00',
  mio: false,
  ...m,
});

type AudioFalso = {
  [K in keyof AudioPort]: jest.Mock;
};

function audioFalso(): AudioFalso {
  return {
    empezarGrabacion: jest.fn().mockResolvedValue({ tipo: 'ok' }),
    terminarGrabacion: jest
      .fn()
      .mockResolvedValue({ tipo: 'ok', dataUrl: VOZ, duracionMs: 5000 }),
    cancelarGrabacion: jest.fn().mockResolvedValue(undefined),
    reproducir: jest.fn().mockResolvedValue({ tipo: 'ok' }),
    detener: jest.fn().mockResolvedValue(undefined),
  };
}

async function montar(
  repo: ReturnType<typeof crearMemoriaMensajesRepository>,
  audio: AudioFalso,
) {
  jest.spyOn(Date, 'now').mockReturnValue(AHORA);
  const dependencias = crearDependenciasDePrueba({
    mensajes: repo,
    audio: audio as unknown as AudioPort,
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
  const vista = await render(
    <Envoltorio>
      <MensajesScreen
        usuario={{ id: 'memoria', nombre: 'Ana Torres' }}
        rol="estudiante"
      />
    </Envoltorio>,
  );
  await screen.findByTestId('chat-lista');
  return vista;
}

const hilo = () => crearMemoriaMensajesRepository([msg({ id: 1 })]);

/** El callback de progreso que el controller pasó a `empezarGrabacion`. */
const progresoDeGrabacion = (audio: AudioFalso) =>
  audio.empezarGrabacion.mock.calls[0][0] as (ms: number) => void;

beforeEach(() => (Toast.show as jest.Mock).mockClear());
afterEach(() => jest.restoreAllMocks());

describe('duracionDeVoz', () => {
  it('da minutos y segundos con cero a la izquierda', () => {
    expect(duracionDeVoz(0)).toBe('0:00');
    expect(duracionDeVoz(7400)).toBe('0:07');
    expect(duracionDeVoz(65000)).toBe('1:05');
    expect(duracionDeVoz(-5)).toBe('0:00');
  });
});

describe('grabar y enviar una nota de voz', () => {
  it('graba, muestra el tiempo y al enviar queda en el hilo con su duración', async () => {
    const repo = hilo();
    const enviar = jest.spyOn(repo, 'enviar');
    const audio = audioFalso();
    await montar(repo, audio);
    await fireEvent.press(screen.getByTestId('chat-grabar'));
    expect(await screen.findByTestId('chat-grabando')).toBeOnTheScreen();
    progresoDeGrabacion(audio)(7400);
    expect(await screen.findByText('Grabando 0:07')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('chat-grabar-enviar'));
    await waitFor(() => expect(enviar).toHaveBeenCalledTimes(1));
    expect(enviar.mock.calls[0][0]).toMatchObject({ texto: '', voz: VOZ });
    expect(screen.queryByTestId('chat-grabando')).toBeNull();
    // Dura lo grabado: no hace falta descargarla para saberlo.
    expect(await screen.findByTestId('voz-2')).toBeOnTheScreen();
    expect(screen.getByText('0:05')).toBeOnTheScreen();
    expect(repo.mensajes[1].tieneVoz).toBe(true);
  });

  it('cancelar descarta la grabación y vuelve a la barra normal', async () => {
    const audio = audioFalso();
    const repo = hilo();
    const enviar = jest.spyOn(repo, 'enviar');
    await montar(repo, audio);
    await fireEvent.press(screen.getByTestId('chat-grabar'));
    await fireEvent.press(await screen.findByTestId('chat-grabar-cancelar'));
    expect(audio.cancelarGrabacion).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('chat-entrada')).toBeOnTheScreen();
    expect(enviar).not.toHaveBeenCalled();
  });

  it('sin permiso de micrófono avisa y no graba', async () => {
    const audio = audioFalso();
    audio.empezarGrabacion.mockResolvedValue({ tipo: 'denegado' });
    await montar(hilo(), audio);
    await fireEvent.press(screen.getByTestId('chat-grabar'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('chat-grabando')).toBeNull();
  });

  it('si no puede empezar avisa con el mensaje del sistema', async () => {
    const audio = audioFalso();
    audio.empezarGrabacion.mockResolvedValue({
      tipo: 'error',
      msg: 'Micrófono ocupado',
    });
    await montar(hilo(), audio);
    await fireEvent.press(screen.getByTestId('chat-grabar'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledTimes(1));
    expect(JSON.stringify((Toast.show as jest.Mock).mock.calls[0])).toContain(
      'Micrófono ocupado',
    );
  });

  it('empieza a grabar una sola vez por toque', async () => {
    const audio = audioFalso();
    await montar(hilo(), audio);
    await fireEvent.press(screen.getByTestId('chat-grabar'));
    expect(audio.empezarGrabacion).toHaveBeenCalledTimes(1);
  });

  it('una grabación de menos de un segundo no se envía', async () => {
    const audio = audioFalso();
    audio.terminarGrabacion.mockResolvedValue({
      tipo: 'ok',
      dataUrl: VOZ,
      duracionMs: 300,
    });
    const repo = hilo();
    const enviar = jest.spyOn(repo, 'enviar');
    await montar(repo, audio);
    await fireEvent.press(screen.getByTestId('chat-grabar'));
    await fireEvent.press(await screen.findByTestId('chat-grabar-enviar'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledTimes(1));
    expect(enviar).not.toHaveBeenCalled();
  });

  it('una nota demasiado grande no se envía', async () => {
    const audio = audioFalso();
    audio.terminarGrabacion.mockResolvedValue({
      tipo: 'ok',
      dataUrl: `data:audio/mp4;base64,${'A'.repeat(MAX_VOZ)}`,
      duracionMs: 5000,
    });
    const repo = hilo();
    const enviar = jest.spyOn(repo, 'enviar');
    await montar(repo, audio);
    await fireEvent.press(screen.getByTestId('chat-grabar'));
    await fireEvent.press(await screen.findByTestId('chat-grabar-enviar'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledTimes(1));
    expect(enviar).not.toHaveBeenCalled();
  });

  it('si no se puede guardar la grabación avisa', async () => {
    const audio = audioFalso();
    audio.terminarGrabacion.mockResolvedValue({
      tipo: 'error',
      msg: 'Sin archivo',
    });
    await montar(hilo(), audio);
    await fireEvent.press(screen.getByTestId('chat-grabar'));
    await fireEvent.press(await screen.findByTestId('chat-grabar-enviar'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledTimes(1));
  });

  it('a los 2 minutos la nota se corta y se envía sola', async () => {
    const audio = audioFalso();
    const repo = hilo();
    const enviar = jest.spyOn(repo, 'enviar');
    await montar(repo, audio);
    await fireEvent.press(screen.getByTestId('chat-grabar'));
    await screen.findByTestId('chat-grabando');
    progresoDeGrabacion(audio)(120000);
    await waitFor(() => expect(enviar).toHaveBeenCalledTimes(1));
    expect(audio.terminarGrabacion).toHaveBeenCalledTimes(1);
  });

  it('si el envío falla, la nota queda fallida y se reintenta con el mismo audio', async () => {
    const repo = hilo();
    const enviar = jest
      .spyOn(repo, 'enviar')
      .mockResolvedValueOnce(respuestaError('Sin conexión', 0));
    await montar(repo, audioFalso());
    await fireEvent.press(screen.getByTestId('chat-grabar'));
    await fireEvent.press(await screen.findByTestId('chat-grabar-enviar'));
    await screen.findByText('No se envió');
    enviar.mockRestore();
    const reenviar = jest.spyOn(repo, 'enviar');
    await fireEvent.press(await screen.findByTestId('mensaje-reintentar-1'));
    await waitFor(() => expect(reenviar).toHaveBeenCalledTimes(1));
    expect(reenviar.mock.calls[0][0]).toMatchObject({ voz: VOZ });
  });

  it('al salir del chat con una grabación abierta, se descarta', async () => {
    const audio = audioFalso();
    const vista = await montar(hilo(), audio);
    await fireEvent.press(screen.getByTestId('chat-grabar'));
    await screen.findByTestId('chat-grabando');
    await vista.unmount();
    expect(audio.cancelarGrabacion).toHaveBeenCalledTimes(1);
  });
});

describe('reproducir una nota recibida', () => {
  const conVoz = () =>
    crearMemoriaMensajesRepository(
      [msg({ id: 5, tieneVoz: true, texto: '' })],
      { media: { 5: { imagen: null, voz: VOZ } } },
    );

  it('la baja al mostrarse, suena con avance y se detiene al tocar otra vez', async () => {
    const audio = audioFalso();
    await montar(conVoz(), audio);
    const alternar = await screen.findByTestId('voz-alternar-5');
    await waitFor(() =>
      expect(alternar.props.accessibilityState?.disabled).toBeFalsy(),
    );
    await fireEvent.press(screen.getByTestId('voz-alternar-5'));
    expect(audio.reproducir).toHaveBeenCalledWith(
      VOZ,
      expect.objectContaining({ clave: '5' }),
    );
    const { alProgreso, alTerminar } = audio.reproducir.mock.calls[0][1];
    await waitFor(() =>
      expect(
        screen.getByTestId('voz-alternar-5').props.accessibilityLabel,
      ).toBe('Detener la nota de voz'),
    );
    alProgreso(1000, 4000);
    expect(await screen.findByText('0:04')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('voz-alternar-5'));
    expect(audio.detener).toHaveBeenCalledTimes(1);
    alTerminar();
    await waitFor(() =>
      expect(
        screen.getByTestId('voz-alternar-5').props.accessibilityLabel,
      ).toBe('Reproducir la nota de voz'),
    );
  });

  it('si no se puede reproducir avisa y vuelve al reposo', async () => {
    const audio = audioFalso();
    audio.reproducir.mockResolvedValue({ tipo: 'error', msg: 'Códec' });
    await montar(conVoz(), audio);
    await screen.findByTestId('voz-alternar-5');
    await waitFor(() =>
      expect(
        screen.getByTestId('voz-alternar-5').props.accessibilityState?.disabled,
      ).toBeFalsy(),
    );
    await fireEvent.press(screen.getByTestId('voz-alternar-5'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('voz-alternar-5').props.accessibilityLabel).toBe(
      'Reproducir la nota de voz',
    );
  });

  it('mientras carga el botón no hace nada; si falla ofrece reintentar', async () => {
    const repo = conVoz();
    jest
      .spyOn(repo, 'media')
      .mockResolvedValueOnce(respuestaError('Sin conexión', 0));
    const audio = audioFalso();
    await montar(repo, audio);
    await fireEvent.press(await screen.findByTestId('voz-reintentar-5'));
    expect(await screen.findByTestId('voz-alternar-5')).toBeOnTheScreen();
    expect(audio.reproducir).not.toHaveBeenCalled();
  });

  it('mantener pulsada la nota abre las reacciones', async () => {
    await montar(conVoz(), audioFalso());
    await fireEvent(await screen.findByTestId('voz-alternar-5'), 'longPress');
    expect(await screen.findByTestId('hoja-reacciones')).toBeOnTheScreen();
  });

  it('al salir del chat con una nota sonando, la detiene', async () => {
    const audio = audioFalso();
    const vista = await montar(conVoz(), audio);
    await waitFor(() =>
      expect(
        screen.getByTestId('voz-alternar-5').props.accessibilityState?.disabled,
      ).toBeFalsy(),
    );
    await fireEvent.press(screen.getByTestId('voz-alternar-5'));
    await waitFor(() => expect(audio.reproducir).toHaveBeenCalled());
    await vista.unmount();
    expect(audio.detener).toHaveBeenCalled();
  });
});
