// Constructor (F1-04): kit de movimiento compartido. CA4 (piezas y exportación), CA5 (reduce-motion:
// sin desplazamientos, escalas ni bucles), CA6 (Boton escala al pulsar) y CA21 (Campo con foco).
// Con el mock oficial de Reanimated las animaciones resuelven al instante a su valor final.
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { Boton, Campo } from '@/shared/components';
import * as movimiento from '@/shared/movimiento';
import {
  DESPLAZAMIENTO_ENTRADA,
  ESCALA_PRESION,
  FondoMarca,
  GOLPES_SACUDIDA,
  PulsoCarga,
  resortes,
  Revelar,
  useSacudida,
} from '@/shared/movimiento';
import {
  TemaProvider,
  temaClaro,
  temaOscuro,
  type ITema,
} from '@/shared/theme';

const montar = (ui: ReactElement, tema: ITema = temaOscuro) =>
  render(<TemaProvider preferenciaInicial={tema.modo}>{ui}</TemaProvider>);

const plano = (nodo: { props: { style?: unknown } }) =>
  (StyleSheet.flatten(nodo.props.style as never) ?? {}) as Record<
    string,
    unknown
  >;

/** Activa reduce-motion para el test. */
const conMovimientoReducido = () =>
  jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);

afterEach(() => jest.restoreAllMocks());

describe('kit de movimiento: exportación (CA4)', () => {
  it('exporta las piezas y los tokens desde el index', () => {
    for (const nombre of [
      'FondoMarca',
      'PulsoCarga',
      'Revelar',
      'usePresionEscala',
      'useSacudida',
      'duraciones',
      'resortes',
    ]) {
      expect(movimiento).toHaveProperty(nombre);
    }
    expect(GOLPES_SACUDIDA).toEqual([-8, 8, -6, 6, 0]);
    expect(ESCALA_PRESION).toBe(0.97);
  });
});

describe('Revelar (CA4, CA5)', () => {
  it('pinta a sus hijos y entra desde abajo con el retraso pedido', async () => {
    const retraso = jest.spyOn(Reanimated, 'withDelay');
    await montar(
      <Revelar retraso={250} testID="bloque">
        <Text>Hola</Text>
      </Revelar>,
    );
    expect(screen.getByText('Hola')).toBeOnTheScreen();
    expect(plano(screen.getByTestId('bloque')).transform).toEqual([
      { translateY: DESPLAZAMIENTO_ENTRADA },
    ]);
    expect(retraso).toHaveBeenCalledWith(250, expect.anything());
  });

  it('con reduce-motion no se desplaza ni espera: solo un fundido', async () => {
    conMovimientoReducido();
    const retraso = jest.spyOn(Reanimated, 'withDelay');
    const resorte = jest.spyOn(Reanimated, 'withSpring');
    await montar(
      <Revelar retraso={600} testID="bloque">
        <Text>Hola</Text>
      </Revelar>,
    );
    expect(plano(screen.getByTestId('bloque')).transform).toEqual([
      { translateY: 0 },
    ]);
    expect(retraso).not.toHaveBeenCalled();
    expect(resorte).not.toHaveBeenCalled();
  });
});

describe('useSacudida (CA5, CA18)', () => {
  it('sacudir encadena los 5 golpes', async () => {
    const secuencia = jest.spyOn(Reanimated, 'withSequence');
    const { result } = await renderHook(() => useSacudida());
    await act(() => result.current.sacudir());
    expect(secuencia).toHaveBeenCalledTimes(1);
    expect(secuencia.mock.calls[0]).toHaveLength(GOLPES_SACUDIDA.length);
    expect(result.current.reducido).toBe(false);
  });

  it('con reduce-motion no sacude', async () => {
    conMovimientoReducido();
    const secuencia = jest.spyOn(Reanimated, 'withSequence');
    const { result } = await renderHook(() => useSacudida());
    await act(() => result.current.sacudir());
    expect(secuencia).not.toHaveBeenCalled();
    expect(result.current.reducido).toBe(true);
  });
});

describe('Boton con escala al pulsar (CA6)', () => {
  // El mock de Reanimated crea un valor compartido nuevo en cada render, así que la escala se
  // comprueba en la animación que se pide, no en el estilo pintado.
  it('al presionar pide la escala 0.97 con resorte y baja la opacidad; al soltar vuelve a 1', async () => {
    const resorte = jest.spyOn(Reanimated, 'withSpring');
    await montar(<Boton titulo="Guardar" onPress={jest.fn()} />);
    const boton = screen.getByRole('button', { name: 'Guardar' });
    await fireEvent(boton, 'pressIn');
    expect(resorte).toHaveBeenLastCalledWith(ESCALA_PRESION, resortes.presion);
    let estilo = plano(screen.getByRole('button', { name: 'Guardar' }));
    expect(estilo.opacity).toBe(0.8);
    expect(estilo.transform).toEqual([{ scale: 1 }]);
    expect(estilo.minHeight).toBeGreaterThanOrEqual(44);
    await fireEvent(boton, 'pressOut');
    expect(resorte).toHaveBeenLastCalledWith(1, resortes.presion);
    estilo = plano(screen.getByRole('button', { name: 'Guardar' }));
    expect(estilo.opacity).toBeUndefined();
  });

  it('con reduce-motion no escala, pero sí baja la opacidad', async () => {
    conMovimientoReducido();
    const resorte = jest.spyOn(Reanimated, 'withSpring');
    await montar(<Boton titulo="Guardar" onPress={jest.fn()} />);
    const boton = screen.getByRole('button', { name: 'Guardar' });
    await fireEvent(boton, 'pressIn');
    await fireEvent(boton, 'pressOut');
    await fireEvent(boton, 'pressIn');
    expect(resorte).not.toHaveBeenCalled();
    expect(plano(screen.getByRole('button', { name: 'Guardar' })).opacity).toBe(
      0.8,
    );
  });
});

describe('Campo con foco animado (CA21)', () => {
  it('reenvía onFocus y onBlur y anima el anillo de foco', async () => {
    const tiempo = jest.spyOn(Reanimated, 'withTiming');
    const alEnfocar = jest.fn();
    const alSalir = jest.fn();
    await montar(
      <Campo
        etiqueta="Usuario"
        valor=""
        alCambiar={jest.fn()}
        onFocus={alEnfocar}
        onBlur={alSalir}
      />,
    );
    const campo = screen.getByLabelText('Usuario');
    await fireEvent(campo, 'focus');
    expect(alEnfocar).toHaveBeenCalledTimes(1);
    expect(tiempo).toHaveBeenLastCalledWith(1, { duration: 150 });
    await fireEvent(campo, 'blur');
    expect(alSalir).toHaveBeenCalledTimes(1);
    expect(tiempo).toHaveBeenLastCalledWith(0, { duration: 150 });
    // El estilo del campo no cambia: el anillo es una capa aparte.
    expect(plano(campo).borderWidth).toBe(1);
  });

  it('enfocar sin manejadores propios no falla', async () => {
    await montar(<Campo etiqueta="Usuario" valor="" alCambiar={jest.fn()} />);
    const campo = screen.getByLabelText('Usuario');
    await fireEvent(campo, 'focus');
    await fireEvent(campo, 'blur');
    expect(campo).toBeOnTheScreen();
  });
});

describe('FondoMarca (CA4, CA5)', () => {
  it.each([
    ['oscuro', temaOscuro],
    ['claro', temaClaro],
  ] as const)(
    'en %s pinta el fondo del tema, es decorativo y no recibe toques',
    async (_modo, tema) => {
      const bucle = jest.spyOn(Reanimated, 'withRepeat');
      await montar(<FondoMarca testID="fondo" />, tema);
      const fondo = screen.getByTestId('fondo', {
        includeHiddenElements: true,
      });
      expect(plano(fondo).backgroundColor).toBe(tema.colores.fondo);
      expect(fondo.props.pointerEvents).toBe('none');
      expect(fondo.props.importantForAccessibility).toBe('no-hide-descendants');
      // Halo que respira e isotipo que deriva.
      expect(bucle).toHaveBeenCalledTimes(2);
    },
  );

  it('con progreso de varias páginas sigue pintándose', async () => {
    const progreso = {
      value: 1.5,
    } as unknown as Reanimated.SharedValue<number>;
    await montar(<FondoMarca testID="fondo" progreso={progreso} total={4} />);
    expect(
      screen.getByTestId('fondo', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('con reduce-motion queda quieto (sin bucles)', async () => {
    conMovimientoReducido();
    const bucle = jest.spyOn(Reanimated, 'withRepeat');
    await montar(<FondoMarca testID="fondo" />);
    expect(bucle).not.toHaveBeenCalled();
  });
});

describe('PulsoCarga (CA4, CA5, CA20)', () => {
  it('se anuncia como progreso ocupado con su etiqueta, que también se ve', async () => {
    const bucle = jest.spyOn(Reanimated, 'withRepeat');
    await montar(<PulsoCarga etiqueta="Verificando tu PIN" />, temaClaro);
    const carga = screen.getByRole('progressbar', {
      name: 'Verificando tu PIN',
    });
    expect(carga).toBeBusy();
    expect(screen.getByText('Verificando tu PIN')).toBeTruthy();
    // Logo que respira y anillo que gira.
    expect(bucle).toHaveBeenCalledTimes(2);
  });

  it('con reduce-motion solo aparece con un fundido', async () => {
    conMovimientoReducido();
    const bucle = jest.spyOn(Reanimated, 'withRepeat');
    await montar(<PulsoCarga etiqueta="Cargando" />);
    expect(screen.getByRole('progressbar', { name: 'Cargando' })).toBeTruthy();
    expect(bucle).not.toHaveBeenCalled();
  });
});
