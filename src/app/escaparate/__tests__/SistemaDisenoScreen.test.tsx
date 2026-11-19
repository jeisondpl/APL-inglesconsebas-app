// CA12: el escaparate muestra paleta, tipografía, botones en todos sus estados, campo con y sin
// error, tarjetas, insignias, aviso, carga, LogoMarca y Marca; tiene el selector de tema (Sistema,
// Claro, Oscuro) y un botón por cada tipo de notify. Sus textos están en escaparate.textos.ts.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { textosEscaparate as textos } from '@/app/escaparate/escaparate.textos';
import { SistemaDisenoScreen } from '@/app/escaparate/SistemaDisenoScreen';
import { TemaProvider, temaClaro, temaOscuro } from '@/shared/theme';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'dark'),
}));

const useColorScheme = jest.requireMock(
  'react-native/Libraries/Utilities/useColorScheme',
).default as jest.Mock;
const show = Toast.show as jest.Mock;

const montar = () =>
  render(
    <SafeAreaProvider>
      <TemaProvider>
        <SistemaDisenoScreen />
      </TemaProvider>
    </SafeAreaProvider>,
  );

beforeEach(() => {
  useColorScheme.mockReturnValue('dark');
  show.mockClear();
});

describe('SistemaDisenoScreen (CA12)', () => {
  it('muestra la introducción y una cabecera por sección', async () => {
    await montar();
    expect(screen.getByText(textos.introduccion)).toBeOnTheScreen();
    for (const titulo of Object.values(textos.secciones)) {
      expect(screen.getByRole('header', { name: titulo })).toBeOnTheScreen();
    }
  });

  it('la paleta lista cada token con su hex del tema activo', async () => {
    await montar();
    for (const [clave, valor] of Object.entries(temaOscuro.colores)) {
      expect(screen.getByText(clave)).toBeOnTheScreen();
      expect(screen.getAllByText(valor).length).toBeGreaterThan(0);
    }
  });

  it('la tipografía muestra las 10 variantes con su familia y tamaño', async () => {
    await montar();
    expect(screen.getAllByText(textos.ejemploTexto)).toHaveLength(10);
    for (const [variante, estilo] of Object.entries(temaOscuro.tipografia)) {
      expect(
        screen.getByText(
          `${variante} · ${estilo.fontFamily} ${estilo.fontSize}`,
        ),
      ).toBeOnTheScreen();
    }
  });

  it('los botones salen en todos sus estados', async () => {
    await montar();
    for (const nombre of [
      textos.botones.primario,
      textos.botones.secundario,
      textos.botones.peligro,
    ]) {
      expect(screen.getByRole('button', { name: nombre })).toBeEnabled();
    }
    expect(
      screen.getByRole('button', { name: textos.botones.deshabilitado }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: textos.botones.cargando }),
    ).toBeBusy();
  });

  it('campo sin error y campo con error que se corrige al escribir 4 dígitos', async () => {
    await montar();
    const usuario = screen.getByLabelText(textos.campos.usuario);
    expect(usuario).toHaveDisplayValue(textos.campos.usuarioEjemplo);
    await fireEvent.changeText(usuario, 'sebas');
    expect(usuario).toHaveDisplayValue('sebas');

    expect(
      screen.getByRole('alert', { name: textos.campos.errorPin }),
    ).toBeOnTheScreen();
    await fireEvent.changeText(
      screen.getByLabelText(textos.campos.pin),
      '1234',
    );
    expect(screen.queryByText(textos.campos.errorPin)).toBeNull();
  });

  it('tarjetas: destacada, normal y pulsable que cuenta las pulsaciones', async () => {
    await montar();
    expect(screen.getByText(textos.tarjetas.destacada)).toBeOnTheScreen();
    expect(screen.getByText(textos.tarjetas.normal)).toBeOnTheScreen();
    const pulsable = screen.getByRole('button', {
      name: textos.tarjetas.pulsable,
    });
    await fireEvent.press(pulsable);
    await fireEvent.press(pulsable);
    expect(
      screen.getByText(`${textos.tarjetas.pulsada} (2)`),
    ).toBeOnTheScreen();
  });

  it('insignias, aviso de error con acción, aviso, carga, isotipos y logo principal', async () => {
    await montar();
    for (const texto of Object.values(textos.insignias)) {
      expect(screen.getByLabelText(texto)).toBeOnTheScreen();
    }
    // Dos alertas: el error del PIN y el aviso de error de carga.
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(screen.getByText(textos.avisos.errorTitulo)).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: textos.avisos.reintentar }),
    ).toBeOnTheScreen();
    expect(screen.getByText(textos.avisos.infoTitulo)).toBeOnTheScreen();
    expect(
      screen.getByRole('progressbar', { name: textos.carga }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('image', { name: textos.logoEtiqueta }),
    ).toBeOnTheScreen();
    expect(
      screen.getAllByRole('image', { name: 'Inglés con Sebas' }),
    ).toHaveLength(2);
  });

  it.each(['success', 'error', 'warning', 'info'] as const)(
    'el botón de notify %s muestra un toast de ese tipo',
    async tipo => {
      await montar();
      await fireEvent.press(
        screen.getByRole('button', { name: textos.notificaciones[tipo] }),
      );
      expect(show).toHaveBeenCalledTimes(1);
      expect(show).toHaveBeenCalledWith({
        type: tipo,
        text1: textos.notificaciones[tipo],
        text2: textos.notificaciones.detalle,
      });
    },
  );
});

describe('SistemaDisenoScreen: selector de tema (CA12, CA4)', () => {
  it('ofrece Sistema, Claro y Oscuro como radios de 44 de alto, con Sistema marcado', async () => {
    await montar();
    // El contenedor declara role radiogroup (no es elemento accesible por sí mismo).
    expect(
      screen.getAllByRole('radio')[0].parent?.props.accessibilityRole,
    ).toBe('radiogroup');
    const radios = screen.getAllByRole('radio');
    expect(radios.map(r => r.props.accessibilityLabel)).toEqual([
      textos.temas.sistema,
      textos.temas.claro,
      textos.temas.oscuro,
    ]);
    expect(
      screen.getByRole('radio', { name: textos.temas.sistema }),
    ).toBeChecked();
    for (const radio of radios) {
      expect(radio).toHaveStyle({ minHeight: 44 });
    }
  });

  it('elegir Claro y luego Oscuro cambia el tema de la pantalla', async () => {
    await montar();
    expect(
      screen.getAllByText(temaOscuro.colores.fondo).length,
    ).toBeGreaterThan(0);

    await fireEvent.press(
      screen.getByRole('radio', { name: textos.temas.claro }),
    );
    expect(
      screen.getByRole('radio', { name: textos.temas.claro }),
    ).toBeChecked();
    expect(
      screen.getByRole('radio', { name: textos.temas.sistema }),
    ).not.toBeChecked();
    expect(screen.getByRole('radio', { name: textos.temas.claro })).toHaveStyle(
      {
        backgroundColor: temaClaro.colores.marca,
      },
    );
    expect(
      screen.getAllByText(temaClaro.colores.superficieAlterna),
    ).toHaveLength(1);

    await fireEvent.press(
      screen.getByRole('radio', { name: textos.temas.oscuro }),
    );
    expect(
      screen.getByRole('radio', { name: textos.temas.oscuro }),
    ).toBeChecked();
    expect(
      screen.getAllByText(temaOscuro.colores.superficieAlterna),
    ).toHaveLength(1);
  });

  it('con Sistema sigue al modo del sistema', async () => {
    useColorScheme.mockReturnValue('light');
    await montar();
    expect(
      screen.getAllByText(temaClaro.colores.superficieAlterna),
    ).toHaveLength(1);
  });
});
