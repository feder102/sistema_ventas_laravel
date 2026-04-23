# Mejoras a Futuro

## 1. Autenticación: migrar a httpOnly cookies con Sanctum SPA

**Contexto:**  
En el commit `4dab0be` se quitó `statefulApi()` de `api/bootstrap/app.php` porque estaba bloqueando el login con Bearer token (devolvía 419). Como consecuencia, la autenticación actual usa Bearer tokens almacenados en `localStorage`.

**Problema:**  
Los Bearer tokens en `localStorage` son vulnerables a XSS: cualquier script inyectado puede leerlos y robar la sesión. Las httpOnly cookies son inmunes a XSS porque JavaScript no puede accederlas.

| | Bearer token (localStorage) | httpOnly cookie + CSRF |
|---|---|---|
| XSS | Vulnerable | Inmune |
| CSRF | Inmune | Requiere token CSRF |

**Implementación propuesta:**

1. Restaurar `statefulApi()` en `api/bootstrap/app.php`:
   ```php
   ->withMiddleware(function (Middleware $middleware): void {
       $middleware->statefulApi();
   })
   ```

2. Ajustar `frontend/src/api/client.ts` para volver a modo SPA:
   - Agregar `withCredentials: true` al axios client
   - Solicitar el CSRF cookie antes del login: `GET /sanctum/csrf-cookie`
   - Quitar el header `Authorization: Bearer` manual

3. Ajustar `docker-compose.yml`:
   - Asegurarse que `SESSION_DRIVER=redis` esté configurado
   - Verificar que `SANCTUM_STATEFUL_DOMAINS` incluye el origen del frontend

4. Ajustar `api/config/sanctum.php` o `.env` para que `SESSION_DOMAIN` coincida con el dominio del frontend.

**Prioridad:** Media — relevante si la app se expone fuera de una red interna o se agregan inputs de texto rico.
