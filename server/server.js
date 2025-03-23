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
  const { tempDoumentPath, tempDoumentAsmInfoPath } = getDocumentTempFilePaths(fileName);
  fs.unlink(tempDoumentPath, () => {});
  fs.unlink(tempDoumentAsmInfoPath, () => {});
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

function getDocumentTempFilePaths(fileName) {
  const safeFileName = fileName.replace(/[/\\:]/g, "_"); // Make filename safe
  const tempDoumentAsmInfoPath = path.join(os.tmpdir(), `vscode-kickass-${safeFileName}-asminfo.tmp`);
  const tempDoumentPath = path.join(os.tmpdir(), `vscode-kickass-${safeFileName}.tmp`);
  return {
    tempDoumentPath,
    tempDoumentAsmInfoPath
  };
}

async function getErrors(document) {
  const settings = await getDocumentSettings(document.uri);
  const fileName = URI.parse(document.uri).fsPath;

  const { tempDoumentPath, tempDoumentAsmInfoPath } = getDocumentTempFilePaths(fileName);
  fs.writeFileSync(tempDoumentPath, document.getText(), "utf8");

  const asmInfo = await new Promise((resolve) => {
    const proc = spawn(
      settings.javaBin,
      [
        "-jar",
        `${settings.kickAssJar}`,
        fileName,
        "-noeval",
        "-asminfo",
        "errors",
        "-asminfo",
        "files",
        "-asminfofile",
        tempDoumentAsmInfoPath,
        "-replacefile",
        fileName,
        tempDoumentPath,
      ],
      { cwd: path.dirname(fileName) }
    );

    proc.on("close", () => {
      const output = fs.readFileSync(tempDoumentAsmInfoPath, "utf8");
      resolve(output);
    });
  });

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
