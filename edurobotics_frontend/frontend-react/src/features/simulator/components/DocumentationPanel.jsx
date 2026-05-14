import Iframe from "react-iframe";
import { ExternalLink } from "lucide-react";

const OpenPopupButton = ({ url_doc }) => (
  <button
    className="absolute right-[10px] bottom-[10px] bg-purple-600 hover:bg-purple-700 transition-colors rounded-full p-2 shadow-lg"
    onClick={() =>
      window.open(
        url_doc || import.meta.env.VITE_DOCUMENTATION_URL || '',
        "_blank",
        "height=900,width=800,menubar=0,location=0,status=0,titlebar=0,toolbar=0,left=500,top=50"
      )
    }
  >
    <ExternalLink className="w-8 h-8 text-white" />
  </button>
);

export default function PanelDocumentacion({ url_doc }) {
  return (
    <div className="w-full h-full relative">
      <Iframe
        className="w-full h-full border-none m-0 p-0"
        id="documentationFrame"
        title="Documentación"
        url={url_doc || import.meta.env.VITE_DOCUMENTATION_URL || 'https://docs.pybricks.com/en/latest/'}
      />
      <OpenPopupButton url_doc={url_doc} />
    </div>
  );
}
