import React, { useEffect, useState } from "react";
import AvatarSwatch from "./avatar-swatch";

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="padding">
      <AvatarSwatch />
    </div>
  );
}
