"use strict";
const path = require("path");

const { spawn } = require("../process");
const { getConfig, replaceFileExtension } = require("../util");

module.exports = function run({ fileToCompile, outputFile, outputDir, debug }) {
  const config = getConfig();
  if (!outputFile || !outputDir) return;

  const spawnOptions = {
    cwd: outputDir,
    detached: true,
    stdio: "inherit",
    shell: true,
  };

  if (config.useC64Debugger) {
    const layoutArg = `-layout ${debug ? "10" : "1"}`;
    const args = ["-wait 2500", "-prg", outputFile, "-autojmp"];
    const debugArgs = debug ? ["-debuginfo", replaceFileExtension(outputFile, ".dbg")] : [];
    spawn(config.c64DebuggerBin, [layoutArg, ...debugArgs, ...args], spawnOptions);
  } else {
    const logfile = path.join(outputDir, `${path.basename(outputFile)}-vice.log`);
    const args = ["-logfile", logfile];
    const debugArgs = debug ? ["-moncommands", path.join(outputDir, replaceFileExtension(fileToCompile, ".vs"))] : [];
    const fullOutputFile = path.join(outputDir, outputFile);
    spawn(config.viceBin, [...args, ...debugArgs, fullOutputFile], spawnOptions);
  }
};
