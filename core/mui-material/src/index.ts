/**
 * Camada de compatibilidade MUI → componentes shadcn/Radix deste pacote (sem @mui/material).
 * Mantém nomes de exportação próximos do MUI; a API nem sempre é idêntica — migrar imports
 * para `@geeklabssh/hive-tablepro` / `src/components/ui` quando possível.
 */

export * from "./Box";
export * from "./Typography";
export { Button } from "./ButtonCompat";
export * from "./IconButton";
export * from "./Divider";
export * from "./Stack";
export * from "./Paper";
export * from "./Container";
export * from "./Grid";
export * from "./Form";
export * from "./TextField";
export * from "./Card";
export * from "./AppBar";
export * from "./Link";
export * from "./Chip";
export * from "./Progress";
export { Checkbox } from "./CheckboxCompat";
export * from "./DialogCompat";
export { Tooltip } from "./TooltipCompat";
export * from "./List";
export * from "./InputCompat";
export * from "./Fab";
export * from "./Theme";
export { useMediaQuery } from "./useMediaQuery";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from "../../../src/components/ui/select";
