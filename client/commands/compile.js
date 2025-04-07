"use strict";
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

const { spawnSync } = require("../process");
const output = require("../output");
const { getConfig, replaceFileExtension } = require("../util");

module.exports = function compile({ debug = false, useStartUp = false } = {}) {
  const config = getConfig();
  output.clear();
  output.show();

  const outDir = "bin";
  const currentFile = vscode.window.activeTextEditor.document.fileName;
  const fileToCompile = (useStartUp && findStartUp(currentFile)) || currentFile;
  const defaultOutputFile = replaceFileExtension(fileToCompile, ".prg");
  const workDir = path.dirname(fileToCompile);
  const outputDir = path.join(workDir, outDir);
  const buildLog = path.join(outputDir, "buildlog.txt");

  if (config.emptyBinFolderBeforeBuild) {
    try {
      fs.rmdirSync(outputDir, { force: true, recursive: true, maxRetries: 3 });
    } catch (error) {
      output.appendLine(`Error emptying bin folder: ${error.message}`);
    }
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  output.appendLine(`Compiling ${fileToCompile}`);

  const debugArgs = debug ? [config.debugWithC64Debugger ? "-debugdump" : "-vicesymbols"] : [];
  const args = [
    "-cp",
    `${config.kickAssJar}:${config.kickAssAdditionalClassPath}`,
    "kickass.KickAssembler",
    "-odir",
    outDir,
    "-log",
    buildLog,
    "-showmem",
  ];
  const process = spawnSync(config.javaBin, [...args, ...debugArgs, fileToCompile], { cwd: workDir });
  output.append(process.stdout.toString());

  let outputFile;

  if (process.status === 0) {
    const buildAnnotations = parseBuildAnnotations(fileToCompile);
    outputFile = buildAnnotations["file-to-run"] || defaultOutputFile;
  } else {
    vscode.window.showErrorMessage("Compilation failed with errors.");
    output.append(process.stderr.toString());
  }

  return {
    fileToCompile,
    outputFile,
    outputDir,
    debug,
  };
};

function findStartUp(file) {
  const fileDir = path.dirname(file);
  const startUp = fs.readdirSync(fileDir).find((fileName) => /^startup\..*$/i.test(fileName));

  if (startUp) {
    return path.join(fileDir, startUp);
  }
}

function parseBuildAnnotations(file) {
  const regex = /^\s*\/\/\s*@kickass-build\s*"([^"]*)"\s*:\s*"([^"]*)"/gm;
  const content = fs.readFileSync(file);
  const annotations = {};

  let m;
  while ((m = regex.exec(content)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    annotations[m[1]] = m[2];
    output.appendLine(`Found build annotation (${m[1]}: ${m[2]})`);
  }

  return annotations;
}
