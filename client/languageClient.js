"use strict";
const vscode = require("vscode");
const path = require("path");
const { LanguageClient, TransportKind } = require("vscode-languageclient");

module.exports = {
  create,
};

function create(context) {
  const server = {
    module: context.asAbsolutePath(path.join("server", "server.js")),
    transport: TransportKind.ipc,
  };

  const serverOptions = {
    run: server,
    debug: {
      ...server,
      options: { execArgv: ["--nolazy", "--inspect=6009"] },
    },
  };

  const clientOptions = {
    documentSelector: [{ scheme: "file", language: "kickassembler" }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher("**/.clientrc"),
    },
  };

  return new LanguageClient("kickAss", "KickAss Language Server", serverOptions, clientOptions);
}
