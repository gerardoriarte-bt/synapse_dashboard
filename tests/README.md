# `tests/` · dónde viven las pruebas

Todas las pruebas se agrupan acá, en una carpeta que **espeja `src/`**:
`tests/render/grid.test.ts` prueba `src/render/grid.ts`. Nada de `.test.ts`
suelto dentro de `src/`.

## Por qué afuera de `src/`

`.cursorrules` admite «junto al código o en `__tests__/` dentro del módulo».
Esta carpeta se aparta de eso a propósito, por dos razones concretas:

1. **F0.8 · los mocks no entran al bundle.** Los handlers de MSW son datos
   falsos. Mientras vivan fuera de `src/`, ninguna superficie puede importarlos
   ni por accidente: no hay ruta relativa que llegue, y el `@/` apunta a `src/`.
   `api/client.ts` lo declara en su cabecera —«sin imports de mock»— y la
   frontera física lo hace cumplir sin depender de la revisión.
2. **`render/` no importa valores de `api/`.** Un chequeo de frontera que barre
   `src/` no tiene que aprender a saltear archivos de prueba, que sí importan de
   todos lados por definición.

El precio es que las pruebas no ven exports internos de un módulo. Es el precio
correcto: se prueba la superficie pública, que es la que otro código usa.

## Cómo correrlas

| Comando | Qué hace |
|---|---|
| `npm test` | una corrida, la que va en la puerta |
| `npm run test:watch` | reejecuta al guardar |
| `npm run test:ui` | el explorador de vitest |

## El entorno por defecto es `node`

Levantar un DOM para probar una función pura es tiempo de arranque regalado. El
archivo que renderiza lo pide con un comentario en la primera línea:

```ts
// @vitest-environment jsdom
```

`tests/setup.ts` detecta el entorno y solo carga los matchers de
`@testing-library/jest-dom` y los dobles de jsdom cuando hay `document`.

## HTTP mockeado, nunca fixtures importados

Un contenedor se prueba contra MSW, que intercepta a nivel de red. Importar un
fixture desde una superficie es el anti-patrón que declara §4 de
`nuevo-desarrollo.md`: acopla la superficie a datos falsos y el acoplamiento
sobrevive al deploy.

El servidor está configurado con `onUnhandledRequest: 'error'`. Una petición sin
handler **falla la prueba** en vez de colgarse: una prueba que espera datos que
nunca llegan se ve igual que una que pasa, hasta que no.

## Sobre escribir la aserción

La lección del 2026-08-20 fue 184 pruebas en verde sobre una implementación que
violaba §3.1 de tres formas. **La aserción se escribe desde la regla citada, no
mirando el código.** Una prueba derivada de la implementación no puede fallar
nunca, ni cuando el código está mal.
