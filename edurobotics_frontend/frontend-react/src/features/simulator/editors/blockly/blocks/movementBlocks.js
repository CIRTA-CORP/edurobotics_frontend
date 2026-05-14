import * as Blockly from "blockly";
import { pythonGenerator, Order } from "blockly/python";

Blockly.Blocks["start"] = {
  init: function () {
    this.jsonInit({
      type: "start",
      message0: "Inicio",
      inputsInline: true,
      nextStatement: null,
      colour: 160,
      tooltip: "Marca el comienzo de ejecución.",
      startHat: true,
      // "helpUrl": "http://www.w3schools.com/jsref/jsref_length_string.asp"
    });
  },
};

pythonGenerator.forBlock["start"] = function (block) {
  var code = "#BLOCKLY - PYTHON\n";
  return code;
};

Blockly.Blocks["avanzar"] = {
  init: function () {
    this.jsonInit({
      type: "velocidad",
      message0: "Avanzar %1 ",
      args0: [
        {
          type: "input_value",
          name: "vel",
          check: "Number",
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Fija la velocidad que el robot avanzará.",

      // "helpUrl": "http://www.w3schools.com/jsref/jsref_length_string.asp"
    });
  },
};

pythonGenerator.forBlock["avanzar"] = function (block) {
  var vel = pythonGenerator.valueToCode(
    block,
    "vel",
    Order.ATOMIC
  );

  var code = `robot.base.move(vel=${vel})\n`;
  return code;
};

Blockly.Blocks["retroceder"] = {
  init: function () {
    this.jsonInit({
      type: "velocidad",
      message0: "Retroceder %1 ",
      args0: [
        {
          type: "input_value",
          name: "vel",
          check: "Number",
        },
      ],
      inputInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Fija la velocidad que el robot retrocederá.",
      // "helpUrl": "http://www.w3schools.com/jsref/jsref_length_string.asp"
    });
  },
};

pythonGenerator.forBlock["retroceder"] = function (block) {
  var vel = pythonGenerator.valueToCode(
    block,
    "vel",
    Order.ATOMIC
  );

  var code = `robot.base.move(vel=-${vel})\n`;

  return code;
};

Blockly.Blocks["rotar"] = {
  init: function () {
    this.jsonInit({
      type: "rotar",
      message0: "Rotar %1 %2",
      args0: [
        {
          type: "input_value",
          name: "vel",
          check: "Number",
        },
        {
          type: "field_dropdown",
          name: "direction",
          options: [
            ["derecha", "DER"],
            ["izquierda", "IZQ"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Fija la velocidad a la cual el robot rotará.",
    });
  },
};

pythonGenerator.forBlock["rotar"] = function (block) {
  var vel = pythonGenerator.valueToCode(
    block,
    "vel",
    Order.ATOMIC
  );

  var dir = block.getFieldValue("direction");
  if (dir === "DER") {
    vel = vel * -1;
  }
  var code = `robot.base.rotate(vel=${vel});\n`;
  return code;
};

Blockly.Blocks["ruedas"] = {
  init: function () {
    this.jsonInit({
      type: "ruedas",
      message0: "Fijar velocidad de rueda. Izq: %1 Der: %2",
      args0: [
        {
          type: "input_value",
          name: "velIzq",
          check: "Number",
        },
        {
          type: "input_value",
          name: "velDer",
          check: "Number",
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Fija la velocidad que el robot avanzará.",
    });
  },
};

pythonGenerator.forBlock["ruedas"] = function (block) {
  var velIzq = pythonGenerator.valueToCode(
    block,
    "velIzq",
    Order.ATOMIC
  );

  var velDer = pythonGenerator.valueToCode(
    block,
    "velDer",
    Order.ATOMIC
  );

  var code = `robot.base.set_wheels(${velIzq}, ${velDer} )\n`;
  return code;
};

Blockly.Blocks["detenerse"] = {
  init: function () {
    this.jsonInit({
      type: "detenerse",
      message0: "Detener Robot",
      args0: [],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Detiene el robot completamente",
    });
  },
};

pythonGenerator.forBlock["detenerse"] = function () {
  var code = "robot.base.stop();\n";
  return code;
};

Blockly.Blocks["pause"] = {
  init: function () {
    this.jsonInit({
      type: "pause",
      message0: "Pausar %1 ms",
      args0: [
        {
          type: "input_value",
          name: "TIME",
          check: "Number",
        },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: 300,
      tooltip: "",
      helpUrl: "",
    });
  },
};

pythonGenerator.forBlock["pause"] = function (block) {
  var time = pythonGenerator.valueToCode(
    block,
    "TIME",
    Order.ATOMIC
  );

  var code = `robot.pause(${time})\n`;
  return code;
};
