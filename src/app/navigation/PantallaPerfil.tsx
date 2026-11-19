import { useNavigation } from '@react-navigation/native';

import { PerfilScreen } from '@/modules/perfil/presentation/screens/PerfilScreen';
import { useSesionController } from '@/modules/sesion/aplications/controllers/Sesion.controller';

/** Perfil con los datos de la sesión. Solo estudiante y profe llegan aquí (el admin no tiene PIN en la App). */
export function PantallaPerfil() {
  const navegacion = useNavigation();
  const { usuario } = useSesionController();
  if (!usuario || usuario.rol === 'admin') {
    return null;
  }
  return (
    <PerfilScreen
      usuario={{
        nombre: usuario.nombre,
        usuario: usuario.usuario,
        rol: usuario.rol,
      }}
      alVolver={() => navegacion.goBack()}
    />
  );
}
