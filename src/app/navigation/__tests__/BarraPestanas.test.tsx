// F1-05: barra de pestañas (CA2-CA6) y estructura de pestañas del estudiante (CA1, CA16).
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Keyboard, StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import {
  BarraPestanas,
  textoInsignia,
  trazoBarra,
  type IPestanaBarra,
} from '@/app/navigation/BarraPestanas';
import { usePestanas } from '@/app/navigation/ContextoPestanas';
import { PestanasEstudiante } from '@/app/navigation/PestanasEstudiante';
import { crearMemoriaInicioRepository } from '@/modules/inicio/infrastructure/memoriaInicioRepository';
import { tokenMemoria } from '@/modules/sesion/infrastructure/memoriaSesionRepository';
import { IconoClases, IconoInicio, IconoMensajes } from '@/shared/iconos';
import { TemaProvider, temaOscuro } from '@/shared/theme';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavegar }),
}));
const mockNavegar = jest.fn();

afterEach(() => jest.restoreAllMocks());

type Id = 'inicio' | 'clases' | 'mensajes';
const PESTANAS: IPestanaBarra<Id>[] = [
  { id: 'inicio', etiqueta: 'Inicio', Icono: IconoInicio },
  { id: 'clases', etiqueta: 'Clases', Icono: IconoClases },
  {
    id: 'mensajes',
    etiqueta: 'Mensajes',
    Icono: IconoMensajes,
    insignia: 2,
    etiquetaInsignia: '2 mensajes sin leer',
  },
];

const conTema = (hijo: React.ReactNode) => (
  <SafeAreaProvider>
    <TemaProvider preferenciaInicial="oscuro">{hijo}</TemaProvider>
  </SafeAreaProvider>
);

describe('BarraPestanas', () => {
  it('pestañas con role tab y selected en la activa (CA2)', async () => {
    await render(
      conTema(
        <BarraPestanas
          pestanas={PESTANAS}
          activa="inicio"
          alCambiar={jest.fn()}
        />,
      ),
    );
    expect(screen.getByTestId('barra-pestanas').props.accessibilityRole).toBe(
      'tablist',
    );
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Inicio' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Clases' })).not.toBeSelected();
  });

  it('pulsar una pestaña avisa su id (también con pulsación larga)', async () => {
    const alCambiar = jest.fn();
    await render(
      conTema(
        <BarraPestanas
          pestanas={PESTANAS}
          activa="inicio"
          alCambiar={alCambiar}
        />,
      ),
    );
    await fireEvent.press(screen.getByRole('tab', { name: 'Clases' }));
    expect(alCambiar).toHaveBeenCalledWith('clases');
    await fireEvent(screen.getByRole('tab', { name: 'Clases' }), 'longPress');
    expect(alCambiar).toHaveBeenCalledTimes(2);
    await fireEvent(screen.getByRole('tab', { name: 'Clases' }), 'pressIn');
    await fireEvent(screen.getByRole('tab', { name: 'Clases' }), 'pressOut');
  });

  it('la insignia de no leídos sale en Mensajes y se anuncia (CA6)', async () => {
    await render(
      conTema(
        <BarraPestanas
          pestanas={PESTANAS}
          activa="inicio"
          alCambiar={jest.fn()}
        />,
      ),
    );
    expect(
      screen.getByTestId('insignia-mensajes', { includeHiddenElements: true }),
    ).toHaveTextContent('2');
    expect(
      screen.getByRole('tab', { name: 'Mensajes, 2 mensajes sin leer' }),
    ).toBeOnTheScreen();
  });

  it('en la pestaña activa no hay insignia', async () => {
    await render(
      conTema(
        <BarraPestanas
          pestanas={PESTANAS}
          activa="mensajes"
          alCambiar={jest.fn()}
        />,
      ),
    );
    expect(
      screen.queryByTestId('insignia-mensajes', {
        includeHiddenElements: true,
      }),
    ).toBeNull();
    expect(screen.getByRole('tab', { name: 'Mensajes' })).toBeSelected();
  });

  it('el círculo activo es marca con el ícono en sobreMarca (CA5)', async () => {
    await render(
      conTema(
        <BarraPestanas
          pestanas={PESTANAS}
          activa="clases"
          alCambiar={jest.fn()}
        />,
      ),
    );
    const icono = screen.getByTestId('icono-pestana-activa', {
      includeHiddenElements: true,
    });
    expect(icono.props.stroke).toBe(temaOscuro.colores.sobreMarca);
    // Sube hasta el anillo: la primera vista con fondo.
    let nodo = icono.parent;
    while (nodo && !StyleSheet.flatten(nodo.props.style)?.backgroundColor) {
      nodo = nodo.parent;
    }
    expect(StyleSheet.flatten(nodo?.props.style)).toMatchObject({
      backgroundColor: temaOscuro.colores.marca,
      borderColor: temaOscuro.colores.superficie,
    });
  });

  it('mide la barra y las pestañas y dibuja el SVG; con teclado se desactiva (CA3, CA4)', async () => {
    const oyentes: Record<string, () => void> = {};
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((
      evento: string,
      fn: () => void,
    ) => {
      oyentes[evento] = fn;
      return { remove: jest.fn() };
    }) as never);
    const { rerender } = await render(
      conTema(
        <BarraPestanas
          pestanas={PESTANAS}
          activa="inicio"
          alCambiar={jest.fn()}
        />,
      ),
    );
    const barra = screen.getByTestId('barra-pestanas');
    await act(async () => {
      fireEvent(barra.children[0] as never, 'layout', {
        nativeEvent: { layout: { width: 360, height: 72, x: 0, y: 0 } },
      });
      screen.getAllByRole('tab').forEach((tab, i) =>
        fireEvent(tab, 'layout', {
          nativeEvent: { layout: { x: i * 120, width: 120, y: 0, height: 72 } },
        }),
      );
    });
    expect(screen.toJSON()).toBeTruthy();
    // Cambiar de pestaña tras medir anima el círculo (sin errores).
    await rerender(
      conTema(
        <BarraPestanas
          pestanas={PESTANAS}
          activa="clases"
          alCambiar={jest.fn()}
        />,
      ),
    );
    await act(async () =>
      (oyentes.keyboardWillShow ?? oyentes.keyboardDidShow)?.(),
    );
    expect(screen.getByTestId('barra-pestanas').props.pointerEvents).toBe(
      'none',
    );
    await act(async () =>
      (oyentes.keyboardWillHide ?? oyentes.keyboardDidHide)?.(),
    );
    expect(screen.getByTestId('barra-pestanas').props.pointerEvents).toBe(
      'box-none',
    );
  });

  it('con reduce-motion cambia de pestaña sin resortes', async () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const { rerender } = await render(
      conTema(
        <BarraPestanas
          pestanas={PESTANAS}
          activa="inicio"
          alCambiar={jest.fn()}
        />,
      ),
    );
    await act(async () => {
      screen.getAllByRole('tab').forEach((tab, i) =>
        fireEvent(tab, 'layout', {
          nativeEvent: { layout: { x: i * 100, width: 100, y: 0, height: 72 } },
        }),
      );
    });
    await rerender(
      conTema(
        <BarraPestanas
          pestanas={PESTANAS}
          activa="mensajes"
          alCambiar={jest.fn()}
        />,
      ),
    );
    await fireEvent(screen.getByRole('tab', { name: 'Clases' }), 'pressIn');
    expect(screen.getByRole('tab', { name: 'Mensajes' })).toBeSelected();
  });
});

describe('trazoBarra y textoInsignia', () => {
  it('dibuja la hendidura dentro de los límites; sin ancho no dibuja', () => {
    expect(trazoBarra(50, 72, 25)).toBe('');
    const d = trazoBarra(360, 72, 60);
    expect(d.startsWith('M 16 0')).toBe(true);
    expect(d).toContain('Z');
    // El centro se acota para que los hombros no se salgan de la esquina.
    expect(trazoBarra(360, 72, 0)).toBe(trazoBarra(360, 72, 60));
  });

  it('insignia: nada con 0, el número o «9+»', () => {
    expect(textoInsignia(undefined)).toBeNull();
    expect(textoInsignia(0)).toBeNull();
    expect(textoInsignia(3)).toBe('3');
    expect(textoInsignia(12)).toBe('9+');
  });
});

describe('PestanasEstudiante', () => {
  const sesionAna = {
    tipo: 'autenticado' as const,
    sesion: {
      token: tokenMemoria('ana'),
      expiraEn: new Date(Date.now() + 86400000).toISOString(),
      renovarDesde: null,
      usuario: {
        id: 's0000000000000a1',
        nombre: 'Ana Torres',
        usuario: 'ana',
        rol: 'estudiante' as const,
      },
    },
  };

  async function montar(noLeidos = 0) {
    const dependencias = crearDependenciasDePrueba({
      estadoInicial: sesionAna,
      inicio: crearMemoriaInicioRepository({ noLeidos }),
    });
    await render(
      conTema(
        <DependenciasProvider valor={dependencias}>
          <PestanasEstudiante />
        </DependenciasProvider>,
      ),
    );
  }

  it('arranca en Inicio y la insignia toma los no leídos del inicio (CA1, CA6)', async () => {
    await montar(2);
    expect(await screen.findByText('Hola, Ana Torres')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Inicio' })).toBeSelected();
    expect(
      await screen.findByRole('tab', { name: 'Mensajes, 2 mensajes sin leer' }),
    ).toBeOnTheScreen();
  });

  it.each([
    ['Clases', 'pestana-contenido-clases', 'Clases'],
    ['Tareas', 'pestana-contenido-tareas', 'Tareas'],
  ])(
    'pulsar %s muestra su pantalla «Próximamente» (CA2, CA16)',
    async (pestana, testID, titulo) => {
      await montar();
      await screen.findByText('Hola, Ana Torres');
      await fireEvent.press(screen.getByRole('tab', { name: pestana }));
      expect(screen.getByTestId(testID)).toBeOnTheScreen();
      expect(screen.getByRole('header', { name: titulo })).toBeOnTheScreen();
      expect(screen.getByText('Próximamente')).toBeOnTheScreen();
      expect(screen.getByRole('tab', { name: pestana })).toBeSelected();
      expect(screen.queryByText('Hola, Ana Torres')).toBeNull();
    },
  );

  it('la tarjeta de mensajes del inicio lleva a la pestaña Mensajes', async () => {
    const dependencias = crearDependenciasDePrueba({
      estadoInicial: sesionAna,
      inicio: crearMemoriaInicioRepository({
        mensajes: [
          {
            id: '1',
            remitente: 'Meli',
            deEstudiante: false,
            texto: 'Hola',
            adjunto: null,
            enviadoEl: '2026-11-10 08:00:00',
          },
        ],
      }),
    });
    await render(
      conTema(
        <DependenciasProvider valor={dependencias}>
          <PestanasEstudiante />
        </DependenciasProvider>,
      ),
    );
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Último mensaje de Meli' }),
    );
    expect(screen.getByTestId('pestana-contenido-mensajes')).toBeOnTheScreen();
  });

  it('«Ver sistema de diseño» de la hoja navega al escaparate', async () => {
    await montar();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Abrir el menú de tu cuenta' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Ver sistema de diseño' }),
    );
    expect(mockNavegar).toHaveBeenCalledWith('SistemaDiseno');
  });

  it('sin usuario en la sesión el inicio no pinta nada', async () => {
    const dependencias = crearDependenciasDePrueba({
      estadoInicial: { tipo: 'sinSesion' },
    });
    await render(
      conTema(
        <DependenciasProvider valor={dependencias}>
          <PestanasEstudiante />
        </DependenciasProvider>,
      ),
    );
    expect(screen.queryByTestId('inicio-estudiante')).toBeNull();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });

  it('usePestanas fuera del proveedor falla con un error claro', async () => {
    const Sonda = () => {
      usePestanas();
      return null;
    };
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<Sonda />)).rejects.toThrow(/ProveedorPestanas/);
    consola.mockRestore();
  });
});
