import { useState, useRef, useEffect, useCallback, useId } from "react";
import { ChevronDown } from "lucide-react";

interface FilterDropdownProps {
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  allLabel?: string;
}

export function FilterDropdown({
  options,
  value,
  onChange,
  allLabel = "Mind",
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const allItems = [null, ...options];

  useEffect(() => {
    function handleClickOutside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      const currentIndex = value === null ? 0 : allItems.indexOf(value);
      setFocusedIndex(currentIndex === -1 ? 0 : currentIndex);
    }
  }, [open]);

  const selectItem = useCallback((item: string | null) => {
    onChange(item);
    setOpen(false);
    triggerRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < allItems.length) {
          selectItem(allItems[focusedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Home":
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setFocusedIndex(allItems.length - 1);
        break;
    }
  }, [open, focusedIndex, allItems, selectItem]);

  const displayLabel = value || allLabel;

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={`Szűrés: ${displayLabel}`}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-works-muted bg-white text-works-dark hover:border-works-primary transition-colors w-full justify-between"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-activedescendant={focusedIndex >= 0 ? `${listboxId}-option-${focusedIndex}` : undefined}
          className="absolute z-50 mt-1 w-full bg-white border border-works-muted shadow-lg max-h-[280px] overflow-y-auto"
        >
          {allItems.map((item, index) => {
            const label = item === null ? allLabel : item;
            const isSelected = value === item;
            const isFocused = focusedIndex === index;
            return (
              <div
                key={label}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => selectItem(item)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-works-primary text-white"
                    : isFocused
                      ? "bg-works-light text-works-dark"
                      : "text-works-dark hover:bg-works-light"
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
