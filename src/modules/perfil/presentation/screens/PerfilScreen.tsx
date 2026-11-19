import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AvisoEnLinea,
  Boton,
  Campo,
  Tarjeta,
  Texto,
} from '@/shared/components';
import { IconoFlecha } from '@/shared/iconos';
import {
  useEstilos,
  useTema,
  type ITema,
  type PreferenciaTema,
} from '@/shared/theme';

import { usePerfilController } from '../../aplications/controllers/Perfil.controller';
import { textosPerfil as textos } from '../perfil.textos';

export interface IPropsPerfilScreen {
  /** Persona de la sesión (lo pasa la composición de `src/app`). */
  usuario: { nombre: string; usuario: string; rol: 'estudiante' | 'profe' };
  alVolver: () => void;
}

const OPCIONES_TEMA: PreferenciaTema[] = ['sistema', 'claro', 'oscuro'];

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: tema.colores.fondo },
    contenido: {
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.m,
      paddingBottom: tema.espaciado.xxxl,
      gap: tema.espaciado.l,
    },
    volver: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tema.espaciado.s,
      minHeight: tema.toqueMinimo,
    },
    cuenta: { gap: tema.espaciado.xs },
    textoFila: { flex: 1, gap: tema.espaciado.xs },
    bloque: { gap: tema.espaciado.m },
    fila: { flexDirection: 'row', gap: tema.espaciado.s },
    opcion: {
      flex: 1,
      minHeight: tema.toqueMinimo,
      borderRadius: tema.radios.boton,
      borderWidth: 1.5,
      borderColor: tema.colores.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    opcionActiva: {
      backgroundColor: tema.colores.marca,
      borderColor: tema.colores.marca,
    },
  });

/**
 * Perfil (F1-03b, 1.14): quién eres, el tema de la app (se recuerda entre arranques) y el cambio de
 * PIN, que pide el actual. Cambiarlo cierra las sesiones de tus otros dispositivos.
 */
export function PerfilScreen({ usuario, alVolver }: IPropsPerfilScreen) {
  const estilos = useEstilos(crearEstilos);
  const { tema, preferencia, establecerPreferencia } = useTema();
  const c = usePerfilController();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={estilos.pantalla}
      testID="perfil"
    >
      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          testID="perfil-volver"
          accessibilityRole="button"
          accessibilityLabel={textos.volver}
          onPress={alVolver}
          style={estilos.volver}
        >
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconoFlecha color={tema.colores.marca} />
          </View>
          <Texto variante="cuerpoFuerte" color="marca">
            {textos.volverEtiqueta}
          </Texto>
        </Pressable>

        <View style={estilos.cuenta}>
          <Texto variante="h1" accessibilityRole="header">
            {textos.titulo}
          </Texto>
          <Texto variante="titulo">{usuario.nombre}</Texto>
          <Texto color="textoSecundario">
            {`${
              usuario.rol === 'profe' ? textos.rolProfe : textos.rolEstudiante
            } · ${textos.usuario(usuario.usuario)}`}
          </Texto>
        </View>

        <Tarjeta testID="perfil-tema">
          <View style={estilos.bloque}>
            <Texto variante="titulo">{textos.tema.titulo}</Texto>
            <View style={estilos.fila} accessibilityRole="radiogroup">
              {OPCIONES_TEMA.map(o => {
                const activa = o === preferencia;
                return (
                  <Pressable
                    key={o}
                    testID={`perfil-tema-${o}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: activa }}
                    accessibilityLabel={textos.tema[o]}
                    onPress={() => establecerPreferencia(o)}
                    style={[estilos.opcion, activa && estilos.opcionActiva]}
                  >
                    <Texto
                      variante="cuerpoFuerte"
                      color={activa ? 'sobreMarca' : 'texto'}
                    >
                      {textos.tema[o]}
                    </Texto>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Tarjeta>

        {c.biometriaDisponible ? (
          <Tarjeta testID="perfil-bloqueo">
            <View style={estilos.fila}>
              <View style={estilos.textoFila}>
                <Texto variante="titulo">{textos.bloqueo.titulo}</Texto>
                <Texto variante="detalle" color="textoSecundario">
                  {textos.bloqueo.ayuda}
                </Texto>
              </View>
              <Switch
                testID="perfil-bloqueo-interruptor"
                accessibilityLabel={textos.bloqueo.activar}
                value={c.bloqueoActivo}
                onValueChange={activar => {
                  c._alternarBloqueo(activar);
                }}
                trackColor={{
                  false: tema.colores.borde,
                  true: tema.colores.marca,
                }}
              />
            </View>
          </Tarjeta>
        ) : null}

        <Tarjeta testID="perfil-web">
          <View style={estilos.bloque}>
            <Texto variante="titulo">{textos.web.titulo}</Texto>
            <Texto variante="detalle" color="textoSecundario">
              {textos.web.ayuda}
            </Texto>
            <Boton
              testID="perfil-web-abrir"
              variante="secundario"
              titulo={textos.web.abrir}
              onPress={() => {
                c._abrirWeb();
              }}
              cargando={c.abriendoWeb}
            />
          </View>
        </Tarjeta>

        <Tarjeta testID="perfil-pin">
          <View style={estilos.bloque}>
            <Texto variante="titulo">{textos.pin.titulo}</Texto>
            <Texto variante="detalle" color="textoSecundario">
              {textos.pin.ayuda}
            </Texto>
            <Campo
              testID="perfil-pin-actual"
              etiqueta={textos.pin.actual}
              valor={c.actual}
              alCambiar={c._cambiarActual}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              autoComplete="off"
              textContentType="password"
            />
            <Campo
              testID="perfil-pin-nuevo"
              etiqueta={textos.pin.nuevo}
              valor={c.nuevo}
              alCambiar={c._cambiarNuevo}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              autoComplete="off"
              textContentType="newPassword"
            />
            <Campo
              testID="perfil-pin-confirmar"
              etiqueta={textos.pin.confirmar}
              valor={c.confirmar}
              alCambiar={c._cambiarConfirmar}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              autoComplete="off"
              textContentType="newPassword"
            />
            {c.error ? (
              <AvisoEnLinea
                testID="perfil-pin-error"
                tono="error"
                titulo={textos.pin.errorTitulo}
                mensaje={c.error}
              />
            ) : null}
            <Boton
              testID="perfil-pin-enviar"
              titulo={textos.pin.cambiar}
              onPress={() => {
                c._cambiarPin();
              }}
              cargando={c.enviando}
            />
          </View>
        </Tarjeta>
      </ScrollView>
    </SafeAreaView>
  );
}
