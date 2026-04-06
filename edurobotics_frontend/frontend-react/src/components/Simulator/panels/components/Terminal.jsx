import React, { memo, useState } from "react";
import { ReactTerminal } from "react-terminal";
import { Terminal as TerminalIcon, ChevronDown, ChevronUp } from "lucide-react";

// esta terminal no viene implementada con saltos de línea, por lo que,
// debemos simularlo nosotros con JSX [solución entregada por el autor de react-terminal]

const textToJsx = (text) => {
  const splittedText = text.split("\n");
  const output = [];
  splittedText.forEach((line, i) => {
    output.push(
      <div
        className="text-[16px] leading-[1] ml-1 mb-2"
        key={i}
      >
        {line}
      </div>
    );
  });
  return output;
};

const Terminal = memo(({ output, onHide }) => {
  const [hidden, setHidden] = useState(false);
  const formattedOutput = textToJsx(output);

  return (
    <div className="w-full min-h-[25px] relative flex flex-col h-full bg-black">
      <div className="bg-[#2d2d2d] h-[25px] w-full z-10 text-center shrink-0 border-b border-gray-700">
        <button
          aria-label="hide terminal"
          onClick={() => {
            setHidden(!hidden);
            if (onHide) onHide();
          }}
          className="h-full w-full flex items-center justify-center relative hover:bg-[#3d3d3d] transition-colors"
        >
          <TerminalIcon className="absolute left-[2.5%] w-4 h-4 text-gray-300" />
          {hidden ? (
            <ChevronUp className="w-5 h-5 text-gray-300" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-300" />
          )}
        </button>
      </div>

      {!hidden && (
        <div className="flex-grow overflow-auto bg-black p-2">
          {formattedOutput}
        </div>
      )}
    </div>
  );
});

export default Terminal;
