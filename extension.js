const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

const { spawn, spawnSync } = require("child_process");

function activate(context) {
  const output = vscode.window.createOutputChannel("Kick Assembler (C64)");

  const commands = {
    "kickass-c64.build": () => compile(),
    "kickass-c64.build-run": () => run(compile()),
    "kickass-c64.build-debug": () => run(compile({ debug: true })),
    "kickass-c64.build-startup": () => compile({ useStartUp: true }),
    "kickass-c64.build-run-startup": () => run(compile({ useStartUp: true })),
    "kickass-c64.build-debug-startup": () => run(compile({ debug: true, useStartUp: true }))
  };

  const toCommand = ([command, callback]) => vscode.commands.registerCommand(command, callback);
  Object.entries(commands)
    .map(toCommand)
    .forEach(command => context.subscriptions.push(command));

  function findStartUp(file) {
    const fileDir = path.dirname(file);
    const startUp = fs.readdirSync(fileDir).find(fileName => /^startup\..*$/i.test(fileName));

    if (startUp) {
      return path.join(fileDir, startUp);
    }
  }

  function compile({ debug = false, useStartUp = false } = {}) {
    const config = getConfig();
    output.clear();
    output.show();

    const outDir = "bin";
    const currentFile = vscode.window.activeTextEditor.document.fileName;
    const fileToCompile = (useStartUp && findStartUp(currentFile)) || currentFile;
    const breakpointSourceFile = getViceSymbolsFile(fileToCompile);
    const breakpointTargetFile = getBreakpointsFile(fileToCompile);
    const workDir = path.dirname(fileToCompile);
    const binfolder = path.join(workDir, outDir);
    const buildLog = path.join(binfolder, "buildlog.txt");

    if (!fs.existsSync(binfolder)) {
      fs.mkdirSync(binfolder);
    }

    output.appendLine(`Compiling ${fileToCompile}`);

    const debugArgs = debug ? ["-debugdump", "-vicesymbols"] : [];
    const args = ["-jar", config.kickAssJar, "-odir", outDir, "-log", buildLog, "-showmem"];
    let process = spawnSync(config.javaBin, [...args, ...debugArgs, fileToCompile], { cwd: workDir });

    let outputFile, outputDir;

    if (process.status === 0) {
      outputFile = replaceFileExtension(fileToCompile, ".prg");
      outputDir = binfolder;
      createC64DebuggerBreakpointFile(binfolder, breakpointSourceFile, breakpointTargetFile);
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

  function createC64DebuggerBreakpointFile(binfolder, breakpointSourceFile, breakpointTargetFile) {
    const sourceFilePath = path.join(binfolder, breakpointSourceFile);
    const targetFilePath = path.join(binfolder, breakpointTargetFile);
    const viceBreakpointConfigRows = fs
      .readFileSync(sourceFilePath)
      .toString("utf-8")
      .split("\n");
    const c64DebuggerBreakPoints = [];

    viceBreakpointConfigRows.forEach(function(configrow) {
      if (configrow.indexOf("break") === 0) {
        c64DebuggerBreakPoints.push(configrow);
      }
    });

    const filecontents = c64DebuggerBreakPoints.join("\n");
    var syncFileWriter = fs.openSync(targetFilePath, "w");
    fs.writeSync(syncFileWriter, filecontents + "\n");
  }

  function run({ outputFile, outputDir, debug }) {
    const config = getConfig();
    if (!outputFile || !outputDir) return;

    const spawnOptions = {
      cwd: outputDir,
      detached: true,
      stdio: "inherit",
      shell: true
    };

    if (debug && config.useC64Debugger) {
      spawn(
        config.c64DebuggerBin,
        ["-autojmp", "-prg", outputFile, "-breakpoints", getBreakpointsFile(outputFile)],
        spawnOptions
      );
    } else {
      const logfile = `${path.basename(outputFile)}-vice.log`;
      const args = ["-logfile", logfile];
      const debugArgs = debug ? ["-moncommands", getViceSymbolsFile(outputFile)] : [];
      spawn(config.viceBin, [...args, ...debugArgs, outputFile], spawnOptions);
    }
  }

  function getViceSymbolsFile(file) {
    return replaceFileExtension(file, ".vs");
  }

  function getBreakpointsFile(file) {
    return replaceFileExtension(file, ".breakpoints");
  }

  function replaceFileExtension(file, newExtension) {
    return path.basename(file).replace(path.extname(file), newExtension);
  }

  function getConfig() {
    return vscode.workspace.getConfiguration("kickass-c64");
  }
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
