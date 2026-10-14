# Qué pantallas faltan, discriminadas · 2026-09-30

> **Histórico.** Un corte con fecha. No se actualiza: se reemplaza.

**La pregunta que lo originó:** «faltan muchas pantallas y en un reporte anterior
me dijiste que ya podíamos desplegar, pero 18 de 36 me hace ruido».

**Tenía razón en desconfiar del número, y el número era nuestro.**

---

## 1 · El «18 de 36» estaba mal, y lo decía nuestra propia puerta

`npm run pen-pantallas` imprimía:

```
36 pantallas dibujadas · 18 con archivo y ancla · 18 declaradas sin construir
```

La segunda mitad **contaba toda fila del registro que no nombrara un archivo
`src/`**, y ocho de esas dieciocho están construidas: son las que delegan en el
componente que otra fila ya nombra.

| Fila del registro | Qué decía la herramienta | Qué es |
|---|---|---|
| `C1 · Brand Momentum` → «la misma `Console`: la pestaña la manda el layout» | sin construir | **construida** |
| `A3 · Usuarios · filtro sin resultados` → «lo pinta `EmptyRow` con `clase="filtro"`» | sin construir | **construida** |
| `C5 · Sin permiso · sin alternativas` → «sin manejador no se pinta el CTA» | sin construir | **construida** |

…y cinco más iguales.

**Es exactamente el defecto que este repositorio persigue en el código y se le
escapó en su propia herramienta: un rótulo que promete una cosa y mide otra.** Y
salía en la puerta todos los días, así que el número equivocado estaba a la vista
sin que nadie lo leyera como equivocado.

**Corregido.** Ahora imprime tres clases y no dos:

```
36 pantallas dibujadas · 27 construidas (19 con archivo propio, 8 cubiertas por otra) · 9 sin construir
```

**Son 27 de 36, no 18.** Y de las nueve que faltan, ninguna es una pantalla rota:
son entradas que no existen.

---

## 2 · Las nueve que faltan, por quién las traba

Medido el 2026-09-30 contra el servicio corriendo en `:4010` —upstream
`de881e1` más tres commits nuestros— y contra su repositorio.

| Pantalla | La traba | Evidencia medida hoy |
|---|---|---|
| **B6 · Historial de versiones** | **NADIE · es tomable** | `GET /admin/layouts/{id}/publications` → **200 con filas reales** |
| **A2 · Ficha · tenant en alta** | **Producto y diseño** · 3 decisiones | `POST /admin/tenants` existe · `GET /admin/tenants` da 13 columnas |
| **C1 · Forecast** | **Datos** | Espera 2 filas de catálogo, ya pedidas |
| **B3 · gráfico deshabilitado por tope** | **Decisión nuestra** · F4.12 | El builder va sin payloads a propósito |
| **C2 · Drill-down de panel** | **Decisión D3** | Su ruta **existe**: `/config/panels/{id}/drilldown/dimensions` → 200 |
| **C4 · Detalle de hallazgo** | D3 **y** servicio | `/config/accionables` → **404** |
| **C4 · Hallazgo fuera de banda** | ídem | ídem |
| **A6 · Cola de accionables** | ídem | ídem |
| **B7 · Guardar como plantilla** | **Backend** | `/admin/templates` y `/admin/verticals` → **404** |

**Leído por dueño:** una es nuestra y está lista para tomar, una espera decisiones
de producto, una espera datos, cuatro están diferidas por una decisión escrita
(D3) y dos esperan al backend.

---

## 3 · Cuatro candados que habían vencido sin que nadie lo notara

Esto es lo que más vale del ejercicio, y es la misma falla registrada: **una razón
escrita cuando era cierta envejece sin aviso**.

### 3.1 · B6 · «ninguna ruta lista versiones con su autor y fecha»

**Falso desde `168a761`.** La ruta contesta 200 y trae más de lo que el registro
le pedía:

```
version_id · action · actor_user_id · actor_role · previous_layout_id · created_at
diff: { summary: {tabs_added, panels_added, panels_changed, panels_removed}, … }
```

Y `POST /admin/layouts/{id}/revert` cubre el «REVERTIR A ESTA» que el dibujo pide.
**Lo único que no llega es el NOMBRE del autor** —el `.pen` pinta
`MARÍA RESTREPO · 14 AGO 2026, 16:20` y la ruta da el uuid—, y eso lo resuelve
`GET /admin/users`, que también contesta 200.

### 3.2 · A3 · «no hay ruta que liste usuarios de todos los clientes»

**Falso desde `6e521cc`.** `GET /admin/users` → **200**, con `total`, `tenants` y
`tenant_name` por usuario. Es exactamente el alcance de plataforma que A3 dibuja y
que la pantalla declara no tener.

### 3.3 · A1 · «`GET /admin/tenants` devuelve `id` y `name`»

**Falso.** Devuelve trece campos, incluidos `status`, `vertical`, `user_count`,
`last_published_at`, `worst_feed_status` y `worst_feed_freshness_hours`.

**Con un matiz que importa y que se comprobó en su código**: `status` y `vertical`
están declarados «reservados hasta que el cliente defina sus valores (siempre nil
en v1)». Así que las dos columnas que A1 declara faltantes **existen en el cable y
llegan vacías** — que es distinto de no existir, y distinto de estar listas.

### 3.4 · Y dos avisos FALSOS que se le pintan al usuario

Los peores, porque no son documentación: son la pantalla del builder.

| Pantalla | Lo que decía | Lo cierto |
|---|---|---|
| `B3 · Selector de gráfico` | «Pendiente · esa lista la sirve `/config/plots`, que no existe» | **La ruta existe desde el 2026-09-29 y el selector está construido (F4.21)** |
| `B6 · Historial` | «`LayoutVersion` trae cuándo y nada más: ni autor ni diferencia, y tampoco hay ruta para revertir» | Las tres afirmaciones son falsas |

**B3 no era una pantalla pendiente: era una pantalla que vive en otra**, igual que
el binder de métrica — el selector se monta dentro del configurador de panel,
porque elegir el gráfico de un panel exige tener el panel elegido. Mientras estuvo
mal declarada, el builder le decía a un cliente que algo construido estaba
pendiente.

**Y había tres pruebas sosteniendo lo falso.** Una pedía literalmente que la
pantalla «nombre `/config/plots`» y otra que «nombre los dos campos que el cable
no trae». Estaban escritas mirando la implementación, así que no podían fallar
cuando la realidad cambió. Las tres se reescribieron y la corrección se verificó
por mutación.

**La mutación que lo probó falló primero por no ser fiel:** mover `grafico` de
vuelta a «pendientes` sin sacarlo de «está en otra pantalla» **sobrevivió**,
porque la segunda tabla gana en el render. Reproducido el defecto real —sale de
una y entra a la otra—, muere.

---

## 4 · Entonces, ¿se puede desplegar?

**Sí, y las dos cosas son ciertas a la vez** — pero conviene decir qué significa.

**Lo que un usuario puede recorrer entero:** las cuatro rutas de la aplicación
—`/login`, `/`, `/admin/*`, `/builder/*`— existen y responden. La consola con sus
paneles, sus estados, el chat contra Cortex y el selector de dashboard; las cinco
pantallas de administración de §7.3; y el builder con contexto, canvas, binder,
selector de gráfico y vista previa por rol.

**Ninguna de las nueve que faltan deja un callejón sin salida.** Se comprobó:
`onDrill` no se pasa desde ninguna superficie, así que **el CTA de drill-down no se
pinta** — la regla de la casa «un CTA sin manejador no se pinta» está haciendo su
trabajo. Las dos entradas del builder que llevan a pantallas sin construir muestran
un aviso que dice qué van a mostrar, no un error.

**Lo que NO se puede hacer todavía**, y hay que decirlo antes de mostrarlo:

- Ver el historial de publicaciones ni revertir a una versión anterior.
- Dar de alta un cliente nuevo desde el front.
- Bajar a los cortes de un panel (drill-down).
- Trabajar la cola de accionables ni el detalle de un hallazgo.
- Guardar una composición como plantilla de vertical.

**Y una que sí se ve y conviene mirar antes**: la auditoría de usabilidad del mismo
día —`docs/AUDITORIA-2026-09-30-usabilidad.md`— encontró notas de desarrollo
renderizadas como interfaz en administración y en el builder. **Dos de ellas se
corrigieron hoy**, que son las de este informe; la de administración y la de
contexto siguen.

---

## 5 · Lo que yo tomaría, en orden

1. **B6 · Historial de versiones.** Es la única de las nueve sin nadie enfrente, el
   servicio ya entrega el diff completo, y es la que más se nota que falta porque
   **la entrada existe en el navbar**.
2. **A3 · alcance de plataforma.** La ruta global responde; es cambiar de qué
   endpoint se lee y quitar la declaración de alcance de la pantalla.
3. **A1 · las dos columnas.** Llegan vacías, así que lo honesto es pintarlas con su
   estado «sin definir» en vez de omitirlas — y preguntarle a producto cuándo se
   llenan.

Las otras seis no dependen de nosotros, y cada una tiene su razón medida arriba.

---

## 6 · Cómo se midió

Servicio local en `:4010`, binario `/tmp/synapse-api-v11` construido desde
`feature/config-plots` del fork —upstream `de881e1` más tres commits nuestros—.
**Cada ruta que se reporta como suya se verificó con `git log -L` sobre su línea
del router**, porque medir con el fork levantado hace que nuestro propio código se
vea como avance de ellos: es una trampa ya registrada y ya pagada el 2026-09-22.
`/admin/users`, `/admin/tenants`, `publications`, `revert` y `drilldown` son de
`marioantpack`.
