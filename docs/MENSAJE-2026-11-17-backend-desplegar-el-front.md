# Para el equipo de backend · desplegar el front de `main` en QA · 2026-11-17

**Medido contra `8523981` el 2026-11-17**, que es `main` hoy: `npm run verify`
y la imagen pasan en el PR. Del lado de QA, ese mismo día y sólo leyendo: el
bundle que sirve `qa-synapse.lobueno.co` trae la ruta del dato por métrica
(`f475ba9`) y no trae el arreglo de `6381d3b`. Así que QA está en algún punto
entre los dos.

Hola. Les pedimos **desplegar el front desde `main` (`8523981`) en QA.** No
hace falta nada de su lado: su API en QA ya sirve todo lo que este front usa.

## Por qué

En el editor de UA MX no se podía componer: ningún panel mostraba su gráfico,
y no se podía ver si la posición y el tamaño quedaban bien. Eran dos cosas:

- **Un panel sin dato se dibujaba en una sola celda**, aunque midiera 12 × 4.
  Lo arregla `6381d3b`.
- **El editor no traía el dato si el rol con que lo pide no tiene la
  pestaña.** El preview contesta `tabs: []`, y el lienzo quedaba vacío. Lo
  arregla `4951558`: con «Todos los roles» usa el dato del catálogo, de
  `GET /admin/tenants/{tenantId}/catalog/data`, que su `a80c318` ya sirve en
  QA. Lo medimos: 41 métricas, 31 con dato para 2026-10.

En UA MX lo destrabamos mientras tanto agregando la pestaña a los roles
`admin` y `user` con `PUT /admin/roles/{roleId}`. Con este despliegue no hace
falta repetirlo para cada pestaña nueva.

## Lo que entra

| Commit | Qué |
|---|---|
| `99489c9` | Documentación: sus respuestas del dato por métrica y del orden de los paneles, medidas |
| `3da9ae6` | El dashboard de Terpel, listo para aplicar. No cambia la aplicación |
| `6381d3b` | Un panel sin dato ocupa su lugar entero en el lienzo |
| `4951558` | El editor dibuja los paneles aunque el rol no tenga la pestaña |

## Cómo lo comprobamos

En el editor de UA MX, con «Todos los roles», cada panel se dibuja con su
cifra. Un panel sin dato muestra su aviso del ancho y el alto del panel.

Gracias.
