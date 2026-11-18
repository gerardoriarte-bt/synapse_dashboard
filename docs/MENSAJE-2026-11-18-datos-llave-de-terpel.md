# Para datos · Terpel no se conecta: la llave · 2026-11-18

**Medido contra `043cddc` el 2026-11-18**: el procedimiento de las llaves en
`docs/INSTRUCCIONES-2026-10-27-llaves-de-keralty-y-terpel.md` y qué significa
el error en `docs/AUDITORIA-2026-10-23-usuarios-de-servicio.md`. Sólo leyendo. De QA: el estado de las métricas de
Terpel, su `schema-check` y la llave de servicio que muestra la ficha. De
Snowflake, con `RL_BT_UA_TRANSFORM`: `DESC USER SVC_SYNAPSE_TERPEL_COMBS`, que
no pudimos leer. El detalle está en
`docs/AUDITORIA-2026-11-18-metricas-de-ua-y-terpel-en-qa.md`.

Hola. Terpel no muestra ninguna cifra en QA, y no es por las métricas. Es la
conexión.

## Lo que vemos

- **Las ocho métricas de pauta de octubre fallan** en la corrida del
  2026-11-18 a las 03:02 UTC, todas con el mismo error:
  `snowflake sql: status 401: 390144 · JWT token is invalid.`
- **La verificación de la conexión da el mismo error.**
- **La llave de servicio de Terpel existe** en la plataforma, con esta huella:
  `SHA256:Cyi1O/TefLNZj3+nGL2PTKDkJIoht1UCAQ2Re+kIrJc=`

Ese error quiere decir que **la pública no está registrada en el usuario, o
que la registrada no es esta**. No pudimos ver cuál de las dos es: `DESC USER`
pide `MONITOR` sobre el usuario, y el dueño es `ACCOUNTADMIN`.

## Lo que les pedimos

1. **Con `ACCOUNTADMIN`**, `DESC USER SVC_SYNAPSE_TERPEL_COMBS`, y comparar
   `RSA_PUBLIC_KEY_FP` con la huella de arriba.
2. **Si no coincide o está vacía**, registrar la pública. Se la pasamos desde
   la ficha del cliente, sin las líneas `BEGIN` y `END`, como la otra vez.
3. **Si coincide**, mirar en `LOGIN_HISTORY` el intento fallido de las 03:02 UTC
   del 18: con qué usuario llegó y qué error da Snowflake. Así sabemos si el
   problema es la llave o el usuario configurado.

## Cómo lo comprobamos

Nosotros corremos «Verificar ahora» en la ficha de Terpel, y tiene que
contestar sin error. Después cargamos septiembre y octubre, y las métricas de
pauta tienen que salir con cifra.

Gracias.
