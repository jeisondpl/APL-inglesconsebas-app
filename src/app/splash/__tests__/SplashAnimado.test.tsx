// Constructor (F1-04): splash animado en JS. CA7 (arranca como el nativo y lo oculta sin fundido,
// eslogan oficial), CA8 (alTerminar tras el mínimo y la restauración, con tope y con reduce-motion)
// y CA9 (la navegación se monta debajo con su contrato de siempre). Con fake timers.
import { act, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import App from '@/app/App';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { Providers } from '@/app/providers';
import {
  ESPERA_MAXIMA_MS,
  MINIMO_SPLASH_MS,
  MINIMO_SPLASH_REDUCIDO_MS,
  RaizConSplash,
  SALIDA_MS,
  SplashAnimado,
} from '@/app/splash';
import { textosSplash } from '@/app/splash/splash.textos';
import { temaClaro, temaOscuro, type ModoTema } from '@/shared/theme';

const splashFalso = () => ({ ocultar: jest.fn(() => Promise.resolve()) });

async function montarSplash(
  props: { listo: boolean; alTerminar: () => void },
  modo: ModoTema = 'oscuro',
) {
  const splash = splashFalso();
  const dependencias = crearDependenciasDePrueba({ splash });
  const utilidades = await render(
    <Providers dependencias={dependencias} preferenciaTema={modo}>
      <SplashAnimado {...props} />
    </Providers>,
  );
  return { splash, dependencias, utilidades };
}

const avanzar = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

const oculto = { includeHiddenElements: true } as const;

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('SplashAnimado: arranque idéntico al nativo (CA7)', () => {
  it.each([
    ['oscuro', temaOscuro, '#000000'],
    ['claro', temaClaro, '#FFFFFF'],
  ] as const)(
    'en %s: fondo del splash nativo, logo de 160 y eslogan oficial',
    async (modo, tema, fondoNativo) => {
      await montarSplash({ listo: true, alTerminar: jest.fn() }, modo);
      const raiz = screen.getByTestId('splash-animado', oculto);
      expect(StyleSheet.flatten(raiz.props.style).backgroundColor).toBe(
        tema.colores.fondo,
      );
      expect(tema.colores.fondo.toUpperCase()).toBe(fondoNativo);
      const logo = screen.getByTestId('splash-logo', oculto);
      const svg = screen.getByLabelText('Inglés con Sebas', oculto);
      expect(svg.props.width).toBe(160);
      expect(logo).toBeTruthy();
      // Decorativo: el lector de pantalla no lo recorre.
      expect(raiz.props.importantForAccessibility).toBe('no-hide-descendants');
      const palabras = textosSplash.eslogan.split(' ');
      expect(palabras).toHaveLength(7);
      for (const palabra of palabras) {
        expect(screen.getByText(palabra, oculto)).toBeTruthy();
      }
    },
  );

  it('al montarse oculta el splash nativo sin fundido, una sola vez', async () => {
    const { splash, utilidades } = await montarSplash({
      listo: false,
      alTerminar: jest.fn(),
    });
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
    expect(splash.ocultar).toHaveBeenCalledWith({ fundido: false });
    await utilidades.rerender(
      <Providers
        dependencias={crearDependenciasDePrueba({ splash })}
        preferenciaTema="oscuro"
      >
        <SplashAnimado listo alTerminar={jest.fn()} />
      </Providers>,
    );
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
  });
});

describe('SplashAnimado: cuándo termina (CA8)', () => {
  it('ya restaurado: llama a alTerminar tras el mínimo y la salida, una vez', async () => {
    const alTerminar = jest.fn();
    await montarSplash({ listo: true, alTerminar });
    await avanzar(MINIMO_SPLASH_MS - 1);
    expect(alTerminar).not.toHaveBeenCalled();
    await avanzar(1);
    // Empieza la salida: deja de bloquear toques.
    expect(
      screen.getByTestId('splash-animado', oculto).props.pointerEvents,
    ).toBe('none');
    await avanzar(SALIDA_MS - 1);
    expect(alTerminar).not.toHaveBeenCalled();
    await avanzar(1);
    expect(alTerminar).toHaveBeenCalledTimes(1);
    await avanzar(5000);
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('sin restaurar: espera a la restauración después del mínimo', async () => {
    const alTerminar = jest.fn();
    const { splash, utilidades } = await montarSplash({
      listo: false,
      alTerminar,
    });
    await avanzar(MINIMO_SPLASH_MS + 500);
    expect(alTerminar).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('splash-animado', oculto).props.pointerEvents,
    ).toBe('auto');
    await utilidades.rerender(
      <Providers
        dependencias={crearDependenciasDePrueba({ splash })}
        preferenciaTema="oscuro"
      >
        <SplashAnimado listo alTerminar={alTerminar} />
      </Providers>,
    );
    await avanzar(SALIDA_MS);
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('si la restauración no llega, sale igual tras el tope de espera', async () => {
    const alTerminar = jest.fn();
    await montarSplash({ listo: false, alTerminar });
    await avanzar(MINIMO_SPLASH_MS);
    await avanzar(ESPERA_MAXIMA_MS - 1);
    expect(alTerminar).not.toHaveBeenCalled();
    await avanzar(1);
    await avanzar(SALIDA_MS);
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('restaurado antes del mínimo no adelanta la salida', async () => {
    const alTerminar = jest.fn();
    await montarSplash({ listo: true, alTerminar });
    await avanzar(1000);
    expect(alTerminar).not.toHaveBeenCalled();
  });

  it('con reduce-motion: mínimo de 600 ms, sin halo ni resortes (solo fundido)', async () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const resorte = jest.spyOn(Reanimated, 'withSpring');
    const bucle = jest.spyOn(Reanimated, 'withRepeat');
    const alTerminar = jest.fn();
    await montarSplash({ listo: true, alTerminar });
    await avanzar(MINIMO_SPLASH_REDUCIDO_MS);
    await avanzar(SALIDA_MS - 1);
    expect(alTerminar).not.toHaveBeenCalled();
    await avanzar(1);
    expect(alTerminar).toHaveBeenCalledTimes(1);
    expect(resorte).not.toHaveBeenCalled();
    expect(bucle).not.toHaveBeenCalled();
  });

  it('al desmontarse antes de tiempo no llama a alTerminar', async () => {
    const alTerminar = jest.fn();
    const { utilidades } = await montarSplash({ listo: true, alTerminar });
    await avanzar(MINIMO_SPLASH_MS);
    await utilidades.unmount();
    await avanzar(SALIDA_MS * 2);
    expect(alTerminar).not.toHaveBeenCalled();
  });
});

describe('RaizConSplash: navegación debajo del splash (CA9)', () => {
  it('la navegación se monta debajo y el splash se va tras el mínimo', async () => {
    const splash = splashFalso();
    const dependencias = crearDependenciasDePrueba({ splash });
    await render(
      <Providers dependencias={dependencias} preferenciaTema="oscuro">
        <RaizConSplash />
      </Providers>,
    );
    // El login ya está montado bajo el splash.
    expect(screen.getByText('Inicia sesión')).toBeOnTheScreen();
    expect(screen.getByTestId('splash-animado', oculto)).toBeTruthy();
    // El JS ocultó el nativo sin fundido; NavegadorRaiz conserva su llamada con fundido (no-op).
    expect(splash.ocultar).toHaveBeenCalledWith({ fundido: false });
    expect(splash.ocultar).toHaveBeenCalledWith({ fundido: true });
    await avanzar(MINIMO_SPLASH_MS);
    await avanzar(SALIDA_MS);
    expect(screen.queryByTestId('splash-animado', oculto)).toBeNull();
    expect(screen.getByText('Inicia sesión')).toBeOnTheScreen();
  });

  it('mientras se restaura la sesión, el splash espera a la restauración', async () => {
    // Un almacén que nunca responde deja la sesión en `restaurando`.
    const dependencias = crearDependenciasDePrueba({
      estadoInicial: { tipo: 'restaurando' },
      almacen: {
        leer: () => new Promise<string | null>(() => {}),
        guardar: () => Promise.resolve(true),
        borrar: () => Promise.resolve(),
      },
    });
    await render(
      <Providers dependencias={dependencias} preferenciaTema="oscuro">
        <RaizConSplash />
      </Providers>,
    );
    await avanzar(MINIMO_SPLASH_MS);
    await avanzar(SALIDA_MS);
    expect(screen.getByTestId('splash-animado', oculto)).toBeTruthy();
    // Con el tope agotado sale igualmente.
    await avanzar(ESPERA_MAXIMA_MS);
    await avanzar(SALIDA_MS);
    expect(screen.queryByTestId('splash-animado', oculto)).toBeNull();
  });

  it('App monta la raíz con el splash animado', async () => {
    await render(<App />);
    expect(screen.getByTestId('splash-animado', oculto)).toBeTruthy();
  });
});
