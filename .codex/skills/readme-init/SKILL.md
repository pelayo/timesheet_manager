---
name: readme-init
description: Genera automáticamente un fichero README.md profesional y bien estructurado para iniciar un nuevo proyecto. Crea documentación clara, atractiva y con todas las secciones esenciales que necesita un proyecto.
---

# Generador de README Inicial

Esta skill crea un README.md profesional y completo que sirve como documentación central de tu proyecto, con todas las secciones necesarias para que usuarios y desarrolladores entiendan rápidamente de qué trata y cómo usarlo.

## Cuándo usar esta Skill

- Iniciar un nuevo proyecto y necesitar documentación profesional desde el día 1.
- Crear un repositorio en GitHub/GitLab que sea fácil de entender.
- Documentar un proyecto interno para el equipo de desarrollo.
- Generar README para librerías, herramientas CLI o aplicaciones.
- Crear documentación para proyectos open source.
- Proporcionar instrucciones de instalación y uso claras.
- Establecer guías de contribución para colaboradores.

## Qué Hace esta Skill

1.  **Recopila Información del Proyecto**: Entiende el tipo, propósito y audiencia de tu proyecto.
2.  **Estructura Profesional**: Crea un README con secciones estándar en orden lógico.
3.  **Contenido Adaptado**: Genera ejemplos de instalación, uso y configuración específicos para tu proyecto.
4.  **Badges y Metadatos**: Añade badges útiles (versión, licencia, estado de tests, etc.).
5.  **Guía de Contribución**: Incluye instrucciones para contribuidores potenciales.
6.  **Documentación Escalable**: Crea un README modular que es fácil de expandir después.
7.  **Sigue Mejores Prácticas**: Aplica estándares de README reconocidos internacionalmente.

## Cómo Usar

### Uso Básico

Desde el directorio de tu proyecto:

```
Crea un README.md inicial para mi proyecto
```

```
Genera un README.md para una librería Python
```

```
Crea documentación inicial para una aplicación Node.js
```

### Con Detalles del Proyecto

```
Crea un README.md para mi proyecto, es una librería de autenticación en Python que se integra con OAuth2
```

```
Genera un README para una CLI en Go que gestiona recursos en la nube
```

### Con Tipo de Proyecto Específico

```
Crea un README.md tipo "librería" para mi proyecto de frontend
```

```
Genera un README tipo "aplicación" para mi servidor REST
```

```
Crea un README tipo "herramienta CLI" para mi gestor de configuración
```

### Con Audiencia Target

```
Crea un README.md orientado a desarrolladores para mi librería
```

```
Genera un README orientado a usuarios finales para mi aplicación
```

## Secciones Incluidas

Un README generado por esta skill incluye:

- **Título y Descripción Breve**: Qué es el proyecto en una línea.
- **Badges**: Información visual del estado del proyecto.
- **Tabla de Contenidos**: Navegación fácil (si el README es largo).
- **Características Principales**: Qué hace especial tu proyecto.
- **Requisitos Previos**: Dependencias y versiones requeridas.
- **Instalación**: Instrucciones paso a paso para diferentes plataformas.
- **Uso Rápido**: Ejemplos básicos funcionales.
- **Configuración**: Variables de entorno, opciones principales.
- **Documentación Detallada**: Referencias a documentación completa.
- **Contribuir**: Cómo colaborar con el proyecto.
- **Licencia**: Información de licencia.
- **Contacto/Soporte**: Dónde obtener ayuda.

## Ejemplo

**Usuario**: "Crea un README.md para mi librería Python de análisis de datos"

**Salida**:

```markdown
# Data Analytics Library

Librería Python de alto rendimiento para análisis y procesamiento de datos, con soporte para estructuras grandes en memoria y visualizaciones interactivas.

![Python](https://img.shields.io/badge/Python-3.9+-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen)

## Tabla de Contenidos

- [Características](#características)
- [Instalación](#instalación)
- [Uso Rápido](#uso-rápido)
- [Documentación](#documentación)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Características

- ✨ Procesamiento ultra-rápido de grandes conjuntos de datos
- 📊 Visualizaciones interactivas integradas
- 🔧 API simple e intuitiva
- 🚀 Optimizado para memoria y CPU
- 📚 Documentación completa con ejemplos

## Instalación

### Con pip

```bash
pip install data-analytics
```

### Desde código fuente

```bash
git clone https://github.com/usuario/data-analytics.git
cd data-analytics
pip install -e .
```

## Uso Rápido

```python
import data_analytics as da

# Cargar datos
df = da.load('datos.csv')

# Análisis básico
stats = df.describe()

# Visualizar
df.plot()
```

## Documentación

Para documentación completa, ejemplos avanzados y API reference, visita [la documentación oficial](https://docs.example.com).

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/mifeature`)
3. Commit tus cambios (`git commit -m 'Añade mifeature'`)
4. Push a la rama (`git push origin feature/mifeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para detalles.

## Soporte

¿Preguntas? Abre un [issue](https://github.com/usuario/data-analytics/issues) o contacta a [soporte@example.com](mailto:soporte@example.com).
```

## Consejos

- Ejecuta la skill desde la raíz de tu proyecto para mejor contexto.
- Proporciona detalles sobre el tipo y propósito de tu proyecto para un README más relevante.
- Customiza el README generado con información específica de tu proyecto.
- Incluye ejemplos reales y casos de uso específicos después de generarlo.
- Mantén el README actualizado conforme evoluciona el proyecto.
- Usa la tabla de contenidos para READMEs largos (más de 100 líneas).
- Añade badges de CI/CD después de configurar pipelines.

## Casos de Uso Relacionados

- Crear plantillas de README para múltiples proyectos en tu equipo.
- Generar documentación de Getting Started para nuevos repositorios.
- Crear READMEs en diferentes idiomas.
- Actualizar un README existente con nuevas secciones.
- Generar documentación de API desde código existente.
