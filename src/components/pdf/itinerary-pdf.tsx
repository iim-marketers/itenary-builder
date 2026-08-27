"use client";

import * as React from "react";
import {
  Document,
  Font,
  Image,
  Page,
  Polygon,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatMoney } from "@/lib/format";
import { chunk } from "@/lib/image";
import { onColor, safeHex, shade, tint } from "@/lib/color";
import type { DocModel } from "@/lib/document-model";
import type { ItineraryImage } from "@/lib/types";

/* ------------------------------------------------------------------ fonts */

let registered = false;

/**
 * Registers the bundled TTFs once. They are served from /public so the export
 * works offline — and unlike the built-in PDF fonts they carry ₹, ★ and the
 * rest of the glyphs this document needs.
 */
export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Inter",
    fonts: [
      { src: "/fonts/Inter-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/Inter-Medium.ttf", fontWeight: 500 },
      { src: "/fonts/Inter-SemiBold.ttf", fontWeight: 600 },
      { src: "/fonts/Inter-Bold.ttf", fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Playfair",
    fonts: [
      { src: "/fonts/Playfair-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/Playfair-SemiBold.ttf", fontWeight: 600 },
    ],
  });
  // Words are never broken mid-line — hyphenated place names read badly.
  Font.registerHyphenationCallback((word) => [word]);
}

/* ----------------------------------------------------------------- theme */

/* A4 in points, and the page furniture geometry derived from it. The footer is
   positioned with `top` rather than `bottom`: react-pdf's browser build does not
   resolve `bottom` on absolutely positioned page children (its Node build does),
   which silently drops the footer from the export. */
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 44;
const FURNITURE_INSET = 22;
const FOOT_HEIGHT = 17.5;

const CARD_PAD = 13;

/**
 * One vertical rhythm for the whole document. Every gap in the PDF comes from
 * this scale rather than from ad-hoc margins, which is what kept the earlier
 * layout uneven.
 */
const SP = {
  xxs: 2,
  xs: 4,
  sm: 7,
  md: 11,
  lg: 16,
  xl: 22,
  xxl: 30,
} as const;

/**
 * Explicit line heights. The page sets a body default; anything larger than
 * body copy must opt out, otherwise the inherited leading pushes headings onto
 * their own underline and stacks captions over display figures.
 */
const LH = {
  display: 1.1,
  heading: 1.2,
  label: 1.35,
  body: 1.45,
} as const;

const GOLD = "#B08D57";
const INK = "#16211F";
const MUTED = "#5F6B69";
const FAINT = "#8B9694";
const LINE = "#E2E6E5";

function makeStyles(brandRaw: string) {
  const brand = safeHex(brandRaw);
  const onBrand = onColor(brand);
  const soft = tint(brand, 0.07);
  const softer = tint(brand, 0.04);
  const deep = shade(brand, 0.12);

  return {
    brand,
    onBrand,
    soft,
    softer,
    deep,
    s: StyleSheet.create({
      page: {
        fontFamily: "Inter",
        fontSize: 9,
        color: INK,
        lineHeight: LH.body,
        paddingTop: 46,
        paddingBottom: 52,
        paddingHorizontal: MARGIN_X,
        backgroundColor: "#FFFFFF",
      },
      coverPage: {
        fontFamily: "Inter",
        fontSize: 9,
        color: INK,
        backgroundColor: "#FFFFFF",
      },

      /* --------------------------------------------------------- cover */
      coverBand: {
        backgroundColor: brand,
        color: onBrand,
        paddingHorizontal: 44,
        paddingTop: 40,
        paddingBottom: 34,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
      },
      coverLogo: { maxHeight: 42, maxWidth: 150, objectFit: "contain" },
      coverMark: { fontSize: 15, fontWeight: 600, color: onBrand, lineHeight: LH.heading },
      coverTagline: {
        fontSize: 7.5,
        marginTop: 4,
        color: onBrand,
        opacity: 0.8,
        letterSpacing: 1.1,
        textTransform: "uppercase",
        lineHeight: LH.label,
      },
      coverRef: {
        fontSize: 7,
        color: onBrand,
        opacity: 0.85,
        letterSpacing: 1.3,
        textTransform: "uppercase",
        textAlign: "right",
        lineHeight: LH.label,
      },
      coverBody: {
        flexGrow: 1,
        paddingHorizontal: 44,
        paddingTop: 40,
        paddingBottom: 34,
      },
      coverEyebrow: {
        fontSize: 7.5,
        letterSpacing: 2.6,
        textTransform: "uppercase",
        color: GOLD,
        fontWeight: 600,
        lineHeight: LH.label,
      },
      coverTitle: {
        fontFamily: "Playfair",
        fontSize: 33,
        lineHeight: LH.display,
        color: brand,
        marginTop: SP.md,
      },
      coverSub: { fontSize: 11, color: MUTED, marginTop: SP.md, lineHeight: LH.label },
      coverRule: {
        width: 48,
        height: 2.5,
        backgroundColor: GOLD,
        marginTop: SP.xl,
        marginBottom: SP.xl,
      },
      coverFacts: { flexDirection: "row", flexWrap: "wrap", rowGap: SP.lg },
      coverFact: { width: "50%", paddingRight: SP.lg },
      coverFoot: {
        marginTop: "auto",
        paddingTop: SP.xl,
        borderTopWidth: 1,
        borderTopColor: LINE,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
      },

      /* ------------------------------------------------------ furniture */
      runHead: {
        position: "absolute",
        top: FURNITURE_INSET,
        left: MARGIN_X,
        right: MARGIN_X,
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: 7,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: FAINT,
        lineHeight: LH.label,
        paddingBottom: SP.sm,
        borderBottomWidth: 1,
        borderBottomColor: LINE,
      },
      runFoot: {
        position: "absolute",
        top: PAGE_HEIGHT - FURNITURE_INSET - FOOT_HEIGHT,
        left: MARGIN_X,
        right: MARGIN_X,
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: 7,
        letterSpacing: 0.9,
        color: FAINT,
        lineHeight: LH.label,
        paddingTop: SP.sm,
        borderTopWidth: 1,
        borderTopColor: LINE,
      },

      /* -------------------------------------------------------- headings */
      sectionHead: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        borderBottomWidth: 1.5,
        borderBottomColor: brand,
        paddingBottom: SP.md,
        marginBottom: SP.xl,
      },
      // Playfair has deep descenders — the extra bottom padding above keeps the
      // rule clear of them.
      h2: {
        fontFamily: "Playfair",
        fontSize: 18,
        color: brand,
        lineHeight: LH.heading,
      },
      sectionNum: {
        fontSize: 7,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: FAINT,
        fontWeight: 600,
        lineHeight: LH.label,
      },
      eyebrow: {
        fontSize: 6.5,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: FAINT,
        fontWeight: 600,
        lineHeight: LH.label,
      },
      lead: { fontSize: 9.5, color: MUTED, lineHeight: 1.6 },
      /** Sub-heading above a block inside a section. */
      blockLabel: {
        fontSize: 6.5,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: FAINT,
        fontWeight: 600,
        lineHeight: LH.label,
        marginBottom: SP.md,
      },

      /* ----------------------------------------------------------- cards */
      card: {
        borderWidth: 1,
        borderColor: LINE,
        borderRadius: 7,
        padding: CARD_PAD,
      },
      cardAccent: { borderLeftWidth: 2.5, borderLeftColor: brand },
      /** Stacks cards with one consistent gap instead of per-card margins. */
      cardStack: { flexDirection: "column", gap: SP.md },
      // `alignItems: flex-start` stops a short card being stretched to match a
      // tall sibling and left half empty.
      row: { flexDirection: "row", alignItems: "flex-start" },
      between: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
      },
      kvLabel: {
        fontSize: 6.5,
        letterSpacing: 1.1,
        textTransform: "uppercase",
        color: FAINT,
        fontWeight: 600,
        lineHeight: LH.label,
      },
      kvValue: { fontSize: 9.5, color: INK, lineHeight: LH.label, marginTop: 1 },
      chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SP.xs },
      chip: {
        borderWidth: 1,
        borderColor: LINE,
        backgroundColor: softer,
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2.5,
        fontSize: 7.2,
        lineHeight: LH.label,
        color: MUTED,
      },
      pill: {
        backgroundColor: soft,
        color: brand,
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 2.5,
        fontSize: 6.8,
        fontWeight: 600,
        letterSpacing: 0.8,
        lineHeight: LH.label,
        textTransform: "uppercase",
      },

      /* ---------------------------------------------------------- flight */
      route: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: SP.md,
        marginBottom: SP.md,
      },
      routeTime: { fontSize: 16, fontWeight: 600, color: INK, lineHeight: LH.display },
      routeCode: {
        fontSize: 10,
        fontWeight: 600,
        color: brand,
        letterSpacing: 0.5,
        lineHeight: LH.label,
        marginTop: SP.xxs,
      },
      routeMid: { width: 96, alignItems: "center", paddingHorizontal: 8 },
      routeLine: { height: 1, backgroundColor: LINE },
      routeDot: {
        width: 4.5,
        height: 4.5,
        borderRadius: 2.25,
        backgroundColor: brand,
      },

      /* ------------------------------------------------------------ days */
      dayHead: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: soft,
        borderRadius: 7,
        padding: SP.md,
        gap: SP.md,
      },
      dayBadge: {
        width: 34,
        height: 34,
        borderRadius: 7,
        backgroundColor: brand,
        alignItems: "center",
        justifyContent: "center",
      },
      timelineWrap: {
        marginTop: SP.sm,
        marginLeft: 16,
        paddingLeft: 14,
        borderLeftWidth: 1,
        borderLeftColor: LINE,
        flexDirection: "column",
        gap: SP.md,
      },
      timelineItem: { flexDirection: "column", gap: SP.xxs },
      timelineDot: {
        position: "absolute",
        left: -18.5,
        top: 2.5,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: brand,
      },
      timelineTime: {
        fontSize: 7.5,
        fontWeight: 600,
        color: brand,
        letterSpacing: 0.4,
        lineHeight: LH.label,
      },

      /* ---------------------------------------------------------- tables */
      th: {
        fontSize: 6.5,
        letterSpacing: 1.1,
        textTransform: "uppercase",
        color: FAINT,
        fontWeight: 600,
        lineHeight: LH.label,
        paddingBottom: SP.sm,
      },
      tr: {
        flexDirection: "row",
        alignItems: "flex-start",
        borderBottomWidth: 1,
        borderBottomColor: LINE,
        paddingVertical: SP.sm,
      },
      thead: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: LINE,
      },
      totalBand: {
        marginTop: SP.lg,
        backgroundColor: brand,
        borderRadius: 7,
        paddingHorizontal: 16,
        paddingVertical: 13,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },

      /* ----------------------------------------------------------- lists */
      list: { flexDirection: "column", gap: SP.sm },
      li: { flexDirection: "row", alignItems: "flex-start" },
      // The mark shares the text's size and leading so the two sit on the same
      // baseline instead of the bullet floating above the line.
      liMark: {
        width: 13,
        fontSize: 9,
        lineHeight: LH.body,
        color: brand,
        fontWeight: 700,
      },
      liText: { flex: 1, fontSize: 9, color: MUTED, lineHeight: LH.body },
      /** Photo grids. */
      photoRow: { flexDirection: "row", gap: SP.sm },
      photoCell: { flex: 1 },
      photo: { width: "100%", borderRadius: 5, objectFit: "cover" },
      photoCaption: {
        fontSize: 7,
        color: FAINT,
        lineHeight: LH.label,
        marginTop: SP.xs,
      },
    }),
  };
}

/* ------------------------------------------------------------- fragments */

type Styles = ReturnType<typeof makeStyles>;

function KV({
  label,
  value,
  st,
  large,
}: {
  label: string;
  value: string;
  st: Styles;
  large?: boolean;
}) {
  return (
    <View>
      <Text style={st.s.kvLabel}>{label}</Text>
      <Text
        style={[
          st.s.kvValue,
          large ? { fontSize: 11, fontWeight: 500, lineHeight: LH.label } : {},
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/** A column of key/value pairs on the shared rhythm. */
function KVStack({
  children,
  gap = SP.md,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  return <View style={{ flexDirection: "column", gap }}>{children}</View>;
}

/**
 * A grid of photos, three to a row. The last row is padded with empty cells so
 * one leftover photo does not stretch to the full width.
 */
function PhotoGrid({
  images,
  st,
  perRow = 3,
  height = 84,
  captions = true,
}: {
  images: ItineraryImage[];
  st: Styles;
  perRow?: number;
  height?: number;
  captions?: boolean;
}) {
  if (!images.length) return null;

  // A lone portrait photo is given half the width instead of being cropped into
  // a full-bleed letterbox; a lone landscape one still runs the full measure.
  const solo = images.length === 1 ? images[0] : null;
  const soloPortrait =
    solo !== null && solo.height > 0 && solo.height > solo.width * 1.05;
  const cols = soloPortrait ? 2 : Math.min(perRow, images.length);
  const rows = chunk(images, cols);
  const cellHeight = soloPortrait ? Math.round(height * 1.5) : height;

  return (
    <View style={{ flexDirection: "column", gap: SP.sm }}>
      {rows.map((row, r) => (
        <View key={`row-${r}`} style={st.s.photoRow} wrap={false}>
          {row.map((img) => (
            <View key={img.id} style={st.s.photoCell}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an <img> */}
              <Image src={img.dataUrl} style={[st.s.photo, { height: cellHeight }]} />
              {captions && img.caption.trim() ? (
                <Text style={st.s.photoCaption}>{img.caption.trim()}</Text>
              ) : null}
            </View>
          ))}
          {/* Spacers keep a short final row aligned with the rows above. */}
          {Array.from({ length: cols - row.length }, (_, i) => (
            <View key={`spacer-${i}`} style={st.s.photoCell} />
          ))}
        </View>
      ))}
    </View>
  );
}

function SectionHead({
  num,
  title,
  st,
}: {
  num: string;
  title: string;
  st: Styles;
}) {
  return (
    <View style={st.s.sectionHead}>
      <Text style={st.s.h2}>{title}</Text>
      <Text style={st.s.sectionNum}>Section {num}</Text>
    </View>
  );
}

function Furniture({ doc, st }: { doc: DocModel; st: Styles }) {
  return (
    <>
      <View style={st.s.runHead} fixed>
        <Text>{doc.headline}</Text>
        <Text>{doc.reference ? `Ref ${doc.reference}` : doc.destination}</Text>
      </View>
      <View style={st.s.runFoot} fixed>
        <Text>{doc.companyName}</Text>
        <Text
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
    </>
  );
}

function TimelineItem({
  item,
  st,
}: {
  item: DocModel["days"][number]["items"][number];
  st: Styles;
}) {
  return (
    <View style={st.s.timelineItem} wrap={false}>
      <View style={st.s.timelineDot} />
      <Text style={st.s.timelineTime}>{item.timeRange}</Text>
      <Text style={{ fontSize: 9.5, fontWeight: 600, lineHeight: LH.label }}>
        {item.title}
      </Text>
      {item.location ? (
        <Text style={{ fontSize: 8, color: FAINT, lineHeight: LH.label }}>
          {item.location}
        </Text>
      ) : null}
      {item.description ? (
        <Text style={{ fontSize: 8.5, color: MUTED, lineHeight: LH.body }}>
          {item.description}
        </Text>
      ) : null}
      {item.images.length ? (
        <View style={{ marginTop: SP.xs }}>
          <PhotoGrid
            images={item.images}
            st={st}
            perRow={3}
            height={item.images.length === 1 ? 108 : 68}
            captions={false}
          />
        </View>
      ) : null}
    </View>
  );
}

function Bullets({
  items,
  st,
  mark = "•",
  markColor,
}: {
  items: string[];
  st: Styles;
  mark?: string;
  markColor?: string;
}) {
  return (
    <View style={st.s.list}>
      {items.map((t, i) => (
        <View key={`${i}-${t}`} style={st.s.li} wrap={false}>
          <Text style={[st.s.liMark, markColor ? { color: markColor } : {}]}>
            {mark}
          </Text>
          <Text style={st.s.liText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------- document */

export function ItineraryPdf({ doc }: { doc: DocModel }) {
  registerPdfFonts();
  const st = makeStyles(doc.brandColor);
  const s = st.s;
  const money = (n: number) => formatMoney(n, doc.currency);
  const p = doc.pricing;

  const sections: string[] = [];
  const sec = (label: string) => {
    sections.push(label);
    return String(sections.length).padStart(2, "0");
  };

  return (
    <Document
      title={`${doc.headline} — Itinerary`}
      author={doc.companyName}
      subject={`Travel itinerary for ${doc.customer.name}`}
      creator={doc.companyName}
      producer={doc.companyName}
    >
      {/* ------------------------------------------------------- cover */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverBand}>
          <View>
            {doc.logo ? (
              /* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an <img> */
              <Image src={doc.logo} style={s.coverLogo} />
            ) : (
              <Text style={s.coverMark}>{doc.companyName}</Text>
            )}
            {doc.tagline ? (
              <Text style={[s.coverTagline, { marginTop: SP.xs }]}>{doc.tagline}</Text>
            ) : null}
          </View>
          <View>
            {doc.reference ? (
              <Text style={s.coverRef}>Ref · {doc.reference}</Text>
            ) : null}
            <Text style={[s.coverRef, { marginTop: SP.xs }]}>
              Prepared {doc.preparedOn}
            </Text>
          </View>
        </View>

        <View style={s.coverBody}>
          <Text style={s.coverEyebrow}>Travel Itinerary</Text>
          <Text style={s.coverTitle}>{doc.headline}</Text>
          <Text style={s.coverSub}>
            {doc.destination}
            {doc.origin ? ` · departing from ${doc.origin}` : ""}
          </Text>
          <View style={s.coverRule} />

          <View style={s.coverFacts}>
            <View style={s.coverFact}>
              <KV label="Prepared for" value={doc.customer.name} st={st} large />
            </View>
            <View style={s.coverFact}>
              <KV label="Travel dates" value={doc.dateRange} st={st} large />
            </View>
            <View style={s.coverFact}>
              <KV label="Duration" value={doc.durationLabel} st={st} large />
            </View>
            <View style={s.coverFact}>
              <KV
                label="Travellers"
                value={doc.travellerBreakdown || doc.travellerLabel}
                st={st}
                large
              />
            </View>
          </View>

          {doc.overview ? (
            <Text style={[s.lead, { marginTop: SP.xl }]}>{doc.overview}</Text>
          ) : null}

          {doc.coverHighlights.length ? (
            <View style={{ marginTop: SP.xl }}>
              <Text style={s.blockLabel}>Journey highlights</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {doc.coverHighlights.map((hl) => (
                  <View
                    key={hl.label}
                    style={{
                      width: "50%",
                      paddingRight: SP.xl,
                      paddingVertical: SP.sm,
                      borderTopWidth: 1,
                      borderTopColor: LINE,
                      flexDirection: "row",
                      gap: SP.sm,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 7,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: GOLD,
                        fontWeight: 600,
                        lineHeight: LH.body,
                      }}
                    >
                      {hl.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 9,
                        color: MUTED,
                        flex: 1,
                        lineHeight: LH.body,
                      }}
                    >
                      {hl.title}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={s.coverFoot}>
            <View>
              <Text style={s.eyebrow}>Total package</Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: st.brand,
                  lineHeight: LH.display,
                  marginTop: SP.xs,
                }}
              >
                {money(p.grandTotal)}
              </Text>
              {doc.showPerPerson ? (
                <Text
                  style={{ fontSize: 8.5, color: MUTED, lineHeight: LH.label }}
                >
                  {money(p.perPerson)} per person
                </Text>
              ) : null}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{ fontSize: 9.5, fontWeight: 600, lineHeight: LH.label }}
              >
                {doc.companyName}
              </Text>
              {doc.contactLines.map((l) => (
                <Text
                  key={l}
                  style={{ fontSize: 8.5, color: MUTED, lineHeight: LH.label }}
                >
                  {l}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </Page>

      {/* ----------------------------------------------------- summary */}
      <Page size="A4" style={s.page}>
        <Furniture doc={doc} st={st} />
        <SectionHead num={sec("Summary")} title="Trip summary" st={st} />

        <View style={[s.row, { gap: SP.md }]}>
          <View style={[s.card, s.cardAccent, { flex: 1 }]}>
            <Text style={s.eyebrow}>Prepared for</Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: 600,
                lineHeight: LH.heading,
                marginTop: SP.xs,
                marginBottom: SP.md,
              }}
            >
              {doc.customer.name}
            </Text>
            <KVStack>
              {doc.customer.email ? (
                <KV label="Email" value={doc.customer.email} st={st} />
              ) : null}
              {doc.customer.phone ? (
                <KV label="Phone" value={doc.customer.phone} st={st} />
              ) : null}
              {doc.customer.altPhone ? (
                <KV label="Alternate" value={doc.customer.altPhone} st={st} />
              ) : null}
              {doc.customer.address ? (
                <KV label="Address" value={doc.customer.address} st={st} />
              ) : null}
            </KVStack>
          </View>

          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.blockLabel}>At a glance</Text>
            <KVStack>
              {doc.facts.map((f) => (
                <KV key={f.label} label={f.label} value={f.value} st={st} />
              ))}
            </KVStack>
          </View>
        </View>

        {doc.overview ? (
          <View style={{ marginTop: SP.xl }}>
            <Text style={s.blockLabel}>About {doc.destination}</Text>
            <Text style={s.lead}>{doc.overview}</Text>
          </View>
        ) : null}

        {doc.customer.notes ? (
          <View
            style={[
              s.card,
              { marginTop: SP.lg, backgroundColor: st.softer, borderWidth: 0 },
            ]}
          >
            <Text style={s.eyebrow}>Traveller preferences</Text>
            <Text style={[s.lead, { marginTop: SP.sm }]}>{doc.customer.notes}</Text>
          </View>
        ) : null}

        <View style={[s.row, { marginTop: SP.lg, gap: SP.md }]}>
          {[
            ["Flights", doc.flights.length],
            ["Hotels", doc.hotels.length],
            ["Activities", doc.activities.length],
            ["Days planned", doc.days.length],
          ].map(([label, value]) => (
            <View
              key={String(label)}
              style={[
                s.card,
                { flex: 1, alignItems: "center", paddingVertical: SP.md },
              ]}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: st.brand,
                  lineHeight: LH.display,
                }}
              >
                {String(value)}
              </Text>
              <Text style={[s.kvLabel, { marginTop: SP.xs }]}>{String(label)}</Text>
            </View>
          ))}
        </View>

        {doc.preparedBy ? (
          <Text
            style={{
              marginTop: SP.lg,
              fontSize: 8.5,
              color: FAINT,
              lineHeight: LH.label,
            }}
          >
            Prepared by {doc.preparedBy}
          </Text>
        ) : null}
      </Page>

      {/* ----------------------------------------------------- flights */}
      {doc.flights.length ? (
        <Page size="A4" style={s.page}>
          <Furniture doc={doc} st={st} />
          <SectionHead num={sec("Flights")} title="Flight details" st={st} />

          <View style={s.cardStack}>
          {doc.flights.map((f, i) => (
            <View key={f.id} style={s.card} wrap={false}>
              <View style={s.between}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={s.eyebrow}>Sector {i + 1}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: LH.heading,
                      marginTop: SP.xxs,
                    }}
                  >
                    {f.title}
                  </Text>
                  {f.subtitle ? (
                    <Text
                      style={{ fontSize: 8.5, color: MUTED, lineHeight: LH.label }}
                    >
                      {f.subtitle}
                    </Text>
                  ) : null}
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  {f.travelClass ? (
                    <Text style={s.pill}>{f.travelClass}</Text>
                  ) : null}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: LH.label,
                      marginTop: SP.sm,
                    }}
                  >
                    {money(f.total)}
                  </Text>
                  <Text style={{ fontSize: 7, color: FAINT, lineHeight: LH.label }}>
                    {f.fareLine}
                  </Text>
                </View>
              </View>

              <View style={s.route}>
                <View style={{ flex: 1 }}>
                  <Text style={s.routeTime}>{f.depTime}</Text>
                  <Text style={s.routeCode}>{f.depAirport}</Text>
                  <Text style={{ fontSize: 8, color: MUTED, lineHeight: LH.label }}>
                    {[f.depCity, f.depTerminal && `Terminal ${f.depTerminal}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 7.5,
                      color: FAINT,
                      lineHeight: LH.label,
                      marginTop: SP.xxs,
                    }}
                  >
                    {f.depDate}
                  </Text>
                </View>

                <View style={s.routeMid}>
                  <Text style={{ fontSize: 7.5, color: FAINT }}>{f.duration}</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      width: "100%",
                      marginTop: 4,
                    }}
                  >
                    <View style={s.routeDot} />
                    <View style={[s.routeLine, { flex: 1, marginHorizontal: 3 }]} />
                    <Svg width={8} height={8} viewBox="0 0 10 10">
                      <Polygon points="1,1 9,5 1,9 3,5" fill={st.brand} />
                    </Svg>
                    <View style={[s.routeLine, { flex: 1, marginHorizontal: 3 }]} />
                    <View style={s.routeDot} />
                  </View>
                </View>

                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={s.routeTime}>{f.arrTime}</Text>
                  <Text style={s.routeCode}>{f.arrAirport}</Text>
                  <Text style={{ fontSize: 8, color: MUTED, lineHeight: LH.label }}>
                    {[f.arrCity, f.arrTerminal && `Terminal ${f.arrTerminal}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 7.5,
                      color: FAINT,
                      lineHeight: LH.label,
                      marginTop: SP.xxs,
                    }}
                  >
                    {f.arrDate}
                    {f.overnight ? " · next day" : ""}
                  </Text>
                </View>
              </View>

              {f.baggage || f.notes ? (
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: LINE,
                    paddingTop: SP.md,
                    flexDirection: "column",
                    gap: SP.xs,
                  }}
                >
                  {f.baggage ? (
                    <Text
                      style={{ fontSize: 8.5, color: MUTED, lineHeight: LH.label }}
                    >
                      <Text style={{ fontWeight: 600, color: INK }}>Baggage</Text> ·{" "}
                      {f.baggage}
                    </Text>
                  ) : null}
                  {f.notes ? (
                    <Text
                      style={{ fontSize: 8.5, color: MUTED, lineHeight: LH.label }}
                    >
                      {f.notes}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))}
          </View>
        </Page>
      ) : null}

      {/* ------------------------------------------------------ hotels */}
      {doc.hotels.length ? (
        <Page size="A4" style={s.page}>
          <Furniture doc={doc} st={st} />
          <SectionHead num={sec("Hotels")} title="Accommodation" st={st} />

          <View style={s.cardStack}>
          {doc.hotels.map((h) => (
            <View key={h.id} style={s.card} wrap={false}>
              <View style={s.between}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: LH.heading,
                      }}
                    >
                      {h.name}
                    </Text>
                    {h.stars > 0 ? (
                      <Text
                        style={{
                          marginLeft: SP.sm,
                          fontSize: 8,
                          color: GOLD,
                          lineHeight: LH.heading,
                        }}
                      >
                        {"★".repeat(h.stars)}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={{
                      fontSize: 8.5,
                      color: MUTED,
                      lineHeight: LH.label,
                      marginTop: SP.xxs,
                    }}
                  >
                    {[h.location, h.address !== h.location ? h.address : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{ fontSize: 11, fontWeight: 600, lineHeight: LH.label }}
                  >
                    {money(h.total)}
                  </Text>
                  <Text style={{ fontSize: 7, color: FAINT, lineHeight: LH.label }}>
                    {h.stayLine}
                  </Text>
                </View>
              </View>

              <View style={[s.row, { marginTop: SP.lg, gap: SP.md }]}>
                <View style={{ flex: 1 }}>
                  <KV label="Check-in" value={h.checkIn} st={st} />
                </View>
                <View style={{ flex: 1 }}>
                  <KV label="Check-out" value={h.checkOut} st={st} />
                </View>
                <View style={{ flex: 1 }}>
                  <KV label="Room" value={h.roomLine} st={st} />
                </View>
                <View style={{ flex: 1 }}>
                  <KV label="Meal plan" value={h.mealPlan || "—"} st={st} />
                </View>
              </View>

              {h.amenities.length ? (
                <View style={[s.chipRow, { marginTop: SP.md }]}>
                  {h.amenities.map((a) => (
                    <Text key={a} style={s.chip}>
                      {a}
                    </Text>
                  ))}
                </View>
              ) : null}

              {h.notes ? (
                <Text
                  style={{
                    marginTop: SP.md,
                    paddingTop: SP.md,
                    borderTopWidth: 1,
                    borderTopColor: LINE,
                    fontSize: 8.5,
                    color: MUTED,
                    lineHeight: LH.label,
                  }}
                >
                  {h.notes}
                </Text>
              ) : null}
            </View>
          ))}
          </View>
        </Page>
      ) : null}

      {/* -------------------------------------------------- activities */}
      {doc.activities.length ? (
        <Page size="A4" style={s.page}>
          <Furniture doc={doc} st={st} />
          <SectionHead
            num={sec("Experiences")}
            title="Sightseeing & activities"
            st={st}
          />

          <View style={s.cardStack}>
          {doc.activities.map((a) => (
            <View key={a.id} style={s.card} wrap={false}>
              <View style={s.between}>
                <View style={{ flex: 1, paddingRight: SP.md }}>
                  <Text
                    style={{ fontSize: 12, fontWeight: 600, lineHeight: LH.heading }}
                  >
                    {a.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 8.5,
                      color: MUTED,
                      lineHeight: LH.label,
                      marginTop: SP.xxs,
                    }}
                  >
                    {[a.location, a.date, a.timeWindow].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 11, fontWeight: 600, lineHeight: LH.label }}
                >
                  {money(a.total)}
                </Text>
              </View>

              {a.images.length ? (
                <View style={{ marginTop: SP.md }}>
                  <PhotoGrid
                    images={a.images}
                    st={st}
                    perRow={3}
                    height={a.images.length === 1 ? 132 : a.images.length === 2 ? 104 : 82}
                  />
                </View>
              ) : null}

              {a.description ? (
                <Text
                  style={{
                    fontSize: 8.8,
                    color: MUTED,
                    lineHeight: LH.body,
                    marginTop: SP.md,
                  }}
                >
                  {a.description}
                </Text>
              ) : null}

              {a.inclusions.length ? (
                <View style={[s.chipRow, { marginTop: SP.md }]}>
                  {a.inclusions.map((inc) => (
                    <Text key={inc} style={s.chip}>
                      {inc}
                    </Text>
                  ))}
                </View>
              ) : null}

              {a.charges.length ? (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: SP.lg,
                    marginTop: SP.md,
                    paddingTop: SP.md,
                    borderTopWidth: 1,
                    borderTopColor: LINE,
                  }}
                >
                  {a.charges.map((c) => (
                    <Text
                      key={c.label}
                      style={{ fontSize: 7.8, color: MUTED, lineHeight: LH.label }}
                    >
                      {c.label} ·{" "}
                      <Text style={{ fontWeight: 600, color: INK }}>
                        {money(c.amount)}
                      </Text>
                    </Text>
                  ))}
                </View>
              ) : null}

              {a.notes ? (
                <Text
                  style={{
                    fontSize: 8.2,
                    color: FAINT,
                    lineHeight: LH.label,
                    marginTop: SP.md,
                  }}
                >
                  {a.notes}
                </Text>
              ) : null}
            </View>
          ))}
          </View>
        </Page>
      ) : null}

      {/* ---------------------------------------------------------- days */}
      {doc.days.length ? (
        <Page size="A4" style={s.page}>
          <Furniture doc={doc} st={st} />
          <SectionHead num={sec("Itinerary")} title="Day-by-day itinerary" st={st} />

          <View style={{ flexDirection: "column", gap: SP.xxl + SP.md }}>
          {doc.days.map((d) => {
            // The header travels with its summary and first stop in one
            // unbreakable group, so a day title can never be stranded at the
            // foot of a page with its schedule overleaf. (react-pdf's
            // `minPresenceAhead` is a no-op in the browser build.)
            const [firstItem, ...restItems] = d.items;
            return (
              <View key={d.id}>
                <View wrap={false}>
                  <View style={s.dayHead}>
                    <View style={s.dayBadge}>
                      <Text
                        style={{
                          fontSize: 5.8,
                          letterSpacing: 1.2,
                          color: st.onBrand,
                          textTransform: "uppercase",
                        }}
                      >
                        Day
                      </Text>
                      <Text
                        style={{ fontSize: 14, fontWeight: 600, color: st.onBrand }}
                      >
                        {d.index}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          lineHeight: LH.heading,
                        }}
                      >
                        {d.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 8,
                          color: MUTED,
                          lineHeight: LH.label,
                          marginTop: SP.xxs,
                        }}
                      >
                        {d.dateLabel}
                        {d.mealsLabel ? ` · Meals: ${d.mealsLabel}` : ""}
                      </Text>
                    </View>
                    {d.overnightAt ? (
                      <View style={{ alignItems: "flex-end", maxWidth: 150 }}>
                        <Text style={s.eyebrow}>Overnight</Text>
                        <Text
                          style={{
                            fontSize: 8,
                            color: MUTED,
                            lineHeight: LH.label,
                            textAlign: "right",
                            marginTop: SP.xxs,
                          }}
                        >
                          {d.overnightAt}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {d.summary ? (
                    <Text
                      style={{
                        marginTop: SP.sm,
                        marginLeft: SP.md,
                        fontSize: 8.8,
                        color: MUTED,
                        lineHeight: LH.body,
                      }}
                    >
                      {d.summary}
                    </Text>
                  ) : null}

                  {firstItem ? (
                    <View style={s.timelineWrap}>
                      <TimelineItem item={firstItem} st={st} />
                    </View>
                  ) : (
                    <Text
                      style={{
                        marginTop: SP.sm,
                        marginLeft: SP.md,
                        fontSize: 8.5,
                        color: FAINT,
                        lineHeight: LH.label,
                      }}
                    >
                      Day at leisure.
                    </Text>
                  )}
                </View>

                {restItems.length ? (
                  // `paddingTop` rather than `marginTop`, so the timeline rule
                  // stays unbroken across the group boundary above.
                  <View
                    style={[s.timelineWrap, { marginTop: 0, paddingTop: SP.md }]}
                  >
                    {restItems.map((item) => (
                      <TimelineItem key={item.id} item={item} st={st} />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
          </View>
        </Page>
      ) : null}

      {/* ------------------------------------------------------- pricing */}
      <Page size="A4" style={s.page}>
        <Furniture doc={doc} st={st} />
        <SectionHead num={sec("Pricing")} title="Pricing breakdown" st={st} />

        <View style={s.thead}>
          <Text style={[s.th, { flex: 3 }]}>Component</Text>
          <Text style={[s.th, { flex: 3 }]}>Detail</Text>
          <Text style={[s.th, { flex: 1.4, textAlign: "right" }]}>Amount</Text>
        </View>

        {[...p.flightRows, ...p.hotelRows, ...p.activityRows, ...p.extraRows].map(
          (r) => (
            <View key={r.key} style={s.tr} wrap={false}>
              <Text style={{ flex: 3, fontSize: 9 }}>{r.label}</Text>
              <Text style={{ flex: 3, fontSize: 8.5, color: MUTED }}>
                {r.detail ?? ""}
              </Text>
              <Text style={{ flex: 1.4, fontSize: 9, textAlign: "right" }}>
                {money(r.amount)}
              </Text>
            </View>
          )
        )}

        <View style={s.tr}>
          <Text style={{ flex: 3, fontSize: 9, fontWeight: 600 }}>Subtotal</Text>
          <Text style={{ flex: 3 }} />
          <Text
            style={{ flex: 1.4, fontSize: 9, fontWeight: 600, textAlign: "right" }}
          >
            {money(p.subtotal)}
          </Text>
        </View>

        {p.discountAmount ? (
          <View style={s.tr}>
            <Text style={{ flex: 3, fontSize: 9 }}>{p.discountLabel}</Text>
            <Text style={{ flex: 3 }} />
            <Text style={{ flex: 1.4, fontSize: 9, textAlign: "right" }}>
              − {money(p.discountAmount)}
            </Text>
          </View>
        ) : null}

        {p.serviceChargeAmount ? (
          <View style={s.tr}>
            <Text style={{ flex: 3, fontSize: 9 }}>Service charge</Text>
            <Text style={{ flex: 3 }} />
            <Text style={{ flex: 1.4, fontSize: 9, textAlign: "right" }}>
              {money(p.serviceChargeAmount)}
            </Text>
          </View>
        ) : null}

        {p.taxAmount ? (
          <View style={s.tr}>
            <Text style={{ flex: 3, fontSize: 9 }}>{p.taxLabel}</Text>
            <Text style={{ flex: 3, fontSize: 8.5, color: MUTED }}>
              on {money(p.taxableBase)}
            </Text>
            <Text style={{ flex: 1.4, fontSize: 9, textAlign: "right" }}>
              {money(p.taxAmount)}
            </Text>
          </View>
        ) : null}

        <View style={s.totalBand} wrap={false}>
          <View>
            <Text
              style={{
                fontSize: 6.8,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: st.onBrand,
                opacity: 0.85,
                lineHeight: LH.label,
              }}
            >
              Grand total
            </Text>
            {doc.showPerPerson ? (
              <Text
                style={{
                  fontSize: 8.5,
                  color: st.onBrand,
                  opacity: 0.9,
                  lineHeight: LH.label,
                  marginTop: SP.xs,
                }}
              >
                {money(p.perPerson)} per person · {p.payingTravellers} paying
                travellers
              </Text>
            ) : null}
          </View>
          <Text
            style={{
              fontSize: 19,
              fontWeight: 600,
              color: st.onBrand,
              lineHeight: LH.display,
            }}
          >
            {money(p.grandTotal)}
          </Text>
        </View>

        {doc.hasAdvance ? (
          <View style={[s.row, { marginTop: SP.md, gap: SP.md }]}>
            <View style={[s.card, { flex: 1 }]}>
              <Text style={s.eyebrow}>Advance received</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: LH.display,
                  marginTop: SP.xs,
                }}
              >
                {money(p.advancePaid)}
              </Text>
            </View>
            <View style={[s.card, s.cardAccent, { flex: 1 }]}>
              <Text style={s.eyebrow}>Balance due</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: LH.display,
                  marginTop: SP.xs,
                }}
              >
                {money(p.balanceDue)}
              </Text>
            </View>
          </View>
        ) : null}

        {doc.paymentTerms ? (
          <View style={{ marginTop: SP.xl }}>
            <Text style={s.blockLabel}>Payment terms</Text>
            <Text style={s.lead}>{doc.paymentTerms}</Text>
          </View>
        ) : null}

        {doc.cancellationPolicy ? (
          <View style={{ marginTop: SP.lg }}>
            <Text style={s.blockLabel}>Cancellation policy</Text>
            <Text style={s.lead}>{doc.cancellationPolicy}</Text>
          </View>
        ) : null}
      </Page>

      {/* --------------------------------------------------------- scope */}
      {doc.inclusions.length || doc.exclusions.length ? (
        <Page size="A4" style={s.page}>
          <Furniture doc={doc} st={st} />
          <SectionHead
            num={sec("Scope")}
            title="Inclusions & exclusions"
            st={st}
          />
          <View style={[s.row, { gap: SP.xl }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.blockLabel}>What is included</Text>
              <Bullets items={doc.inclusions} st={st} mark={"✓"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.blockLabel}>What is not included</Text>
              <Bullets
                items={doc.exclusions}
                st={st}
                mark={"×"}
                markColor="#B4453C"
              />
            </View>
          </View>
        </Page>
      ) : null}

      {/* --------------------------------------------------------- terms */}
      <Page size="A4" style={s.page}>
        <Furniture doc={doc} st={st} />
        <SectionHead num={sec("Conditions")} title="Important notes & terms" st={st} />

        {doc.importantNotes.length ? (
          <View>
            <Text style={s.blockLabel}>Important notes</Text>
            <Bullets items={doc.importantNotes} st={st} />
          </View>
        ) : null}

        {doc.terms.length ? (
          <View style={{ marginTop: SP.xxl }}>
            <Text style={s.blockLabel}>Terms &amp; conditions</Text>
            <View style={s.list}>
              {doc.terms.map((t, i) => (
                <View key={`${i}-${t}`} style={s.li} wrap={false}>
                  <Text style={[s.liMark, { width: 17, fontSize: 8.5 }]}>
                    {i + 1}.
                  </Text>
                  <Text style={s.liText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View
          style={[
            s.card,
            {
              marginTop: SP.xxl,
              padding: SP.lg,
              backgroundColor: st.softer,
              borderWidth: 0,
            },
          ]}
        >
          {doc.closingNote ? (
            <Text style={[s.lead, { marginBottom: SP.lg }]}>{doc.closingNote}</Text>
          ) : null}
          <View
            style={[
              s.between,
              { gap: SP.lg },
              doc.closingNote
                ? { paddingTop: SP.lg, borderTopWidth: 1, borderTopColor: LINE }
                : {},
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 10, fontWeight: 600, lineHeight: LH.label }}
              >
                {doc.companyName}
              </Text>
              {doc.companyAddress ? (
                <Text
                  style={{
                    fontSize: 8.2,
                    color: MUTED,
                    lineHeight: LH.body,
                    marginTop: SP.xxs,
                  }}
                >
                  {doc.companyAddress}
                </Text>
              ) : null}
              {doc.gstin ? (
                <Text
                  style={{
                    fontSize: 7.8,
                    color: FAINT,
                    lineHeight: LH.label,
                    marginTop: SP.xs,
                  }}
                >
                  GSTIN {doc.gstin}
                </Text>
              ) : null}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              {doc.contactLines.map((l) => (
                <Text
                  key={l}
                  style={{ fontSize: 8.2, color: MUTED, lineHeight: LH.body }}
                >
                  {l}
                </Text>
              ))}
              {doc.preparedBy ? (
                <Text
                  style={{
                    fontSize: 8,
                    color: FAINT,
                    lineHeight: LH.label,
                    marginTop: SP.sm,
                  }}
                >
                  Prepared by {doc.preparedBy}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
