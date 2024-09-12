import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './App.css'; // 引入样式文件

// Color conversion function, input hex color, output color component object
function hexToComponents(hex) {
  const red = parseInt(hex.slice(1, 3), 16) / 255;
  const green = parseInt(hex.slice(3, 5), 16) / 255;
  const blue = parseInt(hex.slice(5, 7), 16) / 255;

  return {
    red: red.toFixed(3),
    green: green.toFixed(3),
    blue: blue.toFixed(3),
    alpha: "1.000"
  };
}

// Create Contents.json file
function createContentsJson(lightColor, darkColor) {
  return JSON.stringify({
    colors: [
      {
        color: {
          "color-space": "srgb",
          components: hexToComponents(lightColor)
        },
        idiom: "universal"
      },
      {
        appearances: [
          {
            appearance: "luminosity",
            value: "dark"
          }
        ],
        color: {
          "color-space": "srgb",
          components: hexToComponents(darkColor)
        },
        idiom: "universal"
      }
    ],
    info: {
      author: "xcode",
      version: 1
    }
  }, null, 2);
}

// Create colorset directory and write file to JSZip
function createColorsetDirectory(zip, colorName, lightColor, darkColor) {
  const formattedColorName = colorName.replace(/_/g, '-');
  const colorSetDir = `Assets.xcassets/${formattedColorName.charAt(0).toUpperCase() + formattedColorName.slice(1)}.colorset/`;

  const contentsJson = createContentsJson(lightColor, darkColor);
  zip.file(`${colorSetDir}Contents.json`, contentsJson);
}

// Process JSON data and generate colorset
function processColors(jsonData, zip) {
  const schemes = jsonData.schemes;
  const lightScheme = schemes.light;
  const darkScheme = schemes.dark;

  // Process colors under schemes
  for (let key in lightScheme) {
    if (lightScheme.hasOwnProperty(key) && darkScheme.hasOwnProperty(key)) {
      const lightColor = lightScheme[key];
      const darkColor = darkScheme[key];
      createColorsetDirectory(zip, key, lightColor, darkColor);
    }
  }

  // Process colors under palettes (same colors for light and dark mode)
  const palettes = jsonData.palettes;
  for (let paletteKey in palettes) {
    if (palettes.hasOwnProperty(paletteKey)) {
      const palette = palettes[paletteKey];
      for (let colorKey in palette) {
        if (palette.hasOwnProperty(colorKey)) {
          const color = palette[colorKey];
          createColorsetDirectory(zip, `${paletteKey}_${colorKey}`, color, color);
        }
      }
    }
  }
}

const AssetGenerator = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleGenerate = () => {
    try {
      const jsonData = JSON.parse(jsonInput);
      const zip = new JSZip();

      processColors(jsonData, zip);

      // Generate zip file and trigger download
      zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, 'Assets.xcassets.zip');
      });
    } catch (error) {
      setErrorMessage('Invalid JSON input');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonInput(event.target.result);
      setErrorMessage('');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="app-container">
      <div
        className={`drop-area ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <h2>Material Theme Color Exporter</h2>
        <p>Drag and drop JSON file or paste content in the input box</p>
        <textarea
          value={jsonInput}
          onChange={(e) => {
            setJsonInput(e.target.value);
            setErrorMessage('');
          }}
          placeholder="Drag and drop JSON file or paste content here"
          rows={10}
        />
        <br />
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button onClick={handleGenerate}>Generate and Download Assets</button>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <div className="app-wrapper">
      <AssetGenerator />
    </div>
  );
};

export default App;