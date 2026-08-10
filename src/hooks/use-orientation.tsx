import * as React from "react";

/**
 * True when the device is in landscape with a short viewport (typical phone
 * held sideways). Used to compact vertical chrome so content stays readable.
 */
export function useIsLandscapeMobile() {
  const [isLandscapeMobile, setIsLandscapeMobile] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    const onChange = () => setIsLandscapeMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return isLandscapeMobile;
}
