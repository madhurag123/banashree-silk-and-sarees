export const collectionNames = [
  "Silk",
  "Mysore Silk",
  "Cotton",
  "Banarasi",
  "Kanjivaram",
  "Chanderi",
  "Linen",
  "Bridal",
  "Festive",
  "Everyday",
];
export const defaults = {
  shipping: 14900,
  freeShipping: 500000,
  taxPercent: 0,
  cod: false,
  mode: "demo",
  deliveryMin: 4,
  deliveryMax: 8,
  phone: "[Phone]",
  email: "[Email]",
  whatsapp: "[WhatsApp]",
  address: "[Store Address]",
  banner: "A little tradition. A lifetime of grace.",
  bannerImage: "/images/hero.jpg",
};
const rows: [string, string, string, string, string, string, string, number, number, string, number, string][] = [
  [
    "gulabi-banarasi",
    "Gulabi Banarasi Silk",
    "Silk",
    "Festive",
    "Banarasi",
    "Silk,Banarasi,Festive",
    "Rose",
    685000,
    8,
    "saree-pink-silk",
    1,
    "Blush pink and peach tones meet delicate floral motifs and a softly gleaming border. A graceful sample styling idea for festive lunches and family celebrations."
  ],
  [
    "emerald-kanjivaram",
    "Emerald Kanjivaram Silk",
    "Silk",
    "Wedding",
    "Kanjivaram",
    "Silk,Kanjivaram,Bridal",
    "Emerald",
    1295000,
    5,
    "saree-emerald",
    1,
    "Emerald green, scattered gold-toned motifs and a generous ornate border give this sample design its celebratory character. Let the pallu fall open to show the detailing."
  ],
  [
    "ivory-chanderi",
    "Ivory Chanderi Grace",
    "Silk cotton",
    "Everyday",
    "Chanderi",
    "Chanderi,Everyday",
    "Ivory",
    395000,
    12,
    "saree-ivory",
    1,
    "An ivory ground with small gold-toned motifs and a luminous border, styled with a maroon blouse. An understated sample look for intimate celebrations."
  ],
  [
    "maroon-bridal",
    "Blue & Maroon Bridal Heirloom",
    "Silk",
    "Wedding",
    "Banarasi",
    "Bridal,Silk,Banarasi",
    "Blue",
    1895000,
    3,
    "saree-blue-orange",
    1,
    "Deep blue and a maroon pallu are lifted by intricate copper-toned patterning. This richly detailed sample design pairs naturally with a wedding occasion."
  ],
  [
    "indigo-cotton",
    "Checkered Cotton Daydream",
    "Cotton",
    "Everyday",
    "Plain weave",
    "Cotton,Everyday",
    "Multicolor",
    245000,
    9,
    "saree-checkered",
    0,
    "Multicoloured checks and a contrasting yellow blouse create an easy, expressive daytime look. This sample edit explores a traditional checked pattern for everyday dressing."
  ],
  [
    "golden-festive",
    "Golden Green Festive Silk",
    "Silk",
    "Festive",
    "Jacquard",
    "Silk,Festive",
    "Gold",
    795000,
    7,
    "saree-green-gold",
    0,
    "Chartreuse gold floral motifs meet an emerald border in this festive sample design. A richly patterned pallu makes it a natural centrepiece for a celebration."
  ],
  [
    "rose-linen",
    "Rose & Blue Silk Whisper",
    "Silk blend",
    "Festive",
    "Jacquard",
    "Silk,Festive",
    "Rose",
    325000,
    6,
    "saree-rose-blue",
    0,
    "Rose pink and powder blue panels, geometric motifs and a silver-toned border create a soft festive palette. A silk-blend sample concept with a fluid, luminous drape."
  ],
  [
    "ivory-cotton",
    "Lavender Silk Morning",
    "Silk blend",
    "Festive",
    "Jacquard",
    "Silk,Festive",
    "Lavender",
    195000,
    14,
    "saree-lavender",
    0,
    "Lavender tones and silver-coloured floral detailing give this sample design a gentle glow. Style the broad pallu loosely to bring its pattern into focus."
  ],
  [
    "emerald-banarasi",
    "Sea Green Banarasi Bloom",
    "Silk",
    "Festive",
    "Banarasi",
    "Banarasi,Festive,Silk",
    "Green",
    895000,
    2,
    "saree-sea-green",
    0,
    "A sea-green palette, leafy motifs and muted mauve accents lend this sample silk design a fresh festive mood. The decorative border frames the drape beautifully."
  ],
  [
    "maroon-kanjivaram",
    "Teal Kanjivaram Vow",
    "Silk",
    "Wedding",
    "Kanjivaram",
    "Kanjivaram,Bridal,Silk",
    "Teal",
    1595000,
    4,
    "saree-blue-maroon",
    0,
    "Teal silk-style fabric and antique-gold patterning are paired with a maroon blouse in this wedding sample. The prominent border gives the design a traditional finish."
  ],
  [
    "gold-chanderi",
    "Golden Chanderi Light",
    "Silk cotton",
    "Festive",
    "Chanderi",
    "Chanderi,Festive",
    "Yellow",
    445000,
    0,
    "saree-yellow",
    0,
    "A bright yellow sample design with subtle texture and a decorative blouse. An uplifting colour story for daytime festivities and family gatherings."
  ],
  [
    "blue-linen",
    "Teal & Lavender Silk Reverie",
    "Silk blend",
    "Festive",
    "Jacquard",
    "Silk,Festive",
    "Teal",
    365000,
    10,
    "saree-teal-purple",
    0,
    "Teal and lavender meet floral detailing and a silver-toned border. This silk-blend sample concept brings a cool colour palette to the festive collection."
  ],
  [
    "indigo-stripe-cotton",
    "Indigo Stripe Cotton",
    "Cotton",
    "Everyday",
    "Plain weave",
    "Cotton,Everyday",
    "Indigo",
    225000,
    12,
    "saree-indigo-cotton",
    0,
    "Matte indigo cotton with fine ivory stripes, a slim cream border and a striped pallu. An understated sample design for workdays, errands and relaxed gatherings."
  ],
  [
    "sage-linen-calm",
    "Sage Linen Calm",
    "Linen",
    "Everyday",
    "Plain weave",
    "Linen,Everyday",
    "Sage",
    345000,
    7,
    "saree-sage-linen",
    0,
    "Muted sage linen with a visible slub texture, a narrow ivory border and small pallu tassels. A quiet everyday sample design, styled with an ivory blouse."
  ],
  [
    "terracotta-cotton-print",
    "Terracotta Cotton Print",
    "Cotton",
    "Everyday",
    "Plain weave",
    "Cotton,Everyday",
    "Rust",
    265000,
    8,
    "saree-rust-cotton",
    0,
    "Warm terracotta cotton with small cream botanical motifs, a charcoal border and a patterned pallu. This printed sample brings detail to simple everyday dressing."
  ],
  [
    "sand-linen-stripe",
    "Sand Linen Stripe",
    "Linen",
    "Workwear",
    "Plain weave",
    "Linen,Everyday",
    "Sand",
    365000,
    5,
    "saree-sand-linen",
    0,
    "Oatmeal linen with fine grey stripes, a charcoal border and short tassels. The restrained palette of this sample design works especially well for officewear."
  ],
  [
    "kesari-ceremony-silk",
    "Kesari Ceremony Silk",
    "Silk",
    "Wedding",
    "Jacquard",
    "Silk,Bridal,Festive",
    "Orange",
    1195000,
    3,
    "saree-orange-festive",
    0,
    "A glowing orange palette, gold-toned woven detailing and a traditional drape give this ceremony sample its warmth. Jewellery and styling accessories are not included."
  ],
  [
    "ruby-banarasi-ceremony",
    "Ruby Banarasi Ceremony",
    "Silk",
    "Wedding",
    "Banarasi",
    "Silk,Banarasi,Bridal",
    "Red",
    1495000,
    2,
    "saree-red-ceremony",
    0,
    "Ruby red with scattered gold-toned motifs and an ornate floral border. A wedding sample concept with a generously decorated pallu and coordinating blouse styling."
  ],
  [
    "orchid-floral-cotton",
    "Orchid Floral Cotton",
    "Cotton",
    "Everyday",
    "Plain weave",
    "Cotton,Everyday",
    "Purple",
    285000,
    6,
    "saree-purple-floral",
    0,
    "Orchid purple cotton-style fabric with large pink and white floral prints. A cheerful everyday sample design, styled with a simple pale blouse."
  ],
  [
    "ivory-rose-cotton",
    "Ivory & Rose Cotton",
    "Cotton",
    "Everyday",
    "Plain weave",
    "Cotton,Everyday",
    "Ivory",
    215000,
    0,
    "saree-white-rose",
    0,
    "Clean ivory fabric and a fresh rose-pink border offer a simple daytime colour story. This sample listing illustrates a light cotton styling concept."
  ],
  [
    "violet-kanjivaram-celebration",
    "Violet Kanjivaram Celebration",
    "Silk",
    "Wedding",
    "Kanjivaram",
    "Silk,Kanjivaram,Bridal",
    "Purple",
    1395000,
    4,
    "saree-violet-silk",
    0,
    "Violet and cobalt tones are paired with copper-toned woven motifs and a broad decorative border. A richly coloured Kanjivaram-style sample for wedding celebrations."
  ],
  [
    "mysore-silk-classic",
    "Mysore Silk Classic",
    "Silk",
    "Festive",
    "Mysore",
    "Mysore Silk,Silk,Festive",
    "Maroon",
    725000,
    6,
    "saree-mysore-wine",
    1,
    "A plain, lustrous Mysore silk-style body with a classic gold-coloured border and striped pallu. Choose maroon, emerald or navy: each colour keeps the same border, weave and blouse design."
  ],
  [
    "mysore-silk-contrast",
    "Mysore Silk Contrast",
    "Silk",
    "Wedding",
    "Mysore",
    "Mysore Silk,Silk,Bridal",
    "Cobalt",
    825000,
    4,
    "saree-mysore-cobalt",
    1,
    "A plain Mysore silk-style body with a slim gold-coloured border and a contrasting blouse and striped pallu. Choose cobalt with magenta, teal with wine, or plum with copper; the design stays the same."
  ],
  [
    "mysore-silk-heritage",
    "Mysore Silk Heritage",
    "Silk",
    "Festive",
    "Mysore",
    "Mysore Silk,Silk,Festive",
    "Mustard",
    785000,
    5,
    "saree-mysore-mustard",
    1,
    "A luminous Mysore silk-style body framed by a contrast edge, gold-coloured border and striped pallu. Choose mustard with green, ivory with maroon, or rose with navy, all in the same design."
  ]
];
type ColourOption = [color: string, stock: number, image: string];
const colourOptions: Record<string, ColourOption[]> = {
  "mysore-silk-classic": [
    [
      "Maroon",
      6,
      "saree-mysore-wine"
    ],
    [
      "Emerald",
      4,
      "saree-mysore-classic-emerald"
    ],
    [
      "Navy",
      2,
      "saree-mysore-classic-navy"
    ]
  ],
  "mysore-silk-contrast": [
    [
      "Cobalt",
      4,
      "saree-mysore-cobalt"
    ],
    [
      "Teal",
      3,
      "saree-mysore-contrast-teal"
    ],
    [
      "Plum",
      0,
      "saree-mysore-contrast-plum"
    ]
  ],
  "mysore-silk-heritage": [
    [
      "Mustard",
      5,
      "saree-mysore-mustard"
    ],
    [
      "Ivory",
      4,
      "saree-mysore-heritage-ivory"
    ],
    [
      "Rose",
      2,
      "saree-mysore-heritage-rose"
    ]
  ]
};
export const samples = rows.map((r, i) => {
  const options = colourOptions[String(r[0])] || [[String(r[6]), Number(r[8]), String(r[9])]];
  return {
    id: `p${i + 1}`, slug: r[0], name: r[1], fabric: r[2], occasion: r[3],
    weave: r[4], collections: r[5], color: r[6], price: r[7], stock: r[8],
    images: JSON.stringify(options.map((v) => `/images/${v[2]}.jpg`)),
    featured: r[10],
    description: r[11] + " Sample product: materials, measurements, price and availability require store confirmation before sale.",
    length: "5.5 metres (sample specification)",
    blouse: "0.8 metre unstitched blouse piece (sample specification). Stitched blouse and accessories shown are styling references.",
    care: r[2] === "Cotton" || r[2] === "Linen"
      ? "Suggested sample care: gentle cold wash separately with mild detergent; dry in shade. Check the actual garment label before washing."
      : "Suggested sample care: dry clean; store folded in breathable cotton and avoid direct sunlight. Check the actual garment label before cleaning.",
    fall_pico: 0,
  };
});
export function sampleVariants(p: (typeof samples)[number]) {
  const options = colourOptions[String(p.slug)] || [[String(p.color), Number(p.stock), JSON.parse(p.images)[0].split("/").pop().replace(".jpg", "")]];
  return options.map(([color, stock, file], index) => ({
    id: `v${p.id}${index ? "-" + index : ""}`, product_id: p.id,
    color, stock, sku: `SAMPLE-${p.id}${index ? "-" + index : ""}`,
    image: `/images/${file}.jpg`,
  }));
}
export const money = (p: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(p / 100);
