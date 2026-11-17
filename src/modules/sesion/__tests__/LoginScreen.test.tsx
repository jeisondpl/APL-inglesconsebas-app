// Tester (F1-03): pantalla de login con el controller real y el repositorio en memoria.
// CA2 (paso usuario), CA3 (teclado), CA4 (errores y carga), CA9 (aviso de sesión vencida),
// CA13 (diseño en los dos temas, tokens confirmar/sobreConfirmar) y CA15 (roles y etiquetas).
import { NavigationContainer } from '@react-navigation/native';
import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react-native';
import { BackHandler, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import type { SesionRepository } from '@/modules/sesion/domain/models/SesionRepository';
import { crearMemoriaSesionRepository } from '@/modules/sesion/infrastructure/memoriaSesionRepository';
import { ALTO_TECLA } from '@/modules/sesion/presentation/components/TecladoPin';
import { LoginScreen } from '@/modules/sesion/presentation/screens/LoginScreen';
import { respuestaError } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';
import {
  TemaProvider,
  temaClaro,
  temaOscuro,
  type ModoTema,
} from '@/shared/theme';

const sinSesion = () =>
  crearDependenciasDePrueba({ estadoInicial: { tipo: 'sinSesion' } });

function montar(
  dependencias: IDependencias = sinSesion(),
  modo: ModoTema = 'oscuro',
) {
  return render(
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial={modo}>
        <DependenciasProvider valor={dependencias}>
          <NavigationContainer>
            <LoginScreen />
          </NavigationContainer>
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );
}

const tecla = (etiqueta: string) =>
  screen.getByRole('button', { name: etiqueta });

async function irAlPin(usuario = 'ana') {
  await fireEvent.changeText(screen.getByLabelText('Usuario'), usuario);
  await fireEvent.press(tecla('Continuar'));
}

async function teclear(digitos: string) {
  for (const d of digitos) {
    await fireEvent.press(tecla(`Dígito ${d}`));
  }
}

const puntos = () => screen.getByLabelText(/^PIN: \d de 4 dígitos$/);

const estiloPlano = (elemento: { props: { style?: unknown } }) =>
  StyleSheet.flatten(elemento.props.style as never) as Record<string, unknown>;

const NEGRO_OPACO = 0xff000000;

interface INodo {
  props?: { stroke?: { payload?: number } };
  children?: unknown[];
}

/** Colores de trazo (procesados por react-native-svg) dentro de un elemento. */
function trazosDe(nodo: unknown, salida: number[] = []): number[] {
  if (!nodo || typeof nodo !== 'object') {
    return salida;
  }
  const n = nodo as INodo;
  if (n.props?.stroke?.payload !== undefined) {
    salida.push(n.props.stroke.payload);
  }
  (n.children ?? []).forEach(hijo => trazosDe(hijo, salida));
  return salida;
}

/** Repo cuyo login no responde nunca: deja la pantalla en «enviando». */
const repoColgado = (): SesionRepository => ({
  ...crearMemoriaSesionRepository(),
  iniciarSesion: jest.fn(() => new Promise(() => {})),
});

const repoQueFalla = (msg: string, code: number): SesionRepository => ({
  ...crearMemoriaSesionRepository(),
  iniciarSesion: jest.fn(() => Promise.resolve(respuestaError(msg, code))),
});

beforeEach(() => (Toast.show as jest.Mock).mockClear());

describe('LoginScreen · paso usuario (CA2)', () => {
  it('con el campo vacío, Continuar muestra «Ingresa tu usuario» como alerta y no avanza', async () => {
    await montar();
    await fireEvent.press(tecla('Continuar'));
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresa tu usuario');
    expect(screen.getByText('Inicia sesión')).toBeOnTheScreen();
    expect(screen.queryByText(/^PIN para/)).toBeNull();
  });

  it('solo con espacios tampoco avanza', async () => {
    await montar();
    await irAlPin('   ');
    expect(screen.getByText('Ingresa tu usuario')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Dígito 1')).toBeNull();
  });

  it('con usuario pasa al paso 2 con el título «PIN para ana»', async () => {
    await montar();
    await irAlPin('ana');
    expect(
      screen.getByRole('header', { name: 'PIN para ana' }),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('Usuario')).toBeNull();
  });

  // Vuelta 1: el título muestra el usuario tal como se envía.
  it('con «  ANA » el título es «PIN para ana» y al volver se conserva lo escrito', async () => {
    await montar(crearDependenciasDePrueba({ repo: repoColgado() }));
    await irAlPin('  ANA ');
    expect(
      screen.getByRole('header', { name: 'PIN para ana' }),
    ).toBeOnTheScreen();
    await fireEvent.press(tecla('Volver al usuario'));
    expect(screen.getByLabelText('Usuario')).toHaveDisplayValue('  ANA ');
  });

  // Vuelta 1 (CA3): toques rápidos en la pantalla, sin re-render entre ellos, no pierden dígitos.
  it('cuatro toques seguidos en el mismo ciclo envían «1234» una sola vez', async () => {
    const repo = repoColgado();
    await montar(crearDependenciasDePrueba({ repo }));
    await irAlPin('ana');
    const teclas = ['1', '2', '3', '4'].map(d => tecla(`Dígito ${d}`));
    await act(async () => {
      // Sin await entre toques: los cuatro se disparan antes de que React vuelva a pintar.
      await Promise.all(teclas.map(t => fireEvent.press(t)));
    });
    expect(repo.iniciarSesion).toHaveBeenCalledTimes(1);
    expect(repo.iniciarSesion).toHaveBeenCalledWith({
      usuario: 'ana',
      pin: '1234',
    });
  });

  it('enviar desde el teclado del sistema (submit) también continúa', async () => {
    await montar();
    const campo = screen.getByLabelText('Usuario');
    await fireEvent.changeText(campo, 'ana');
    await fireEvent(campo, 'submitEditing');
    expect(screen.getByText('PIN para ana')).toBeOnTheScreen();
  });
});

describe('LoginScreen · teclado de PIN (CA3)', () => {
  it('cada dígito llena un punto, el 5.º se ignora y Borrar quita el último', async () => {
    await montar(crearDependenciasDePrueba({ repo: repoColgado() }));
    await irAlPin();
    expect(puntos()).toHaveAccessibleName('PIN: 0 de 4 dígitos');
    expect(screen.getAllByTestId('punto-vacio')).toHaveLength(4);
    await teclear('12');
    expect(puntos()).toHaveAccessibleName('PIN: 2 de 4 dígitos');
    expect(screen.getAllByTestId('punto-lleno')).toHaveLength(2);
    await fireEvent.press(tecla('Borrar'));
    expect(puntos()).toHaveAccessibleName('PIN: 1 de 4 dígitos');
  });

  it('Confirmar solo está activo con 4 dígitos', async () => {
    const repo: SesionRepository = {
      ...crearMemoriaSesionRepository(),
      iniciarSesion: jest.fn(() =>
        Promise.resolve(respuestaError('Usuario o PIN incorrecto', 401)),
      ),
    };
    await montar(crearDependenciasDePrueba({ repo }));
    await irAlPin();
    expect(tecla('Confirmar PIN')).toBeDisabled();
    await teclear('123');
    expect(tecla('Confirmar PIN')).toBeDisabled();
    await fireEvent.press(tecla('Confirmar PIN'));
    expect(repo.iniciarSesion).not.toHaveBeenCalled();
  });

  it('al 4.º dígito se envía solo, una vez, y el 5.º no cambia nada', async () => {
    const repo = repoColgado();
    await montar(crearDependenciasDePrueba({ repo }));
    await irAlPin();
    await teclear('12345');
    expect(repo.iniciarSesion).toHaveBeenCalledTimes(1);
    expect(repo.iniciarSesion).toHaveBeenCalledWith({
      usuario: 'ana',
      pin: '1234',
    });
  });

  it('«Volver al usuario» vacía el PIN y vuelve al paso 1 con el usuario escrito', async () => {
    await montar(crearDependenciasDePrueba({ repo: repoColgado() }));
    await irAlPin('ana');
    await teclear('12');
    await fireEvent.press(tecla('Volver al usuario'));
    expect(screen.getByLabelText('Usuario')).toHaveDisplayValue('ana');
    await fireEvent.press(tecla('Continuar'));
    expect(puntos()).toHaveAccessibleName('PIN: 0 de 4 dígitos');
  });

  it('el botón atrás de Android en el paso 2 vuelve al usuario y se consume', async () => {
    type Oyente = Parameters<typeof BackHandler.addEventListener>[1];
    const oyentes: Oyente[] = [];
    const quitar = jest.fn();
    const espia = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_evento, oyente) => {
        oyentes.push(oyente);
        return { remove: quitar };
      });
    try {
      await montar(crearDependenciasDePrueba({ repo: repoColgado() }));
      // En el paso usuario la pantalla no intercepta (los que haya son de React Navigation).
      const previos = oyentes.length;
      await irAlPin('ana');
      await teclear('9');
      expect(oyentes).toHaveLength(previos + 1);
      let consumido: boolean | null | undefined;
      await act(async () => {
        consumido = oyentes[oyentes.length - 1]({} as Parameters<Oyente>[0]);
      });
      expect(consumido).toBe(true);
      expect(screen.getByLabelText('Usuario')).toHaveDisplayValue('ana');
      // Al salir del paso PIN se quita el oyente.
      expect(quitar).toHaveBeenCalled();
    } finally {
      espia.mockRestore();
    }
  });
});

describe('LoginScreen · errores del login (CA4)', () => {
  it('PIN incorrecto: alerta con el mensaje del servidor, PIN vacío y sigue en el paso 2', async () => {
    const dependencias = sinSesion();
    await montar(dependencias);
    await irAlPin('ana');
    await teclear('0000');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Usuario o PIN incorrecto');
    expect(puntos()).toHaveAccessibleName('PIN: 0 de 4 dígitos');
    expect(screen.getByText('PIN para ana')).toBeOnTheScreen();
    expect(dependencias.sesionActiva.obtener().tipo).toBe('sinSesion');
    await expect(
      dependencias.nativos.almacenSeguro.leer('sesion'),
    ).resolves.toBeNull();
  });

  it('el siguiente dígito borra el error', async () => {
    await montar();
    await irAlPin('ana');
    await teclear('0000');
    await screen.findByRole('alert');
    await teclear('1');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([
    [
      '429',
      'Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.',
      429,
    ],
    ['sin red', textosComunes.errores.red, 0],
    ['tiempo agotado', textosComunes.errores.tiempoAgotado, 0],
    [
      'respuesta sin token (CA5)',
      'El servidor todavía no admite la sesión de la App',
      200,
    ],
  ])('%s: muestra el mensaje junto a los puntos', async (_caso, msg, code) => {
    const dependencias = crearDependenciasDePrueba({
      repo: repoQueFalla(msg, code),
      estadoInicial: { tipo: 'sinSesion' },
    });
    await montar(dependencias);
    await irAlPin('ana');
    await teclear('1234');
    expect(await screen.findByRole('alert')).toHaveTextContent(msg);
    expect(puntos()).toHaveAccessibleName('PIN: 0 de 4 dígitos');
    expect(dependencias.sesionActiva.obtener().tipo).toBe('sinSesion');
  });

  it('mientras se envía: indicador de carga y teclado, borrar y volver deshabilitados', async () => {
    await montar(crearDependenciasDePrueba({ repo: repoColgado() }));
    await irAlPin('ana');
    await teclear('1234');
    expect(screen.getByLabelText('Verificando tu PIN')).toBeOnTheScreen();
    for (const d of '0123456789') {
      expect(tecla(`Dígito ${d}`)).toBeDisabled();
    }
    expect(tecla('Borrar')).toBeDisabled();
    expect(tecla('Confirmar PIN')).toBeDisabled();
    expect(tecla('Volver al usuario')).toBeDisabled();
  });

  it('con el PIN correcto la sesión pasa a autenticado (la navegación la cambia el estado)', async () => {
    const dependencias = sinSesion();
    await montar(dependencias);
    await irAlPin('  ANA ');
    await teclear('1234');
    const estado = dependencias.sesionActiva.obtener();
    expect(estado.tipo).toBe('autenticado');
  });
});

describe('LoginScreen · aviso de sesión vencida (CA9)', () => {
  it('con motivo vencida muestra «Tu sesión venció. Vuelve a iniciar sesión.»', async () => {
    await montar(
      crearDependenciasDePrueba({
        estadoInicial: { tipo: 'sinSesion', motivo: 'vencida' },
      }),
    );
    expect(
      screen.getByText('Tu sesión venció. Vuelve a iniciar sesión.'),
    ).toBeOnTheScreen();
  });

  it.each([
    ['sin motivo', { tipo: 'sinSesion' as const }],
    ['cerrada', { tipo: 'sinSesion' as const, motivo: 'cerrada' as const }],
  ])('%s no muestra el aviso', async (_caso, estadoInicial) => {
    await montar(crearDependenciasDePrueba({ estadoInicial }));
    expect(screen.queryByText(/Tu sesión venció/)).toBeNull();
  });
});

describe('LoginScreen · diseño en los dos temas (CA13)', () => {
  it.each([
    ['oscuro', temaOscuro],
    ['claro', temaClaro],
  ] as const)(
    'tema %s: logo, tarjeta, 12 teclas, pie y enlace',
    async (modo, tema) => {
      await montar(sinSesion(), modo);
      expect(
        screen.getByRole('header', { name: 'Inglés con Sebas' }),
      ).toBeOnTheScreen();
      expect(screen.getByText('app.inglesconsebas.com')).toBeOnTheScreen();
      await irAlPin('ana');
      const digitos = '0123456789'.split('').map(d => tecla(`Dígito ${d}`));
      expect(digitos).toHaveLength(10);
      expect(tecla('Borrar')).toBeOnTheScreen();
      const confirmar = tecla('Confirmar PIN');
      // Fondo verde oficial #86EF86 en los dos temas (token confirmar) y check negro (sobreConfirmar).
      expect(estiloPlano(confirmar).backgroundColor).toBe(
        tema.colores.confirmar,
      );
      expect(tema.colores.confirmar.toUpperCase()).toBe('#86EF86');
      expect(tema.colores.sobreConfirmar.toUpperCase()).toBe('#000000');
      // react-native-svg procesa el color: negro opaco es 0xFF000000.
      expect(trazosDe(confirmar)).toEqual([NEGRO_OPACO]);
      expect(
        screen.getByRole('link', {
          name: '¿Olvidaste tu PIN? Escríbenos por WhatsApp',
        }),
      ).toBeOnTheScreen();
      expect(tecla('Volver al usuario')).toBeOnTheScreen();
    },
  );

  it('los puntos llenos usan el token marca del tema', async () => {
    await montar(crearDependenciasDePrueba({ repo: repoColgado() }), 'claro');
    await irAlPin('ana');
    await teclear('1');
    const lleno = screen.getByTestId('punto-lleno');
    expect(estiloPlano(lleno).backgroundColor).toBe(temaClaro.colores.marca);
  });

  it('el botón de tema alterna oscuro → claro → oscuro sin salir del paso', async () => {
    await montar(sinSesion(), 'oscuro');
    await fireEvent.press(tecla('Cambiar a tema claro'));
    expect(tecla('Cambiar a tema oscuro')).toBeOnTheScreen();
    await fireEvent.press(tecla('Cambiar a tema oscuro'));
    expect(tecla('Cambiar a tema claro')).toBeOnTheScreen();
  });

  it('el enlace de WhatsApp abre wa.me con el mensaje codificado (CA14)', async () => {
    const enlaces = { abrir: jest.fn(() => Promise.resolve(true)) };
    await montar(
      crearDependenciasDePrueba({
        enlaces,
        estadoInicial: { tipo: 'sinSesion' },
      }),
    );
    await irAlPin('ana');
    await fireEvent.press(
      screen.getByRole('link', { name: /Olvidaste tu PIN/ }),
    );
    expect(enlaces.abrir).toHaveBeenCalledWith(
      `https://wa.me/573205571518?text=${encodeURIComponent(
        "Hi Inglés con Sebas's Team! I've forgotten my PIN, could you pls help me with that?",
      )}`,
    );
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('si WhatsApp no abre, muestra un toast de error (CA14)', async () => {
    const enlaces = { abrir: jest.fn(() => Promise.resolve(false)) };
    await montar(crearDependenciasDePrueba({ enlaces }));
    await irAlPin('ana');
    await fireEvent.press(
      screen.getByRole('link', { name: /Olvidaste tu PIN/ }),
    );
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
    );
  });
});

describe('LoginScreen · accesibilidad (CA15)', () => {
  it('todas las teclas son botones etiquetados de al menos 64 dp', async () => {
    expect(ALTO_TECLA).toBeGreaterThanOrEqual(64);
    await montar();
    await irAlPin('ana');
    const etiquetas = [
      ...'0123456789'.split('').map(d => `Dígito ${d}`),
      'Borrar',
      'Confirmar PIN',
    ];
    for (const etiqueta of etiquetas) {
      const t = tecla(etiqueta);
      expect(estiloPlano(t).minHeight).toBeGreaterThanOrEqual(64);
    }
  });

  it('el resto de controles tiene rol y etiqueta y mide al menos 44', async () => {
    await montar();
    const tema = tecla('Cambiar a tema claro');
    expect(estiloPlano(tema).height).toBeGreaterThanOrEqual(44);
    expect(estiloPlano(tecla('Continuar')).minHeight).toBeGreaterThanOrEqual(
      44,
    );
    await irAlPin('ana');
    expect(
      estiloPlano(tecla('Volver al usuario')).minHeight,
    ).toBeGreaterThanOrEqual(44);
    const enlace = screen.getByRole('link', { name: /Olvidaste tu PIN/ });
    expect(estiloPlano(enlace).minHeight).toBeGreaterThanOrEqual(44);
  });

  it('los puntos se anuncian por progreso y nunca exponen los dígitos', async () => {
    await montar(crearDependenciasDePrueba({ repo: repoColgado() }));
    await irAlPin('ana');
    await teclear('73');
    expect(puntos()).toHaveAccessibleName('PIN: 2 de 4 dígitos');
    expect(within(puntos()).queryByText(/7|3/)).toBeNull();
    expect(screen.queryByText('73')).toBeNull();
  });
});
