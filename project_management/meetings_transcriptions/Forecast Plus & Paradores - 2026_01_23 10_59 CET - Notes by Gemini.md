# 📝 Las notas

23 ene 2026

## Forecast Plus & Paradores

Invitados [Pelayo Ramón](mailto:pelayo.ramon@clouddistrict.com) [Rita Madariaga](mailto:rita.madariaga@clouddistrict.com)

Archivos adjuntos [Forecast Plus & Paradores](https://www.google.com/calendar/event?eid=NW4ydGdxNG1mNWUxN3ZtcWswbmNndnUzazcgcml0YS5tYWRhcmlhZ2FAY2xvdWRkaXN0cmljdC5jb20) 

Registros de la reunión [Transcripción](?tab=t.wwo0oyopbjiz) 

### Resumen

Pelayo Ramón y Rita Madariaga discutieron la necesidad de mostrar el acumulado de horas reportadas por el usuario en Teamwork y la importancia de ser estrictos con el reporte semanal para gestionar la carga de trabajo, abordando un posible desfase de 40 horas. Acordaron que la segunda iteración incorporará las ausencias y vacaciones previstas de Factorial, mientras que una tercera fase integrará las tarifas por rol para calcular el costo semanal o mensual del proyecto, requiriendo también una tabla de "Standard Hour" para gestionar las horas disponibles individualmente (como con Luis Fuertes y Santi Gémina). Pelayo Ramón mencionó la necesidad de mejorar la importación de datos de Teamwork, que está fallando al no incluir las imputaciones sin tareas, lo cual intentó solucionar con una tarea por defecto, aunque aún quedan alrededor de 2,000 imputaciones perdidas, y también discutieron la creación de un reporte de cargable y no cargable, y el manejo del histórico de tarifas para proyectos multianuales.

### Detalles

* **Requisitos de Visualización y Acumulado de Horas** Pelayo Ramón y Rita Madariaga discutieron la presentación de las horas trabajadas en Teamwork, que solo será visible para el "list" o el administrador. Rita Madariaga solicitó añadir una columna delante de la primera semana pronosticable (forecastear) que muestre el total de horas reportadas por el usuario en Teamwork para ese proyecto desde su inicio hasta la fecha de la semana en curso. Ellos confirmaron que, dado el reporte por quincenas, el acumulado se actualizaría semanalmente (por ejemplo, para la semana del 19 de enero, el corte es el 18 de enero, y para la siguiente semana, el 25 de enero).

* **Estrategia de Reporte Semanal y Desfase de Horas** Rita Madariaga mencionó la posibilidad de un desfase de alrededor de 40 horas debido a que los reportes se hacen por quincenas, lo que podría hacer que la gente no reporte a tiempo, especialmente durante la semana del 25\. Ella indicó que se debe ser "súper estricto" con los reportes para que los usuarios reporten semanalmente, ya que es útil para gestionar la carga de trabajo y el ancho de banda del personal cuando se solicita ayuda en otros proyectos. Pelayo Ramón entendió la necesidad de dar un toque a la gente que no está reportando a tiempo, confirmando que la visibilidad de esto se logra si los reportes son diarios ([00:00:56](#00:00:56)).

* **Segunda Iteración: Integración de Ausencias y Vacaciones** La segunda iteración del proyecto incluirá la incorporación de las vacaciones, que se traerán de Factorial. Rita Madariaga explicó que esto implicaría obtener las ausencias previstas de esa persona en Factorial. Pelayo Ramón aclaró que se trata de traer las ausencias que tienen pronosticadas (forecasteadas). Rita Madariaga sugirió mostrar esta información en una pestaña desplegable en la parte superior, con un listado de fechas por usuario, en lugar de integrarlo directamente en la tabla principal ([00:02:40](#00:02:40)).

* **Integración de Tarifas y Cálculo de Costos** Rita Madariaga propuso una tercera fase para integrar las tarifas por perfil, que podría transformarse en un Excel con un formato "usuario tarifa" para calcular el costo semanal o mensual del proyecto ([00:03:41](#00:03:41)). Pelayo Ramón mencionó que ya lo había considerado y lo tiene en las tareas, aunque su enfoque inicial para las tarifas era por rol, como "Backend junior". Rita Madariaga confirmó que la tarifa es en realidad por rol y nivel ([00:04:28](#00:04:28)) ([00:10:08](#00:10:08)).

* **Retos con la Importación de Teamwork y Datos de Usuarios** Pelayo Ramón indicó que necesita crear un nuevo "job" para importar datos de Factorial y pulir el "job" actual de Teamwork, que está funcionando de manera deficiente ([00:03:41](#00:03:41)). Rita Madariaga preguntó sobre la procedencia de los datos de los usuarios, a lo que Pelayo Ramón aclaró que los trae de Teamwork y que actualmente está usando datos falsos para las pruebas locales ([00:04:28](#00:04:28)).

* **Problemas de Integración de Teamwork y Debugging** Pelayo Ramón mencionó problemas con la importación de datos de Teamwork, donde faltaban entradas de imputaciones de horas ([00:05:58](#00:05:58)). Uno de los fallos identificados era que las imputaciones sin una tarea asociada estaban causando problemas; la solución implementada por Pelayo Ramón fue crear una tarea por defecto llamada "project general" y asignar las imputaciones a esa si no existía una tarea nula. No obstante, todavía quedan alrededor de 2,000 imputaciones perdidas ([00:06:47](#00:06:47)). Rita Madariaga sugirió que, para el debugging, sería ideal intentar cotejar persona a persona en Teamwork y que lo más fácil sería revisar un periodo más corto, como los últimos 15 días, o una semana/mes, en lugar del histórico completo ([00:05:58](#00:05:58)) ([00:07:37](#00:07:37)).

* **Evolución del Reporte: Cargabilidad y Estadísticas** Rita Madariaga discutió la futura fase de crear un reporte de cargable y no cargable, complementando la ocupación de la gente y el estado del proyecto ([00:07:37](#00:07:37)). El reporte debería combinar datos históricos de Teamwork y futuros del pronóstico. Pelayo Ramón sugirió que, si no hay otra solución, se puede poner un booleano en la página de proyectos para indicar si es cargable o no ([00:08:27](#00:08:27)).

* **Necesidad de Datos de Horas Disponibles** Además de la tabla de tarifas, Rita Madariaga indicó que se necesitará la tabla de "Standard Hour" o de horas disponibles por persona. Esto es necesario porque algunos usuarios tienen acuerdos especiales, como Luis Fuertes, que no trabaja los viernes (36 horas), o Santi Gémina, que tiene un 75%. Pelayo Ramón reconoció que esto requerirá un mantenimiento individual ([00:09:19](#00:09:19)).

* **Histórico de Tarifas para Proyectos Multianuales** Pelayo Ramón preguntó sobre el manejo del histórico de tarifas, ya que, si un proyecto se extiende de un año a otro (ej. de 2025 a 2026), se requerirían las tarifas de cada año para evaluar el costo. Rita Madariaga confirmó que se necesitaría el histórico, pero acordaron que la primera iteración se centrará en las tarifas actuales, buscando obtener algo que ayude un "20,000% más" que antes ([00:10:50](#00:10:50)).

* **Gestión de Tareas y Uso de IA con Jira** Pelayo Ramón mencionó que ha utilizado a "Codes" para definir todas las tareas y que subirá automáticamente un script al panel de Jira. Rita Madariaga enfatizó la importancia de nombrar las tareas y pantallas para que hagan referencia al trabajo ya montado ([00:11:32](#00:11:32)). Pelayo Ramón también expresó su intención de que el bot pueda dejar comentarios en las tareas de Jira para aclarar dudas ([00:12:31](#00:12:31)).

* **Evaluación del Proyecto de Paradores** Rita Madariaga preguntó a Pelayo Ramón sobre el proyecto de Paradores, luego de que Iván le proporcionara el entorno Sandbox ([00:13:12](#00:13:12)). Pelayo Ramón confirmó que revisó los servidores y el código, describiéndolo como un "sindios" típico de los proyectos de data de esa gente. Rita Madariaga asumió que tendrían que manejar algunos proyectos con cuidado y que los proyectos a largo plazo requerirán una inversión en refactorización para la salud mental futura y para reducir el tiempo acumulado en el futuro ([00:13:49](#00:13:49)).

* **Retos de Refactorización y Entornos de Prueba** Pelayo Ramón manifestó que su problema actual es la ausencia de buenos entornos de prueba (tests). Le preocupa la refactorización sin un entorno seguro, especialmente si pudiera afectar la base de datos de los clientes. Su enfoque es ver qué hace el código, identificar qué partes no se usan (mucho del código parece copiado y pegado o "plantillado") y luego enfocarse en establecer un entorno de testing la próxima semana para lanzar pruebas automáticas ([00:14:37](#00:14:37)). Acordaron agendar otra llamada para la próxima semana, incluyendo a Fátima, para revisar el pronóstico ([00:14:37](#00:14:37)).

### Pasos siguientes recomendados

- [ ] Pelayo Ramón creará un nuevo job para traer la información de las vacaciones forecasteadas de Factorial (ausencias pedidas por las personas) para la segunda iteración.  
- [ ] Pelayo Ramón necesitará la tabla de tarifas y la tabla de 'Standard la hour' para las horas disponibles de cada persona, debido a los acuerdos especiales.  
- [ ] Pelayo Ramón intentará combinar el trabajo del bot de GD con la aplicación y dedicar un poco más a esta tarea.  
- [ ] Pelayo Ramón intentará machear persona a persona para revisar las imputaciones de Teamwork de la primera quincena de enero, ya que hay datos que no coinciden.  
- [ ] Pelayo Ramón revisará la próxima semana la posibilidad de montar un entorno de testing para Paradores para lanzar pruebas automáticas, con el objetivo de evitar el borrado de la base de datos.  
- [ ] Rita Madariaga agendará otra llamada con Pelayo Ramón y Fati para el miércoles de la semana que viene para revisar el Forecast.

*Revisa las notas de Gemini para asegurarte de que sean correctas. [Obtén consejos y descubre cómo toma notas Gemini](https://support.google.com/meet/answer/14754931)*

*Danos tu opinión sobre el uso de Gemini para tomar notas en una [breve encuesta.](https://google.qualtrics.com/jfe/form/SV_9vK3UZEaIQKKE7A?confid=vXqQHiQbl8tXx_QtVnCwDxIVOAIIigIgABgDCA&detailid=standard)*

# 📖 Transcripción

23 ene 2026

## Forecast Plus & Paradores \- Transcripción

### 00:00:00

   
**Pelayo Ramón:** a hacer el Bueno, espero que me coja todo lo que lo que hablemos, que quiero probarlo ahora para pasárselo luego al codex y que me lo haga todo. Entonces, la idea es claro que puedan comparar aquí los los esto lo va a poder ver el list o el administrador.  
**Rita Madariaga:** Eso  
**Pelayo Ramón:** Entonces,  
**Rita Madariaga:** es.  
**Pelayo Ramón:** aquí en esta quieres delante de cada semana las horas hechas esa semana o el acumulado total  
**Rita Madariaga:** No, no. O sea, quiero delante de la primera semana que puedo forecastear, es decir, de esta semana, hay añadir una columna que sea lo el total que ha reportado ese usuario en Teamwork a ese  
**Pelayo Ramón:** hasta desde el inicio del  
**Rita Madariaga:** proyecto desde el inicio hasta el día 18 de junio de enero, quiero decir en este caso,  
**Pelayo Ramón:** proyecto.  
**Rita Madariaga:** porque estamos hablando en la semana del 19 de enero. Lo lógico es que la semana que viene, ¿vale?, Vale, el lunes aquí a ti probablemente te habrá desaparecido la semana del 19, ¿vale? Con lo cual el el lo imputado tú pondrás hasta el día 25,  
**Pelayo Ramón:** Vale.  
**Rita Madariaga:** ¿vale?  
**Pelayo Ramón:** Okay. Exacto. Vale,  
   
 

### 00:00:56 {#00:00:56}

   
**Rita Madariaga:** Sí,  
**Pelayo Ramón:** pues que te haga así el total la pr está ahí  
**Rita Madariaga:** hay que ser coñazo con que la gente, o sea, a ver qué nos puede pasar que tengamos unas 40 horas de desfase. ¿Por qué?  
**Pelayo Ramón:** Mhm.  
**Rita Madariaga:** Porque entre lo forecasteado esta semana, porque como reportamos por quincenas, ¿vale? Puede ser que estemos en la semana del 25 y la gente no haya reportado esta semana,  
**Pelayo Ramón:** esa semana.  
**Rita Madariaga:** ¿vale? Y aquí a lo mejor a la gente hay que darle un toque y decirles,  
**Pelayo Ramón:** Claro.  
**Rita Madariaga:** "Mira tío, ya necesito que empieces a reportar semanalmente." Dande.  
**Pelayo Ramón:** Vale. Okay.  
**Rita Madariaga:** Nos vamos a poner como super estrictos con los reportes de Bogal, pero la verdad es que va bien saber,  
**Pelayo Ramón:** Hm.  
**Rita Madariaga:** o sea, va bien que la gente reporte semanalmente. A mí es algo que me va bien porque cuando eh hay veces que yo que sé, me dicen, "Oye, Rita, ¿me puede ayudar fulanito?" y digo, "Sí, claro." Miro el forecast y digo, "Sí, claro, si es que está al 50% debería de tener más o menos eh ancho de banda." Pero a veces también lo que hago,  
   
 

### 00:01:52

   
**Pelayo Ramón:** Mhm.  
**Rita Madariaga:** como sé que hay gente pingueando por ahí de "¿Me ayudas con esto?" Entro en Teamwork y digo, "Voy a mirar por si acaso, no vaya a ser que esté haciendo otras cosas, ¿sabes? antes de ir a a escribir a la gente, me fijo en Timur.  
**Pelayo Ramón:** Hm.  
**Rita Madariaga:** Si en Timbur no hay nada reportado,  
**Pelayo Ramón:** Sí.  
**Rita Madariaga:** entonces les escribo y digo, te llamaría a ti, te diga, te diría, "Oye, pela, yo tengo en el radar que estás con Ocmon, eh, esto del forecast y el bot de GD, pero tienes algo más,  
**Pelayo Ramón:** ya que a lo mejor no está por ahí,  
**Rita Madariaga:** ¿sabes? Claro,  
**Pelayo Ramón:** no está estipulado por ningún sitio.  
**Rita Madariaga:** si reportaras bastante al día, yo ya lo vería, ¿vale? Que no pasa nada, ¿eh? Que tampoco hace falta ser ahí como superuroso, ¿vale?  
**Pelayo Ramón:** Vale.  
**Rita Madariaga:** Pero bueno, es un poco para que entiendas. Y el sumatorio final, ¿vale?, es para que si tú teníamos un forecast, pues intentar eh pues bueno,  
**Pelayo Ramón:** Mm.  
   
 

### 00:02:40 {#00:02:40}

   
**Rita Madariaga:** saber más o menos cuántas horas finales se van a reportar y ya.  
**Pelayo Ramón:** Vale, también  
**Rita Madariaga:** O sea, es esto como primera iteración,  
**Pelayo Ramón:** iba.  
**Rita Madariaga:** ¿vale? Luego vendrá una segunda iteración que si quieres o te la cuento ahora, te la cuento más adelante,  
**Pelayo Ramón:** Vale,  
**Rita Madariaga:** ¿vale?  
**Pelayo Ramón:** si si esto lo voy a lanzar en automático cuanto más  
**Rita Madariaga:** Vale, la siguiente interación es eh traerse  
**Pelayo Ramón:** haga.  
**Rita Madariaga:** vacaciones, ¿vale? Es decir,  
**Pelayo Ramón:** Mm.  
**Rita Madariaga:** de alguna forma aquí a lo mejor arriba, eh traer las ausencias que tenga esa persona pedidas  
**Pelayo Ramón:** Mm.  
**Rita Madariaga:** en en en listado eh listado de fechas,  
**Pelayo Ramón:** Ah. Ah. Ah. Vale. No, no traese lo que ha reportado como ausencias,  
**Rita Madariaga:** ¿sabes?  
**Pelayo Ramón:** traerse los que las que tienen forecasteadas e en  
**Rita Madariaga:** las que tiene forecaste, porque al final, o sea,  
**Pelayo Ramón:** factorial.  
**Rita Madariaga:** o sea, eh dentro de la tabla no lo vas a poder poner porque si no va a ser un cristo de tabla de la leche, pero a lo mejor en la parte de arriba podemos poner una pestañita que podemos desplegar que que digamos de los usuarios que tienes asignados en este proyecto, estas son las ausencias que tiene previstas,  
   
 

### 00:03:41 {#00:03:41}

   
**Pelayo Ramón:** Vale.  
**Rita Madariaga:** ¿vale? Y un listado eh de user un el o sea un listado de fechas,  
**Pelayo Ramón:** Okay.  
**Rita Madariaga:** no volverse loco,  
**Pelayo Ramón:** Vale,  
**Rita Madariaga:** ¿vale?  
**Pelayo Ramón:** vale, vale, vale, vale. Entonces sí,  
**Rita Madariaga:** de  
**Pelayo Ramón:** tengo que crear entonces un nuevo job. Ahora mismo tengo uno que importarme todo de teamwork que funciona de aquella manera,  
**Rita Madariaga:** Ajá. Bueno,  
**Pelayo Ramón:** hay que pulirlo.  
**Rita Madariaga:** esto sería de traérselo de factorial si está disponible.  
**Pelayo Ramón:** Y esto sería otro nuevo job para tresar cosas de Factorial. Okay.  
**Rita Madariaga:** Eso es.  
**Pelayo Ramón:** Vale.  
**Rita Madariaga:** Vale. Y luego ya el rizar el rizo de todo esto me parecería que molaría mucho. Esto a lo mejor lo tenemos que tener en una base de datos nuestra que nosotros pongamos, ¿vale?  
**Pelayo Ramón:** Hm.  
**Rita Madariaga:** tenemos el Excel con las tarifas de por perfil, ¿vale? Pero a lo mejor eso lo podemos transformar en un Excel con usuario tarifa, usuario tarifa,  
**Pelayo Ramón:** Hm.  
**Rita Madariaga:** que no cuesta mucho, o sea, y además es una vez al año, ¿vale?  
   
 

### 00:04:28 {#00:04:28}

   
**Rita Madariaga:** Y entonces ahí traernos cuál es la tarifa de esa persona y si cojo y tengo eh las horas persona abajo del todo puedo sumar cuánta pasta me estoy gastando  
**Pelayo Ramón:** Report.  
**Rita Madariaga:** semanalmente o si luego lo podemos ver una vista mensual, con lo cual Fati tendrá los ingresos.  
**Pelayo Ramón:** Hm. Ya lo tenía pensado y lo tengo metido eso en las en las tareas. La idea que tenía era los usuarios. Ahora mismo solo tengo usuarios y leads, o sea,  
**Rita Madariaga:** Por cierto,  
**Pelayo Ramón:** user y admin.  
**Rita Madariaga:** los usuarios, ¿de dónde los traes? Los usuarios de Teamwork.  
**Pelayo Ramón:** Eh, sí, se trato de teamwork también y les crea una password temporal y lo que quieras.  
**Rita Madariaga:** Vale,  
**Pelayo Ramón:** No tengo, no tengo gestión de password,  
**Rita Madariaga:** vale.  
**Pelayo Ramón:** no tengo recuperación de password.  
**Rita Madariaga:** Y y y los usuarios,  
**Pelayo Ramón:** Hay una página,  
**Rita Madariaga:** eh,  
**Pelayo Ramón:** es que hay una página para reportar también,  
**Rita Madariaga:** claro, eh, todos estos que te has traído aquí.  
**Pelayo Ramón:** ¿no? Estos son falsos. Son ms míos de local para pruebas.  
**Rita Madariaga:** Ah, vale, vale,  
**Pelayo Ramón:** No,  
   
 

### 00:05:17

   
**Rita Madariaga:** guay.  
**Pelayo Ramón:** eso, esos no existen.  
**Rita Madariaga:** No, era por si era real, era como,  
**Pelayo Ramón:** Esos no,  
**Rita Madariaga:** j\*\*\*\*, menudos nombres te está sacando el cabrón.  
**Pelayo Ramón:** no,  
**Rita Madariaga:** Vale,  
**Pelayo Ramón:** eso no, esos no son reales. No son reales. No,  
**Rita Madariaga:** vale. Digo, a lo mejor,  
**Pelayo Ramón:** no me lo estoy trayendo.  
**Rita Madariaga:** yo que sé, Timbor tiene unos idos por ahí que luego te lo saca, no sé cómo. Digo, me cago en 10\.  
**Pelayo Ramón:** No,  
**Rita Madariaga:** Pues así,  
**Pelayo Ramón:** no, no.  
**Rita Madariaga:** así vamos de c\*\*\*.  
**Pelayo Ramón:** Yo lo que tenía hecho en otra página, te había que incorporar en admino,  
**Rita Madariaga:** Valem.  
**Pelayo Ramón:** si estoy asignado a los proyectos, tengo aquí el tas, añadir y puedo y puedo meter aquí lo reportado que es mucho más sencillo, mucho menos polivalente que el reporting de de teamwork, pero si esto se quiere usar luego se puede usar si no se puede todo team.  
**Rita Madariaga:** Nada. Muy bien.  
**Pelayo Ramón:** Lo único que pasa es que tengo quear con Bwi lo de importarlo todo el teamwork hacia  
   
 

### 00:05:58 {#00:05:58}

   
**Rita Madariaga:** Sí, que teníais algún dato que no iba.  
**Pelayo Ramón:** faltan.  
**Rita Madariaga:** Mira, eso ahora pela quiere decir que que es buen momento, ¿sabes? Porque estamos en enero,  
**Pelayo Ramón:** Hm.  
**Rita Madariaga:** que lo tendremos fresco. Eh, a lo mejor podemos coger la semana que viene, traerte lo que hay importado de la primera quincena de enero y revisarlo.  
**Pelayo Ramón:** Sí, exacto. Tengo que tengo que intentar algo así,  
**Rita Madariaga:** No sé si esto hará redondeos,  
**Pelayo Ramón:** algo más.  
**Rita Madariaga:** lo que te estás trayendo, ¿sabes?  
**Pelayo Ramón:** No debería, no debería, ¿no?  
**Rita Madariaga:** No.  
**Pelayo Ramón:** Pero sobre todo es más que que faltasen horas, es que me faltaban entradas. Si Bwi tenía, me lo invento, 15000 entradas de imputaciones de horas en Teamwork, yo me traía 13.000. ¿A dónde se iban esas 2000?  
**Rita Madariaga:** No habrá un límite, ¿no? O alguna chorrada de  
**Pelayo Ramón:** Hay un límite de peticiones a la a la API de Teamwork,  
**Rita Madariaga:** estas,  
**Pelayo Ramón:** pero no me no me parece que ese fuese mi  
   
 

### 00:06:47 {#00:06:47}

   
**Rita Madariaga:** ¿vale?  
**Pelayo Ramón:** problema.  
**Rita Madariaga:** Tampoco podría ser tu problema de de alocación de memoria de la variable o alguna chorra de estas,  
**Pelayo Ramón:** No, no, no es no era un fallo.  
**Rita Madariaga:** ¿no?  
**Pelayo Ramón:** Era un es un una de dos. Un fallo que tenía era que las imputaciones que no tenían task, porque una cosa que yo hice aquí es que toda imputación tiene task.  
**Rita Madariaga:** Ah, vale. cuando la gente imputa ahí  
**Pelayo Ramón:** Ah. Ah. Cuando la gente impuntaba proyecto me está dando problemas.  
**Rita Madariaga:** Ah.  
**Pelayo Ramón:** Entonces le que dije es, oye, cuando me te venga nulo la task, eh eh si no existe, crea una task que sea project general y si no y si ya existe, impútalo siempre a esa task.  
**Rita Madariaga:** Vale, vale, vale, vale.  
**Pelayo Ramón:** Eh, con eso lo arreglé y recuperé pues si me faltaban 13,000 eh, pues de repente recuperé de las de las si me faltaban 5000 ahora me faltaban solo 2000, pero estas 2000 que me faltan no se han d No sé a dónde han ido.  
**Rita Madariaga:** Mm.  
**Pelayo Ramón:** Entonces, bueno, que enfiro que eso ahora que debugarlo es más fácil de bugarlo.  
   
 

### 00:07:37 {#00:07:37}

   
**Pelayo Ramón:** En vez de traerme el histórico completo de Teamwork, traerme los últimos 15 días.  
**Rita Madariaga:** Aquí lo ideal sería intentar machear persona a persona, ¿sabes? Intentar porque en cuanto veas una persona con descuadre,  
**Pelayo Ramón:** Sí,  
**Rita Madariaga:** pues ya te vas al teamwork, lo miras y ahí ves el detalle. Es que si no es muy difícil tipo de cosas así,  
**Pelayo Ramón:** exacto. Y y con un año es imposible de ver y  
**Rita Madariaga:** no. Como en año es imposible de ver.  
**Pelayo Ramón:** aparte Sí.  
**Rita Madariaga:** Esto es a lo mejor coger una semana, un mes o una cosa así a correr.  
**Pelayo Ramón:** Y aquí tengo una sección de estadísticas para por tal por proyecto,  
**Rita Madariaga:** Vale.  
**Pelayo Ramón:** pero esto cuando lo probé con todo lo que nos habíamos traído de Teamwork, eh,  
**Rita Madariaga:** Ya. Ya.  
**Pelayo Ramón:** te salían unas  
**Rita Madariaga:** Luego ya eh una una siguiente fase, porque aquí estamos viendo pues eso, cómo va el proyecto. Luego tenemos la parte de administración de cómo está la ocupación de la gente y luego ya la tercera sería a lo mejor  
**Pelayo Ramón:** Mhm.  
**Rita Madariaga:** crear también un report de cargable o algo así, ¿sabes?  
   
 

### 00:08:27 {#00:08:27}

   
**Rita Madariaga:** de Bogu y Fati se sacan reporte cargable, ¿vale? De la cargabilidad, o sea, de lo que ha asignado la gente, cuánto estáado el proyecto cargable, cuánto tal y entonces podemos sacar un que,  
**Pelayo Ramón:** M.  
**Rita Madariaga:** o sea, un el pasado de Teamwork y el futuro en cuanto al forecast, ¿vale? Entonces ahí lo que sería interesante, esto habría que decirle a Fati, eh, y ver si lo puedes recuperar tú, poner una etiqueta al proyecto que sea si es cargable o no es cargable, de tal forma que simplemente tú agrupes por cargable, no cargable, haces el sumatorio y te dice, "Oye,  
**Pelayo Ramón:** Ya está.  
**Rita Madariaga:** pues esto es cargable sobre el total y esto y ya está,  
**Pelayo Ramón:** Vale, hombre, si no hay una solución a las malas,  
**Rita Madariaga:** ¿sabes?  
**Pelayo Ramón:** que es venirte a la página de proyectos y eh ponerle aquí algún tipo de buleano.  
**Rita Madariaga:** Sí,  
**Pelayo Ramón:** A ver, a ver, ahora 17 cuando me los tarjetan 200,  
**Rita Madariaga:** sí.  
**Pelayo Ramón:** pero entiendo que con que lo hagamos para los proyectos últimos que se estén haciendo tampoco  
**Rita Madariaga:** Sí, nada, suficiente.  
   
 

### 00:09:19 {#00:09:19}

   
**Rita Madariaga:** No,  
**Pelayo Ramón:** C.  
**Rita Madariaga:** no, no, tampoco hay colo. Eh, luego estoy pensando que aparte de la tabla de tarifas, vas a necesitar también la tabla de Standard la hour de horas disponibles.  
**Pelayo Ramón:** de cada persona, ¿no? Ya.  
**Rita Madariaga:** Sí.  
**Pelayo Ramón:** Y eso eso lleva a nivel de persona. Eso ya si quieres ni siquiera porque cuando decías las tarifas las iba a hacer a nivel de  
**Rita Madariaga:** A ver, va a nivel de persona porque en realidad tú podrías en Teamwork creo que no lo tenemos,  
**Pelayo Ramón:** eh  
**Rita Madariaga:** ¿vale? Pero si lo tuviéramos, puedes decir incluso por localización. Es decir,  
**Pelayo Ramón:** h  
**Rita Madariaga:** en Madrid son tantas, en Barcelona tantas, pero qué pasa que es que luego hay gente que tiene eh acuerdos especiales. Eh,  
**Pelayo Ramón:** sí. Luis Fuertes no trabaja los viernes directamente,  
**Rita Madariaga:** pues por ejemplo Fuerces que trabaja 36 horas o una  
**Pelayo Ramón:** eh.  
**Rita Madariaga:** cosa así. Eh, también Santi Gémina también tiene un 75% de tal, no sé. Claro, entonces ya dices, "m\*\*\*\*\*, ¿sabes?" Sí,  
**Pelayo Ramón:** Ah, así tienes que ir a huevo.  
   
 

### 00:10:08 {#00:10:08}

   
**Pelayo Ramón:** Uno a  
**Rita Madariaga:** hay que ir a hay que ir un poco a huevo,  
**Pelayo Ramón:** uno.  
**Rita Madariaga:** pero de todas formas eso es igual que las tarifas una vez.  
**Pelayo Ramón:** Sí, exacto. No tienes que preocuparte más de eso.  
**Rita Madariaga:** Eso es.  
**Pelayo Ramón:** Sí. Y lo de las tarifas lo iba a hacer,  
**Rita Madariaga:** Vale.  
**Pelayo Ramón:** a lo mejor prefieres que lo haga a nivel individual, pero lo iba a hacer por rol y empezar a añadir roles a la gente. Backen junior,  
**Rita Madariaga:** La tarifa en realidad es por rol, es por rol y nivel.  
**Pelayo Ramón:** ¿vale?  
**Rita Madariaga:** O sea, Ken Smith, tanto no sé qué hay la tabla que tenemos, ¿vale?  
**Pelayo Ramón:** Vale.  
**Rita Madariaga:** O sea,  
**Pelayo Ramón:** Sí,  
**Rita Madariaga:** que me parece bien.  
**Pelayo Ramón:** lo que lo que no voy a hacer por ahora ya lo veré.  
**Rita Madariaga:** No creo que vaya a cambiar el la perspectiva, ¿sabes? De lo que de las tarifas que están preparando para 2026,  
**Pelayo Ramón:** Ya vale.  
**Rita Madariaga:** pero bueno.  
**Pelayo Ramón:** Lo que no voy a hacer por ahora, ya lo veremos el futuro, es llevar histórico de tarifas porque claro,  
**Rita Madariaga:** No, no, no, no, no, no.  
   
 

### 00:10:50 {#00:10:50}

   
**Pelayo Ramón:** si yo quiero es que si si quieres evaluar el costo de un proyecto del año pasado,  
**Rita Madariaga:** Bueno, sí, sí, sí, sí, lo necesitas. Sí, porque si estoy en un proyecto que ha empezado en 2025 y sigue en 2026,  
**Pelayo Ramón:** tienes  
**Rita Madariaga:** deberíamos de decir lo pasado es con las tarifas de 2025 y lo futuro es con tarifas de 2026\.  
**Pelayo Ramón:** pero por ahora voy a Sí.  
**Rita Madariaga:** Si lo necesitaríamos, a ver, de momento, primera iteración con las tarifas actuales, ¿sabes? Con las que con las que tenga la tabla. Luego ya veremos, ¿sabes?  
**Pelayo Ramón:** Exacto.  
**Rita Madariaga:** O sea, es el que mientras tengamos algo que nos ayude,  
**Pelayo Ramón:** Yiteraremos.  
**Rita Madariaga:** ya vamos a tener algo que nos va a ayudar un 20,000% más de lo que teníamos hasta ahora. que vale vale  
**Pelayo Ramón:** Vale, pues con me quedo con eso y lo voy le voy dando voy a dedicarle un poco más a esta mandanquita de GD,  
**Rita Madariaga:** genial  
**Pelayo Ramón:** pero voy a intentar si combino ambos mundillos y consigo que que uno haga cosas para el otro.  
   
 

### 00:11:32 {#00:11:32}

   
**Rita Madariaga:** no s sú claro claro y si y si lo haces así si quieres dime porque te ayuda a definir las historias de o sea las tareas de girira  
**Pelayo Ramón:** Vale. Sí. Ahora, ahora lo que voy a hacer, le he dicho a Codes que me las defina todas,  
**Rita Madariaga:** vale  
**Pelayo Ramón:** ¿eh? Y me hecho me ha dicho un script que me las va a subir automáticamente al panel de gira, por eso está pidiendo a  
**Rita Madariaga:** claro eh sería muy importante en esas historias eh  
**Pelayo Ramón:** Fátima.  
**Rita Madariaga:** nombrarlas, o sea, las pantallas o lo que sea, como lo vayamos a poner para que hagan referencia de ahora sobre esto que ya montaste, ¿sabes? Que tiene ya todas sus historias, necesito la siguiente, ¿sabes?  
**Pelayo Ramón:** H  
**Rita Madariaga:** Para no tener que estar siempre montando, o sea, para que sea muy realista en cuanto a lo que podría ser un trabajo tipo sprint, ¿sabes? que ahora tienes una tarea, se cierra y luego ya dentro de 2 meses a lo mejor sobre una cosa que se hizo hace no sé cuánto lo cambio y cuando vayan a coger eh me imagino que todo esto, o sea, si empezamos con contexto y todo, ¿sabes? Debería de cogerse todos los contextos anidados de esa pantalla para generar todo el final.  
   
 

### 00:12:31 {#00:12:31}

   
**Pelayo Ramón:** Ya, sí que te lo cogiese de esa manera.  
**Rita Madariaga:** Sí.  
**Pelayo Ramón:** Vale,  
**Rita Madariaga:** Bueno,  
**Pelayo Ramón:** eso me lo voy apuntando.  
**Rita Madariaga:** esto ya paja mental de eh  
**Pelayo Ramón:** Eso de hecho una cosa que quiero intentar también luego ya más adelante, si tengo la prueba de concepto enseñar que dirle,  
**Rita Madariaga:** No.  
**Pelayo Ramón:** ¿vale? Es que funcione también con comentarios en las tareas de Jira y el propio bot pueda dejarte comentarios en las tareas de girira para decirte, "Oye, esto no funciona, esto no me cuadra o tengo estas dudas."  
**Rita Madariaga:** Ah, sí, claro, sí. Comentario sobre la tarea de claro. Super guay.  
**Pelayo Ramón:** y el botón los deja arriba y tienes que aclararle que eso lo he hecho con alguno.  
**Rita Madariaga:** Sí, sí.  
**Pelayo Ramón:** Oye, este plan, ¿qué necesita? No sé qué, qué aclaraciones necesitas y pum y  
**Rita Madariaga:** A ver,  
**Pelayo Ramón:** transpide.  
**Rita Madariaga:** en realidad si se trabaja bien con Jira y se relacionan las cosas, ¿sabes? Dices,  
**Pelayo Ramón:** Hm.  
**Rita Madariaga:** "Esta es relacionada con y y se hace todo bien." Debería de funcionar todo de p\*\*\*  
   
 

### 00:13:12 {#00:13:12}

   
**Rita Madariaga:** madre, ¿sabes?  
**Pelayo Ramón:** Sí,  
**Rita Madariaga:** Pero bueno,  
**Pelayo Ramón:** pero ahora entonces tendría que pulearme los links de gira y todo.  
**Rita Madariaga:** eso es Sí,  
**Pelayo Ramón:** Bueno, por ahora voy a mantenerlo sencillo como esto.  
**Rita Madariaga:** sí, sí, sí. Vale, vale. Eh, ¿qué más?  
**Pelayo Ramón:** Ya os ir enseñando.  
**Rita Madariaga:** Vale, genial. Pues perfecto. Era quería hablar contigo de esto porque digo,  
**Pelayo Ramón:** Vale,  
**Rita Madariaga:** el otro día hablamos y sí que me gustaría ir teniendo como pequeñas interacciones contigo de cómo vamos a ir como pin pito a pasito. Vale,  
**Pelayo Ramón:** sí.  
**Rita Madariaga:** vale.  
**Pelayo Ramón:** Y esto es sencillo por Ah,  
**Rita Madariaga:** Eh, siguiente. Te he puesto lo de paradores simplemente para que no se me Ya he visto el chat hoy,  
**Pelayo Ramón:** vale.  
**Rita Madariaga:** ¿vale? que eh te ha puesto Iván lo de ya el el entorno sbox y tal. Vale, nada,  
**Pelayo Ramón:** Hm.  
**Rita Madariaga:** era simplemente preguntarte si habías podido mirar algo, pero entiendo que como estaba así, poca cosa.  
**Pelayo Ramón:** O sea,  
   
 

### 00:13:49 {#00:13:49}

   
**Rita Madariaga:** Vale.  
**Pelayo Ramón:** lo he mirado, eh, entrado a los servidores, he visto todo lo que hace.  
**Rita Madariaga:** Sí,  
**Pelayo Ramón:** Es el código, es un sindios,  
**Rita Madariaga:** ya, pero no me dices nada,  
**Pelayo Ramón:** pero parece que es el esos habitual de lo he visto con Saú.  
**Rita Madariaga:** no me dices nada que no me esperara, pela porque es esto pasa en todos los proyectos de data  
**Pelayo Ramón:** es el este típico de todos los proyectos de esta gente. Hm.  
**Rita Madariaga:** social y tengo asumido que hay proyectos que vamos a dejar con  
**Pelayo Ramón:** Entonces,  
**Rita Madariaga:** pinzas, ¿vale? porque me voy a salir ahora y no quiero volverme loca y en los que sí que tengamos que a lo mejor seguir trabajando en  
**Pelayo Ramón:** hm  
**Rita Madariaga:** esos proyectos mucho tiempo, tengo asumido que vamos a tener que hacer una inversión de refactorización, que es una inversión de tiempo que es que yo no quiero que la gente se preocupe por la pasta,  
**Pelayo Ramón:** hm.  
**Rita Madariaga:** ¿sabes? O sea, hay que decir que el desarrollador se preocupe por si entra o no entra en alcance. Digo, porque eh no te preocupes, yo lo asumo, ¿sabes? Refactorízalo y hazlo bien, porque esto es por nuestra salud mental del futuro y probablemente porque a futuro nos va a llevar mucho  
   
 

### 00:14:37 {#00:14:37}

   
**Pelayo Ramón:** Sí,  
**Rita Madariaga:** menos a hacer cualquier cosa a la larga. La acumulación de horas futura va a ser mucho menor que la que invertamos en la refactorización. Estoy segura.  
**Pelayo Ramón:** totalmente. El problema que tengo en mi foco ahora mismo es uno, le intenté intentar hacerlo con IA porque si tienes el código y se ve más o menos lo que hace puedes,  
**Rita Madariaga:** Sí, sí, sí, sí, sí,  
**Pelayo Ramón:** pero claro, lo que yo no lo que no puedo arriesgarme es no hay entornos de tests buenos,  
**Rita Madariaga:** claro.  
**Pelayo Ramón:** entonces yo no puedo arriesgarme a hacer una refactorización y lanzarlo contra la base de datos de esta gente a ver qué a ver qué hace o a ver qué pasa.  
**Rita Madariaga:** Ya. Sí, sí, te entiendo, te  
**Pelayo Ramón:** Entonces, lo que estoy centrándome es en ver que hace,  
**Rita Madariaga:** entiendo.  
**Pelayo Ramón:** ver que se usa, porque hay mucho código que no se usa, porque se ve que esto lo tir un poco plantillado y entonces hay partes que no que no en el proyecto no,  
**Rita Madariaga:** Plantillado.  
**Pelayo Ramón:** o sea,  
**Rita Madariaga:** Copyasteado.  
**Pelayo Ramón:** usa como sí,  
**Rita Madariaga:** Copy pasaste de Vamos, ya te digo yo.  
**Pelayo Ramón:** o sea, hay una sección de o que no se usa entera con login y con no sé qué que no que  
**Rita Madariaga:** Sí, ya.  
**Pelayo Ramón:** eso no se usa en Entonces eso rehacerlo entero.  
**Rita Madariaga:** Sí.  
**Pelayo Ramón:** tien tiene dos servidores, o sea, tiene un app service y otro y un servidor y entonces el servidor llama al App Service para enviar unos emails a la gente o algo así. No entiendo por qué lo tienen que hacer con el App Service,  
**Rita Madariaga:** Ya.  
**Pelayo Ramón:** ¿no? Bueno, luego no tienes SL. Bueno, lo que contó este hombre ya en el informe es está bastante mal.  
**Rita Madariaga:** Sí, sí, sí, sí. Sí, es un desastre. Vamos. Total. Sí,  
**Pelayo Ramón:** Entonces,  
**Rita Madariaga:** sí.  
**Pelayo Ramón:** eh yo solo centrarme luego en la semana que viene oye en torno de testing. Vamos a ver cómo podemos montar esto para eh lanzar pruebas automáticas, ver qué funciona y que no le vamos a eh deletear la base de datos entera a esta gente si lo hacemos mal y a partir de ahí probando, ¿vale?  
   
 

### La transcripción finalizó después de 00:16:40

*Esta transcripción editable se ha generado por ordenador y puede contener errores. Los usuarios también pueden cambiar el texto después de que se haya generado.*