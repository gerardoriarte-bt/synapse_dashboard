# Para el equipo de backend · tenían razón con la cuenta · 2026-09-29 (tarde)

> Contesta su `RESPUESTA-2026-09-29-todo-medido.md`. **Verificamos lo verificable
> antes de contestar** y la única cosa que pedimos que hagan es… ninguna.

## La cuenta que no les cerraba · **el error era nuestro, y es peor de lo que vieron**

Dijeron que si de diez quedan siete y tres no dependen de ustedes, sobran cuatro
de su lado y el mensaje nombraba dos.

**La respuesta es que NO ERA NINGUNO.** Los siete, uno por uno:

| | Lo tiene | Qué falta |
|---|---|---|
| **B1.21** · `/config/plots` | **NOSOTROS** | Mandarles el archivo |
| **B1.29** · `schema-check` | DATOS | Habilitar la IP · la ruta está entregada |
| **B1.30** · `sync-catalog` | DATOS | Ídem |
| **B1.31** · `service-key` | **NOSOTROS** | Probarla en el próximo alta real |
| **B2.12** · los seis estados | DESPLIEGUE | Depende de B2.15 |
| **B2.14** · `/config/solicitudes` | PRODUCTO | Y ya lo contestaron: no está planeada |
| **B2.15** · la prosa | DESPLIEGUE | Fecha |

**Cero de siete son código suyo.**

### Y lo arreglamos en la herramienta, no en el mensaje

`docs/PARA-BACKEND.md` se llama «lo que el front necesita del backend» y les
listaba siete cosas que no eran suyas. **Ahora cada pedido declara de quién es**, y
el archivo abre con la cuenta:

```
## Antes de leer: 0 de 7 son del backend

| Dueño | Pedidos |
| BACKEND · código | 0 |
| NOSOTROS         | 2 |
| DATOS            | 2 |
| DESPLIEGUE       | 2 |
| PRODUCTO         | 1 |
```

**Un pedido sin dueño se lee como si fuera de quien abre el archivo**, y eso les
hizo perder tiempo buscando qué construir. Gracias por la cuenta: sin ella el
archivo seguía mintiendo por omisión.

## Lo único que queda de nuestro lado, y es lo que más importa

**`docs/ENTREGA-2026-09-29-repertorio-de-graficos.md` · 537 líneas.** Tienen razón
en que lo pedimos mal dos veces: las dos les dimos **una ruta de nuestro
repositorio**, que no ven. Va el contenido, no el camino.

Trae los 49 con su forma, su mínimo, su tope y su procedencia; la decisión de por
qué el mínimo es **de la forma**; y el fragmento del contrato con `GET
/config/plots`, `GraficoId`, `Grafico` y `MinimoDeDatos`.

## Su prueba de la IP nos sirvió, y cierra el asunto

Los tres `schema-check` desde su red —uno `ok: true` y dos `ok: false` por tenants
sin Gold— **prueban que el código está bien y que lo que falta es la red**. Con
eso el pedido a datos deja de ser una sospecha nuestra y pasa a tener su medición
al lado. Ya está mandado.

**Y su tabla de `ping` la tomamos como procedimiento.** Es mejor que lo que
teníamos: mirar `agents/ping` antes de tocar el alta ahorra medir dos rutas que
van a fallar por lo mismo. Queda escrita en nuestro runbook.

## Un pedido chico que salió de verificar las que nunca habíamos mirado

Hoy medimos 29 tareas `B*` que nunca habíamos verificado. **Veintiocho pasaron.**
La que no:

**`BLOCKED` es el único estado sin `unlocks_with`.** Pidiendo un período nunca
materializado —`2027-03`— vuelve con `reason` «No hay datos calculados para este
período» y **`unlocks_with` vacío**. §8 pide los tres.

Y su código ya tiene la frase: `dd_config_service.go:380` pone `Status` y `Reason`
y nada más, mientras `unlocksWaitNextRun` —«Se actualiza en la próxima
materialización»— está declarada doce líneas más abajo. **Parece una línea.**

*(Si hay una razón para que ese estado no la lleve, alcanza con decirla y lo
cerramos.)*

## Sobre el método · de acuerdo, y con una corrección nuestra

**Commit primero, documento después**: de acuerdo, y gracias por tomarlo.

Y nos toca admitir la simétrica: dijimos que `RESPUESTA-2026-09-28-tres-del-alta.md`
«no llegó» **y estaba en su repositorio, en el mismo árbol que habíamos
construido**. Lo buscamos del lado equivocado — el mismo error que les señalamos
con el repertorio, el mismo día y al revés.
