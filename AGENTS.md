# Coding Style and Conventions

This document outlines the coding standards and best practices to be followed when contributing to this project. The goal is to maintain a clean, consistent, and readable codebase.

## 1. General Principles

*   **Concise Code:** Write code that is easy to understand and to the point. Avoid unnecessary verbosity.
*   **Functional Programming:** Embrace functional programming concepts where they improve clarity and reduce side effects. Use array methods like `map`, `filter`, `reduce`, and `forEach` over traditional `for` loops when appropriate.
*   **Keep it Simple (KIS):** Avoid overly complex solutions. A straightforward implementation is often the best.
*   **Don't Repeat Yourself (DRY):** Reuse code where possible. Encapsulate common logic into functions or services.

## 2. Code Style & Formatting

*   **Indentation:** Use 2 spaces for indentation. Do not use tabs.
*   **Semicolons:** Do not use semicolons at the end of lines.
*   **Linters & Formatters:** ESLint and Prettier are configured for this project. Ensure your code adheres to the rules defined in the configuration files (`eslint.config.mjs`, `.prettierrc`, etc.). Run the linting commands before committing.
*   **Naming Conventions:**
    *   **Variables & Functions:** Use `camelCase`.
    *   **Classes & Interfaces:** Use `PascalCase`.
    *   **Constants:** Use `UPPER_SNAKE_CASE`.
    *   **Files:** Use `kebab-case.ts` or `kebab-case.tsx`. Component files can be `PascalCase.tsx`.

## 3. TypeScript Specifics

*   **Typing:** Strive for strong type safety. Use `unknown` instead of `any` when the type is truly unknown and needs to be checked.
*   **Type Manipulation:** Keep type manipulation to a minimum. Avoid complex conditional types, mapped types, or extensive use of generics unless absolutely necessary for creating reusable, type-safe components or functions. Simple, clear types are preferred.
*   **Interfaces vs. Types:** Use `interface` for defining the shape of objects and classes. Use `type` for unions, intersections, or more complex type definitions.
*   **Non-null Assertion:** Avoid using the non-null assertion operator (`!`). Instead, use proper type guards or checks to ensure a value is not `null` or `undefined`.

## 4. Dependencies & Libraries

*   **Use Well-Known Libraries:** Prefer established, well-maintained libraries over building custom solutions for common problems.
*   **Package Manager:** Use `npm` for all projects within the monorepo.

## 5. Backend (NestJS)

*   **Validation:** Always use `class-validator` and `class-transformer` to validate and transform incoming data (DTOs) in controllers. This ensures that data entering the service layer is already in the expected shape and type.
*   **Modularity:** Structure the application into modules. Each feature should have its own module.
*   **Services:** Business logic should reside in services. Controllers should be lean and only responsible for handling HTTP requests and responses.
*   **Dependency Injection:** Use NestJS's built-in dependency injection system.

## 6. Frontend (React/Vite)

*   **Component Structure:** Keep components small and focused on a single responsibility.
*   **State Management:** For simple state, use React's built-in hooks (`useState`, `useReducer`, `useContext`). For more complex, shared state, a dedicated library like Zustand or Redux Toolkit may be considered after discussion.
*   **Hooks:** Create custom hooks to encapsulate and reuse stateful logic.
*   **Styling:** Follow the existing styling conventions (e.g., standard CSS files, CSS Modules).

---
This document is a living guide and will be updated as the project evolves.
