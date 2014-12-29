package main

import (
	"fmt"
	"image/jpeg"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"github.com/nfnt/resize"
)

func serveDir(r *mux.Router, prefix, dir string) {
	h := http.StripPrefix(prefix, http.FileServer(http.Dir(dir)))
	r.PathPrefix(prefix).Handler(h)
}

func serveFile(r *mux.Router, fn string) {
	r.Path("/" + fn).HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// TODO: This should pass a chunked read/write loop back.
		c, err := ioutil.ReadFile(fn)
		if err != nil {
			http.Error(w, fmt.Sprintf("cannot read %s: %v", fn, err), 500)
			return
		}
		w.Write(c)
	})
}

func redirect(target string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, target, 302)
	}
}

func thumbnailer(w http.ResponseWriter, r *http.Request) {
	fn := strings.TrimSuffix(r.URL.Path, ".thumb.jpg")

	// TODO: canonicalize
	f, err := os.Open("./data/img/" + fn)
	if err != nil {
		http.Error(w, fmt.Sprintf("cannot open %s: %v", fn, err), 500)
		return
	}
	defer f.Close()

	img, err := jpeg.Decode(f)
	if err != nil {
		http.Error(w, fmt.Sprintf("cannot JPEG decode %s: %v", fn, err), 500)
		return
	}

	t := resize.Resize(160, 0, img, resize.Lanczos3)
	jpeg.Encode(w, t, nil)
}

func main() {
	r := mux.NewRouter()
	r.PathPrefix("/data/thumbs/").Handler(http.StripPrefix("/data/thumbs/", http.HandlerFunc(thumbnailer)))
	for _, pn := range []string{"assets", "doc", "data", "vendor-libs"} {
		serveDir(r, "/"+pn+"/", "./"+pn+"/")
	}
	for _, fn := range []string{"index.html", "pins.js", "gpsplot.js"} {
		serveFile(r, fn)
	}
	r.Path("/").HandlerFunc(redirect("/index.html"))
	http.Handle("/", r)

	s := &http.Server{Addr: "127.0.0.1:8080"}
	log.Fatal(s.ListenAndServe())
}
