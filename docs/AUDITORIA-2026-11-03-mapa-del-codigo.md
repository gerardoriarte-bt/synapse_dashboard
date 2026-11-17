# Auditoría · el mapa del código, con graphify · 2026-11-03

**Qué se hizo:** se armó un grafo de dependencias del repositorio con
[graphify](https://github.com/Graphify-Labs/graphify) (`graphifyy` en PyPI,
Apache 2.0), sobre `a5a4493`.

**Qué entró y qué no:**

- **Sólo el análisis de código**, que es local y sin modelo: tree-sitter lee
  cada archivo y saca imports, llamadas y definiciones. **Cero tokens.** No se
  corrió el pase semántico, que es el que manda documentos a un modelo.
- **Sólo lo versionado** de `src/`, `tests/`, `tools/`, `dev/` y
  `contracts/`, sacado con `git archive` a una carpeta temporal. **`docs/`
  quedó afuera**, y con eso también `docs/backdocs/`.
- **No se corrió `graphify install`**, que registra la herramienta en la
  configuración del asistente.

**El grafo no se versiona.** Pesa 2,8 MB, se regenera en segundos y envejece
con cada commit. Para rehacerlo:

```bash
uv tool install graphifyy
D=$(mktemp -d) && git archive HEAD src tests tools dev contracts | tar -x -C "$D"
cd "$D" && graphify update .          # deja graphify-out/graph.html, GRAPH_REPORT.md y graph.json
```

## En una frase

**La arquitectura de §4 se sostiene:** las superficies dependen de `api/` y
de `render/`, `render/` no depende de ninguna superficie, no hay ciclos de
importación, y lo único que `render/` toma de `api/` son tipos.

## 1 · El tamaño de cada parte

441 archivos, 2 882 nodos (funciones, componentes, tipos y constantes) y
7 244 relaciones. El 99 % de las relaciones salió leído directo del código, y
el 1 % (40) lo infirió la herramienta.

| Área | Nodos | Qué es |
|---|---|---|
| `tests/` | 1 328 | **Casi la mitad del grafo** |
| `src/api` | 338 | Cliente, adaptadores, tipos y los tres `*-generated.ts` |
| `src/render/plots` | 188 | Los gráficos del repertorio |
| `tools/` | 150 | La puerta y los generadores |
| `src/surfaces/admin` | 131 | |
| `src/surfaces/console` | 123 | |
| `src/surfaces/builder` | 122 | |
| `src/render/bodies` | 73 | Un cuerpo por forma |
| `dev/` | 65 | El modo mock |
| `src/surfaces` (raíz) | 53 | Lo compartido entre superficies |
| `src/render` (raíz) | 48 | `grid.ts`, `types.ts`, `state.ts` |
| `src/render/primitives` | 24 | `Label`, `Ayuda`, `Accion`, `Opcion`… |
| `src/catalog` | 21 | |
| `src/render/Panel` · `states` | 19 · 18 | |
| `src/app` | 16 | |
| `src/tokens` | 10 | |

## 2 · Quién depende de quién

Importaciones y llamadas entre áreas de `src/`, contadas desde el grafo. Están
las de más peso; la lista completa sale de `graph.json`.

```
surfaces/admin    ──179──▶ render/primitives      surfaces/console ──142──▶ api
surfaces/builder  ──137──▶ render/primitives      surfaces/admin   ──115──▶ api
render/bodies     ──106──▶ render/plots           surfaces/builder ──109──▶ api
surfaces/console  ── 65──▶ render/primitives      render/bodies    ── 54──▶ render/states
render/plots      ── 60──▶ render                 surfaces/console ── 57──▶ render
render/plots      ── 21──▶ tokens                 api              ── 13──▶ app
render (todas)    ── 21──▶ api        ← sólo tipos, ver §3
```

**Lo que dice:**

- **Las tres superficies se apoyan en los primitivos, más que en ningún otro
  lugar.** Admin y builder llaman más a `render/primitives` que a `api/`. Es
  el efecto de los cuatro registros de texto del 2026-10-06.
- **La consola es la que más habla con `api/`** (142), por los paneles, los
  períodos y el chat.
- **`render/` nunca llama a una superficie.** Es lo que permite usar el mismo
  panel en la consola, el builder y la vista previa.
- **`api/ → app/` son 13 relaciones, y son todas `currentToken`** de
  `app/auth/session`, en `client.ts`, `admin.ts`, `auth.ts` y `chat.ts`. Es
  la única dependencia «hacia arriba» que tiene `api/`.

## 3 · Las dos fronteras de `CLAUDE.md`, verificadas

**`render/` no importa valores de `api/`.** El grafo muestra 21 relaciones de
`render/` hacia `api/`, que salen de 6 líneas de import. **El grafo no
distingue `import type` de un import de valor**, así que se miró el código:

```bash
grep -rnE "from ['\"](\.\./)+api" src/render | grep -v "import type"   # vacío
```

Las 6 son `import type` desde `api/types.ts`: `Payload`, `Metric`, `Value`,
`PanelType`, `Family`, `ChartId`, `Presentation` y `Actions`. **Se cumple.**

**`generated.ts` y `tokens/` no se editan a mano.** Eso no lo puede ver un
grafo; lo sigue cubriendo `token-drift` y `*-drift` en la puerta.

## 4 · Lo más conectado

Son los nodos con más relaciones, y por eso los que más cuesta cambiar.

| Nodo | Relaciones | Dónde |
|---|---|---|
| `Label()` | 138 | `render/primitives` |
| `ok()` | 101 | helper de `tools/` y de pruebas |
| `Ayuda()` | 70 | `render/primitives` |
| `Builder()` | 63 | `surfaces/builder` |
| `useSize()` | 60 | `render` |
| `Admin()` | 60 | `surfaces/admin` |
| `Accion()` | 51 | `render/primitives` |
| `hue()` · `linearScale()` | 44 · 40 | `render/plots` |

**Cambiar la firma de `Label`, `Ayuda` o `Accion` toca más de cien lugares.**
Conviene saberlo antes de cambiar cualquiera de los tres.

## 5 · Lo que la herramienta no hace bien acá

- **Los grupos que arma salen con nombres sin sentido** (`ok`, `re`, `sys`,
  `ref_vitest`), porque nombrarlos bien requiere el pase con modelo. **Se
  leen mejor por carpeta**, que es lo que hace §2.
- **Las «conexiones sorprendentes» del reporte son relaciones inferidas**
  entre un README y el código. No aportaron nada.
- **No ve `docs/` ni el `.pen`**, que acá mandan tanto como el código. No es
  un mapa del proyecto: es un mapa del código.
- **El CSS queda afuera:** `base.css`, `decisiones.css` y `fonts.css` no
  entran al grafo, y con ellos tampoco los tokens hechos a mano. Tampoco
  entran los tres `.gitkeep`. El `.sql` no aportó nodos, porque falta el
  extra `graphifyy[sql]`.

## 6 · Para qué sirve después

Con el grafo armado, hay tres consultas que ahorran lectura:

```bash
graphify explain "PanelShell"          # qué usa y quién lo usa
graphify path "Console" "adaptBlocks"  # cómo se llega de uno a otro
graphify affected "Label"              # qué se rompe si cambia
```

**No reemplaza a la puerta.** `design-lint`, `mocks-fuera` y las pruebas de
frontera siguen siendo los que fallan cuando algo se rompe; el grafo sólo
ayuda a encontrar dónde mirar.
