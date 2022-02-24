import React, { useEffect, useState } from "react";
import AvatarSwatch from "./avatar-swatch";

export function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => c + 1);
    }, 15);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="padding">
      <AvatarSwatch />
    </div>
  );
}
