"use strict";

const vscode = require("vscode");

const hoverProvider = require("./helpTexts/hoverProvider");
const languageClient = require("./languageClient");
const compile = require("./commands/compile");
const run = require("./commands/run");

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
}

exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
