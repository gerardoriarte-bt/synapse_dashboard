#!/usr/bin/env python3
"""Las 49 filas de `SYNAPSE_PLOTS`, emitidas desde sus fuentes · 2026-09-29

    python3 tools/gen-plots.py              ·  escribe los dos artefactos
    python3 tools/gen-plots.py --check      ·  falla si quedaron desincronizados

── POR QUÉ EXISTE ───────────────────────────────────────────────────────────

**Porque la alternativa era pedirle al backend que transcribiera 49 filas de una
tabla markdown**, y ése es el modo de falla que este repositorio tiene medido y
sufrido: la tabla de quince bloques del modo mock salió con las quince filas mal.
Cuarenta y nueve es más superficie, y la mitad del daño ni se vería —un `tope`
equivocado deshabilita un gráfico que debería estar y nadie lo atribuye a esto—.

**Nada de lo que emite se escribe acá.** Las cuatro columnas salen de cuatro
fuentes distintas, cada una con su dueño:

| Columna | De dónde | Quién la manda |
|---|---|---|
| `formas`, `soporta_banda`, `tope` | `contracts/synapse-plots.js` del repositorio archivado · legible por máquina, derivada del `.pen` y de §5 | Nosotros, desde v2 |
| `nombre` | El `.pen`, `Synapse · Plots` · el literal de UI | Diseño · no lo modificamos |
| `minimos` | La tabla POR FORMA de `docs/ENTREGA-2026-09-29-repertorio-de-graficos.md`, más los tres que la suben | La decisión del 2026-09-26 |
| El mapa de formas | `NOMBRE_DE_FORMA` de `src/api/adapt.ts` | El cable |

── DOS ARTEFACTOS, Y EL SEGUNDO ES EL QUE VIAJA ─────────────────────────────

 1. `docs/repertorio-de-graficos.json` · la tabla, para leerla y para diffearla.
 2. El seed de Go, para el fork · `dd_seed_plots.go`.

**El de Go emite las formas en el idioma del CABLE** —`scalar`, `time_series`—
y no en el del contrato, porque así lo hace `/config/blocks` y una ruta hermana
que hablara distinto obligaría a una capa de traducción más.

── LO QUE NO HACE ───────────────────────────────────────────────────────────

**No inventa un mínimo donde la fuente no lo declara.** Cuatro formas no tienen
—`escalar`, `escalarConIntervalo`, `prosa`, `tabular`— y su lista sale VACÍA, que
es un valor legítimo y está dicho en el contrato: «una cifra es una cifra».
Rellenarlas para que la columna no quede vacía sería exactamente lo prohibido.

**Y no traduce `tope.razon` ni `minimo.razon`**: son copy de producto que se
pinta tal cual, y vienen redactadas de `design.md`.
"""
from __future__ import annotations

import json
import pathlib
import re
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
V2 = pathlib.Path.home() / "Documents/GitHub/synapse_v2/contracts/synapse-plots.js"
PEN = RAIZ / "design/Synapse_v2.pen"
ENTREGA = RAIZ / "docs/ENTREGA-2026-09-29-repertorio-de-graficos.md"
ADAPT = RAIZ / "src/api/adapt.ts"

SALIDA_JSON = RAIZ / "docs/repertorio-de-graficos.json"
SALIDA_GO = RAIZ / "docs/backend/dd_seed_plots.go"

BLOQUEADO = 2


def muere(msg: str, code: int = BLOQUEADO) -> None:
    print(f"gen-plots ⊘ BLOQUEADO · {msg}")
    sys.exit(code)


# ── 1 · el repertorio de v2 ──────────────────────────────────────────────────
def repertorio() -> list[dict]:
    """`SYNAPSE_PLOTS` leído con node y no con una regex.

    El archivo es un módulo ES con objetos anidados; parsearlo a mano es cómo se
    pierde un `tope` sin que nadie lo note."""
    if not V2.exists():
        muere(f"no está el repertorio de v2 · {V2}")
    js = (
        f"import('{V2}').then(m=>console.log(JSON.stringify("
        "m.SYNAPSE_PLOTS.map(p=>({id:p.id,formas:p.formas,"
        "soportaBanda:p.soportaBanda,tope:p.tope??null})))))"
    )
    r = subprocess.run(
        ["node", "--input-type=module", "-e", js], capture_output=True, text=True
    )
    if r.returncode != 0:
        muere(f"node no pudo leer el repertorio · {r.stderr.strip()[:200]}")
    return json.loads(r.stdout)


# ── 2 · los nombres, del `.pen` ──────────────────────────────────────────────
def nombres_del_pen() -> dict[str, str]:
    """`Plot/BULLET · Avance contra objetivo` → `BULLET`.

    **La clave es el nombre, no el id**, porque el `.pen` no declara ids: el
    cruce se hace por el título en mayúsculas contra la tabla de la entrega, que
    es la que los ata. Devuelve `{TITULO: TITULO}` para que el llamador cruce."""
    if not PEN.exists():
        muere(f"no está el `.pen` · {PEN}")
    d = json.loads(PEN.read_text())

    def walk(n, path=""):
        yield n, path
        for c in n.get("children", []) or []:
            yield from walk(c, path + "/" + str(n.get("name")))

    out = {}
    for n, p in walk(d):
        nm = str(n.get("name") or "")
        if "Synapse · Plots" in p and n.get("type") == "frame" and nm.startswith("Plot/"):
            titulo = nm[len("Plot/"):].split(" · ")[0].strip()
            out[titulo] = titulo
    return out


# ── 3 · la tabla de la entrega: id ↔ nombre, y los mínimos ───────────────────
FILA = re.compile(r"^\|\s*\d+\s*\|\s*`([a-z0-9]+)`[^|]*\|\s*([^|]+?)\s*\|")
POR_FORMA = re.compile(r"^\|\s*`([A-Za-zÁÉÍÓÚÑáéíóúñ]+)`\s*\|([^|]*)\|([^|]*)\|([^|]*)\|")
SUBE = re.compile(r"^\|\s*`([a-z0-9]+)`\s*\|\s*`([A-Za-z]+)`[^|]*\|\s*\*\*(\d+)\*\*\s*\|\s*«([^»]+)»")


def de_la_entrega() -> tuple[dict[str, str], dict[str, dict], dict[str, dict]]:
    if not ENTREGA.exists():
        muere(f"no está la entrega · {ENTREGA}")
    texto = ENTREGA.read_text()

    nombre_de_id: dict[str, str] = {}
    for l in texto.split("\n"):
        m = FILA.match(l)
        if m:
            nombre_de_id[m.group(1)] = m.group(2).strip()

    minimos: dict[str, dict] = {}
    for l in texto.split("\n"):
        m = POR_FORMA.match(l)
        if not m:
            continue
        forma, _, cuando, razon = m.groups()
        cuando = cuando.strip().strip("`").strip()
        razon = razon.strip()
        if not cuando or cuando == "—":
            continue
        # La razón viene entre comillas angulares; el itálico de las cuatro sin
        # mínimo no llega acá porque se descartan arriba.
        rm = re.search(r"«([^»]+)»", razon)
        if rm:
            minimos[forma] = {"cuando": cuando, "razon": rm.group(1)}

    suben: dict[str, dict] = {}
    for l in texto.split("\n"):
        m = SUBE.match(l)
        if m:
            gid, forma, n, razon = m.groups()
            suben[gid] = {"forma": forma, "n": int(n), "razon": razon}

    return nombre_de_id, minimos, suben


# ── 4 · el mapa de formas, del adaptador ─────────────────────────────────────
MAPA = re.compile(r"^  ([a-zA-Z]+): '([a-z_]+)',$", re.M)


def formas_del_cable() -> dict[str, str]:
    if not ADAPT.exists():
        muere(f"no está el adaptador · {ADAPT}")
    s = ADAPT.read_text()
    i = s.find("const NOMBRE_DE_FORMA")
    if i < 0:
        muere("`NOMBRE_DE_FORMA` no está en adapt.ts · cambió de nombre")
    bloque = s[i : s.find("}", i)]
    return dict(MAPA.findall(bloque))


# ── 5 · armar ────────────────────────────────────────────────────────────────
def construir() -> list[dict]:
    plots = repertorio()
    dibujados = nombres_del_pen()
    nombre_de_id, minimos, suben = de_la_entrega()
    cable = formas_del_cable()

    faltan = [p["id"] for p in plots if p["id"] not in nombre_de_id]
    if faltan:
        muere(f"la entrega no nombra {len(faltan)} id(s) del repertorio: {faltan[:6]}")

    filas = []
    for orden, p in enumerate(plots, start=1):
        gid = p["id"]
        nombre = nombre_de_id[gid]
        mins = []
        for forma in p["formas"]:
            base = minimos.get(forma)
            sube = suben.get(gid)
            if sube and sube["forma"] == forma:
                # El que sube reemplaza el número de su forma, conservando el
                # sustantivo que la condición ya usaba —`partes`, `items`—.
                sustantivo = base["cuando"].split()[0] if base else "items"
                mins.append(
                    {
                        "forma": cable[forma],
                        "cuando": f"{sustantivo} < {sube['n']}",
                        "razon": sube["razon"],
                    }
                )
            elif base:
                mins.append({"forma": cable[forma], **base})
        fila = {
            "id": gid,
            "nombre": nombre,
            "formas": [cable[f] for f in p["formas"]],
            "soporta_banda": bool(p["soportaBanda"]),
            "minimos": mins,
            "tope": p["tope"],
            "orden": orden,
            "dibujado_en_el_pen": nombre in dibujados,
        }
        filas.append(fila)
    return filas


GO_CABECERA = '''package repository

// ── LAS 49 ENTRADAS DEL REPERTORIO · GENERADO, NO ESCRITO A MANO ────────────
//
// Lo emite `tools/gen-plots.py` del repositorio del front, desde cuatro fuentes
// con dueños distintos: el repertorio legible por máquina de v2 —`formas`,
// `soporta_banda`, `tope`—, el `.pen` —los nombres, que son copy de producto—,
// la decisión del 2026-09-26 —los mínimos— y `NOMBRE_DE_FORMA` del adaptador
// —el mapa al idioma del cable—.
//
// **No se edita a mano.** Si una de las cuatro fuentes cambia, se regenera; un
// cambio escrito acá se pierde en la próxima corrida y produce deriva silenciosa.
//
// **Las formas van en el idioma del cable** —`scalar`, `time_series`—, igual que
// `accepted_shapes` en `blocks`: una ruta hermana que hablara distinto obligaría
// a una capa de traducción más.
//
// **Una lista de mínimos VACÍA es un valor legítimo**, no un dato faltante:
// cuatro formas no declaran mínimo —`escalar`, `escalarConIntervalo`, `prosa`,
// `tabular`— porque una cifra es una cifra y una tabla de una fila es una tabla.

import (
	"encoding/json"
	"fmt"

	"synapse-api/internal/core/domain"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func seedPlots(db *gorm.DB) error {
	if !db.Migrator().HasTable("plots") {
		return nil
	}
	rows, err := defaultPlotSeedRows()
	if err != nil {
		return fmt.Errorf("seedPlots: %w", err)
	}
	if err := db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "plot_id"}},
		DoNothing: true,
	}).Create(&rows).Error; err != nil {
		return fmt.Errorf("seedPlots: %w", err)
	}
	return nil
}

// plotSeed es la fila tal como la emite el generador. Se convierte a
// domain.DDPlot abajo; los tres campos JSON viajan como jsonb.
type plotSeed struct {
	ID           string
	Name         string
	Shapes       []string
	SupportsBand bool
	Minimums     []plotMinimum
	Cap          *plotCap
	SortOrder    int
}

type plotMinimum struct {
	Shape  string `json:"shape"`
	When   string `json:"when"`
	Reason string `json:"reason"`
}

type plotCap struct {
	When   string `json:"when"`
	Reason string `json:"reason"`
}

func defaultPlotSeedRows() ([]domain.DDPlot, error) {
	seeds := []plotSeed{
'''

GO_PIE = '''	}

	rows := make([]domain.DDPlot, 0, len(seeds))
	for _, s := range seeds {
		shapes, err := json.Marshal(s.Shapes)
		if err != nil {
			return nil, fmt.Errorf("plot %q: shapes: %w", s.ID, err)
		}
		// **Nunca `null`**: una lista vacía es «sin mínimos», que es distinto de
		// «no se sabe». `json.Marshal` de un slice nil emite `null`, así que se
		// normaliza acá y no en el consumidor.
		mins := s.Minimums
		if mins == nil {
			mins = []plotMinimum{}
		}
		minimums, err := json.Marshal(mins)
		if err != nil {
			return nil, fmt.Errorf("plot %q: minimums: %w", s.ID, err)
		}
		var cap domain.JSONRaw
		if s.Cap != nil {
			raw, err := json.Marshal(s.Cap)
			if err != nil {
				return nil, fmt.Errorf("plot %q: cap: %w", s.ID, err)
			}
			cap = domain.JSONRaw(raw)
		}
		rows = append(rows, domain.DDPlot{
			PlotID:       s.ID,
			Name:         s.Name,
			Shapes:       domain.JSONRaw(shapes),
			SupportsBand: s.SupportsBand,
			Minimums:     domain.JSONRaw(minimums),
			Cap:          cap,
			SortOrder:    s.SortOrder,
		})
	}
	return rows, nil
}
'''


def go_literal(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def emitir_go(filas: list[dict]) -> str:
    out = [GO_CABECERA]
    for f in filas:
        shapes = ", ".join(go_literal(x) for x in f["formas"])
        if f["minimos"]:
            mins = "[]plotMinimum{" + ", ".join(
                "{" + f"{go_literal(m['forma'])}, {go_literal(m['cuando'])}, {go_literal(m['razon'])}" + "}"
                for m in f["minimos"]
            ) + "}"
        else:
            mins = "nil"
        cap = (
            "&plotCap{" + f"{go_literal(f['tope']['cuando'])}, {go_literal(f['tope']['razon'])}" + "}"
            if f["tope"]
            else "nil"
        )
        out.append(
            f"\t\t{{{go_literal(f['id'])}, {go_literal(f['nombre'])}, "
            f"[]string{{{shapes}}}, {str(f['soporta_banda']).lower()}, "
            f"{mins}, {cap}, {f['orden']}}},\n"
        )
    out.append(GO_PIE)
    return "".join(out)


def main() -> int:
    check = "--check" in sys.argv
    filas = construir()

    js = json.dumps(filas, ensure_ascii=False, indent=2) + "\n"
    go = emitir_go(filas)

    if check:
        malo = []
        for ruta, esperado in ((SALIDA_JSON, js), (SALIDA_GO, go)):
            if not ruta.exists() or ruta.read_text() != esperado:
                malo.append(ruta.relative_to(RAIZ))
        if malo:
            print(f"gen-plots ✗ desincronizado · corré `npm run gen:plots` · {malo}")
            return 1
        print(f"gen-plots ✓ {len(filas)} gráficos · los dos artefactos al día")
        return 0

    SALIDA_JSON.parent.mkdir(parents=True, exist_ok=True)
    SALIDA_GO.parent.mkdir(parents=True, exist_ok=True)
    SALIDA_JSON.write_text(js)
    SALIDA_GO.write_text(go)

    con_min = sum(1 for f in filas if f["minimos"])
    con_tope = sum(1 for f in filas if f["tope"])
    dibujados = sum(1 for f in filas if f["dibujado_en_el_pen"])
    print(
        f"gen-plots ✓ {len(filas)} gráficos · {con_min} con mínimo · {con_tope} con tope"
        f" · {dibujados} dibujados en el `.pen`"
    )
    print(f"  → {SALIDA_JSON.relative_to(RAIZ)}")
    print(f"  → {SALIDA_GO.relative_to(RAIZ)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
