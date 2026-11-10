import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { temaNavegacion } from '@/app/navigation/temaNavegacion';

import { textosLimiteDeErrores as textos } from './limiteDeErrores.textos';

interface IPropsLimiteDeErrores {
  children: ReactNode;
  /** Se llama con cada error capturado. Punto de enganche para un reporte de fallos futuro. */
  alCapturar?: (error: Error, info: ErrorInfo) => void;
}

interface IEstadoLimiteDeErrores {
  conError: boolean;
  /** Cambia en cada reintento para volver a montar a los hijos desde cero. */
  intento: number;
}

/**
 * Manejador global de errores de render (docs/ARQUITECTURA.md § 8). Muestra un fallback con
 * «Reintentar», que vuelve a montar la pantalla.
 */
export class LimiteDeErrores extends Component<
  IPropsLimiteDeErrores,
  IEstadoLimiteDeErrores
> {
  state: IEstadoLimiteDeErrores = { conError: false, intento: 0 };

  static getDerivedStateFromError(): Partial<IEstadoLimiteDeErrores> {
    return { conError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.alCapturar?.(error, info);
  }

  reintentar = () => {
    this.setState(({ intento }) => ({ conError: false, intento: intento + 1 }));
  };

  render() {
    if (this.state.conError) {
      return <FallbackDeError alReintentar={this.reintentar} />;
    }
    return (
      <View key={this.state.intento} style={estilos.contenedor}>
        {this.props.children}
      </View>
    );
  }
}

function FallbackDeError({ alReintentar }: { alReintentar: () => void }) {
  // Fuera del NavigationContainer: se toman los mismos colores del tema de navegación.
  const { colors } = temaNavegacion(useColorScheme());
  return (
    <View
      accessibilityRole="alert"
      style={[estilos.fallback, { backgroundColor: colors.background }]}
    >
      <Text
        accessibilityRole="header"
        style={[estilos.titulo, { color: colors.text }]}
      >
        {textos.titulo}
      </Text>
      <Text style={[estilos.mensaje, { color: colors.text }]}>
        {textos.mensaje}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={textos.reintentar}
        accessibilityHint={textos.reintentarAyuda}
        onPress={alReintentar}
        style={({ pressed }) => [
          estilos.boton,
          { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[estilos.textoBoton, { color: colors.primary }]}>
          {textos.reintentar}
        </Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  titulo: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  mensaje: { fontSize: 15, textAlign: 'center' },
  boton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBoton: { fontSize: 15, fontWeight: '600' },
});
