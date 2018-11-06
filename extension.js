const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

const { spawn, spawnSync } = require("child_process");

function activate(context) {
  const output = vscode.window.createOutputChannel("Kick Assembler (C64)");

  const javaPath = "/usr/bin/java";
  const kickPath = "/Users/roger/Downloads/KickAssembler-5.0/KickAss.jar";
  const vicePath = "/usr/local/bin/x64";
  // const c64DebuggerPath = "/Applications/C64Debugger.app/Contents/MacOS/C64Debugger";
  const startupRegex = /^startup\..*$/i;
  const outDir = "bin";

  const build = vscode.commands.registerCommand("kickass-c64.build", function() {
    compile();
  });

  const buildRun = vscode.commands.registerCommand("kickass-c64.build-run", function() {
    run(compile());
  });

  const buildRunStartup = vscode.commands.registerCommand("kickass-c64.build-run-startup", function() {
    run(compile({ useStartUp: true }));
  });

  context.subscriptions.push(build);
  context.subscriptions.push(buildRun);
  context.subscriptions.push(buildRunStartup);

  function findStartUp(file) {
    const fileDir = path.dirname(file);
    const startUp = fs.readdirSync(fileDir).find(fileName => startupRegex.test(fileName));

    if (startUp) {
      return path.join(fileDir, startUp);
    }
  }

  function compile({ debug = false, useStartUp = false } = {}) {
    output.clear();
    output.show();

    const currentFile = vscode.window.activeTextEditor.document.fileName;
    const fileToCompile = (useStartUp && findStartUp(currentFile)) || currentFile;
    const workDir = path.dirname(fileToCompile);
    const buildLog = path.join(outDir, "buildlog.txt");

    if (!fs.existsSync(path.join(workDir, outDir))) {
      fs.mkdirSync(path.join(workDir, outDir));
    }

    output.appendLine(`Compiling ${fileToCompile}`);

    const debugArgs = debug ? ["-debugdump", "-vicesymbols"] : [];
    const args = ["-jar", kickPath, "-odir", outDir, "-log", buildLog, "-showmem", ...debugArgs, fileToCompile];
    let process = spawnSync(javaPath, args, { cwd: workDir });

    let outputFile, outputDir;

    if (process.status === 0) {
      const ext = path.extname(fileToCompile);
      outputFile = path.basename(fileToCompile).replace(ext, ".prg");
      outputDir = path.join(workDir, outDir);
    } else {
      vscode.window.showErrorMessage("Compilation failed with errors.");
      output.append(process.stderr.toString());
    }

    output.append(process.stdout.toString());

    return {
      outputFile,
      outputDir,
      debug
    };
  }

  function run({ outputDir, outputFile }) {
    if (!outputFile || !outputDir) return;

    const logfile = `${path.basename(outputFile)}-vice.log`;

    spawn(vicePath, ["-logfile", logfile, outputFile], {
      cwd: outputDir,
      detached: true,
      stdio: "inherit",
      shell: true
    });
  }
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
