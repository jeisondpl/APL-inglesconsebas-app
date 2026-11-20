# Guía de uso de la app Inglés con Sebas

Guía por rol para estudiantes, profesoras y administración (ítem F4-02 / 4.7 del contrato).

Los nombres de pestañas, botones y mensajes aparecen tal como los ves en la app, entre «comillas».
Algunos textos cambian según tu caso (fechas, horas, nombres o números); en esos casos verás
la parte variable como _[fecha]_, _[hora]_, _[n]_, etc.

## 1. Primeros pasos

### 1.1 Qué es la app

La app de Inglés con Sebas reúne en tu teléfono tus clases, tareas y mensajes de la academia. Es la
versión móvil de la plataforma web de la academia: usa el mismo usuario, el mismo PIN y los mismos
datos. Lo que todavía no está en la app lo encuentras en la web (ver [Abrir en la web](#43-abrir-en-la-web)).

La app tiene tres modos según tu rol:

- **Estudiante**: cuatro pestañas (Inicio, Clases, Mensajes y Tareas).
- **Profesora**: las mismas cuatro pestañas, con las herramientas de la profe.
- **Administración**: una pantalla de inicio con lo que necesita atención hoy.

### 1.2 Cómo instalarla

**Hoy (fase de pruebas, Android):** la academia te da de alta como tester en Firebase App
Distribution. Recibes un correo de Firebase con un enlace para instalar la app. Ábrelo desde tu
teléfono Android y sigue los pasos. Cuando haya una versión nueva, te llegará otro correo con el
enlace para actualizar.

- Si Android te pide permiso para instalar apps de origen desconocido, acéptalo solo para esa
  instalación. [VERIFICAR: pasos exactos de Firebase App Distribution en el teléfono, que pueden
  incluir instalar la app «App Tester» de Firebase.]
- La versión para iPhone todavía no está disponible.

**Más adelante:** la app se publicará en Google Play y en App Store. Entonces bastará con buscar
«Inglés con Sebas» en la tienda e instalarla. [VERIFICAR: fecha de publicación en tiendas.]

### 1.3 La bienvenida (solo la primera vez)

La primera vez que abres la app, antes de iniciar sesión, verás cuatro páginas de bienvenida:

1. «Tu inglés, en un solo lugar»
2. «Tus clases, bajo control»
3. «Habla con tu profe»
4. «Tareas con feedback real»

Pasa de página con «Siguiente» (o deslizando) y termina con «Comenzar». Si no quieres verla, toca
«Omitir» en cualquier página. Después de terminarla u omitirla no vuelve a aparecer.

### 1.4 Cómo entrar

En la pantalla de inicio de sesión («Hola de nuevo») puedes entrar de dos formas.

**Con usuario y PIN**

1. En «Inicia sesión», escribe tu usuario en el campo «Usuario» y toca «Continuar».
2. En la pantalla «PIN para _[tu usuario]_», escribe tu PIN de 4 dígitos con el teclado de la
   pantalla. Al escribir el cuarto dígito la app lo envía sola. Si te equivocas, usa «Borrar».
3. Si quieres cambiar de usuario, toca «Volver al usuario».

**Código por correo (verificación en dos pasos)**

Si tienes un correo registrado en la academia (estudiantes y profesoras), después del PIN la app te
pide un código:

1. Verás «Revisa tu correo» y el aviso «Te enviamos un código de 6 dígitos a _[tu correo]_».
2. Escribe el código de 6 dígitos con el teclado. Al completar el sexto dígito se envía solo.
3. Si no te llega, espera a que termine la cuenta «Reenviar código en _[n]_ s» y toca «Reenviar
   código». Verás «Te enviamos un código nuevo».
4. Si no lo ves en la bandeja de entrada, revisa la carpeta de spam, como indica la propia pantalla.

Si no tienes correo registrado, entras directamente después del PIN.

**Con Google**

Si el botón «Continuar con Google» aparece debajo del campo de usuario, puedes tocarlo y elegir tu
cuenta de Google. Entras sin PIN y sin código, siempre que ese correo sea el que tienes registrado en
la academia. Mientras tanto verás «Conectando con Google».

[VERIFICAR: el botón de Google solo aparece si la versión instalada lo tiene configurado.]

**Tema claro u oscuro en el inicio de sesión**

En la pantalla de inicio de sesión hay un botón para «Cambiar a tema claro» o «Cambiar a tema
oscuro».

### 1.5 La sesión se queda abierta

No tienes que escribir el PIN cada vez: la sesión queda guardada en el teléfono de forma segura. Si
pasa mucho tiempo, la sesión vence y verás «Tu sesión venció. Vuelve a iniciar sesión.».

## 2. Estudiante

Abajo tienes la barra con cuatro pestañas: «Inicio», «Clases», «Mensajes» y «Tareas». La pestaña
«Mensajes» muestra un número cuando tienes mensajes sin leer. La barra se esconde al desplazarte
hacia abajo y vuelve a aparecer al cambiar de pestaña.

### 2.1 Inicio

Arriba ves «Hola, _[tu nombre]_» y, debajo, tu plan y las fechas de tu ciclo (por ejemplo «Plan
Progress · ciclo 15 sep – 14 oct»). Para actualizar, desliza la pantalla hacia abajo.

Las tarjetas del inicio son:

- **«Próxima clase»**: cuándo es tu próxima clase («Hoy», «Mañana» o la fecha, con la hora), con qué
  profe, cuánto dura y si es «por Zoom». Una cuenta atrás te dice cuánto falta («En _[n]_ min», «En
  _[n]_ h», «En _[n]_ días» o «Ahora»). Si la clase se movió, verás «Reagendada».
  - «Ir a mi clase» abre el enlace de Zoom de tu clase.
  - Si no hay enlace, verás «¿No encuentras el link de tu clase? Escríbele a tu profe.».
  - «Reagendar» te lleva a la pestaña «Clases», donde puedes cancelar o reagendar (sección 2.2).
  - Si no tienes clases, verás «Aún no tienes clases programadas».
- **«Ciclo»**: cuántas clases llevas («_[n]_ de _[total]_ clases»).
- **«Cancelaciones»**: cuántas te quedan («_[n]_ de _[máximo]_») y con cuánta antelación tienes que
  avisar («Avisa con _[horas]_ h de antelación»). Si tu plan no las incluye, verás «Tu plan no
  incluye cancelaciones».
- **«Tareas pendientes»**: cuántas tienes «por entregar» y cuándo vencen («Vence hoy», «Vence
  _[fecha]_» o «Venció _[fecha]_»). Al tocarla vas a la pestaña «Tareas».
- **«Mensajes»**: el último mensaje y cuántos tienes sin leer. Al tocarla vas a la pestaña
  «Mensajes».

Si una tarjeta no carga, verás «No pudimos cargar esta sección» con el botón «Reintentar». Las demás
siguen funcionando.

**Menú de tu cuenta:** toca tu avatar arriba («Abrir el menú de tu cuenta») para ver «Tu cuenta»,
con «Mi perfil» y «Cerrar sesión».

### 2.2 Clases

Aquí ves todas las clases de tu ciclo con su estado.

**Moverte entre ciclos.** Arriba aparece «Ciclo actual» con sus fechas. Usa las flechas para «Ver el
ciclo anterior» o «Ver el ciclo siguiente».

**Resumen del ciclo.** Cuatro contadores: «Tomadas», «Programadas», «Por reagendar» y «Canceladas».

**Lista de clases.** Cada clase muestra día, hora, número de clase, profe y su estado. La siguiente
que tienes está marcada como «Próxima» y, si tiene enlace, trae el botón «Ir a mi clase». Los estados
que puedes ver son:

| Estado en la app            | Qué significa                                                     |
| --------------------------- | ----------------------------------------------------------------- |
| «Programada»                | La clase está agendada.                                           |
| «Tomada»                    | La clase se dio.                                                  |
| «No asististe»              | No te conectaste a la clase.                                      |
| «Cancelada»                 | La cancelaste.                                                    |
| «Cancelada tarde»           | La cancelaste con poca antelación.                                |
| «Cancelada sin cupo»        | La cancelaste sin cancelaciones disponibles.                      |
| «Por reagendar»             | Tienes que escoger un nuevo espacio para ella.                    |
| «Festivo»                   | Coincidió con un festivo.                                         |
| «Festivo · por reagendar»   | Coincidió con un festivo y hay que escoger otro espacio.          |
| «Por reponer»               | Clase pendiente de reponer.                                       |
| «Reagendada»                | Se movió a otra fecha (verás «antes _[fecha original]_»).         |
| «Reagendada · tomada»       | Se movió y se dio.                                                |
| «Reagendada · no asististe» | Se movió y no te conectaste.                                      |
| «Reagendada · cancelada»    | Se movió y después se canceló.                                    |
| «Excepción médica»          | La academia la registró como excepción médica.                    |
| «Vencida»                   | Pasó el plazo de la clase.                                        |

[VERIFICAR: la columna «Qué significa» es una explicación para la guía; la app solo muestra la
etiqueta.]

#### Cancelar una clase

El botón «Cancelar clase» aparece en las clases programadas que todavía no han empezado.

1. Toca «Cancelar clase». La app muestra «Revisando tu clase» y consulta con la academia qué pasaría.
2. Se abre una hoja que te explica exactamente qué pasará en tu caso. Lee el texto antes de
   confirmar.
3. Confirma con el botón de la hoja (por ejemplo «Sí, cancelar») o toca «Volver» para no hacer nada.

Lo que te dice la hoja depende de tu plan y de la antelación. Estos son los casos que la app conoce:

- **Plan Flex, con más de 24 horas — «Liberar tu clase».** Recuperas el cupo y después puedes
  agendar otra desde «Agendar una clase», en Clases. Botón: «Sí, liberar la clase».
- **Plan Flex, con menos de 24 horas — «Cancelación con menos de 24 horas».** La clase se descuenta
  de tu plan y no podrás agendar otra en su lugar. Botón: «Sí, cancelar».
- **Plan Power, con menos de 12 horas — «Cancelación tardía».** La clase queda registrada como
  tomada y puede usarse 1 cancelación. Botón: «Sí, cancelar».
- **Plan Power, con tiempo — «¿Qué quieres hacer con esta clase?».** Se usa 1 cancelación de tu plan
  Power en cualquiera de las dos opciones.
- **Clase que no afecta tu mínimo — «¿Qué quieres hacer con esta clase?».** Aunque la canceles, tu
  ciclo queda completo. Puedes soltarla, o moverla gastando 1 token.
- **Clase que te dejaría por debajo del mínimo — «Cancelar y reagendar».** Se usa 1 token y tienes 1
  mes desde la fecha original para escoger un nuevo espacio, en Clases, con «Escoger nuevo espacio».
  Botón: «Sí, cancelar y reagendar».
- **Sin tokens — «Sin cancelaciones disponibles».** Ya usaste todos tus tokens de movimiento del
  ciclo: la clase no se puede reagendar y, si la cancelas, queda como tomada. Los tokens se
  restablecen al inicio de tu próximo ciclo. Botón: «Sí, cancelar de todas formas».
- **Clase ya reagendada — «¿Cancelar la clase reagendada?».** Si la cancelas, cuenta como tomada y
  no podrás moverla de nuevo.

Cuando la hoja te deja elegir, verás dos opciones:

- «Reagendar después»: «Gasta 1 token y tienes 1 mes para escoger otro espacio.»
- «Soltarla»: según el caso, «Gasta 1 cancelación y no se recupera.» o «No gasta tokens.»

Si estás en una clase de grupo, verás además «Estás en grupo: esta cancelación también afecta a tu
compañero.».

Al terminar verás uno de estos avisos: «Clase cancelada», «Clase cancelada · cuenta como tomada» o
«Clase cancelada · tienes 1 mes para reagendarla».

**Cuándo no se puede cancelar** («No se puede cancelar»):

- «Esta clase ya empezó, así que ya no se puede cancelar ni mover.»
- «Esta clase es de un ciclo que todavía no empieza.»
- «Esta clase ya no se puede cancelar.»

Las reglas de antelación (24 horas en Flex, 12 horas en el resto de planes) y el número de
cancelaciones las decide la academia; la app solo te muestra el resultado antes de confirmar.

#### Escoger un nuevo espacio (clases «Por reagendar»)

1. En una clase «Por reagendar», toca «Escoger nuevo espacio».
2. Se abre «Escoge tu nuevo espacio» con el plazo («Tienes hasta el _[fecha]_ para escoger.») y la
   regla: «Cada clase solo se puede reagendar una vez. El espacio debe empezar con al menos _[n]_
   horas de anticipación.».
3. Los espacios aparecen por día; los de tu profe salen primero, marcados como «Tu profe».
4. Toca un espacio y luego «Confirmar este espacio». Verás «Clase reagendada».

Si no hay espacios: «Ahora mismo no hay espacios disponibles. Intenta de nuevo más tarde.».

Cuándo no se puede («No se puede reagendar»):

- «El plazo para reagendar esta clase ya venció.»
- «Esta clase es de un grupo: por ahora reagéndala desde la web.»
- «Esta clase no está pendiente de reagendar.»

#### Agendar una clase (solo plan Flex)

Si tu plan es Flex, en Clases aparece la tarjeta «Agendar una clase», que te dice cuántas te quedan
(«Puedes agendar _[n]_ clases más en este ciclo.») y cuándo termina el ciclo («Tu ciclo termina en
_[n]_ días: las clases que no agendes se pierden.»).

1. Toca «Agendar una clase». La app muestra «Buscando espacios».
2. En «Escoge un espacio» verás hasta cuándo puedes agendar y la regla: «El espacio debe empezar con
   al menos _[n]_ horas de anticipación. Puedes cancelar con 24 horas o más y recuperas el cupo.».
3. Toca un espacio y luego «Agendar este espacio». Verás «Clase agendada».

Cuándo no puedes agendar («No puedes agendar ahora»):

- «Tienes un pago pendiente. Regulariza tu pago para agendar nuevas clases.»
- «Ya agendaste todas las clases de tu plan en este ciclo.»
- «No hay un ciclo activo para agendar. Escríbele a Sebas.»

### 2.3 Mensajes

Es el chat con tu profe (la pantalla se llama «Tu profe»).

- **Escribir:** escribe en «Escribe un mensaje…» y toca «Enviar mensaje».
- **Foto:** toca «Adjuntar una foto» y elige «Elegir de la galería» o «Tomar una foto».
- **Nota de voz:** toca «Grabar una nota de voz»; mientras grabas verás «Grabando». Puedes «Cancelar
  la grabación» o «Enviar la nota de voz». La primera vez el teléfono te pedirá permiso para usar el
  micrófono.
- **Reaccionar:** mantén pulsado un mensaje para elegir una reacción.
- **Estado de tus mensajes:** «Enviando…», «Enviado», «Visto» o «No se envió». Si uno falla, toca
  «Reintentar» o «Descartar».
- **Fotos y notas recibidas:** toca la foto para abrirla; usa «Reproducir la nota de voz» para
  escuchar una nota.

Si todavía no hay mensajes: «Todavía no hay mensajes. Escríbele a tu profe para empezar.».

### 2.4 Tareas

La pestaña «Tareas» («Lo que te dejó tu profe») tiene tres secciones: «Pendientes», «Por revisar» y
«Revisadas». Cada tarea muestra su fecha («Entrega: _[fecha]_» o «Sin fecha de entrega») y su estado
(«Pendiente», «Vencida», «En revisión», «Revisada», «Nota _[nota]_» o «Feedback nuevo»).

**Entregar una tarea:**

1. Toca la tarea. Verás la «Consigna» (las instrucciones de tu profe).
2. En «Tu respuesta», escribe en «Escribe aquí tu respuesta» o graba un audio con «Grabar audio»
   (puedes «Terminar grabación», «Cancelar grabación» o «Quitar audio»).
3. Toca «Enviar entrega». Verás «Entrega enviada».
4. «Puedes cambiar tu entrega hasta que tu profe la revise.»: usa «Enviar de nuevo».

**Ver el feedback:** cuando tu profe revisa la tarea, pasa a «Revisadas» y en «Feedback» ves su
comentario, la nota y, si la dejó, una nota de voz.

Si la tarea trae PDF, verás «1 PDF adjunto: ábrelo desde la web.»; los PDF se abren desde la web,
no desde la app.

## 3. Profesora

Tienes las mismas cuatro pestañas: «Inicio», «Clases», «Mensajes» y «Tareas».

### 3.1 Inicio

Arriba verás tu nombre y «Profe · _[fecha de hoy]_». Desliza hacia abajo para actualizar.

- **Clase destacada:** «Clase en curso» o «Tu siguiente clase», con el botón «Abrir Zoom». Si no
  tiene enlace: «Esta clase no tiene enlace de Zoom en Leap.».
- **«Clases de hoy»:** la lista del día con hora, estudiante, número de clase y estado («Próxima», «En
  curso», «Sin marcar», «Realizada» o «No asistió»). Si no hay: «Hoy no tienes clases programadas.».
- **«Asistencias por marcar»:** las clases que te faltan por marcar. El botón «Marcar» te lleva a la
  pestaña «Clases» para hacerlo. Si estás al día: «Tienes todas las asistencias al día.».
- **«Tareas por revisar»:** entregas que esperan tu feedback. Al tocar una vas a «Tareas».
- **«Mensajes»:** cuántos mensajes tienes sin leer, con «Ir a mensajes».

Desde tu avatar abres el menú de la cuenta, con «Mi perfil» y «Cerrar sesión».

### 3.2 Clases (tu agenda)

- **Vista:** elige «Día» o «Semana». Usa las flechas para ir al día o a la semana anterior o
  siguiente, y «Hoy» para volver a hoy.
- **Vista de día:** cada clase con hora, estudiante, número y estado («Próxima», «En curso», «Sin
  marcar», «Realizada» o «No asistió»), y el botón «Abrir Zoom» cuando hay enlace.
- **Vista de semana:** cada día con su número de clases y cuántas están «sin marcar». Toca un día
  para verlo («Ver este día»).
- **«Clases anteriores sin marcar»:** las clases de los últimos 30 días que siguen sin marcar.

#### Marcar la asistencia

Los botones aparecen en las clases programadas que ya empezaron.

1. Toca «Realizada» o «No asistió».
2. Se abre una hoja de confirmación: «¿La clase se realizó?» o «¿El estudiante no asistió?». Si
   marcas «No asistió», la hoja te recuerda que «La clase cuenta como tomada».
3. Confirma con «Sí, realizada» o «Sí, no asistió», o toca «Volver».
4. Verás «Clase marcada como realizada» o «Marcada como «No asistió»».

Importante: «Una vez marcada no se puede cambiar desde la App: si hubo un error, lo corrige la
administración.».

### 3.3 Mensajes

Ves la bandeja «Tus estudiantes», con el último mensaje de cada chat y cuántos mensajes sin leer
tiene. Toca un estudiante para abrir el chat («Volver a la bandeja» para regresar). Dentro del chat
funciona igual que para el estudiante (sección 2.3): texto, fotos, notas de voz, reacciones y
estados de envío.

Si no tienes estudiantes asignados: «Todavía no tienes estudiantes asignados.».

### 3.4 Tareas

La pestaña «Tareas» («Entregas de tus estudiantes») tiene «Pendientes», «Por revisar» y «Revisadas».

**Dejar feedback:**

1. Toca una entrega de «Por revisar». Verás la consigna y la «Entrega de _[estudiante]_».
2. Escribe un «Comentario» («Escribe tu feedback»), una «Nota» (por ejemplo «Ej. 9 o A+») y, si
   quieres, graba un audio con «Grabar audio».
3. Toca «Enviar feedback». Verás «Feedback enviado».

Tienes que poner al menos uno de los tres: «Escribe un comentario, una nota o graba un audio.».

Crear o asignar tareas nuevas se hace desde la web; en la app la profe revisa y da feedback.

## 4. Para todos: perfil, avisos, sin conexión y cierre de sesión

### 4.1 Tu perfil

Estudiantes y profesoras abren el perfil desde el avatar del inicio → «Mi perfil». La pantalla «Tu
perfil» muestra tu nombre, tu rol («Estudiante» o «Profe») y tu usuario. Para salir, toca «Volver al
inicio».

La administración no tiene pantalla de perfil en la app (ver sección 5).

**Tema de la app.** En «Tema de la app» elige «Sistema» (sigue el tema de tu teléfono), «Claro» u
«Oscuro». La app recuerda tu elección.

**Desbloqueo con huella o rostro.** Solo aparece si tu teléfono tiene huella o rostro configurados.
Activa «Activar el desbloqueo con huella o rostro». A partir de ahí, «Al abrir la app, o si pasa un
minuto en segundo plano, te pedimos tu huella o rostro.». Verás la pantalla «App bloqueada» con
«Desbloquear»; si no puedes verificarte, puedes tocar «Cerrar sesión» y entrar de nuevo con tu
usuario y PIN.

**Cambiar PIN.**

1. En «Cambiar PIN», escribe tu «PIN actual», el «PIN nuevo» y «Repite el PIN nuevo».
2. Toca «Cambiar PIN». Verás «PIN cambiado».
3. «Tus otros dispositivos tendrán que iniciar sesión de nuevo.»

Mensajes que puedes ver: «Escribe tu PIN actual (4 dígitos).», «El PIN nuevo debe tener 4
dígitos.», «El PIN nuevo debe ser distinto al actual.», «La confirmación no coincide con el PIN
nuevo.».

### 4.2 Notificaciones

La primera vez que entras como estudiante o profesora, la app te pide permiso para enviarte
notificaciones (en Android 13 o superior lo pide el sistema). Acéptalo para recibir:

- recordatorios de tus clases, 24 horas y 1 hora antes;
- el aviso de que un reagendamiento quedó confirmado;
- el aviso de cambio de profe, cuando una clase se reagenda con otra profesora.

Al tocar una notificación de clase, la app se abre en la pestaña «Clases». Si tienes la app abierta,
no verás la notificación del sistema: la pantalla se actualiza sola. Los recordatorios pueden llegar
con hasta 15 minutos de diferencia.

También llegan avisos de **mensaje nuevo** en el chat, **tarea nueva**, **tarea entregada** (a la profe)
y **feedback de una tarea** (al estudiante). Al tocarlos, la app abre «Mensajes» o «Tareas».

La administración no recibe notificaciones en la app.

### 4.3 Abrir en la web

En el perfil, «Más funciones en la web» → «Abrir en la web». «Lo que aún no está en la App lo
encuentras en la web. Se abre con tu sesión, sin escribir el PIN.». Si falla, verás «No pudimos abrir
la web» o «No encontramos un navegador para abrir la web.».

### 4.4 Uso sin conexión

Si te quedas sin internet, arriba aparece una franja:

- «Sin conexión · viendo lo último que guardamos»: ves la última información que la app cargó en tu
  teléfono (clases, tareas, mensajes, inicio).
- «Sin conexión · revisa tu internet»: no hay nada guardado para esa pantalla.

Sin conexión puedes consultar, pero no puedes hacer cambios: cancelar, reagendar, agendar, enviar
mensajes, entregar tareas o marcar asistencias necesitan internet y mostrarán su mensaje de error. La
franja desaparece sola en cuanto vuelve la conexión.

Lo guardado es solo tuyo y se borra al cerrar sesión.

### 4.5 Cerrar sesión

- Estudiante y profesora: avatar del inicio → «Cerrar sesión».
- Administración: botón «Cerrar sesión» en su pantalla de inicio.

Al cerrar sesión, la app olvida tu sesión, la información guardada y la cuenta de Google si entraste
con ella, y deja de enviarte notificaciones en ese teléfono.

## 5. Administración

La administración entra con su usuario y PIN (sección 1.4). En la app tiene una única pantalla de
consulta: «Hola, _[nombre]_» · «Lo que hoy necesita tu atención». Desliza hacia abajo para
actualizar.

- **«Alertas»:** «Pagos pendientes», «Ciclos por vencer», «Ciclos que empiezan hoy» y «Flex sin
  clases por agendar», cada una con su número y el detalle de cada estudiante (por ejemplo «termina
  _[fecha]_ · _[n]_ d» o «_[n]_ de _[mínimo]_ clases»). Si no hay nada: «Nada pendiente por ahora.».
- **«Asistencias por marcar»:** cuántas clases tiene sin marcar cada profesora y cuántas son «de hace
  más de 2 días». Si todas están al día: «Todas las profes están al día.».
- **«Cumpleaños»:** los cumpleaños de los próximos 14 días («¡Hoy!», «Mañana» o «En _[n]_ días»).
  Si no hay: «Sin cumpleaños en los próximos 14 días.».
- **«Cerrar sesión»**.

Todo lo demás (corregir asistencias, gestionar estudiantes, pagos, ciclos, PIN de los usuarios,
etc.) se sigue haciendo desde la web de la academia.

## 6. Preguntas frecuentes y problemas comunes

**Olvidé mi PIN.** En la pantalla del PIN toca «¿Olvidaste tu PIN? Escríbenos por WhatsApp». Se abre
WhatsApp con un mensaje listo para la academia. Si no se abre, verás «No se pudo abrir WhatsApp»:
contacta a la academia por otro medio.

**Me sale «Usuario o PIN incorrecto».** Revisa el usuario (sin espacios) y vuelve a escribir el PIN.
Si fallas varias veces seguidas verás «Demasiados intentos fallidos. Intenta de nuevo en _[n]_
minutos.»: espera ese tiempo antes de volver a intentarlo.

**Me sale «Ingresa tu usuario» o «El PIN debe tener 4 dígitos».** Falta el usuario o el PIN no tiene
4 dígitos.

**No me llega el código por correo.**

1. Revisa la carpeta de spam.
2. Espera a que termine la cuenta atrás y toca «Reenviar código».
3. Comprueba que el correo que muestra la pantalla es el tuyo. Si no lo es, o no te llega nada,
   contacta a la academia para que revise tu correo registrado.

**El código no funciona o «venció».** El código tiene 6 dígitos («El código tiene 6 dígitos»). Si
pasó mucho tiempo o lo intentaste varias veces, la app te devuelve al usuario: vuelve a entrar y usa
el código nuevo. Los mensajes que puedes ver son «Código incorrecto. Te quedan _[n]_ intentos.», «El
código venció. Vuelve a iniciar sesión.», «El código ya se usó. Vuelve a iniciar sesión.» y «Demasiados
intentos. Vuelve a iniciar sesión.».

**Google no me deja entrar.** Solo funciona con el correo que tienes registrado en la academia. Si
usas otro, verás «Tu correo _[correo]_ no está registrado en la academia. Entra con tu usuario y PIN o
pide que lo registren.».

**Me sale «Tu sesión venció. Vuelve a iniciar sesión.».** Entra otra vez con tu usuario y PIN. Pasa
también en tus otros teléfonos cuando cambias el PIN.

**Me sale «El servidor todavía no admite la sesión de la App» o «Tu usuario tiene un rol que la App
no reconoce».** No es un fallo tuyo: avisa a la academia.

**«No se pudo guardar la sesión en este teléfono».** Vuelve a intentarlo; si sigue, reinicia el
teléfono y avisa a la academia.

**No se abre mi clase de Zoom.** Verás «No se pudo abrir el enlace de tu clase» y «Revisa que tengas
Zoom o un navegador, o escríbele a tu profe.». Instala Zoom o un navegador, o pide el enlace a tu
profe por «Mensajes».

**No puedo enviar notas de voz o grabar audio.** Verás «Para enviar notas de voz, permite el
micrófono en los ajustes.» (o «Para grabar, permite el micrófono en los ajustes.» en Tareas). Ve a
los ajustes del teléfono → Aplicaciones → Inglés con Sebas → Permisos y activa el micrófono. Si la
grabación es muy corta: «Mantén la grabación un poco más para enviarla.»; si es muy larga: «La nota
de voz es demasiado larga para enviarla.».

**No puedo enviar una foto.** Si es muy pesada verás «La foto es demasiado grande para enviarla.».
Prueba con otra foto o tómala de nuevo con la cámara.

**Un mensaje dice «No se envió».** Revisa tu conexión y toca «Reintentar», o «Descartar» si ya no
quieres enviarlo.

**Una pantalla dice «No pudimos cargar…».** Toca «Reintentar». Si estás sin internet, verás la
franja «Sin conexión».

**La app muestra «Algo salió mal».** Toca «Reintentar». Si el problema sigue, cierra y vuelve a
abrir la app.

**No me aparece «Agendar una clase».** Solo aparece en los planes Flex.

**La huella o el rostro no funcionan.** En «App bloqueada» toca «Desbloquear» para intentarlo otra
vez, o «Cerrar sesión» para entrar con usuario y PIN. Si al activarlo ves «Este equipo no tiene
huella ni rostro configurados.», configúralos primero en los ajustes del teléfono.

**Profe: marqué mal una asistencia.** No se puede cambiar desde la app. Escribe a la administración
para que la corrija desde la web.

**No me llegan las notificaciones.** Revisa en los ajustes del teléfono que las notificaciones de
Inglés con Sebas estén permitidas. Cerrar sesión y volver a entrar registra de nuevo el teléfono.
