import { FilterDropdown } from "./FilterDropdown";

interface ResponsiveFilterProps {
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  allLabel?: string;
}

export function ResponsiveFilter({
  options,
  value,
  onChange,
  allLabel = "Mind",
}: ResponsiveFilterProps) {
  return (
    <>
      <div className="block md:hidden">
        <FilterDropdown
          options={options}
          value={value}
          onChange={onChange}
          allLabel={allLabel}
        />
      </div>

      <div className="hidden md:flex flex-wrap gap-2">
        <button
          onClick={() => onChange(null)}
          className={`px-4 py-2 text-sm font-semibold border transition-colors ${
            value === null
              ? "bg-works-primary text-white border-works-primary"
              : "bg-white text-works-dark border-works-muted hover:border-works-primary"
          }`}
        >
          {allLabel}
        </button>
        {options.map((tag) => (
          <button
            key={tag}
            onClick={() => onChange(value === tag ? null : tag)}
            className={`px-4 py-2 text-sm font-semibold border transition-colors ${
              value === tag
                ? "bg-works-primary text-white border-works-primary"
                : "bg-white text-works-dark border-works-muted hover:border-works-primary"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </>
  );
}
