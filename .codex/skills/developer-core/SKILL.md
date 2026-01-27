---
name: developer-core
description: Define los estándares de código y buenas prácticas a nivel desarrollo.
---

### 1. Comportamiento del Asistente (Meta-Reglas)
* **Validación de Requisitos:**
    * **No asumir:** Si falta información vital, **preguntar antes de actuar**.
    * **Complejidad:** Para refactors, nuevas features o cambios de arquitectura, **confirmar el entendimiento** antes de generar código.
    * **Tipado:** Si los modelos o tipos no están claros, parar y aclarar.
* **Proactividad:**
    * Sugerir mejoras si detectas violaciones de principios SOLID o problemas de rendimiento, pero respetar la decisión final del usuario tras la advertencia.

### 2. Tooling y Calidad de Código
* **Herramientas:** Utiliza herramientas de calidad de código como **Prettier, ESLint, TypeScript, ls-lint y SonarQube**.
    * **Configuración:** Las reglas deben ser lo más **restrictivas** posible para garantizar calidad, pero sin impedir un desarrollo ágil.
    * **Warnings:** Presta atención a la consola. Revisa y soluciona constantemente los *warnings*; no se deben ignorar.
* **Código Limpio:**
    * Prioriza la siempre legibilidad, la robustez y la seguridad.
    * Evita abstracciones prematuras.
    * Utiliza los principios **KISS**, **DRY**, **SOLID** y **Clean Code**.
    * El código debe ser fácil de leer y entender para otros desarrolladores humanos y agentes.
    * Aplica estrictamente el principio de Responsabilidad Única.
    * El código debe auto-documentarse.
    * Crea componentes pequeños, con una sola responsabilidad.
* **Librerías de Terceros:**
    * No añadas dependencias hasta que sean necesarias.
    * Úsalas para acelerar el desarrollo, pero con cabeza.
    * **Requisito:** Asegúrate de que la librería sea confiable, ligera y esté mantenida activamente.

### 3. Tipado
* **Tipado Estricto:**
    * **Prohibido:** Evita al máximo usar `any` o `unknown`.
    * **Reglas:** No desactivar las reglas definidas del linter salvo caso de fuerza mayor.

### 4. Arquitectura y Organización
* **Cohesión y Acoplamiento:** Buscar siempre la máxima cohesión (lo relacionado, junto) y el mínimo acoplamiento (módulos independientes).
* **Nomenclatura (Naming):**
    * **Archivos:** `kebab-case`.
    * **Código:** `camelCase` para variables/funciones, `PascalCase` para clases/componentes.
* **Internacionalización (i18n):**
    * **Prohibido:** Literales de texto codificados (hardcoded).
    * Utilizar siempre archivos de traducción, aunque la aplicación solo tenga 1 idioma.

### 5. Testing y Fixtures
* **Estrategia:**
    * Implementar **Tests Unitarios y E2E automáticos**.
    * **Cobertura:** No es necesario testear todo (100%), pero sí es obligatorio cubrir los **caminos críticos** y las partes más importantes.
* **Mantenimiento:**
    * **Fixtures:** Cuando cambien los modelos de datos, es obligatorio actualizar las fixtures para que los tests sigan funcionando.

### 6. Seguridad, Entorno y Despliegues
* **Secretos y Seguridad:**
    * Las variables de entorno deben ir en ficheros `.env`.
    * **Prohibido:** Incluir passwords/tokens en ficheros subidos al repositorio.
* **Entorno de Desarrollo:**
    * Es obligatorio que el proyecto sea ejecutable en local desde el ordenador de cualquier miembro del equipo (sin dependencias de terceros bloqueantes).
* **Versionado:** Recomendable usar **Versionado Semántico** para los despliegues.

### 7. Manejo de Errores y Compatibilidad
* **Robustez:**
    * Asegúrate de que la aplicación no se bloquee (crash). Maneja los errores de manera elegante.
    * Implementa control de errores y monitorización.
* **Compatibilidad:**
    * Los desarrollos deben ser compatibles con las últimas versiones comunes de navegadores (>85% uso) y versiones de hasta 1 año de antigüedad.