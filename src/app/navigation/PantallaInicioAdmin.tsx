import { InicioAdminScreen } from '@/modules/admin/presentation/screens/InicioAdminScreen';
import { useSesionController } from '@/modules/sesion/aplications/controllers/Sesion.controller';

/** Inicio del admin con los datos de la sesión (F1-04, 1.19). */
export function PantallaInicioAdmin() {
  const { usuario, _cerrarSesion } = useSesionController();
  if (!usuario) {
    return null;
  }
  return (
    <InicioAdminScreen
      usuario={{ nombre: usuario.nombre }}
      alCerrarSesion={_cerrarSesion}
    />
  );
}
