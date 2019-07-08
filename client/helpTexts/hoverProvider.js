"use strict";
const vscode = require("vscode");

const helpTexts = {
  ...require("./opcodes"),
  ...require("./illegal-opcodes"),
  ...require("./kickass"),
  ...require("./sid-registers"),
  ...require("./vic-registers"),
};

module.exports = {
  provideHover: (document, position) => {
    const word = document.getText(document.getWordRangeAtPosition(position, /[.:\w$]+/));
    const helpText = helpTexts[word.toLowerCase()];
    if (!helpText) return null;

    const markdown = new vscode.MarkdownString();
    markdown.appendCodeblock(helpText.name, "kickassembler");
    markdown.appendMarkdown(helpText.descr);
    return new vscode.Hover(markdown);
  },
};
