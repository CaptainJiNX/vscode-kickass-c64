"use strict";
const path = require("path");

const { spawn } = require("../process");
const { getConfig, replaceFileExtension } = require("../util");

module.exports = function run({ outputFile, outputDir, debug }) {
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
      [
        "-layout 10",
        "-debuginfo",
        replaceFileExtension(outputFile, ".dbg"),
        "-wait 2500",
        "-prg",
        outputFile,
        "-autojmp",
      ],
      spawnOptions
    );
  } else {
    const logfile = `${path.basename(outputFile)}-vice.log`;
    const args = ["-logfile", logfile];
    const debugArgs = debug ? ["-moncommands", replaceFileExtension(outputFile, ".vs")] : [];
    spawn(config.viceBin, [...args, ...debugArgs, outputFile], spawnOptions);
  }
};
