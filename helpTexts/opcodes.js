"use strict";

module.exports = generate();

function generate() {
  const codes = [
    ["ADC", "(ADd with Carry)"],
    ["AND", "(bitwise AND with accumulator)"],
    ["ASL", "(Arithmetic Shift Left)"],
    ["BIT", "(test BITs)"],
    ["BPL", "(Branch on PLus)"],
    ["BMI", "(Branch on MInus)"],
    ["BVC", "(Branch on oVerflow Clear)"],
    ["BVS", "(Branch on oVerflow Set)"],
    ["BCC", "(Branch on Carry Clear)"],
    ["BCS", "(Branch on Carry Set)"],
    ["BNE", "(Branch on Not Equal)"],
    ["BEQ", "(Branch on EQual)"],
    ["BRK", "(BReaK)"],
    ["CMP", "(CoMPare accumulator)"],
    ["CPX", "(ComPare X register)"],
    ["CPY", "(ComPare Y register)"],
    ["DEC", "(DECrement memory)"],
    ["EOR", "(bitwise Exclusive OR)"],
    ["CLC", "(CLear Carry)"],
    ["SEC", "(SEt Carry)"],
    ["CLI", "(CLear Interrupt)"],
    ["SEI", "(SEt Interrupt)"],
    ["CLV", "(CLear oVerflow)"],
    ["CLD", "(CLear Decimal)"],
    ["SED", "(SEt Decimal)"],
    ["INC", "(INCrement memory)"],
    ["JMP", "(JuMP)"],
    ["JSR", "(Jump to SubRoutine)"],
    ["LDA", "(LoaD Accumulator)"],
    ["LDX", "(LoaD X register)"],
    ["LDY", "(LoaD Y register)"],
    ["LSR", "(Logical Shift Right)"],
    ["NOP", "(No OPeration)"],
    ["ORA", "(bitwise OR with Accumulator)"],
    ["TAX", "(Transfer A to X)    $AA"],
    ["TXA", "(Transfer X to A)"],
    ["DEX", "(DEcrement X)"],
    ["INX", "(INcrement X)"],
    ["TAY", "(Transfer A to Y)"],
    ["TYA", "(Transfer Y to A)"],
    ["DEY", "(DEcrement Y)"],
    ["INY", "(INcrement Y)"],
    ["ROL", "(ROtate Left)"],
    ["ROR", "(ROtate Right)"],
    ["RTI", "(ReTurn from Interrupt)"],
    ["RTS", "(ReTurn from Subroutine)"],
    ["SBC", "(SuBtract with Carry)"],
    ["STA", "(STore Accumulator)"],
    ["TXS", "(Transfer X to Stack ptr)"],
    ["TSX", "(Transfer Stack ptr to X)"],
    ["PHA", "(PusH Accumulator)"],
    ["PLA", "(PuLl Accumulator)"],
    ["PHP", "(PusH Processor status)"],
    ["PLP", "(PuLl Processor status)"],
    ["STX", "(STore X register)"],
    ["STY", "(STore Y register)"],
  ];

  return codes.reduce((acc, code) => {
    acc[code[0].toLowerCase()] = {
      name: getName(code),
      descr: getDescr(code),
    };
    return acc;
  }, {});

  function getName(code) {
    return `${code[0].toLowerCase()} ${code[1]}`;
  }

  function getDescr(code) {
    return `[Read more...](${getLink(code)})`;
  }

  function getLink(code) {
    return `http://www.6502.org/tutorials/6502opcodes.html#${code[0]}`;
  }
}
