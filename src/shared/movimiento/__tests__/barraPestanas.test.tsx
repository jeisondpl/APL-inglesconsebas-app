// F1-05: barra que se oculta con el scroll (CA4) e íconos de trazo compartidos.
import { render, renderHook, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  IconoClases,
  IconoFlecha,
  IconoInicio,
  IconoMensajes,
  IconoReloj,
  IconoTareas,
} from '@/shared/iconos';
import {
  direccionDesplazamiento,
  ESPACIO_BARRA_PESTANAS,
  ProveedorBarraPestanas,
  UMBRAL_DIRECCION,
  useEstadoBarraPestanas,
  useOcultarBarraAlDesplazar,
} from '@/shared/movimiento';

describe('direccionDesplazamiento', () => {
  it.each([
    [0, 50, -1],
    [-20, 0, -1],
    [100, 50, 1],
    [50, 100, -1],
    [55, 50, 0],
    [50 + UMBRAL_DIRECCION, 50, 0],
    [50 + UMBRAL_DIRECCION + 1, 50, 1],
  ] as const)('y=%p, anterior=%p → %p', (y, anterior, esperado) => {
    expect(direccionDesplazamiento(y, anterior)).toBe(esperado);
  });

  it('el espacio reservado bajo el scroll es el de Livic', () => {
    expect(ESPACIO_BARRA_PESTANAS).toBe(122);
  });
});

describe('ProveedorBarraPestanas', () => {
  const envoltorio = ({ children }: { children: ReactNode }) => (
    <ProveedorBarraPestanas>{children}</ProveedorBarraPestanas>
  );

  it('expone la dirección y mostrar() la pone en «subiendo»', async () => {
    const { result } = await renderHook(() => useEstadoBarraPestanas(), {
      wrapper: envoltorio,
    });
    expect(result.current?.direccion.value).toBe(0);
    result.current?.mostrar();
    expect(result.current?.direccion.value).toBe(-1);
  });

  it('fuera del proveedor no hay estado y el manejador de scroll no falla', async () => {
    const { result } = await renderHook(() => ({
      estado: useEstadoBarraPestanas(),
      manejador: useOcultarBarraAlDesplazar(),
    }));
    expect(result.current.estado).toBeNull();
    expect(result.current.manejador).toBeDefined();
  });
});

describe('íconos', () => {
  it.each([
    ['inicio', IconoInicio],
    ['clases', IconoClases],
    ['mensajes', IconoMensajes],
    ['tareas', IconoTareas],
    ['reloj', IconoReloj],
    ['flecha', IconoFlecha],
  ] as const)('%s dibuja con el color y el trazo 1.75', async (id, Icono) => {
    await render(<Icono color="#000000" testID={id} />);
    const svg = screen.getByTestId(id, { includeHiddenElements: true });
    expect(svg.props.stroke).toBe('#000000');
    expect(svg.props.strokeWidth).toBe(1.75);
    expect(svg.props.width).toBe(22);
  });
});
