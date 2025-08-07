"use strict";

const path = require("path");
const { spawn } = require("child_process");
const os = require("os");
const fs = require("fs");
const { URI } = require("vscode-uri");
const {
  createConnection,
  TextDocuments,
  DiagnosticSeverity,
  ProposedFeatures,
  DidChangeConfigurationNotification,
  Position,
} = require("vscode-languageserver");

const defaultSettings = { kickAssJar: "/Applications/KickAssembler/KickAss.jar", javaBin: "java" };
let globalSettings = defaultSettings;
const documentSettings = new Map();

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments();

let hasConfigurationCapability = false;

connection.onInitialize(({ capabilities }) => {
  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);

  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
    },
  };
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    connection.client.register(DidChangeConfigurationNotification.type);
  }
});

documents.onDidClose((e) => {
  const fileName = URI.parse(e.document.uri).fsPath;
  const documentTempFilePath = getDocumentTempFilePath(fileName);
  fs.unlink(documentTempFilePath, () => {});
});

documents.onDidChangeContent((change) => {
  validateDocument(change.document);
});

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    documentSettings.clear();
  } else {
    globalSettings = change.settings["kickass-c64"] || defaultSettings;
  }

  documents.all().forEach(validateDocument);
});

function getDocumentSettings(resource) {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }

  let result = documentSettings.get(resource);

  if (!result) {
    result = connection.workspace.getConfiguration({ scopeUri: resource, section: "kickass-c64" });
    documentSettings.set(resource, result);
  }

  return result;
}

async function validateDocument(document) {
  const errors = await getErrors(document);
  connection.sendDiagnostics({ uri: document.uri, diagnostics: errors || [] });
}

function getDocumentTempFilePath(fileName) {
  const safeFileName = fileName.replace(/[/\\:]/g, "_"); // Make filename safe
  return path.join(os.tmpdir(), `vscode-kickass-${safeFileName}.tmp`);
}

async function getKickAssembler5AsmInfo(document) {
  const settings = await getDocumentSettings(document.uri);
  const fileName = URI.parse(document.uri).fsPath;

  const documentTempFilePath = getDocumentTempFilePath(fileName);
  fs.writeFileSync(documentTempFilePath, document.getText(), "utf8");

  return new Promise((resolve) => {
    let output = "";

    const classpath = [settings.kickAssJar, settings.kickAssAdditionalClassPath].filter(Boolean).join(path.delimiter);

    const proc = spawn(
      settings.javaBin,
      [
        "-cp",
        classpath,
        "kickass.KickAssembler",
        fileName,
        "-noeval",
        "-asminfo",
        "errors",
        "-asminfo",
        "files",
        "-replacefile",
        fileName,
        documentTempFilePath,
        "-asminfotostdout",
        "-nooutput",
      ],
      { cwd: path.dirname(fileName) }
    );

    proc.stdout.on("data", (data) => {
      output += data;
    });

    proc.on("close", () => {
      resolve(output);
    });
  });
}

async function getKickAssembler4AsmInfo(document) {
  const kickassRunnerJar = path.join(__dirname, "KickAssRunner.jar");
  const settings = await getDocumentSettings(document.uri);
  const fileName = URI.parse(document.uri).fsPath;

  return await new Promise((resolve) => {
    let output = "";

    const classpath = [settings.kickAssJar, kickassRunnerJar, settings.kickAssAdditionalClassPath]
      .filter(Boolean)
      .join(path.delimiter);

    const proc = spawn(
      settings.javaBin,
      ["-cp", classpath, "com.noice.kickass.KickAssRunner", fileName, "-asminfo", "errors", "-asminfo", "files"],
      { cwd: path.dirname(fileName) }
    );

    proc.stdout.on("data", (data) => {
      output += data;
    });

    proc.on("close", () => {
      resolve(output);
    });

    proc.stdin.write(document.getText());
    proc.stdin.end();
  });
}

async function getErrors(document) {
  const fileName = URI.parse(document.uri).fsPath;

  let asmInfo = await getKickAssembler5AsmInfo(document);
  if (!asmInfo.includes("[files]")) {
    asmInfo = await getKickAssembler4AsmInfo(document);
  }

  const filesIndex = asmInfo.indexOf("[files]");
  const errorsIndex = asmInfo.indexOf("[errors]");
  const filesPart = asmInfo.substring(filesIndex, errorsIndex > filesIndex ? errorsIndex : undefined);
  const errorsPart = asmInfo.substring(errorsIndex, filesIndex > errorsIndex ? filesIndex : undefined);

  const currentFileNumber = filesPart
    .split("\n")
    .slice(1)
    .map((line) => {
      const [number, file] = line.split(";");
      return { number, file };
    })
    .filter(({ file }) => file === fileName)
    .map(({ number }) => Number(number))[0];

  const errors = errorsPart
    .split("\n")
    .slice(1)
    .map(parseLine)
    .filter(({ fileNumber }) => fileNumber === currentFileNumber)
    .map(toError)
    .filter(Boolean);

  return errors;

  function parseLine(line) {
    const [, positions, message] = (line || "").split(";");
    const [startRow, startPos, endRow, endPos, fileNumber] = (positions || "").split(",").map(Number);
    return {
      message,
      startRow,
      startPos,
      endRow,
      endPos,
      fileNumber,
    };
  }

  function toError({ startRow, startPos, endRow, endPos, message }) {
    if (!startRow || !startPos || !endRow || !endPos || !message) return;
    return {
      severity: DiagnosticSeverity.Error,
      range: {
        start: Position.create(startRow - 1, startPos - 1),
        end: Position.create(endRow - 1, endPos),
      },
      message,
      source: "kickass-c64",
    };
  }
}

documents.listen(connection);
connection.listen();
