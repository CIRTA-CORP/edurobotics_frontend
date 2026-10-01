import React from "react";

const Panel = ({ selected, children }) => {
  return (
    <div
      className={`h-full w-full ${selected ? "sim-fade-in flex flex-col" : "hidden"}`}
    >
      {children}
    </div>
  );
};

export default Panel;
