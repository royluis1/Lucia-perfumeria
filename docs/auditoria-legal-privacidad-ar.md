# Auditoría legal, privacidad y UX — Lucía Perfumería

Fecha: 19 de octubre de 2026  
Ámbito: República Argentina  
Estado: borrador de implementación; requiere completar los campos entre corchetes y revisión profesional antes de publicar.

## 1. Hallazgos de la auditoría técnica

### Datos y formularios

| Flujo | Datos actuales | Evaluación | Acción requerida |
| --- | --- | --- | --- |
| Registro de cuenta (API) | email, contraseña, nombre y teléfono opcional | Adecuado si el teléfono permanece opcional. | Informar finalidad, responsable y derechos antes del envío. Incorporar aceptación expresa de Términos y Política de Privacidad sin marcar por defecto. |
| Inicio de sesión | email y contraseña | Necesarios para autenticar. | No pedir ningún dato adicional. |
| Compra/envío | destinatario, calle, ciudad, código postal, provincia opcional y teléfono opcional | Dirección y destinatario son necesarios para entregar. Teléfono sólo debe pedirse si es realmente necesario para la coordinación logística. | Informar que se usa para gestionar, entregar y postventa de la orden. Registrar la aceptación de Términos y Política al confirmar. |
| Newsletter (inicio y pie) | email | El formulario no tiene integración activa, pero carece de consentimiento. | No activar envíos hasta incorporar casilla opcional, no premarcada, con consentimiento separado para novedades. |
| Búsqueda del catálogo | término de búsqueda | No se persiste según el código revisado. | No usar para perfiles publicitarios sin consentimiento. |

No se detectaron campos que soliciten DNI, datos bancarios, salud, creencias, orientación sexual u otros datos sensibles. No se deben incorporar tales campos salvo habilitación legal y análisis específico.

### Terceros y analítica

| Componente | Estado que surge del repositorio | Condición de uso |
| --- | --- | --- |
| Google Analytics / Google Tag Manager | No detectado. | No instalar ni cargar antes del consentimiento opcional de analítica. |
| Meta Pixel | No detectado. | Igual criterio: bloqueo previo y consentimiento específico, revocable. |
| Mercado Pago | Sólo existe una variable de entorno y un flujo sandbox local; no hay SDK, checkout ni webhook de proveedor. | Antes de activarlo, revisar contrato/DPA vigente, informar la comunicación necesaria para el cobro y verificar que no se almacenen datos de tarjeta en Lucía Perfumería. |
| Email marketing / Gmail / proveedor SMTP | No hay integración productiva. MailHog es sólo un buzón local de desarrollo. | Antes de activarlo, contratar un proveedor con tratamiento por cuenta e instrucciones documentadas; obtener consentimiento separado para marketing y ofrecer baja simple en cada envío. |
| Chat, soporte, mapas, redes, Sentry/Hotjar/Clarity | No detectados. | Inventariar y evaluar antes de incorporar. Ningún tercero puede usar los datos para una finalidad propia no informada. |
| PostgreSQL y Redis | Infraestructura propia/local. | Mantener acceso restringido, credenciales únicas, cifrado en tránsito y controles de acceso. |

### Brechas que impiden afirmar cumplimiento total hoy

1. Faltan razón social o nombre completo, CUIT, domicilio legal, email de privacidad y canal de atención. No deben inventarse.
2. No existen páginas publicadas de privacidad, términos, cookies ni devoluciones.
3. El enlace actual de “Botón de arrepentimiento” no funciona y no hay flujo que entregue un código de solicitud.
4. El newsletter no posee consentimiento ni mecanismo de baja; debe permanecer inactivo.
5. No hay evidencia de inscripción de las bases aplicables ante el Registro Nacional de Bases de Datos Personales ni de contratos con encargados de tratamiento.
6. No hay mecanismo implementado para responder solicitudes de acceso, rectificación, actualización o supresión en plazo.
7. El checkout no deja constancia de aceptación de Términos/Privacidad ni informa el derecho de revocación en el momento de contratar.

## 2. Textos listos para publicar

Reemplazar todos los campos entre corchetes antes de publicar. “Lucía Perfumería” debe reemplazarse por la denominación exacta del titular si fuera distinta.

### Política de Privacidad

**Responsable.** [RAZÓN SOCIAL O NOMBRE COMPLETO], CUIT [CUIT], con domicilio legal en [DOMICILIO LEGAL COMPLETO] (“Lucía Perfumería”, “nosotros”), es responsable de la base de datos y del tratamiento de los datos personales recabados a través de [DOMINIO]. Contacto de privacidad: [EMAIL DE PRIVACIDAD].

**Datos que tratamos.** Podemos tratar datos identificatorios y de contacto (nombre, email, teléfono cuando corresponda), credenciales de acceso protegidas mediante hash, datos de entrega (destinatario y domicilio), datos de la compra, comunicaciones y preferencias de cookies. No solicitamos datos sensibles. No almacenamos datos completos de tarjetas de pago.

**Finalidades.** Usamos los datos para: crear y administrar la cuenta; procesar y entregar compras; verificar pagos y prevenir fraude; brindar atención y postventa; cumplir obligaciones legales, contables e impositivas; atender solicitudes de derechos; y, sólo si la persona presta un consentimiento separado, enviar novedades y promociones. No usamos datos para decisiones automatizadas que produzcan efectos jurídicos o significativos sobre las personas.

**Base y carácter de la información.** Los datos necesarios para abrir una cuenta, realizar una compra y entregar un pedido son obligatorios: si no se facilitan, no podremos brindar ese servicio. El teléfono es opcional salvo que se indique expresamente que la logística elegida lo requiere. La suscripción a comunicaciones comerciales es opcional y no condiciona la compra.

**Destinatarios y encargados.** Podemos comunicar los datos estrictamente necesarios a operadores logísticos, procesadores de pago, proveedores de alojamiento/infraestructura, soporte y asesores que actúen por nuestra cuenta y bajo instrucciones de confidencialidad y seguridad. No vendemos ni cedemos datos personales para fines publicitarios propios de terceros. Si una integración implica una transferencia internacional, se informará antes de activarla y se adoptarán las salvaguardas exigibles.

**Conservación.** Conservamos los datos mientras sean necesarios para las finalidades informadas y durante los plazos legales aplicables. Luego los suprimimos, anonimizamos o bloqueamos de forma segura. Los datos que deban conservarse por obligación legal no podrán eliminarse hasta que venza ese plazo.

**Seguridad.** Aplicamos medidas técnicas y organizativas razonables para proteger los datos contra acceso, alteración, pérdida o divulgación no autorizados. Ningún sistema es absolutamente invulnerable; ante un incidente relevante actuaremos conforme a la normativa aplicable.

**Derechos.** La persona titular puede solicitar información y acceso a sus datos; rectificación, actualización, supresión o confidencialidad cuando corresponda; y oponerse al uso de sus datos con fines publicitarios. Para ejercerlos, debe escribir a [EMAIL DE PRIVACIDAD] con el asunto “Datos personales” e indicar nombre, medio de contacto, solicitud y un medio razonable para acreditar identidad. El acceso es gratuito a intervalos no inferiores a seis meses, salvo interés legítimo. Responderemos los pedidos de acceso en hasta 10 días corridos y los de rectificación, actualización o supresión en hasta 5 días hábiles, sin perjuicio de obligaciones legales de conservación.

La Agencia de Acceso a la Información Pública (AAIP) es el órgano de control de la Ley 25.326. Si la respuesta fuera insuficiente o no se recibiera en plazo, la persona titular puede reclamar ante la AAIP o promover la acción de hábeas data que corresponda.

**Cambios.** Publicaremos en esta página las modificaciones y su fecha de vigencia. Los cambios materiales no tendrán efecto retroactivo sobre tratamientos ya realizados salvo obligación legal.

Última actualización: [FECHA].

### Términos y Condiciones

**1. Identificación del proveedor.** Este sitio es operado por [RAZÓN SOCIAL O NOMBRE COMPLETO], CUIT [CUIT], domicilio legal [DOMICILIO], email [EMAIL DE ATENCIÓN] (“Lucía Perfumería”).

**2. Uso del sitio.** La persona usuaria debe utilizar el sitio de modo lícito, veraz y diligente. No puede interferir con su seguridad, acceder a cuentas ajenas, reproducir automatizadamente contenidos sin autorización ni utilizar el sitio con fines ilícitos.

**3. Productos, precios y disponibilidad.** Las características esenciales, precio final, moneda, stock, medios de pago, costos y condiciones de envío se informarán antes de confirmar la compra. Las imágenes son ilustrativas y las tonalidades pueden variar según la pantalla. La aceptación de una orden queda sujeta a la disponibilidad real y a la validación de pago; de no poder cumplirse, se informará la situación y se reintegrará el importe que corresponda.

**4. Contratación electrónica.** Antes de confirmar, la persona podrá revisar los datos de la compra. Recibida la aceptación, Lucía Perfumería enviará una confirmación por el medio informado. La confirmación no limita los derechos del consumidor previstos por la legislación argentina.

**5. Cuenta y seguridad.** La persona es responsable de mantener la confidencialidad de sus credenciales y de informar de inmediato un uso no autorizado. Lucía Perfumería no solicitará la contraseña por email o mensajería.

**6. Propiedad intelectual.** Las marcas, textos, fotografías, diseños y demás contenidos del sitio pertenecen a Lucía Perfumería o a sus licenciantes. No se concede licencia alguna fuera del uso personal del sitio y de las excepciones previstas por la ley.

**7. Responsabilidad.** Nada de estos términos limita derechos irrenunciables de consumidores ni excluye responsabilidades que la ley no permite excluir. En el marco legal aplicable, no respondemos por interrupciones ajenas a nuestro control razonable, uso indebido del sitio o daños derivados de información suministrada por la persona usuaria que sea falsa o inexacta.

**8. Privacidad.** El tratamiento de datos se rige por la Política de Privacidad, que integra estos términos.

**9. Derecho de revocación y devoluciones.** Las compras a distancia pueden revocarse en los casos y plazos aplicables. Consultá la Política de Reembolso y Devolución y utilizá el Botón de Arrepentimiento, sin perjuicio de otros canales de atención.

**10. Ley y jurisdicción.** Se aplica la legislación de la República Argentina. Para controversias de consumo, será competente el tribunal del lugar de cumplimiento, entendido como el lugar donde la persona consumidora recibió o debió recibir la prestación, sin perjuicio de las autoridades administrativas y derechos de defensa del consumidor que correspondan. Toda cláusula que pretenda restringir esa competencia se tendrá por no escrita.

Última actualización: [FECHA].

### Política de Cookies

**Qué son.** Las cookies son pequeños archivos que el navegador almacena para que el sitio funcione y, si la persona lo autoriza, para recordar preferencias o medir uso.

**Cookies esenciales.** Usamos cookies técnicas necesarias para mantener la sesión autenticada y proteger el acceso. No se usan para publicidad. Su desactivación puede impedir el inicio de sesión, el carrito o el checkout.

**Cookies opcionales.** A la fecha de esta política, Lucía Perfumería no carga Google Analytics, Meta Pixel ni otras herramientas de analítica o publicidad. Si en el futuro se incorporan, no se cargarán hasta que la persona acepte expresamente la categoría “Analítica” o “Marketing” en el banner. Ese consentimiento será opcional, granular y podrá retirarse desde “Preferencias de cookies”.

**Cómo administrar las cookies.** Se pueden aceptar, rechazar o modificar las cookies opcionales desde [ENLACE A PREFERENCIAS DE COOKIES]. También pueden eliminarse o bloquearse desde la configuración del navegador. El bloqueo de cookies esenciales puede afectar funciones del sitio.

**Terceros.** Antes de activar una herramienta de terceros se actualizará esta política identificando proveedor, finalidad, datos tratados, transferencias y enlace a sus políticas.

Última actualización: [FECHA].

### Política de Reembolso, Devolución y Arrepentimiento

**Derecho de arrepentimiento.** En las contrataciones a distancia, la persona consumidora puede revocar su aceptación dentro de los 10 días contados desde la celebración del contrato o, si la entrega del bien es posterior, desde la entrega. Si el vencimiento cae en día inhábil, se prorroga al primer día hábil siguiente. El derecho es irrenunciable y su ejercicio no tiene costo para la persona consumidora.

**Cómo ejercerlo.** Se puede usar el enlace “BOTÓN DE ARREPENTIMIENTO” visible en el primer acceso del sitio, sin necesidad de tener una cuenta ni iniciar sesión. El formulario solicitará solamente los datos indispensables para identificar la operación y resguardar la identidad. Una vez enviada la solicitud, se mostrará y comunicará por el mismo medio un número de gestión dentro de las 24 horas. También se podrá escribir a [EMAIL DE ATENCIÓN] indicando número de pedido, nombre y email utilizado en la compra.

**Efectos y devolución.** Ejercido el derecho en tiempo y forma, las partes quedan liberadas de sus obligaciones y deben restituirse las prestaciones. Lucía Perfumería coordinará la devolución y el reembolso por el mismo medio de pago o por otro medio legalmente válido, sin imponer costos por el ejercicio del derecho. No se descontará una merma de valor originada en el uso conforme a la naturaleza del producto.

**Excepciones.** Las excepciones legales se aplicarán restrictivamente. En particular, pueden alcanzarse productos personalizados o que por su naturaleza no puedan devolverse o se deterioren con rapidez, conforme al artículo 1116 del Código Civil y Comercial y normativa aplicable. No se invocarán excepciones que contradigan derechos imperativos del consumidor. Los productos de perfumería y cosmética deberán evaluarse caso por caso, sin imponer requisitos no previstos por ley.

**Garantía y productos con fallas.** Esta política no limita el derecho a reclamar por productos defectuosos, falta de conformidad, garantía legal u otros derechos previstos por la Ley 24.240. Para esos casos, escribir a [EMAIL DE ATENCIÓN] con fotos, descripción del inconveniente y número de orden.

Última actualización: [FECHA].

## 3. Textos para formularios

### Registro y checkout (casilla obligatoria, inicialmente desmarcada)

> [ ] Leí y acepto los [Términos y Condiciones] y la [Política de Privacidad]. Entiendo que Lucía Perfumería tratará mis datos para crear mi cuenta y/o gestionar mi compra, entrega, atención y obligaciones legales, conforme a la Política de Privacidad.

La casilla debe ser obligatoria para completar el flujo, pero no debe usar texto que autorice marketing. Guardar evidencia de versión del texto, fecha/hora, cuenta o pedido y método de aceptación.

### Newsletter (casilla opcional, inicialmente desmarcada)

> [ ] Quiero recibir por email novedades, lanzamientos y promociones de Lucía Perfumería. Puedo retirar mi consentimiento en cualquier momento mediante el enlace de baja de cada mensaje o escribiendo a [EMAIL DE PRIVACIDAD].

No condicionar la suscripción al newsletter a una compra, y no usar una única casilla para términos, servicio y marketing.

### Aviso breve de envío

> Usaremos estos datos sólo para procesar y entregar tu pedido, brindarte atención posterior y cumplir obligaciones legales. Más información en nuestra [Política de Privacidad].

## 4. Requisitos de implementación técnica y UX

### Botón de Arrepentimiento

- Ubicar el enlace con la etiqueta literal **“BOTÓN DE ARREPENTIMIENTO”** en el primer acceso, a simple vista, tamaño y contraste suficientes, tanto en desktop como móvil. No debe quedar sólo en el pie de página.
- Debe funcionar sin registro o inicio de sesión. La verificación de identidad, si es necesaria, debe ser razonable, habitual y exclusivamente de seguridad.
- Solicitar, como máximo: número de pedido, email usado en la compra y nombre. No pedir contraseña, DNI ni datos de tarjeta.
- Emitir un código de solicitud visible en pantalla y enviarlo por el mismo medio dentro de 24 horas. Conservar registro auditable de fecha, operación y respuesta.
- Diseñar el formulario para teclado: foco visible, labels asociados, mensajes de error anunciados con `role="alert"` y confirmación con `role="status"`.

### Cookies y analítica

- Mostrar un banner antes de cargar cualquier etiqueta no esencial. Incluir: “Aceptar opcionales”, “Rechazar opcionales” y “Configurar”. Rechazar debe tener la misma facilidad visual que aceptar.
- Esenciales siempre activas; analítica y marketing desactivadas por defecto.
- Persistir sólo la preferencia, con fecha, versión de política y categorías. Permitir retirarla mediante un enlace permanente “Preferencias de cookies”.
- Incorporar tags de terceros mediante carga condicional posterior al consentimiento, nunca directamente en el layout.

### WCAG 2.1 AA y diseño móvil

- Contraste mínimo 4.5:1 para texto normal y 3:1 para texto grande; no comunicar un estado sólo por color.
- Objetivos táctiles de al menos 44×44 CSS px cuando sea posible; textos legales legibles sin zoom y sin desborde horizontal a 320 px.
- Todo control debe poder utilizarse con teclado; el foco nunca debe quedar oculto. Los modales deben atrapar el foco y cerrarse con Escape.
- Usar HTML semántico, `label` para cada input, jerarquía de encabezados, enlaces con nombres descriptivos y `lang="es"`.
- No usar placeholders como único rótulo ni enlaces vacíos `href="#"` para acciones reales.

## 5. Checklist final de publicación

### Legal y consumidor

- [ ] Se completaron y verificaron razón social, CUIT, domicilio legal, contacto y dominio en todos los textos.
- [ ] Los documentos están publicados desde enlaces permanentes y visibles en el checkout.
- [ ] Se informa precio final, costos de entrega, medios de pago, disponibilidad y confirmación de compra antes del pago.
- [ ] El checkout registra aceptación de Términos/Privacidad y exhibe el derecho de revocación destacado.
- [ ] El Botón de Arrepentimiento está en el primer acceso, es accesible y entrega número de gestión dentro de 24 horas.
- [ ] No hay cláusulas que excluyan garantías legales, limiten derechos irrenunciables o impongan jurisdicción perjudicial al consumidor.

### Datos personales

- [ ] Se definió inventario de tratamientos, responsable, finalidad, destinatarios, retención y medidas de seguridad.
- [ ] Se confirmó la inscripción de las bases que corresponda en el Registro Nacional de Bases de Datos Personales.
- [ ] Hay proceso y responsable para responder acceso en 10 días corridos y rectificación/actualización/supresión en 5 días hábiles.
- [ ] Existen contratos o instrucciones documentadas con cada encargado de tratamiento.
- [ ] Marketing funciona sólo con consentimiento expreso, separado, demostrable y revocable.
- [ ] No se recaban datos sensibles ni se usan perfiles de comportamiento sin evaluación y consentimiento aplicable.

### Tecnología, terceros y accesibilidad

- [ ] Se bloquean Analytics, Pixel y etiquetas equivalentes antes de consentimiento.
- [ ] Se revisaron las condiciones y garantías de cada procesador de pago, logística, email, hosting y soporte antes de activarlo.
- [ ] Se probaron formularios, banner y Botón de Arrepentimiento con teclado, lector de pantalla y vista móvil de 320 px.
- [ ] Se revisó contraste y mensajes de error/confirmación.
- [ ] Se realizó revisión final por abogado/a matriculado/a en Argentina con los datos reales del negocio y la operatoria de devoluciones.

## 6. Fuentes normativas a mantener bajo revisión

- Ley 25.326, arts. 4 a 6, 9, 10, 14 a 16 y 25.
- Código Civil y Comercial de la Nación, arts. 1108 a 1116.
- Ley 24.240 de Defensa del Consumidor, especialmente contratación a distancia y derechos irrenunciables.
- Disposición SSDCyLC 954/2025 y Disposición DNDCAC 3/2026, sobre Botón de Arrepentimiento y Botón de Baja.
- Disposiciones y guías vigentes de la AAIP.
