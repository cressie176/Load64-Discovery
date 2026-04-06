import { useEffect } from "react";
import { useRouter } from "../router/RouterContext";

interface PlaceholderProps {
  name: string;
}

export function Placeholder({ name }: PlaceholderProps) {
  const { pop } = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") {
        pop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div role="application" className="screen">
      <div className="screen__topbar">
        <span className="screen__topbar-title">{name}</span>
        <div className="screen__topbar-ctas">
          <a
            href="#"
            className="topbar-cta topbar-cta--nav topbar-cta--focused"
            onClick={(e) => {
              e.preventDefault();
              pop();
            }}
          >
            Back
          </a>
        </div>
      </div>
      <div className="screen__content screen__content--empty">Coming soon</div>
      <div className="screen__bottombar" />
    </div>
  );
}
