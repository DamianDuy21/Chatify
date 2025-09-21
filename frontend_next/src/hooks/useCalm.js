import { useState, useEffect } from "react";

export default function useCalm(deps, delay = 1000) {
  const [isCalm, setIsCalm] = useState(false);

  useEffect(() => {
    setIsCalm(false);
    const id = setTimeout(() => {
      setIsCalm(true);
    }, delay);

    return () => clearTimeout(id);
  }, deps);

  return isCalm;
}
