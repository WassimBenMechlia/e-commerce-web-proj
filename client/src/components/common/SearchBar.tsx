import { Search } from 'lucide-react';
import type { FormEvent } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search products',
}: SearchBarProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <form
      className="flex h-12 items-center gap-3 rounded-full border border-border bg-background-primary px-4"
      onSubmit={handleSubmit}
      role="search"
    >
      <Search className="h-4 w-4 text-text-secondary" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary/70"
      />
    </form>
  );
};
