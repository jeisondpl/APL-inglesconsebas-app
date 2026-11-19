// Tester (F1-04): el login rediseñado en el flujo real del controller. CA18 (la sacudida solo sale
// con un error nuevo de PIN, no al volver al usuario ni al reentrar), CA16 (la tarjeta sube con el
// teclado y el saludo se desvanece), CA19 y la regla de marca de áreas
// táctiles (≥ 44 en todo lo pulsable, ≥ 64 en las teclas) y reduce-motion de punta a punta.
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { LoginScreen } from '@/modules/sesion/presentation/screens/LoginScreen';
import { textosSesion } from '@/modules/sesion/presentation/sesion.textos';
import { TemaProvider, temaOscuro, type ModoTema } from '@/shared/theme';

afterEach(() => {
  jest.restoreAllMocks();
});

async function montar(modo: ModoTema = 'oscuro') {
  await render(
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial={modo}>
        <DependenciasProvider
          valor={crearDependenciasDePrueba({
            estadoInicial: { tipo: 'sinSesion' },
          })}
        >
          <NavigationContainer>
            <LoginScreen />
          </NavigationContainer>
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );
}

async function irAlPin(usuario = 'ana') {
  await fireEvent.changeText(screen.getByLabelText('Usuario'), usuario);
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
}

async function escribirPin(pin: string) {
  for (const d of pin) {
    await fireEvent.press(screen.getByRole('button', { name: `Dígito ${d}` }));
  }
}

/** Llamadas a `withSequence` con los 5 golpes de la sacudida (el pop usa 3 y la carga 2). */
function contarSacudidas(espia: jest.SpyInstance): number {
  return espia.mock.calls.filter(args => args.length === 5).length;
}

/** Nodo del árbol de prueba (lo que devuelven las consultas de RNTL). */
type ReactTestInstance = ReturnType<typeof screen.getByText>;

const estilo = (nodo: ReactTestInstance) =>
  StyleSheet.flatten(nodo.props.style) ?? {};

/** Sube por el árbol hasta el primer ancestro (o el propio nodo) que cumpla `prueba`. */
function ancestro(
  nodo: ReactTestInstance,
  prueba: (n: ReactTestInstance) => boolean,
): ReactTestInstance | null {
  let actual: ReactTestInstance | null = nodo;
  while (actual) {
    if (prueba(actual)) {
      return actual;
    }
    actual = actual.parent;
  }
  return null;
}

type Transformacion = Record<string, number>;
const transformaciones = (n: ReactTestInstance): Transformacion[] =>
  (estilo(n).transform as Transformacion[] | undefined) ?? [];

describe('LoginScreen: la sacudida solo con un error nuevo (CA18)', () => {
  it('PIN errado sacude una vez y pinta los puntos en rojo', async () => {
    const secuencia = jest.spyOn(Reanimated, 'withSequence');
    await montar();
    await irAlPin();
    secuencia.mockClear();
    await escribirPin('9999');
    expect(
      await screen.findByText('Usuario o PIN incorrecto', { exact: false }),
    ).toBeOnTheScreen();
    expect(contarSacudidas(secuencia)).toBe(1);
    const rojos = screen.getAllByTestId('punto-error');
    expect(rojos).toHaveLength(4);
    expect(estilo(rojos[0]).backgroundColor).toBe(temaOscuro.colores.peligro);
  });

  it('volver al usuario y reentrar al PIN no vuelve a sacudir', async () => {
    const secuencia = jest.spyOn(Reanimated, 'withSequence');
    await montar();
    await irAlPin();
    await escribirPin('9999');
    await screen.findByText('Usuario o PIN incorrecto', { exact: false });
    secuencia.mockClear();
    await fireEvent.press(
      screen.getByRole('button', { name: textosSesion.pin.volverAlUsuario }),
    );
    expect(screen.getByLabelText('Usuario')).toBeOnTheScreen();
    await irAlPin();
    expect(screen.getAllByTestId('punto-vacio')).toHaveLength(4);
    expect(screen.queryAllByTestId('punto-error')).toHaveLength(0);
    expect(contarSacudidas(secuencia)).toBe(0);
  });

  it('escribir tras el error no sacude; un segundo PIN errado sí', async () => {
    const secuencia = jest.spyOn(Reanimated, 'withSequence');
    await montar();
    await irAlPin();
    await escribirPin('9999');
    await screen.findByText('Usuario o PIN incorrecto', { exact: false });
    secuencia.mockClear();
    await escribirPin('8');
    expect(contarSacudidas(secuencia)).toBe(0);
    expect(screen.queryAllByTestId('punto-error')).toHaveLength(0);
    await escribirPin('888');
    await screen.findByText('Usuario o PIN incorrecto', { exact: false });
    expect(contarSacudidas(secuencia)).toBe(1);
  });

  it('un error de validación del usuario no sacude (no es el paso PIN)', async () => {
    const secuencia = jest.spyOn(Reanimated, 'withSequence');
    await montar();
    secuencia.mockClear();
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert')).toBeOnTheScreen();
    expect(contarSacudidas(secuencia)).toBe(0);
  });

  it('con reduce-motion el PIN errado no sacude pero marca el rojo', async () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const secuencia = jest.spyOn(Reanimated, 'withSequence');
    const resorte = jest.spyOn(Reanimated, 'withSpring');
    await montar();
    await irAlPin();
    await escribirPin('9999');
    await screen.findByText('Usuario o PIN incorrecto', { exact: false });
    expect(contarSacudidas(secuencia)).toBe(0);
    // Ni pop de los puntos ni escala de las teclas ni entradas con resorte.
    expect(resorte).not.toHaveBeenCalled();
    expect(screen.getAllByTestId('punto-error')).toHaveLength(4);
  });
});

describe('LoginScreen: áreas táctiles (marca § 2.6, CA19)', () => {
  const MINIMO = temaOscuro.toqueMinimo;

  function altoMinimo(nodo: ReactTestInstance): number {
    const e = estilo(nodo);
    return Math.max(
      Number(e.minHeight ?? 0),
      Number(e.height ?? 0),
      // BotonTema usa un estilo función de `pressed`.
      typeof nodo.props.style === 'function'
        ? Number(
            StyleSheet.flatten(nodo.props.style({ pressed: false })).height ??
              0,
          )
        : 0,
    );
  }

  it.each(['oscuro', 'claro'] as const)(
    'en %s, todo lo pulsable del paso usuario mide 44 o más',
    async modo => {
      await montar(modo);
      const pulsables = [
        ...screen.getAllByRole('button'),
        ...screen.queryAllByRole('link'),
      ];
      expect(pulsables.length).toBeGreaterThanOrEqual(2);
      for (const p of pulsables) {
        expect(altoMinimo(p)).toBeGreaterThanOrEqual(MINIMO);
      }
    },
  );

  it('en el paso PIN, las 12 teclas miden 64 o más y el resto 44 o más', async () => {
    await montar();
    await irAlPin();
    const teclas = [
      ...'0123456789'
        .split('')
        .map(d => screen.getByRole('button', { name: `Dígito ${d}` })),
      screen.getByRole('button', { name: textosSesion.pin.borrar }),
      screen.getByRole('button', { name: textosSesion.pin.confirmar }),
    ];
    for (const t of teclas) {
      expect(estilo(t).minHeight).toBeGreaterThanOrEqual(64);
      expect(estilo(t).minWidth).toBeGreaterThanOrEqual(64);
    }
    const resto = [
      ...screen.getAllByRole('button'),
      ...screen.getAllByRole('link'),
    ].filter(p => !teclas.includes(p));
    expect(resto.length).toBeGreaterThanOrEqual(3);
    for (const p of resto) {
      expect(altoMinimo(p)).toBeGreaterThanOrEqual(MINIMO);
    }
  });
});

/** Interpolación lineal por tramos con recorte (el mock de Reanimated deja `interpolate` vacío). */
function interpolarLineal(x: number, entrada: number[], salida: number[]) {
  if (x <= entrada[0]) {
    return salida[0];
  }
  for (let i = 1; i < entrada.length; i++) {
    if (x <= entrada[i]) {
      const t = (x - entrada[i - 1]) / (entrada[i] - entrada[i - 1]);
      return salida[i - 1] + t * (salida[i] - salida[i - 1]);
    }
  }
  return salida[salida.length - 1];
}

describe('LoginScreen con el teclado abierto (CA16)', () => {
  beforeEach(() => {
    jest
      .spyOn(Reanimated, 'interpolate')
      .mockImplementation(((x: number, e: number[], s: number[]) =>
        interpolarLineal(x, e, s)) as never);
  });

  function conTeclado(alto: number) {
    jest.spyOn(Reanimated, 'useAnimatedKeyboard').mockReturnValue({
      height: { value: alto },
      state: { value: 2 },
    } as unknown as ReturnType<typeof Reanimated.useAnimatedKeyboard>);
  }

  it('sin teclado: tarjeta en su sitio, saludo visible y logo a escala 1', async () => {
    conTeclado(0);
    await montar();
    const tarjeta = ancestro(screen.getByText(textosSesion.dominio), n =>
      transformaciones(n).some(t => 'translateY' in t),
    );
    expect(transformaciones(tarjeta!)).toContainEqual({ translateY: -0 });
    const saludo = ancestro(
      screen.getByText(textosSesion.hero.saludo),
      n => estilo(n).opacity !== undefined && transformaciones(n).length === 2,
    );
    expect(estilo(saludo!).opacity).toBe(1);
  });

  // El viaje del logo al hueco libre (b9af6cc) depende de medidas de onLayout guardadas en valores
  // compartidos; el mock de Reanimated los recrea en cada render, así que aquí solo se prueba que
  // sin medidas el logo no se mueve (nunca salta a un sitio arbitrario). El viaje es manual (M6).
  it('con el teclado: la tarjeta sube su alto, el saludo se va y el logo sin medir no salta', async () => {
    conTeclado(300);
    await montar();
    const tarjeta = ancestro(screen.getByText(textosSesion.dominio), n =>
      transformaciones(n).some(t => 'translateY' in t),
    );
    // Sin margen inferior en Jest (safe area mockeada): sube exactamente el alto del teclado.
    expect(transformaciones(tarjeta!)).toContainEqual({ translateY: -300 });
    const saludo = ancestro(
      screen.getByText(textosSesion.hero.saludo),
      n => estilo(n).opacity !== undefined && transformaciones(n).length === 2,
    );
    expect(estilo(saludo!).opacity).toBe(0);
    const logo = ancestro(
      screen.getByRole('header', { name: 'Inglés con Sebas' }),
      n => transformaciones(n).some(t => 'scale' in t),
    );
    expect(transformaciones(logo!)).toEqual([{ translateY: 0 }, { scale: 1 }]);
  });
});
