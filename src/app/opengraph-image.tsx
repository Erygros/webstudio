import { ImageResponse } from "next/og";
import { site } from "@/config/site";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "65px 75px",
        background: "#f7f7f7",
        color: "#191919",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 30 }}>{site.name}</div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 70,
          letterSpacing: "-3px",
        }}
      >
        <span>Digitale Lösungen.</span>
        <span style={{ color: "#777" }}>Individuell entwickelt.</span>
      </div>
      <div style={{ display: "flex", fontSize: 20 }}>
        Websites / Onlineshops / Software
      </div>
    </div>,
    size,
  );
}
