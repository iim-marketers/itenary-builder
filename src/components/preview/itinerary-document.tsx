"use client";

import * as React from "react";
import { formatMoney } from "@/lib/format";
import type { DocModel } from "@/lib/document-model";
import type { ItineraryImage } from "@/lib/types";

/**
 * The itinerary as a paginated A4 document. This is what the admin sees in the
 * live preview and what the browser prints — the PDF renderer mirrors it.
 */
export function ItineraryDocument({ doc }: { doc: DocModel }) {
  const money = (n: number) => formatMoney(n, doc.currency);

  // Section numbering is computed rather than hard-coded so empty sections
  // don't leave gaps in the running heads.
  const sections: string[] = [];
  const sec = (label: string) => {
    sections.push(label);
    return String(sections.length).padStart(2, "0");
  };

  const pages: React.ReactNode[] = [];
  const push = (node: React.ReactNode) => pages.push(node);

  /* ------------------------------------------------------------- cover */
  push(
    <Page key="cover" cover>
      <div className="doc-cover-band">
        <div className="doc-cover-brandrow">
          <div>
            {doc.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={doc.logo} alt="" className="doc-cover-logo" />
            ) : (
              <div className="doc-cover-mark">{doc.companyName}</div>
            )}
            {doc.tagline ? (
              <div className="doc-cover-tagline" style={{ marginTop: 6 }}>
                {doc.tagline}
              </div>
            ) : null}
          </div>
          <div className="doc-cover-ref">
            {doc.reference ? <div>Ref · {doc.reference}</div> : null}
            <div style={{ marginTop: 4 }}>Prepared {doc.preparedOn}</div>
          </div>
        </div>
      </div>

      <div className="doc-cover-body">
        <div className="doc-cover-eyebrow">Travel Itinerary</div>
        <h1 className="doc-cover-title">{doc.headline}</h1>
        <div className="doc-cover-sub">
          {doc.destination}
          {doc.origin ? ` · departing from ${doc.origin}` : ""}
        </div>
        <div className="doc-cover-rule" />

        <div className="doc-cover-facts">
          <KV label="Prepared for" value={doc.customer.name} large />
          <KV label="Travel dates" value={doc.dateRange} large />
          <KV label="Duration" value={doc.durationLabel} large />
          <KV
            label="Travellers"
            value={doc.travellerBreakdown || doc.travellerLabel}
            large
          />
        </div>

        {doc.overview ? (
          <p className="doc-lead" style={{ marginTop: 30, maxWidth: "60ch" }}>
            {doc.overview}
          </p>
        ) : null}

        {doc.coverHighlights.length ? (
          <div style={{ marginTop: 30 }}>
            <div className="doc-eyebrow">Journey highlights</div>
            <div
              style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "8px 32px",
              }}
            >
              {doc.coverHighlights.map((hl) => (
                <div
                  key={hl.label}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "baseline",
                    borderTop: "1px solid var(--doc-line)",
                    paddingTop: 7,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--doc-gold)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hl.label}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--doc-muted)" }}>
                    {hl.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="doc-cover-foot">
          <div>
            <div className="doc-eyebrow">Total package</div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 600,
                color: "var(--doc-brand)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.2,
              }}
            >
              {money(doc.pricing.grandTotal)}
            </div>
            {doc.showPerPerson ? (
              <div style={{ fontSize: 11, color: "var(--doc-muted)" }}>
                {money(doc.pricing.perPerson)} per person
              </div>
            ) : null}
          </div>
          <div style={{ textAlign: "right", fontSize: 10.5, color: "var(--doc-muted)" }}>
            <div className="doc-strong" style={{ fontSize: 12 }}>
              {doc.companyName}
            </div>
            {doc.contactLines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );

  /* ----------------------------------------------------------- summary */
  push(
    <Page key="summary" doc={doc}>
      <SectionHead num={sec("Summary")} title="Trip summary" />

      <div className="doc-grid-2">
        <div className="doc-card doc-card-accent">
          <div className="doc-eyebrow">Prepared for</div>
          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 4 }}>
            {doc.customer.name}
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            {doc.customer.email ? <KV label="Email" value={doc.customer.email} /> : null}
            {doc.customer.phone ? <KV label="Phone" value={doc.customer.phone} /> : null}
            {doc.customer.altPhone ? (
              <KV label="Alternate" value={doc.customer.altPhone} />
            ) : null}
            {doc.customer.address ? (
              <KV label="Address" value={doc.customer.address} />
            ) : null}
          </div>
        </div>

        <div className="doc-card">
          <div className="doc-eyebrow">At a glance</div>
          <div style={{ marginTop: 10, display: "grid", gap: 9 }}>
            {doc.facts.map((f) => (
              <KV key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        </div>
      </div>

      {doc.overview ? (
        <div style={{ marginTop: 22 }}>
          <div className="doc-eyebrow">About {doc.destination}</div>
          <p className="doc-lead" style={{ marginTop: 8 }}>
            {doc.overview}
          </p>
        </div>
      ) : null}

      {doc.customer.notes ? (
        <div className="doc-card" style={{ marginTop: 22, background: "var(--doc-tint)" }}>
          <div className="doc-eyebrow">Traveller preferences</div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--doc-muted)" }}>
            {doc.customer.notes}
          </p>
        </div>
      ) : null}

      <div style={{ marginTop: 22 }} className="doc-grid-4">
        <Stat label="Flights" value={String(doc.flights.length)} />
        <Stat label="Hotels" value={String(doc.hotels.length)} />
        <Stat label="Activities" value={String(doc.activities.length)} />
        <Stat label="Days planned" value={String(doc.days.length)} />
      </div>

      {doc.preparedBy ? (
        <p style={{ marginTop: 22, fontSize: 11, color: "var(--doc-faint)" }}>
          Prepared by {doc.preparedBy}
        </p>
      ) : null}
    </Page>
  );

  /* ----------------------------------------------------------- flights */
  if (doc.flights.length) {
    push(
      <Page key="flights" doc={doc}>
        <SectionHead num={sec("Flights")} title="Flight details" />
        {doc.flights.map((f, i) => (
          <div key={f.id} className="doc-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div>
                <div className="doc-eyebrow">Sector {i + 1}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                  {f.title}
                </div>
                {f.subtitle ? (
                  <div style={{ fontSize: 11, color: "var(--doc-muted)" }}>
                    {f.subtitle}
                  </div>
                ) : null}
              </div>
              <div style={{ textAlign: "right" }}>
                {f.travelClass ? <span className="doc-pill">{f.travelClass}</span> : null}
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {money(f.total)}
                </div>
                <div style={{ fontSize: 9.5, color: "var(--doc-faint)" }}>
                  {f.fareLine}
                </div>
              </div>
            </div>

            <div className="doc-route">
              <div>
                <div className="doc-route-time">{f.depTime}</div>
                <div className="doc-route-code">{f.depAirport}</div>
                <div style={{ fontSize: 10.5, color: "var(--doc-muted)" }}>
                  {[f.depCity, f.depTerminal && `Terminal ${f.depTerminal}`]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                <div style={{ fontSize: 10, color: "var(--doc-faint)", marginTop: 2 }}>
                  {f.depDate}
                </div>
              </div>

              <div className="doc-route-mid">
                <div style={{ fontSize: 10, color: "var(--doc-faint)" }}>
                  {f.duration}
                </div>
                <div className="doc-route-line" />
                <div style={{ fontSize: 12, color: "var(--doc-brand)" }}>✈</div>
              </div>

              <div className="doc-route-right">
                <div className="doc-route-time">{f.arrTime}</div>
                <div className="doc-route-code">{f.arrAirport}</div>
                <div style={{ fontSize: 10.5, color: "var(--doc-muted)" }}>
                  {[f.arrCity, f.arrTerminal && `Terminal ${f.arrTerminal}`]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                <div style={{ fontSize: 10, color: "var(--doc-faint)", marginTop: 2 }}>
                  {f.arrDate}
                  {f.overnight ? " · next day" : ""}
                </div>
              </div>
            </div>

            {f.baggage || f.notes ? (
              <div
                style={{
                  borderTop: "1px solid var(--doc-line)",
                  paddingTop: 9,
                  fontSize: 11,
                  color: "var(--doc-muted)",
                }}
              >
                {f.baggage ? (
                  <div>
                    <span className="doc-strong">Baggage</span> · {f.baggage}
                  </div>
                ) : null}
                {f.notes ? <div style={{ marginTop: 3 }}>{f.notes}</div> : null}
              </div>
            ) : null}
          </div>
        ))}
      </Page>
    );
  }

  /* ------------------------------------------------------------ hotels */
  if (doc.hotels.length) {
    push(
      <Page key="hotels" doc={doc}>
        <SectionHead num={sec("Hotels")} title="Accommodation" />
        {doc.hotels.map((h) => (
          <div key={h.id} className="doc-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {h.name}
                  {h.stars > 0 ? (
                    <span
                      style={{
                        marginLeft: 8,
                        color: "var(--doc-gold)",
                        fontSize: 11,
                        letterSpacing: "0.08em",
                      }}
                    >
                      {"★".repeat(h.stars)}
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 11, color: "var(--doc-muted)" }}>
                  {h.location}
                  {h.address && h.address !== h.location ? ` · ${h.address}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {money(h.total)}
                </div>
                <div style={{ fontSize: 9.5, color: "var(--doc-faint)" }}>
                  {h.stayLine}
                </div>
              </div>
            </div>

            <div className="doc-grid-4" style={{ marginTop: 14 }}>
              <KV label="Check-in" value={h.checkIn} />
              <KV label="Check-out" value={h.checkOut} />
              <KV label="Room" value={h.roomLine} />
              <KV label="Meal plan" value={h.mealPlan || "—"} />
            </div>

            {h.amenities.length ? (
              <div style={{ marginTop: 12 }}>
                {h.amenities.map((a) => (
                  <span key={a} className="doc-chip">
                    {a}
                  </span>
                ))}
              </div>
            ) : null}

            {h.notes ? (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 9,
                  borderTop: "1px solid var(--doc-line)",
                  fontSize: 11,
                  color: "var(--doc-muted)",
                }}
              >
                {h.notes}
              </div>
            ) : null}
          </div>
        ))}
      </Page>
    );
  }

  /* -------------------------------------------------------- activities */
  if (doc.activities.length) {
    push(
      <Page key="activities" doc={doc}>
        <SectionHead num={sec("Experiences")} title="Sightseeing & activities" />
        {doc.activities.map((a) => (
          <div key={a.id} className="doc-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "var(--doc-muted)" }}>
                  {[a.location, a.date, a.timeWindow].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {money(a.total)}
              </div>
            </div>

            {a.images.length ? (
              <PhotoGrid
                images={a.images}
                height={a.images.length === 1 ? 176 : a.images.length === 2 ? 139 : 109}
              />
            ) : null}

            {a.description ? (
              <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "var(--doc-muted)" }}>
                {a.description}
              </p>
            ) : null}

            {a.inclusions.length ? (
              <div style={{ marginTop: 10 }}>
                {a.inclusions.map((inc) => (
                  <span key={inc} className="doc-chip">
                    {inc}
                  </span>
                ))}
              </div>
            ) : null}

            {a.charges.length ? (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 9,
                  borderTop: "1px solid var(--doc-line)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px 20px",
                  fontSize: 10.5,
                  color: "var(--doc-muted)",
                }}
              >
                {a.charges.map((c) => (
                  <span key={c.label}>
                    {c.label} · <span className="doc-strong">{money(c.amount)}</span>
                  </span>
                ))}
              </div>
            ) : null}

            {a.notes ? (
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--doc-faint)" }}>
                {a.notes}
              </div>
            ) : null}
          </div>
        ))}
      </Page>
    );
  }

  /* -------------------------------------------------------------- days */
  if (doc.days.length) {
    push(
      <Page key="days" doc={doc}>
        <SectionHead num={sec("Itinerary")} title="Day-by-day itinerary" />
        <div style={{ display: "grid", gap: 54 }}>
          {doc.days.map((d) => (
            <div key={d.id}>
              <div className="doc-day-head">
                <div className="doc-day-badge">
                  <span>Day</span>
                  <span>{d.index}</span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{d.title}</div>
                  <div style={{ fontSize: 10.5, color: "var(--doc-muted)" }}>
                    {d.dateLabel}
                    {d.mealsLabel ? ` · Meals: ${d.mealsLabel}` : ""}
                  </div>
                </div>
                {d.overnightAt ? (
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: 10,
                      color: "var(--doc-muted)",
                      maxWidth: 200,
                    }}
                  >
                    <div className="doc-eyebrow">Overnight</div>
                    <div>{d.overnightAt}</div>
                  </div>
                ) : null}
              </div>

              {d.summary ? (
                <p
                  style={{
                    margin: "9px 0 0 12px",
                    fontSize: 11.5,
                    color: "var(--doc-muted)",
                    fontStyle: "italic",
                  }}
                >
                  {d.summary}
                </p>
              ) : null}

              {d.items.length ? (
                <div className="doc-timeline">
                  {d.items.map((item) => (
                    <div key={item.id} className="doc-timeline-item">
                      <div className="doc-timeline-time">{item.timeRange}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 1 }}>
                        <span style={{ marginRight: 6 }}>{item.icon}</span>
                        {item.title}
                      </div>
                      {item.location ? (
                        <div style={{ fontSize: 10.5, color: "var(--doc-faint)" }}>
                          {item.location}
                        </div>
                      ) : null}
                      {item.description ? (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--doc-muted)",
                            marginTop: 3,
                          }}
                        >
                          {item.description}
                        </div>
                      ) : null}
                      {item.images.length ? (
                        <PhotoGrid
                          images={item.images}
                          height={item.images.length === 1 ? 140 : 92}
                          captions={false}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    margin: "9px 0 0 12px",
                    fontSize: 11,
                    color: "var(--doc-faint)",
                  }}
                >
                  Day at leisure.
                </p>
              )}
            </div>
          ))}
        </div>
      </Page>
    );
  }

  /* -------------------------------------------------------------- visa */
  if (doc.visa) {
    const v = doc.visa;
    push(
      <Page key="visa" doc={doc}>
        <SectionHead num={sec("Visa")} title="Visa & travel documents" />

        <div className="doc-card doc-card-accent">
          <span className="doc-pill">{v.requirement}</span>
          <p className="doc-lead" style={{ margin: "10px 0 0" }}>
            {v.blurb}
          </p>
          {v.facts.length ? (
            <div className="doc-grid-3" style={{ marginTop: 14, gap: "12px 20px" }}>
              {v.facts.map((f) => (
                <KV key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
          ) : null}
        </div>

        {v.documents.length ? (
          <div style={{ marginTop: 22 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 16,
                marginBottom: 10,
              }}
            >
              <div className="doc-eyebrow">Documents we need from you</div>
              {v.dueBy ? (
                <div style={{ fontSize: 11, color: "var(--doc-muted)" }}>
                  Please send by <span className="doc-strong">{v.dueBy}</span>
                </div>
              ) : null}
            </div>
            <ul className="doc-list doc-list--box">
              {v.documents.map((d) => (
                <li key={d.id}>
                  {d.label}
                  {d.mandatory ? null : <span className="doc-tag">Optional</span>}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {v.submission || v.photoSpecs ? (
          <div
            className={v.submission && v.photoSpecs ? "doc-grid-2" : undefined}
            style={{ marginTop: 18 }}
          >
            {v.submission ? (
              <div className="doc-card" style={{ background: "var(--doc-tint)", border: "none" }}>
                <div className="doc-eyebrow">How to send them</div>
                <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--doc-muted)" }}>
                  {v.submission}
                </p>
              </div>
            ) : null}
            {v.photoSpecs ? (
              <div className="doc-card" style={{ background: "var(--doc-tint)", border: "none" }}>
                <div className="doc-eyebrow">Photograph specifications</div>
                <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--doc-muted)" }}>
                  {v.photoSpecs}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {v.applicants.length ? (
          <div style={{ marginTop: 22 }}>
            <div className="doc-eyebrow" style={{ marginBottom: 8 }}>
              Applicants
            </div>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Nationality</th>
                  <th>Passport</th>
                  <th>Expiry</th>
                  <th className="doc-num">Status</th>
                </tr>
              </thead>
              <tbody>
                {v.applicants.map((a) => (
                  <tr key={a.id}>
                    <td className="doc-strong">{a.name}</td>
                    <td style={{ color: "var(--doc-muted)" }}>{a.nationality}</td>
                    <td style={{ color: "var(--doc-muted)", fontVariantNumeric: "tabular-nums" }}>
                      {a.passport}
                    </td>
                    <td style={{ color: "var(--doc-muted)" }}>{a.expiry}</td>
                    <td className="doc-num">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {v.notes.length ? (
          <div style={{ marginTop: 22 }}>
            <div className="doc-eyebrow" style={{ marginBottom: 10 }}>
              Please note
            </div>
            <ul className="doc-list">
              {v.notes.map((l, i) => (
                <li key={`${i}-${l}`}>{l}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Page>
    );
  }

  /* ----------------------------------------------------------- pricing */
  const p = doc.pricing;
  push(
    <Page key="pricing" doc={doc}>
      <SectionHead num={sec("Pricing")} title="Pricing breakdown" />

      <table className="doc-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Detail</th>
            <th className="doc-num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {p.flightRows.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td style={{ color: "var(--doc-muted)" }}>{r.detail}</td>
              <td className="doc-num">{money(r.amount)}</td>
            </tr>
          ))}
          {p.hotelRows.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td style={{ color: "var(--doc-muted)" }}>{r.detail}</td>
              <td className="doc-num">{money(r.amount)}</td>
            </tr>
          ))}
          {p.activityRows.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td style={{ color: "var(--doc-muted)" }}>{r.detail}</td>
              <td className="doc-num">{money(r.amount)}</td>
            </tr>
          ))}
          {p.extraRows.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td style={{ color: "var(--doc-muted)" }}>{r.detail}</td>
              <td className="doc-num">{money(r.amount)}</td>
            </tr>
          ))}
          <tr>
            <td className="doc-strong">Subtotal</td>
            <td />
            <td className="doc-num doc-strong">{money(p.subtotal)}</td>
          </tr>
          {p.discountAmount ? (
            <tr>
              <td>{p.discountLabel}</td>
              <td />
              <td className="doc-num">− {money(p.discountAmount)}</td>
            </tr>
          ) : null}
          {p.serviceChargeAmount ? (
            <tr>
              <td>Service charge</td>
              <td />
              <td className="doc-num">{money(p.serviceChargeAmount)}</td>
            </tr>
          ) : null}
          {p.taxAmount ? (
            <tr>
              <td>{p.taxLabel}</td>
              <td style={{ color: "var(--doc-muted)" }}>
                on {money(p.taxableBase)}
              </td>
              <td className="doc-num">{money(p.taxAmount)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="doc-total-band">
        <div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            Grand total
          </div>
          {doc.showPerPerson ? (
            <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
              {money(p.perPerson)} per person · {p.payingTravellers} paying travellers
            </div>
          ) : null}
        </div>
        <div className="doc-total-value">{money(p.grandTotal)}</div>
      </div>

      {doc.hasAdvance ? (
        <div className="doc-grid-2" style={{ marginTop: 12 }}>
          <div className="doc-card">
            <div className="doc-eyebrow">Advance received</div>
            <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>
              {money(p.advancePaid)}
            </div>
          </div>
          <div className="doc-card doc-card-accent">
            <div className="doc-eyebrow">Balance due</div>
            <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>
              {money(p.balanceDue)}
            </div>
          </div>
        </div>
      ) : null}

      {doc.paymentTerms ? (
        <div style={{ marginTop: 22 }}>
          <div className="doc-eyebrow">Payment terms</div>
          <p className="doc-lead" style={{ marginTop: 6 }}>
            {doc.paymentTerms}
          </p>
        </div>
      ) : null}

      {doc.cancellationPolicy ? (
        <div style={{ marginTop: 16 }}>
          <div className="doc-eyebrow">Cancellation policy</div>
          <p className="doc-lead" style={{ marginTop: 6 }}>
            {doc.cancellationPolicy}
          </p>
        </div>
      ) : null}
    </Page>
  );

  /* --------------------------------------------- inclusions / exclusions */
  if (doc.inclusions.length || doc.exclusions.length) {
    push(
      <Page key="scope" doc={doc}>
        <SectionHead num={sec("Scope")} title="Inclusions & exclusions" />
        <div className="doc-grid-2">
          <div>
            <div className="doc-eyebrow" style={{ marginBottom: 10 }}>
              What is included
            </div>
            <ul className="doc-list doc-list--check">
              {doc.inclusions.map((l, i) => (
                <li key={`${i}-${l}`}>{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="doc-eyebrow" style={{ marginBottom: 10 }}>
              What is not included
            </div>
            <ul className="doc-list doc-list--cross">
              {doc.exclusions.map((l, i) => (
                <li key={`${i}-${l}`}>{l}</li>
              ))}
            </ul>
          </div>
        </div>
      </Page>
    );
  }

  /* --------------------------------------------------- notes and terms */
  push(
    <Page key="terms" doc={doc}>
      <SectionHead num={sec("Conditions")} title="Important notes & terms" />

      {doc.importantNotes.length ? (
        <div>
          <div className="doc-eyebrow" style={{ marginBottom: 10 }}>
            Important notes
          </div>
          <ul className="doc-list">
            {doc.importantNotes.map((l, i) => (
              <li key={`${i}-${l}`}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {doc.terms.length ? (
        <div style={{ marginTop: 24 }}>
          <div className="doc-eyebrow" style={{ marginBottom: 10 }}>
            Terms &amp; conditions
          </div>
          <ul className="doc-list doc-list--num">
            {doc.terms.map((l, i) => (
              <li key={`${i}-${l}`}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        className="doc-card"
        style={{ marginTop: 28, background: "var(--doc-tint)", border: "none" }}
      >
        {doc.closingNote ? (
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--doc-muted)" }}>
            {doc.closingNote}
          </p>
        ) : null}
        <div
          style={{
            marginTop: doc.closingNote ? 16 : 0,
            paddingTop: doc.closingNote ? 14 : 0,
            borderTop: doc.closingNote ? "1px solid var(--doc-line)" : "none",
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="doc-strong" style={{ fontSize: 13 }}>
              {doc.companyName}
            </div>
            {doc.companyAddress ? (
              <div style={{ fontSize: 10.5, color: "var(--doc-muted)", maxWidth: "36ch" }}>
                {doc.companyAddress}
              </div>
            ) : null}
            {doc.gstin ? (
              <div style={{ fontSize: 10, color: "var(--doc-faint)", marginTop: 3 }}>
                GSTIN {doc.gstin}
              </div>
            ) : null}
          </div>
          <div style={{ textAlign: "right", fontSize: 10.5, color: "var(--doc-muted)" }}>
            {doc.contactLines.map((l) => (
              <div key={l}>{l}</div>
            ))}
            {doc.preparedBy ? (
              <div style={{ marginTop: 6, color: "var(--doc-faint)" }}>
                Prepared by {doc.preparedBy}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Page>
  );

  const total = pages.length;

  return (
    <div className="doc" style={{ ["--doc-brand" as string]: doc.brandColor }}>
      {pages.map((page, i) =>
        React.isValidElement<{ pageNumber?: number; pageCount?: number }>(page)
          ? React.cloneElement(page, { pageNumber: i + 1, pageCount: total })
          : page
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Page */

function Page({
  children,
  cover,
  doc,
  pageNumber,
  pageCount,
}: {
  children: React.ReactNode;
  cover?: boolean;
  doc?: DocModel;
  pageNumber?: number;
  pageCount?: number;
}) {
  if (cover) {
    return <section className="doc-page doc-page--cover">{children}</section>;
  }
  return (
    <section className="doc-page">
      {doc ? (
        <div className="doc-running-head">
          <span>{doc.headline}</span>
          <span>{doc.reference ? `Ref ${doc.reference}` : doc.destination}</span>
        </div>
      ) : null}
      <div style={{ flex: 1 }}>{children}</div>
      {doc ? (
        <div className="doc-running-foot">
          <span>{doc.companyName}</span>
          <span>
            Page {pageNumber} of {pageCount}
          </span>
        </div>
      ) : null}
    </section>
  );
}

function SectionHead({ num, title }: { num: string; title: string }) {
  return (
    <div className="doc-section-head">
      <h2 className="doc-h2">{title}</h2>
      <span className="doc-section-num">Section {num}</span>
    </div>
  );
}

/** Photos laid out three to a row, matching the PDF renderer. */
function PhotoGrid({
  images,
  height,
  captions = true,
}: {
  images: ItineraryImage[];
  height: number;
  captions?: boolean;
}) {
  if (!images.length) return null;

  // Mirrors the PDF: a lone portrait photo takes half the width rather than
  // being cropped into a full-bleed letterbox.
  const solo = images.length === 1 ? images[0] : null;
  const soloPortrait =
    solo !== null && solo.height > 0 && solo.height > solo.width * 1.05;
  const cols = soloPortrait ? 2 : Math.min(3, images.length);
  const cellHeight = soloPortrait ? Math.round(height * 1.5) : height;

  return (
    <div
      className="doc-photos"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {images.map((img) => (
        <figure key={img.id} className="doc-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.dataUrl} alt={img.caption || ""} style={{ height: cellHeight }} />
          {captions && img.caption.trim() ? (
            <figcaption>{img.caption.trim()}</figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function KV({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div>
      <div className="doc-kv-label">{label}</div>
      <div
        className="doc-kv-value"
        style={large ? { fontSize: 14, fontWeight: 500 } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="doc-card"
      style={{ textAlign: "center", padding: "12px 8px" }}
    >
      <div style={{ fontSize: 22, fontWeight: 600, color: "var(--doc-brand)" }}>
        {value}
      </div>
      <div className="doc-kv-label" style={{ marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
