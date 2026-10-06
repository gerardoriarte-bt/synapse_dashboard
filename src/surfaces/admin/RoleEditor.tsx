/** A2 · roles del cliente · F4.3
 *
 *  §7.3: «Datos del tenant, **roles definidos con su descripción, pestañas por
 *  rol**, estado del acceso a datos y subprocesadores. **Es donde el super-admin
 *  define el criterio de acceso por rol.**»
 *
 *  ── LOS DOS CAMPOS QUE HAY QUE DECIR BIEN O NO DECIR ────────────────────────
 *
 *  **`pestañas` vacío significa «ve TODAS», no «no ve ninguna».** Es la
 *  diferencia entre un rol recién creado —que ve todo hasta que alguien lo
 *  acote— y un rol tapiado. Pintar «0 pestañas» diría lo segundo.
 *
 *  **`métricas ocultas` OCULTA y no IMPIDE.** §1.4.20: el servidor vuelve a
 *  verificar en `/config/catalog` y en el batch, así que un rol que oculta una
 *  métrica **no es un rol que no pueda pedirla**. Quien compone tiene que saberlo
 *  o va a usar este campo como si fuera un permiso — que es la clase de error que
 *  se descubre en una auditoría y no antes.
 *
 *  ── BORRAR ─────────────────────────────────────────────────────────────────
 *
 *  Un rol con usuarios asignados **no se puede borrar**, y el listado trae
 *  `usuarios` justamente para decirlo **antes** de ofrecer el botón. Un botón que
 *  se aprieta y devuelve 409 es peor que uno ausente — la misma regla que
 *  `puedeResponder` en `RecoBody`.
 *
 *  ── LO QUE ESTA PANTALLA NO PUEDE SER TODAVÍA ───────────────────────────────
 *
 *  §7.3 le pide a A2 cuatro cosas más —datos del tenant, estado del acceso a
 *  datos, última verificación y subprocesadores— y ninguna llega por el cable.
 *  Se declaran.
 *
 *  **§PEN:A2** · A2 · «Ficha de cliente» · DIVERGE · ver docs/AUDITORIA-2026-09-21-pen-vs-chat-y-ficha.md §9.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { RoleCard } from './RoleCard'
import type { PestanaDeRol } from './RoleCard'
import type { Rol, RolParaGuardar } from '../../api/admin'
import type { Metric } from '../../api/types'

/** Lo que §7.3 pide de esta ficha y el cable no da.
 *
 *  **El estado del acceso salió de esta lista el 2026-09-21**, y no porque
 *  llegara: lo declara `AgentConfig`, al lado de los agentes y diciendo con
 *  precisión qué significa «Activo» y qué no. Tenerlo en los dos lados era la
 *  misma carencia contada dos veces en la misma pantalla, y la versión de acá
 *  era la más vaga. Se vio al abrirla.
 *
 *  El conteo del rótulo sale de `.length`, así que no hay un número que se
 *  venza cuando esta lista cambie. */
/** LO QUE ESTA PANTALLA TODAVÍA NO MUESTRA · reescrito el 2026-09-30 (humano)
 *
 *  **Esto se PINTA, así que es copy de producto y no una nota nuestra.** Hasta
 *  hoy citaba §7.3, nombraba rutas del servicio y hablaba de «el cable» en la
 *  pantalla de un cliente — la auditoría de usabilidad lo puso primero en su
 *  lista: `docs/AUDITORIA-2026-09-30-usabilidad.md` §1.1.
 *
 *  **Declarar lo que falta se conserva**, que es la mejor costumbre de este
 *  repositorio y la misma gramática de §8: un panel apagado dice qué pasa. Lo
 *  que cambia es a quién se le habla. **La razón técnica de cada línea no se
 *  pierde: baja al comentario**, que es donde le sirve a quien la va a
 *  construir.
 */
/** ── TRES DE LAS CUATRO DEJARON DE SER CIERTAS · 2026-09-30, F5.20 ──────────
 *
 *  Las quitó construir `A2 · Ficha · tenant en alta`, que trajo los bloques que
 *  esas tres declaraban como ausentes:
 *
 *  · **los datos del cliente** los pinta `TenantIdentity`, con sus siete columnas
 *    y con un guión atenuado donde el valor todavía no llega;
 *  · **quién trata los datos** lo pinta `Subprocessors`, que es de plataforma;
 *  · **lo que aporta la plantilla** lo declara la línea al pie de esa tarjeta, y
 *    ahí es donde corresponde — al lado de la celda que sale vacía.
 *
 *  **Declararlas acá igual sería la misma carencia contada dos veces en la misma
 *  pantalla**, que es exactamente el defecto que esta lista ya cometió con el
 *  estado del acceso y que se vio al abrirla. La declaración no se borra: se mudó
 *  a donde se ve el hueco. */
/** **Lo que esta pantalla todavía no tiene** · fuera de la pantalla desde el 2026-10-06.
 *
 *  Se pintaba como «Esta pantalla va a crecer · Falta: …». Decisión humana
 *  sobre la auditoría del builder de ese día: «si no suman para el uso,
 *  quitar». No suman: quien usa la pantalla no puede hacer nada con eso. Queda
 *  acá, que es donde le sirve a quien lo vaya a construir.
 *
 *    El `.pen` la dibuja; el contrato declara «descripcion» y el cable no la trae.
 *  · 'La descripción de cada rol, debajo de su nombre'
 */

type Props = {
  roles: readonly Rol[]
  /** Las del layout publicado, con su pregunta operativa y su conteo de
   *  paneles: es lo que el desglose de §9 necesita, y **todas** y no las del
   *  rol, porque «vacío = todas» se resuelve por tarjeta. */
  pestanas: readonly PestanaDeRol[]
  /** Para nombrar una métrica oculta. Sin filtrar por rol · es el inventario. */
  metricas: readonly Pick<Metric, 'id' | 'nombre'>[]
  onGuardar: (id: string | undefined, rol: RolParaGuardar) => void
  onBorrar: (id: string) => void
  guardando: boolean
  error: string | null
  /** Para ir al catálogo desde una métrica que un rol no recibe · §PEN:A2.
   *  Sin él el enlace no se pinta. */
  onVerCatalogo?: () => void
  /** Mientras los roles vuelan. **No es una tabla**, así que su esqueleto son
   *  tarjetas con la forma de una ficha de rol — la misma idea que
   *  `SkeletonRows`: prometer la forma que va a llegar, no decir «esperá». */
  cargando?: boolean
}

export function RoleEditor({
  roles,
  pestanas,
  metricas,
  onGuardar,
  onBorrar,
  onVerCatalogo,
  guardando,
  error,
  cargando = false,
}: Props) {
  const [editando, setEditando] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [elegidas, setElegidas] = useState<string[]>([])
  const [ocultas, setOcultas] = useState<string[]>([])

  const abrir = (r: Rol | null) => {
    setEditando(r?.id ?? '')
    setNombre(r?.nombre ?? '')
    setElegidas(r === null ? [] : [...r.pestanas])
    setOcultas(r === null ? [] : [...r.metricasOcultas])
  }

  const alternar = (lista: string[], set: (v: string[]) => void, id: string) => {
    set(lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id])
  }

  const nombreDeMetrica = (id: string) => metricas.find((m) => m.id === id)?.nombre ?? id

  /** El vacío de ALTA · **no es «no hay roles», es «todavía no hay»**. Mientras
   *  la vuelta no llegó, cero roles es lo que no se sabe. Se calcula una vez
   *  porque decide dos cosas —el vacío y si la cabecera lleva CTA— y con la
   *  condición escrita dos veces una de las dos se olvida. */
  const vacioDeAlta = roles.length === 0 && !cargando

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Label as="div">Roles y composición</Label>
        {/* **El resumen del `.pen`, cortado donde el dato se termina.**
            Dibuja «2 ROLES · 4 PESTAÑAS · 28 PANELES · 11 HEREDADOS DE
            PLANTILLA» y los heredados no llegan, así que el segmento no está
            —ni su separador colgando, que es justo lo que le señalamos al
            backend en la línea de BASE—.

            CARGANDO y no una cifra: «2 roles» mientras carga afirma algo que
            todavía no llegó. */}
        {/* **Y en alta el dibujo escribe otra cosa en este mismo hueco** ·
            §PEN:A2, 2026-09-30 · corregido en la auditoría. El frame de alta
            pone `SIN ROLES DEFINIDOS` donde el frame normal pone las cifras, y
            acá salía «0 rol(es) · 0 pestaña(s) · 0 paneles»: tres ceros que se
            leen como un dato medido cuando lo que pasa es que el trabajo no
            empezó. El `.pen` manda en el literal de la UI. */}
        <Label as="div">
          {cargando
            ? 'Cargando'
            : vacioDeAlta
              ? 'Sin roles definidos'
              : `${String(roles.length)} rol(es) · ${String(pestanas.length)} pestaña(s) · ${String(
                  pestanas.reduce((n, t) => n + t.paneles, 0),
                )} paneles`}
        </Label>
        {/* **En el vacío de alta la cabecera NO lleva CTA** · §PEN:A2, 2026-09-30.
            El dibujo pone uno solo y lo pone adentro del vacío; la ficha del
            cliente en servicio sí lo tiene acá. Con los dos, la pantalla ofrece
            dos botones idénticos a diez píxeles uno de otro — **se vio al
            abrirla**, no lo dijo ninguna prueba. */}
        {!vacioDeAlta && (
          <Accion onClick={() => abrir(null)}>Nuevo rol</Accion>
        )}
      </div>

      {vacioDeAlta && (
        // **Vacío de ALTA, que es el tercer tipo** · el `.pen` le dedica un
        // frame entero, `A2 · Ficha · tenant en alta`: «no falta un filtro ni
        // falla nada: el cliente es nuevo y el trabajo está por hacerse». La
        // salida es el siguiente paso, no deshacer ni reintentar.
        <div className="flex flex-col gap-3 rounded-xl border border-w3 bg-panel p-6">
          {/* ── EL LITERAL ES EL DEL DIBUJO · §PEN:A2, 2026-09-30 ────────────
              Corregido en la auditoría, y era una divergencia de las que se
              deshacen solas: acá había DOS labels nuestros —«Este cliente
              todavía no tiene roles · está en alta» y «Sin ningún rol nadie
              puede entrar…»— donde el frame escribe UNA frase, y la frase dice
              las dos cosas. `CLAUDE.md` es explícito: **el `.pen` gana para el
              literal de la UI**.

              Y el rol tipográfico también es el del dibujo: `$font-body` 12.5 en
              `$ink`, no un label mono en mayúsculas. Es una frase, no un rótulo
              —el mismo par que la rama `BLOQUEADO` de `AgentConfig`, que se
              construyó bien el mismo día—.

              **Lo que sigue divergiendo y no se puede arreglar acá:** el frame
              dibuja un icono `users` de 22 arriba de la frase, y esta superficie
              no pinta un solo icono ni tiene la biblioteca; y el padding es 32
              donde toda la superficie usa 24. Las dos son previas y de la
              superficie entera, y están anotadas en el registro. */}
          <p className="font-body text-cuerpo leading-cuerpo text-ink m-0">
            Todavía no hay roles definidos, así que este cliente no tiene composición ni usuarios
            que puedan entrar.
          </p>
          {/* ── EL CTA, Y NO UNA INDICACIÓN · §PEN:A2, 2026-09-30 ───────────
              Acá decía «"Nuevo rol", acá arriba», que le pide al lector que
              busque un botón en otra parte de la pantalla. El dibujo pone el
              CTA **dentro** del vacío, en `$acc`, y es el único de los tres
              tipos de vacío que lo lleva: §8 dice que un vacío de alta es una
              invitación a actuar, y la acción tiene que estar donde se lee.

              **Y hace lo mismo que «Nuevo rol»** —abre el formulario—, no algo
              parecido: dos caminos al mismo estado y no dos estados. */}
          {/* **La primaria de la zona** · 2026-10-06: el relleno `acc` lo
              conserva, el traje de rótulo no. `self-start` en el envoltorio
              porque `Accion` no acepta clases de afuera. */}
          <div className="self-start">
            <Accion variante="primaria" onClick={() => abrir(null)}>
              Definir primer rol
            </Accion>
          </div>
        </div>
      )}

      {cargando && (
        <ul className="flex flex-col gap-2 m-0 p-0 list-none" aria-busy="true">
          {[0, 1].map((i) => (
            <li key={i} className="flex flex-col gap-2 rounded-sm bg-w2 p-3" aria-hidden="true">
              <div className="bg-w3 rounded-xs h-3 w-1/4" />
              <div className="bg-w3 rounded-xs h-3 w-2/3" />
            </li>
          ))}
        </ul>
      )}

      <ul className="flex flex-col gap-6 m-0 p-0 list-none">
        {roles.map((r) => (
          <RoleCard
            key={r.id}
            rol={r}
            pestanas={pestanas}
            nombreDeMetrica={nombreDeMetrica}
            onEditar={() => abrir(r)}
            onBorrar={() => onBorrar(r.id)}
            {...(onVerCatalogo === undefined ? {} : { onVerCatalogo })}
          />
        ))}
      </ul>

      {/* **La advertencia va una vez, no por rol** —es una propiedad del campo y
          repetirla por fila la vuelve decoración— **y no va cuando no hay ningún
          rol** · §PEN:A2, corregido en la auditoría del 2026-09-30.

          Se vio al abrir la ficha en alta: debajo del vacío aparecía una
          advertencia sobre ocultar métricas en un cliente que no tiene roles ni
          métricas que ocultar, y el frame de alta no dibuja nada en ese hueco.
          Es la misma clase que los otros cuatro hallazgos de mirar la pantalla:
          **una carencia o una advertencia sobre algo que no está presente**.

          Y de paso es el único texto de esta superficie que sigue nombrando
          plomería —«el servidor», «el batch»—; se deja donde tiene sentido
          porque ahí le habla a quien compone, que es quien va a usar el campo. */}
      {roles.length > 0 && (
        <Ayuda>
          Ocultar una métrica NO es un permiso: al servir el dato se vuelve a verificar qué
          puede ver cada rol.
        </Ayuda>
      )}

      {editando !== null && (
        <form
          className="flex flex-col gap-3 rounded-sm bg-w2 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            onGuardar(editando === '' ? undefined : editando, {
              nombre,
              pestanas: elegidas,
              metricasOcultas: ocultas,
            })
          }}
        >
          <Label as="div">{editando === '' ? 'Nuevo rol' : 'Editando rol'}</Label>

          <label className="flex flex-col gap-1">
            <Label as="div">Nombre</Label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-w1 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
            />
          </label>

          <fieldset className="flex flex-col gap-1 border border-w4 rounded-sm p-2">
            <legend className="flex items-baseline gap-2">
              <Label>Pestañas</Label>
              <Ayuda as="span">Sin ninguna marcada, el rol las ve todas.</Ayuda>
            </legend>
            {pestanas.length === 0 ? (
              <Ayuda>Este cliente todavía no tiene pestañas publicadas.</Ayuda>
            ) : (
              pestanas.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-ink text-celda">
                  <input
                    type="checkbox"
                    checked={elegidas.includes(t.clave)}
                    onChange={() => alternar(elegidas, setElegidas, t.clave)}
                  />
                  {t.nombre}
                </label>
              ))
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-1 border border-w4 rounded-sm p-2">
            <legend className="flex items-baseline gap-2">
              <Label>Métricas ocultas</Label>
              <Ayuda as="span">Las saca de la vista del rol; no es un permiso.</Ayuda>
            </legend>
            {metricas.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-ink text-celda">
                <input
                  type="checkbox"
                  checked={ocultas.includes(m.id)}
                  onChange={() => alternar(ocultas, setOcultas, m.id)}
                />
                {m.nombre}
              </label>
            ))}
          </fieldset>

          <div className="flex items-center gap-3">
            {/* `submit` y sin `onClick`: lo maneja el `onSubmit` del
                formulario, que es lo que hace funcionar Enter. */}
            <Accion tipo="submit" deshabilitada={nombre.trim() === '' || guardando}>
              {guardando ? 'Guardando…' : 'Guardar rol'}
            </Accion>
            <Accion onClick={() => setEditando(null)}>Cancelar</Accion>
            {nombre.trim() === '' && <Ayuda as="span">Un rol sin nombre no se puede guardar.</Ayuda>}
          </div>
        </form>
      )}

      {error !== null && <Ayuda>{error}</Ayuda>}

      {/* **Decía «ninguna ruta los lista · solo existe POST /admin/users»** y
          eran dos defectos en una línea: una ruta y un identificador de tarea
          pintados en la ficha de un cliente —lo que §7.3 llama vocabulario de
          infraestructura, acá aplicado a la nuestra— y, desde que la ruta
          global contesta, **una afirmación falsa**. `copy-producto` no la vio
          porque es texto suelto entre etiquetas; se vio al abrir la pantalla. */}
      <Ayuda>
        Quiénes son los usuarios de este cliente: hoy se ven en la pantalla de usuarios, no acá.
      </Ayuda>
    </div>
  )
}
