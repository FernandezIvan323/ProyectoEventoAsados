## Descripción

Descripción clara del cambio. Enlazar el issue relacionado si existe (`Closes #123`).

## Tipo de cambio

- [ ] Bug fix (cambio que arregla un issue sin romper funcionalidad)
- [ ] Nueva funcionalidad (cambio que agrega capacidad sin romper la existente)
- [ ] Breaking change (fix o feature que causaría que funcionalidad existente no funcione como antes)
- [ ] Refactor (cambio de código que no arregla bug ni agrega feature)
- [ ] Documentación
- [ ] Tests
- [ ] Chore (CI, dependencias, etc.)

## ¿Cómo se probó?

Describir las pruebas realizadas:
- Tests unitarios: `cd backend && npm run test:unit` / `cd frontend && npm test`
- Tests de integración: `cd backend && npm run test:integration`
- Verificación manual: pasos seguidos
- Capturas / logs (si aplica)

## Checklist

- [ ] Mi código sigue las convenciones del proyecto (lint pasa: `cd frontend && npm run lint`)
- [ ] Agregué tests que prueban mi cambio
- [ ] Los tests nuevos y existentes pasan localmente
- [ ] Actualicé la documentación relevante (README, CHANGELOG, OpenAPI)
- [ ] Si agregué un nuevo endpoint, lo documenté en `docs/openapi.yaml`
- [ ] Si agregué un campo de Prisma, generé la migración: `npx prisma migrate dev --name <nombre>`
- [ ] Si agregué UI, agregué traducciones en `frontend/src/lib/locales/es.json` y `en.json`
- [ ] Si agregué una variable de entorno, la documenté en el README

## Notas adicionales

Cualquier contexto extra para el revisor.
