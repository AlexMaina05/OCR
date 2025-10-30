# OCR Client-side (Tesseract.js)

Sito statico che esegue OCR (estrazione testo) interamente nel browser usando Tesseract.js (WASM). Supporta:
- Upload immagini (file chooser + drag & drop)
- Acquisizione da camera (getUserMedia) e cattura frame
- Selezione lingua (eng, ita, spa, fra)
- Progress bar e log
- Visualizzazione bounding boxes delle parole
- Copia e download del testo estratto

## Come usare
1. Apri `index.html` in un browser moderno (Chrome/Firefox).
2. Scegli un'immagine o trascinala nella dropzone. In alternativa apri la camera e cattura.
3. Seleziona la lingua corretta.
4. Clicca "Avvia OCR".
5. Dopo il riconoscimento puoi copiare o scaricare il testo, o salvare l'immagine.

## Deploy su GitHub Pages
1. Crea un nuovo repo su GitHub e push dei file (`index.html`, `styles.css`, `main.js`, `README.md`).
2. Vai su "Settings" -> "Pages" e scegli la branch `main` (o `gh-pages`) e la cartella `/ (root)`.
3. Salva: la pagina sarà disponibile su `https://<tuo-user>.github.io/<repo>` o sul tuo dominio se configurato.

## Note tecniche
- Tesseract.js caricherà modelli di lingua dalla rete (WASM). La prima esecuzione può impiegare tempo per scaricare i dati del language pack.
- Per lingue non incluse, aggiungi le opzioni di lingua e i relativi files tessdata (in Tesseract v4 i file vengono scaricati automaticamente dal CDN di tesseract.js).
- Per performance migliori su immagini grandi, ridimensiona l'immagine client-side prima di passare a OCR.

## Licenza
Questo progetto è rilasciato come esempio educativo. Usa la libreria Tesseract.js sotto la sua licenza (MIT).
