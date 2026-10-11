import "./how-it-works.css";

export function HowItWorksFlowVisual() {
  return (
    <section className="hiw-flow-visual" aria-label="Payment flow diagram">
      <p className="hiw-flow-visual-label">At a glance</p>

      <div className="hiw-flow-track">
        <div className="hiw-flow-node">
          <span>Merchant</span>
          <small>Registers and manages</small>
        </div>
        <span className="hiw-flow-arrow" aria-hidden="true">
          →
        </span>
        <div className="hiw-flow-node hiw-flow-node-id">
          <span>@merchant</span>
          <small>Identifier</small>
        </div>
        <span className="hiw-flow-arrow" aria-hidden="true">
          →
        </span>
        <div className="hiw-flow-node hiw-flow-node-core">
          <span>Rezva</span>
          <small>Shared lookup layer</small>
        </div>
        <span className="hiw-flow-arrow" aria-hidden="true">
          →
        </span>
        <div className="hiw-flow-node">
          <span>Payment destination</span>
          <small>Where funds are received</small>
        </div>
      </div>

      <div className="hiw-flow-lookup">
        <div className="hiw-flow-node hiw-flow-node-wallet">
          <span>Customer wallet</span>
          <small>Wants to pay @merchant</small>
        </div>
        <div className="hiw-flow-lookup-line" aria-hidden="true">
          <span className="hiw-flow-lookup-bar" />
          <span className="hiw-flow-lookup-tag">Lookup</span>
        </div>
        <div className="hiw-flow-lookup-target">
          <span>Rezva returns the linked destination</span>
        </div>
      </div>
    </section>
  );
}
