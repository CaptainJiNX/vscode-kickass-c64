const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const { LanguageClient, TransportKind } = require("vscode-languageclient");

const helpTexts = {
  ...require("../helpTexts/opcodes"),
  ...require("../helpTexts/illegal-opcodes"),
  ...require("../helpTexts/kickass"),
  ...require("../helpTexts/sid-registers"),
  ...require("../helpTexts/vic-registers")
};

const { spawn, spawnSync } = require("child_process");

function activate(context) {
  const output = vscode.window.createOutputChannel("Kick Assembler (C64)");

  const server = {
    module: context.asAbsolutePath(path.join("server", "server.js")),
    transport: TransportKind.ipc
  };

  const serverOptions = {
    run: server,
    debug: {
      ...server,
      options: { execArgv: ["--nolazy", "--inspect=6009"] }
    }
  };

  const clientOptions = {
    documentSelector: [{ scheme: "file", language: "kickassembler" }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher("**/.clientrc")
    }
  };

  const client = new LanguageClient("kickAss", "KickAss Language Server", serverOptions, clientOptions);
  client.start();

  vscode.languages.registerHoverProvider(
    { scheme: "*", language: "kickassembler" },
    {
      provideHover(document, position) {
        const word = document.getText(document.getWordRangeAtPosition(position, /[.:\w$]+/));
        const helpText = helpTexts[word.toLowerCase()];
        if (!helpText) return null;

        const markdown = new vscode.MarkdownString();
        markdown.appendCodeblock(helpText.name, "kickassembler");
        markdown.appendMarkdown(helpText.descr);
        return new vscode.Hover(markdown);
      }
    }
  );

  const commands = {
    "kickass-c64.build": () => compile(),
    "kickass-c64.build-run": () => run(compile()),
    "kickass-c64.build-debug": () => run(compile({ debug: true })),
    "kickass-c64.build-startup": () => compile({ useStartUp: true }),
    "kickass-c64.build-run-startup": () => run(compile({ useStartUp: true })),
    "kickass-c64.build-debug-startup": () => run(compile({ debug: true, useStartUp: true }))
  };

  const toCommand = ([command, callback]) => vscode.commands.registerCommand(command, callback);
  Object.entries(commands)
    .map(toCommand)
    .forEach(command => context.subscriptions.push(command));

  function findStartUp(file) {
    const fileDir = path.dirname(file);
    const startUp = fs.readdirSync(fileDir).find(fileName => /^startup\..*$/i.test(fileName));

    if (startUp) {
      return path.join(fileDir, startUp);
    }
  }

  function compile({ debug = false, useStartUp = false } = {}) {
    const config = getConfig();
    output.clear();
    output.show();

    const outDir = "bin";
    const currentFile = vscode.window.activeTextEditor.document.fileName;
    const fileToCompile = (useStartUp && findStartUp(currentFile)) || currentFile;
    const workDir = path.dirname(fileToCompile);
    const outputDir = path.join(workDir, outDir);
    const buildLog = path.join(outputDir, "buildlog.txt");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    output.appendLine(`Compiling ${fileToCompile}`);

    const debugArgs = debug ? ["-debugdump", "-vicesymbols"] : [];
    const args = ["-jar", config.kickAssJar, "-odir", outDir, "-log", buildLog, "-showmem"];
    let process = spawnSync(config.javaBin, [...args, ...debugArgs, fileToCompile], { cwd: workDir });
    output.append(process.stdout.toString());

    let outputFile;

    if (process.status === 0) {
      outputFile = replaceFileExtension(fileToCompile, ".prg");
      if (debug) {
        createBreakpointsFile(outputDir, outputFile);
      }
    } else {
      vscode.window.showErrorMessage("Compilation failed with errors.");
      output.append(process.stderr.toString());
    }

    return {
      outputFile,
      outputDir,
      debug
    };
  }

  function createBreakpointsFile(outputDir, outputFile) {
    const viceSymbols = path.join(outputDir, getViceSymbolsFile(outputFile));
    if (!fs.existsSync(viceSymbols)) {
      return;
    }

    const breakpoints = fs
      .readFileSync(viceSymbols, { encoding: "utf8" })
      .split("\n")
      .filter(x => x.startsWith("break"));

    if (breakpoints.length === 0) {
      output.appendLine("No breakpoints found, skipping.");
      return;
    }

    const breakpointsFile = path.join(outputDir, getBreakpointsFile(outputFile));

    fs.writeFileSync(breakpointsFile, breakpoints.join("\n") + "\n");
    output.appendLine(`Wrote breakpoints to ${breakpointsFile}`);
  }

  function run({ outputFile, outputDir, debug }) {
    const config = getConfig();
    if (!outputFile || !outputDir) return;

    const spawnOptions = {
      cwd: outputDir,
      detached: true,
      stdio: "inherit",
      shell: true
    };

    if (debug && config.useC64Debugger) {
      let startArgs = getC64DebuggerStartArgs(config, outputFile);
      let c64DebuggerProcess = spawn(config.c64DebuggerBin, startArgs, spawnOptions);
      let spawnStartArgs = c64DebuggerProcess.spawnargs.filter(arg => arg.includes("C64Debugger.exe"))[0];
      if (spawnStartArgs) {
        output.appendLine(`C64Debugger start args: ${spawnStartArgs}`);
      }
    } else {
      const logfile = `${path.basename(outputFile)}-vice.log`;
      const args = ["-logfile", logfile];
      const debugArgs = debug ? ["-moncommands", getViceSymbolsFile(outputFile)] : [];
      spawn(config.viceBin, [...args, ...debugArgs, outputFile], spawnOptions);
    }
  }

  function getViceSymbolsFile(file) {
    return replaceFileExtension(file, ".vs");
  }

  function getBreakpointsFile(file) {
    return replaceFileExtension(file, ".breakpoints");
  }

  function replaceFileExtension(file, newExtension) {
    return path.basename(file).replace(path.extname(file), newExtension);
  }

  function getConfig() {
    return vscode.workspace.getConfiguration("kickass-c64");
  }

  function getC64DebuggerStartArgs(config, outputFile) {
    const staticStartArgs = ["-prg", outputFile, "-breakpoints", getBreakpointsFile(outputFile)];
    let configurableStartArgs = [];
    let configuredC64HexMemAddressIsValid = validC64HexMemAddress(config.useC64DebuggerStartAddress);
    if (config.useC64DebuggerStartAddress && configuredC64HexMemAddressIsValid) {
      configurableStartArgs.push("-jmp");
      configurableStartArgs.push(config.useC64DebuggerStartAddress);
    } else {
      configurableStartArgs.push("-autojmp");
      if (!configuredC64HexMemAddressIsValid)
        output.appendLine(
          `C64DebuggerStartAddress '${config.useC64DebuggerStartAddress}' is not within valid range (x0000 - xFFFF). Configured value ignored, using -autojmp.`
        );
    }
    return configurableStartArgs.concat(staticStartArgs);
  }

  function validC64HexMemAddress(startAddress) {
    if (!startAddress.startsWith("x")) return false;
    let hexAddressValue = startAddress.split("x")[1];
    if (!hexAddressValue) return false;
    const decimalAdressValue = parseInt(hexAddressValue, 16).toString(10);
    if (!(decimalAdressValue >= 0 && decimalAdressValue <= 65535)) return false;

    return true;
  }
}

exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
