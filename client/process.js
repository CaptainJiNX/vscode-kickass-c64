"use strict";

const { spawn, spawnSync } = require("child_process");
const output = require("./output");

module.exports = {
  spawn: wrap(spawn),
  spawnSync: wrap(spawnSync),
};

function wrap(fn) {
  return (...args) => {
    output.append(`\nChild process ${fn.name}: `);
    output.append(`${args[0]} ${args[1].join(" ")}\n\n`);
    return fn(...args);
  };
}
