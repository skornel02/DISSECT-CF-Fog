import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export default function EditableTableCell({ getValue, setValue, ...props }: {
  getValue: () => string;
  setValue: (value: string) => void;
} & React.ComponentProps<'input'>) {
  const initialValue = useMemo(() => getValue(), [getValue]);

  const [localValue, setLocalValue] = useState<string>(initialValue)

  useEffect(() => {
    setLocalValue(initialValue)
  }, [initialValue])

  const onBlur = () => {
    if (localValue !== initialValue) {
      setValue(localValue);
    }
  }

  return (
    <Input
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={onBlur}
      {...props}
    />
  )
}