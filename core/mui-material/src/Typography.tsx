import * as React from "react";
import { cn } from "../../../src/lib/utils";

const variantClass: Record<string, string> = {
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
  h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
  h5: "scroll-m-20 text-lg font-semibold tracking-tight",
  h6: "scroll-m-20 text-base font-semibold tracking-tight",
  subtitle1: "text-lg text-foreground/90",
  subtitle2: "text-sm font-medium text-muted-foreground",
  body1: "text-base leading-7",
  body2: "text-sm leading-6 text-muted-foreground",
  caption: "text-xs text-muted-foreground",
  button: "text-sm font-medium",
  overline: "text-xs font-medium uppercase tracking-wider text-muted-foreground"
};

const variantDefaultTag: Record<string, React.ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "h6",
  subtitle2: "h6",
  body1: "p",
  body2: "p",
  caption: "span",
  button: "span",
  overline: "span"
};

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: keyof typeof variantClass | (string & {});
  component?: React.ElementType;
  gutterBottom?: boolean;
  noWrap?: boolean;
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(function Typography(
  { variant = "body1", component, className, gutterBottom, noWrap, ...rest },
  ref
) {
  const v = variant in variantClass ? variant : "body1";
  const key = v as keyof typeof variantClass;
  const Tag = component ?? variantDefaultTag[key] ?? "p";
  return (
    <Tag
      ref={ref}
      className={cn(
        variantClass[key],
        gutterBottom && "mb-2",
        noWrap && "truncate",
        className
      )}
      {...rest}
    />
  );
});

Typography.displayName = "Typography";
