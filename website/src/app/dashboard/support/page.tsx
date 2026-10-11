import { PageHeader } from "@/components/dashboard/PageHeader";

export default function SupportPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Support"
        title="Support"
        description="Help for applicants, approved businesses, and wallet providers. Ticketing is not connected yet."
      />

      <div className="dash-grid dash-grid-2">
        <article className="dash-card">
          <h2>Application status</h2>
          <p>
            Until review workflows are live, application status is local mock data
            only. No tickets can be opened from this page.
          </p>
        </article>
        <article className="dash-card">
          <h2>Technical issues</h2>
          <p>
            Protocol and API questions belong in the public docs. Production
            support channels will be listed here when available.
          </p>
        </article>
        <article className="dash-card">
          <h2>Security reports</h2>
          <p>
            A responsible disclosure contact will be published separately. Do not
            submit secrets or production keys through this UI.
          </p>
        </article>
        <article className="dash-card">
          <h2>Contact</h2>
          <p>
            Contact forms and email routing are intentionally disabled in this
            frontend scaffold.
          </p>
          <div className="dash-card-actions">
            <button type="button" className="dash-btn dash-btn-primary" disabled>
              Contact support - coming soon
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
