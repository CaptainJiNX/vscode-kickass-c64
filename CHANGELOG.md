# Change Log

All notable changes to the "kickass-c64" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [1.7.1] - 2025-08-07

### Fixed

- Fixed classpath delimiter issue.

## [1.7.0] - 2025-04-07

**_This version only seems to have been released to the marketplace, but it was never updated in package.json or tagged in the repo_**

### Fixed

- Avoid focusing the output log
- Ensure file tab is active when compiling/running

### Added

- Switch to class path (-cp) mode when starting kick assembler
- Add additional class path setting

## [1.6.1] - 2025-03-24

### Added

- Added missing release notes for 1.6.0

## [1.6.0] - 2025-03-24

### Fixed

- Use KickAssembler for language server, instead of special KickAssRunner
- Use original filename for vice vs file
- Remove output dir with rmdirSync instead of unlink

### Added

- Added separate options for running and debugging with C64 Debugger (also set to false by default)

## [1.5.1] - 2025-03-21

### Fixed

- Use full paths for arguments to Vice

## [1.5.0] - 2019-07-09

### Added

- Keybindings for build, run and debug
- Removed generation of .breakpoints file
- Empties bin folder before build as default
- Support for both running and debugging with C64 debugger
- Support for build annotations "Swoffa style"

## [1.4.0] - 2019-07-05

### Added

- Helpfile for all opcodes

## [1.3.0] - 2018-11-29

### Added

- Language server that displays errors in source files

## [1.2.1] - 2018-11-27

### Fixed

- Patch for flatmap-stream vulnerability

## [1.2.0] - 2018-11-16

### Added

- Support for some help when hovering over VIC and SID registers, illegal op-codes and preprocessor directives

## [1.1.1] - 2018-11-12

### Fixed

- Failed to compile when no symbolfile existed.

## [1.1.0] - 2018-11-12

### Added

- Generating .breakpoints file for debugger
- Tested on Windows 10

## [1.0.0] - 2018-11-09

### Added

- Language support files
- Snippets
- Build, run and debug commands
- Support for C64 Debugger
