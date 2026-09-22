# Para el equipo de datos · acceso al agente de Cortex · 2026-09-22

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué
> evidencia. No se actualiza.

Hola. Les pedimos **dos cosas concretas** para poder terminar de verificar el
chat de Synapse. Todo lo que está acá lo comprobamos hoy contra la cuenta
`MAA16864`, con consultas de **solo lectura** —`SHOW` y `DESCRIBE`—, así que
abajo dice qué ya existe y qué falta, sin suposiciones.

**Lo escribimos largo a propósito en la parte de seguridad**, porque lo que
pedimos incluye una clave privada y queremos que puedan revisarlo con el detalle
que merece.

---

## 1 · Para qué es

Synapse tiene un **chat contextual**: el usuario abre un panel —«Ventas del
mes», «Inversión y retorno por plataforma»— y pregunta desde ahí. Nuestro
backend recibe la pregunta junto con el panel y el período, llama a un **agente
de Cortex**, y la respuesta vuelve en streaming al costado del panel: el texto,
el SQL que el agente corrió, y las cifras que devolvió.

**Lo que no puede hacer hoy:** nada de eso. La llamada corta antes de empezar.

```
POST /api/v1/config/chat
409 · {"success":false,"error":"no hay agente activo disponible para este tenant y rol"}
```

Nuestra aplicación no tiene con qué autenticarse contra Snowflake, así que
nunca llega a invocar al agente.

**Por qué importa que se pruebe de verdad.** Todo el chat está construido y
probado contra **simuladores nuestros**, y un simulador responde lo que
*nosotros creemos* que responde el servicio. Ya nos pasó una vez con el formato
del streaming: nuestras pruebas pasaban en verde y el chat no mostraba una sola
palabra. Hasta que no hablemos con el Cortex real, no sabemos si vuelve a pasar.

---

## 2 · Qué ya existe · verificado hoy

No hace falta que creen casi nada. Esto ya está:

| | | |
|---|---|---|
| Cuenta | `MAA16864` (`maa16864.east-us-2.azure`) | ✅ |
| Usuario de servicio | **`SYNAPSE_SERVICE_USER`** | ✅ tiene `SYNAPSE_APP_ROLE` desde el 2026-03-30 |
| Rol | **`SYNAPSE_APP_ROLE`** | ✅ |
| Warehouse | **`SYNAPSE_UA`** | ✅ el rol tiene `USAGE` + `OPERATE` |
| Base y schema | `DB_BT_UA` · `BT_UA_MART_ANALYTICS` | ✅ el rol tiene `USAGE` en los dos |
| Agente de Cortex | **`SYNAPSE_UA`** | ✅ existe · 6 herramientas · owner `SYSADMIN` |
| Vista semántica | **`SYNAPSE_UA`** | ✅ existe |

**Elegimos `SYNAPSE_UA` y no `SYNAPSE_UA_DASHBOARD`**, y conviene que lo sepan
por si nos equivocamos: el `_DASHBOARD` genera reportes en **HTML con
Vega-Lite** y tiene `code_execution` habilitado. Nuestra consola dibuja sus
propios paneles desde datos estructurados y no inyecta HTML ajeno, así que lo
que necesitamos es el **analista conversacional con text-to-SQL**, que es
`SYNAPSE_UA`. Si creen que el correcto es otro, díganlo y lo cambiamos.

---

## 3 · Lo que pedimos · son dos cosas

### 3.1 · Un par de claves RSA para `SYNAPSE_SERVICE_USER`

Es el mecanismo que Snowflake recomienda para cuentas de servicio: la aplicación
firma un JWT con la clave privada y Snowflake lo valida contra la pública. No
viaja ninguna contraseña y no hace falta que nadie se loguee a mano.

**Lo generan ustedes.** Nosotros no creamos nada en Snowflake — es una regla que
tenemos escrita. En concreto:

1. Generan el par.
2. Registran la pública: `ALTER USER SYNAPSE_SERVICE_USER SET RSA_PUBLIC_KEY = '…'`
3. La privada nos llega por **gestor de secretos o canal cifrado** — ver §4.

**Si prefieren una clave distinta de la que ya use otra cosa, mejor**: pedimos
una dedicada a esta integración, para que revocarla no rompa nada más.

### 3.2 · Dos permisos que hoy no están

Revisamos los 170 grants de `SYNAPSE_APP_ROLE` y encontramos que **no tiene
permiso explícito sobre lo que necesita invocar**:

| Objeto | Grant hoy |
|---|---|
| Semantic view `DB_BT_UA.BT_UA_MART_ANALYTICS.SYNAPSE_UA` | ❌ no hay grant explícito |
| Agent `DB_BT_UA.BT_UA_MART_ANALYTICS.SYNAPSE_UA` | ❌ no hay grant explícito |

Sí tiene el database role `SNOWFLAKE.CORTEX_USER`, y las diez semantic views que
sí están granteadas son todas de `APP_MMM_LITE_VERSION2`. Los agentes son
propiedad de `SYSADMIN` y `RL_BT_UA_BI`.

**No afirmamos que falle** —puede heredarlo por jerarquía de roles—, pero no lo
podemos comprobar sin la clave, y si falla vamos a estar buscando el problema en
el lado equivocado. **Confírmennos si lo hereda, o agreguen el grant.**

---

## 4 · Seguridad · lo que hay que saber antes de entregar la clave

Esta sección la escribimos para que puedan decidir con la información completa,
incluido **lo que hoy está mal de nuestro lado**.

### Qué puede hacer esa clave

Exactamente lo que `SYNAPSE_APP_ROLE` permite y nada más. Conviene que lo miren,
porque **ese rol es bastante amplio para este uso**: 170 grants, unas 40 tablas
con `SELECT`, 30 vistas, 5 warehouses y 4 servicios de Cortex Search, en dos
bases. Para el chat de Synapse alcanzaría con: `USAGE` del warehouse `SYNAPSE_UA`,
`USAGE` de `DB_BT_UA` y `BT_UA_MART_ANALYTICS`, la semantic view `SYNAPSE_UA` y
el agente `SYNAPSE_UA`.

**Si quieren apretarlo, un rol dedicado sería mejor que reusar
`SYNAPSE_APP_ROLE`**, y a nosotros nos da lo mismo: es un campo de configuración.

### Cómo la guarda nuestro backend · el estado real

- **En tránsito hacia el servicio:** viaja en el cuerpo JSON de
  `POST /api/v1/admin/tenants`, campo `private_key_pem`, sobre HTTPS.
- **En reposo:** se guarda **cifrada** en Postgres. `tenant_repository.go` la
  pasa por `atrest.EncryptString` con la clave `DATA_ENCRYPTION_KEY` del
  servicio.
- **En uso:** se descifra en memoria sólo para firmar el JWT de Snowflake.

### Un defecto abierto que les toca conocer · y por eso está acá

Encontramos hoy que **algunas respuestas del panel de administración pueden
devolver ese campo**. La estructura `Tenant` del backend declara `PrivateKeyPEM`
y `PrivateKeyPassphrase` sin marcarlas como no serializables, y varias consultas
la traen anidada.

**Hoy no se filtra nada** —lo probamos y sale vacío, porque nuestro entorno de
prueba no tiene credenciales cargadas—. Pero con una clave cargada, la forma ya
está ahí. **Ya se lo reportamos al equipo de backend hoy mismo**, con la
corrección señalada, y es un cambio chico.

**Nuestra recomendación:** que la clave se entregue **después** de que eso esté
corregido, o que la primera sea una de prueba que puedan revocar sin costo.
Preferimos decirlo antes que pedirles un secreto sabiendo esto y callarlo.

### Dónde va a estar la clave mientras probamos

Con franqueza, porque hace a la decisión: la verificación la corremos con el
servicio levantado en **la máquina de un desarrollador**, contra una base
Postgres local en Docker. Así que **la clave privada va a estar en esa máquina y
en ese contenedor**, no en un servidor de la empresa.

Por eso pedimos una **clave dedicada y revocable**, no la que use otro proceso.
Cuando terminemos de verificar, avisamos y la pueden revocar.

Y una nota sobre rotación: Snowflake admite dos claves públicas por usuario
—`RSA_PUBLIC_KEY` y `RSA_PUBLIC_KEY_2`—, así que rotarla no obliga a una ventana
de caída.

### Qué no hacemos

- **No creamos ni modificamos nada en Snowflake.** Lo de hoy fue `SHOW` y
  `DESCRIBE`, y está en el registro de la cuenta.
- La clave **no entra al repositorio**. Los archivos con credenciales están
  ignorados por git desde el 2026-09-14.
- No la pedimos por chat ni por correo, y no la queremos en un documento
  compartido.

---

## 5 · Cómo nos lo mandan

1. **La clave privada**, por gestor de secretos o canal cifrado — el que usen
   habitualmente. Si no hay uno acordado, díganlo y lo definimos antes.
2. **Una línea por mail o ticket** con: el usuario (`SYNAPSE_SERVICE_USER` o el
   que definan), el rol, y si agregaron los dos grants de §3.2 o si los hereda.

Con eso cargamos el agente, corremos la verificación y **les devolvemos el
resultado**: qué preguntamos, qué contestó y cuánto tardó.

---

## 6 · De paso · dos cosas que vimos y les pueden servir

Las miramos mientras validábamos, no son pedidos:

- **`SYNAPSE_METRIC_CATALOG` está lista.** Diez filas —`revenue`, `spend`,
  `platform_return`, `roas`, `orders`, `sessions`, `units`, `daily_trend`,
  `goal_attainment`, `media_efficiency_12m`— y **`MEASUREMENT_WINDOW` con valor
  en las diez**. Lo que falta para que la consola las use es del lado del
  backend, no del de ustedes: falta correr el sync.
- Nuestra consola hoy muestra **doce** métricas, que son las de una semilla de
  prueba en Postgres. Dos de esas doce —`executive_summary` y `decisions`— **no
  existen en el catálogo de Snowflake**. Cuando el sync corra, esos dos paneles
  se quedan sin métrica. Lo tenemos anotado; se los decimos por si del lado de
  ustedes hay una equivalencia que no estamos viendo.
