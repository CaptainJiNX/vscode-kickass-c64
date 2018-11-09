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
- ensure support for more than OSX...

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

> This is only tested on OSX at the moment, but will probably get support for Windows/Linux in the future as well... (It might already work though, I don't know)

## Release Notes

### 1.0.0

Initial release of KickAss (C64)

**Enjoy!**
