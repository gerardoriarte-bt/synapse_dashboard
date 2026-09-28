# Bitácora · 2026-09-28 · la puerta en verde y la aplicación sin arrancar

> Lo que el `git log` no cuenta. Este día se remidieron las nueve rutas contra
> `f70cec2` y se cerró el camino de `chart`; lo que sigue es lo que costó
> descubrir, que es otra cosa.

## El resumen, y es incómodo

**`npm run verify` salió verde con 1025 pruebas y el modo mock no arrancaba.**
Pantalla negra con «No se pudo cargar tu contexto · SIN DETALLE DEL SERVIDOR»,
que además le atribuye al servidor un error nuestro.

Y detrás de eso había cuatro cosas más, **todas encontradas mirando y ninguna por
un chequeo**:

| | Qué se veía | Qué era |
|---|---|---|
| 1 | La consola no arrancaba | El contexto del mock no traía `scope` · `adaptContext` lee `w.scope.kind` |
| 2 | «Este cliente todavía no tiene un dashboard» | Faltaban `dashboards` y los dos ids activos |
| 3 | El panel apilado dibujaba **dos líneas** | El handler de `/config/tabs` copia campo por campo y `chart` no estaba escrito |
| 4 | El navbar decía `UNDER ARMOUR MÉXICO` | El adaptador leía `name` en `scope.tenants[]` donde el resto ya lee `label` |
| 5 | `STALE DATA: LAST MATERIALIZATION IS OLDER THAN 3 DAYS` | El copy del mock en inglés, cuando el servicio real ya lo manda en español |

## Lo que cada una enseña, que no es lo mismo

### 1 y 2 · un mock se queda atrás del cable sin que nada avise

Los dos son el mismo: campos que se transcribieron al cable —`scope`,
`period_grain`, `periods_detail`, `dashboards`— y que **el mock nunca recibió**.

**Ninguna prueba podía verlo.** Las de consola construyen su contexto con los
campos que cada una necesita, y las de adaptador construyen el suyo. El contexto
del modo mock es el único objeto que tiene que estar completo, y es el único que
nadie afirma.

Y el síntoma es peor que un error: `w.scope.kind` sobre `undefined` es un
`TypeError` sin `message`, así que el envoltorio de error lo pinta como «sin
detalle del servidor». **Un bug nuestro presentándose como una falla de ellos.**
Es la misma familia que el `active_layout_id: null` del 26.

### 3 · el `map` que copia campo por campo silencia lo nuevo

El handler de `/config/tabs` construye la respuesta nombrando cada campo. Está
bien que lo haga —un `...p` devolvería campos que el cable no declara, que es la
otra forma de mentir— pero **el modo de falla es que se vea bien**: el panel
apilado se dibujó como dos líneas superpuestas.

Un dibujo equivocado no se parece a un panel roto. Se parece a un panel.

**Y esto ocurrió con la prueba de cadena ya escrita y en verde**, que es lo que
más conviene no perder: `graficoViaja.test.tsx` monta la consola contra MSW y
sigue el id por los cuatro saltos. Mata tres mutaciones. **Y no cubre el modo
mock**, porque el modo mock tiene sus propios handlers en `dev/`, que es
justamente lo que F0.8 pide. La cobertura de una frontera no se hereda.

### 4 · dos nombres para el mismo cliente, en la misma barra

Al transcribir `tenant.label` se adaptó el tenant activo y **no** la lista de
`scope.tenants[]`, que el servicio también manda con `label` —medido—. La barra
mostraba la forma corta en un lado y el nombre largo en el selector.

**No hay chequeo que encuentre esto**, y no es un hueco de herramienta: los dos
valores son correctos, los dos vienen del servicio, y lo que está mal es *cuál*.
Eso se ve.

### 5 · un regalo del backend que el mock no recibió

`reason` y `unlocks_with` **pasaron a español y no lo habíamos pedido**. El mock
se quedó con la frase vieja, así que el modo que existe para mirar el producto
mostraba un idioma que el producto ya no habla.

## Y la que se descubrió escribiendo la prueba

El fixture de `multi_series` se escribió con `name` donde el cable pide `label`.
**Falló en silencio**: el `flatMap` del adaptador descarta la serie sin rótulo, la
lista quedó vacía, y el panel dijo «Sin datos» — no se rompió, se degradó.

Es exactamente el tercero de los tres fixtures del 2026-09-04, el que enseñaba:
«el rótulo salía vacío y la prueba pasaba igual». Cuatro años después de esa
lección en días, el mismo error.

## Lo que se cambió de método, que es poco y concreto

1. **`dev/mocks/browser.ts` lleva escrito que un campo nuevo del cable se agrega
   ahí también**, junto al `map` que lo silencia, con el síntoma anotado: que se
   vea bien.
2. **Los fixtures de `label` se escriben DISTINTOS de `name`.** Con los dos
   iguales el fixture no distingue cuál se leyó, que es cómo el defecto del punto
   4 sobrevivió a una prueba. Anotado en `handlers.ts` y en `datos.ts`.
3. **La prueba de cadena existe y se declara qué NO cubre.** Cubre
   `api → Console → PanelInGrid → Panel → cuerpo` contra MSW. No cubre `dev/`.

## Lo que NO se cambió, a propósito

**No se automatizó «el mock está al día con el cable».** Se pensó: un chequeo que
compare las claves del contexto del mock contra el esquema `ContextResponse`. Es
escribible y encontraría 1 y 2.

Pero **no habría encontrado 3, 4 ni 5**, que son los tres donde la pantalla se veía
bien: un handler que omite un campo opcional es válido, leer `name` en vez de
`label` es válido, y una frase en inglés es una cadena como cualquier otra. Un
chequeo que ataja los dos baratos y deja pasar los tres caros **invita a confiar
en él**, y esa confianza es justo lo que hizo que el modo mock pasara meses sin
abrirse.

Queda como lo que ya estaba escrito: **lo que existe para mirarse, se abre.**
