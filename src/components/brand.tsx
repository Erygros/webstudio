import { site } from "@/config/site";

export function Brand() {
  if (!["Webstudio", "Webstudio Expert"].includes(site.name))
    return <>{site.name}</>;

  return (
    <span className="brand-images" aria-hidden="true">
      <svg
        className="brand-logo-light"
        width="2032"
        height="274"
        viewBox="74 230 2032 274"
        focusable="false"
      >
        <image href="/brand/wordmark-black.png" width="2172" height="724" />
      </svg>
      <svg
        className="brand-logo-dark"
        width="2032"
        height="274"
        viewBox="74 230 2032 274"
        focusable="false"
      >
        <image href="/brand/wordmark-white.png" width="2172" height="724" />
      </svg>
      {site.name === "Webstudio Expert" && (
        <span className="brand-suffix">EXPERT</span>
      )}
    </span>
  );
}
