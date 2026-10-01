package repository

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
		{"kpi", "KPI", []string{"scalar"}, false, nil, nil, 1},
		{"gauge", "ARCO", []string{"scalar"}, false, nil, nil, 2},
		{"bullet", "BULLET", []string{"scalar"}, false, nil, nil, 3},
		{"rings", "ANILLOS", []string{"scalar"}, false, nil, nil, 4},
		{"spark", "MICRO TENDENCIA", []string{"scalar", "time_series"}, false, []plotMinimum{{"time_series", "puntos < 2", "un punto no es una tendencia"}}, nil, 5},
		{"interval", "INTERVALO", []string{"scalar_with_interval", "series_with_band"}, true, []plotMinimum{{"series_with_band", "puntos < 2", "un punto no es una tendencia"}}, nil, 6},
		{"forecast", "PRONÓSTICO", []string{"scalar_with_interval", "series_with_band"}, true, []plotMinimum{{"series_with_band", "puntos < 2", "un punto no es una tendencia"}}, nil, 7},
		{"tornado", "TORNADO", []string{"scalar_with_interval", "compared_categorical"}, true, []plotMinimum{{"compared_categorical", "items < 2", "una barra sola no compara nada"}}, nil, 8},
		{"columns", "COLUMNAS", []string{"time_series", "categorical"}, false, []plotMinimum{{"time_series", "puntos < 2", "un punto no es una tendencia"}, {"categorical", "items < 2", "una barra sola no compara nada"}}, &plotCap{"etiquetas > 16 caracteres", "etiqueta larga en columna vertical; usar bars"}, 9},
		{"area", "ÁREA", []string{"time_series"}, false, []plotMinimum{{"time_series", "puntos < 2", "un punto no es una tendencia"}}, nil, 10},
		{"step", "ESCALERA", []string{"time_series"}, false, []plotMinimum{{"time_series", "puntos < 2", "un punto no es una tendencia"}}, nil, 11},
		{"cycle", "CICLO", []string{"time_series"}, false, []plotMinimum{{"time_series", "puntos < 2", "un punto no es una tendencia"}}, nil, 12},
		{"candle", "RANGO DIARIO", []string{"time_series"}, false, []plotMinimum{{"time_series", "puntos < 2", "un punto no es una tendencia"}}, nil, 13},
		{"control", "CONTROL", []string{"time_series", "series_with_band"}, true, []plotMinimum{{"time_series", "puntos < 2", "un punto no es una tendencia"}, {"series_with_band", "puntos < 2", "un punto no es una tendencia"}}, nil, 14},
		{"multiline", "LÍNEAS", []string{"time_series", "multi_series"}, false, []plotMinimum{{"time_series", "puntos < 2", "un punto no es una tendencia"}, {"multi_series", "series < 2", "una sola serie no se compara con nada"}}, nil, 15},
		{"stackarea", "ÁREA APILADA", []string{"multi_series"}, false, []plotMinimum{{"multi_series", "series < 2", "una sola serie no se compara con nada"}}, nil, 16},
		{"combo", "COMBINADO", []string{"multi_series"}, false, []plotMinimum{{"multi_series", "series < 2", "una sola serie no se compara con nada"}}, nil, 17},
		{"smallmult", "MÚLTIPLOS", []string{"multi_series"}, false, []plotMinimum{{"multi_series", "series < 2", "una sola serie no se compara con nada"}}, nil, 18},
		{"bump", "RANKING", []string{"multi_series", "ranking"}, false, []plotMinimum{{"multi_series", "series < 2", "una sola serie no se compara con nada"}, {"ranking", "items < 3", "un ranking de dos es una comparación"}}, nil, 19},
		{"slope", "PENDIENTE", []string{"multi_series", "compared_categorical"}, false, []plotMinimum{{"multi_series", "series < 2", "una sola serie no se compara con nada"}, {"compared_categorical", "items < 2", "una barra sola no compara nada"}}, nil, 20},
		{"bars", "BARRAS", []string{"categorical", "ranking"}, false, []plotMinimum{{"categorical", "items < 2", "una barra sola no compara nada"}, {"ranking", "items < 3", "un ranking de dos es una comparación"}}, nil, 21},
		{"lollipop", "LOLLIPOP", []string{"categorical", "ranking"}, false, []plotMinimum{{"categorical", "items < 2", "una barra sola no compara nada"}, {"ranking", "items < 3", "un ranking de dos es una comparación"}}, nil, 22},
		{"donut", "DONA", []string{"composition"}, false, []plotMinimum{{"composition", "partes < 2", "una parte sola es el 100 %"}}, &plotCap{"partes > 5", "más de cinco partes, ilegible en dona"}, 23},
		{"treemap", "TREEMAP", []string{"composition"}, false, []plotMinimum{{"composition", "partes < 3", "con dos rectángulos es una barra apilada"}}, nil, 24},
		{"radial", "BARRAS RADIALES", []string{"categorical"}, false, []plotMinimum{{"categorical", "items < 2", "una barra sola no compara nada"}}, nil, 25},
		{"pareto", "PARETO", []string{"categorical"}, false, []plotMinimum{{"categorical", "items < 3", "con dos categorías no hay concentración que mostrar"}}, nil, 26},
		{"grouped", "COLUMNAS AGRUPADAS", []string{"compared_categorical"}, false, []plotMinimum{{"compared_categorical", "items < 2", "una barra sola no compara nada"}}, nil, 27},
		{"dumbbell", "DUMBBELL", []string{"compared_categorical"}, false, []plotMinimum{{"compared_categorical", "items < 2", "una barra sola no compara nada"}}, nil, 28},
		{"stacked", "COLUMNAS APILADAS", []string{"composition"}, false, []plotMinimum{{"composition", "partes < 2", "una parte sola es el 100 %"}}, nil, 29},
		{"stacked100", "APILADO 100%", []string{"composition"}, false, []plotMinimum{{"composition", "partes < 2", "una parte sola es el 100 %"}}, nil, 30},
		{"marimekko", "MARIMEKKO", []string{"composition"}, false, []plotMinimum{{"composition", "partes < 2", "una parte sola es el 100 %"}}, nil, 31},
		{"waterfall", "CASCADA", []string{"composition"}, false, []plotMinimum{{"composition", "partes < 3", "una cascada de dos pasos es una diferencia"}}, nil, 32},
		{"funnel", "EMBUDO", []string{"composition", "flow"}, false, []plotMinimum{{"composition", "partes < 2", "una parte sola es el 100 %"}, {"flow", "etapas < 3", "dos etapas son una tasa de conversión, y eso es una cifra"}}, nil, 33},
		{"heatmap", "MAPA DE CALOR", []string{"matrix"}, false, []plotMinimum{{"matrix", "filas < 2 o columnas < 2", "una matriz de una fila es un gráfico de barras"}}, nil, 34},
		{"cohort", "COHORTES", []string{"matrix"}, false, []plotMinimum{{"matrix", "filas < 2 o columnas < 2", "una matriz de una fila es un gráfico de barras"}}, nil, 35},
		{"calendar", "CALENDARIO", []string{"matrix"}, false, []plotMinimum{{"matrix", "filas < 2 o columnas < 2", "una matriz de una fila es un gráfico de barras"}}, nil, 36},
		{"matrix", "MATRIX", []string{"matrix"}, false, []plotMinimum{{"matrix", "filas < 2 o columnas < 2", "una matriz de una fila es un gráfico de barras"}}, nil, 37},
		{"histogram", "HISTOGRAMA", []string{"distribution"}, false, []plotMinimum{{"distribution", "cortes < 3", "con dos cortes es una comparación, no una distribución"}}, nil, 38},
		{"box", "CAJA", []string{"distribution"}, false, []plotMinimum{{"distribution", "cortes < 3", "con dos cortes es una comparación, no una distribución"}}, nil, 39},
		{"scatter", "DISPERSIÓN", []string{"distribution"}, false, []plotMinimum{{"distribution", "cortes < 3", "con dos cortes es una comparación, no una distribución"}}, nil, 40},
		{"bubble", "BURBUJAS", []string{"distribution"}, false, []plotMinimum{{"distribution", "cortes < 3", "con dos cortes es una comparación, no una distribución"}}, nil, 41},
		{"cuadrantes", "CUADRANTES", []string{"distribution"}, false, []plotMinimum{{"distribution", "cortes < 3", "con dos cortes es una comparación, no una distribución"}}, &plotCap{"cuadrantes sin rótulo", "promete una decisión por zona y sin rótulo no la entrega"}, 42},
		{"sankey", "FLUJO", []string{"flow"}, false, []plotMinimum{{"flow", "etapas < 3", "dos etapas son una tasa de conversión, y eso es una cifra"}}, nil, 43},
		{"network", "GRAFO", []string{"flow", "graph"}, false, []plotMinimum{{"flow", "etapas < 3", "dos etapas son una tasa de conversión, y eso es una cifra"}, {"graph", "aristas < 2", "una sola relación se dice con una frase"}}, nil, 44},
		{"radar", "RADAR", []string{"multi_attribute_profile"}, false, []plotMinimum{{"multi_attribute_profile", "atributos < 3", "con dos ejes el radar es una línea"}}, &plotCap{"perfiles > 3", "por encima de tres, los polígonos se superponen y ninguno se lee"}, 45},
		{"list", "LIST", []string{"ranking"}, false, []plotMinimum{{"ranking", "items < 3", "un ranking de dos es una comparación"}}, nil, 46},
		{"table", "TABLE", []string{"tabular", "ranking"}, false, []plotMinimum{{"ranking", "items < 3", "un ranking de dos es una comparación"}}, nil, 47},
		{"prose", "PROSE", []string{"prose"}, false, nil, nil, 48},
		{"reco", "RECO", []string{"prose"}, false, nil, nil, 49},
	}

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
