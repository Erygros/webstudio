import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Decimal from "decimal.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
type Data = Record<string, unknown>;
export async function documentPdf(snapshot: Data, kind: string, draft = false) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const business = snapshot.business as Data;
  const customer = snapshot.customer as Data;
  const doc = snapshot.document as Data;
  const items = (snapshot.items as Data[]) || [];
  let page = pdf.addPage([595, 842]);
  try {
    const logo = await pdf.embedPng(
      await readFile(
        path.join(process.cwd(), "public/brand/wordmark-black.png"),
      ),
    );
    page.drawImage(logo, { x: 410, y: 770, width: 135, height: 45 });
  } catch {
    /* Text branding remains available. */
  }
  let y = 790;
  let pages = 1;
  const str = (v: unknown) => String(v ?? "");
  const amount = (v: unknown) =>
    new Decimal(str(v) || 0).toFixed(2).replace(".", ",") + " EUR";
  function text(value: string, size = 10, strong = false) {
    const words = value.replace(/\r/g, "").split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(candidate, size) > 480 && line) {
        draw(line, size, strong);
        line = word;
      } else line = candidate;
    }
    draw(line, size, strong);
  }
  function draw(value: string, size: number, strong: boolean) {
    if (y < 70) {
      page = pdf.addPage([595, 842]);
      y = 790;
      pages++;
    }
    page.drawText(value, {
      x: 50,
      y,
      size,
      font: strong ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= size + 8;
  }
  function gap(n = 12) {
    y -= n;
  }
  text(str(business.name), 22, true);
  text(str(business.owner));
  text(
    `${str(business.street)}, ${str(business.postcode)} ${str(business.city)}`,
  );
  text(`${str(business.email)} | ${str(business.phone)}`);
  gap(24);
  text(str(customer.name), 12, true);
  text(str(customer.contact_name));
  text(`${str(customer.street)} ${str(customer.house_number)}`);
  text(
    `${str(customer.postcode)} ${str(customer.city)}, ${str(customer.country)}`,
  );
  gap(24);
  text(
    `${draft ? "ENTWURF - " : ""}${kind === "quote" ? "Angebot" : str(doc.kind) || "Rechnung"} ${str(snapshot.number)}`,
    18,
    true,
  );
  text(str(doc.title), 12);
  text(
    `Datum: ${str(snapshot.date)}${doc.service_date ? " | Leistungsdatum: " + str(doc.service_date) : ""}`,
  );
  if (doc.valid_until) text("Gültig bis: " + str(doc.valid_until));
  if (snapshot.originalNumber)
    text("Bezug auf Ursprungsbeleg: " + str(snapshot.originalNumber));
  if (doc.due_on) text("Zahlungsziel: " + str(doc.due_on));
  gap();
  items.forEach((item, i) => {
    text(`${i + 1}. ${str(item.description)}`, 11, true);
    const qty = new Decimal(str(item.quantity) || 1);
    const price = new Decimal(str(item.unit_price) || 0);
    const discount = new Decimal(str(doc.discount) || 0);
    const net = qty.mul(price).mul(new Decimal(1).minus(discount.div(100)));
    const tax = business.smallBusiness
      ? new Decimal(0)
      : new Decimal(str(item.tax_rate) || 0);
    const gross = net.mul(new Decimal(1).plus(tax.div(100))).toDecimalPlaces(2);
    text(
      `${qty.toString()} x ${amount(doc.kind === "Storno" ? price.neg() : price)}${discount.gt(0) ? " | Rabatt " + discount + "%" : ""}${tax.gt(0) ? " | USt " + tax + "%" : ""} | ${amount(doc.kind === "Storno" ? gross.neg() : gross)}`,
    );
    gap(8);
  });
  gap();
  if (!new Decimal(str(snapshot.deducted) || 0).eq(0)) {
    text(`Gesamtleistung: ${amount(snapshot.subtotal)}`);
    text(
      `Verrechnete Zahlungen auf Anzahlungsrechnungen: ${new Decimal(str(snapshot.deducted)).lt(0) ? "+" : "-"}${amount(new Decimal(str(snapshot.deducted)).abs())}`,
    );
  }
  text(`Zu zahlen / Gesamtbetrag: ${amount(snapshot.total)}`, 14, true);
  if (business.smallBusiness)
    text(
      "Steuerbefreiung für Kleinunternehmer gemäß § 19 UStG. Keine Umsatzsteuer.",
    );
  else {
    const taxSum = items.reduce((sum, item) => {
      const net = new Decimal(str(item.quantity) || 1)
        .mul(str(item.unit_price) || 0)
        .mul(
          new Decimal(1).minus(new Decimal(str(doc.discount) || 0).div(100)),
        );
      return sum.plus(
        net
          .mul(new Decimal(str(item.tax_rate) || 0).div(100))
          .toDecimalPlaces(2),
      );
    }, new Decimal(0));
    text(
      `Enthaltene Umsatzsteuer: ${amount(doc.kind === "Storno" ? taxSum.neg() : taxSum)}`,
    );
  }
  if (business.taxNumber) text("Steuernummer: " + str(business.taxNumber));
  if (business.vatId) text("USt-ID: " + str(business.vatId));
  if (business.iban) text("IBAN: " + str(business.iban));
  if (doc.terms) text(str(doc.terms));
  if (draft) {
    gap();
    text("Unverbindliche Vorschau. Kein ausgestellter Beleg.");
  }
  pdf.getPages().forEach((p, i) =>
    p.drawText(`${str(business.name)} | Seite ${i + 1} / ${pages}`, {
      x: 50,
      y: 35,
      size: 8,
      font,
    }),
  );
  return pdf.save();
}
