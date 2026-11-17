/** Mensajes del dominio de sesión: validación, respuestas inesperadas y fallos del teléfono. */
export const mensajesSesion = {
  usuarioVacio: 'Ingresa tu usuario',
  pinInvalido: 'El PIN debe tener 4 dígitos',
  sinToken: 'El servidor todavía no admite la sesión de la App',
  rolDesconocido: 'Tu usuario tiene un rol que la App no reconoce',
  noSeGuardo: 'No se pudo guardar la sesión en este teléfono',
  /** La sesión se cerró o cambió mientras se validaba o renovaba: el resultado se descarta. */
  sesionCambio: 'La sesión cambió mientras se validaba',
  noSeAbrioWhatsApp: 'No se pudo abrir WhatsApp',
  /** Mensaje del enlace de ayuda del PIN: el mismo de la web (P5). */
  ayudaPinWhatsApp:
    "Hi Inglés con Sebas's Team! I've forgotten my PIN, could you pls help me with that?",
} as const;
