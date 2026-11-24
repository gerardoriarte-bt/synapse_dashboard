# Para el equipo de backend · el parámetro `thresholds` en `kpi` y `gauge` · 2026-11-24

**Medido contra `f1ccbbe` el 2026-11-24**: leí
`internal/adapters/repository/dd_seed_blocks.go`. Del front, contra el PR #126
(`front/semaforo-y-eje-doble`), que pinta el semáforo y prueba que el builder
manda `thresholds` en el `PUT` del layout.

Hola. Un pedido chico, que sigue a
`docs/MENSAJE-2026-11-24-datos-rentabilidad-ua.md` §5. Los indicadores con
meta van a pintar su estado (bien, aceptable o mal) según dos cortes que
define datos. Los cortes se cargan en el panel como parámetro de layout, igual
que hoy la `banda` del medidor:

```json
{ "thresholds": { "bien": 3.0, "mal": 1.5 } }
```

Hoy `layout_params` declara `["comparative", "meter"]` para `kpi` y
`["band", "components", "maximum"]` para `gauge`. Un parámetro que no está ahí
el front lo descarta, y el builder no ofrece el campo.

**Pedido:**

1. Sumar `"thresholds"` a `layout_params` de `kpi` y de `gauge` en
   `defaultBlockSeedRows`.
2. **Y actualizar las filas que ya existen.** `seedBlocks` usa
   `OnConflict{DoNothing: true}`, así que en QA cambiar la lista del código no
   alcanza. Hace falta un `UPDATE dd_blocks SET layout_params = …` para esos
   dos `block_type`.

No hace falta validarlo del lado de ustedes: `options` se guarda como viene.

Para comprobarlo, `GET /config/blocks` en QA tiene que devolver `thresholds`
en los dos.

Gracias.
