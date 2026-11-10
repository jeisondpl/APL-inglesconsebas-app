// CA4: TemaProvider arranca con PREFERENCIA_TEMA_POR_DEFECTO ('sistema', P1): sigue a
// useColorScheme() y, si devuelve null, usa oscuro. establecerPreferencia cambia el tema; useTema
// fuera del provider lanza un error descriptivo y useEstilos recalcula al cambiar de tema.
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  TemaProvider,
  temaClaro,
  temaOscuro,
  useEstilos,
  useTema,
  type ITema,
  type PreferenciaTema,
} from '@/shared/theme';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useColorScheme = jest.requireMock(
  'react-native/Libraries/Utilities/useColorScheme',
).default as jest.Mock;

const envoltorio =
  (preferenciaInicial?: PreferenciaTema) =>
  ({ children }: { children: ReactNode }) =>
    (
      <TemaProvider preferenciaInicial={preferenciaInicial}>
        {children}
      </TemaProvider>
    );

beforeEach(() => useColorScheme.mockReset());

describe('TemaProvider (CA4)', () => {
  it("sin preferenciaInicial arranca con 'sistema'", async () => {
    useColorScheme.mockReturnValue('light');
    const { result } = await renderHook(() => useTema(), {
      wrapper: envoltorio(),
    });
    expect(result.current.preferencia).toBe('sistema');
    expect(result.current.tema).toBe(temaClaro);
  });

  it.each([
    ['dark', temaOscuro],
    ['light', temaClaro],
    [null, temaOscuro],
    [undefined, temaOscuro],
  ] as const)(
    "con 'sistema' y el esquema %p usa el tema %#",
    async (esquema, esperado) => {
      useColorScheme.mockReturnValue(esquema);
      const { result } = await renderHook(() => useTema(), {
        wrapper: envoltorio('sistema'),
      });
      expect(result.current.tema).toBe(esperado);
    },
  );

  it.each([
    ['claro', 'dark', temaClaro],
    ['oscuro', 'light', temaOscuro],
  ] as const)(
    "con preferencia fija '%s' ignora el esquema del sistema (%s)",
    async (preferencia, esquema, esperado) => {
      useColorScheme.mockReturnValue(esquema);
      const { result } = await renderHook(() => useTema(), {
        wrapper: envoltorio(preferencia),
      });
      expect(result.current.preferencia).toBe(preferencia);
      expect(result.current.tema).toBe(esperado);
    },
  );

  it("con 'sistema' vuelve a pintar cuando cambia el esquema del sistema", async () => {
    useColorScheme.mockReturnValue('dark');
    const { result, rerender } = await renderHook(() => useTema(), {
      wrapper: envoltorio(),
    });
    expect(result.current.tema.modo).toBe('oscuro');
    useColorScheme.mockReturnValue('light');
    await rerender({});
    expect(result.current.tema.modo).toBe('claro');
  });

  it('establecerPreferencia cambia el tema y vuelve a pintar', async () => {
    useColorScheme.mockReturnValue('dark');
    const { result } = await renderHook(() => useTema(), {
      wrapper: envoltorio(),
    });
    expect(result.current.tema).toBe(temaOscuro);

    await act(() => result.current.establecerPreferencia('claro'));
    expect(result.current.preferencia).toBe('claro');
    expect(result.current.tema).toBe(temaClaro);

    await act(() => result.current.establecerPreferencia('oscuro'));
    expect(result.current.tema).toBe(temaOscuro);

    await act(() => result.current.establecerPreferencia('sistema'));
    expect(result.current.preferencia).toBe('sistema');
    expect(result.current.tema).toBe(temaOscuro);
  });

  it('el valor del contexto es estable si nada cambia', async () => {
    useColorScheme.mockReturnValue('dark');
    const { result, rerender } = await renderHook(() => useTema(), {
      wrapper: envoltorio(),
    });
    const antes = result.current;
    await rerender({});
    expect(result.current).toBe(antes);
  });
});

describe('useTema fuera del provider (CA4)', () => {
  it('lanza un error descriptivo', async () => {
    const errorConsola = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    try {
      await expect(renderHook(() => useTema())).rejects.toThrow(
        /useTema se usó fuera de <TemaProvider>/,
      );
    } finally {
      errorConsola.mockRestore();
    }
  });
});

describe('useEstilos (CA4)', () => {
  it('llama a la fábrica con el tema y recalcula solo al cambiar de tema', async () => {
    useColorScheme.mockReturnValue('dark');
    const fabrica = jest.fn((tema: ITema) => ({ fondo: tema.colores.fondo }));
    const { result, rerender } = await renderHook(
      () => ({ estilos: useEstilos(fabrica), contexto: useTema() }),
      { wrapper: envoltorio() },
    );
    expect(result.current.estilos).toEqual({
      fondo: temaOscuro.colores.fondo,
    });
    expect(fabrica).toHaveBeenCalledTimes(1);

    await rerender({});
    expect(fabrica).toHaveBeenCalledTimes(1);

    await act(() => result.current.contexto.establecerPreferencia('claro'));
    expect(result.current.estilos).toEqual({
      fondo: temaClaro.colores.fondo,
    });
    expect(fabrica).toHaveBeenCalledTimes(2);
    expect(fabrica).toHaveBeenLastCalledWith(temaClaro);
  });
});
