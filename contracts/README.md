# `contracts/`

## `synapse-api.yaml` — el contrato de la API

**Vivía en `gerardoriarte-bt/Synapse-v2` y se mudó acá el 2026-09-01**, para que
este repositorio compile y regenere sus tipos sin depender de otro.

Es **la fuente de los dos lados**. Lo escribió el front derivándolo de §4 de
`design.md` y de lo que C1 ya consumía, y el backend lo adopta: al hacerlo deja
de ser propuesta y pasa a ser el contrato (tarea B0.5).

```bash
npm run gen:api     # regenera src/api/generated.ts desde este archivo
```

`src/api/generated.ts` **no se edita a mano**: se pisa en la próxima generación.

## Reglas

- **Un solo archivo, un solo lugar.** No hay copia en `Synapse-v2`; ahí quedó un
  puntero. Dos copias de un contrato es la forma más rápida de que el front y el
  backend dejen de hablar el mismo idioma.
- **Las decisiones que el front no puede tomar van marcadas `# PREGUNTA:`.**
  Contestarlas en el propio archivo es suficiente — es la tarea B0.9, y quedan
  cinco abiertas.
- **Los endpoints de admin y builder todavía no están** (B0.6). El alcance actual
  es la consola.

## Qué se rompió al mudarlo, y cómo quedó

En `Synapse-v2`, `contract-drift` comparaba `src/api/generated/api.ts` contra
este archivo. Al mudarse, ese chequeo pasa a **BLOQUEADO** —la convención de esa
puerta para «no hay contra qué comparar»— y lo dice apuntando acá. Es correcto:
el front de ese repositorio es el que este proyecto reemplaza.
