// La vista previa del correo del reporte · F6.11
//
//	go run correo/vista-previa.go <carpeta>
//
// Ejecuta correo/reporte.html con datos de ejemplo —los del dibujo A7 del
// .pen, Terpel en septiembre de 2026— y escribe cuatro archivos: el correo de
// un usuario y el de un externo, cada uno sobre un fondo claro y uno oscuro.
//
// El fondo lo pone esta vista previa y NO la plantilla (P6.15): en el envío
// real lo pone el cliente de correo. Por eso se mira en los dos.
//
// Se corre desde la raíz del repositorio. Usa sólo la biblioteca estándar,
// así que no necesita go.mod.
package main

import (
	"encoding/base64"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"strings"
)

type respuesta struct {
	Question, Answer string
	Sources          []string
}

// Dos fondos de cliente de correo · los de Gmail en claro y en oscuro.
var fondos = map[string]string{
	"claro":  "background:#ffffff;color:#1f1f1f;",
	"oscuro": "background:#1f1f1f;color:#e3e3e3;",
}

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "uso: go run correo/vista-previa.go <carpeta>")
		os.Exit(2)
	}
	salida := os.Args[1]
	plantilla := template.Must(template.ParseFiles("correo/reporte.html"))
	png, err := os.ReadFile("src/assets/images/wordmark-marca.png")
	if err != nil {
		panic(err)
	}
	// En el envío va embebido como cid:synapse-logo; acá, en línea.
	logo := template.URL("data:image/png;base64," + base64.StdEncoding.EncodeToString(png))

	fuente := []string{"Reporte de pauta DataTerpel · septiembre 2026 · cargado el 3 oct 06:10"}
	respuestas := []respuesta{
		{"¿Cuánto invertimos en pauta digital el mes pasado y cómo vamos contra el presupuesto?", "Se invirtieron COP 603,7 M en pauta digital en septiembre, el 97,3 % del presupuesto.", fuente},
		{"¿Cuántas impresiones y clics trajo la pauta?", "La pauta trajo 212,4 M de impresiones y 3,06 M de clics: un CTR de 1,4 %, calculado sobre las sumas.", fuente},
		{"¿Qué plataforma concentró la inversión?", "YouTube concentró la inversión, con el 21 % del gasto. Le siguen Facebook e Instagram, y DV360.", fuente},
	}

	if err := os.MkdirAll(salida, 0o755); err != nil {
		panic(err)
	}
	for _, caso := range []string{"usuario", "externo"} {
		datos := map[string]any{
			"Report": "Pauta digital · mensual", "Tenant": "Terpel Colombia", "LogoSrc": logo,
			"Preheader":  "Se invirtieron COP 603,7 M en pauta digital en septiembre.",
			"ConsoleURL": "https://qa-synapse.lobueno.co/?period=2026-09",
			"Why":        "Recibes este correo porque eres usuario de Terpel Colombia en Synapse y María Benítez te incluyó en este reporte",
			"UnsubURL":   "https://example.invalid/baja", "Answers": respuestas, "IsTest": false,
		}
		if caso == "externo" {
			datos["ConsoleURL"] = ""
			datos["Why"] = "Recibes este correo porque María Benítez te agregó al reporte Pauta digital · mensual de Terpel Colombia"
		}
		var b strings.Builder
		if err := plantilla.Execute(&b, datos); err != nil {
			panic(err)
		}
		html := b.String()
		if strings.Contains(html, "ZgotmplZ") {
			fmt.Fprintln(os.Stderr, "✗ html/template descartó un valor: hay un estilo o una URL que llega desde una variable")
			os.Exit(1)
		}
		for nombre, estilo := range fondos {
			conFondo := strings.Replace(html, `<body style="margin:0;padding:0;">`, `<body style="margin:0;padding:0;`+estilo+`">`, 1)
			archivo := filepath.Join(salida, caso+"-"+nombre+".html")
			if err := os.WriteFile(archivo, []byte(conFondo), 0o644); err != nil {
				panic(err)
			}
			fmt.Println(archivo)
		}
	}
}
