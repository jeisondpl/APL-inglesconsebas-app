import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AvisoEnLinea,
  Boton,
  Campo,
  Cargando,
  Insignia,
  LogoMarca,
  Marca,
  Pantalla,
  Tarjeta,
  Texto,
  type TonoInsignia,
} from '@/shared/components';
import { notify, type TipoAviso } from '@/shared/lib/notify';
import {
  useEstilos,
  useTema,
  type IColoresTema,
  type ITema,
  type PreferenciaTema,
  type VarianteTexto,
} from '@/shared/theme';

import { textosEscaparate as textos } from './escaparate.textos';

const PREFERENCIAS: PreferenciaTema[] = ['sistema', 'claro', 'oscuro'];
const VARIANTES: VarianteTexto[] = [
  'h1',
  'h2',
  'titulo',
  'subtitulo',
  'cuerpo',
  'cuerpoFuerte',
  'boton',
  'detalle',
  'etiqueta',
  'insignia',
];
const TONOS: TonoInsignia[] = [
  'exito',
  'aviso',
  'peligro',
  'neutra',
  'contador',
];
const TIPOS_NOTIFY: TipoAviso[] = ['success', 'error', 'warning', 'info'];

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    contenido: { gap: tema.espaciado.xxl },
    seccion: { gap: tema.espaciado.m },
    fila: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tema.espaciado.s,
      alignItems: 'center',
    },
    selector: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: tema.colores.borde,
      borderRadius: tema.radios.boton,
      padding: tema.espaciado.xs,
      gap: tema.espaciado.xs,
    },
    opcion: {
      flex: 1,
      minHeight: tema.toqueMinimo,
      borderRadius: tema.radios.icono,
      alignItems: 'center',
      justifyContent: 'center',
    },
    opcionActiva: { backgroundColor: tema.colores.marca },
    muestra: { width: 150, gap: 4 },
    color: {
      height: 40,
      borderRadius: tema.radios.icono,
      borderWidth: 1,
      borderColor: tema.colores.borde,
    },
  });

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.seccion}>
      <Texto
        variante="etiqueta"
        color="textoSecundario"
        accessibilityRole="header"
      >
        {titulo}
      </Texto>
      {children}
    </View>
  );
}

/**
 * Escaparate del sistema de diseño (CA12). Se abre desde el inicio provisional; cuando exista la
 * sesión, solo se mostrará en __DEV__.
 */
export function SistemaDisenoScreen() {
  const { tema, preferencia, establecerPreferencia } = useTema();
  const estilos = useEstilos(crearEstilos);
  const [usuario, setUsuario] = useState<string>(textos.campos.usuarioEjemplo);
  const [pin, setPin] = useState('12');
  const [pulsaciones, setPulsaciones] = useState(0);

  return (
    <Pantalla
      desplazable
      bordes={['bottom', 'left', 'right']}
      style={estilos.contenido}
    >
      <Texto color="textoSecundario">{textos.introduccion}</Texto>

      <Seccion titulo={textos.secciones.tema}>
        <View style={estilos.selector} accessibilityRole="radiogroup">
          {PREFERENCIAS.map(opcion => {
            const activa = preferencia === opcion;
            return (
              <Pressable
                key={opcion}
                accessibilityRole="radio"
                accessibilityLabel={textos.temas[opcion]}
                accessibilityState={{ checked: activa }}
                onPress={() => establecerPreferencia(opcion)}
                style={[estilos.opcion, activa && estilos.opcionActiva]}
              >
                <Texto variante="boton" color={activa ? 'sobreMarca' : 'texto'}>
                  {textos.temas[opcion]}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      </Seccion>

      <Seccion titulo={textos.secciones.paleta}>
        <View style={estilos.fila}>
          {(Object.keys(tema.colores) as (keyof IColoresTema)[]).map(clave => (
            <View key={clave} style={estilos.muestra}>
              <View
                style={[
                  estilos.color,
                  { backgroundColor: tema.colores[clave] },
                ]}
              />
              <Texto variante="cuerpoFuerte">{clave}</Texto>
              <Texto variante="detalle" color="textoSecundario">
                {tema.colores[clave]}
              </Texto>
            </View>
          ))}
        </View>
      </Seccion>

      <Seccion titulo={textos.secciones.tipografia}>
        {VARIANTES.map(variante => (
          <View key={variante}>
            <Texto variante="detalle" color="textoTenue">
              {`${variante} · ${tema.tipografia[variante].fontFamily} ${tema.tipografia[variante].fontSize}`}
            </Texto>
            <Texto variante={variante}>{textos.ejemploTexto}</Texto>
          </View>
        ))}
      </Seccion>

      <Seccion titulo={textos.secciones.botones}>
        <Boton titulo={textos.botones.primario} onPress={() => {}} />
        <Boton
          variante="secundario"
          titulo={textos.botones.secundario}
          onPress={() => {}}
        />
        <Boton
          variante="peligro"
          titulo={textos.botones.peligro}
          onPress={() => {}}
        />
        <Boton
          deshabilitado
          titulo={textos.botones.deshabilitado}
          onPress={() => {}}
        />
        <Boton cargando titulo={textos.botones.cargando} onPress={() => {}} />
      </Seccion>

      <Seccion titulo={textos.secciones.campos}>
        <Campo
          etiqueta={textos.campos.usuario}
          valor={usuario}
          alCambiar={setUsuario}
        />
        <Campo
          etiqueta={textos.campos.pin}
          valor={pin}
          alCambiar={setPin}
          keyboardType="number-pad"
          secureTextEntry
          error={pin.length === 4 ? undefined : textos.campos.errorPin}
        />
      </Seccion>

      <Seccion titulo={textos.secciones.tarjetas}>
        <Tarjeta variante="destacada">
          <Texto variante="etiqueta" color="marca">
            {textos.tarjetas.etiquetaDestacada}
          </Texto>
          <Texto variante="subtitulo">{textos.tarjetas.destacada}</Texto>
        </Tarjeta>
        <Tarjeta>
          <Texto variante="etiqueta" color="textoSecundario">
            {textos.tarjetas.normalTitulo}
          </Texto>
          <Texto>{textos.tarjetas.normal}</Texto>
        </Tarjeta>
        <Tarjeta
          accessibilityLabel={textos.tarjetas.pulsable}
          onPress={() => setPulsaciones(n => n + 1)}
        >
          <Texto>
            {pulsaciones > 0
              ? `${textos.tarjetas.pulsada} (${pulsaciones})`
              : textos.tarjetas.pulsable}
          </Texto>
        </Tarjeta>
      </Seccion>

      <Seccion titulo={textos.secciones.insignias}>
        <View style={estilos.fila}>
          {TONOS.map(tono => (
            <Insignia key={tono} tono={tono} texto={textos.insignias[tono]} />
          ))}
        </View>
      </Seccion>

      <Seccion titulo={textos.secciones.avisos}>
        <AvisoEnLinea
          tono="error"
          titulo={textos.avisos.errorTitulo}
          mensaje={textos.avisos.errorMensaje}
          accion={{ titulo: textos.avisos.reintentar, onPress: () => {} }}
        />
        <AvisoEnLinea
          tono="aviso"
          titulo={textos.avisos.infoTitulo}
          mensaje={textos.avisos.infoMensaje}
        />
      </Seccion>

      <Seccion titulo={textos.secciones.carga}>
        <Cargando texto={textos.carga} />
      </Seccion>

      <Seccion titulo={textos.secciones.logo}>
        <View style={estilos.fila}>
          <LogoMarca tamano={86} etiqueta={textos.logoEtiqueta} />
          <LogoMarca tamano={48} />
          <LogoMarca tamano={26} />
        </View>
        <Marca />
        <Marca disposicion="horizontal" />
      </Seccion>

      <Seccion titulo={textos.secciones.notificaciones}>
        {TIPOS_NOTIFY.map(tipo => (
          <Boton
            key={tipo}
            variante="secundario"
            titulo={textos.notificaciones[tipo]}
            onPress={() =>
              notify[tipo](
                textos.notificaciones[tipo],
                textos.notificaciones.detalle,
              )
            }
          />
        ))}
      </Seccion>
    </Pantalla>
  );
}
