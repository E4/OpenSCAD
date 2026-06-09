import OpenSCAD from "./openscad.js";
import { addFonts } from "./openscad.fonts.js";
import { addMCAD } from "./openscad.mcad.js";

self.onmessage = async function(e) {
  if (e.data.type === 'compile') {
    const { code } = e.data;
    
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
      
      const filename = "output.stl";
      instance.FS.writeFile("/input.scad", code);

      self.postMessage({ type: 'log', text: 'Compiling & rendering model...', logType: 'info' });

      // Execute main compilation
      instance.callMain(["/input.scad", "--backend=Manifold", "-o", filename]);

      // Read output STL from the virtual FS
      const output = instance.FS.readFile("/" + filename);
      
      // Post success and transfer the array buffer to avoid copying overhead
      self.postMessage({ type: 'success', buffer: output.buffer }, [output.buffer]);
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message || err.toString() });
    }
  }
};
