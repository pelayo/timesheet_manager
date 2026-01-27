---
name: frontend-core
description: Define los principios de desarrollo frontend respecto al diseño visual, arquitectura de componentes, accesibilidad y rendimiento para aplicaciones web. Estas reglas son universales y deben aplicarse independientemente del framework utilizado.
---

### 1. UX y Diseño Responsivo
* **Estrategia Mobile First:**
    * Desarrollar pensando primero en dispositivos móviles y escalar progresivamente salvo que se indique lo contrario.
    * **Breakpoints:** El diseño debe adaptarse fluidamente a al menos 3 saltos: **Móvil, Tablet y Desktop**.
* **Feedback y Estabilidad Visual:**
    * **Placeholders (Skeletons):** No está recomendado el uso de spinners de página completa. Usar Skeletons que imiten la estructura final para reducir la carga cognitiva.
    * **Evitar Saltos (CLS):** Reservar siempre espacio para imágenes, vídeos o iframes (aspect-ratio o width/height fijos) para evitar que el contenido "baile" o se desplace mientras carga.

### 2. Arquitectura de Componentes
* **Metodología:** Recomendamos **Atomic Design** para organizar componentes visuales.
* **Abstracción y Reusabilidad:**
    * **Regla de Extracción:** No duplicar conjuntos de clases o estilos repetidamente. Si un patrón visual se repite, **extraerlo a un componente** o a una clase de utilidad común.
    * **Responsabilidad Única:** Componentes con una sola responsabilidad.
    * **Tamaño:** Regla general: **< 100 líneas**. Si crece más, divídelo.
* **Gestión del Estado:**
    * **Colocación (Co-location):** Mantén el estado lo más cerca posible de donde se consume. No subir todo al estado global si solo lo necesita un componente y sus hijos.
* **Legibilidad:**
    * Priorizar la legibilidad del código frente a micro-optimizaciones visuales o "trucos" de CSS difíciles de mantener.
* **Atomicidad:** Separar Lógica, Estilos y Presentación.
* **Nombres:** Nombres basados en la funcionalidad (`UserCard`), no en la apariencia (`BigWhiteBox`).

### 3. Semántica y Accesibilidad (A11y)
* **No es Opcional:** La accesibilidad es un requisito funcional, no un extra.
* **HTML Semántico:**
    * Prohibida la "sopa de divs". Usar `<main>`, `<nav>`, `<article>`, `<button>` para acciones (no `div` con `onClick`).
* **Roles y Atributos:**
    * Usar roles ARIA solo cuando la semántica HTML no sea suficiente.
    * Asegurar atributos `alt` descriptivos en imágenes.
* **Gestión del Foco (Focus Management):**
    * La aplicación debe ser operable por teclado.
    * **Trap & Restore:** Al abrir elementos superpuestos (Modales, Menús laterales), el foco debe quedar "atrapado" dentro de ellos. Al cerrarlos, el foco debe volver automáticamente al elemento que disparó la acción.

### 4. Rendimiento y Datos
* **Comunicación con API:**
    * Evitar "waterfalls" de peticiones.
    * Cachear en local todo lo posible.
* **Gestión de Paquetes:** Fijar versiones exactas de las librerías para evitar roturas silenciosas.