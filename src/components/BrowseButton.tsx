interface BrowseButtonProps {
  active: boolean;
  examplePath: string;
  onSelect: (path: string) => void;
  onFocus: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

export function BrowseButton({
  active,
  examplePath,
  onSelect,
  onFocus,
  buttonRef,
}: BrowseButtonProps) {
  function handleClick() {
    onSelect(examplePath);
  }

  return (
    <button
      ref={buttonRef}
      className={`browse-button${active ? " browse-button--active" : ""}`}
      onClick={handleClick}
      onFocus={onFocus}
      type="button"
    >
      [Browse]
    </button>
  );
}
