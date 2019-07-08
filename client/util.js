"use strict";
const vscode = require("vscode");
const path = require("path");

module.exports = {
  getConfig,
  replaceFileExtension,
};

function getConfig() {
  return vscode.workspace.getConfiguration("kickass-c64");
}

function replaceFileExtension(file, newExtension) {
  return path.basename(file).replace(path.extname(file), newExtension);
}
