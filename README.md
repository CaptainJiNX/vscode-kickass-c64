# VSCode KickAss (C64)

Visual Studio Code language support for C64 development with [Kick Assembler](http://www.theweb.dk/KickAssembler/Main.html#frontpage).

This is heavily inspired by the [Sublime KickAssembler (C64)](https://github.com/Swoffa/SublimeKickAssemblerC64) package, coded by the almighty [Swoffa](https://csdb.dk/scener/?id=984) from [Noice](https://csdb.dk/group/?id=333). That's where the .tmLanguage file has been copied from.

Also very inspired by the [vscode-kickassembler](https://github.com/tomconte/vscode-kickassembler), made by [Thomas Conté](https://github.com/tomconte)

Thanks to both of you!

_Code like it's 1988!_

## Features

- language configuration/syntax coloring
- some snippets
- build, run and debug commands
- support for [VICE](http://vice-emu.sourceforge.net/) and [C64 Debugger](https://c64-debugger.sourceforge.io/)

Outputs all build artifacts into a `bin/` folder that will be created in the same folder as the currently opened file.

Also supports the Build, Run and Debug of a `Startup.asm` file located in the same folder as the currently opened file.

**Ideas for future releases**

- support some configuration of build output and startup perhaps.
- some sort of Language Server implementation

## Requirements

- Java runtime (to be able to run KickAss.jar)
- [Download Kick Assembler](http://www.theweb.dk/KickAssembler/KickAssembler.zip) and extract it to a nice place
- [Download VICE](http://vice-emu.sourceforge.net/index.html#download) (or install it with `brew install vice`)
- [Download C64 Debugger](https://sourceforge.net/projects/c64-debugger/files/latest/download)

## Extension Settings

This extension contributes the following settings:

- `kickass-c64.kickAssJar`: Full path to KickAss.jar
- `kickass-c64.javaBin`: Full path to java binary
- `kickass-c64.viceBin`: Full path to VICE binary
- `kickass-c64.useC64Debugger`: Debug with C64 Debugger
- `kickass-c64.c64DebuggerBin`: Full path to C64 Debugger binary

## Known Issues

- Lots of missing features, but it seems to be working on OSX and Windows 10 now at least.

## How to contribute

### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/) (with `esbenp.prettier-vscode`, `dbaeumer.vscode-eslint` extensions installed)
- [nvm](https://github.com/creationix/nvm) (download and install)

After you clone the repo, run

`nvm install` to get the latest node version

then

`npm install` to install all dependencies

then

`code .` to start coding...

If everything is setup correctly, the code should be automatically formatted correctly on each save.

Running the extension locally:

- Press `F5` to open a new window with the extension loaded.
- Create a new .asm file
- Verify that stuff works as expected.
- Relaunch the extension from the debug toolbar after making changes to the files listed above.
- You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window load your changes.

Read more about extension development [here](https://code.visualstudio.com/docs/extensions/overview).

## Release Notes

### 1.2.0

Support for some help when hovering over VIC and SID registers, illegal op-codes and preprocessor directives

### 1.1.1

Bugfix: compile stopped working if no symbol file existed

### 1.1.0

Added generation of .breakpoint file for debugger

### 1.0.0

Initial release of KickAss (C64)

**Enjoy!**
