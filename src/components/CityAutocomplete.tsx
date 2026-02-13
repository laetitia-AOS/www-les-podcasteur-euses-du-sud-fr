import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

export interface CityResult {
  city_name: string;
  city_insee_code: string;
  city_postcode: string;
}

interface CityAutocompleteProps {
  departmentCode: string;
  value: CityResult | null;
  onChange: (city: CityResult | null) => void;
  disabled?: boolean;
  inputClass?: string;
  labelClass?: string;
  required?: boolean;
  error?: string;
}

interface GeoApiCommune {
  nom: string;
  code: string;
  codesPostaux: string[];
}

const cache = new Map<string, GeoApiCommune[]>();

const CityAutocomplete = ({
  departmentCode,
  value,
  onChange,
  disabled = false,
  inputClass = "",
  labelClass = "",
  required = false,
  error,
}: CityAutocompleteProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoApiCommune[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resetMessage, setResetMessage] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevDeptRef = useRef(departmentCode);

  // Reset when department changes
  useEffect(() => {
    if (prevDeptRef.current !== departmentCode) {
      prevDeptRef.current = departmentCode;
      setQuery("");
      setSuggestions([]);
      onChange(null);
      if (departmentCode) {
        setResetMessage(true);
        setTimeout(() => setResetMessage(false), 3000);
      }
    }
  }, [departmentCode, onChange]);

  // Display selected value
  useEffect(() => {
    if (value) {
      setQuery(`${value.city_name} — ${value.city_postcode}`);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchCities = useCallback(
    async (search: string) => {
      if (!departmentCode || search.length < 1) {
        setSuggestions([]);
        return;
      }

      const cacheKey = `${departmentCode}:${search.toLowerCase()}`;
      if (cache.has(cacheKey)) {
        setSuggestions(cache.get(cacheKey)!);
        setShowSuggestions(true);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const url = `https://geo.api.gouv.fr/departements/${departmentCode}/communes?nom=${encodeURIComponent(search)}&fields=nom,code,codesPostaux&boost=population&limit=20`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("API error");
        const data: GeoApiCommune[] = await res.json();
        cache.set(cacheKey, data);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [departmentCode],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    // If user edits after selecting, clear selection
    if (value) {
      onChange(null);
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCities(val), 300);
  };

  const handleSelect = (commune: GeoApiCommune) => {
    const postcode = commune.codesPostaux?.[0] || "";
    const result: CityResult = {
      city_name: commune.nom,
      city_insee_code: commune.code,
      city_postcode: postcode,
    };
    onChange(result);
    setQuery(`${commune.nom} — ${postcode}`);
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className={labelClass}>
        Ville <span className="text-primary">*</span>
      </label>
      <p className="text-xs text-muted-foreground mb-2">
        Tapez le début du nom de votre ville pour voir les suggestions.
      </p>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          disabled={disabled || !departmentCode}
          placeholder={departmentCode ? "Tapez votre ville…" : "Choisir d'abord un département"}
          className={inputClass}
          required={required}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((commune) => (
            <li
              key={commune.code}
              onClick={() => handleSelect(commune)}
              className="px-4 py-2.5 text-sm cursor-pointer hover:bg-primary/10 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {commune.nom}
              {commune.codesPostaux?.[0] && (
                <span className="text-muted-foreground ml-2">— {commune.codesPostaux[0]}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {resetMessage && (
        <p className="text-xs text-muted-foreground mt-1">Merci de re-sélectionner une ville.</p>
      )}
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

export default CityAutocomplete;
