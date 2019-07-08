"use strict";

const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

const { spawn, spawnSync } = require("./process");
const output = require("./output");
const hoverProvider = require("./helpTexts/hoverProvider");
const languageClient = require("./languageClient");

function activate(context) {
  const client = languageClient.create(context);
  client.start();

  vscode.languages.registerHoverProvider({ scheme: "*", language: "kickassembler" }, hoverProvider);

  const commands = {
    "kickass-c64.build": () => compile(),
    "kickass-c64.build-run": () => run(compile()),
    "kickass-c64.build-debug": () => run(compile({ debug: true })),
    "kickass-c64.build-startup": () => compile({ useStartUp: true }),
    "kickass-c64.build-run-startup": () => run(compile({ useStartUp: true })),
    "kickass-c64.build-debug-startup": () => run(compile({ debug: true, useStartUp: true })),
  };

  const toCommand = ([command, callback]) => vscode.commands.registerCommand(command, callback);
  Object.entries(commands)
    .map(toCommand)
    .forEach((command) => context.subscriptions.push(command));

  function findStartUp(file) {
    const fileDir = path.dirname(file);
    const startUp = fs.readdirSync(fileDir).find((fileName) => /^startup\..*$/i.test(fileName));

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
    const workDir = path.dirname(fileToCompile);
    const outputDir = path.join(workDir, outDir);
    const buildLog = path.join(outputDir, "buildlog.txt");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    output.appendLine(`Compiling ${fileToCompile}`);

    const debugArgs = debug ? ["-debugdump", "-vicesymbols"] : [];
    const args = ["-jar", config.kickAssJar, "-odir", outDir, "-log", buildLog, "-showmem"];
    const process = spawnSync(config.javaBin, [...args, ...debugArgs, fileToCompile], { cwd: workDir });
    output.append(process.stdout.toString());

    let outputFile;

    if (process.status === 0) {
      outputFile = replaceFileExtension(fileToCompile, ".prg");
      if (debug) {
        createBreakpointsFile(outputDir, outputFile);
      }
    } else {
      vscode.window.showErrorMessage("Compilation failed with errors.");
      output.append(process.stderr.toString());
    }

    return {
      outputFile,
      outputDir,
      debug,
    };
  }

  function createBreakpointsFile(outputDir, outputFile) {
    const viceSymbols = path.join(outputDir, getViceSymbolsFile(outputFile));
    if (!fs.existsSync(viceSymbols)) {
      return;
    }

    const breakpoints = fs
      .readFileSync(viceSymbols, { encoding: "utf8" })
      .split("\n")
      .filter((x) => x.startsWith("break"));

    if (breakpoints.length === 0) {
      output.appendLine("No breakpoints found, skipping.");
      return;
    }

    const breakpointsFile = path.join(outputDir, getBreakpointsFile(outputFile));

    fs.writeFileSync(breakpointsFile, `${breakpoints.join("\n")}\n`);
    output.appendLine(`Wrote breakpoints to ${breakpointsFile}`);
  }

  function run({ outputFile, outputDir, debug }) {
    const config = getConfig();
    if (!outputFile || !outputDir) return;

    const spawnOptions = {
      cwd: outputDir,
      detached: true,
      stdio: "inherit",
      shell: true,
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
