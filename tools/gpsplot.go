package main

import (
	"fmt"
	"image/jpeg"
	"log"
	"net/http"
	"net/url"
	"os"
	"runtime"

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
	fn, err := url.QueryUnescape(vars["imagePath"])

	if err != nil {
		http.Error(w, fmt.Sprintf("cannot unescape url %s: %v", fn, err), 500)
		return
	}

	// TODO: canonicalize
	f, err := os.Open("./" + fn)
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
	numcpu := runtime.NumCPU() - 1
	if numcpu < 1 {
		numcpu = 1
	}
	runtime.GOMAXPROCS(numcpu)

	r := mux.NewRouter()
	r.Queries("imagePath", "{imagePath:.*}").Handler(http.StripPrefix("/data/thumbs/", http.HandlerFunc(thumbnailer)))
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
	log.Println("started serving on http://127.0.0.1:8080")
	log.Fatal(s.ListenAndServe())
}
