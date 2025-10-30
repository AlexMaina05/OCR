# OCR Client-side (Tesseract.js)

Sito statico che esegue OCR (estrazione testo) interamente nel browser usando Tesseract.js (WASM). Supporta:
- Upload immagini (file chooser + drag & drop)
- Acquisizione da camera (getUserMedia) e cattura frame
- Selezione lingua (eng, ita, spa, fra)
- Progress bar e log
- Visualizzazione bounding boxes delle parole
- Copia e download del testo estratto

## Installazione

1. Installa le dipendenze:
```bash
npm install
```

2. Scarica i dati linguistici per Tesseract.js:
```bash
mkdir -p tessdata
cd tessdata
wget https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/eng.traineddata.gz
wget https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/ita.traineddata.gz
wget https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/spa.traineddata.gz
wget https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/fra.traineddata.gz
gunzip *.gz
gzip -k *.traineddata
cd ..
```

3. Avvia un server locale (es. con Python):
```bash
python3 -m http.server 8080
```

4. Apri il browser su `http://localhost:8080`

## Come usare
1. Apri `index.html` in un browser moderno (Chrome/Firefox).
2. Scegli un'immagine o trascinala nella dropzone. In alternativa apri la camera e cattura.
3. Seleziona la lingua corretta.
4. Clicca "Avvia OCR".
5. Dopo il riconoscimento puoi copiare o scaricare il testo, o salvare l'immagine.

## Deploy su GitHub Pages
1. Crea un nuovo repo su GitHub e push dei file (`index.html`, `styles.css`, `main.js`, `README.md`, `package.json`, `package-lock.json`).
2. Assicurati di eseguire l'installazione delle dipendenze e il download dei dati linguistici prima del deploy.
3. Vai su "Settings" -> "Pages" e scegli la branch `main` (o `gh-pages`) e la cartella `/ (root)`.
4. Salva: la pagina sarà disponibile su `https://<tuo-user>.github.io/<repo>` o sul tuo dominio se configurato.

## Note tecniche
- Questa versione usa Tesseract.js v6 con dipendenze locali per evitare problemi con CDN bloccati.
- I file worker e core sono caricati da `node_modules/` locale.
- I dati linguistici devono essere scaricati nella cartella `tessdata/` (vedi istruzioni di installazione sopra).
- Per performance migliori su immagini grandi, ridimensiona l'immagine client-side prima di passare a OCR.

## Licenza
Questo progetto è rilasciato come esempio educativo. Usa la libreria Tesseract.js sotto la sua licenza (MIT).
