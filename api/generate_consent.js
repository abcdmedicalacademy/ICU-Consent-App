const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, HeadingLevel, TabStopType, TabStopPosition,
} = require("docx");
const fs = require("fs");

// ─────────────────────────────────────────────────────────────────────────────
// COLOURS
// ─────────────────────────────────────────────────────────────────────────────
const BLUE      = "1B6CA8";
const BLUE_DARK = "1B3A5C";
const RED_BG    = "FEF2F2";
const RED_TXT   = "7F1D1D";
const AMBER_BG  = "FFFBEB";
const AMBER_TXT = "92400E";
const GREY_BG   = "F3F4F6";
const GREY_RULE = "C0D0E0";
const WHITE     = "FFFFFF";

// ─────────────────────────────────────────────────────────────────────────────
// FONTS
// English: Calibri  (universally available, clean)
// Tamil  : "Noto Sans Tamil" — Word will use this if installed on the
//          printing machine (standard on modern Windows/Mac).
//          Fallback in the XML: "Latha" (built-in Windows Tamil font).
//          Both render Tamil script correctly via Word's Uniscribe/CoreText engine.
// ─────────────────────────────────────────────────────────────────────────────
const EN_FONT = "Calibri";
const TA_FONT = "Noto Sans Tamil";

// DXA helpers  (1 inch = 1440 DXA)
const inch  = (n) => Math.round(n * 1440);
const pt    = (n) => Math.round(n * 2);   // half-points (docx unit)

// A4 page with 20 mm margins
const PAGE_W      = 11906;             // A4 width in DXA
const MARGIN      = inch(0.787);       // 20 mm ≈ 0.787 inch
const CONTENT_W   = PAGE_W - 2 * MARGIN;   // usable width

// ─────────────────────────────────────────────────────────────────────────────
// THIN HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** English TextRun */
const en = (text, opts = {}) => new TextRun({
  text,
  font: EN_FONT,
  size: opts.size || pt(10.5),
  bold: opts.bold || false,
  italics: opts.italic || false,
  color: opts.color || "000000",
  ...opts,
});

/** Tamil TextRun — specifies Noto Sans Tamil so Word uses correct shaping */
const ta = (text, opts = {}) => new TextRun({
  text,
  font: TA_FONT,
  size: opts.size || pt(12),
  bold: opts.bold || false,
  color: opts.color || "1a1a1a",
  ...opts,
});

/** Blank line spacer */
const spacer = (before = 60, after = 60) =>
  new Paragraph({ spacing: { before, after }, children: [new TextRun("")] });

/** Horizontal rule via paragraph border */
const rule = (color = GREY_RULE, thick = 6) =>
  new Paragraph({
    spacing: { before: 80, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: thick, color, space: 1 } },
    children: [],
  });

/** Bold blue section heading */
const sectionHead = (enText, taText) => {
  const items = [
    rule(BLUE_DARK, 12),
    new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [en(enText.toUpperCase(), { bold: true, size: pt(9.5), color: BLUE_DARK })],
    }),
  ];
  if (taText) {
    items.push(new Paragraph({
      spacing: { before: 0, after: 100 },
      children: [ta(taText, { bold: true, size: pt(11), color: "2a4a6a" })],
    }));
  }
  return items;
};

/** Admin detail row: "Label:  value" */
const adminRow = (label, value) => {
  if (!value) return [];
  return [new Paragraph({
    spacing: { before: 20, after: 20 },
    children: [
      en(`${label}: `, { bold: true, color: "555555", size: pt(9) }),
      en(value, { size: pt(9) }),
    ],
  })];
};

/** English + Tamil paragraph pair (Option B interleaved) */
const biPara = (enText, taText) => [
  new Paragraph({
    spacing: { before: 40, after: 40 },
    alignment: AlignmentType.JUSTIFIED,
    children: [en(enText)],
  }),
  new Paragraph({
    spacing: { before: 0, after: 100 },
    alignment: AlignmentType.JUSTIFIED,
    children: [ta(taText)],
  }),
];

/** Dashed separator between conditions */
const dashRule = () => new Paragraph({
  spacing: { before: 40, after: 40 },
  border: { bottom: { style: BorderStyle.DASHED, size: 3, color: "E5E5E5", space: 1 } },
  children: [],
});

/** Coloured box using a single-cell table */
const colourBox = (children, bgColor, borderColor) =>
  new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_W, type: WidthType.DXA },
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 12, color: borderColor },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
              left:   { style: BorderStyle.SINGLE, size: 12, color: borderColor },
              right:  { style: BorderStyle.SINGLE, size: 12, color: borderColor },
            },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children,
          }),
        ],
      }),
    ],
  });

/** Signature field: label + underline */
const sigField = (enLabel, taLabel, value = "") => [
  new Paragraph({
    spacing: { before: 60, after: 0 },
    children: [en(enLabel, { bold: true, size: pt(8.5), color: "555555" })],
  }),
  taLabel ? new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [ta(taLabel, { size: pt(9), color: "555555" })],
  }) : null,
  new Paragraph({
    spacing: { before: 20, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "AAAAAA", space: 1 } },
    children: value ? [en(value, { bold: true })] : [en(" ")],
  }),
].filter(Boolean);

// ─────────────────────────────────────────────────────────────────────────────
// FULL CONTENT DATABASE  (all 14 modules, complete English + Tamil)
// ─────────────────────────────────────────────────────────────────────────────
const CONTENT = {
  modules: [
    {
      id: "mod_respiratory", order: 1,
      label: { en: "Respiratory System", ta: "சுவாச மண்டலம்" },
      conditions: [
        {
          id: "cond_arf",
          keyword: { en: "Acute Respiratory Failure", ta: "கடுமையான சுவாசச் செயலிழப்பு" },
          severity: {
            mild:     { en: "Your relative is experiencing mild difficulty in breathing. Although their oxygen levels are lower than normal, they are currently being supported with supplemental oxygen through a mask or nasal prongs. We are closely monitoring their breathing and oxygen levels and will adjust treatment as needed.", ta: "உங்கள் உறவினருக்கு லேசான சுவாசக் கஷ்டம் உள்ளது. அவரது ஆக்சிஜன் அளவு சாதாரணத்தை விட குறைவாக இருந்தாலும், தற்போது முகமூடி அல்லது மூக்கு குழாய் மூலம் ஆக்சிஜன் வழங்கப்படுகிறது. சுவாசம் மற்றும் ஆக்சிஜன் அளவை நாங்கள் தொடர்ந்து கண்காணித்து சிகிச்சையை தேவைக்கேற்ப மாற்றுவோம்." },
            moderate: { en: "Your relative's lungs are not working as well as they should, and they are struggling to get enough oxygen into their blood even with the help of oxygen therapy. We have increased the level of oxygen support and are carefully watching for any signs of worsening. Further intervention, such as a breathing mask machine, may become necessary if things do not improve.", ta: "உங்கள் உறவினரின் நுரையீரல் சரியாக செயல்படவில்லை. ஆக்சிஜன் சிகிச்சை அளித்தாலும் இரத்தத்தில் போதுமான அளவு ஆக்சிஜன் கிடைக்கவில்லை. நாங்கள் ஆக்சிஜன் ஆதரவை அதிகரித்துள்ளோம் மற்றும் நிலைமை மோசமாகிறதா என கவனமாக கண்காணிக்கிறோம். நிலை மேம்படாவிட்டால் சுவாச உதவி இயந்திரம் தேவைப்படலாம்." },
            severe:   { en: "Your relative has developed severe respiratory failure, meaning their lungs are unable to provide enough oxygen to the body on their own. They require significant medical support to help them breathe. This is a serious condition and we are providing the highest level of care available. We will keep you closely updated on how they respond to treatment.", ta: "உங்கள் உறவினருக்கு கடுமையான சுவாசச் செயலிழப்பு ஏற்பட்டுள்ளது. அவரது நுரையீரல் தானாக உடலுக்கு போதுமான ஆக்சிஜன் வழங்க இயலவில்லை. சுவாசிக்க உதவ கணிசமான மருத்துவ ஆதரவு தேவைப்படுகிறது. இது மிகவும் தீவிரமான நிலை. நாங்கள் கிடைக்கக்கூடிய மிக உயர்ந்த சிகிச்சையை வழங்குகிறோம்." },
            critical: { en: "Your relative is in a critical state of respiratory failure. Despite the most advanced levels of breathing support we can provide, their lungs are struggling extremely hard to maintain even the minimum oxygen levels needed to sustain life. This is a life-threatening situation and we are doing everything medically possible. We need to have an honest conversation with you about what may lie ahead.", ta: "உங்கள் உறவினர் மிக தீவிரமான சுவாசச் செயலிழப்பில் உள்ளார். நாங்கள் வழங்கக்கூடிய மிக உயர்ந்த சுவாச ஆதரவு இருந்தாலும், உயிரை தக்கவைக்க தேவையான குறைந்தபட்ச ஆக்சிஜன் அளவையும் பராமரிக்க அவரது நுரையீரல் கடுமையாக போராடுகிறது. இது உயிருக்கு அபாயகரமான நிலை. மருத்துவரீதியாக சாத்தியமான அனைத்தையும் நாங்கள் செய்கிறோம்." },
          },
          trajectory: {
            improving:  { en: "We are pleased to inform you that your relative's breathing has shown some improvement with treatment. Their oxygen levels are responding better and we are cautiously optimistic, though continued close monitoring is essential.", ta: "சிகிச்சையால் உங்கள் உறவினரின் சுவாசம் சற்று மேம்பட்டுள்ளது என்பதை தெரிவிக்க மகிழ்ச்சியடைகிறோம். ஆக்சிஜன் அளவு சிறப்பாக பதிலளிக்கிறது. தொடர்ந்து கண்காணிப்பு அவசியம் என்றாலும் நாங்கள் எச்சரிக்கையுடன் நம்பிக்கையாக உள்ளோம்." },
            status_quo: { en: "Your relative's breathing condition remains unchanged at this time. They are neither deteriorating nor improving significantly. We are continuing the current treatment and will reassess regularly to determine the next steps.", ta: "உங்கள் உறவினரின் சுவாச நிலை தற்போது மாறாமல் உள்ளது. நிலைமை மோசமடையவும் இல்லை, கணிசமாக மேம்படவும் இல்லை. தற்போதைய சிகிச்சையை தொடர்ந்து அளித்து மீண்டும் மீண்டும் மதிப்பீடு செய்வோம்." },
            worsening:  { en: "Despite the treatment we are providing, your relative's breathing difficulty has been getting worse over the past several hours. We are making adjustments to their care and considering additional interventions. We want to be transparent with you about this change so that you can be prepared.", ta: "நாங்கள் வழங்கும் சிகிச்சை இருந்தாலும், கடந்த சில மணி நேரங்களாக உங்கள் உறவினரின் சுவாசக் கஷ்டம் அதிகரித்து வருகிறது. சிகிச்சையில் மாற்றங்கள் செய்து கூடுதல் தலையீடுகளை கருத்தில் கொள்கிறோம். நீங்கள் தயாராக இருக்க வேண்டும் என்பதால் இந்த மாற்றத்தை வெளிப்படையாக தெரிவிக்கிறோம்." },
            failing:    { en: "Your relative's lungs are no longer responding adequately to the maximum treatment we are able to provide. The respiratory failure is progressing despite our best efforts. We must have an urgent and honest discussion with you about the goals of care and what your relative would want in this situation.", ta: "நாங்கள் வழங்கக்கூடிய அதிகபட்ச சிகிச்சைக்கும் உங்கள் உறவினரின் நுரையீரல் போதுமான அளவு பதிலளிக்கவில்லை. எங்கள் சிறந்த முயற்சிகள் இருந்தாலும் சுவாசச் செயலிழப்பு தொடர்கிறது. சிகிச்சையின் நோக்கங்கள் குறித்தும் இந்த நிலைமையில் உங்கள் உறவினர் என்ன விரும்புவார் என்பது குறித்தும் உங்களுடன் அவசரமாக நேர்மையான விவாதம் நடத்த வேண்டும்." },
          },
        },
        {
          id: "cond_ards",
          keyword: { en: "ARDS – Acute Respiratory Distress Syndrome", ta: "ARDS – கடுமையான சுவாசக் கோளாறு நோய்க்குறி" },
          severity: {
            mild:     { en: "Your relative's lungs have been affected by a condition called Acute Respiratory Distress Syndrome (ARDS), which is at an early stage at present. This means the lungs have become partially inflamed and stiff, making breathing harder. We are providing oxygen support and treating the underlying cause.", ta: "உங்கள் உறவினரின் நுரையீரல் 'கடுமையான சுவாசக் கோளாறு நோய்க்குறி' (ARDS) என்ற நிலையால் பாதிக்கப்பட்டுள்ளது, தற்போது ஆரம்ப நிலையில் உள்ளது. நுரையீரல் ஓரளவு வீக்கமடைந்து கடினமாகியுள்ளது, இதனால் சுவாசிப்பது கடினமாகிறது. ஆக்சிஜன் ஆதரவு வழங்கி அடிப்படை காரணத்திற்கு சிகிச்சை அளிக்கிறோம்." },
            moderate: { en: "Your relative has been diagnosed with moderate ARDS. Both lungs have become significantly inflamed and filled with fluid, making it very difficult for oxygen to pass from the air into the blood. They need a breathing support machine to help them. This is a serious condition requiring close observation in the ICU.", ta: "உங்கள் உறவினருக்கு நடுத்தர அளவிலான ARDS கண்டறியப்பட்டுள்ளது. இரு நுரையீரல்களும் கணிசமான அளவு வீக்கமடைந்து திரவம் நிரம்பியுள்ளன, இதனால் காற்றிலிருந்து இரத்தத்திற்கு ஆக்சிஜன் செல்வது மிகவும் கஷ்டமாகிறது. சுவாசிக்க உதவ சுவாச ஆதரவு இயந்திரம் தேவைப்படுகிறது. ICU-வில் தீவிர கவனிப்பு தேவைப்படும் தீவிர நிலை இது." },
            severe:   { en: "Your relative has severe ARDS. Both lungs are severely damaged, inflamed and filled with fluid, making independent breathing impossible. They are on a mechanical ventilator, which is breathing for them. Despite this support, oxygen levels remain dangerously low. This is a life-threatening condition and recovery, if it occurs, may take weeks to months.", ta: "உங்கள் உறவினருக்கு தீவிரமான ARDS உள்ளது. இரு நுரையீரல்களும் கடுமையாக சேதமடைந்து வீக்கமடைந்து திரவம் நிரம்பியுள்ளன, தனியாக சுவாசிப்பது சாத்தியமற்றது. அவருக்கு சுவாசிக்க இயந்திர வென்டிலேட்டர் இணைக்கப்பட்டுள்ளது. இந்த ஆதரவு இருந்தாலும் ஆக்சிஜன் அளவு ஆபத்தான அளவில் குறைவாக உள்ளது. இது உயிருக்கு அபாயகரமான நிலை, குணமடைய வாரங்கள் முதல் மாதங்கள் வரை ஆகலாம்." },
            critical: { en: "Your relative is in the most severe stage of ARDS. Their lungs have sustained extreme damage and are barely functioning even on the highest ventilator settings. The medical team is exploring every possible option. We must be honest with you — this is an extremely critical situation with a very uncertain outlook.", ta: "உங்கள் உறவினர் ARDS-ன் மிகவும் தீவிரமான நிலையில் உள்ளார். நுரையீரல்கள் மிகவும் கடுமையாக சேதமடைந்துள்ளன, அதிகபட்ச வென்டிலேட்டர் அமைப்புகளிலும் சரியாக செயல்படவில்லை. மருத்துவக் குழு சாத்தியமான அனைத்து வாய்ப்புகளையும் ஆராய்கிறது. நாங்கள் நேர்மையாக சொல்ல வேண்டும் — இது மிகவும் தீவிரமான நிலை, எதிர்காலம் மிகவும் நிச்சயமற்றது." },
          },
          trajectory: {
            improving:  { en: "There are early signs that your relative's lungs are beginning to respond to treatment. The oxygen requirements are slowly decreasing, which is an encouraging sign. We remain cautious but hopeful.", ta: "உங்கள் உறவினரின் நுரையீரல் சிகிச்சைக்கு பதிலளிக்கத் தொடங்கியுள்ளது என்ற ஆரம்ப அறிகுறிகள் உள்ளன. ஆக்சிஜன் தேவை மெதுவாக குறைகிறது, இது ஊக்கமளிக்கும் அறிகுறி. நாங்கள் எச்சரிக்கையுடன் இருந்தாலும் நம்பிக்கையாக உள்ளோம்." },
            status_quo: { en: "The ARDS has neither worsened nor improved today. The lungs remain inflamed and we continue maximum supportive care. Stability at this stage, while not improvement, is also not deterioration.", ta: "ARDS இன்று மோசமடையவும் இல்லை, மேம்படவும் இல்லை. நுரையீரல்கள் வீக்கமடைந்தே உள்ளன, அதிகபட்ச ஆதரவு சிகிச்சை தொடர்கிறது. இந்த கட்டத்தில் நிலைத்தன்மை, முன்னேற்றம் இல்லாவிட்டாலும், மோசமடையவும் இல்லை." },
            worsening:  { en: "Unfortunately, the ARDS is getting worse despite treatment. We are escalating the level of support and consulting with specialist colleagues. We will keep you updated at each step.", ta: "துரதிர்ஷ்டவசமாக, சிகிச்சை இருந்தாலும் ARDS மோசமடைகிறது. ஆதரவின் அளவை அதிகரித்து நிபுணர் சக ஊழியர்களிடம் ஆலோசிக்கிறோம். ஒவ்வொரு படியிலும் உங்களுக்கு தெரிவிப்போம்." },
            failing:    { en: "The lungs are failing to respond to all treatment measures. We are in a situation where continuing aggressive intervention may cause more suffering without meaningful benefit. We want to discuss with you what your relative would consider a dignified and comfortable care plan.", ta: "அனைத்து சிகிச்சை நடவடிக்கைகளுக்கும் நுரையீரல்கள் பதிலளிக்கத் தவறுகின்றன. தீவிர தலையீட்டை தொடர்வது அர்த்தமுள்ள பலன் இல்லாமல் அதிக வலியை ஏற்படுத்தலாம். உங்கள் உறவினர் என்னை கண்ணியமான மற்றும் வசதியான பராமரிப்பு என்று கருதுவார் என்பதைப் பற்றி உங்களுடன் விவாதிக்க விரும்புகிறோம்." },
          },
        },
        {
          id: "cond_vent",
          keyword: { en: "Requirement for Invasive Mechanical Ventilation", ta: "இயந்திர சுவாச ஆதரவு தேவை" },
          severity: {
            mild:     { en: "Your relative needs to be connected to a breathing machine through a tube placed in the windpipe. This is done to protect the airway and give the lungs adequate rest and support while we treat the underlying illness.", ta: "உங்கள் உறவினரை மூச்சுக்குழாயில் வைக்கப்பட்ட குழாய் மூலம் சுவாச இயந்திரத்துடன் இணைக்க வேண்டும். நுரையீரலுக்கு போதுமான ஓய்வு மற்றும் ஆதரவு வழங்கியபடி அடிப்படை நோய்க்கு சிகிச்சை அளிக்க இது செய்யப்படுகிறது." },
            moderate: { en: "Your relative is currently on a mechanical ventilator, which is doing much of the breathing work for them. They are sedated to keep them comfortable while the machine supports their lungs. We are monitoring them very closely and will plan to gradually reduce this support as their condition allows.", ta: "உங்கள் உறவினர் தற்போது மெக்கானிக்கல் வென்டிலேட்டரில் உள்ளார், இது அவருக்காக பெரும்பான்மையான சுவாசப் பணியை செய்கிறது. இயந்திரம் நுரையீரலை ஆதரிக்கும்போது அவர் வசதியாக இருக்க மயக்கம் செலுத்தப்படுகிறார். நிலைமை அனுமதிக்கும்போது படிப்படியாக ஆதரவை குறைக்க திட்டமிடுவோம்." },
            severe:   { en: "Your relative requires the highest levels of mechanical ventilator support to maintain their breathing. Their lungs are very severely affected and the machine is performing almost all of the work of breathing. This is a very serious situation and the path to recovery is uncertain.", ta: "உங்கள் உறவினர் சுவாசத்தை பராமரிக்க மிக உயர்ந்த அளவிலான மெக்கானிக்கல் வென்டிலேட்டர் ஆதரவு தேவைப்படுகிறது. நுரையீரல்கள் மிகவும் தீவிரமாக பாதிக்கப்பட்டுள்ளன, இயந்திரம் சுவாசப் பணியில் கிட்டத்தட்ட அனைத்தையும் செய்கிறது. இது மிகவும் தீவிரமான நிலை, குணமடைவதற்கான பாதை நிச்சயமற்றது." },
            critical: { en: "Despite the ventilator running at maximum capacity, your relative's oxygen levels remain critically low and carbon dioxide is accumulating in the blood. We are exploring additional rescue measures but must be transparent that the situation is extremely grave.", ta: "வென்டிலேட்டர் அதிகபட்ச திறனில் இயங்கியும், உங்கள் உறவினரின் ஆக்சிஜன் அளவு மிகவும் குறைவாகவும் இரத்தத்தில் கார்பன் டை ஆக்சைடு குவியவும் தொடர்கிறது. கூடுதல் மீட்பு நடவடிக்கைகளை ஆராய்கிறோம், ஆனால் நிலைமை மிகவும் தீவிரமானது என்பதை நேர்மையாக சொல்ல வேண்டும்." },
          },
          trajectory: {
            improving:  { en: "Your relative's breathing has improved enough that we are beginning the process of gently reducing the ventilator support — a process called 'weaning'. This is a positive step, though it needs to be done carefully and slowly.", ta: "உங்கள் உறவினரின் சுவாசம் போதுமான அளவு மேம்பட்டுள்ளதால் வென்டிலேட்டர் ஆதரவை மெதுவாக குறைக்கும் செயல்முறையை தொடங்குகிறோம் — இதை 'வீனிங்' என்று அழைக்கிறோம். இது நேர்மறையான படி, இருப்பினும் கவனமாகவும் மெதுவாகவும் செய்ய வேண்டும்." },
            status_quo: { en: "Your relative's ventilator needs remain the same as yesterday. There is no immediate change in their requirement for breathing support. We continue to monitor carefully.", ta: "உங்கள் உறவினரின் வென்டிலேட்டர் தேவைகள் நேற்றுடன் ஒப்பிடும்போது அதே அளவில் உள்ளன. சுவாச ஆதரவுத் தேவையில் உடனடி மாற்றம் இல்லை. தொடர்ந்து கவனமாக கண்காணிக்கிறோம்." },
            worsening:  { en: "The ventilator support required has increased since yesterday, indicating the lungs are under more strain. We are adjusting the settings and medications and watching for any further changes.", ta: "நேற்றை விட தேவைப்படும் வென்டிலேட்டர் ஆதரவு அதிகரித்துள்ளது, நுரையீரல் அதிக அழுத்தத்தில் உள்ளது என்பதை இது குறிக்கிறது. அமைப்புகள் மற்றும் மருந்துகளை சரிசெய்து மேலும் ஏதேனும் மாற்றங்களை கவனிக்கிறோம்." },
            failing:    { en: "The ventilator is no longer sufficient to maintain life-sustaining oxygen levels. We have reached the limits of what breathing machine support can achieve. This is a critical turning point and we must discuss the next steps together as a family.", ta: "வாழ்க்கையை தக்கவைக்கும் ஆக்சிஜன் அளவை பராமரிக்க வென்டிலேட்டர் இனி போதுமானதாக இல்லை. சுவாச இயந்திர ஆதரவு அடையக்கூடியதற்கு வரம்பை எட்டிவிட்டோம். இது ஒரு நிர்ணாயகமான திருப்புமுனை, குடும்பமாக சேர்ந்து அடுத்த படிகளை விவாதிக்க வேண்டும்." },
          },
        },
        {
          id: "cond_niv",
          keyword: { en: "NIV / BiPAP – Non-Invasive Ventilation", ta: "NIV / BiPAP – ஆக்கிரமிப்பற்ற சுவாச ஆதரவு" },
          severity: {
            mild:     { en: "Your relative is being given breathing support through a tight-fitting face mask connected to a machine that helps push air into the lungs. This avoids the need for a breathing tube at this stage and is often effective in the early phase of breathing difficulty.", ta: "உங்கள் உறவினருக்கு நுரையீரலில் காற்றை தள்ள உதவும் இயந்திரத்துடன் இணைக்கப்பட்ட இறுக்கமான முக முகமூடி மூலம் சுவாச ஆதரவு வழங்கப்படுகிறது. இந்த கட்டத்தில் சுவாசக் குழாயின் தேவையை இது தவிர்க்கிறது, சுவாசக் கஷ்டத்தின் ஆரம்ப கட்டத்தில் இது பெரும்பாலும் பயனுள்ளதாக இருக்கிறது." },
            moderate: { en: "Your relative is on a BiPAP machine, which is helping them breathe by providing pressurised air through a face mask. They are requiring significant support from this machine. If they do not improve, we may need to consider placing a breathing tube.", ta: "உங்கள் உறவினர் BiPAP இயந்திரத்தில் உள்ளார், இது முக முகமூடி மூலம் அழுத்தமான காற்றை வழங்கி சுவாசிக்க உதவுகிறது. இந்த இயந்திரத்தில் இருந்து கணிசமான ஆதரவு தேவைப்படுகிறது. நிலை மேம்படாவிட்டால் சுவாசக் குழாய் போடுவதை பரிசீலிக்க வேண்டியதிருக்கும்." },
            severe:   { en: "Your relative's breathing is so difficult that the BiPAP mask alone is barely keeping up. We are at a point where we need to make a decision about whether to proceed to full ventilator support through a breathing tube. We would like to discuss this important step with you.", ta: "உங்கள் உறவினரின் சுவாசம் மிகவும் கஷ்டமாக உள்ளதால் BiPAP முகமூடி மட்டுமே சமாளிக்க சிரமப்படுகிறது. சுவாசக் குழாய் மூலம் முழுமையான வென்டிலேட்டர் ஆதரவுக்கு முன்னேற வேண்டுமா என்று முடிவெடுக்க வேண்டிய கட்டத்தில் உள்ளோம். இந்த முக்கியமான படியைப் பற்றி உங்களுடன் விவாதிக்க விரும்புகிறோம்." },
            critical: { en: "The non-invasive mask support is failing to maintain adequate breathing. This is now a medical emergency and a decision about intubation and full mechanical ventilation must be made urgently.", ta: "ஆக்கிரமிப்பற்ற முகமூடி ஆதரவு போதுமான சுவாசத்தை பராமரிக்கத் தவறுகிறது. இது இப்போது மருத்துவ அவசரநிலை மற்றும் குழாய் இணைப்பு மற்றும் முழுமையான மெக்கானிக்கல் வென்டிலேஷன் பற்றிய முடிவை அவசரமாக எடுக்க வேண்டும்." },
          },
          trajectory: {
            improving:  { en: "The BiPAP support is working well and your relative's breathing effort is decreasing. We plan to gradually reduce the mask pressure as they continue to improve.", ta: "BiPAP ஆதரவு நன்றாக வேலை செய்கிறது மற்றும் உங்கள் உறவினரின் சுவாச முயற்சி குறைகிறது. அவர் தொடர்ந்து மேம்படுவதால் முகமூடி அழுத்தத்தை படிப்படியாக குறைக்க திட்டமிடுகிறோம்." },
            status_quo: { en: "The BiPAP requirements are unchanged. The mask is doing its job to maintain safe oxygen levels, but there is no improvement yet allowing us to reduce the support.", ta: "BiPAP தேவைகள் மாறாமல் உள்ளன. முகமூடி பாதுகாப்பான ஆக்சிஜன் அளவை பராமரிக்கும் வேலையை செய்கிறது, ஆனால் ஆதரவை குறைக்க இன்னும் எந்த முன்னேற்றமும் இல்லை." },
            worsening:  { en: "Despite BiPAP support, your relative is working harder to breathe and their oxygen levels are not being maintained adequately. We may need to escalate to a full breathing tube and ventilator.", ta: "BiPAP ஆதரவு இருந்தாலும், உங்கள் உறவினர் சுவாசிக்க அதிகமாக முயற்சிக்கிறார் மற்றும் ஆக்சிஜன் அளவு போதுமான அளவு பராமரிக்கப்படவில்லை. முழுமையான சுவாசக் குழாய் மற்றும் வென்டிலேட்டருக்கு மேம்படுத்த வேண்டியிருக்கலாம்." },
            failing:    { en: "The BiPAP is no longer helping adequately. We must escalate care immediately to prevent further deterioration.", ta: "BiPAP இனி போதுமான அளவு உதவி செய்யவில்லை. மேலும் மோசமடைவதை தடுக்க உடனடியாக சிகிச்சையை மேம்படுத்த வேண்டும்." },
          },
        },
        {
          id: "cond_pneumonia",
          keyword: { en: "Pneumonia – Community or Hospital Acquired", ta: "நிமோனியா – சமூக அல்லது மருத்துவமனை தொற்று" },
          severity: {
            mild:     { en: "Your relative has been diagnosed with pneumonia, a lung infection that is causing inflammation in the lung tissue. This is currently at a manageable stage and they are receiving appropriate antibiotics and oxygen support. Most people recover well with treatment.", ta: "உங்கள் உறவினருக்கு நிமோனியா, நுரையீரல் திசுவில் அழற்சியை ஏற்படுத்தும் நுரையீரல் தொற்று கண்டறியப்பட்டுள்ளது. இது தற்போது கட்டுப்படுத்தக்கூடிய கட்டத்தில் உள்ளது, உரிய நுண்ணுயிர் எதிர்ப்பிகள் மற்றும் ஆக்சிஜன் ஆதரவு வழங்கப்படுகிறது. சிகிச்சையால் பெரும்பாலான மக்கள் நன்றாக குணமடைகின்றனர்." },
            moderate: { en: "Your relative has a significant pneumonia affecting a large portion of the lungs. They need hospital-level care including intravenous antibiotics and close monitoring. Their recovery may take one to two weeks, and we need to watch carefully for complications.", ta: "உங்கள் உறவினருக்கு நுரையீரலின் பெரும் பகுதியை பாதிக்கும் கணிசமான நிமோனியா உள்ளது. நரம்பு வழி நுண்ணுயிர் எதிர்ப்பிகள் மற்றும் நெருங்கிய கண்காணிப்பு உள்பட மருத்துவமனை அளவிலான சிகிச்சை தேவைப்படுகிறது. குணமடைய ஒன்று முதல் இரண்டு வாரங்கள் ஆகலாம், சிக்கல்களை கவனமாக கவனிக்க வேண்டும்." },
            severe:   { en: "Your relative has developed severe pneumonia affecting both lungs extensively. Their body is struggling to maintain enough oxygen even with breathing machine support. Severe pneumonia can be life-threatening, particularly in those with other medical conditions.", ta: "உங்கள் உறவினருக்கு இரு நுரையீரல்களையும் விரிவாக பாதிக்கும் தீவிரமான நிமோனியா ஏற்பட்டுள்ளது. சுவாச இயந்திர ஆதரவு இருந்தாலும் போதுமான ஆக்சிஜனை பராமரிக்க உடல் போராடுகிறது. தீவிரமான நிமோனியா உயிருக்கு அபாயகரமாக இருக்கலாம், குறிப்பாக பிற மருத்துவ நிலைகள் உள்ளவர்களுக்கு." },
            critical: { en: "The pneumonia has caused overwhelming infection in the lungs, leading to complete respiratory failure. This is the most serious stage of this condition and requires the highest level of ICU care. Despite maximum treatment, the outcome remains highly uncertain.", ta: "நிமோனியா நுரையீரலில் பரவலான தொற்றை ஏற்படுத்தி முழுமையான சுவாசச் செயலிழப்புக்கு வழிவகுத்துள்ளது. இது இந்த நிலையின் மிகவும் தீவிரமான கட்டம், மிக உயர்ந்த ICU சிகிச்சை தேவைப்படுகிறது. அதிகபட்ச சிகிச்சை இருந்தாலும் விளைவு மிகவும் நிச்சயமற்றதாக உள்ளது." },
          },
          trajectory: {
            improving:  { en: "The antibiotics are working and the lung infection is showing signs of improvement. Oxygen requirements are reducing gradually.", ta: "நுண்ணுயிர் எதிர்ப்பிகள் வேலை செய்கின்றன, நுரையீரல் தொற்று முன்னேற்றத்தின் அறிகுறிகளை காட்டுகிறது. ஆக்சிஜன் தேவைகள் படிப்படியாக குறைகின்றன." },
            status_quo: { en: "The pneumonia has not worsened but has also not significantly improved. We continue antibiotics and will reassess.", ta: "நிமோனியா மோசமடையவில்லை ஆனால் கணிசமாக முன்னேறவும் இல்லை. நுண்ணுயிர் எதிர்ப்பிகளை தொடர்கிறோம், மீண்டும் மதிப்பீடு செய்வோம்." },
            worsening:  { en: "Despite antibiotics, the infection in the lungs is spreading and the breathing difficulty is increasing. We are changing or escalating antibiotic treatment and considering further support.", ta: "நுண்ணுயிர் எதிர்ப்பிகள் இருந்தாலும், நுரையீரலில் தொற்று பரவி சுவாசக் கஷ்டம் அதிகரிக்கிறது. நுண்ணுயிர் எதிர்ப்பி சிகிச்சையை மாற்றி மேம்படுத்தி கூடுதல் ஆதரவை பரிசீலிக்கிறோம்." },
            failing:    { en: "The lung infection is not responding to antibiotics and the lungs are failing despite maximum support. We are consulting infectious disease specialists and reviewing all possible options.", ta: "நுரையீரல் தொற்று நுண்ணுயிர் எதிர்ப்பிகளுக்கு பதிலளிக்கவில்லை, அதிகபட்ச ஆதரவு இருந்தாலும் நுரையீரல்கள் செயலிழக்கின்றன. தொற்று நோய் நிபுணர்களிடம் ஆலோசித்து சாத்தியமான அனைத்து வாய்ப்புகளையும் ஆய்வு செய்கிறோம்." },
          },
        },
      ],
    },
    {
      id: "mod_cardiovascular", order: 2,
      label: { en: "Cardiovascular System / Shock", ta: "இருதய மண்டலம் / அதிர்ச்சி நிலை" },
      conditions: [
        {
          id: "cond_cardiogenic",
          keyword: { en: "Cardiogenic Shock – Heart Pump Failure", ta: "கார்டியோஜெனிக் ஷாக் – இதய பம்ப் செயலிழப்பு" },
          severity: {
            mild:     { en: "Your relative's heart is not pumping blood as effectively as it should. This means the body's organs are not receiving adequate blood flow. They are receiving medications through the vein to support the heart and are being closely monitored.", ta: "உங்கள் உறவினரின் இதயம் இரத்தத்தை திறம்பட பம்ப் செய்யவில்லை. அதாவது உடலின் உறுப்புகளுக்கு போதுமான இரத்த ஓட்டம் கிடைக்கவில்லை. இதயத்தை ஆதரிக்க நரம்பு வழியாக மருந்துகள் வழங்கப்படுகின்றன, நெருங்கிய கண்காணிப்பில் உள்ளார்." },
            moderate: { en: "Your relative's heart is significantly weakened and is failing to pump enough blood to meet the body's needs. This is called cardiogenic shock. They are on strong medications to support heart function. This is a serious condition requiring intensive monitoring.", ta: "உங்கள் உறவினரின் இதயம் கணிசமாக பலவீனமடைந்து உடலின் தேவைகளை பூர்த்தி செய்ய போதுமான இரத்தத்தை பம்ப் செய்யத் தவறுகிறது. இதை கார்டியோஜெனிக் ஷாக் என்று அழைக்கிறோம். இதய செயல்பாட்டை ஆதரிக்க வலிமையான மருந்துகள் வழங்கப்படுகின்றன. தீவிர கண்காணிப்பு தேவைப்படும் தீவிர நிலை இது." },
            severe:   { en: "Your relative's heart has severely failed and is unable to maintain blood pressure or circulation despite the strongest medications we can give. This is immediately life-threatening. We are considering additional interventional options to support the heart, and will keep you informed.", ta: "உங்கள் உறவினரின் இதயம் கடுமையாக செயலிழந்துள்ளது, நாங்கள் வழங்கக்கூடிய மிக வலிமையான மருந்துகள் இருந்தாலும் இரத்த அழுத்தம் அல்லது சுழற்சியை பராமரிக்க இயலவில்லை. இது உடனடியாக உயிருக்கு அபாயமானது. இதயத்தை ஆதரிக்க கூடுதல் தலையீட்டு வாய்ப்புகளை பரிசீலிக்கிறோம், உங்களுக்கு தெரிவிப்போம்." },
            critical: { en: "The heart is in complete failure and is unable to sustain circulation to the vital organs. Multiple organ systems are beginning to fail as a consequence. This is the most critical phase of cardiogenic shock and we must discuss the realistic outlook with you.", ta: "இதயம் முழுமையாக செயலிழந்து முக்கிய உறுப்புகளுக்கு சுழற்சியை தக்கவைக்க இயலவில்லை. இதன் விளைவாக பல உறுப்பு அமைப்புகள் செயலிழக்கத் தொடங்குகின்றன. இது கார்டியோஜெனிக் ஷாக்கின் மிக தீவிரமான கட்டம், உங்களுடன் யதார்த்தமான கண்ணோட்டத்தை விவாதிக்க வேண்டும்." },
          },
          trajectory: {
            improving:  { en: "The heart's pumping function is showing early improvement with medications. Blood pressure is stabilising, which is an encouraging sign.", ta: "மருந்துகளால் இதயத்தின் பம்ப் செயல்பாடு ஆரம்ப முன்னேற்றத்தை காட்டுகிறது. இரத்த அழுத்தம் நிலைப்படுத்தப்படுகிறது, இது ஊக்கமளிக்கும் அறிகுறி." },
            status_quo: { en: "The heart function remains at the same level as yesterday, neither deteriorating nor improving. We continue medications and monitoring.", ta: "இதய செயல்பாடு நேற்றுடன் ஒப்பிடும்போது அதே நிலையில் உள்ளது, மோசமடையவும் இல்லை, மேம்படவும் இல்லை. மருந்துகள் மற்றும் கண்காணிப்பை தொடர்கிறோம்." },
            worsening:  { en: "The heart's pumping ability has declined further despite medications. We are adjusting treatment and may need to consider mechanical heart support devices.", ta: "மருந்துகள் இருந்தாலும் இதயத்தின் பம்பிங் திறன் மேலும் குறைந்துள்ளது. சிகிச்சையை சரிசெய்கிறோம், மெக்கானிக்கல் இதய ஆதரவு சாதனங்களை பரிசீலிக்க வேண்டியிருக்கலாம்." },
            failing:    { en: "The heart is in terminal failure and is no longer responding to any treatment. We must now focus our conversation on comfort and dignity for your relative.", ta: "இதயம் இறுதி செயலிழப்பில் உள்ளது, எந்த சிகிச்சைக்கும் இனி பதிலளிக்கவில்லை. இப்போது உங்கள் உறவினரின் வசதி மற்றும் கண்ணியத்தில் கவனம் செலுத்த வேண்டும்." },
          },
        },
        {
          id: "cond_septic_shock",
          keyword: { en: "Septic Shock – Infection Causing Circulatory Failure", ta: "செப்டிக் ஷாக் – தொற்றால் சுழற்சி செயலிழப்பு" },
          severity: {
            mild:     { en: "A serious infection in your relative's body is affecting the circulation. Although blood pressure is low, it is currently responding to fluids and medications. We are treating the infection aggressively with antibiotics.", ta: "உங்கள் உறவினரின் உடலில் ஒரு தீவிரமான தொற்று சுழற்சியை பாதிக்கிறது. இரத்த அழுத்தம் குறைவாக இருந்தாலும், தற்போது திரவங்கள் மற்றும் மருந்துகளுக்கு பதிலளிக்கிறது. நுண்ணுயிர் எதிர்ப்பிகளால் தொற்றை தீவிரமாக சிகிச்சை செய்கிறோம்." },
            moderate: { en: "Your relative is in septic shock. The infection has entered the bloodstream and caused the blood pressure to drop to dangerous levels. They are on intravenous fluids, antibiotics, and blood pressure-supporting medications. Intensive monitoring is essential.", ta: "உங்கள் உறவினர் செப்டிக் ஷாக்கில் உள்ளார். தொற்று இரத்த ஓட்டத்தில் நுழைந்து இரத்த அழுத்தத்தை ஆபத்தான அளவுக்கு வீழ்ச்சிக்கு கொண்டு வந்துள்ளது. நரம்பு வழி திரவங்கள், நுண்ணுயிர் எதிர்ப்பிகள் மற்றும் இரத்த அழுத்தத்தை ஆதரிக்கும் மருந்துகள் வழங்கப்படுகின்றன. தீவிர கண்காணிப்பு அவசியம்." },
            severe:   { en: "Your relative is in severe septic shock and requires very strong blood pressure-supporting medications called vasopressors just to keep the circulation going. The infection is causing widespread damage throughout the body and multiple organs are under threat.", ta: "உங்கள் உறவினர் தீவிரமான செப்டிக் ஷாக்கில் உள்ளார், சுழற்சியை தொடர வாஸோபிரஸ்சர்கள் என்ற மிக வலிமையான இரத்த அழுத்த ஆதரவு மருந்துகள் தேவைப்படுகின்றன. தொற்று உடல் முழுவதும் பரவலான சேதத்தை ஏற்படுத்துகிறது, பல உறுப்புகள் அபாயத்தில் உள்ளன." },
            critical: { en: "The septic shock is overwhelming the body. Despite maximum medication doses, the blood pressure remains critically low and organs are failing. This is a life-or-death situation and we are exploring every possible treatment option.", ta: "செப்டிக் ஷாக் உடலை முழுமையாக பாதிக்கிறது. அதிகபட்ச மருந்து அளவுகள் இருந்தாலும் இரத்த அழுத்தம் மிகவும் குறைவாகவே உள்ளது, உறுப்புகள் செயலிழக்கின்றன. இது உயிர் அல்லது இறப்பு நிலை, சாத்தியமான ஒவ்வொரு சிகிச்சை வாய்ப்பையும் ஆராய்கிறோம்." },
          },
          trajectory: {
            improving:  { en: "The blood pressure is improving and the vasopressor medications are being gradually reduced. The infection appears to be responding to antibiotics.", ta: "இரத்த அழுத்தம் மேம்பட்டு வாஸோபிரஸ்சர் மருந்துகள் படிப்படியாக குறைக்கப்படுகின்றன. தொற்று நுண்ணுயிர் எதிர்ப்பிகளுக்கு பதிலளிக்கிறது என்று தோன்றுகிறது." },
            status_quo: { en: "The blood pressure is being maintained on the current medications without significant change. The situation is being closely watched.", ta: "தற்போதைய மருந்துகளில் இரத்த அழுத்தம் கணிசமான மாற்றமின்றி பராமரிக்கப்படுகிறது. நிலைமையை நெருங்கிய கவனிப்பில் கவனிக்கப்படுகிறது." },
            worsening:  { en: "More blood pressure medication is now required to maintain circulation, suggesting the shock is worsening. We are intensifying all treatment and searching for the source of infection.", ta: "சுழற்சியை பராமரிக்க இப்போது அதிக இரத்த அழுத்த மருந்து தேவைப்படுகிறது, இது அதிர்ச்சி மோசமடைகிறது என்று சுட்டிக்காட்டுகிறது. அனைத்து சிகிச்சைகளையும் தீவிரப்படுத்தி தொற்றின் மூலத்தை தேடுகிறோம்." },
            failing:    { en: "The shock is progressing to a stage where blood pressure cannot be maintained despite the highest possible medication doses. The organs are failing rapidly. We must speak honestly about what this means.", ta: "அதிகபட்ச சாத்தியமான மருந்து அளவுகள் இருந்தாலும் இரத்த அழுத்தத்தை பராமரிக்க முடியாத நிலைக்கு அதிர்ச்சி முன்னேறுகிறது. உறுப்புகள் வேகமாக செயலிழக்கின்றன. இதன் அர்த்தம் என்ன என்பதை நேர்மையாக பேச வேண்டும்." },
          },
        },
        {
          id: "cond_arrhythmia",
          keyword: { en: "Cardiac Arrhythmia – Dangerous Abnormal Heart Rhythm", ta: "இதய தாள கோளாறு – ஆபத்தான அசாதாரண இதய தாளம்" },
          severity: {
            mild:     { en: "Your relative's heart is beating with an abnormal rhythm. While this is being closely monitored, it is currently causing minimal disturbance to the circulation and is being managed with medication.", ta: "உங்கள் உறவினரின் இதயம் அசாதாரண தாளத்துடன் துடிக்கிறது. இது நெருங்கிய கண்காணிப்பில் இருந்தாலும், தற்போது சுழற்சியில் குறைந்தபட்ச தொந்தரவை ஏற்படுத்துகிறது, மருந்துகளால் நிர்வகிக்கப்படுகிறது." },
            moderate: { en: "Your relative is experiencing a significant disturbance in their heart rhythm which is affecting how effectively the heart pumps blood. We are treating this with medications and monitoring continuously with a heart monitor.", ta: "உங்கள் உறவினர் இதயம் இரத்தத்தை எவ்வளவு திறம்பட பம்ப் செய்கிறது என்பதை பாதிக்கும் முக்கியமான இதய தாள தொந்தரவை அனுபவிக்கிறார். இதை மருந்துகளால் சிகிச்சை செய்து இதய மானிட்டரால் தொடர்ந்து கண்காணிக்கிறோம்." },
            severe:   { en: "The heart rhythm disturbance is severe and is causing dangerously low blood pressure. Urgent treatment such as electric shocks to reset the heart rhythm (cardioversion) or emergency medications may be required.", ta: "இதய தாள தொந்தரவு தீவிரமானது, ஆபத்தான அளவில் குறைந்த இரத்த அழுத்தத்தை ஏற்படுத்துகிறது. இதய தாளத்தை மீட்டமைக்க மின்சார அதிர்ச்சிகள் (கார்டியோவெர்ஷன்) அல்லது அவசர மருந்துகள் போன்ற அவசர சிகிச்சை தேவைப்படலாம்." },
            critical: { en: "Your relative is experiencing a life-threatening heart rhythm that has caused their heart to stop pumping effectively. Emergency resuscitation measures are being performed.", ta: "உங்கள் உறவினர் உயிருக்கு அபாயமான இதய தாளத்தை அனுபவிக்கிறார், இதனால் இதயம் திறம்பட பம்ப் செய்வதை நிறுத்திவிட்டது. அவசர புத்துயிர் நடவடிக்கைகள் மேற்கொள்ளப்படுகின்றன." },
          },
          trajectory: {
            improving:  { en: "The heart rhythm has stabilised with treatment. We continue to monitor closely to prevent any recurrence.", ta: "சிகிச்சையால் இதய தாளம் நிலைப்பட்டுள்ளது. மீண்டும் தடுக்க நெருங்கிய கவனிப்பில் கண்காணிக்கிறோம்." },
            status_quo: { en: "The abnormal rhythm persists but is controlled at the current level. Medications are keeping it from worsening for now.", ta: "அசாதாரண தாளம் தொடர்கிறது, ஆனால் தற்போதைய அளவில் கட்டுப்படுத்தப்படுகிறது. மருந்துகள் அதை மோசமடைவதிலிருந்து தற்போது தடுக்கின்றன." },
            worsening:  { en: "The heart rhythm is becoming less stable and harder to control. We are adjusting medications and may need to consider electrical cardioversion.", ta: "இதய தாளம் குறைவான நிலையானதாகவும் கட்டுப்படுத்துவது கஷ்டமாகவும் ஆகிறது. மருந்துகளை சரிசெய்கிறோம், மின்சார கார்டியோவெர்ஷன் பரிசீலிக்க வேண்டியிருக்கலாம்." },
            failing:    { en: "The heart rhythm is no longer responding to medications and is causing critical instability in the circulation. Emergency intervention is being considered.", ta: "இதய தாளம் மருந்துகளுக்கு இனி பதிலளிக்கவில்லை, சுழற்சியில் தீவிர அல்லாத நிலைப்படுத்தலை ஏற்படுத்துகிறது. அவசர தலையீடு பரிசீலிக்கப்படுகிறது." },
          },
        },
      ],
    },
    {
      id: "mod_renal", order: 3,
      label: { en: "Renal (Kidney) System", ta: "சிறுநீரக மண்டலம்" },
      conditions: [
        {
          id: "cond_aki",
          keyword: { en: "Acute Kidney Injury (AKI)", ta: "கடுமையான சிறுநீரக காயம் (AKI)" },
          severity: {
            mild:     { en: "Your relative's kidneys are not working as well as they normally do. This is called acute kidney injury. At this stage, the kidneys are still producing some urine and the body's waste products are only mildly elevated. We are closely managing their fluids and medications to give the kidneys the best chance to recover.", ta: "உங்கள் உறவினரின் சிறுநீரகங்கள் பொதுவாக செய்வதை விட சரியாக வேலை செய்யவில்லை. இதை கடுமையான சிறுநீரக காயம் என்று அழைக்கிறோம். இந்த கட்டத்தில் சிறுநீரகங்கள் இன்னும் சிறிது சிறுநீர் உற்பத்தி செய்கின்றன, உடலின் கழிவுப் பொருட்கள் லேசாக மட்டுமே உயர்ந்துள்ளன. சிறுநீரகங்கள் குணமடைய சிறந்த வாய்ப்பு வழங்க திரவங்கள் மற்றும் மருந்துகளை நெருங்கிய கவனிப்பில் நிர்வகிக்கிறோம்." },
            moderate: { en: "Your relative's kidneys are significantly affected and are not filtering the blood adequately. Waste products and toxins are building up in the bloodstream. We are adjusting all medications to protect the kidneys and monitoring their blood tests very frequently.", ta: "உங்கள் உறவினரின் சிறுநீரகங்கள் கணிசமாக பாதிக்கப்பட்டு இரத்தத்தை போதுமான அளவு வடிகட்டவில்லை. கழிவுப் பொருட்கள் மற்றும் நச்சுகள் இரத்த ஓட்டத்தில் குவிகின்றன. சிறுநீரகங்களை பாதுகாக்க அனைத்து மருந்துகளையும் சரிசெய்து இரத்த பரிசோதனைகளை மிக அடிக்கடி கண்காணிக்கிறோம்." },
            severe:   { en: "Your relative's kidneys have stopped working adequately and are unable to filter waste products from the blood or regulate the body's fluid balance. This level of kidney failure can cause dangerous accumulations of fluid and toxins. We are now considering kidney replacement therapy such as dialysis.", ta: "உங்கள் உறவினரின் சிறுநீரகங்கள் போதுமான அளவு வேலை செய்வதை நிறுத்திவிட்டன, இரத்தத்திலிருந்து கழிவுப் பொருட்களை வடிகட்டவோ அல்லது உடலின் திரவ சமநிலையை சீராக்கவோ இயலவில்லை. இந்த அளவிலான சிறுநீரக செயலிழப்பு திரவம் மற்றும் நச்சுகளின் ஆபத்தான குவிப்பை ஏற்படுத்தலாம். டயாலிசிஸ் போன்ற சிறுநீரக மாற்று சிகிச்சையை இப்போது பரிசீலிக்கிறோம்." },
            critical: { en: "The kidneys have essentially stopped functioning. Fluid, potassium and toxic waste are at dangerous levels in the blood. Dialysis is urgently needed to keep the body in balance. Without dialysis, these abnormalities become life-threatening.", ta: "சிறுநீரகங்கள் அடிப்படையில் செயல்படுவதை நிறுத்திவிட்டன. திரவம், பொட்டாசியம் மற்றும் நச்சு கழிவுகள் இரத்தத்தில் ஆபத்தான அளவில் உள்ளன. உடல் சமநிலையை பராமரிக்க டயாலிசிஸ் அவசரமாக தேவைப்படுகிறது. டயாலிசிஸ் இல்லாமல் இந்த அசாதாரணங்கள் உயிருக்கு அபாயகரமாக ஆகும்." },
          },
          trajectory: {
            improving:  { en: "The kidneys are showing early signs of recovery. Urine output is increasing and the blood waste product levels are starting to come down.", ta: "சிறுநீரகங்கள் குணமடைவதற்கான ஆரம்ப அறிகுறிகளை காட்டுகின்றன. சிறுநீர் வெளியீடு அதிகரிக்கிறது, இரத்த கழிவு பொருள் அளவுகள் குறையத் தொடங்குகின்றன." },
            status_quo: { en: "The kidney function has remained the same over the past day. There is no further deterioration but recovery has not yet begun.", ta: "கடந்த ஒரு நாளில் சிறுநீரக செயல்பாடு அதே அளவில் உள்ளது. மேலும் சரிவு இல்லை, ஆனால் குணமடைவு இன்னும் தொடங்கவில்லை." },
            worsening:  { en: "The kidneys are producing less urine and the blood waste levels are rising despite our management. We are urgently reviewing all possible causes and treatment options.", ta: "மேலாண்மை இருந்தாலும் சிறுநீரகங்கள் குறைவான சிறுநீரை உற்பத்தி செய்கின்றன, இரத்த கழிவு அளவுகள் உயர்கின்றன. சாத்தியமான அனைத்து காரணங்களையும் சிகிச்சை வாய்ப்புகளையும் அவசரமாக ஆய்வு செய்கிறோம்." },
            failing:    { en: "The kidneys have stopped functioning and are not expected to recover on their own. Long-term dialysis may be required if the overall condition allows. We need to discuss this important change with you.", ta: "சிறுநீரகங்கள் செயல்படுவதை நிறுத்திவிட்டன, தனியாக குணமடைவு எதிர்பார்க்கப்படவில்லை. ஒட்டுமொத்த நிலை அனுமதித்தால் நீண்டகால டயாலிசிஸ் தேவைப்படலாம். இந்த முக்கியமான மாற்றத்தை உங்களுடன் விவாதிக்க வேண்டும்." },
          },
        },
        {
          id: "cond_dialysis",
          keyword: { en: "Requirement for Dialysis (Haemodialysis / CRRT)", ta: "டயாலிசிஸ் தேவை (ஹீமோடயாலிசிஸ் / CRRT)" },
          severity: {
            mild:     { en: "Your relative needs dialysis to help the kidneys do their job. This involves a machine that filters the blood, removes waste products and balances fluid. Dialysis is a supportive measure while we work to treat the underlying cause and allow the kidneys to recover.", ta: "உங்கள் உறவினருக்கு சிறுநீரகங்கள் தங்கள் வேலையை செய்ய உதவ டயாலிசிஸ் தேவைப்படுகிறது. இரத்தத்தை வடிகட்டி, கழிவுப் பொருட்களை நீக்கி, திரவத்தை சமன்படுத்தும் ஒரு இயந்திரம் இதில் ஈடுபட்டுள்ளது. அடிப்படை காரணத்திற்கு சிகிச்சை அளித்து சிறுநீரகங்கள் குணமடைய அனுமதிக்கும்போது டயாலிசிஸ் ஒரு ஆதரவு நடவடிக்கையாகும்." },
            moderate: { en: "Your relative is undergoing dialysis regularly because the kidneys are unable to manage on their own. This is currently being done at the bedside through a continuous slow process to gently clear waste products and excess fluid from the body.", ta: "சிறுநீரகங்கள் தனியாக சமாளிக்க இயலாததால் உங்கள் உறவினர் தவறாமல் டயாலிசிஸ் செய்கிறார். இது தற்போது உடலிலிருந்து கழிவுப் பொருட்கள் மற்றும் அதிகப்படியான திரவத்தை மெதுவாக அகற்ற படுக்கையருகில் தொடர்ச்சியான மெதுவான செயல்முறை மூலம் செய்யப்படுகிறது." },
            severe:   { en: "Your relative requires intensive continuous dialysis running around the clock because their kidneys have completely stopped. The body is accumulating dangerous levels of waste and fluid that only dialysis can manage at this stage.", ta: "சிறுநீரகங்கள் முழுமையாக நிறுத்திவிட்டதால் உங்கள் உறவினருக்கு சுற்றி சுற்றி 24 மணி நேரமும் இயங்கும் தீவிர தொடர்ச்சியான டயாலிசிஸ் தேவைப்படுகிறது. இந்த கட்டத்தில் டயாலிசிஸ் மட்டுமே நிர்வகிக்க முடியும் என்ற அளவில் உடல் ஆபத்தான கழிவு மற்றும் திரவ அளவுகளை குவிக்கிறது." },
            critical: { en: "Even with continuous dialysis, we are struggling to maintain the body's chemical balance. The kidneys appear to have suffered irreversible damage at this stage.", ta: "தொடர்ச்சியான டயாலிசிஸ் இருந்தாலும், உடலின் இரசாயன சமநிலையை பராமரிக்க நாங்கள் சிரமப்படுகிறோம். இந்த கட்டத்தில் சிறுநீரகங்கள் மீளமுடியாத சேதத்திற்கு ஆளாகியிருக்கின்றன என்று தோன்றுகிறது." },
          },
          trajectory: {
            improving:  { en: "The urine output is gradually returning and we are cautiously beginning to reduce the dialysis sessions, which is a hopeful sign of kidney recovery.", ta: "சிறுநீர் வெளியீடு படிப்படியாக திரும்புகிறது, டயாலிசிஸ் அமர்வுகளை எச்சரிக்கையுடன் குறைக்கத் தொடங்குகிறோம், இது சிறுநீரக குணமடைவின் நம்பிக்கையான அறிகுறி." },
            status_quo: { en: "Dialysis is maintaining the body's balance but there is no sign of the kidneys recovering their own function yet.", ta: "டயாலிசிஸ் உடலின் சமநிலையை பராமரிக்கிறது, ஆனால் சிறுநீரகங்கள் சொந்த செயல்பாட்டை மீட்டெடுக்கும் அறிகுறி இன்னும் இல்லை." },
            worsening:  { en: "The body is producing more waste than dialysis can clear, and chemical imbalances are worsening. We are adjusting the dialysis settings.", ta: "டயாலிசிஸ் அகற்றுவதை விட உடல் அதிக கழிவை உற்பத்தி செய்கிறது, இரசாயன ஏற்றத்தாழ்வுகள் மோசமடைகின்றன. டயாலிசிஸ் அமைப்புகளை சரிசெய்கிறோம்." },
            failing:    { en: "Despite maximum dialysis, we are unable to maintain a safe internal environment. This suggests the overall body systems are in failure beyond just the kidneys.", ta: "அதிகபட்ச டயாலிசிஸ் இருந்தாலும், பாதுகாப்பான உள் சூழலை பராமரிக்க முடியவில்லை. இது சிறுநீரகங்களை தாண்டி ஒட்டுமொத்த உடல் அமைப்புகளும் செயலிழக்கின்றன என்று சுட்டிக்காட்டுகிறது." },
          },
        },
      ],
    },
    {
      id: "mod_neuro", order: 4,
      label: { en: "Neurological System / Encephalopathy", ta: "நரம்பியல் மண்டலம் / மூளை பாதிப்பு" },
      conditions: [
        {
          id: "cond_enceph",
          keyword: { en: "Encephalopathy – Acute Brain Dysfunction", ta: "என்செஃபலோபதி – கடுமையான மூளை செயலிழப்பு" },
          severity: {
            mild:     { en: "Your relative is showing signs of mild confusion, disorientation, or reduced attention. This brain dysfunction is related to their underlying illness and is not due to a stroke or direct brain damage. Treating the primary illness usually helps this to resolve.", ta: "உங்கள் உறவினர் லேசான குழப்பம், திசை தெரியாமை அல்லது குறைந்த கவனத்தின் அறிகுறிகளை காட்டுகிறார். இந்த மூளை செயலிழப்பு அடிப்படை நோயுடன் தொடர்புடையது, பக்கவாதம் அல்லது நேரடி மூளை சேதம் காரணமல்ல. முதன்மை நோய்க்கு சிகிச்சை பொதுவாக இதை தீர்க்க உதவுகிறது." },
            moderate: { en: "Your relative is significantly confused and is unable to follow conversations or recognise family members clearly at times. This level of brain dysfunction is a result of the serious illness affecting the brain indirectly through toxins, low oxygen, or metabolic disturbance. This can be distressing to witness but may improve as the underlying illness is treated.", ta: "உங்கள் உறவினர் கணிசமாக குழம்பியுள்ளார், உரையாடல்களை பின்தொடர முடியவில்லை அல்லது சில நேரங்களில் குடும்பத்தினரை தெளிவாக அடையாளம் காண முடியவில்லை. இந்த அளவிலான மூளை செயலிழப்பு நுண்ணுயிர்கள், குறைந்த ஆக்சிஜன் அல்லது வளர்சிதை மாற்ற தொந்தரவு மூலம் மறைமுகமாக மூளையை பாதிக்கும் தீவிர நோயின் விளைவாகும். இதை காண்பது கவலையளிக்கலாம், ஆனால் அடிப்படை நோய் சிகிச்சை செய்யப்படும்போது மேம்படலாம்." },
            severe:   { en: "Your relative is deeply confused, agitated, or largely unresponsive to the environment. The brain is profoundly affected by the illness. This is a serious complication and while we are treating the cause, recovery of brain function can be slow and in some cases may be incomplete.", ta: "உங்கள் உறவினர் ஆழமாக குழம்பியுள்ளார், கிளர்ச்சியாக உள்ளார், அல்லது சூழலுக்கு பெரும்பாலும் பதிலளிக்கவில்லை. மூளை நோயால் ஆழமாக பாதிக்கப்பட்டுள்ளது. இது ஒரு தீவிர சிக்கல், காரணத்திற்கு சிகிச்சை செய்யும்போது மூளை செயல்பாடு குணமடைவது மெதுவாக இருக்கலாம், சில சமயம் முழுமையற்றதாக இருக்கலாம்." },
            critical: { en: "Your relative is deeply unconscious and showing minimal or no response to any stimulation. The brain is critically affected and we are investigating the causes urgently. At this level of brain dysfunction, the risk to life is very high.", ta: "உங்கள் உறவினர் ஆழமான மயக்கத்தில் உள்ளார், எந்த தூண்டுதலுக்கும் குறைந்தபட்ச அல்லது எந்த பதிலும் இல்லை. மூளை தீவிரமாக பாதிக்கப்பட்டுள்ளது, காரணங்களை அவசரமாக விசாரிக்கிறோம். இந்த அளவிலான மூளை செயலிழப்பில் உயிருக்கான ஆபத்து மிகவும் அதிகமாக உள்ளது." },
          },
          trajectory: {
            improving:  { en: "Your relative appears more alert today and is beginning to recognise faces and respond to simple questions. The brain function is showing early signs of recovery.", ta: "உங்கள் உறவினர் இன்று அதிக விழிப்புடன் தோன்றுகிறார், முகங்களை அடையாளம் காணவும் எளிய கேள்விகளுக்கு பதிலளிக்கவும் தொடங்கிறார். மூளை செயல்பாடு குணமடைவதற்கான ஆரம்ப அறிகுறிகளை காட்டுகிறது." },
            status_quo: { en: "The level of brain function remains the same as yesterday. The confusion has not worsened, but there is no significant improvement yet.", ta: "மூளை செயல்பாட்டின் அளவு நேற்றுடன் ஒப்பிடும்போது அதே அளவில் உள்ளது. குழப்பம் மோசமடையவில்லை, ஆனால் இன்னும் குறிப்பிடத்தக்க முன்னேற்றம் இல்லை." },
            worsening:  { en: "Your relative's level of consciousness has declined further today. They are harder to rouse and less responsive than yesterday. We are investigating the reason for this change urgently.", ta: "உங்கள் உறவினரின் நனவு அளவு இன்று மேலும் குறைந்துள்ளது. நேற்றை விட தூண்டுவது கஷ்டமாகவும் பதிலளிப்பு குறைவாகவும் உள்ளது. இந்த மாற்றத்திற்கான காரணத்தை அவசரமாக விசாரிக்கிறோம்." },
            failing:    { en: "Your relative has lost all meaningful response to the surrounding environment. The brain function is critically impaired. We are working to understand whether this is reversible and will speak with you honestly about our findings.", ta: "உங்கள் உறவினர் சுற்றுப்புற சூழலுக்கு அனைத்து அர்த்தமுள்ள பதிலையும் இழந்துள்ளார். மூளை செயல்பாடு தீவிரமாக பாதிக்கப்பட்டுள்ளது. இது மீட்கக்கூடியதா என்பதை புரிந்துகொள்ள முயற்சிக்கிறோம், எங்கள் கண்டுபிடிப்புகளைப் பற்றி உங்களிடம் நேர்மையாக பேசுவோம்." },
          },
        },
        {
          id: "cond_stroke",
          keyword: { en: "Stroke / Acute Brain Injury", ta: "பக்கவாதம் / கடுமையான மூளை காயம்" },
          severity: {
            mild:     { en: "Your relative has had a stroke, meaning part of the brain has been affected by either a blocked blood vessel or bleeding in the brain. The affected areas are controlling certain functions. We have started appropriate treatment and are monitoring their brain function closely.", ta: "உங்கள் உறவினருக்கு பக்கவாதம் வந்துள்ளது, அதாவது மூளையின் ஒரு பகுதி தடைப்பட்ட இரத்த நாளம் அல்லது மூளையில் இரத்தக்கசிவு காரணமாக பாதிக்கப்பட்டுள்ளது. பாதிக்கப்பட்ட பகுதிகள் சில செயல்பாடுகளை கட்டுப்படுத்துகின்றன. உரிய சிகிச்சையை தொடங்கி மூளை செயல்பாட்டை நெருங்கிய கண்காணிப்பில் கவனிக்கிறோம்." },
            moderate: { en: "Your relative has suffered a significant stroke affecting important parts of the brain. This has caused noticeable weakness, speech difficulties, or loss of function on one side of the body. Recovery is possible but may take several months and may require extensive rehabilitation.", ta: "உங்கள் உறவினர் மூளையின் முக்கியமான பகுதிகளை பாதிக்கும் குறிப்பிடத்தக்க பக்கவாதத்தால் பாதிக்கப்பட்டுள்ளார். இது உடலின் ஒரு பக்கத்தில் கணிசமான பலவீனம், பேச்சு கஷ்டங்கள் அல்லது செயல்பாட்டு இழப்பை ஏற்படுத்தியுள்ளது. குணமடைவு சாத்தியம், ஆனால் பல மாதங்கள் ஆகலாம், விரிவான மறுவாழ்வு தேவைப்படலாம்." },
            severe:   { en: "Your relative has suffered a severe stroke with extensive brain damage. The areas affected are critical for basic functions such as breathing, swallowing, and consciousness. We are providing supportive care and will have a detailed discussion about the realistic outlook for recovery.", ta: "உங்கள் உறவினர் விரிவான மூளை சேதத்துடன் கடுமையான பக்கவாதத்தால் பாதிக்கப்பட்டுள்ளார். பாதிக்கப்பட்ட பகுதிகள் சுவாசம், விழுங்குவது மற்றும் நனவு போன்ற அடிப்படை செயல்பாடுகளுக்கு முக்கியமானவை. ஆதரவு சிகிச்சை வழங்கி குணமடைவதற்கான யதார்த்தமான கண்ணோட்டத்தைப் பற்றி விரிவான விவாதம் நடத்துவோம்." },
            critical: { en: "The stroke has caused catastrophic brain damage. The brain's ability to maintain basic functions is severely compromised. We are performing tests to fully assess brain function and will discuss findings with you as soon as they are available.", ta: "பக்கவாதம் பேரழிவு மூளை சேதத்தை ஏற்படுத்தியுள்ளது. அடிப்படை செயல்பாடுகளை பராமரிக்கும் மூளையின் திறன் தீவிரமாக பாதிக்கப்பட்டுள்ளது. மூளை செயல்பாட்டை முழுமையாக மதிப்பிட சோதனைகள் செய்கிறோம், கிடைத்தவுடன் முடிவுகளை உங்களுடன் விவாதிப்போம்." },
          },
          trajectory: {
            improving:  { en: "There are encouraging signs that the brain is beginning to recover. Your relative is more alert and showing some return of function since the stroke.", ta: "மூளை குணமடையத் தொடங்குகிறது என்ற ஊக்கமளிக்கும் அறிகுறிகள் உள்ளன. பக்கவாதத்திலிருந்து உங்கள் உறவினர் அதிக விழிப்புடன் சில செயல்பாடுகளை மீட்டெடுப்பதை காட்டுகிறார்." },
            status_quo: { en: "The brain function has remained stable without further deterioration. The stroke damage is fixed at this point and recovery, if any, will depend on the brain's ability to adapt over time.", ta: "மூளை செயல்பாடு மேலும் சரிவின்றி நிலையாக உள்ளது. பக்கவாத சேதம் இப்போது நிலையானது, குணமடைவு, ஏதேனும் இருந்தால், காலப்போக்கில் மூளையின் தகவமைப்பு திறனை பொறுத்திருக்கும்." },
            worsening:  { en: "The brain function appears to be declining, which may indicate swelling of the brain after the stroke or extension of the bleed. Urgent scans are being arranged to investigate.", ta: "மூளை செயல்பாடு குறைகிறது என்று தோன்றுகிறது, இது பக்கவாதத்திற்கு பிறகு மூளை வீக்கம் அல்லது இரத்தக்கசிவு விரிவடைவதை குறிக்கலாம். விசாரிக்க அவசர ஸ்கேன்கள் ஏற்பாடு செய்யப்படுகின்றன." },
            failing:    { en: "The brain has sustained damage beyond what it can recover from. We need to have an important conversation with you about brain death assessment and what this means for the next steps in care.", ta: "மூளை குணமடைய முடியாத அளவு சேதமடைந்துள்ளது. மூளை மரண மதிப்பீடு மற்றும் சிகிச்சையின் அடுத்த படிகளுக்கு இதன் அர்த்தம் என்ன என்பதைப் பற்றி உங்களுடன் முக்கியமான உரையாடல் நடத்த வேண்டும்." },
          },
        },
      ],
    },
    {
      id: "mod_hepatic", order: 5,
      label: { en: "Hepatic (Liver) System", ta: "கல்லீரல் மண்டலம்" },
      conditions: [
        {
          id: "cond_liver",
          keyword: { en: "Acute Liver Failure", ta: "கடுமையான கல்லீரல் செயலிழப்பு" },
          severity: {
            mild:     { en: "Your relative's liver is not functioning as well as it should. Blood tests are showing elevated liver enzymes, which means liver cells are under stress. We are investigating the cause and providing supportive treatment to allow the liver to recover.", ta: "உங்கள் உறவினரின் கல்லீரல் சரியாக செயல்படவில்லை. இரத்த பரிசோதனைகள் உயர்ந்த கல்லீரல் என்சைம்களை காட்டுகின்றன, அதாவது கல்லீரல் செல்கள் அழுத்தத்தில் உள்ளன. காரணத்தை விசாரித்து கல்லீரல் குணமடைய ஆதரவு சிகிச்சை வழங்குகிறோம்." },
            moderate: { en: "Your relative's liver has developed significant failure. It is struggling to perform its vital jobs, which include clearing toxins from the blood, producing clotting factors, and maintaining blood sugar. They are developing jaundice (yellowing of skin and eyes) and we are managing each complication as it arises.", ta: "உங்கள் உறவினரின் கல்லீரல் கணிசமான செயலிழப்பை வளர்த்துள்ளது. இரத்தத்திலிருந்து நச்சுகளை அகற்றுவது, உறைதல் காரணிகளை உற்பத்தி செய்வது மற்றும் இரத்த சர்க்கரையை பராமரிப்பது உள்பட அதன் முக்கியமான வேலைகளை செய்வதில் சிரமப்படுகிறது. மஞ்சள் காமாலை (தோல் மற்றும் கண்கள் மஞ்சளாவது) வருகிறது, ஒவ்வொரு சிக்கலும் வரும்போது நிர்வகிக்கிறோம்." },
            severe:   { en: "Your relative's liver has severely failed and is no longer able to carry out its essential functions. Toxins are accumulating in the blood causing brain dysfunction. Blood clotting is dangerously impaired, causing a risk of serious bleeding. This is a very serious condition and we are managing every complication.", ta: "உங்கள் உறவினரின் கல்லீரல் கடுமையாக செயலிழந்துள்ளது, அத்தியாவசிய செயல்பாடுகளை இனி மேற்கொள்ள இயலவில்லை. நச்சுகள் இரத்தத்தில் குவிந்து மூளை செயலிழப்பை ஏற்படுத்துகின்றன. இரத்த உறைதல் ஆபத்தான அளவில் பாதிக்கப்பட்டுள்ளது, தீவிர இரத்தப்போக்கு அபாயம் உள்ளது. இது மிகவும் தீவிரமான நிலை, ஒவ்வொரு சிக்கலையும் நிர்வகிக்கிறோம்." },
            critical: { en: "The liver has completely failed. All of its vital functions have collapsed. This is a life-threatening emergency. A liver transplant may be the only option for survival, and we are urgently assessing whether this is possible and appropriate.", ta: "கல்லீரல் முழுமையாக செயலிழந்துள்ளது. அதன் அனைத்து முக்கியமான செயல்பாடுகளும் சரிந்துவிட்டன. இது உயிருக்கு அபாயகரமான அவசரநிலை. கல்லீரல் மாற்று அறுவை சிகிச்சை மட்டுமே உயிர்பிழைப்பதற்கான வழியாக இருக்கலாம், இது சாத்தியமா மற்றும் பொருத்தமானதா என்று அவசரமாக மதிப்பீடு செய்கிறோம்." },
          },
          trajectory: {
            improving:  { en: "The liver blood tests are showing improvement and the signs of liver failure are beginning to reduce. This is an encouraging trend.", ta: "கல்லீரல் இரத்த பரிசோதனைகள் முன்னேற்றத்தை காட்டுகின்றன, கல்லீரல் செயலிழப்பின் அறிகுறிகள் குறையத் தொடங்குகின்றன. இது ஊக்கமளிக்கும் போக்கு." },
            status_quo: { en: "Liver function has remained the same today. We are continuing supportive management while monitoring closely for any change.", ta: "கல்லீரல் செயல்பாடு இன்று அதே அளவில் உள்ளது. எந்த மாற்றமும் நெருங்கிய கண்காணிப்பில் கவனிக்கும்போது ஆதரவு மேலாண்மையை தொடர்கிறோம்." },
            worsening:  { en: "The liver failure is progressing despite our treatment. The jaundice is deepening and the brain function is being increasingly affected. We are reassessing all possible treatment options.", ta: "சிகிச்சை இருந்தாலும் கல்லீரல் செயலிழப்பு முன்னேறுகிறது. மஞ்சள் காமாலை ஆழமாகிறது, மூளை செயல்பாடு அதிகமாக பாதிக்கப்படுகிறது. சாத்தியமான அனைத்து சிகிச்சை வாய்ப்புகளையும் மறுமதிப்பீடு செய்கிறோம்." },
            failing:    { en: "The liver has progressed to end-stage failure and is no longer responding to any treatment. We need to have an urgent, compassionate conversation about the goals of care.", ta: "கல்லீரல் இறுதி கட்ட செயலிழப்பிற்கு முன்னேறியுள்ளது, எந்த சிகிச்சைக்கும் இனி பதிலளிக்கவில்லை. சிகிச்சையின் நோக்கங்களைப் பற்றி அவசரமான, அனுதாபமான உரையாடல் நடத்த வேண்டும்." },
          },
        },
      ],
    },
    {
      id: "mod_haem", order: 6,
      label: { en: "Haematology / Coagulopathy (Blood Clotting)", ta: "இரத்த அணு மண்டலம் / இரத்த உறைதல் பிரச்சனை" },
      conditions: [
        {
          id: "cond_coag",
          keyword: { en: "Coagulopathy – Blood Clotting Failure", ta: "கோகுலோபதி – இரத்த உறைதல் செயலிழப்பு" },
          severity: {
            mild:     { en: "Your relative's blood is not clotting as well as it should. This means there is a risk of bleeding from small injuries or procedures. We are monitoring the clotting tests closely and may give blood products to correct this if needed.", ta: "உங்கள் உறவினரின் இரத்தம் சரியாக உறையவில்லை. அதாவது சிறிய காயங்கள் அல்லது செயல்முறைகளிலிருந்து இரத்தப்போக்கு அபாயம் உள்ளது. உறைதல் பரிசோதனைகளை நெருங்கிய கண்காணிப்பில் வைத்து தேவைப்பட்டால் இதை சரிசெய்ய இரத்தப் பொருட்கள் வழங்கலாம்." },
            moderate: { en: "Your relative has a significant clotting disorder, meaning their blood is struggling to stop bleeding when it should. This has been caused by the underlying illness and we are giving them clotting factors and blood products as replacement treatment.", ta: "உங்கள் உறவினருக்கு கணிசமான உறைதல் குறைபாடு உள்ளது, அதாவது இரத்தப்போக்கை நிறுத்த வேண்டியபோது இரத்தம் சிரமப்படுகிறது. இது அடிப்படை நோயால் ஏற்பட்டது, மாற்று சிகிச்சையாக உறைதல் காரணிகள் மற்றும் இரத்தப் பொருட்கள் வழங்குகிறோம்." },
            severe:   { en: "Your relative's blood clotting system has severely failed. They are bleeding from multiple sites and the body is consuming clotting factors faster than we can replace them. This is a life-threatening emergency called DIC (disseminated intravascular coagulation).", ta: "உங்கள் உறவினரின் இரத்த உறைதல் அமைப்பு கடுமையாக செயலிழந்துள்ளது. பல இடங்களிலிருந்து இரத்தப்போக்கு ஏற்படுகிறது, நாங்கள் மாற்றுவதை விட வேகமாக உடல் உறைதல் காரணிகளை உட்கொள்கிறது. இது DIC (பரவலான நுண்குழல் உறைதல்) என்ற உயிருக்கு அபாயகரமான அவசரநிலை." },
            critical: { en: "The clotting failure is now at a catastrophic level and internal bleeding is occurring in multiple organs. Despite blood transfusions and clotting factor replacement, we are struggling to maintain control. This is an extremely dangerous situation.", ta: "உறைதல் செயலிழப்பு தற்போது பேரழிவு அளவில் உள்ளது, பல உறுப்புகளில் உள்ளுறுப்பு இரத்தப்போக்கு ஏற்படுகிறது. இரத்தமாற்றம் மற்றும் உறைதல் காரணி மாற்று இருந்தாலும் கட்டுப்பாட்டை பராமரிக்க சிரமப்படுகிறோம். இது மிகவும் ஆபத்தான நிலை." },
          },
          trajectory: {
            improving:  { en: "The clotting tests are improving and the blood products are working to restore the balance. The bleeding risk is reducing.", ta: "உறைதல் பரிசோதனைகள் மேம்படுகின்றன, இரத்தப் பொருட்கள் சமநிலையை மீட்டெடுக்க வேலை செய்கின்றன. இரத்தப்போக்கு அபாயம் குறைகிறது." },
            status_quo: { en: "The clotting ability is maintained at its current level with ongoing blood product support. No further deterioration, but normalisation has not yet occurred.", ta: "தொடர்ந்து இரத்தப் பொருள் ஆதரவுடன் உறைதல் திறன் தற்போதைய அளவில் பராமரிக்கப்படுகிறது. மேலும் சரிவு இல்லை, ஆனால் இயல்பாக்கம் இன்னும் நிகழவில்லை." },
            worsening:  { en: "The clotting disorder is worsening. More blood products are being used and the tests are showing a declining ability to clot effectively.", ta: "உறைதல் குறைபாடு மோசமடைகிறது. அதிக இரத்தப் பொருட்கள் பயன்படுத்தப்படுகின்றன, திறம்பட உறைவதற்கான குறைந்த திறனை பரிசோதனைகள் காட்டுகின்றன." },
            failing:    { en: "The blood clotting system has completely collapsed and bleeding cannot be controlled. This has become a rapidly life-threatening complication.", ta: "இரத்த உறைதல் அமைப்பு முழுமையாக சரிந்துவிட்டது, இரத்தப்போக்கை கட்டுப்படுத்த முடியவில்லை. இது விரைவாக உயிருக்கு அபாயகரமான சிக்கலாக மாறியுள்ளது." },
          },
        },
      ],
    },
    {
      id: "mod_sepsis", order: 7,
      label: { en: "Sepsis and Infection", ta: "செப்சிஸ் மற்றும் தொற்று" },
      conditions: [
        {
          id: "cond_sepsis",
          keyword: { en: "Sepsis – Life-Threatening Infection Response", ta: "செப்சிஸ் – உயிருக்கு அபாயகரமான தொற்று பதில்" },
          severity: {
            mild:     { en: "Your relative's body is responding to a serious infection. This early stage of sepsis means the infection is causing changes to temperature, heart rate and blood pressure. We have started antibiotics and fluids and are working quickly to find and treat the source of infection.", ta: "உங்கள் உறவினரின் உடல் ஒரு தீவிர தொற்றுக்கு பதிலளிக்கிறது. செப்சிஸின் இந்த ஆரம்ப கட்டம் என்னவெனில் தொற்று வெப்பநிலை, இதய துடிப்பு மற்றும் இரத்த அழுத்தத்தில் மாற்றங்களை ஏற்படுத்துகிறது. நுண்ணுயிர் எதிர்ப்பிகள் மற்றும் திரவங்களை தொடங்கி தொற்றின் மூலத்தை கண்டுபிடித்து சிகிச்சை செய்ய விரைவாக வேலை செய்கிறோம்." },
            moderate: { en: "Your relative has sepsis, which means the infection is causing the body's immune system to overreact and is starting to affect the function of vital organs. They are in the ICU receiving intensive antibiotic treatment and organ support. Sepsis can be life-threatening and requires urgent treatment.", ta: "உங்கள் உறவினருக்கு செப்சிஸ் உள்ளது, அதாவது தொற்று உடலின் நோயெதிர்ப்பு அமைப்பை அதிகமாக பதிலளிக்கச் செய்கிறது, முக்கிய உறுப்புகளின் செயல்பாட்டை பாதிக்கத் தொடங்குகிறது. ICU-வில் தீவிர நுண்ணுயிர் எதிர்ப்பி சிகிச்சை மற்றும் உறுப்பு ஆதரவு பெறுகிறார். செப்சிஸ் உயிருக்கு அபாயகரமாக இருக்கலாம், அவசர சிகிச்சை தேவைப்படுகிறது." },
            severe:   { en: "Your relative is in severe sepsis with multiple organ systems now being affected by the widespread infection response. Their blood pressure, kidneys, liver and lungs are all under significant stress. We are providing maximum intensive care support.", ta: "உங்கள் உறவினர் பரவலான தொற்று பதிலால் பல உறுப்பு அமைப்புகள் பாதிக்கப்பட்டு தீவிரமான செப்சிஸில் உள்ளார். அவரது இரத்த அழுத்தம், சிறுநீரகங்கள், கல்லீரல் மற்றும் நுரையீரல் அனைத்தும் கணிசமான அழுத்தத்தில் உள்ளன. அதிகபட்ச தீவிர சிகிச்சை ஆதரவு வழங்குகிறோம்." },
            critical: { en: "Your relative is in septic shock, which is the most severe stage of sepsis. The infection and the body's response to it have caused a critical collapse of circulation and multiple organ failure. Despite maximum treatment, this remains a life-or-death situation.", ta: "உங்கள் உறவினர் செப்டிக் ஷாக்கில் உள்ளார், இது செப்சிஸின் மிகவும் தீவிரமான கட்டம். தொற்று மற்றும் அதற்கு உடலின் பதில் சுழற்சியின் தீவிர சரிவு மற்றும் பல உறுப்பு செயலிழப்பை ஏற்படுத்தியுள்ளது. அதிகபட்ச சிகிச்சை இருந்தாலும் இது உயிர் அல்லது இறப்பு நிலையாக உள்ளது." },
          },
          trajectory: {
            improving:  { en: "The infection markers in the blood are reducing and the organs are showing signs of responding to treatment. This is a hopeful trend.", ta: "இரத்தத்தில் தொற்று குறிப்பான்கள் குறைகின்றன, உறுப்புகள் சிகிச்சைக்கு பதிலளிப்பதற்கான அறிகுறிகளை காட்டுகின்றன. இது நம்பிக்கையான போக்கு." },
            status_quo: { en: "The infection markers remain elevated but are not climbing further. The organs are holding steady on current treatment.", ta: "தொற்று குறிப்பான்கள் உயர்வாகவே உள்ளன, ஆனால் மேலும் உயரவில்லை. உறுப்புகள் தற்போதைய சிகிச்சையில் நிலையாக உள்ளன." },
            worsening:  { en: "Despite antibiotics, the signs of infection are worsening and spreading to more organ systems. We are urgently reviewing the antibiotic choices and considering additional interventions.", ta: "நுண்ணுயிர் எதிர்ப்பிகள் இருந்தாலும், தொற்றின் அறிகுறிகள் மோசமடைந்து அதிக உறுப்பு அமைப்புகளுக்கு பரவுகின்றன. நுண்ணுயிர் எதிர்ப்பி தேர்வுகளை அவசரமாக ஆய்வு செய்து கூடுதல் தலையீடுகளை பரிசீலிக்கிறோம்." },
            failing:    { en: "The infection is overwhelming the body's ability to respond to any treatment. The organs are failing at a rate that cannot be reversed. We must speak honestly with you about what this means for your relative.", ta: "தொற்று எந்த சிகிச்சைக்கும் பதிலளிக்கும் உடலின் திறனை முழுவதுமாக பாதிக்கிறது. மீட்க முடியாத வேகத்தில் உறுப்புகள் செயலிழக்கின்றன. உங்கள் உறவினருக்கு இதன் அர்த்தம் என்ன என்பதை உங்களுடன் நேர்மையாக பேச வேண்டும்." },
          },
        },
      ],
    },
    {
      id: "mod_metabolic", order: 8,
      label: { en: "Metabolic / Endocrine Disturbances", ta: "வளர்சிதை மாற்றம் / நாளமில்லா சுரப்பி பிரச்சனைகள்" },
      conditions: [
        {
          id: "cond_dka",
          keyword: { en: "Diabetic Ketoacidosis (DKA) / Hyperosmolar State", ta: "நீரிழிவு கீட்டோஅமிலமயம் (DKA)" },
          severity: {
            mild:     { en: "Your relative has developed a dangerous complication of diabetes where the blood sugar has risen to a very high level, causing chemical imbalances in the body. We are treating this with insulin, fluids, and careful monitoring.", ta: "உங்கள் உறவினருக்கு நீரிழிவு நோயின் ஆபத்தான சிக்கல் ஏற்பட்டுள்ளது, இரத்த சர்க்கரை மிக உயர்ந்த அளவிற்கு உயர்ந்து உடலில் இரசாயன ஏற்றத்தாழ்வுகளை ஏற்படுத்துகிறது. இன்சுலின், திரவங்கள் மற்றும் கவனமான கண்காணிப்புடன் சிகிச்சை செய்கிறோம்." },
            moderate: { en: "Your relative is severely dehydrated and their blood chemistry is significantly disturbed due to uncontrolled blood sugar. They need intensive monitoring and treatment in the ICU to correct these imbalances safely.", ta: "உங்கள் உறவினர் கடுமையாக நீர்ச்சத்து இழந்துள்ளார், கட்டுப்பாடற்ற இரத்த சர்க்கரை காரணமாக இரத்த வேதியியல் கணிசமாக தொந்தரவடைந்துள்ளது. இந்த ஏற்றத்தாழ்வுகளை பாதுகாப்பாக சரிசெய்ய ICU-வில் தீவிர கண்காணிப்பு மற்றும் சிகிச்சை தேவைப்படுகிறது." },
            severe:   { en: "The metabolic disturbance is so severe that it is affecting the brain and other vital organs. Blood sugar levels are extremely high and the blood has become very acidic. Without urgent treatment, this can cause loss of consciousness and be fatal.", ta: "வளர்சிதை மாற்ற தொந்தரவு மிகவும் தீவிரமாக மூளை மற்றும் பிற முக்கிய உறுப்புகளை பாதிக்கிறது. இரத்த சர்க்கரை அளவுகள் மிகவும் அதிகமாக உள்ளன, இரத்தம் மிகவும் அமிலமாக மாறியுள்ளது. அவசர சிகிச்சை இல்லாமல் நனவு இழப்பு ஏற்படலாம், உயிருக்கு அபாயமாகலாம்." },
            critical: { en: "The metabolic crisis is at a life-threatening level despite initial treatment. The combination of extreme blood sugar, severe acid-base disturbance and dehydration is causing critical organ dysfunction.", ta: "ஆரம்ப சிகிச்சை இருந்தாலும் வளர்சிதை மாற்ற நெருக்கடி உயிருக்கு அபாயகரமான அளவில் உள்ளது. தீவிர இரத்த சர்க்கரை, கடுமையான அமில-காரத் தொந்தரவு மற்றும் நீர்ச்சத்து இழப்பின் கலவை தீவிர உறுப்பு செயலிழப்பை ஏற்படுத்துகிறது." },
          },
          trajectory: {
            improving:  { en: "The blood sugar and acid-base balance are correcting with treatment. Your relative is becoming more alert and stable.", ta: "இரத்த சர்க்கரை மற்றும் அமில-காரத் சமநிலை சிகிச்சையால் சரியாகிறது. உங்கள் உறவினர் அதிக விழிப்புடனும் நிலையாகவும் ஆகிறார்." },
            status_quo: { en: "The metabolic parameters are stable on current treatment, though not yet normalised. We continue careful monitoring.", ta: "வளர்சிதை மாற்ற அளவுருக்கள் தற்போதைய சிகிச்சையில் நிலையாக உள்ளன, இன்னும் இயல்பாக்கப்படவில்லை. கவனமான கண்காணிப்பை தொடர்கிறோம்." },
            worsening:  { en: "Despite treatment, the blood sugar remains uncontrolled and the metabolic disturbance is worsening. We are adjusting insulin and fluid treatment.", ta: "சிகிச்சை இருந்தாலும் இரத்த சர்க்கரை கட்டுப்படுத்தப்படாமல் உள்ளது, வளர்சிதை மாற்ற தொந்தரவு மோசமடைகிறது. இன்சுலின் மற்றும் திரவ சிகிச்சையை சரிசெய்கிறோம்." },
            failing:    { en: "The metabolic imbalance is not responding to maximum treatment and is causing progressive organ damage. We must now discuss what is achievable and what the priorities of care should be.", ta: "வளர்சிதை மாற்ற ஏற்றத்தாழ்வு அதிகபட்ச சிகிச்சைக்கு பதிலளிக்கவில்லை, முற்போக்கான உறுப்பு சேதத்தை ஏற்படுத்துகிறது. என்ன அடையக்கூடியது மற்றும் சிகிச்சையின் முன்னுரிமைகள் என்னவாக இருக்க வேண்டும் என்பதை இப்போது விவாதிக்க வேண்டும்." },
          },
        },
      ],
    },
    {
      id: "mod_airway", order: 9,
      label: { en: "Airway Issues", ta: "காற்றுப்பாதை பிரச்சனைகள்" },
      conditions: [
        {
          id: "cond_airway",
          keyword: { en: "Airway Compromise – Inability to Protect the Airway", ta: "காற்றுப்பாதை சமரசம் – காற்றுப்பாதை பாதுகாக்க இயலாமை" },
          severity: {
            mild:     { en: "Your relative is having some difficulty keeping their airway open and clear. This may be due to reduced consciousness, secretions, or swelling. We are taking measures to keep the airway safe and are monitoring closely.", ta: "உங்கள் உறவினர் காற்றுப்பாதையை திறந்தும் தெளிவாகவும் வைத்திருக்க சிறிது கஷ்டப்படுகிறார். இது குறைந்த நனவு, சுரப்புகள் அல்லது வீக்கம் காரணமாக இருக்கலாம். காற்றுப்பாதையை பாதுகாப்பாக வைக்க நடவடிக்கைகள் எடுக்கிறோம், நெருங்கிய கண்காணிப்பில் வைக்கிறோம்." },
            moderate: { en: "Your relative's ability to maintain a safe airway is significantly compromised. They may be at risk of choking on their own secretions or the tongue blocking the throat. A breathing tube or airway device has been placed to keep the airway safe.", ta: "உங்கள் உறவினரின் பாதுகாப்பான காற்றுப்பாதையை பராமரிக்கும் திறன் கணிசமாக பாதிக்கப்பட்டுள்ளது. சொந்த சுரப்புகளில் மூச்சுத் திணறல் அல்லது தொண்டையை நாக்கு அடைக்கும் அபாயம் இருக்கலாம். காற்றுப்பாதையை பாதுகாப்பாக வைக்க சுவாசக் குழாய் அல்லது காற்றுப்பாதை சாதனம் வைக்கப்பட்டுள்ளது." },
            severe:   { en: "Your relative's airway has become severely compromised, creating an immediate risk to life. Emergency measures were required to secure the airway and maintain breathing. We have placed a breathing tube and they are now on a ventilator.", ta: "உங்கள் உறவினரின் காற்றுப்பாதை கடுமையாக பாதிக்கப்பட்டு உயிருக்கு உடனடி ஆபத்தை உருவாக்கியது. காற்றுப்பாதையை பாதுகாக்கவும் சுவாசத்தை பராமரிக்கவும் அவசர நடவடிக்கைகள் தேவைப்பட்டன. சுவாசக் குழாய் போட்டுள்ளோம், இப்போது வென்டிலேட்டரில் உள்ளார்." },
            critical: { en: "Securing the airway was extremely difficult due to swelling, bleeding or anatomical reasons. Multiple attempts were required and there was a critical period of low oxygen during this process. We secured the airway and the team worked hard to prevent harm.", ta: "வீக்கம், இரத்தப்போக்கு அல்லது உடற்கூறியல் காரணங்களால் காற்றுப்பாதையை பாதுகாப்பது மிகவும் கஷ்டமாக இருந்தது. பல முயற்சிகள் தேவைப்பட்டன, இந்த செயல்முறையில் குறைந்த ஆக்சிஜனின் தீவிர காலம் இருந்தது. காற்றுப்பாதையை பாதுகாத்தோம், குழு தீங்கு தடுக்க கடுமையாக உழைத்தது." },
          },
          trajectory: {
            improving:  { en: "The airway is now secured and stable. We are working toward removing the breathing tube when the condition allows.", ta: "காற்றுப்பாதை இப்போது பாதுகாக்கப்பட்டு நிலையாக உள்ளது. நிலைமை அனுமதிக்கும்போது சுவாசக் குழாயை அகற்றுவதை நோக்கி வேலை செய்கிறோம்." },
            status_quo: { en: "The airway remains secured with a breathing tube. There is no immediate change and we continue supportive care.", ta: "காற்றுப்பாதை சுவாசக் குழாயால் பாதுகாக்கப்பட்டுள்ளது. உடனடி மாற்றம் இல்லை, ஆதரவு சிகிச்சையை தொடர்கிறோம்." },
            worsening:  { en: "The airway is becoming more difficult to manage despite the breathing tube in place. Swelling or secretions are making ventilation harder.", ta: "சுவாசக் குழாய் இருந்தாலும் காற்றுப்பாதையை நிர்வகிப்பது மேலும் கஷ்டமாகிறது. வீக்கம் அல்லது சுரப்புகள் வென்டிலேஷனை கடினமாக்குகின்றன." },
            failing:    { en: "The airway cannot be maintained safely even with the breathing tube and ventilator. The swelling or damage is too extensive for conventional measures to manage.", ta: "சுவாசக் குழாய் மற்றும் வென்டிலேட்டர் இருந்தாலும் காற்றுப்பாதையை பாதுகாப்பாக பராமரிக்க முடியவில்லை. வழக்கமான நடவடிக்கைகளால் நிர்வகிக்க வீக்கம் அல்லது சேதம் மிகவும் விரிவானது." },
          },
        },
      ],
    },
    {
      id: "mod_trach", order: 10,
      label: { en: "Need for Tracheostomy", ta: "தொண்டை துளை (Tracheostomy) தேவை" },
      conditions: [
        {
          id: "cond_trach",
          keyword: { en: "Tracheostomy – Surgical Airway", ta: "தொண்டை துளை – அறுவை சிகிச்சை காற்றுப்பாதை" },
          severity: {
            mild:     { en: "We are recommending a tracheostomy for your relative. This is a small surgical opening made in the neck to create a direct airway to the windpipe. It helps make breathing more comfortable and allows the mouth to heal from the prolonged breathing tube.", ta: "உங்கள் உறவினருக்கு தொண்டை துளை (tracheostomy) பரிந்துரைக்கிறோம். இது சுவாசக் குழாயில் நேரடி காற்றுப்பாதை உருவாக்க கழுத்தில் செய்யப்படும் சிறிய அறுவை சிகிச்சை திறப்பு. சுவாசிப்பதை மிகவும் வசதியாக்கவும் நீண்ட சுவாசக் குழாயிலிருந்து வாய் குணமடையவும் இது உதவுகிறது." },
            moderate: { en: "Your relative requires a tracheostomy because they have been on a breathing machine for an extended period and the weaning process is taking longer than expected. A tracheostomy is safer and more comfortable for prolonged ventilation and makes physiotherapy and rehabilitation easier.", ta: "உங்கள் உறவினர் நீண்ட காலமாக சுவாச இயந்திரத்தில் இருப்பதால் மற்றும் வீனிங் செயல்முறை எதிர்பார்த்ததை விட அதிக நேரம் எடுத்துக்கொள்வதால் தொண்டை துளை தேவைப்படுகிறது. நீண்ட வென்டிலேஷனுக்கு தொண்டை துளை மிகவும் பாதுகாப்பானதும் வசதியானதும், உடல் சிகிச்சை மற்றும் மறுவாழ்வை எளிதாக்குகிறது." },
            severe:   { en: "Your relative needs a tracheostomy urgently because their airway cannot be safely maintained in any other way. The procedure will be performed at the bedside or in the operating theatre by an experienced team.", ta: "உங்கள் உறவினரின் காற்றுப்பாதையை வேறு எந்த வழியிலும் பாதுகாப்பாக பராமரிக்க முடியாததால் தொண்டை துளை அவசரமாக தேவைப்படுகிறது. அனுபவமிக்க குழுவால் படுக்கையருகில் அல்லது அறுவை சிகிச்சை அறையில் செயல்முறை செய்யப்படும்." },
            critical: { en: "An emergency tracheostomy was required to save your relative's life when conventional airway management failed. This was a life-saving intervention performed under very difficult circumstances.", ta: "வழக்கமான காற்றுப்பாதை மேலாண்மை தோல்வியடைந்தபோது உங்கள் உறவினரின் உயிரை காப்பாற்ற அவசர தொண்டை துளை தேவைப்பட்டது. மிகவும் கடினமான சூழ்நிலையில் செய்யப்பட்ட இது உயிர் காக்கும் தலையீடு." },
          },
          trajectory: {
            improving:  { en: "The tracheostomy site is healing well and your relative is tolerating it comfortably. We are working on reducing the breathing support gradually.", ta: "தொண்டை துளை இடம் நன்றாக குணமடைகிறது, உங்கள் உறவினர் அதை வசதியாக சகித்துக்கொள்கிறார். சுவாச ஆதரவை படிப்படியாக குறைக்க வேலை செய்கிறோம்." },
            status_quo: { en: "The tracheostomy is functioning well and keeping the airway clear. The breathing support needs remain the same at this stage.", ta: "தொண்டை துளை சரியாக செயல்படுகிறது, காற்றுப்பாதையை தெளிவாக வைக்கிறது. இந்த கட்டத்தில் சுவாச ஆதரவு தேவைகள் அதே அளவில் உள்ளன." },
            worsening:  { en: "There is a complication at the tracheostomy site such as infection, bleeding or blockage, which requires treatment.", ta: "தொண்டை துளை இடத்தில் தொற்று, இரத்தப்போக்கு அல்லது அடைப்பு போன்ற சிக்கல் உள்ளது, சிகிச்சை தேவைப்படுகிறது." },
            failing:    { en: "Despite the tracheostomy, the airway cannot be maintained adequately. The underlying condition has progressed beyond the point where the airway tube can help.", ta: "தொண்டை துளை இருந்தாலும் காற்றுப்பாதையை போதுமான அளவு பராமரிக்க முடியவில்லை. காற்றுப்பாதை குழாய் உதவக்கூடிய புள்ளியை தாண்டி அடிப்படை நிலை முன்னேறியுள்ளது." },
          },
        },
      ],
    },
    {
      id: "mod_weaning", order: 11,
      label: { en: "Weaning Failure", ta: "சுவாச இயந்திர நிறுத்தல் தோல்வி" },
      conditions: [
        {
          id: "cond_weaning",
          keyword: { en: "Weaning Failure – Unable to Come Off the Ventilator", ta: "வீனிங் தோல்வி – வென்டிலேட்டரை விட இயலாமை" },
          severity: {
            mild:     { en: "We attempted to reduce the breathing machine support for your relative today but they were not able to breathe adequately on their own at this time. This is called weaning failure. It does not mean recovery is impossible — it simply means the lungs and muscles need more time and treatment before another attempt can be made.", ta: "இன்று உங்கள் உறவினருக்கான சுவாச இயந்திர ஆதரவை குறைக்க முயற்சித்தோம், ஆனால் இந்த நேரத்தில் தனியாக போதுமான அளவு சுவாசிக்க இயலவில்லை. இதை வீனிங் தோல்வி என்று அழைக்கிறோம். குணமடைவு சாத்தியமற்றது என்று இதன் அர்த்தமல்ல — மீண்டும் முயற்சி செய்வதற்கு முன் நுரையீரல்கள் மற்றும் தசைகளுக்கு அதிக நேரம் மற்றும் சிகிச்சை தேவை என்று மட்டுமே அர்த்தம்." },
            moderate: { en: "Multiple attempts to remove your relative from the ventilator have been unsuccessful. The lungs are recovering slowly and the breathing muscles remain weak. We are working on a structured rehabilitation programme including breathing exercises to strengthen them.", ta: "வென்டிலேட்டரிலிருந்து உங்கள் உறவினரை அகற்றும் பல முயற்சிகள் வெற்றியடையவில்லை. நுரையீரல்கள் மெதுவாக குணமடைகின்றன, சுவாசத் தசைகள் பலவீனமாகவே உள்ளன. அவற்றை வலுப்படுத்த சுவாச பயிற்சிகள் உட்பட கட்டமைக்கப்பட்ட மறுவாழ்வு திட்டத்தில் வேலை செய்கிறோம்." },
            severe:   { en: "Your relative has repeatedly failed to breathe independently and appears to be dependent on the ventilator for the foreseeable future. We are reassessing all the reasons why weaning is failing and considering a long-term airway plan such as a tracheostomy.", ta: "உங்கள் உறவினர் மீண்டும் மீண்டும் சுதந்திரமாக சுவாசிக்கத் தவறியுள்ளார், எதிர்கால காலத்திற்கு வென்டிலேட்டரில் சார்ந்திருப்பதாக தெரிகிறது. வீனிங் ஏன் தோல்வியடைகிறது என்ற அனைத்து காரணங்களையும் மறுமதிப்பீடு செய்து தொண்டை துளை போன்ற நீண்டகால காற்றுப்பாதை திட்டத்தை பரிசீலிக்கிறோம்." },
            critical: { en: "Your relative is unable to sustain any spontaneous breathing without full ventilator support. The muscle wasting and lung damage are profound. Long-term ventilation or end-of-life care planning may be the only realistic options now.", ta: "முழுமையான வென்டிலேட்டர் ஆதரவு இல்லாமல் உங்கள் உறவினரால் எந்த தன்னிச்சையான சுவாசத்தையும் தக்கவைக்க முடியவில்லை. தசை சுரிப்பு மற்றும் நுரையீரல் சேதம் ஆழமானது. நீண்டகால வென்டிலேஷன் அல்லது வாழ்க்கை முடிவு சிகிச்சை திட்டமிடல் மட்டுமே இப்போது யதார்த்தமான வாய்ப்புகளாக இருக்கலாம்." },
          },
          trajectory: {
            improving:  { en: "Your relative is tolerating longer periods of reduced ventilator support each day. We are optimistic that weaning may be successful with continued effort.", ta: "உங்கள் உறவினர் ஒவ்வொரு நாளும் குறைந்த வென்டிலேட்டர் ஆதரவின் நீண்ட காலங்களை சகித்துக்கொள்கிறார். தொடர்ந்த முயற்சியால் வீனிங் வெற்றிகரமாக இருக்கலாம் என்று நம்பிக்கையாக உள்ளோம்." },
            status_quo: { en: "The weaning attempts have not progressed further. The ventilator requirements are unchanged from yesterday.", ta: "வீனிங் முயற்சிகள் மேலும் முன்னேறவில்லை. நேற்றிலிருந்து வென்டிலேட்டர் தேவைகள் மாறாமல் உள்ளன." },
            worsening:  { en: "The weaning attempts are causing your relative distress and their oxygen levels are dropping when support is reduced. We have returned to full ventilator support for now.", ta: "வீனிங் முயற்சிகள் உங்கள் உறவினருக்கு கஷ்டத்தை ஏற்படுத்துகின்றன, ஆதரவு குறைக்கப்படும்போது ஆக்சிஜன் அளவு குறைகிறது. இப்போது முழுமையான வென்டிலேட்டர் ஆதரவிற்கு திரும்பியுள்ளோம்." },
            failing:    { en: "All weaning strategies have been exhausted without success. Ventilator dependence appears permanent at this stage and long-term planning is needed.", ta: "அனைத்து வீனிங் உத்திகளும் வெற்றியின்றி தீர்ந்துவிட்டன. இந்த கட்டத்தில் வென்டிலேட்டர் சார்பு நிரந்தரமாக தெரிகிறது, நீண்டகால திட்டமிடல் தேவைப்படுகிறது." },
          },
        },
      ],
    },
    {
      id: "mod_decann", order: 12,
      label: { en: "Decannulation Failure", ta: "குழாய் அகற்றல் தோல்வி" },
      conditions: [
        {
          id: "cond_decann",
          keyword: { en: "Unable to Remove Tracheostomy Tube", ta: "தொண்டை துளை குழாய் அகற்றல் இயலாமை" },
          severity: {
            mild:     { en: "We attempted to remove your relative's tracheostomy tube today as they appeared ready, but they experienced difficulty breathing and the tube needed to be reinserted. This is a temporary setback and does not mean the tube will never be removed.", ta: "இன்று உங்கள் உறவினர் தயாராக இருப்பதாக தோன்றியதால் தொண்டை துளை குழாயை அகற்ற முயற்சித்தோம், ஆனால் சுவாசிக்க கஷ்டம் ஏற்பட்டதால் குழாயை மீண்டும் செருகவேண்டியதிருந்தது. இது தற்காலிக தடமறுமையே, குழாய் ஒருபோதும் அகற்றப்படாது என்று இதன் அர்த்தமல்ல." },
            moderate: { en: "After multiple attempts, your relative has not been able to maintain safe breathing without the tracheostomy tube. The airway or the breathing muscles are not yet strong enough. We are continuing rehabilitation to work towards successful decannulation.", ta: "பல முயற்சிகளுக்குப் பிறகும், தொண்டை துளை குழாய் இல்லாமல் பாதுகாப்பான சுவாசத்தை பராமரிக்க உங்கள் உறவினரால் இயலவில்லை. காற்றுப்பாதை அல்லது சுவாசத் தசைகள் இன்னும் போதுமான வலிமை பெறவில்லை. வெற்றிகரமான குழாய் அகற்றலை நோக்கி மறுவாழ்வை தொடர்கிறோம்." },
            severe:   { en: "Decannulation appears to be very challenging due to significant weakness, secretion management problems, or airway damage. Your relative may require the tracheostomy for an extended period.", ta: "கணிசமான பலவீனம், சுரப்பு மேலாண்மை பிரச்சனைகள் அல்லது காற்றுப்பாதை சேதம் காரணமாக குழாய் அகற்றல் மிகவும் சவாலாக தெரிகிறது. உங்கள் உறவினருக்கு நீண்ட காலத்திற்கு தொண்டை துளை தேவைப்படலாம்." },
            critical: { en: "The tracheostomy tube is now essential for your relative's survival and cannot be safely removed. Long-term tracheostomy care will be required, and we need to plan for this with you and the nursing team.", ta: "தொண்டை துளை குழாய் இப்போது உங்கள் உறவினரின் உயிர்வாழ்விற்கு இன்றியமையாதது, பாதுகாப்பாக அகற்ற முடியாது. நீண்டகால தொண்டை துளை சிகிச்சை தேவைப்படும், உங்களுடனும் நர்சிங் குழுவுடனும் இதற்கு திட்டமிட வேண்டும்." },
          },
          trajectory: {
            improving:  { en: "Your relative is tolerating voice trials and capping the tracheostomy tube for increasing periods, which is a positive step toward removal.", ta: "உங்கள் உறவினர் குரல் சோதனைகளை சகித்துக்கொண்டு அதிகரிக்கும் காலங்களுக்கு தொண்டை துளை குழாயை மூடுகிறார், இது அகற்றல் நோக்கிய நேர்மறையான படி." },
            status_quo: { en: "The tracheostomy remains in place and plans for decannulation are on hold while we continue rehabilitation.", ta: "தொண்டை துளை தொடர்ந்து உள்ளது, மறுவாழ்வை தொடரும்போது குழாய் அகற்றல் திட்டங்கள் நிறுத்தி வைக்கப்பட்டுள்ளன." },
            worsening:  { en: "Attempts to reduce dependence on the tracheostomy have been unsuccessful and the need for it appears to be increasing rather than reducing.", ta: "தொண்டை துளையின் சார்பை குறைக்கும் முயற்சிகள் வெற்றியடையவில்லை, அதன் தேவை குறைவதற்கு பதிலாக அதிகரிக்கிறது." },
            failing:    { en: "The tracheostomy is now a permanent fixture and your relative's care going forward will require ongoing airway management at home or in a long-term care facility.", ta: "தொண்டை துளை இப்போது நிரந்தர நிலையாக உள்ளது, உங்கள் உறவினரின் எதிர்கால சிகிச்சைக்கு வீட்டில் அல்லது நீண்டகால சிகிச்சை வசதியில் தொடர்ச்சியான காற்றுப்பாதை மேலாண்மை தேவைப்படும்." },
          },
        },
      ],
    },
    {
      id: "mod_immunity", order: 13,
      label: { en: "Immunity Status", ta: "நோய் எதிர்ப்பு சக்தி நிலை" },
      conditions: [
        {
          id: "cond_immuno",
          keyword: { en: "Immunocompromised State – Weakened Immune System", ta: "நோயெதிர்ப்பு பலவீன நிலை" },
          severity: {
            mild:     { en: "Your relative's immune system is not functioning at full strength. This may be due to medications, an underlying illness, or a medical condition affecting the immune system. This means they are more vulnerable to infections and infections can be more serious in them than in a healthy person.", ta: "உங்கள் உறவினரின் நோயெதிர்ப்பு அமைப்பு முழு வலிமையில் செயல்படவில்லை. இது மருந்துகள், அடிப்படை நோய் அல்லது நோயெதிர்ப்பு அமைப்பை பாதிக்கும் மருத்துவ நிலை காரணமாக இருக்கலாம். அதாவது அவர் தொற்றுகளுக்கு அதிக பாதிப்பு உடையவர், ஆரோக்கியமான நபரை விட தொற்றுகள் அவரிடம் மிகவும் தீவிரமாக இருக்கலாம்." },
            moderate: { en: "Your relative has a significantly weakened immune system. They are at high risk of developing unusual or severe infections that healthy people would normally fight off easily. We are taking protective measures including isolation precautions to reduce this risk.", ta: "உங்கள் உறவினரின் நோயெதிர்ப்பு அமைப்பு கணிசமாக பலவீனமடைந்துள்ளது. ஆரோக்கியமான மக்கள் பொதுவாக எளிதாக எதிர்க்கும் அசாதாரண அல்லது தீவிரமான தொற்றுகளை வளர்க்கும் அதிக ஆபத்தில் உள்ளார். இந்த ஆபத்தை குறைக்க தனிமைப்படுத்தல் முன்னெச்சரிக்கைகள் உள்பட பாதுகாப்பு நடவடிக்கைகள் எடுக்கிறோம்." },
            severe:   { en: "Your relative's immune system is severely suppressed, leaving them virtually defenceless against infections. They have developed a serious infection that is very difficult to treat in this setting. Specialist input is being sought for the most appropriate treatment strategy.", ta: "உங்கள் உறவினரின் நோயெதிர்ப்பு அமைப்பு கடுமையாக அடக்கப்பட்டுள்ளது, தொற்றுகளுக்கு எதிராக நடைமுறையில் பாதுகாப்பு இல்லாமல் விடப்பட்டுள்ளது. இந்த சூழ்நிலையில் சிகிச்சை செய்வது மிகவும் கஷ்டமான தீவிர தொற்றை வளர்த்துள்ளார். மிகவும் பொருத்தமான சிகிச்சை உத்திக்காக நிபுணர் உதவி கோரப்படுகிறது." },
            critical: { en: "The immune system has completely failed and the body cannot mount any defence against infections. Life-threatening opportunistic infections are present. We are giving the strongest available treatments, but the outlook in this situation is very uncertain.", ta: "நோயெதிர்ப்பு அமைப்பு முழுமையாக செயலிழந்துள்ளது, தொற்றுகளுக்கு எதிராக எந்த பாதுகாப்பையும் உருவாக்க உடலால் இயலவில்லை. உயிருக்கு அபாயகரமான வாய்ப்பு தொற்றுகள் உள்ளன. கிடைக்கக்கூடிய மிக வலிமையான சிகிச்சைகளை வழங்குகிறோம், ஆனால் இந்த நிலையில் கண்ணோட்டம் மிகவும் நிச்சயமற்றது." },
          },
          trajectory: {
            improving:  { en: "The infection markers are reducing and the immune status is showing some improvement. The treatment is working.", ta: "தொற்று குறிப்பான்கள் குறைகின்றன, நோய் எதிர்ப்பு நிலை சற்று முன்னேற்றத்தை காட்டுகிறது. சிகிச்சை வேலை செய்கிறது." },
            status_quo: { en: "The immune suppression and infection status remain unchanged. We continue aggressive treatment and protective measures.", ta: "நோய் எதிர்ப்பு அடக்கம் மற்றும் தொற்று நிலை மாறாமல் உள்ளது. தீவிர சிகிச்சை மற்றும் பாதுகாப்பு நடவடிக்கைகளை தொடர்கிறோம்." },
            worsening:  { en: "The immune system is failing further and new infections are developing on top of the current ones. This is a very concerning development.", ta: "நோயெதிர்ப்பு அமைப்பு மேலும் தோல்வியடைகிறது, தற்போதைய தொற்றுகளின் மேல் புதிய தொற்றுகள் உருவாகின்றன. இது மிகவும் கவலைப்படத்தக்க வளர்ச்சி." },
            failing:    { en: "The immune system cannot be restored and is no longer able to protect the body from infection. Each new infection is becoming harder to treat and the body is not recovering between them.", ta: "நோயெதிர்ப்பு அமைப்பை மீட்டெடுக்க முடியாது, தொற்றிலிருந்து உடலை பாதுகாக்க இனி இயலாது. ஒவ்வொரு புதிய தொற்றும் சிகிச்சை செய்வது கஷ்டமாகிறது, அவற்றுக்கிடையே உடல் குணமடையவில்லை." },
          },
        },
      ],
    },
    {
      id: "mod_nutrition", order: 14,
      label: { en: "Nutritional Problems", ta: "ஊட்டச்சத்து பிரச்சனைகள்" },
      conditions: [
        {
          id: "cond_malnut",
          keyword: { en: "Severe Malnutrition / Inability to Feed", ta: "கடுமையான ஊட்டச்சத்து குறைபாடு / உணவளிக்க இயலாமை" },
          severity: {
            mild:     { en: "Your relative is not able to take adequate nutrition by mouth due to their illness. Poor nutrition slows recovery and weakens the immune system. We are providing nutritional supplements or a liquid diet through a tube passed into the stomach to ensure they receive enough calories and protein.", ta: "உங்கள் உறவினர் நோய் காரணமாக வாய் மூலம் போதுமான ஊட்டச்சத்தை உட்கொள்ள இயலவில்லை. மோசமான ஊட்டச்சத்து குணமடைவதை மெதுவாக்கி நோயெதிர்ப்பு அமைப்பை பலவீனப்படுத்துகிறது. போதுமான கலோரிகள் மற்றும் புரதம் கிடைப்பதை உறுதி செய்ய வயிற்றில் செருகப்பட்ட குழாய் மூலம் ஊட்டச்சத்து சப்ளிமெண்ட்கள் அல்லது திரவ உணவு வழங்குகிறோம்." },
            moderate: { en: "Your relative has significant malnutrition which is affecting their ability to heal and fight infection. The gut is not absorbing nutrients properly. We are working with our nutrition team to find the best way to provide nutrition, which may include feeding directly into the bloodstream.", ta: "உங்கள் உறவினருக்கு குணமடைவதற்கும் தொற்றை எதிர்க்கவும் திறனை பாதிக்கும் கணிசமான ஊட்டச்சத்து குறைபாடு உள்ளது. குடல் சரியாக ஊட்டச்சத்துக்களை உறிஞ்சவில்லை. ஊட்டச்சத்து வழங்குவதற்கான சிறந்த வழியை கண்டுபிடிக்க ஊட்டச்சத்து குழுவுடன் வேலை செய்கிறோம், இதில் நேரடியாக இரத்த ஓட்டத்தில் உணவளிப்பது அடங்கலாம்." },
            severe:   { en: "Your relative is severely malnourished. The muscles are wasting, wounds are not healing, and the immune system is critically weakened as a direct result of poor nutrition. Specialised intravenous nutrition is being provided alongside the other treatments.", ta: "உங்கள் உறவினர் கடுமையான ஊட்டச்சத்து குறைபாட்டில் உள்ளார். தசைகள் சுரிகின்றன, காயங்கள் குணமடைவதில்லை, மோசமான ஊட்டச்சத்தின் நேரடி விளைவாக நோயெதிர்ப்பு அமைப்பு தீவிரமாக பலவீனமடைந்துள்ளது. மற்ற சிகிச்சைகளுடன் சிறப்பு நரம்பு வழி ஊட்டச்சத்து வழங்கப்படுகிறது." },
            critical: { en: "Nutritional failure is now compounding all the other organ failures. The body has reached a state of catabolism where it is breaking down its own muscles for energy at an alarming rate. Despite our efforts, nutritional support alone cannot reverse this process at this advanced stage.", ta: "ஊட்டச்சத்து செயலிழப்பு இப்போது மற்ற அனைத்து உறுப்பு செயலிழப்புகளையும் சேர்த்து கூட்டுகிறது. உடல் ஆற்றலுக்காக சொந்த தசைகளை ஆபத்தான வேகத்தில் உடைக்கும் வளர்சிதை மாற்ற நிலையை அடைந்துள்ளது. எங்கள் முயற்சிகள் இருந்தாலும், இந்த மேம்பட்ட கட்டத்தில் ஊட்டச்சத்து ஆதரவு மட்டுமே இந்த செயல்முறையை தலைகீழாக மாற்ற முடியாது." },
          },
          trajectory: {
            improving:  { en: "Nutritional targets are being met and your relative is tolerating tube feeding well. Early signs of improved wound healing and muscle function are encouraging.", ta: "ஊட்டச்சத்து இலக்குகள் பூர்த்தி செய்யப்படுகின்றன, உங்கள் உறவினர் குழாய் உணவை நன்றாக சகித்துக்கொள்கிறார். மேம்பட்ட காயம் குணமடைதல் மற்றும் தசை செயல்பாட்டின் ஆரம்ப அறிகுறிகள் ஊக்கமளிக்கின்றன." },
            status_quo: { en: "Nutrition is being maintained at the current level. The gut is tolerating the feeds but absorption remains partial.", ta: "ஊட்டச்சத்து தற்போதைய அளவில் பராமரிக்கப்படுகிறது. குடல் உணவை சகித்துக்கொள்கிறது, ஆனால் உறிஞ்சுதல் பகுதியாகவே உள்ளது." },
            worsening:  { en: "The gut is not tolerating feeds and nutritional requirements are not being met. Intravenous nutrition is being increased but this cannot fully replace normal gut absorption.", ta: "குடல் உணவை சகிக்கவில்லை, ஊட்டச்சத்து தேவைகள் பூர்த்தி செய்யப்படவில்லை. நரம்பு வழி ஊட்டச்சத்து அதிகரிக்கப்படுகிறது, ஆனால் இது இயல்பான குடல் உறிஞ்சுதலை முழுமையாக மாற்ற முடியாது." },
            failing:    { en: "Despite every nutritional strategy, the body is unable to utilise or absorb nutrients. This reflects the severity of the overall organ failure, and nutrition alone will not be able to sustain recovery.", ta: "ஒவ்வொரு ஊட்டச்சத்து உத்தியும் இருந்தாலும், உடல் ஊட்டச்சத்துக்களை பயன்படுத்தவோ உறிஞ்சவோ இயலவில்லை. இது ஒட்டுமொத்த உறுப்பு செயலிழப்பின் தீவிரத்தை பிரதிபலிக்கிறது, ஊட்டச்சத்து மட்டுமே குணமடைவதை தக்கவைக்க முடியாது." },
          },
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSENT STATEMENTS
// ─────────────────────────────────────────────────────────────────────────────
const CONSENT_STATEMENTS = [
  { id: "cs1", en: "The doctor explained the current medical condition in a language I understand.", ta: "மருத்துவர் தற்போதைய மருத்துவ நிலையை நான் புரிந்துகொள்ளும் மொழியில் விளக்கினார்." },
  { id: "cs2", en: "I was given adequate time to ask questions and clarify my doubts.", ta: "கேள்விகள் கேட்கவும் என் சந்தேகங்களை தெளிவுபடுத்திக் கொள்ளவும் எனக்கு போதுமான நேரம் வழங்கப்பட்டது." },
  { id: "cs3", en: "I was informed about the option of seeking a second medical opinion if I wish to do so.", ta: "நான் விரும்பினால் இரண்டாவது மருத்துவ கருத்தை நாடும் வாய்ப்பு பற்றி என்னிடம் தெரிவிக்கப்பட்டது." },
  { id: "cs4", en: "I understand that the prognosis may change and further discussions will be held as needed.", ta: "முன்கணிப்பு மாறலாம் என்பதும் தேவைப்படும்போது மேலும் விவாதங்கள் நடத்தப்படும் என்பதும் எனக்கு புரிகிறது." },
  { id: "cs5", en: "I was explained the treatment plan and the reasons for each intervention.", ta: "சிகிச்சை திட்டம் மற்றும் ஒவ்வொரு தலையீட்டிற்கான காரணங்கள் எனக்கு விளக்கப்பட்டன." },
  { id: "cs6", en: "I understand my right to withdraw consent at any time and the implications of doing so.", ta: "எந்த நேரத்திலும் சம்மதத்தை திரும்பப் பெறும் என் உரிமையும் அதன் தாக்கங்களும் எனக்கு புரிகிறது." },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DOCUMENT BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function buildDocument(opts = {}) {
  const {
    patientName         = "Patient Name",
    patientUHID         = "UHID-XXXXXX",
    patientAge          = "—",
    sessionNumber       = "1",
    paediatric          = false,
    doctorName          = "Doctor Name",
    doctorDesignation   = "Designation",
    doctorRegNumber     = "",
    ward                = "",
    othersPresent       = "",
    interpreterPresent  = false,
    interpreterName     = "",
    hospitalName        = "",
    includeHospital     = false,
    // selectedModules: { modId: { condId: { severity, trajectory } } }
    selectedModules     = {},
    prognosisLevel      = "",        // guarded|poor|very_poor|terminal
    prognosisFreeEn     = "",
    prognosisFreeTa     = "",
    scores              = {},        // { SOFA, APACHE_II, GCS, qSOFA }
    consentChecks       = {},        // { cs1:true, ... }
    refusalDocumented   = false,
    refusalReason       = "",
    signatoryName       = "",
    signatoryRelation   = "",
    witnessName         = "",
    witnessDesig        = "",
    docId               = "DOCID",
  } = opts;

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  const progLevels = {
    guarded:   { en: "Guarded",    ta: "எச்சரிக்கையான",   desc_en: "The outcome is uncertain. There are significant risks but recovery is possible with continued treatment.", desc_ta: "விளைவு நிச்சயமற்றது. கணிசமான அபாயங்கள் உள்ளன, ஆனால் தொடர்ந்த சிகிச்சையால் குணமடைவு சாத்தியம்." },
    poor:      { en: "Poor",       ta: "மோசமான",          desc_en: "The prognosis is poor. Despite active treatment, the likelihood of meaningful recovery is limited.", desc_ta: "முன்கணிப்பு மோசமானது. தீவிர சிகிச்சை இருந்தாலும், அர்த்தமுள்ள குணமடைவின் சாத்தியம் குறைவு." },
    very_poor: { en: "Very Poor",  ta: "மிகவும் மோசமான",  desc_en: "The prognosis is very poor. The condition is life-threatening and survival is uncertain even with maximum support.", desc_ta: "முன்கணிப்பு மிகவும் மோசமானது. நிலை உயிருக்கு அபாயகரமானது, அதிகபட்ச ஆதரவு இருந்தாலும் உயிர்வாழ்வு நிச்சயமற்றது." },
    terminal:  { en: "Terminal",   ta: "இறுதிக் கட்ட",     desc_en: "The condition is terminal. Despite all medical efforts, survival is not expected. Our focus will shift to comfort and dignity.", desc_ta: "நிலை இறுதிக்கட்டத்தில் உள்ளது. அனைத்து மருத்துவ முயற்சிகள் இருந்தாலும், உயிர்வாழ்வு எதிர்பார்க்கப்படவில்லை. வசதி மற்றும் கண்ணியத்தில் கவனம் செலுத்துவோம்." },
  };

  // ── HEADER (repeated every page) ─────────────────────────────────────────
  const headerLeft = includeHospital && hospitalName
    ? [
        en(hospitalName, { bold: true, size: pt(11), color: BLUE_DARK }),
        en("ICU / Emergency Department", { size: pt(8), color: "555555" }),
      ]
    : [en("ICU / Emergency Department", { size: pt(9), color: "888888", italic: true })];

  const headerRight = [
    en(patientName, { bold: true, size: pt(10) }),
    new TextRun({ break: 1 }),
    en(`UHID: ${patientUHID}  |  Age: ${patientAge} yrs  |  Session: ${sessionNumber}`, { size: pt(8), color: "555555" }),
  ];

  const header = new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE_DARK, space: 1 } },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          ...headerLeft,
          new TextRun({ text: "\t" }),
          ...headerRight,
        ],
      }),
    ],
  });

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const footer = new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD", space: 1 } },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { before: 60 },
        children: [
          en(`Document ID: ${docId}`, { size: pt(7), color: "AAAAAA" }),
          new TextRun({ text: "\t" }),
          en("Page ", { size: pt(7), color: "AAAAAA" }),
          new TextRun({ children: [PageNumber.CURRENT], size: pt(7) * 2, color: "AAAAAA" }),
          new TextRun({ text: "  |  ICU Consent App v1.0 — " + today, size: pt(7) * 2, color: "AAAAAA" }),
        ],
      }),
    ],
  });

  // ── STORY (body content) ─────────────────────────────────────────────────
  const children = [];

  // [1] Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 40 },
      children: [en("ICU / Emergency Prognosis Counselling and Consent Record", {
        bold: true, size: pt(14), color: BLUE_DARK,
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [ta("ICU / அவசர சிகிச்சை முன்கணிப்பு ஆலோசனை மற்றும் சம்மத பதிவு", {
        bold: true, size: pt(13), color: "2a4a6a",
      })],
    }),
    rule(BLUE_DARK, 16),
  );

  // [2] Session & Clinician
  children.push(...sectionHead("Session & Clinician Details"));
  const regStr = doctorRegNumber ? `  (Reg: ${doctorRegNumber})` : "";
  children.push(
    ...adminRow("Attending Doctor", `${doctorName} — ${doctorDesignation}${regStr}`),
    ...adminRow("Ward / Unit", ward),
    ...adminRow("Others Present", othersPresent),
    ...(interpreterPresent ? adminRow("Interpreter", interpreterName || "Present") : []),
    new Paragraph({
      spacing: { before: 30, after: 80 },
      children: [
        en("Date of Counselling: ________________  ", { size: pt(8.5), color: "AAAAAA", italic: true }),
        en("(to be completed by clinician at time of signing)", { size: pt(8), color: "BBBBBB", italic: true }),
      ],
    }),
  );

  // [3] Paediatric disclaimer
  if (paediatric) {
    children.push(
      colourBox(
        [
          new Paragraph({ spacing: { before: 0, after: 40 }, children: [en("⚠  PAEDIATRIC CASE", { bold: true, size: pt(9.5), color: AMBER_TXT })] }),
          new Paragraph({ spacing: { before: 0, after: 40 }, children: [en("This document relates to a paediatric patient. Paediatric-specific clinical modules will be available in a future version of this tool.", { size: pt(9), color: "78350F" })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [ta("இந்த ஆவணம் ஒரு குழந்தை நோயாளியை சேர்ந்தது. குழந்தை-குறிப்பிட்ட மருத்துவ தொகுதிகள் எதிர்கால பதிப்பில் கிடைக்கும்.", { size: pt(10), color: AMBER_TXT })] }),
        ],
        AMBER_BG, AMBER_TXT,
      ),
      spacer(60, 80),
    );
  }

  // [4] Organ-wise clinical status
  children.push(...sectionHead(
    "Clinical Condition and Organ Status",
    "மருத்துவ நிலை மற்றும் உறுப்பு செயல்பாடு",
  ));

  const sortedModules = [...CONTENT.modules].sort((a, b) => a.order - b.order);
  for (const mod of sortedModules) {
    const modSel = selectedModules[mod.id];
    if (!modSel || !Object.keys(modSel).length) continue;

    // Module heading
    children.push(
      new Paragraph({ spacing: { before: 120, after: 20 }, children: [en(mod.label.en, { bold: true, size: pt(11), color: BLUE_DARK })] }),
      new Paragraph({ spacing: { before: 0, after: 80 }, children: [ta(mod.label.ta, { bold: true, size: pt(12), color: "2a4a6a" })] }),
    );

    for (const cond of mod.conditions) {
      const sel = modSel[cond.id];
      if (!sel) continue;

      const { severity: sevKey, trajectory: trajKey } = sel;

      // Condition keyword line
      children.push(new Paragraph({
        spacing: { before: 40, after: 60 },
        children: [
          en(`${cond.keyword.en}`, { italic: true, size: pt(9.5), color: "444444" }),
          en("  /  ", { size: pt(9), color: "AAAAAA" }),
          ta(cond.keyword.ta, { size: pt(10), color: "444444", italic: true }),
        ],
      }));

      // Severity bilingual
      if (sevKey && cond.severity[sevKey]) {
        children.push(...biPara(cond.severity[sevKey].en, cond.severity[sevKey].ta));
      }

      // Trajectory bilingual
      if (trajKey && cond.trajectory[trajKey]) {
        children.push(...biPara(cond.trajectory[trajKey].en, cond.trajectory[trajKey].ta));
      }

      children.push(dashRule());
    }
  }

  // [5] Clinical scores
  const activeScores = Object.entries(scores).filter(([, v]) => v);
  if (activeScores.length) {
    children.push(...sectionHead(
      "Clinical Risk Assessment Scores",
      "மருத்துவ ஆபத்து மதிப்பீட்டு புள்ளிகள்",
    ));

    const scoreLabels = { SOFA: "SOFA", APACHE_II: "APACHE II", GCS: "GCS", qSOFA: "qSOFA" };
    const colW = Math.floor(CONTENT_W / activeScores.length);

    const scoreTable = new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: activeScores.map(() => colW),
      rows: [
        new TableRow({
          children: activeScores.map(([key, val]) => new TableCell({
            width: { size: colW, type: WidthType.DXA },
            shading: { fill: "F0F8FF", type: ShadingType.CLEAR },
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE },
              left:   { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE },
              right:  { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE },
            },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [en(val, { bold: true, size: pt(16), color: BLUE_DARK })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [en(scoreLabels[key] || key, { size: pt(8), color: "555555" })] }),
            ],
          })),
        }),
      ],
    });

    children.push(scoreTable, spacer(40, 80));
    children.push(new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [en("Score calculators and serial comparison available in Version 2.", { italic: true, size: pt(7.5), color: "AAAAAA" })],
    }));
  }

  // [6] Overall prognosis
  children.push(...sectionHead("Overall Prognosis", "ஒட்டுமொத்த முன்கணிப்பு"));

  const progObj = progLevels[prognosisLevel];
  if (progObj) {
    // Badge box
    children.push(
      colourBox(
        [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            en(`${progObj.en}`, { bold: true, size: pt(12), color: RED_TXT }),
            en("  /  ", { size: pt(10), color: "AAAAAA" }),
            ta(progObj.ta, { bold: true, size: pt(12), color: RED_TXT }),
          ],
        })],
        RED_BG, RED_TXT,
      ),
      spacer(40, 60),
      ...biPara(progObj.desc_en, progObj.desc_ta),
    );
  }

  if (prognosisFreeEn) {
    children.push(new Paragraph({
      spacing: { before: 40, after: 40 },
      alignment: AlignmentType.JUSTIFIED,
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 8 } },
      indent: { left: 120 },
      children: [en(prognosisFreeEn)],
    }));
  }
  if (prognosisFreeTa) {
    children.push(new Paragraph({
      spacing: { before: 0, after: 80 },
      alignment: AlignmentType.JUSTIFIED,
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 8 } },
      indent: { left: 120 },
      children: [ta(prognosisFreeTa)],
    }));
  }

  // [7] Consent statements
  children.push(...sectionHead("Consent Acknowledgement", "சம்மத உறுதிப்படுத்தல்"));
  const activeConsents = CONSENT_STATEMENTS.filter(s => consentChecks[s.id] !== false);
  activeConsents.forEach((stmt, i) => {
    children.push(
      new Paragraph({
        spacing: { before: 40, after: 30 },
        alignment: AlignmentType.JUSTIFIED,
        children: [en(`${i + 1}.  ${stmt.en}`)],
      }),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        alignment: AlignmentType.JUSTIFIED,
        children: [ta(stmt.ta)],
      }),
    );
  });

  // [8] Refusal documentation
  if (refusalDocumented) {
    children.push(
      spacer(80, 40),
      colourBox(
        [
          new Paragraph({ spacing: { before: 0, after: 40 }, children: [en("⚠  Documentation of Refusal to Sign", { bold: true, size: pt(9.5), color: RED_TXT })] }),
          new Paragraph({ spacing: { before: 0, after: 40 }, children: [ta("கையொப்பமிட மறுத்தல் ஆவணப்படுத்தல்", { bold: true, size: pt(11), color: RED_TXT })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [en(refusalReason || "(No reason recorded.)", { size: pt(9), color: RED_TXT })] }),
        ],
        RED_BG, RED_TXT,
      ),
      spacer(60, 80),
    );
  }

  // [9] Signature block — two-column table
  children.push(...sectionHead("Signature Block", "கையொப்ப பகுதி"));

  const colH = Math.floor(CONTENT_W / 2) - 200;

  const leftSigItems = [
    ...sigField("Signatory Name", "கையொப்பமிட்டவர் பெயர்", signatoryName),
    ...sigField("Relationship to Patient", "நோயாளியுடனான உறவு", signatoryRelation),
    ...sigField("Signature / கையொப்பம்", ""),
  ];

  const rightSigItems = [
    ...sigField("Witness Name", "சாட்சி பெயர்", witnessName),
    ...sigField("Witness Designation", "சாட்சி பதவி", witnessDesig),
    ...sigField("Date / தேதி", ""),
    ...sigField("Time / நேரம்", ""),
  ];

  const sigTable = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [colH, 300, colH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: colH, type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: leftSigItems,
          }),
          new TableCell({
            width: { size: 300, type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: colH, type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: rightSigItems,
          }),
        ],
      }),
    ],
  });

  children.push(sigTable, spacer(80, 60));

  // Date/time note box
  children.push(
    colourBox(
      [
        new Paragraph({ spacing: { before: 0, after: 30 }, alignment: AlignmentType.CENTER, children: [en("Date and time to be completed by the clinician at the time of signing.  This is intentional — the app is a composition tool, not a timestamping authority.", { italic: true, size: pt(7.5), color: "888888" })] }),
        new Paragraph({ spacing: { before: 0, after: 0  }, alignment: AlignmentType.CENTER, children: [ta("தேதி மற்றும் நேரம் கையொப்பமிடும் போது மருத்துவரால் நிரப்பப்படவும்.",                          { size: pt(9),   color: "888888" })] }),
      ],
      GREY_BG, GREY_RULE,
    ),
    spacer(80, 40),
  );

  // [10] Medicolegal disclaimer
  children.push(
    rule("DDDDDD", 4),
    new Paragraph({
      spacing: { before: 60, after: 60 },
      alignment: AlignmentType.CENTER,
      children: [en(
        "This document was generated using ICU Consent App v1.0.  This application is a composition tool and does not constitute a medical records system.  " +
        "The healthcare institution is solely responsible for document retention and medicolegal compliance.  " +
        "The developer bears no responsibility for document storage or medicolegal outcomes.",
        { italic: true, size: pt(7.5), color: "AAAAAA" },
      )],
    }),
  );

  // ── ASSEMBLE DOCUMENT ────────────────────────────────────────────────────
  return new Document({
    styles: {
      default: {
        document: {
          run: { font: EN_FONT, size: pt(10.5), color: "1a1a1a" },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: 16838 },   // A4
          margin: { top: MARGIN + 400, right: MARGIN, bottom: MARGIN + 400, left: MARGIN },
        },
      },
      headers: { default: header },
      footers: { default: footer },
      children,
    }],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DOCUMENT  (demonstrating all 14 modules with real content)
// ─────────────────────────────────────────────────────────────────────────────
const doc = buildDocument({
  patientName:        "Rajan Murugesan",
  patientUHID:        "UHID-20240391",
  patientAge:         "62",
  sessionNumber:      "2",
  paediatric:         false,
  doctorName:         "Dr. S. Krishnamurthy",
  doctorDesignation:  "Senior Consultant, Pulmonology & Critical Care",
  doctorRegNumber:    "TN-MCI-28347",
  ward:               "Medical ICU — Bed 4",
  othersPresent:      "Sr. Nurse Lakshmi Devi, Dr. R. Anand (Resident)",
  interpreterPresent: false,
  hospitalName:       "Apollo Hospitals, Chennai",
  includeHospital:    true,
  docId:              "A3F9B2",

  selectedModules: {
    mod_respiratory: {
      cond_arf:       { severity: "severe",   trajectory: "worsening"  },
      cond_ards:      { severity: "moderate", trajectory: "status_quo" },
      cond_vent:      { severity: "moderate", trajectory: "improving"  },
      cond_pneumonia: { severity: "moderate", trajectory: "worsening"  },
    },
    mod_cardiovascular: {
      cond_septic_shock: { severity: "moderate", trajectory: "worsening" },
    },
    mod_renal: {
      cond_aki:      { severity: "moderate", trajectory: "status_quo" },
      cond_dialysis: { severity: "mild",     trajectory: "improving"  },
    },
    mod_neuro: {
      cond_enceph: { severity: "mild", trajectory: "improving" },
    },
    mod_sepsis: {
      cond_sepsis: { severity: "severe", trajectory: "worsening" },
    },
  },

  prognosisLevel:  "poor",
  prognosisFreeEn: "Patient has multiple comorbidities including hypertension, type 2 diabetes mellitus, and chronic kidney disease stage 3. Response to current antimicrobial therapy is suboptimal and cultures are pending. Serial organ function monitoring is in progress.",
  prognosisFreeTa: "நோயாளிக்கு உயர் இரத்த அழுத்தம், வகை 2 நீரிழிவு நோய் மற்றும் நாட்பட்ட சிறுநீரக நோய் படி 3 உள்ளன. தற்போதைய நுண்ணுயிர் எதிர்ப்பி சிகிச்சைக்கு பதில் திருப்திகரமாக இல்லை. வழக்கமான உறுப்பு செயல்பாடு கண்காணிப்பு நடக்கிறது.",

  scores: { SOFA: "8", APACHE_II: "22", GCS: "14", qSOFA: "2" },

  consentChecks: { cs1: true, cs2: true, cs3: true, cs4: true, cs5: true, cs6: true },

  refusalDocumented: false,

  signatoryName:    "Priya Rajan",
  signatoryRelation:"Daughter",
  witnessName:      "Sr. Nurse Lakshmi Devi",
  witnessDesig:     "Staff Nurse, Medical ICU",
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("ICU_Consent_Document.docx", buffer);
  console.log(`Done: ICU_Consent_Document.docx (${(buffer.length/1024).toFixed(1)} KB)`);
});

module.exports = { buildDocument };

