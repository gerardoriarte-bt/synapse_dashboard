# Para el equipo de backend · la moneda de UA MX es USD, no MXN · 2026-10-01

> **VENCIDO · NUNCA SE ENVIÓ.** Se dobló dentro de
> `docs/MENSAJE-2026-10-01-backend-cuatro-pendientes.md`, que junta todo lo que
> el backend tiene pendiente en un solo mensaje. El contenido sigue siendo
> correcto; lo que cambió es que no se manda suelto.


> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. **Una corrección a lo que les pedimos el 29**, y es nuestra.

---

## Lo que les pedimos, y lo que estaba mal

`docs/MENSAJE-2026-09-29-backend-tenant-colombiano.md` decía:

> Corregir los tres valores del tenant de UA MX — `es-MX`, **`MXN`**,
> `America/Mexico_City`.

**El `MXN` está mal.** Lo razonamos desde el país del cliente y no desde el dato,
que es el mismo error que el `COP` con otra divisa. Si lo aplican así, el tenant
queda rotulando como pesos mexicanos unas cifras que están en dólares.

## Lo correcto

```
locale    es-MX                  ← sí, como les pedimos
currency  USD                    ← NO MXN
timezone  America/Mexico_City    ← sí, como les pedimos
```

**Los tres campos son independientes**: un cliente mexicano, que lee en español
con separadores mexicanos, que cierra el día en Ciudad de México, y que **factura
en dólares**.

## Por qué USD · las tres fuentes coinciden, y lo medimos

**1 · El catálogo de Snowflake lo declara** · `GET /config/catalog` contra
`d9147c3`, hoy:

```
revenue                unit=USD   «Venta total del sitio medida por Adobe Analytics, en USD…»
spend                  unit=USD
spend_flow             unit=USD
platform_gap           unit=USD   «Inversión y retorno de cada plataforma, en USD»
platform_month_matrix  unit=USD
```

Las cinco métricas de dinero, y dos lo dicen también en el texto de gobierno que
datos firmó.

**2 · El dibujo lo escribe** · contados sobre el archivo: **63 nodos con moneda,
62 dicen `USD`**. El único `MXN` es la variante «tenant en alta», que dibuja otro
cliente.

**3 · Producto lo confirmó hoy**, con esas palabras: todo en USD, nada en COP ni
otra moneda.

## Dónde pega de su lado, que es lo que nos importa

**En la prosa del agente.** Con `COP` escribe:

> «En septiembre de 2026 los ingresos alcanzaron **COP 1.144.876**…»

mientras el KPI de al lado muestra `USD 1,232,721`. **Dos monedas en la misma
pantalla para la misma métrica**, y la que está mal es la del párrafo.

**El front no deriva ninguna cifra de este campo** —la unidad sale del `unit` de
la métrica en el catálogo— así que de nuestro lado no hay nada que cambiar. Lo
que lo lee es el agente.

**Y la prosa está guardada**, así que corregir el tenant no la reescribe sola:
se arregla en la próxima materialización con el agente encendido.

## Lo que pedimos

1. **`currency = USD`** para el tenant de UA MX en dev y prod, junto con los
   otros dos valores que ya les pedimos. En nuestra base local ya lo corrimos con
   el `PUT` que nos pasaron —anda, y un huso inválido da 400 con mensaje IANA—.
2. **Que el default de la columna deje de ser `COP`.** Un tenant nuevo que nace
   colombiano en silencio es cómo llegamos acá. Si no hay un default bueno,
   mejor que no haya ninguno y que el alta lo exija.

**Nada de esto es urgente para ustedes si no hay ambiente todavía** — es para que
quede escrito antes de que alguien aplique el `MXN` del mensaje anterior.

Gracias, y perdón por el ida y vuelta.
