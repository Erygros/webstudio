export default function Loading() {
  return (
    <div className="loading" role="status">
      <span className="eyebrow">Einen Moment</span>
      <p>Die Seite wird geladen.</p>
      <div className="loading-bar" aria-hidden="true" />
    </div>
  );
}
