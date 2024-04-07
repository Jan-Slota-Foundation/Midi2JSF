import express from 'express';
import connectBusboy from 'connect-busboy';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MidiParser from "midi-parser-js"; // Ensure this import matches the library's expected usage

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000; // Define your port here

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('Welcome to the MIDI File Uploader!');
});

// Use connectBusboy middleware only in the upload route where it's needed
app.post('/upload', connectBusboy({ immediate: true }), (req, res) => {
    req.busboy.on('file', (fieldname, file, filename) => {
        console.log(`Uploading: ${fieldname}`);
        
        const uploadPath = path.join(__dirname, 'uploads');
        fs.mkdirSync(uploadPath, { recursive: true });

        const safeFilename = path.basename(fieldname);
        const filePath = path.join(uploadPath, safeFilename);

        const fstream = fs.createWriteStream(filePath);
        file.pipe(fstream);

        fstream.on('close', async () => {
            console.log(`Upload complete: ${safeFilename}`);

            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return res.status(500).send('Error processing file');
                }
                
                try {
                    const json = MidiParser.parse(data); 
                    var _notes = [];
                    json.track.forEach(element => {
                        element.event.forEach(event => {
                          if (event.type === 8) {  // 8 - note off, 9 - note on
                            const note = event.data[0];
                            const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

                            const noteName = notes[note % 12];
                            const octave = Math.floor(note / 12) - 1; 
                            _notes.push(`${noteName}${octave}`);

                          }
                        });
                      });
                    
                      res.json(_notes);

                } catch (parseError) {
                    console.error('Error parsing MIDI file:', parseError);
                    res.status(500).send('Error parsing MIDI file');
                }
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Počuvam radio expres na ${port}`);
});
