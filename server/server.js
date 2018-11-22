const { createConnection, TextDocuments, DiagnosticSeverity, ProposedFeatures } = require("vscode-languageserver");

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments();
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize(({ capabilities }) => {
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  return {
    capabilities: {
      textDocumentSync: documents.syncKind
    }
  };
});

connection.onInitialized(() => {});

documents.onDidChangeContent(change => {
  validateDocument(change.document);
});

async function validateDocument(document) {
  const text = document.getText();

  const pattern = /blah(?:onga)?/g;
  let m;

  let problems = 0;
  const diagnostics = [];

  while ((m = pattern.exec(text)) && problems < 100) {
    problems++;
    diagnostics.push(getDiagnostic(m));
  }

  connection.sendDiagnostics({ uri: document.uri, diagnostics });

  function getDiagnostic(matchArray) {
    const isWarning = matchArray[0] === "blah";

    const diagnostic = {
      severity: isWarning ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
      range: {
        start: document.positionAt(matchArray.index),
        end: document.positionAt(matchArray.index + matchArray[0].length)
      },
      message: `${matchArray[0]} is not ok.`,
      source: "ex"
    };

    if (hasDiagnosticRelatedInformationCapability) {
      return {
        ...diagnostic,
        relatedInformation: [
          {
            location: {
              uri: document.uri,
              range: { ...diagnostic.range }
            },
            message: isWarning ? "Blah is not recommended" : "Blahonga is totally forbidden today"
          }
        ]
      };
    }

    return diagnostic;
  }
}

documents.listen(connection);
connection.listen();
