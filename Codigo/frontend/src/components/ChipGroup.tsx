import FieldGroup from './Field/FieldGroup';

interface ChipOption {
    value: string;
    label: string;
}

interface ChipGroupProps {
    legend: string;
    hint?: string;
    error?: string;
    /** Nome do grupo de radios. */
    name: string;
    options: ChipOption[];
    value?: string | null;
    onChange: (value: string) => void;
}

/** Escolha única em forma de chips. Usa radios nativos, então funciona com as setas do teclado. */
function ChipGroup({ legend, hint, error, name, options, value, onChange }: ChipGroupProps) {
    return (
        <FieldGroup legend={legend} hint={hint} error={error} className='flex flex-wrap gap-2'>
            {options.map((option) => (
                <label key={option.value} className='cursor-pointer'>
                    <input
                        type='radio'
                        name={name}
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => onChange(option.value)}
                        className='peer sr-only'
                    />
                    <span
                        className={
                            'inline-flex rounded-full border border-border/40 bg-surface px-4 py-2 text-label transition ' +
                            'hover:border-border peer-checked:border-accent peer-checked:bg-accent ' +
                            'peer-checked:text-accent-foreground peer-focus-visible:outline-2 ' +
                            'peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent'
                        }
                    >
                        {option.label}
                    </span>
                </label>
            ))}
        </FieldGroup>
    );
}

export default ChipGroup;
