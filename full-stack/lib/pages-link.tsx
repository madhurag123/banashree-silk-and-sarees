import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { isPagesPreview, previewBase } from "./pages-preview";
export function SiteLink({
  href,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const local =
    isPagesPreview() && href?.startsWith("/") && !href.startsWith("//");
  function click(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (isPagesPreview() && href === "#main" && !event.defaultPrevented) {
      event.preventDefault();
      const main = document.getElementById("main");
      if (main) {
        main.tabIndex = -1;
        main.focus();
        main.scrollIntoView();
      }
    }
  }
  return (
    <a
      {...props}
      href={local ? previewBase() + "#" + href : href}
      onClick={click}
    />
  );
}
