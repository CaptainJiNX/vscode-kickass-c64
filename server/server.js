const fs = require("fs");
const path = require("path");
const tmp = require("tmp");
const { spawnSync } = require("child_process");
const Uri = require("vscode-uri").default;
const {
  createConnection,
  TextDocuments,
  DiagnosticSeverity,
  ProposedFeatures,
  DidChangeConfigurationNotification,
  Position
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
      textDocumentSync: documents.syncKind
    }
  };
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    connection.client.register(DidChangeConfigurationNotification.type);
  }
});

documents.onDidChangeContent(change => {
  validateDocument(change.document);
});

connection.onDidChangeConfiguration(change => {
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

async function getErrors(document) {
  const settings = await getDocumentSettings(document.uri);

  const dir = path.dirname(Uri.parse(document.uri).fsPath);
  const fileToCompile = tmp.tmpNameSync({ dir });
  const asmInfoFile = tmp.tmpNameSync({ dir });

  try {
    fs.writeFileSync(fileToCompile, document.getText());
    spawnSync(
      settings.javaBin,
      [
        "-jar",
        settings.kickAssJar,
        fileToCompile,
        "-noeval",
        "-warningsoff",
        "-asminfo",
        "errors",
        "-asminfo",
        "files",
        "-asminfofile",
        asmInfoFile
      ],
      { cwd: dir }
    );

    const asmInfo = fs.readFileSync(asmInfoFile, "utf8");
    const filesIndex = asmInfo.indexOf("[files]");
    const errorsIndex = asmInfo.indexOf("[errors]");
    const filesPart = asmInfo.substring(filesIndex, errorsIndex > filesIndex ? errorsIndex : undefined);
    const errorsPart = asmInfo.substring(errorsIndex, filesIndex > errorsIndex ? filesIndex : undefined);

    const currentFileNumber = filesPart
      .split("\n")
      .slice(1)
      .map(line => {
        const [number, file] = line.split(";");
        return { number, file };
      })
      .filter(({ file }) => file === fileToCompile)
      .map(({ number }) => Number(number))[0];

    const errors = errorsPart
      .split("\n")
      .slice(1)
      .map(parseLine)
      .filter(({ fileNumber }) => fileNumber === currentFileNumber)
      .map(toError)
      .filter(Boolean);

    return errors;
  } finally {
    fs.unlink(fileToCompile, () => {});
    fs.unlink(asmInfoFile, () => {});
  }

  function parseLine(line) {
    const [, positions, message] = (line || "").split(";");
    const [startRow, startPos, endRow, endPos, fileNumber] = (positions || "").split(",").map(Number);
    return {
      message,
      startRow,
      startPos,
      endRow,
      endPos,
      fileNumber
    };
  }

  function toError({ startRow, startPos, endRow, endPos, message }) {
    if (!startRow || !startPos || !endRow || !endPos || !message) return;
    return {
      severity: DiagnosticSeverity.Error,
      range: {
        start: Position.create(startRow - 1, startPos - 1),
        end: Position.create(endRow - 1, endPos)
      },
      message,
      source: "kickass-c64"
    };
  }
}

documents.listen(connection);
connection.listen();
