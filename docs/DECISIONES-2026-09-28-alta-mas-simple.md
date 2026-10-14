# Decisiones · el alta de un cliente se optimiza para que sea FÁCIL · 2026-09-28

> **Decisión humana del 2026-09-28:** *«las decisiones creo que hay que
> implementar lo que sea más fácil de dar alta a nuevos clientes»*.
>
> Eso es una decisión sobre **el criterio**, y alcanza para resolver tres de las
> cuatro preguntas abiertas. La cuarta queda nombrada con lo que le falta.
> Contesta `docs/PROPUESTA-2026-09-28-pantallas-de-alta.md`.

## 0 · Lo que el criterio cambia · el orden, no la lista

Aplicarlo obliga a separar dos cosas que estaban juntas:

| | |
|---|---|
| **Irreducible** | El cliente tiene que tener el dato en Snowflake, con forma. Ninguna decisión nuestra lo evita |
| **Nuestro** | Cuánto cuesta **descubrir** que algo falta, y cuánto **repetir** lo ya hecho |

**El costo de un alta hoy no está en los pasos: está en los dos silencios.** Una
columna que falta y una clave que no cae en el registro **se manifiestan igual** —
paneles bloqueados sin razón— y las dos se descubren al final.

Todo lo de abajo sale de eso.

## 1 · D2 · la plantilla · **ya está resuelta, y no por nosotros**

La propuesta la marcaba como el bloqueo más grande: sin plantilla de vertical, el
bloque de A2 en alta no tiene qué decir y cada cliente se compone desde cero.

**El `.pen` la resolvió hoy con `B7 · Guardar como plantilla`**, y su nota lo
declara: *«LA CASCADA DE §3.4 IBA EN UN SOLO SENTIDO… la dirección del 2026-09-28
agrega el movimiento inverso: el admin da de alta, compone, y ESA composición se
promueve a plantilla.»*

**Es el modelo más barato que había disponible**, y coincide con lo que producto
ya había dicho —«se elabora el dashboard y eso se puede guardar como plantilla,
pero no es exigencia en este momento»—:

- **Nadie autora plantillas por adelantado.** No hay que inventar
  `retail_apparel_v2` antes de tener un cliente de retail.
- **El primer cliente de una vertical cuesta lo que cuesta.** El segundo hereda.
- **Los ya creados no se tocan**: `plantillaOrigen` es un puntero versionado.

**Y una plantilla es composición, no cifras** — se lleva pestañas, paneles, spans,
tipos y opciones; no los overrides por rol ni los datos. El panel lo dice en
pantalla en vez de que se descubra al usarla.

**Sigue sin backend**, medido contra `6e595e3`: `vertical` no aparece en su código
y su `Tenant` no la tiene. **Es el pedido más grande que sale de acá.**

## 2 · D3 · `EN ALTA` se DERIVA, no se guarda

**Decidido por el criterio.** Un estado guardado es un campo más que alguien tiene
que poner bien en el alta y mantener después; uno derivado no se puede
desincronizar y no agrega ningún paso.

```
EN ALTA  ⟸  el tenant no tiene roles  Y  no tiene catalog_version
```

Las dos condiciones ya viajan: `roles: []` y `catalog_version` en `—`, que es
justo lo que el frame pinta. **Y la decisión del 2026-09-26 queda intacta**: sus
tres valores —`ACTIVO`, `PILOTO`, `SUSPENDIDO`— siguen siendo los guardados.

Es además coherente con lo que esa decisión descartó: *«Inventar un estado para
sostener una acción que nadie dibujó es el defecto de siempre»*. Acá no se
inventa ninguno.

## 3 · D1 · las credenciales · **dos altas, y la plataforma genera la clave**

El conflicto era: `POST /admin/tenants` exige siete campos de infraestructura y
§7.3 prohíbe pedirlos en pantalla.

**Decidido por el criterio, en dos partes.**

### 3.1 · El alta es de dos pasos · opción (c)

El equipo interno crea el tenant con sus credenciales; el super-admin lo **adopta**
en A1 eligiendo plantilla. Es lo único que explica por qué el dibujo muestra
`axo_mx` ya existiendo con `roles: []`, y deja §7.3 sin excepciones.

**Y no agrega un paso**: el trabajo de Snowflake ya obliga a que el equipo interno
participe —`sync-catalog` no tiene ruta HTTP—. Lo que hace es **poner el
hand-off donde ya estaba** en vez de inventar uno nuevo.

### 3.2 · La clave RSA **la genera la plataforma** · pedido nuevo

Hoy alguien genera el par por fuera y **transporta una clave privada** hasta el
formulario. Eso es un paso manual y un canal de secreto por cada cliente.

**Propuesta: que el backend genere el par y devuelva sólo la pública**, para que
el admin de Snowflake del cliente la registre. La privada nunca sale del servicio.

| | Hoy | Propuesto |
|---|---|---|
| Quién genera | Una persona, a mano | El servicio |
| Qué circula | **La privada**, por algún canal | **La pública** |
| Pasos del alta | Generar · transportar · pegar | Copiar la pública |

**Es más fácil y además más seguro**, que es la única combinación que no obliga a
elegir. **No rompe §7.3**: una clave pública para entregar no es «nombre de base,
rol técnico, warehouse ni grant», y hay precedente en la excepción de los
subprocesadores.

**Requiere backend** y hoy `private_key_pem` es obligatorio en el alta.

## 4 · LO QUE MÁS BAJA EL COSTO, Y NO ESTABA EN LA PROPUESTA

Aplicar el criterio hizo aparecer dos cosas que ninguna de las tres decisiones
cubría, y **las dos valen más que cualquiera de ellas**.

### 4.1 · Verificar el contrato ANTES · **lo más barato de construir**

Hoy una columna que falta se descubre cuando los paneles salen bloqueados, al
final de todo, y el síntoma no la nombra.

**Es comprobable en una consulta.** Un `DESCRIBE` de los dos objetos contra las
quince columnas, y de `SYNAPSE_METRIC_CATALOG` contra sus doce, dice exactamente
qué falta y **antes de crear nada**.

```
POST /admin/tenants/{id}/verify-contract
→ { ok: false, faltan: ["BUDGET_TARGET"], afecta: ["goal_attainment"] }
```

**Lo que lo hace valioso no es el chequeo: es el `afecta`.** Traduce «falta una
columna» a «este panel no vas a poder tenerlo», que es lo que alguien necesita
para decidir si sigue.

Y **esto sí puede tener pantalla sin romper §7.3**, porque su salida es
consecuencia y no plomería: «este cliente no va a poder tener `Cumplimiento de
objetivo` · falta un dato de presupuesto en su origen».

**Es el mayor ahorro por peso**: convierte un día de depuración en un minuto, y
es una consulta.

### 4.2 · `sync-catalog` como ruta HTTP

Medido: `POST /admin/tenants/{id}/sync-catalog` da **404**; sólo existe
`make sync-catalog`. **Es lo único que obliga a entrar a la máquina del backend**
en toda el alta — la materialización ya tiene su ruta y contesta 202.

Con esa ruta, el alta pasa a ser enteramente remota. **Es el paso que separa «hay
proceso» de «hay alta».**

## 5 · El orden, ya con el criterio aplicado

Ordenado por **cuánto ahorra por cliente nuevo, dividido por lo que cuesta**:

| | Qué | De quién | Por qué acá |
|---|---|---|---|
| 1 | **Verificar el contrato** · §4.1 | Backend | Una consulta · mata el silencio más caro |
| 2 | **`sync-catalog` como ruta** | Backend | Chico · cierra el alta remota |
| 3 | **La clave la genera la plataforma** · §3.2 | Backend | Saca un paso manual y un canal de secreto |
| 4 | **`B7` + la herencia de plantilla** · §1 | Backend **y** front | El más caro y el que más ahorra a partir del segundo |
| 5 | **`A2 · tenant en alta`** | Front | Dibujada · se construye cuando 4 exista |
| 6 | **La hoja de alta en A1** | Front | Su forma depende de §3.1, ya decidido |

**Los tres primeros son todos del backend y ninguno es grande.** Con esos tres, un
alta deja de necesitar a alguien con acceso a la máquina y deja de fallar en
silencio — que era el costo real, no la cantidad de pasos.

## 6 · Lo que sigue abierto, y quién lo tiene

| | Qué falta | De quién |
|---|---|---|
| **B7** | Qué pasa con los paneles marcados como heredados al promover la composición | Producto · lo pregunta la nota del `.pen` |
| **B7** | Si una plantilla puede crearse desde cero o sólo desde una composición | Producto · ídem |
| **§4.1** | Si `verify-contract` corre solo al crear el agente o se dispara a mano | Backend · es una decisión de forma |
| **`B1.26`** | Sigue ⬜, pero **el criterio ya eligió su opción A** de hecho: el contrato de forma es lo que §4.1 verifica. Falta escribir la decisión y ponerle fecha a B | Producto + backend |

**`B1.26` es el único que no se cierra acá**, y conviene decir por qué: su
pregunta era A contra B, y aplicar el criterio elige **A** —barato y rígido— pero
su propio criterio de aceptación pide que *«si se elige A, B queda declarado como
destino y con fecha»*. **La fecha no la puede poner el front.**
