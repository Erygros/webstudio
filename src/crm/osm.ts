export const osmIndustries = [
  { label: "Garten- und Landschaftsbau", tags: [["craft", "gardener"]] },
  { label: "Malerbetrieb", tags: [["craft", "painter"]] },
  { label: "Elektrobetrieb", tags: [["craft", "electrician"]] },
  {
    label: "Sanitär und Heizung",
    tags: [
      ["craft", "plumber"],
      ["craft", "hvac"],
    ],
  },
  { label: "Dachdecker", tags: [["craft", "roofer"]] },
  { label: "Tischlerei", tags: [["craft", "carpenter"]] },
  { label: "Gebäudereinigung", tags: [["craft", "cleaning"]] },
  { label: "Friseur", tags: [["shop", "hairdresser"]] },
  { label: "Restaurant", tags: [["amenity", "restaurant"]] },
  { label: "Café", tags: [["amenity", "cafe"]] },
  { label: "Autowerkstatt", tags: [["shop", "car_repair"]] },
  { label: "Immobilienmakler", tags: [["office", "estate_agent"]] },
] as const;
export type OsmLead = {
  name: string;
  phone: string;
  email: string;
  industry: string;
};
export type OsmResult = OsmLead & {
  index: number;
  state: "new" | "duplicate" | "review";
  reason: string;
  match: {
    id?: string;
    name: string;
    phone: string;
    email: string;
    industry: string;
  } | null;
};
export type OsmPreview = {
  token: string;
  rows: OsmResult[];
  found: number;
  unnamed: number;
  invalidContacts: number;
  truncated: boolean;
  postalCode: string;
  radius: number;
  industry: string;
};
