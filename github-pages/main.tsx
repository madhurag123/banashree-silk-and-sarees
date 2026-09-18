import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Store from "../app/store";
import "../app/globals.css";
import "./preview.css";
function Preview() {
  const [hash, setHash] = useState(location.hash.slice(1) || "/");
  useEffect(() => {
    const update = () => {
      setHash(location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", update);
    return () => {
      window.removeEventListener("hashchange", update);
    };
  }, []);
  const path = new URL(hash, "https://preview.invalid").pathname
    .split("/")
    .filter(Boolean);
  return <Store key={hash} route={path[0] || "home"} id={path[1]} />;
}
createRoot(document.getElementById("root")!).render(<Preview />);
