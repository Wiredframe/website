const fs = require('fs');

const filePath = process.argv[2];
const customPropertiesMap = {}; // Speichert Farben und ihre zugehörigen Variablen
let customPropertiesCounter = 1;

fs.readFile(filePath, 'utf8', function(err, css) {
    if (err) {
        return console.error(err);
    }

    let newCss = css.replace(/#([a-f0-9]{3,6})/gi, function(match) {
        if (!customPropertiesMap[match]) {
            // Wenn die Farbe noch nicht existiert, füge sie hinzu
            customPropertiesMap[match] = `--color-${customPropertiesCounter++}`;
        }
        return `var(${customPropertiesMap[match]})`;
    });

    let customPropertiesString = Object.entries(customPropertiesMap).reduce((acc, [color, varName]) => {
        return acc + `${varName}: ${color};\n`;
    }, "");

    newCss = `:root {\n${customPropertiesString}}\n\n${newCss}`;
    fs.writeFile(filePath, newCss, 'utf8', function(err) {
        if (err) return console.error(err);
        console.log('CSS-Datei erfolgreich konvertiert.');
    });
});
