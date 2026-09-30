/** B6 · Historial de versiones · §PEN:B6
 *
 *  §7.2 lo describe en una línea: «**quién, cuándo, qué cambió. Permite
 *  revertir.** Sin esto, un error de composición en producción no tiene vuelta
 *  atrás». Y la nota del `.pen` dice por qué el diff no es adorno: «El diff es el
 *  componente: sin él un historial es una lista de fechas y revertir es a
 *  ciegas».
 *
 *  **§PEN:B6** · frame `B6 · Historial de versiones`, `bP9lw`, 1600 × 894.
 *
 *  ── LA RUTA QUE ALIMENTA ESTA PANTALLA ES LA DE `dashboards` ────────────────
 *
 *  `GET /admin/layouts/{layoutId}/publications` devuelve **una sola fila** y no
 *  puede dibujar la lista de cuatro versiones que el `.pen` pinta. La razón es
 *  estructural: revertir COPIA a un layout nuevo y nunca reactiva el archivado,
 *  así que cada layout se publica exactamente una vez. El historial sale de
 *  `GET /admin/dashboards/{dashboardId}/publications` — medido, cinco filas
 *  contra una. Ver `adminApi.publicaciones`.
 *
 *  ── EL TÍTULO NOMBRA EL DASHBOARD, NO UNA PESTAÑA ──────────────────────────
 *
 *  El dibujo pinta «eCommerce Overview · UA MX», que es un nombre de PESTAÑA: es
 *  anterior al multi-dashboard. Una publicación versiona el layout entero, con
 *  todas sus pestañas, y el diff trae `pestana` en cada entrada justamente porque
 *  cruza varias. Así que el título es `<dashboard> · <cliente>`. El chip PESTAÑA
 *  del navbar se deja como el chrome ya lo calcula.
 *
 *  **Y el nombre puede no llegar.** Ver la prop: el único cable transcripto que
 *  lo tiene es `/config/me`, que es del usuario que mira. Sin él el título dice
 *  sólo el cliente.
 *
 *  ── LA FILA DE BORRADOR DEL DIBUJO NO SE CONSTRUYE ─────────────────────────
 *
 *  El `.pen` la pinta con `SIN PUBLICAR`, «3 cambios sin publicar», «MARÍA
 *  RESTREPO · EDITANDO AHORA» y tres líneas de cambios pendientes. Eso necesita
 *  un diff entre el borrador y lo publicado, **y no existe la ruta**: verificado
 *  con grep sobre su router, no hay `/diff`. Tampoco existe «quién está editando
 *  ahora» en ningún cable. Calcularlo acá sería exactamente lo que la regla
 *  prohíbe, así que se declara como hueco al pie y se pide.
 *
 *  **Y el contador «3 cambios sin publicar» que ya existe en el chrome no sirve**:
 *  `contexto.cambios` de `BuilderChrome` cuenta pestañas tocadas EN MEMORIA, que
 *  es otra cosa que un borrador guardado. Mezclarlos pintaría un número que no
 *  significa lo que dice.
 *
 *  ── LOS ESTADOS DE CARGA Y DE ERROR SON NUESTROS ───────────────────────────
 *
 *  El `.pen` no los dibuja para esta pantalla. Los tres vacíos dibujados y el
 *  esqueleto son de TABLAS de administración —`EmptyRow` y `SkeletonRows` son
 *  `<tr>`— y B6 es una lista de tarjetas. El vacío que se pinta acá es de clase
 *  `sistema` en su lógica —nadie publicó todavía, la salida es publicar— y va
 *  dicho como añadido nuestro en la propuesta, no colado como si el dibujo lo
 *  pidiera. Cargar y fallar los decide el contenedor.
 *
 *  ── LOS 22px DE `gap` Y LOS 120 DE PADDING ─────────────────────────────────
 *
 *  `gap=22` no está en la escala de 4px: va `gap-6` (24), mismo criterio que los
 *  18px de la tarjeta. Los 120 de padding lateral son de un lienzo de 1600, así
 *  que abajo de `lg` caen a la canaleta de 24 — el mínimo de la consola son 360px
 *  y 120 de cada lado no dejarían nada.
 */
import { Label } from '../../render/primitives/Label'
import { Note } from '../../render/primitives/Note'
import { VersionCard } from './VersionCard'
import type { LayoutVersion, Publicacion, Usuario } from '../../api/admin'
import type { Metric } from '../../api/types'
import type { Formatter } from '../../render/format'

/** Lo que el dibujo pide y el cable no da. **Se declara, no se compone** · el
 *  pedido está en `docs/PROPUESTA-2026-09-30-b6-prosa-del-historial.md`. */
const FALTANTES = [
  'El «Resumen» de cada versión · el dibujo pinta una frase redactada y el cable manda contadores. Se pide un `note` de publicación',
  'La línea RAZÓN · el porqué de una decisión humana. No hay campo y no se compone',
  'La fila de BORRADOR con sus cambios pendientes · hace falta `GET /admin/layouts/{layoutId}/diff?against=…`, que del lado suyo es exponer una función pura que ya tienen',
  'Quién está editando ahora · «EDITANDO AHORA» no tiene equivalente en ningún cable',
  '«Inversión cambia su dirección semántica» · el diff cubre pestañas, posición, tipo y parámetros; la dirección semántica es de la MÉTRICA y vive en el catálogo',
] as const

type Props = {
  /** Más recientes primero · el orden lo decide el servicio y acá no se reordena. */
  publicaciones: readonly Publicacion[]
  /** **De acá sale qué versión está EN PRODUCCIÓN y a dónde revertir.** El badge
   *  no viaja en la fila del historial: se deriva cruzando `layoutId` contra el
   *  layout cuyo estado es `publicado`, que es un cruce entre dos respuestas y no
   *  un cálculo sobre una. */
  layouts: readonly LayoutVersion[]
  /** **`null` cuando el nombre no se puede resolver, y eso pasa de verdad.**
   *
   *  El único cable transcripto que trae nombres de dashboard es `/config/me`, y
   *  ése es del usuario que MIRA: sirve mientras se compone el cliente propio y
   *  no para uno ajeno. El servicio tiene `GET /admin/tenants/{tenantId}/dashboards`
   *  desde `168a761` y **no está en nuestro cable** — es trabajo nuestro, no un
   *  hueco suyo, así que no entra en `FALTANTES`.
   *
   *  Con `null` el título dice sólo el cliente. Es decir menos, no decir algo
   *  falso: el id crudo no es un nombre y «Dashboard» a secas sería una etiqueta
   *  inventada. Medido el 2026-09-30: la base local tiene DOS clientes con el
   *  mismo nombre y el que el builder elige por defecto no es el del usuario
   *  sembrado, así que el caso se ve al abrir la pantalla. */
  dashboardNombre: string | null
  clienteNombre: string
  /** De `GET /admin/users` · de acá sale el NOMBRE del autor. */
  usuarios: readonly Usuario[]
  /** Del catálogo del cliente · de acá sale el nombre de la métrica de cada
   *  entrada del diff. */
  metricas: readonly Metric[]
  format: Formatter
  /** **El `layoutId` es el PUBLICADO y el `toLayoutId` el destino.** El path del
   *  servicio sólo acota tenant+dashboard; el cuerpo elige. */
  onRevertir: (v: { layoutId: string; toLayoutId: string }) => void
}

export function VersionHistory({
  publicaciones,
  layouts,
  dashboardNombre,
  clienteNombre,
  usuarios,
  metricas,
  format,
  onRevertir,
}: Props) {
  // **`archivado` tiene que existir para que esto funcione.** Con el enum en dos
  // valores `adaptarVersion` devolvía `'borrador'` para las cuatro versiones
  // archivadas, así que «la publicada» se podía confundir con cualquiera.
  //
  // ── Y SE ACOTA AL DASHBOARD, PORQUE `layouts` LLEGA POR TENANT ─────────────
  //
  // `GET /admin/tenants/{tenantId}/layouts` lo dice en su propio `summary` —«Las
  // versiones de layout del tenant»— y el corte medido del 2026-09-30 son **7
  // versiones con DOS `published`**: una por dashboard. Con multi-dashboard eso
  // no es una rareza, es lo normal.
  //
  // Un `find` sobre el estado a secas toma la del OTRO dashboard, y entonces
  // fallan las dos cosas que salen de acá: el badge `EN PRODUCCIÓN` desaparece
  // —su id no coincide con ninguna fila de este historial— y la reversión manda
  // en el path un layout de otro dashboard, que es justo lo que el path acota.
  //
  // **El dashboard sale de las propias filas y no de una prop más**: la ruta del
  // historial es por dashboard, así que todas traen el mismo `dashboardId`. Una
  // prop podría discrepar de las filas que se están pintando; esto no puede.
  const deEsteDashboard = publicaciones[0]?.dashboardId
  const publicado =
    layouts.find((l) => l.estado === 'publicado' && l.dashboardId === deEsteDashboard) ?? null

  const nombreDeUsuario = (id: string): string | null =>
    usuarios.find((u) => u.id === id)?.nombre ?? null
  const nombreDeMetrica = (id: string): string | null =>
    metricas.find((m) => m.id === id)?.nombre ?? null

  return (
    <div className="flex flex-col gap-6 pt-8 pb-12 px-6 lg:px-30">
      <div className="flex flex-col gap-2">
        <Label as="div">Historial de publicaciones</Label>
        <h1 className="font-display text-titulo-lg tracking-titulo leading-titulo text-ink m-0 min-w-0">
          {dashboardNombre === null ? clienteNombre : `${dashboardNombre} · ${clienteNombre}`}
        </h1>
        {/* **Literal normativo, y es cierto.** Se comprobó contra su código: el
            destino de una reversión queda `archived`, la vuelta se registra como
            una publicación más con `action: rollback`, y las filas intermedias
            siguen ahí. Si eso cambiara, este renglón pasaría a ser una
            afirmación falsa impresa en la pantalla del cliente. */}
        <div className="text-dim">
          <Note as="div">
            Cada publicación guarda la composición completa · revertir no pierde lo posterior
          </Note>
        </div>
      </div>

      {publicaciones.length === 0 ? (
        // El vacío de clase `sistema`: nadie publicó todavía y la salida es
        // publicar. **Y hay un caso medido que lo hace necesario**: «Overview»
        // tiene un layout publicado y cero publicaciones, porque la auditoría se
        // empezó a escribir con `168a761`. Un historial vacío no es un error ni
        // un dashboard sin publicar — y decir «cargando» acá sería mentir.
        <div className="flex flex-col gap-2 rounded-sm bg-w2 p-3">
          <Label as="div">Sin publicaciones registradas para este dashboard</Label>
          <Label as="div">
            La auditoría empezó a escribirse después de las primeras publicaciones · la próxima que
            se publique deja su fila
          </Label>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 m-0 p-0">
          {publicaciones.map((p) => {
            const enProduccion = publicado !== null && publicado.id === p.layoutId
            // **Un CTA sin manejador no se pinta**, y acá hay dos razones para no
            // tenerlo: no hay versión publicada desde donde revertir, o ésta ES
            // la publicada. Las dos son las que el servicio rechaza con
            // `CONFLICT_REVERT_SELF`.
            const puede = publicado !== null && !enProduccion
            return (
              <VersionCard
                key={p.id}
                publicacion={p}
                enProduccion={enProduccion}
                autorNombre={p.autorId === null ? null : nombreDeUsuario(p.autorId)}
                nombreDeMetrica={nombreDeMetrica}
                format={format}
                {...(puede
                  ? {
                      onRevertir: () => {
                        onRevertir({ layoutId: publicado.id, toLayoutId: p.layoutId })
                      },
                    }
                  : {})}
              />
            )
          })}
        </ul>
      )}

      <div className="flex flex-col gap-1 rounded-sm bg-w2 p-3">
        <Label as="div">{`Faltan ${String(FALTANTES.length)} cosas que el dibujo pide y el cable no da`}</Label>
        {FALTANTES.map((f) => (
          <Label key={f} as="div">
            {f}
          </Label>
        ))}
      </div>
    </div>
  )
}
