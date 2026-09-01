# `render/states/` · F1.19

Los seis estados. Reemplazan el CUERPO del panel, nunca el shell.

| Estado | Muestra |
|---|---|
| `CARGANDO` | esqueleto con la forma del tipo, no un spinner genérico |
| `VACIO` | invitación a actuar, con `vacioRazon` — no un error |
| `DEGRADADO` | la cifra **sí**, más razón y qué la desbloquea |
| `BLOQUEADO` | sin cifra: razón, qué la desbloquea y CTA |
| `SIN_PERMISO` | a quién pedirle acceso |
| `ERROR` | mensaje del backend y reintento por panel |

`DEGRADADO` no es un estado sin dato: muestra el número. Lo que cambia es que el
shell agrega el badge. Por eso cae con `DISPONIBLE` al elegir cuerpo.
