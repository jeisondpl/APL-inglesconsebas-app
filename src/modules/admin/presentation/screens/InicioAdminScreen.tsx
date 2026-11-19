import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AvisoEnLinea,
  Boton,
  Insignia,
  Tarjeta,
  Texto,
} from '@/shared/components';
import { fechaCorta } from '@/shared/lib/fechas';
import { PulsoCarga } from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { useInicioAdminController } from '../../aplications/controllers/InicioAdmin.controller';
import type {
  IAlertasAdmin,
  IAsistenciaPendienteProfe,
  SeccionAdmin,
} from '../../domain/admin.dominio';
import { textosAdmin as textos } from '../admin.textos';

export interface IPropsInicioAdminScreen {
  /** Admin de la sesión (lo pasa la composición de `src/app`). */
  usuario: { nombre: string };
  alCerrarSesion: () => Promise<void>;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: tema.colores.fondo },
    contenido: {
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.m,
      paddingBottom: tema.espaciado.xxxl,
      gap: tema.espaciado.l,
    },
    carga: { flex: 1, minHeight: 320 },
    bloque: { gap: tema.espaciado.s },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: tema.espaciado.m,
    },
    nombre: { flex: 1 },
  });

/** Fila «nombre · detalle» de las listas. */
function Fila({
  nombre,
  detalle,
  etiqueta,
  testID,
}: {
  nombre: string;
  detalle: string;
  etiqueta?: string;
  testID?: string;
}) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.fila} testID={testID}>
      <View style={estilos.nombre}>
        <Texto variante="cuerpoFuerte">{nombre}</Texto>
        <Texto variante="detalle" color="textoSecundario">
          {detalle}
        </Texto>
      </View>
      {etiqueta ? <Insignia texto={etiqueta} tono="aviso" /> : null}
    </View>
  );
}

/** Una sección que puede haber fallado: su error y «Reintentar», o su contenido. */
function Seccion<T>({
  titulo,
  seccion,
  alReintentar,
  testID,
  renderContenido,
}: {
  titulo: string;
  seccion: SeccionAdmin<T>;
  alReintentar: () => void;
  testID: string;
  renderContenido: (datos: T) => React.ReactNode;
}) {
  const estilos = useEstilos(crearEstilos);
  return (
    <Tarjeta testID={testID}>
      <View style={estilos.bloque}>
        <Texto variante="titulo" accessibilityRole="header">
          {titulo}
        </Texto>
        {seccion.tipo === 'error' ? (
          <AvisoEnLinea
            tono="error"
            titulo={textos.seccionError}
            mensaje={seccion.msg}
            accion={{ titulo: textos.reintentar, onPress: alReintentar }}
          />
        ) : (
          renderContenido(seccion.datos)
        )}
      </View>
    </Tarjeta>
  );
}

function Alertas({ a }: { a: IAlertasAdmin }) {
  const estilos = useEstilos(crearEstilos);
  const vacio =
    a.pagosPendientes.length +
      a.porVencer.length +
      a.empiezanHoy.length +
      a.flexSinClases.length ===
    0;
  if (vacio) {
    return (
      <Texto color="textoSecundario" testID="admin-alertas-vacio">
        {textos.alertas.nada}
      </Texto>
    );
  }
  return (
    <View style={estilos.bloque}>
      {a.pagosPendientes.length > 0 ? (
        <>
          <Texto variante="etiqueta" color="textoSecundario">
            {textos.alertas.pagos(a.pagosPendientes.length)}
          </Texto>
          {a.pagosPendientes.map(p => (
            <Fila key={p.id} nombre={p.nombre} detalle={p.plan} />
          ))}
        </>
      ) : null}
      {a.porVencer.length > 0 ? (
        <>
          <Texto variante="etiqueta" color="textoSecundario">
            {textos.alertas.porVencer(a.porVencer.length)}
          </Texto>
          {a.porVencer.map(p => (
            <Fila
              key={p.id}
              nombre={p.nombre}
              detalle={`${p.plan} · ${textos.alertas.termina(
                fechaCorta(p.fin),
                p.diasRestantes,
              )}`}
            />
          ))}
        </>
      ) : null}
      {a.empiezanHoy.length > 0 ? (
        <>
          <Texto variante="etiqueta" color="textoSecundario">
            {textos.alertas.empiezanHoy(a.empiezanHoy.length)}
          </Texto>
          {a.empiezanHoy.map(p => (
            <Fila key={p.id} nombre={p.nombre} detalle={p.plan} />
          ))}
        </>
      ) : null}
      {a.flexSinClases.length > 0 ? (
        <>
          <Texto variante="etiqueta" color="textoSecundario">
            {textos.alertas.flex(a.flexSinClases.length)}
          </Texto>
          {a.flexSinClases.map(p => (
            <Fila
              key={p.id}
              nombre={p.nombre}
              detalle={`${p.plan} · ${textos.alertas.usadas(
                p.usadas,
                p.minimo,
              )}`}
            />
          ))}
        </>
      ) : null}
    </View>
  );
}

function Asistencias({ filas }: { filas: IAsistenciaPendienteProfe[] }) {
  const estilos = useEstilos(crearEstilos);
  if (filas.length === 0) {
    return (
      <Texto color="textoSecundario" testID="admin-asistencias-vacio">
        {textos.asistencias.nada}
      </Texto>
    );
  }
  return (
    <View style={estilos.bloque}>
      {filas.map(f => (
        <Fila
          key={f.profe}
          testID={`admin-asistencia-${f.profe}`}
          nombre={f.profe}
          detalle={textos.asistencias.viejas(
            f.viejas,
            fechaCorta(f.masAntigua),
          )}
          etiqueta={textos.asistencias.total(f.total)}
        />
      ))}
    </View>
  );
}

const cuando = (dias: number): string =>
  dias <= 0
    ? textos.cumples.hoy
    : dias === 1
    ? textos.cumples.manana
    : textos.cumples.en(dias);

/**
 * Inicio del admin (F1-04, 1.19): alertas de pagos, ciclos por vencer y Flex agotados, asistencias
 * por marcar por profe y cumpleaños próximos. Cada sección carga por separado. El resto de la
 * gestión del admin sigue en la web.
 */
export function InicioAdminScreen({
  usuario,
  alCerrarSesion,
}: IPropsInicioAdminScreen) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const c = useInicioAdminController();
  const resumen = c.estado.tipo === 'listo' ? c.estado.resumen : null;
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={estilos.pantalla}
      testID="inicio-admin"
    >
      <ScrollView
        testID="admin-lista"
        contentContainerStyle={estilos.contenido}
        refreshControl={
          <RefreshControl
            refreshing={c.refrescando}
            onRefresh={c._refrescar}
            tintColor={tema.colores.marca}
            colors={[tema.colores.marca]}
            progressBackgroundColor={tema.colores.superficie}
          />
        }
      >
        <View>
          <Texto variante="h1" accessibilityRole="header">
            {textos.saludo(usuario.nombre)}
          </Texto>
          <Texto color="textoSecundario">{textos.subtitulo}</Texto>
        </View>

        {c.estado.tipo === 'cargando' ? (
          <View style={estilos.carga}>
            <PulsoCarga etiqueta={textos.cargando} tamano={56} />
          </View>
        ) : null}

        {resumen ? (
          <>
            <Seccion
              testID="admin-alertas"
              titulo={textos.alertas.titulo}
              seccion={resumen.alertas}
              alReintentar={c._cargar}
              renderContenido={a => <Alertas a={a} />}
            />
            <Seccion
              testID="admin-asistencias"
              titulo={textos.asistencias.titulo}
              seccion={resumen.asistencias}
              alReintentar={c._cargar}
              renderContenido={f => <Asistencias filas={f} />}
            />
            <Seccion
              testID="admin-cumples"
              titulo={textos.cumples.titulo}
              seccion={resumen.alertas}
              alReintentar={c._cargar}
              renderContenido={a =>
                a.cumpleanos.length === 0 ? (
                  <Texto color="textoSecundario" testID="admin-cumples-vacio">
                    {textos.cumples.nada}
                  </Texto>
                ) : (
                  <View style={estilos.bloque}>
                    {a.cumpleanos.map(p => (
                      <Fila
                        key={p.id}
                        nombre={p.nombre}
                        detalle={fechaCorta(p.fecha)}
                        etiqueta={cuando(p.dias)}
                      />
                    ))}
                  </View>
                )
              }
            />
          </>
        ) : null}

        <Boton
          testID="admin-cerrar-sesion"
          variante="peligro"
          titulo={textos.cerrarSesion}
          onPress={() => {
            alCerrarSesion();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
