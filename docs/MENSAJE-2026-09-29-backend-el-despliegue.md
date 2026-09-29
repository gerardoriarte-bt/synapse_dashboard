# Para el equipo de backend · ¿hay un Synapse desplegado? · 2026-09-29

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. Este mensaje tiene **una sola pregunta de fondo** y tres que dependen de
ella. No pide código.

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

## Las cuatro preguntas

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

### 4 · ¿Quién despliega, y con qué?

**El front ya está empaquetado y medido**, así que la pregunta es dónde meterlo,
no si está listo:

| | |
|---|---|
| Imagen | `Dockerfile` de dos etapas · **77,3 MB**, sin Node adentro · el bundle son 888 KB |
| Servidor | `nginx` con `try_files`, probado **rompiéndolo**: sin él `/` sigue en 200 y `/admin` da 404, que es por qué no se nota probando desde el login |
| Raíz de sólo lectura | Funciona, con **cuatro** `tmpfs` montados con `uid=101` · la receta exacta está en `deploy/README.md` |
| Arquitectura | Construida en Apple Silicon sale **`arm64`** y Fargate por defecto es x86 · hay que elegir, y las dos sirven |
| `VITE_API_URL` | **Se hornea en el build.** Si la API vive en otro dominio, es una imagen por ambiente y CORS del lado de ustedes |

Lo que necesitamos saber es si hay un pipeline donde enchufar esto o si hay que
escribirlo, y de quién es.

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
- No pedimos acceso a la cuenta.
- Si la respuesta a la 1 es «no hay», **es una respuesta completa** y nos deja
  seguir: dejamos de hablar de «listo para pruebas» y lo llamamos por su nombre.

Gracias.
