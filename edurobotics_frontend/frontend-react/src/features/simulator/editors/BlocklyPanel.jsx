import React, { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import "./Blockly.css";
import { pythonGenerator } from "blockly/python";
import * as Es from "blockly/msg/es";
import DarkTheme from "@blockly/theme-dark";
import { useBlocklyWorkspace } from "react-blockly";
import toolbox from '@/features/simulator/editors/blockly/toolbox';

Blockly.setLocale(Es);

const PREPEND_CODE = `import rclpy
from robot_interface.core.robot import Robot

rclpy.init()
robot = Robot.create_from_args(['--robot', 'uni'])
robot.initialize()

`;

const INITIAL_XML =
  '<xml><block type="start" deletable="false" movable="false"></block></xml>';

const PanelBloques = React.memo(({ blocklyCodeRef, onCodeChange }) => {
  const blocklyRef = useRef(null);

  const handleOnWorkspaceDidChange = React.useCallback(
    (workspace) => {
      const code = pythonGenerator.workspaceToCode(workspace);
      const full = PREPEND_CODE + code;
      blocklyCodeRef.current = full;
      onCodeChange?.(full);
    },
    [blocklyCodeRef, onCodeChange]
  );

  const { xml } = useBlocklyWorkspace({
    ref: blocklyRef,
    toolboxConfiguration: toolbox,
    initialXml:
      localStorage.getItem("blocklyXML") &&
      localStorage.getItem("blocklyXML") !== ""
        ? localStorage.getItem("blocklyXML")
        : INITIAL_XML,
    onWorkspaceChange: handleOnWorkspaceDidChange,
    workspaceConfiguration: {
      grid: {
        spacing: 50,
        length: 5,
        colour: "#ccc",
        snap: true,
      },
      move: {
        scrollbars: {
          horizontal: false,
          vertical: true,
        },
        wheel: true,
      },
      ...(localStorage.getItem("theme") === "dark" && { theme: DarkTheme }),
    },
  });

  useEffect(() => {
    localStorage.setItem("blocklyXML", xml);
  }, [xml]);

  return (
    <div className="flex flex-1 w-full h-full relative">
      <div id="blocklyDiv" ref={blocklyRef} className="absolute inset-0" />
    </div>
  );
});

export default PanelBloques;
