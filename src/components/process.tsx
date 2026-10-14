import { processSteps } from "@/data/process";
export function Process() {
  return (
    <div className="process-grid">
      {processSteps.map((step, i) => (
        <article key={step.title}>
          <span className="step-number">0{i + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </article>
      ))}
    </div>
  );
}
