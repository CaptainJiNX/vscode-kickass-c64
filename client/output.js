"use strict";

const vscode = require("vscode");
let outputChannel;

module.exports = {
  append: (value) => output().append(value),
  appendLine: (value) => output().appendLine(value),
  clear: () => output().clear(),
  show: () => output().show(),
};

function output() {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Kick Assembler (C64)");
  }

  return outputChannel;
}
