package main

import (
	"fmt"
	"image/jpeg"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/nfnt/resize"
)

func redirect(target string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, target, 302)
	}
}

func thumbnailer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fn := vars["filename"]

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

func serveFile(r *mux.Router, path, fn string) {
	r.Path(path).HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, fn)
	})
}

func main() {
	r := mux.NewRouter()
	r.PathPrefix("/data/thumbs/{filename}.thumb.jpg").Handler(http.StripPrefix("/data/thumbs/", http.HandlerFunc(thumbnailer)))
	r.PathPrefix("/data/").Handler(http.StripPrefix("/data/", http.FileServer(http.Dir("./data/"))))
	files := map[string]string{
		"/":           "index.html",
		"/gpsplot.js": "gpsplot.js",
	}
	for path, fn := range files {
		serveFile(r, path, fn)
	}
	r.Path("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "index.html")
	})
	http.Handle("/", r)

	s := &http.Server{Addr: "127.0.0.1:8080"}
	log.Fatal(s.ListenAndServe())
}
