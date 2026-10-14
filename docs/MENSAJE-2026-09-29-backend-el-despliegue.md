# Para el equipo de backend · ¿hay un Synapse desplegado? · 2026-09-29

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. **Tres preguntas y una entrega.** Ninguna pide código: el despliegue lo
hacen ustedes y lo nuestro es darles todo armado, que es lo que va en el punto 4.

---

## Por qué preguntamos, y por qué recién ahora

**Todo lo que verificamos esta semana corre contra un binario que levantamos
nosotros**, desde un clone de su repositorio, contra un Postgres en Docker en una
máquina de acá.

La consola con los doce paneles, el chat contra Cortex, los trece gráficos del
repertorio, `schema-check`, `sync-catalog`, la prosa por agente — todo eso está
medido, y **todo está medido en `localhost:4010`**.

Eso no es un problema mientras se construye. Se vuelve uno en el momento de
decir «está listo», porque **«verificado contra el servicio real» y «verificado
donde va a correr» son dos afirmaciones distintas**, y la primera se dice sola.
Ya nos pasó una vez con «verificado con datos reales», y preferimos no repetirlo
a escala de ambiente.

---

## Tres preguntas y una entrega

### 1 · ¿Existe un servicio de Synapse corriendo en algún AWS?

Es la que decide todo lo demás. **Si no existe, el front no tiene a dónde apuntar
y el resto es teórico** — y lo decimos sin reproche: puede ser perfectamente que
no exista todavía y que nadie lo haya dicho porque nadie lo preguntó.

Si existe: **la URL**, aunque esté cerrada por red.

### 2 · ¿En qué commit está?

**Si no es `de881e1`, nada de lo que medimos esta semana vale ahí.** No es una
figura retórica: entre `f70cec2` y `de881e1` cambiaron cosas que nos rompieron
mediciones —`request_from` pasó de `"administrator"` a `"admin"` y nos enteramos
ocho días tarde—.

Con el commit y la URL corremos `npm run humo` contra **ese** servicio, que es
exactamente para lo que existe: compara las respuestas campo por campo contra los
dos yaml que transcribimos. Nos lleva minutos y cierra la pregunta.

### 3 · ¿Contra qué base?

La RDS compartida **dejó de respondernos el 2026-09-22** y por eso movimos todo a
un Postgres local; ustedes mismos recomendaron el cambio.

Preguntamos por dos razones concretas:

- **Hay migraciones pendientes de correr** en cualquier base que no sea la
  nuestra. La última que agregaron es `migrateDDRoleTabKeys`; nosotros además
  sumamos la tabla `plots` en el fork.
- **`DB_AUTO_MIGRATE=true` contra una base compartida sigue estando prohibido de
  nuestro lado**, y queremos saber quién las corre allá y cuándo, no correrlas.

### 4 · Esta no es una pregunta: es la entrega

Está listo y medido. Lo que sigue es la lista para que no tengan que deducir
nada.

**Los tres archivos**, en la raíz del repositorio del front:

| Archivo | Qué es |
|---|---|
| `Dockerfile` | Dos etapas · construye con Node 22 y sirve con nginx. **La imagen final no lleva Node** |
| `deploy/nginx.conf.template` | Se resuelve con `envsubst` **al arrancar** el contenedor, no al construirlo |
| `.dockerignore` | **`tests/` y `dev/` entran a propósito**: `tsc -b` los necesita para compilar |

**La receta completa está en `deploy/README.md`**, y ahí está lo que no se
deduce mirando los archivos.

#### Las variables, y cuándo se leen

| Variable | Cuándo | Por defecto |
|---|---|---|
| `API_ORIGIN` | **Arranque** · a dónde manda `/api/v1` | `http://synapse-api:8080` |
| `NGINX_PORT` | Arranque | `8080` |
| `DOLLAR` | Arranque · **no se toca** · es el escape de `envsubst` | `$` |
| `VITE_API_URL` | **BUILD** · sólo si la API no es del mismo origen | vacío |
| `VITE_BUDGET` | Build · `=1` enciende el presupuesto de render | vacío |

**`VITE_API_URL` se hornea en el BUILD, y ésa es la que puede morder.** Vite la
resuelve al compilar: si la API vive en otro dominio y no se puede proxear, es
**una imagen por ambiente** y CORS del lado de ustedes. Si va en el mismo origen
—que es lo que el `nginx` ya resuelve con `API_ORIGIN`— se deja vacía y una sola
imagen sirve para todos.

#### Cuatro cosas medidas que conviene saber antes

1. **Peso: 77,3 MB**, de los cuales el bundle son 888 KB. El resto es nginx.
2. **`try_files` está probado ROMPIÉNDOLO.** Sin él `/` sigue devolviendo 200 y
   `/admin` da **404** — por eso no se nota probando desde el login, y por eso lo
   decimos: es el error que se descubre cuando alguien recarga en una ruta
   interna.
3. **La raíz de sólo lectura funciona**, con **cuatro** `tmpfs` montados **con
   `uid=101`** —incluido `/etc/nginx/conf.d`, que es el que sorprende—. Sin el
   `uid` en el montaje no arranca: los `tmpfs` se crean de root y el proceso
   corre sin privilegios. La receta exacta está en el README.
4. **La arquitectura hay que elegirla.** Construida en Apple Silicon sale
   `arm64`, y Fargate por defecto es x86: un `arm64` en una tarea x86 falla con
   `exec format error`. O `--platform=linux/amd64` al construir, o se corre en
   Graviton. Las dos sirven; lo que no sirve es no elegir.

**Lo que no hicimos**: no construimos la imagen para un registry de ustedes ni
elegimos la arquitectura, porque las dos decisiones dependen de dónde corre y eso
lo saben ustedes. Si nos dicen registry y plataforma, la publicamos nosotros.

---

## Una cosa más, que va junto

En nuestro fork hay una rama nueva, **`feature/config-plots`**, con
`GET /config/plots` sobre `de881e1` limpio: la tabla de los 49 gráficos con sus
mínimos y sus topes, generada desde sus fuentes y no transcrita a mano. **+18 −1
en archivos de ustedes**, `go test ./...` sin una sola falla.

**Si el servicio desplegado la va a servir, conviene que la tomen antes**, porque
el front ya la consume: el builder filtra el selector de gráficos con esa tabla y
la consola apaga un panel cuyo gráfico no llega al mínimo. Sin la ruta las dos
cosas degradan bien —no bloquean nada— pero tampoco hacen nada.

---

## Lo que NO estamos pidiendo

- No pedimos que desplieguen hoy.
- No pedimos acceso a la cuenta ni participar del despliegue: es de ustedes y
  está bien así. Lo que pedimos es **saber contra qué quedó corriendo**, para
  poder medirlo y decir «anda» con la misma vara que usamos acá.
- Si la respuesta a la 1 es «no hay», **es una respuesta completa** y nos deja
  seguir: dejamos de hablar de «listo para pruebas» y lo llamamos por su nombre.

Gracias.
