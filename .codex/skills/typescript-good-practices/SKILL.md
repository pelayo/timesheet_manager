---
name: typescript-good-practices
description: define las reglas específicas para escribir TypeScript robusto, legible y mantenible.
---

### 1. Tipado Estricto y Seguridad
* **Adiós `any`, Hola `unknown`:**
    * **Regla:** Añade siempre tipos. `any` está prohibido (apaga el chequeo de tipos).
    * **Solución:** Si es inevitable y no conoces el tipo, usa `unknown` y realiza "Type Narrowing".
    
    ```typescript
    // Bad
    const process = (data: any) => data.toUpperCase(); // Unsafe

    // Good
    const process = (data: unknown) => {
      if (typeof data === 'string') return data.toUpperCase();
      throw new Error('Invalid data');
    };
    ```
* **Retornos Explícitos:** Define siempre el tipo de retorno en funciones públicas.

### 2. Modelado de Datos
* **Interfaces vs Types:**
    * `interface` para modelos de datos extensibles (Objetos).
    * `type` para Uniones, Intersecciones y Primitivos.
* **Uniones > Enums:** Prefiere `type Role = 'admin' | 'user'` sobre `enum Role {}`.

### 3. Reglas de Oro: Claridad y Funciones
* **Nombres Descriptivos y Explícitos:**
    * Las variables deben explicar qué contienen sin necesidad de contexto extra.
    * **Funciones:** El nombre debe decir exactamente qué hace (Verbo + Sustantivo).
    ```typescript
    // Bad
    const d = new Date(); // What is d?
    const handleData = () => { ... } // What does it handle?

    // Good
    const transactionDate = new Date();
    const fetchUserTransactions = () => { ... }
    ```
* **Una Función, Una Acción (SRP):**
    * Las funciones deben hacer una sola cosa. Esto facilita el testing, el refactor y la lectura.
    * Si el nombre de la función necesita un "And" (ej: `validateAndSave`), divídela en dos.
* **Argumentos por Defecto:**
    * Usa la sintaxis de ES6 para valores por defecto en lugar de lógica interna.
    ```typescript
    // Bad
    function createItem(qty) {
      const quantity = qty || 1;
    }
    // Good
    function createItem(quantity: number = 1) { ... }
    ```

### 4. Lógica y Control de Flujo
* **Evitar Condicionales Negativos:**
    * Las negaciones dobles o condiciones negativas aumentan la carga cognitiva. Extrae la condición a una variable positiva o invierte la lógica.
    ```typescript
    // Bad
    if (!isNotEnabled) { ... }
    if (!user.hasNoAccess) { ... }

    // Good
    const isEnabled = !isNotEnabled;
    if (isEnabled) { ... }
    if (user.hasAccess) { ... }
    ```
* **Operadores Modernos:**
    * Usa `??` (Nullish Coalescing) para nulos estrictos.
    
    * Usa `?.` (Optional Chaining) para acceso seguro.

### 5. Paradigma Funcional vs Imperativo
* **Favor Functional Programming:**
    * Evita la programación imperativa (bucles `for`, `while`, mutación de estados).
    * Usa métodos declarativos de array: `.map()`, `.filter()`, `.reduce()`, `.find()`, `.some()`, `.every()`.
    
* **Inmutabilidad:**
    * Trata los datos como inmutables. Usa `const` por defecto.
    * Usa `readonly` en arrays o propiedades que no deben cambiar.
    ```typescript
    // Bad (Imperative & Mutable)
    const names = [];
    for (let i = 0; i < users.length; i++) {
      names.push(users[i].name);
    }

    // Good (Functional & Immutable)
    const names = users.map(user => user.name);
    ```

### 6. Utility Types (DRY)
* No repitas tipos manualmente. Usa `Pick`, `Omit`, `Partial` y `ReturnType` para derivar tipos nuevos de los existentes.
