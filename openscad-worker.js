import OpenSCAD from "./openscad.js";
import { addFonts } from "./openscad.fonts.js";
import { addMCAD } from "./openscad.mcad.js";

function ensureDirectoryExists(fs, filePath) {
  const dirIndex = filePath.lastIndexOf("/");
  if (dirIndex != -1) {
    const dirname = filePath.substring(0, dirIndex);
    ensureDirectoryExists(fs, dirname);
    if (dirname != "" && !exists(fs, dirname)) {
      fs.mkdir(dirname);
    }
  }
}

function exists(fs, path) {
  try {
    fs.stat(path);
    return true;
  } catch (e) {
    return false;
  }
}

function safeDump(obj, depth = 3) {
  const seen = new WeakSet();
  
  function clean(val, currentDepth) {
    if (val === null || val === undefined) return val;
    if (typeof val === 'function') {
      return `[Function: ${val.name || 'anonymous'}]`;
    }
    if (typeof val !== 'object') return val;
    if (currentDepth > depth) return '[Object]';
    if (seen.has(val)) return '[Circular]';
    
    seen.add(val);
    
    if (val instanceof Error) {
      const copy = {
        name: val.name,
        message: val.message,
        stack: val.stack
      };
      for (const key of Object.getOwnPropertyNames(val)) {
        if (!(key in copy)) {
          copy[key] = clean(val[key], currentDepth + 1);
        }
      }
      return copy;
    }
    
    if (Array.isArray(val)) {
      return val.map(item => clean(item, currentDepth + 1));
    }
    
    const copy = {};
    const keys = Object.getOwnPropertyNames(val);
    for (const key of keys) {
      try {
        copy[key] = clean(val[key], currentDepth + 1);
      } catch (e) {
        copy[key] = '[Unreadable: ' + e.message + ']';
      }
    }
    return copy;
  }
  
  try {
    const cleaned = clean(obj, 0);
    return JSON.stringify(cleaned, null, 2);
  } catch (e) {
    try {
      let keys = [];
      for (let k in obj) {
        keys.push(k);
      }
      return `[Failed to serialize object. Keys: ${keys.join(', ')}. Error: ${e.message}]`;
    } catch (e2) {
      return `[Failed to serialize object: ${String(obj)}]`;
    }
  }
}

self.onmessage = async function(e) {
  if (e.data.type === 'compile') {
    const { activeFilePath, files, format } = e.data;
    const outFormat = format || '3mf';
    const filename = `output.${outFormat}`;
    
    try {
      // Instantiate a fresh OpenSCAD instance inside the worker
      const instance = await OpenSCAD({
        noInitialRun: true,
        print: function(text) {
          self.postMessage({ type: 'log', text: text, logType: '' });
        },
        printErr: function(text) {
          self.postMessage({ type: 'log', text: text, logType: 'warning' });
        },
        ENV: {
          FONTCONFIG_FILE: "/fonts/fonts.conf",
          FONTCONFIG_PATH: "/fonts"
        }
      });

      // Populate virtual file system with fonts and MCAD libraries
      addFonts(instance);
      addMCAD(instance);

      // Create locale directory to avoid localization warning
      instance.FS.mkdir("/locale");
      
      // Populate the virtual filesystem with the project files
      for (const [filePath, fileContent] of Object.entries(files)) {
        ensureDirectoryExists(instance.FS, filePath);
        instance.FS.writeFile(filePath, fileContent);
      }

      self.postMessage({ type: 'log', text: `Compiling model to ${outFormat.toUpperCase()}...`, logType: 'info' });

      // Execute compilation
      instance.callMain([activeFilePath, "--backend=Manifold", "-o", filename]);
      const output = instance.FS.readFile("/" + filename);
      
      // Post success and transfer the array buffer to avoid copying overhead
      self.postMessage({
        type: 'success',
        format: outFormat,
        buffer: output.buffer
      }, [output.buffer]);
    } catch (err) {
      let errMsg;
      if (err && typeof err === 'object') {
        if (err.stack) {
          errMsg = String(err.stack);
        } else if (err.message && typeof err.message === 'string' && err.message !== '[object Object]') {
          if (err.name && err.name !== 'Error') {
            errMsg = `${err.name}: ${err.message}`;
          } else {
            errMsg = err.message;
          }
          const otherKeys = Object.keys(err).filter(k => k !== 'message' && k !== 'name');
          if (otherKeys.length > 0) {
            errMsg += '\nDetails: ' + safeDump(err);
          }
        } else {
          errMsg = safeDump(err);
        }
      } else {
        errMsg = String(err);
      }
      self.postMessage({ type: 'error', message: errMsg });
    }
  }
};
