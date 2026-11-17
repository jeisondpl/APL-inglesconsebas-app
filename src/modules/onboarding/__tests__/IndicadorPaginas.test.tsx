// Constructor (F1-04): indicador de páginas interpolado con el scroll (CA12). El mock de Reanimated
// deja `interpolate` vacío; aquí se sustituye por una interpolación lineal con recorte para medir
// el ancho (8 → 22) y el color (capa de marca) de cada marca en una posición intermedia.
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { IndicadorPaginas } from '@/modules/onboarding/presentation/components/IndicadorPaginas';
import { TemaProvider, temaOscuro } from '@/shared/theme';

/** Interpolación lineal por tramos, recortada a los extremos (como Extrapolation.CLAMP). */
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

interface INodo {
  props: { style?: unknown; testID?: string };
  children: INodo[];
}

const plano = (n: INodo) =>
  (StyleSheet.flatten(n.props.style as never) ?? {}) as Record<string, unknown>;

const progresoEn = (valor: number) =>
  ({ value: valor } as unknown as Reanimated.SharedValue<number>);

async function montar(indice: number, progreso?: number) {
  await render(
    <TemaProvider preferenciaInicial="oscuro">
      <IndicadorPaginas
        indice={indice}
        total={4}
        progreso={progreso === undefined ? undefined : progresoEn(progreso)}
      />
    </TemaProvider>,
  );
  return screen.getByTestId('indicador-paginas').children as unknown as INodo[];
}

beforeEach(() => {
  jest
    .spyOn(Reanimated, 'interpolate')
    .mockImplementation(((x: number, e: number[], s: number[]) =>
      interpolarLineal(x, e, s)) as never);
});
afterEach(() => jest.restoreAllMocks());

describe('IndicadorPaginas interpolado (CA12)', () => {
  it('a mitad de camino entre O2 y O3 las dos marcas miden lo mismo y se tiñen a medias', async () => {
    const marcas = await montar(1, 1.5);
    const anchos = marcas.map(m => plano(m).width);
    expect(anchos).toEqual([8, 15, 15, 8]);
    // Capa de marca (segunda capa de cada marca): opacidad = cercanía a la página.
    const tintes = marcas.map(m => plano(m.children[1]).opacity);
    expect(tintes).toEqual([0, 0.5, 0.5, 0]);
  });

  it('parado en una página, su marca mide 22 y es la única teñida', async () => {
    const marcas = await montar(2, 2);
    expect(marcas.map(m => plano(m).width)).toEqual([8, 8, 22, 8]);
    expect(marcas.map(m => plano(m.children[1]).opacity)).toEqual([0, 0, 1, 0]);
  });

  it('sin progreso sigue al índice', async () => {
    const marcas = await montar(3);
    expect(marcas.map(m => plano(m).width)).toEqual([8, 8, 8, 22]);
    expect(screen.getByTestId('marca-activa')).toBe(marcas[3]);
    expect(
      screen.getByTestId('indicador-paginas').props.accessibilityLabel,
    ).toBe('Paso 4 de 4');
  });

  it('las capas de color usan los tokens pista y marca', async () => {
    const marcas = await montar(0, 0);
    const [pista, marca] = marcas[0].children;
    expect(plano(pista).backgroundColor).toBe(temaOscuro.colores.pista);
    expect(plano(marca).backgroundColor).toBe(temaOscuro.colores.marca);
    // El color discreto de siempre sigue en la marca (contrato de EXT-01).
    expect(plano(marcas[0]).backgroundColor).toBe(temaOscuro.colores.marca);
    expect(plano(marcas[1]).backgroundColor).toBe(temaOscuro.colores.pista);
  });
});
