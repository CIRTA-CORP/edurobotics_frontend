import * as Blockly from "blockly/core";
import { pythonGenerator, Order } from "blockly/python";

Blockly.Blocks["sensor_luz"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Sensor de luz:")
      .appendField(new Blockly.FieldDropdown([["Central", "CEN"]]), "sensor");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(330);
    this.setTooltip("Input para leer intensidad de luz");
    this.setHelpUrl("sensor_luz");
  },
};

pythonGenerator.forBlock["sensor_luz"] = function (block) {
  var dropdown_sensor = block.getFieldValue("sensor");
  var code = `robot.line_sensor.get("${dropdown_sensor}")`;
  return [code, Order.ATOMIC];
};

Blockly.Blocks["sensor_obstaculo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Sensor Obstáculo")
      .appendField(
        new Blockly.FieldDropdown([
          ["Izquierdo", "IZQ"],
          ["Derecho", "DER"],
        ]),
        "sensor"
      );
    this.setOutput(true, null);
    this.setColour(330);
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

pythonGenerator.forBlock["sensor_obstaculo"] = function (block) {
  var dropdown_sensor = block.getFieldValue("sensor");
  var code = `robot.obstaculo_sensor.get("${dropdown_sensor}")`;
  return [code, Order.ATOMIC];
};
