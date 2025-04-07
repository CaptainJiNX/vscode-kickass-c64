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
- `kickass-c64.c64DebuggerBin`: Full path to C64 Debugger binary
- `kickass-c64.runWithC64Debugger`: Run with C64 Debugger
- `kickass-c64.debugWithC64Debugger`: Debug with C64 Debugger
- `kickass-c64.kickAssAdditionalClassPath`: Additional java classpath, useful for Kick Assembler plugin jar files

## Known Issues

- Lots of missing features, but it seems to be working on OSX and Windows 10 now at least.
- Language server has no support for KickAss 3.x (only 4.x and 5.x).

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

Read more about extension development [here](https://code.visualstudio.com/api).

## Release Notes

### 1.7.1

- Fixed classpath delimiter issue.

### 1.7.0

**_This version only seems to have been released to the marketplace, but it was never updated in package.json or tagged in the repo_**

- Avoid focusing the output log
- Ensure file tab is active when compiling/running
- Switch to class path (-cp) mode when starting kick assembler
- Add additional class path setting

### 1.6.1

- Added missing release notes for 1.6.0

### 1.6.0

- Use KickAssembler for language server, instead of special KickAssRunner
- Use original filename for vice vs file
- Remove output dir with rmdirSync instead of unlink
- Added separate options for running and debugging with C64 Debugger (also set to false by default)

### 1.5.1

- Use full paths for arguments to Vice

### 1.5.0

- Keybindings for build, run and debug
- Removed generation of .breakpoints file
- Empties bin folder before build as default
- Support for both running and debugging with C64 debugger
- Support for build annotations "Swoffa style"

### 1.4.0

- Helpfile for all opcodes

### 1.3.0

- Language server that displays errors in source files

### 1.2.1

- Fix for flatmap-stream vulnerability

### 1.2.0

- Support for some help when hovering over VIC and SID registers, illegal op-codes and preprocessor directives

### 1.1.1

- Bugfix: compile stopped working if no symbol file existed

### 1.1.0

- Added generation of .breakpoint file for debugger

### 1.0.0

- Initial release of KickAss (C64)

**Enjoy!**
