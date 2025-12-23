# Auth Module

## Purpose
Handles authentication (JWT) and authorization (RBAC) for the application.

## Key Components
- **AuthService**: Validates users and signs JWT tokens.
- **JwtStrategy**: Extracted from `passport-jwt`, validates the token and attaches the `User` to the request.
- **RolesGuard**: Checks if the authenticated user has the required `Role` (Admin/User).
- **Roles Decorator**: `@Roles(Role.Admin)` metadata for route protection.
- **GetUser Decorator**: Custom decorator to extract the `User` object from the request.

## Flows
1.  **Login**: `POST /auth/login` with email/password -> returns `{ access_token }`.
2.  **Protection**: Apply `@UseGuards(AuthGuard('jwt'))` to controllers.
3.  **RBAC**: Apply `@Roles(...)` and `RolesGuard` to restrict access.
