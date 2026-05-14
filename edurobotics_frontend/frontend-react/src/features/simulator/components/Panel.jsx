import React from "react";

export const PanelButton = ({ name, selected, onClickHandler }) => (
  <div className="flex flex-grow">
    <button
      className={`w-full rounded-none px-4 py-2 transition-colors duration-200 uppercase font-medium text-sm
        ${selected 
          ? "bg-purple-600 text-white hover:bg-purple-700" 
          : "border border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/20"
        }
      `}
      onClick={onClickHandler}
    >
      {name}
    </button>
  </div>
);

const Panel = ({ selected, children }) => {
  return (
    <div 
      className={`h-full w-full ${selected ? "flex flex-col" : "hidden"}`}
    >
      {children}
    </div>
  );
};

export default Panel;