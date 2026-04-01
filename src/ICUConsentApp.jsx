import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT DATABASE (Phase 1 JSON — embedded for Phase 3 demo)
// In production this comes from content.json (Section 5)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CONTENT_DB = {
  version: "1.0.0",
  lastUpdated: "2026-03-27",
  languages: ["en", "ta"],
  modules: [
    {
      id: "mod_respiratory",
      order: 1,
      label: { en: "Respiratory System", ta: "சுவாச மண்டலம்" },
      active: true,
      conditions: [
        {
          id: "cond_arf",
          keyword: { en: "Acute Respiratory Failure", ta: "கடுமையான சுவாசச் செயலிழப்பு" },
          active: true,
          severity: {
            mild: { en: "Your relative is experiencing mild difficulty in breathing. Although their oxygen levels are lower than normal, they are currently being supported with supplemental oxygen through a mask or nasal prongs. We are closely monitoring their breathing and oxygen levels and will adjust treatment as needed.", ta: "உங்கள் உறவினருக்கு லேசான சுவாசக் கஷ்டம் உள்ளது. அவரது ஆக்சிஜன் அளவு சாதாரணத்தை விட குறைவாக இருந்தாலும், தற்போது முகமூடி அல்லது மூக்கு குழாய் மூலம் ஆக்சிஜன் வழங்கப்படுகிறது." },
            moderate: { en: "Your relative's lungs are not working as well as they should, and they are struggling to get enough oxygen into their blood even with the help of oxygen therapy. We have increased the level of oxygen support and are carefully watching for any signs of worsening.", ta: "உங்கள் உறவினரின் நுரையீரல் சரியாக செயல்படவில்லை. ஆக்சிஜன் சிகிச்சை அளித்தாலும் இரத்தத்தில் போதுமான அளவு ஆக்சிஜன் கிடைக்கவில்லை. நாங்கள் ஆக்சிஜன் ஆதரவை அதிகரித்துள்ளோம்." },
            severe: { en: "Your relative has developed severe respiratory failure, meaning their lungs are unable to provide enough oxygen to the body on their own. They require significant medical support to help them breathe. This is a serious condition and we are providing the highest level of care available.", ta: "உங்கள் உறவினருக்கு கடுமையான சுவாசச் செயலிழப்பு ஏற்பட்டுள்ளது. அவரது நுரையீரல் தானாக உடலுக்கு போதுமான ஆக்சிஜன் வழங்க இயலவில்லை. இது மிகவும் தீவிரமான நிலை." },
            critical: { en: "Your relative is in a critical state of respiratory failure. Despite the most advanced levels of breathing support we can provide, their lungs are struggling extremely hard to maintain even the minimum oxygen levels needed to sustain life. This is a life-threatening situation.", ta: "உங்கள் உறவினர் மிக தீவிரமான சுவாசச் செயலிழப்பில் உள்ளார். நாங்கள் வழங்கக்கூடிய மிக உயர்ந்த சுவாச ஆதரவு இருந்தாலும், உயிரை தக்கவைக்க தேவையான குறைந்தபட்ச ஆக்சிஜன் அளவையும் பராமரிக்க அவரது நுரையீரல் கடுமையாக போராடுகிறது." },
          },
          trajectory: {
            improving: { en: "We are pleased to inform you that your relative's breathing has shown some improvement with treatment. Their oxygen levels are responding better and we are cautiously optimistic, though continued close monitoring is essential.", ta: "சிகிச்சையால் உங்கள் உறவினரின் சுவாசம் சற்று மேம்பட்டுள்ளது என்பதை தெரிவிக்க மகிழ்ச்சியடைகிறோம். ஆக்சிஜன் அளவு சிறப்பாக பதிலளிக்கிறது." },
            status_quo: { en: "Your relative's breathing condition remains unchanged at this time. They are neither deteriorating nor improving significantly. We are continuing the current treatment and will reassess regularly.", ta: "உங்கள் உறவினரின் சுவாச நிலை தற்போது மாறாமல் உள்ளது. நிலைமை மோசமடையவும் இல்லை, கணிசமாக மேம்படவும் இல்லை." },
            worsening: { en: "Despite the treatment we are providing, your relative's breathing difficulty has been getting worse over the past several hours. We are making adjustments to their care and considering additional interventions.", ta: "நாங்கள் வழங்கும் சிகிச்சை இருந்தாலும், கடந்த சில மணி நேரங்களாக உங்கள் உறவினரின் சுவாசக் கஷ்டம் அதிகரித்து வருகிறது." },
            failing: { en: "Your relative's lungs are no longer responding adequately to the maximum treatment we are able to provide. The respiratory failure is progressing despite our best efforts. We must have an urgent and honest discussion with you about the goals of care.", ta: "நாங்கள் வழங்கக்கூடிய அதிகபட்ச சிகிச்சைக்கும் உங்கள் உறவினரின் நுரையீரல் போதுமான அளவு பதிலளிக்கவில்லை. எங்கள் சிறந்த முயற்சிகள் இருந்தாலும் சுவாசச் செயலிழப்பு தொடர்கிறது." },
          },
        },
        {
          id: "cond_ards",
          keyword: { en: "ARDS – Acute Respiratory Distress Syndrome", ta: "ARDS – கடுமையான சுவாசக் கோளாறு நோய்க்குறி" },
          active: true,
          severity: {
            mild: { en: "Your relative's lungs have been affected by a condition called Acute Respiratory Distress Syndrome (ARDS), which is an early stage at present. This means the lungs have become partially inflamed and stiff, making breathing harder.", ta: "உங்கள் உறவினரின் நுரையீரல் 'கடுமையான சுவாசக் கோளாறு நோய்க்குறி' (ARDS) என்ற நிலையால் பாதிக்கப்பட்டுள்ளது, தற்போது ஆரம்ப நிலையில் உள்ளது." },
            moderate: { en: "Your relative has been diagnosed with moderate ARDS. Both lungs have become significantly inflamed and filled with fluid, making it very difficult for oxygen to pass from the air into the blood. They need a breathing support machine to help them.", ta: "உங்கள் உறவினருக்கு நடுத்தர அளவிலான ARDS கண்டறியப்பட்டுள்ளது. இரு நுரையீரல்களும் கணிசமான அளவு வீக்கமடைந்து திரவம் நிரம்பியுள்ளன." },
            severe: { en: "Your relative has severe ARDS. Both lungs are severely damaged, inflamed and filled with fluid, making independent breathing impossible. They are on a mechanical ventilator. This is a life-threatening condition.", ta: "உங்கள் உறவினருக்கு தீவிரமான ARDS உள்ளது. இரு நுரையீரல்களும் கடுமையாக சேதமடைந்து வீக்கமடைந்து திரவம் நிரம்பியுள்ளன, தனியாக சுவாசிப்பது சாத்தியமற்றது." },
            critical: { en: "Your relative is in the most severe stage of ARDS. Their lungs have sustained extreme damage and are barely functioning even on the highest ventilator settings. We must be honest with you — this is an extremely critical situation with a very uncertain outlook.", ta: "உங்கள் உறவினர் ARDS-ன் மிகவும் தீவிரமான நிலையில் உள்ளார். நுரையீரல்கள் மிகவும் கடுமையாக சேதமடைந்துள்ளன." },
          },
          trajectory: {
            improving: { en: "There are early signs that your relative's lungs are beginning to respond to treatment. The oxygen requirements are slowly decreasing, which is an encouraging sign.", ta: "உங்கள் உறவினரின் நுரையீரல் சிகிச்சைக்கு பதிலளிக்கத் தொடங்கியுள்ளது என்ற ஆரம்ப அறிகுறிகள் உள்ளன." },
            status_quo: { en: "The ARDS has neither worsened nor improved today. The lungs remain inflamed and we continue maximum supportive care.", ta: "ARDS இன்று மோசமடையவும் இல்லை, மேம்படவும் இல்லை. நுரையீரல்கள் வீக்கமடைந்தே உள்ளன." },
            worsening: { en: "Unfortunately, the ARDS is getting worse despite treatment. We are escalating the level of support and consulting with specialist colleagues.", ta: "துரதிர்ஷ்டவசமாக, சிகிச்சை இருந்தாலும் ARDS மோசமடைகிறது." },
            failing: { en: "The lungs are failing to respond to all treatment measures. We are in a situation where continuing aggressive intervention may cause more suffering without meaningful benefit.", ta: "அனைத்து சிகிச்சை நடவடிக்கைகளுக்கும் நுரையீரல்கள் பதிலளிக்கத் தவறுகின்றன." },
          },
        },
        {
          id: "cond_vent",
          keyword: { en: "Invasive Mechanical Ventilation", ta: "இயந்திர சுவாச ஆதரவு" },
          active: true,
          severity: {
            mild: { en: "Your relative needs to be connected to a breathing machine through a tube placed in the windpipe. This is done to protect the airway and give the lungs adequate rest and support while we treat the underlying illness.", ta: "உங்கள் உறவினரை மூச்சுக்குழாயில் வைக்கப்பட்ட குழாய் மூலம் சுவாச இயந்திரத்துடன் இணைக்க வேண்டும்." },
            moderate: { en: "Your relative is currently on a mechanical ventilator, which is doing much of the breathing work for them. They are sedated to keep them comfortable while the machine supports their lungs.", ta: "உங்கள் உறவினர் தற்போது மெக்கானிக்கல் வென்டிலேட்டரில் உள்ளார், இது அவருக்காக பெரும்பான்மையான சுவாசப் பணியை செய்கிறது." },
            severe: { en: "Your relative requires the highest levels of mechanical ventilator support to maintain their breathing. Their lungs are very severely affected and the machine is performing almost all of the work of breathing.", ta: "உங்கள் உறவினர் சுவாசத்தை பராமரிக்க மிக உயர்ந்த அளவிலான மெக்கானிக்கல் வென்டிலேட்டர் ஆதரவு தேவைப்படுகிறது." },
            critical: { en: "Despite the ventilator running at maximum capacity, your relative's oxygen levels remain critically low and carbon dioxide is accumulating in the blood. We are exploring additional rescue measures but must be transparent that the situation is extremely grave.", ta: "வென்டிலேட்டர் அதிகபட்ச திறனில் இயங்கியும், உங்கள் உறவினரின் ஆக்சிஜன் அளவு மிகவும் குறைவாகவும் இரத்தத்தில் கார்பன் டை ஆக்சைடு குவியவும் தொடர்கிறது." },
          },
          trajectory: {
            improving: { en: "Your relative's breathing has improved enough that we are beginning the process of gently reducing the ventilator support — a process called 'weaning'. This is a positive step.", ta: "உங்கள் உறவினரின் சுவாசம் போதுமான அளவு மேம்பட்டுள்ளதால் வென்டிலேட்டர் ஆதரவை மெதுவாக குறைக்கும் செயல்முறையை தொடங்குகிறோம்." },
            status_quo: { en: "Your relative's ventilator needs remain the same as yesterday. There is no immediate change in their requirement for breathing support.", ta: "உங்கள் உறவினரின் வென்டிலேட்டர் தேவைகள் நேற்றுடன் ஒப்பிடும்போது அதே அளவில் உள்ளன." },
            worsening: { en: "The ventilator support required has increased since yesterday, indicating the lungs are under more strain. We are adjusting the settings and medications.", ta: "நேற்றை விட தேவைப்படும் வென்டிலேட்டர் ஆதரவு அதிகரித்துள்ளது, நுரையீரல் அதிக அழுத்தத்தில் உள்ளது என்பதை இது குறிக்கிறது." },
            failing: { en: "The ventilator is no longer sufficient to maintain life-sustaining oxygen levels. We have reached the limits of what breathing machine support can achieve. This is a critical turning point.", ta: "வாழ்க்கையை தக்கவைக்கும் ஆக்சிஜன் அளவை பராமரிக்க வென்டிலேட்டர் இனி போதுமானதாக இல்லை." },
          },
        },
        {
          id: "cond_pneumonia",
          keyword: { en: "Pneumonia", ta: "நிமோனியா" },
          active: true,
          severity: {
            mild: { en: "Your relative has been diagnosed with pneumonia, a lung infection that is causing inflammation in the lung tissue. This is currently at a manageable stage and they are receiving appropriate antibiotics and oxygen support.", ta: "உங்கள் உறவினருக்கு நிமோனியா கண்டறியப்பட்டுள்ளது. இது தற்போது கட்டுப்படுத்தக்கூடிய கட்டத்தில் உள்ளது." },
            moderate: { en: "Your relative has a significant pneumonia affecting a large portion of the lungs. They need hospital-level care including intravenous antibiotics and close monitoring. Their recovery may take one to two weeks.", ta: "உங்கள் உறவினருக்கு நுரையீரலின் பெரும் பகுதியை பாதிக்கும் கணிசமான நிமோனியா உள்ளது. குணமடைய ஒன்று முதல் இரண்டு வாரங்கள் ஆகலாம்." },
            severe: { en: "Your relative has developed severe pneumonia affecting both lungs extensively. Their body is struggling to maintain enough oxygen even with breathing machine support. Severe pneumonia can be life-threatening.", ta: "உங்கள் உறவினருக்கு இரு நுரையீரல்களையும் விரிவாக பாதிக்கும் தீவிரமான நிமோனியா ஏற்பட்டுள்ளது." },
            critical: { en: "The pneumonia has caused overwhelming infection in the lungs, leading to complete respiratory failure. This is the most serious stage and requires the highest level of ICU care.", ta: "நிமோனியா நுரையீரலில் பரவலான தொற்றை ஏற்படுத்தி முழுமையான சுவாசச் செயலிழப்புக்கு வழிவகுத்துள்ளது." },
          },
          trajectory: {
            improving: { en: "The antibiotics are working and the lung infection is showing signs of improvement. Oxygen requirements are reducing gradually.", ta: "நுண்ணுயிர் எதிர்ப்பிகள் வேலை செய்கின்றன, நுரையீரல் தொற்று முன்னேற்றத்தின் அறிகுறிகளை காட்டுகிறது." },
            status_quo: { en: "The pneumonia has not worsened but has also not significantly improved. We continue antibiotics and will reassess.", ta: "நிமோனியா மோசமடையவில்லை ஆனால் கணிசமாக முன்னேறவும் இல்லை." },
            worsening: { en: "Despite antibiotics, the infection in the lungs is spreading and the breathing difficulty is increasing. We are changing or escalating antibiotic treatment.", ta: "நுண்ணுயிர் எதிர்ப்பிகள் இருந்தாலும், நுரையீரலில் தொற்று பரவி சுவாசக் கஷ்டம் அதிகரிக்கிறது." },
            failing: { en: "The lung infection is not responding to antibiotics and the lungs are failing despite maximum support. We are consulting infectious disease specialists.", ta: "நுரையீரல் தொற்று நுண்ணுயிர் எதிர்ப்பிகளுக்கு பதிலளிக்கவில்லை, அதிகபட்ச ஆதரவு இருந்தாலும் நுரையீரல்கள் செயலிழக்கின்றன." },
          },
        },
      ],
    },
    // ─────────────────────────────────────────────────────────────────────────────
// PERSISTENT CONTENT DB — loads from localStorage, falls back to default
// ─────────────────────────────────────────────────────────────────────────────
function loadContentDB() {
  try {
    const saved = localStorage.getItem("icu_content_db");
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_CONTENT_DB;
}

function saveContentDB(db) {
  try {
    localStorage.setItem("icu_content_db", JSON.stringify(db));
  } catch (e) {
    console.warn("Could not save content DB to localStorage:", e);
  }
}
    {
      id: "mod_cardiovascular",
      order: 2,
      label: { en: "Cardiovascular System / Shock", ta: "இருதய மண்டலம் / அதிர்ச்சி நிலை" },
      active: true,
      conditions: [
        {
          id: "cond_cardiogenic",
          keyword: { en: "Cardiogenic Shock – Heart Pump Failure", ta: "கார்டியோஜெனிக் ஷாக் – இதய பம்ப் செயலிழப்பு" },
          active: true,
          severity: {
            mild: { en: "Your relative's heart is not pumping blood as effectively as it should. This means the body's organs are not receiving adequate blood flow. They are receiving medications through the vein to support the heart.", ta: "உங்கள் உறவினரின் இதயம் இரத்தத்தை திறம்பட பம்ப் செய்யவில்லை. இதயத்தை ஆதரிக்க நரம்பு வழியாக மருந்துகள் வழங்கப்படுகின்றன." },
            moderate: { en: "Your relative's heart is significantly weakened and is failing to pump enough blood to meet the body's needs. This is called cardiogenic shock. They are on strong medications to support heart function.", ta: "உங்கள் உறவினரின் இதயம் கணிசமாக பலவீனமடைந்து உடலின் தேவைகளை பூர்த்தி செய்ய போதுமான இரத்தத்தை பம்ப் செய்யத் தவறுகிறது." },
            severe: { en: "Your relative's heart has severely failed and is unable to maintain blood pressure or circulation despite the strongest medications we can give. This is immediately life-threatening.", ta: "உங்கள் உறவினரின் இதயம் கடுமையாக செயலிழந்துள்ளது, நாங்கள் வழங்கக்கூடிய மிக வலிமையான மருந்துகள் இருந்தாலும் இரத்த அழுத்தம் அல்லது சுழற்சியை பராமரிக்க இயலவில்லை." },
            critical: { en: "The heart is in complete failure and is unable to sustain circulation to the vital organs. Multiple organ systems are beginning to fail as a consequence. This is the most critical phase of cardiogenic shock.", ta: "இதயம் முழுமையாக செயலிழந்து முக்கிய உறுப்புகளுக்கு சுழற்சியை தக்கவைக்க இயலவில்லை. இதன் விளைவாக பல உறுப்பு அமைப்புகள் செயலிழக்கத் தொடங்குகின்றன." },
          },
          trajectory: {
            improving: { en: "The heart's pumping function is showing early improvement with medications. Blood pressure is stabilising, which is an encouraging sign.", ta: "மருந்துகளால் இதயத்தின் பம்ப் செயல்பாடு ஆரம்ப முன்னேற்றத்தை காட்டுகிறது. இரத்த அழுத்தம் நிலைப்படுத்தப்படுகிறது." },
            status_quo: { en: "The heart function remains at the same level as yesterday, neither deteriorating nor improving. We continue medications and monitoring.", ta: "இதய செயல்பாடு நேற்றுடன் ஒப்பிடும்போது அதே நிலையில் உள்ளது." },
            worsening: { en: "The heart's pumping ability has declined further despite medications. We are adjusting treatment and may need to consider mechanical heart support devices.", ta: "மருந்துகள் இருந்தாலும் இதயத்தின் பம்பிங் திறன் மேலும் குறைந்துள்ளது." },
            failing: { en: "The heart is in terminal failure and is no longer responding to any treatment. We must now focus our conversation on comfort and dignity for your relative.", ta: "இதயம் இறுதி செயலிழப்பில் உள்ளது, எந்த சிகிச்சைக்கும் இனி பதிலளிக்கவில்லை." },
          },
        },
        {
          id: "cond_septic_shock",
          keyword: { en: "Septic Shock – Infection Causing Circulatory Failure", ta: "செப்டிக் ஷாக் – தொற்றால் சுழற்சி செயலிழப்பு" },
          active: true,
          severity: {
            mild: { en: "A serious infection in your relative's body is affecting the circulation. Although blood pressure is low, it is currently responding to fluids and medications. We are treating the infection aggressively with antibiotics.", ta: "உங்கள் உறவினரின் உடலில் ஒரு தீவிரமான தொற்று சுழற்சியை பாதிக்கிறது. நுண்ணுயிர் எதிர்ப்பிகளால் தொற்றை தீவிரமாக சிகிச்சை செய்கிறோம்." },
            moderate: { en: "Your relative is in septic shock. The infection has entered the bloodstream and caused the blood pressure to drop to dangerous levels. They are on intravenous fluids, antibiotics, and blood pressure-supporting medications.", ta: "உங்கள் உறவினர் செப்டிக் ஷாக்கில் உள்ளார். தொற்று இரத்த ஓட்டத்தில் நுழைந்து இரத்த அழுத்தத்தை ஆபத்தான அளவுக்கு வீழ்ச்சிக்கு கொண்டு வந்துள்ளது." },
            severe: { en: "Your relative is in severe septic shock and requires very strong blood pressure-supporting medications called vasopressors just to keep the circulation going. The infection is causing widespread damage.", ta: "உங்கள் உறவினர் தீவிரமான செப்டிக் ஷாக்கில் உள்ளார், சுழற்சியை தொடர வாஸோபிரஸ்சர்கள் என்ற மிக வலிமையான இரத்த அழுத்த ஆதரவு மருந்துகள் தேவைப்படுகின்றன." },
            critical: { en: "The septic shock is overwhelming the body. Despite maximum medication doses, the blood pressure remains critically low and organs are failing. This is a life-or-death situation.", ta: "செப்டிக் ஷாக் உடலை முழுமையாக பாதிக்கிறது. அதிகபட்ச மருந்து அளவுகள் இருந்தாலும் இரத்த அழுத்தம் மிகவும் குறைவாகவே உள்ளது." },
          },
          trajectory: {
            improving: { en: "The blood pressure is improving and the vasopressor medications are being gradually reduced. The infection appears to be responding to antibiotics.", ta: "இரத்த அழுத்தம் மேம்பட்டு வாஸோபிரஸ்சர் மருந்துகள் படிப்படியாக குறைக்கப்படுகின்றன." },
            status_quo: { en: "The blood pressure is being maintained on the current medications without significant change. The situation is being closely watched.", ta: "தற்போதைய மருந்துகளில் இரத்த அழுத்தம் கணிசமான மாற்றமின்றி பராமரிக்கப்படுகிறது." },
            worsening: { en: "More blood pressure medication is now required to maintain circulation, suggesting the shock is worsening. We are intensifying all treatment.", ta: "சுழற்சியை பராமரிக்க இப்போது அதிக இரத்த அழுத்த மருந்து தேவைப்படுகிறது, இது அதிர்ச்சி மோசமடைகிறது என்று சுட்டிக்காட்டுகிறது." },
            failing: { en: "The shock is progressing to a stage where blood pressure cannot be maintained despite the highest possible medication doses. The organs are failing rapidly.", ta: "அதிகபட்ச சாத்தியமான மருந்து அளவுகள் இருந்தாலும் இரத்த அழுத்தத்தை பராமரிக்க முடியாத நிலைக்கு அதிர்ச்சி முன்னேறுகிறது." },
          },
        },
      ],
    },
    {
      id: "mod_renal",
      order: 3,
      label: { en: "Renal (Kidney) System", ta: "சிறுநீரக மண்டலம்" },
      active: true,
      conditions: [
        {
          id: "cond_aki",
          keyword: { en: "Acute Kidney Injury (AKI)", ta: "கடுமையான சிறுநீரக காயம் (AKI)" },
          active: true,
          severity: {
            mild: { en: "Your relative's kidneys are not working as well as they normally do. This is called acute kidney injury. At this stage, the kidneys are still producing some urine and waste products are only mildly elevated.", ta: "உங்கள் உறவினரின் சிறுநீரகங்கள் பொதுவாக செய்வதை விட சரியாக வேலை செய்யவில்லை. இந்த கட்டத்தில் சிறுநீரகங்கள் இன்னும் சிறிது சிறுநீர் உற்பத்தி செய்கின்றன." },
            moderate: { en: "Your relative's kidneys are significantly affected and are not filtering the blood adequately. Waste products and toxins are building up in the bloodstream.", ta: "உங்கள் உறவினரின் சிறுநீரகங்கள் கணிசமாக பாதிக்கப்பட்டு இரத்தத்தை போதுமான அளவு வடிகட்டவில்லை." },
            severe: { en: "Your relative's kidneys have stopped working adequately and are unable to filter waste products or regulate the body's fluid balance. We are now considering kidney replacement therapy such as dialysis.", ta: "உங்கள் உறவினரின் சிறுநீரகங்கள் போதுமான அளவு வேலை செய்வதை நிறுத்திவிட்டன. டயாலிசிஸ் போன்ற சிறுநீரக மாற்று சிகிச்சையை இப்போது பரிசீலிக்கிறோம்." },
            critical: { en: "The kidneys have essentially stopped functioning. Fluid, potassium and toxic waste are at dangerous levels in the blood. Dialysis is urgently needed to keep the body in balance.", ta: "சிறுநீரகங்கள் அடிப்படையில் செயல்படுவதை நிறுத்திவிட்டன. உடல் சமநிலையை பராமரிக்க டயாலிசிஸ் அவசரமாக தேவைப்படுகிறது." },
          },
          trajectory: {
            improving: { en: "The kidneys are showing early signs of recovery. Urine output is increasing and the blood waste product levels are starting to come down.", ta: "சிறுநீரகங்கள் குணமடைவதற்கான ஆரம்ப அறிகுறிகளை காட்டுகின்றன. சிறுநீர் வெளியீடு அதிகரிக்கிறது." },
            status_quo: { en: "The kidney function has remained the same over the past day. There is no further deterioration but recovery has not yet begun.", ta: "கடந்த ஒரு நாளில் சிறுநீரக செயல்பாடு அதே அளவில் உள்ளது." },
            worsening: { en: "The kidneys are producing less urine and the blood waste levels are rising despite our management. We are urgently reviewing all possible causes and treatment options.", ta: "மேலாண்மை இருந்தாலும் சிறுநீரகங்கள் குறைவான சிறுநீரை உற்பத்தி செய்கின்றன, இரத்த கழிவு அளவுகள் உயர்கின்றன." },
            failing: { en: "The kidneys have stopped functioning and are not expected to recover on their own. Long-term dialysis may be required if the overall condition allows.", ta: "சிறுநீரகங்கள் செயல்படுவதை நிறுத்திவிட்டன, தனியாக குணமடைவு எதிர்பார்க்கப்படவில்லை." },
          },
        },
      ],
    },
    {
      id: "mod_neuro",
      order: 4,
      label: { en: "Neurological System / Encephalopathy", ta: "நரம்பியல் மண்டலம் / மூளை பாதிப்பு" },
      active: true,
      conditions: [
        {
          id: "cond_enceph",
          keyword: { en: "Encephalopathy – Acute Brain Dysfunction", ta: "என்செஃபலோபதி – கடுமையான மூளை செயலிழப்பு" },
          active: true,
          severity: {
            mild: { en: "Your relative is showing signs of mild confusion, disorientation, or reduced attention. This brain dysfunction is related to their underlying illness and is not due to a stroke or direct brain damage.", ta: "உங்கள் உறவினர் லேசான குழப்பம், திசை தெரியாமை அல்லது குறைந்த கவனத்தின் அறிகுறிகளை காட்டுகிறார்." },
            moderate: { en: "Your relative is significantly confused and is unable to follow conversations or recognise family members clearly at times. This level of brain dysfunction is a result of the serious illness affecting the brain indirectly.", ta: "உங்கள் உறவினர் கணிசமாக குழம்பியுள்ளார், உரையாடல்களை பின்தொடர முடியவில்லை அல்லது சில நேரங்களில் குடும்பத்தினரை தெளிவாக அடையாளம் காண முடியவில்லை." },
            severe: { en: "Your relative is deeply confused, agitated, or largely unresponsive to the environment. The brain is profoundly affected by the illness. Recovery of brain function can be slow and in some cases may be incomplete.", ta: "உங்கள் உறவினர் ஆழமாக குழம்பியுள்ளார், கிளர்ச்சியாக உள்ளார், அல்லது சூழலுக்கு பெரும்பாலும் பதிலளிக்கவில்லை." },
            critical: { en: "Your relative is deeply unconscious and showing minimal or no response to any stimulation. The brain is critically affected and we are investigating the causes urgently. At this level of brain dysfunction, the risk to life is very high.", ta: "உங்கள் உறவினர் ஆழமான மயக்கத்தில் உள்ளார், எந்த தூண்டுதலுக்கும் குறைந்தபட்ச அல்லது எந்த பதிலும் இல்லை." },
          },
          trajectory: {
            improving: { en: "Your relative appears more alert today and is beginning to recognise faces and respond to simple questions. The brain function is showing early signs of recovery.", ta: "உங்கள் உறவினர் இன்று அதிக விழிப்புடன் தோன்றுகிறார், முகங்களை அடையாளம் காணவும் எளிய கேள்விகளுக்கு பதிலளிக்கவும் தொடங்கிறார்." },
            status_quo: { en: "The level of brain function remains the same as yesterday. The confusion has not worsened, but there is no significant improvement yet.", ta: "மூளை செயல்பாட்டின் அளவு நேற்றுடன் ஒப்பிடும்போது அதே அளவில் உள்ளது." },
            worsening: { en: "Your relative's level of consciousness has declined further today. They are harder to rouse and less responsive than yesterday. We are investigating the reason urgently.", ta: "உங்கள் உறவினரின் நனவு அளவு இன்று மேலும் குறைந்துள்ளது." },
            failing: { en: "Your relative has lost all meaningful response to the surrounding environment. The brain function is critically impaired. We are working to understand whether this is reversible.", ta: "உங்கள் உறவினர் சுற்றுப்புற சூழலுக்கு அனைத்து அர்த்தமுள்ள பதிலையும் இழந்துள்ளார்." },
          },
        },
        {
          id: "cond_stroke",
          keyword: { en: "Stroke / Acute Brain Injury", ta: "பக்கவாதம் / கடுமையான மூளை காயம்" },
          active: true,
          severity: {
            mild: { en: "Your relative has had a stroke, meaning part of the brain has been affected by either a blocked blood vessel or bleeding in the brain. We have started appropriate treatment and are monitoring their brain function closely.", ta: "உங்கள் உறவினருக்கு பக்கவாதம் வந்துள்ளது, அதாவது மூளையின் ஒரு பகுதி தடைப்பட்ட இரத்த நாளம் அல்லது மூளையில் இரத்தக்கசிவு காரணமாக பாதிக்கப்பட்டுள்ளது." },
            moderate: { en: "Your relative has suffered a significant stroke affecting important parts of the brain. This has caused noticeable weakness, speech difficulties, or loss of function on one side of the body. Recovery is possible but may take several months.", ta: "உங்கள் உறவினர் மூளையின் முக்கியமான பகுதிகளை பாதிக்கும் குறிப்பிடத்தக்க பக்கவாதத்தால் பாதிக்கப்பட்டுள்ளார்." },
            severe: { en: "Your relative has suffered a severe stroke with extensive brain damage. The areas affected are critical for basic functions such as breathing, swallowing, and consciousness.", ta: "உங்கள் உறவினர் விரிவான மூளை சேதத்துடன் கடுமையான பக்கவாதத்தால் பாதிக்கப்பட்டுள்ளார்." },
            critical: { en: "The stroke has caused catastrophic brain damage. The brain's ability to maintain basic functions is severely compromised. We are performing tests to fully assess brain function.", ta: "பக்கவாதம் பேரழிவு மூளை சேதத்தை ஏற்படுத்தியுள்ளது. அடிப்படை செயல்பாடுகளை பராமரிக்கும் மூளையின் திறன் தீவிரமாக பாதிக்கப்பட்டுள்ளது." },
          },
          trajectory: {
            improving: { en: "There are encouraging signs that the brain is beginning to recover. Your relative is more alert and showing some return of function since the stroke.", ta: "மூளை குணமடையத் தொடங்குகிறது என்ற ஊக்கமளிக்கும் அறிகுறிகள் உள்ளன." },
            status_quo: { en: "The brain function has remained stable without further deterioration. Recovery, if any, will depend on the brain's ability to adapt over time.", ta: "மூளை செயல்பாடு மேலும் சரிவின்றி நிலையாக உள்ளது." },
            worsening: { en: "The brain function appears to be declining, which may indicate swelling of the brain after the stroke or extension of the bleed. Urgent scans are being arranged.", ta: "மூளை செயல்பாடு குறைகிறது என்று தோன்றுகிறது, இது பக்கவாதத்திற்கு பிறகு மூளை வீக்கம் அல்லது இரத்தக்கசிவு விரிவடைவதை குறிக்கலாம்." },
            failing: { en: "The brain has sustained damage beyond what it can recover from. We need to have an important conversation about brain death assessment and what this means for the next steps in care.", ta: "மூளை குணமடைய முடியாத அளவு சேதமடைந்துள்ளது." },
          },
        },
      ],
    },
    {
      id: "mod_hepatic",
      order: 5,
      label: { en: "Hepatic (Liver) System", ta: "கல்லீரல் மண்டலம்" },
      active: true,
      conditions: [
        {
          id: "cond_liver",
          keyword: { en: "Acute Liver Failure", ta: "கடுமையான கல்லீரல் செயலிழப்பு" },
          active: true,
          severity: {
            mild: { en: "Your relative's liver is not functioning as well as it should. Blood tests are showing elevated liver enzymes, which means liver cells are under stress. We are investigating the cause and providing supportive treatment.", ta: "உங்கள் உறவினரின் கல்லீரல் சரியாக செயல்படவில்லை. இரத்த பரிசோதனைகள் உயர்ந்த கல்லீரல் என்சைம்களை காட்டுகின்றன." },
            moderate: { en: "Your relative's liver has developed significant failure. It is struggling to perform its vital jobs including clearing toxins, producing clotting factors, and maintaining blood sugar. They are developing jaundice.", ta: "உங்கள் உறவினரின் கல்லீரல் கணிசமான செயலிழப்பை வளர்த்துள்ளது. மஞ்சள் காமாலை (தோல் மற்றும் கண்கள் மஞ்சளாவது) வருகிறது." },
            severe: { en: "Your relative's liver has severely failed and is no longer able to carry out its essential functions. Toxins are accumulating in the blood causing brain dysfunction. Blood clotting is dangerously impaired.", ta: "உங்கள் உறவினரின் கல்லீரல் கடுமையாக செயலிழந்துள்ளது. நச்சுகள் இரத்தத்தில் குவிந்து மூளை செயலிழப்பை ஏற்படுத்துகின்றன." },
            critical: { en: "The liver has completely failed. All of its vital functions have collapsed. A liver transplant may be the only option for survival, and we are urgently assessing whether this is possible.", ta: "கல்லீரல் முழுமையாக செயலிழந்துள்ளது. அதன் அனைத்து முக்கியமான செயல்பாடுகளும் சரிந்துவிட்டன." },
          },
          trajectory: {
            improving: { en: "The liver blood tests are showing improvement and the signs of liver failure are beginning to reduce. This is an encouraging trend.", ta: "கல்லீரல் இரத்த பரிசோதனைகள் முன்னேற்றத்தை காட்டுகின்றன, கல்லீரல் செயலிழப்பின் அறிகுறிகள் குறையத் தொடங்குகின்றன." },
            status_quo: { en: "Liver function has remained the same today. We are continuing supportive management while monitoring closely for any change.", ta: "கல்லீரல் செயல்பாடு இன்று அதே அளவில் உள்ளது." },
            worsening: { en: "The liver failure is progressing despite our treatment. The jaundice is deepening and the brain function is being increasingly affected.", ta: "சிகிச்சை இருந்தாலும் கல்லீரல் செயலிழப்பு முன்னேறுகிறது. மஞ்சள் காமாலை ஆழமாகிறது." },
            failing: { en: "The liver has progressed to end-stage failure and is no longer responding to any treatment. We need to have an urgent, compassionate conversation about the goals of care.", ta: "கல்லீரல் இறுதி கட்ட செயலிழப்பிற்கு முன்னேறியுள்ளது, எந்த சிகிச்சைக்கும் இனி பதிலளிக்கவில்லை." },
          },
        },
      ],
    },
    {
      id: "mod_haem",
      order: 6,
      label: { en: "Haematology / Coagulopathy", ta: "இரத்த அணு மண்டலம் / இரத்த உறைதல் பிரச்சனை" },
      active: true,
      conditions: [
        {
          id: "cond_coag",
          keyword: { en: "Coagulopathy – Blood Clotting Failure", ta: "கோகுலோபதி – இரத்த உறைதல் செயலிழப்பு" },
          active: true,
          severity: {
            mild: { en: "Your relative's blood is not clotting as well as it should. This means there is a risk of bleeding from small injuries or procedures. We are monitoring the clotting tests closely.", ta: "உங்கள் உறவினரின் இரத்தம் சரியாக உறையவில்லை. அதாவது சிறிய காயங்கள் அல்லது செயல்முறைகளிலிருந்து இரத்தப்போக்கு அபாயம் உள்ளது." },
            moderate: { en: "Your relative has a significant clotting disorder, meaning their blood is struggling to stop bleeding when it should. We are giving them clotting factors and blood products as replacement treatment.", ta: "உங்கள் உறவினருக்கு கணிசமான உறைதல் குறைபாடு உள்ளது. மாற்று சிகிச்சையாக உறைதல் காரணிகள் மற்றும் இரத்தப் பொருட்கள் வழங்குகிறோம்." },
            severe: { en: "Your relative's blood clotting system has severely failed. They are bleeding from multiple sites and the body is consuming clotting factors faster than we can replace them. This is called DIC.", ta: "உங்கள் உறவினரின் இரத்த உறைதல் அமைப்பு கடுமையாக செயலிழந்துள்ளது. இது DIC (பரவலான நுண்குழல் உறைதல்) என்ற உயிருக்கு அபாயகரமான அவசரநிலை." },
            critical: { en: "The clotting failure is now at a catastrophic level and internal bleeding is occurring in multiple organs. Despite blood transfusions and clotting factor replacement, we are struggling to maintain control.", ta: "உறைதல் செயலிழப்பு தற்போது பேரழிவு அளவில் உள்ளது, பல உறுப்புகளில் உள்ளுறுப்பு இரத்தப்போக்கு ஏற்படுகிறது." },
          },
          trajectory: {
            improving: { en: "The clotting tests are improving and the blood products are working to restore the balance. The bleeding risk is reducing.", ta: "உறைதல் பரிசோதனைகள் மேம்படுகின்றன, இரத்தப் பொருட்கள் சமநிலையை மீட்டெடுக்க வேலை செய்கின்றன." },
            status_quo: { en: "The clotting ability is maintained at its current level with ongoing blood product support. No further deterioration, but normalisation has not yet occurred.", ta: "தொடர்ந்து இரத்தப் பொருள் ஆதரவுடன் உறைதல் திறன் தற்போதைய அளவில் பராமரிக்கப்படுகிறது." },
            worsening: { en: "The clotting disorder is worsening. More blood products are being used and the tests are showing a declining ability to clot effectively.", ta: "உறைதல் குறைபாடு மோசமடைகிறது. அதிக இரத்தப் பொருட்கள் பயன்படுத்தப்படுகின்றன." },
            failing: { en: "The blood clotting system has completely collapsed and bleeding cannot be controlled. This has become a rapidly life-threatening complication.", ta: "இரத்த உறைதல் அமைப்பு முழுமையாக சரிந்துவிட்டது, இரத்தப்போக்கை கட்டுப்படுத்த முடியவில்லை." },
          },
        },
      ],
    },
    {
      id: "mod_sepsis",
      order: 7,
      label: { en: "Sepsis and Infection", ta: "செப்சிஸ் மற்றும் தொற்று" },
      active: true,
      conditions: [
        {
          id: "cond_sepsis",
          keyword: { en: "Sepsis – Life-Threatening Infection Response", ta: "செப்சிஸ் – உயிருக்கு அபாயகரமான தொற்று பதில்" },
          active: true,
          severity: {
            mild: { en: "Your relative's body is responding to a serious infection. This early stage of sepsis means the infection is causing changes to temperature, heart rate and blood pressure. We have started antibiotics and fluids.", ta: "உங்கள் உறவினரின் உடல் ஒரு தீவிர தொற்றுக்கு பதிலளிக்கிறது. நுண்ணுயிர் எதிர்ப்பிகள் மற்றும் திரவங்களை தொடங்கி தொற்றின் மூலத்தை கண்டுபிடித்து சிகிச்சை செய்ய விரைவாக வேலை செய்கிறோம்." },
            moderate: { en: "Your relative has sepsis, which means the infection is causing the body's immune system to overreact and is starting to affect the function of vital organs. They are in the ICU receiving intensive treatment.", ta: "உங்கள் உறவினருக்கு செப்சிஸ் உள்ளது. ICU-வில் தீவிர நுண்ணுயிர் எதிர்ப்பி சிகிச்சை மற்றும் உறுப்பு ஆதரவு பெறுகிறார்." },
            severe: { en: "Your relative is in severe sepsis with multiple organ systems now being affected. Their blood pressure, kidneys, liver and lungs are all under significant stress. We are providing maximum intensive care support.", ta: "உங்கள் உறவினர் பரவலான தொற்று பதிலால் பல உறுப்பு அமைப்புகள் பாதிக்கப்பட்டு தீவிரமான செப்சிஸில் உள்ளார்." },
            critical: { en: "Your relative is in septic shock, which is the most severe stage of sepsis. The infection and the body's response to it have caused a critical collapse of circulation and multiple organ failure.", ta: "உங்கள் உறவினர் செப்டிக் ஷாக்கில் உள்ளார், இது செப்சிஸின் மிகவும் தீவிரமான கட்டம்." },
          },
          trajectory: {
            improving: { en: "The infection markers in the blood are reducing and the organs are showing signs of responding to treatment. This is a hopeful trend.", ta: "இரத்தத்தில் தொற்று குறிப்பான்கள் குறைகின்றன, உறுப்புகள் சிகிச்சைக்கு பதிலளிப்பதற்கான அறிகுறிகளை காட்டுகின்றன." },
            status_quo: { en: "The infection markers remain elevated but are not climbing further. The organs are holding steady on current treatment.", ta: "தொற்று குறிப்பான்கள் உயர்வாகவே உள்ளன, ஆனால் மேலும் உயரவில்லை." },
            worsening: { en: "Despite antibiotics, the signs of infection are worsening and spreading to more organ systems. We are urgently reviewing the antibiotic choices.", ta: "நுண்ணுயிர் எதிர்ப்பிகள் இருந்தாலும், தொற்றின் அறிகுறிகள் மோசமடைந்து அதிக உறுப்பு அமைப்புகளுக்கு பரவுகின்றன." },
            failing: { en: "The infection is overwhelming the body's ability to respond to any treatment. The organs are failing at a rate that cannot be reversed. We must speak honestly with you about what this means.", ta: "தொற்று எந்த சிகிச்சைக்கும் பதிலளிக்கும் உடலின் திறனை முழுவதுமாக பாதிக்கிறது." },
          },
        },
      ],
    },
    {
      id: "mod_metabolic",
      order: 8,
      label: { en: "Metabolic / Endocrine Disturbances", ta: "வளர்சிதை மாற்றம் / நாளமில்லா சுரப்பி பிரச்சனைகள்" },
      active: true,
      conditions: [
        {
          id: "cond_dka",
          keyword: { en: "Diabetic Ketoacidosis (DKA) / Hyperosmolar State", ta: "நீரிழிவு கீட்டோஅமிலமயம் (DKA) / ஹைப்பர்ஓஸ்மோலார் நிலை" },
          active: true,
          severity: {
            mild: { en: "Your relative has developed a dangerous complication of diabetes where the blood sugar has risen to a very high level, causing chemical imbalances in the body. We are treating this with insulin, fluids, and careful monitoring.", ta: "உங்கள் உறவினருக்கு நீரிழிவு நோயின் ஆபத்தான சிக்கல் ஏற்பட்டுள்ளது. இன்சுலின், திரவங்கள் மற்றும் கவனமான கண்காணிப்புடன் சிகிச்சை செய்கிறோம்." },
            moderate: { en: "Your relative is severely dehydrated and their blood chemistry is significantly disturbed due to uncontrolled blood sugar. They need intensive monitoring and treatment in the ICU.", ta: "உங்கள் உறவினர் கடுமையாக நீர்ச்சத்து இழந்துள்ளார். ICU-வில் தீவிர கண்காணிப்பு மற்றும் சிகிச்சை தேவைப்படுகிறது." },
            severe: { en: "The metabolic disturbance is so severe that it is affecting the brain and other vital organs. Blood sugar levels are extremely high and the blood has become very acidic. Without urgent treatment, this can cause loss of consciousness.", ta: "வளர்சிதை மாற்ற தொந்தரவு மிகவும் தீவிரமாக மூளை மற்றும் பிற முக்கிய உறுப்புகளை பாதிக்கிறது." },
            critical: { en: "The metabolic crisis is at a life-threatening level despite initial treatment. The combination of extreme blood sugar, severe acid-base disturbance and dehydration is causing critical organ dysfunction.", ta: "ஆரம்ப சிகிச்சை இருந்தாலும் வளர்சிதை மாற்ற நெருக்கடி உயிருக்கு அபாயகரமான அளவில் உள்ளது." },
          },
          trajectory: {
            improving: { en: "The blood sugar and acid-base balance are correcting with treatment. Your relative is becoming more alert and stable.", ta: "இரத்த சர்க்கரை மற்றும் அமில-காரத் சமநிலை சிகிச்சையால் சரியாகிறது." },
            status_quo: { en: "The metabolic parameters are stable on current treatment, though not yet normalised. We continue careful monitoring.", ta: "வளர்சிதை மாற்ற அளவுருக்கள் தற்போதைய சிகிச்சையில் நிலையாக உள்ளன." },
            worsening: { en: "Despite treatment, the blood sugar remains uncontrolled and the metabolic disturbance is worsening. We are adjusting insulin and fluid treatment.", ta: "சிகிச்சை இருந்தாலும் இரத்த சர்க்கரை கட்டுப்படுத்தப்படாமல் உள்ளது." },
            failing: { en: "The metabolic imbalance is not responding to maximum treatment and is causing progressive organ damage. We must now discuss what is achievable and what the priorities of care should be.", ta: "வளர்சிதை மாற்ற ஏற்றத்தாழ்வு அதிகபட்ச சிகிச்சைக்கு பதிலளிக்கவில்லை." },
          },
        },
      ],
    },
    {
      id: "mod_airway",
      order: 9,
      label: { en: "Airway Issues", ta: "காற்றுப்பாதை பிரச்சனைகள்" },
      active: true,
      conditions: [
        {
          id: "cond_airway",
          keyword: { en: "Airway Compromise", ta: "காற்றுப்பாதை சமரசம்" },
          active: true,
          severity: {
            mild: { en: "Your relative is having some difficulty keeping their airway open and clear. This may be due to reduced consciousness, secretions, or swelling. We are taking measures to keep the airway safe and are monitoring closely.", ta: "உங்கள் உறவினர் காற்றுப்பாதையை திறந்தும் தெளிவாகவும் வைத்திருக்க சிறிது கஷ்டப்படுகிறார்." },
            moderate: { en: "Your relative's ability to maintain a safe airway is significantly compromised. A breathing tube or airway device has been placed to keep the airway safe.", ta: "உங்கள் உறவினரின் பாதுகாப்பான காற்றுப்பாதையை பராமரிக்கும் திறன் கணிசமாக பாதிக்கப்பட்டுள்ளது." },
            severe: { en: "Your relative's airway has become severely compromised, creating an immediate risk to life. Emergency measures were required to secure the airway. We have placed a breathing tube and they are now on a ventilator.", ta: "உங்கள் உறவினரின் காற்றுப்பாதை கடுமையாக பாதிக்கப்பட்டு உயிருக்கு உடனடி ஆபத்தை உருவாக்கியது." },
            critical: { en: "Securing the airway was extremely difficult due to swelling, bleeding or anatomical reasons. Multiple attempts were required and there was a critical period of low oxygen during this process.", ta: "வீக்கம், இரத்தப்போக்கு அல்லது உடற்கூறியல் காரணங்களால் காற்றுப்பாதையை பாதுகாப்பது மிகவும் கஷ்டமாக இருந்தது." },
          },
          trajectory: {
            improving: { en: "The airway is now secured and stable. We are working toward removing the breathing tube when the condition allows.", ta: "காற்றுப்பாதை இப்போது பாதுகாக்கப்பட்டு நிலையாக உள்ளது." },
            status_quo: { en: "The airway remains secured with a breathing tube. There is no immediate change and we continue supportive care.", ta: "காற்றுப்பாதை சுவாசக் குழாயால் பாதுகாக்கப்பட்டுள்ளது." },
            worsening: { en: "The airway is becoming more difficult to manage despite the breathing tube in place. Swelling or secretions are making ventilation harder.", ta: "சுவாசக் குழாய் இருந்தாலும் காற்றுப்பாதையை நிர்வகிப்பது மேலும் கஷ்டமாகிறது." },
            failing: { en: "The airway cannot be maintained safely even with the breathing tube and ventilator. The swelling or damage is too extensive for conventional measures to manage.", ta: "சுவாசக் குழாய் மற்றும் வென்டிலேட்டர் இருந்தாலும் காற்றுப்பாதையை பாதுகாப்பாக பராமரிக்க முடியவில்லை." },
          },
        },
      ],
    },
    {
      id: "mod_trach",
      order: 10,
      label: { en: "Need for Tracheostomy", ta: "தொண்டை துளை (Tracheostomy) தேவை" },
      active: true,
      conditions: [
        {
          id: "cond_trach",
          keyword: { en: "Tracheostomy – Surgical Airway", ta: "தொண்டை துளை – அறுவை சிகிச்சை காற்றுப்பாதை" },
          active: true,
          severity: {
            mild: { en: "We are recommending a tracheostomy for your relative. This is a small surgical opening made in the neck to create a direct airway to the windpipe. It helps make breathing more comfortable and allows the mouth to heal.", ta: "உங்கள் உறவினருக்கு தொண்டை துளை (tracheostomy) பரிந்துரைக்கிறோம். இது சுவாசக் குழாயில் நேரடி காற்றுப்பாதை உருவாக்க கழுத்தில் செய்யப்படும் சிறிய அறுவை சிகிச்சை திறப்பு." },
            moderate: { en: "Your relative requires a tracheostomy because they have been on a breathing machine for an extended period. A tracheostomy is safer and more comfortable for prolonged ventilation.", ta: "உங்கள் உறவினர் நீண்ட காலமாக சுவாச இயந்திரத்தில் இருப்பதால் தொண்டை துளை தேவைப்படுகிறது." },
            severe: { en: "Your relative needs a tracheostomy urgently because their airway cannot be safely maintained in any other way. The procedure will be performed by an experienced team.", ta: "உங்கள் உறவினரின் காற்றுப்பாதையை வேறு எந்த வழியிலும் பாதுகாப்பாக பராமரிக்க முடியாததால் தொண்டை துளை அவசரமாக தேவைப்படுகிறது." },
            critical: { en: "An emergency tracheostomy was required to save your relative's life when conventional airway management failed. This was a life-saving intervention performed under very difficult circumstances.", ta: "வழக்கமான காற்றுப்பாதை மேலாண்மை தோல்வியடைந்தபோது உங்கள் உறவினரின் உயிரை காப்பாற்ற அவசர தொண்டை துளை தேவைப்பட்டது." },
          },
          trajectory: {
            improving: { en: "The tracheostomy site is healing well and your relative is tolerating it comfortably. We are working on reducing the breathing support gradually.", ta: "தொண்டை துளை இடம் நன்றாக குணமடைகிறது, உங்கள் உறவினர் அதை வசதியாக சகித்துக்கொள்கிறார்." },
            status_quo: { en: "The tracheostomy is functioning well and keeping the airway clear. The breathing support needs remain the same at this stage.", ta: "தொண்டை துளை சரியாக செயல்படுகிறது, காற்றுப்பாதையை தெளிவாக வைக்கிறது." },
            worsening: { en: "There is a complication at the tracheostomy site such as infection, bleeding or blockage, which requires treatment.", ta: "தொண்டை துளை இடத்தில் தொற்று, இரத்தப்போக்கு அல்லது அடைப்பு போன்ற சிக்கல் உள்ளது." },
            failing: { en: "Despite the tracheostomy, the airway cannot be maintained adequately. The underlying condition has progressed beyond the point where the airway tube can help.", ta: "தொண்டை துளை இருந்தாலும் காற்றுப்பாதையை போதுமான அளவு பராமரிக்க முடியவில்லை." },
          },
        },
      ],
    },
    {
      id: "mod_weaning",
      order: 11,
      label: { en: "Weaning Failure", ta: "சுவாச இயந்திர நிறுத்தல் தோல்வி" },
      active: true,
      conditions: [
        {
          id: "cond_weaning",
          keyword: { en: "Weaning Failure – Unable to Come Off the Ventilator", ta: "வீனிங் தோல்வி – வென்டிலேட்டரை விட இயலாமை" },
          active: true,
          severity: {
            mild: { en: "We attempted to reduce the breathing machine support for your relative today but they were not able to breathe adequately on their own. This is called weaning failure. It does not mean recovery is impossible.", ta: "இன்று உங்கள் உறவினருக்கான சுவாச இயந்திர ஆதரவை குறைக்க முயற்சித்தோம், ஆனால் இந்த நேரத்தில் தனியாக போதுமான அளவு சுவாசிக்க இயலவில்லை." },
            moderate: { en: "Multiple attempts to remove your relative from the ventilator have been unsuccessful. The lungs are recovering slowly and the breathing muscles remain weak. We are working on a structured rehabilitation programme.", ta: "வென்டிலேட்டரிலிருந்து உங்கள் உறவினரை அகற்றும் பல முயற்சிகள் வெற்றியடையவில்லை." },
            severe: { en: "Your relative has repeatedly failed to breathe independently and appears to be dependent on the ventilator for the foreseeable future. We are considering a long-term airway plan such as a tracheostomy.", ta: "உங்கள் உறவினர் மீண்டும் மீண்டும் சுதந்திரமாக சுவாசிக்கத் தவறியுள்ளார், எதிர்கால காலத்திற்கு வென்டிலேட்டரில் சார்ந்திருப்பதாக தெரிகிறது." },
            critical: { en: "Your relative is unable to sustain any spontaneous breathing without full ventilator support. Long-term ventilation or end-of-life care planning may be the only realistic options now.", ta: "முழுமையான வென்டிலேட்டர் ஆதரவு இல்லாமல் உங்கள் உறவினரால் எந்த தன்னிச்சையான சுவாசத்தையும் தக்கவைக்க முடியவில்லை." },
          },
          trajectory: {
            improving: { en: "Your relative is tolerating longer periods of reduced ventilator support each day. We are optimistic that weaning may be successful with continued effort.", ta: "உங்கள் உறவினர் ஒவ்வொரு நாளும் குறைந்த வென்டிலேட்டர் ஆதரவின் நீண்ட காலங்களை சகித்துக்கொள்கிறார்." },
            status_quo: { en: "The weaning attempts have not progressed further. The ventilator requirements are unchanged from yesterday.", ta: "வீனிங் முயற்சிகள் மேலும் முன்னேறவில்லை. நேற்றிலிருந்து வென்டிலேட்டர் தேவைகள் மாறாமல் உள்ளன." },
            worsening: { en: "The weaning attempts are causing your relative distress and their oxygen levels are dropping when support is reduced. We have returned to full ventilator support for now.", ta: "வீனிங் முயற்சிகள் உங்கள் உறவினருக்கு கஷ்டத்தை ஏற்படுத்துகின்றன." },
            failing: { en: "All weaning strategies have been exhausted without success. Ventilator dependence appears permanent at this stage and long-term planning is needed.", ta: "அனைத்து வீனிங் உத்திகளும் வெற்றியின்றி தீர்ந்துவிட்டன. இந்த கட்டத்தில் வென்டிலேட்டர் சார்பு நிரந்தரமாக தெரிகிறது." },
          },
        },
      ],
    },
    {
      id: "mod_decann",
      order: 12,
      label: { en: "Decannulation Failure", ta: "குழாய் அகற்றல் தோல்வி" },
      active: true,
      conditions: [
        {
          id: "cond_decann",
          keyword: { en: "Unable to Remove Tracheostomy Tube", ta: "தொண்டை துளை குழாய் அகற்றல் இயலாமை" },
          active: true,
          severity: {
            mild: { en: "We attempted to remove your relative's tracheostomy tube today as they appeared ready, but they experienced difficulty breathing and the tube needed to be reinserted. This is a temporary setback.", ta: "இன்று உங்கள் உறவினர் தயாராக இருப்பதாக தோன்றியதால் தொண்டை துளை குழாயை அகற்ற முயற்சித்தோம், ஆனால் சுவாசிக்க கஷ்டம் ஏற்பட்டதால் குழாயை மீண்டும் செருகவேண்டியதிருந்தது." },
            moderate: { en: "After multiple attempts, your relative has not been able to maintain safe breathing without the tracheostomy tube. The airway or the breathing muscles are not yet strong enough.", ta: "பல முயற்சிகளுக்குப் பிறகும், தொண்டை துளை குழாய் இல்லாமல் பாதுகாப்பான சுவாசத்தை பராமரிக்க உங்கள் உறவினரால் இயலவில்லை." },
            severe: { en: "Decannulation appears to be very challenging due to significant weakness, secretion management problems, or airway damage. Your relative may require the tracheostomy for an extended period.", ta: "கணிசமான பலவீனம், சுரப்பு மேலாண்மை பிரச்சனைகள் அல்லது காற்றுப்பாதை சேதம் காரணமாக குழாய் அகற்றல் மிகவும் சவாலாக தெரிகிறது." },
            critical: { en: "The tracheostomy tube is now essential for your relative's survival and cannot be safely removed. Long-term tracheostomy care will be required.", ta: "தொண்டை துளை குழாய் இப்போது உங்கள் உறவினரின் உயிர்வாழ்விற்கு இன்றியமையாதது, பாதுகாப்பாக அகற்ற முடியாது." },
          },
          trajectory: {
            improving: { en: "Your relative is tolerating voice trials and capping the tracheostomy tube for increasing periods, which is a positive step toward removal.", ta: "உங்கள் உறவினர் குரல் சோதனைகளை சகித்துக்கொண்டு அதிகரிக்கும் காலங்களுக்கு தொண்டை துளை குழாயை மூடுகிறார்." },
            status_quo: { en: "The tracheostomy remains in place and plans for decannulation are on hold while we continue rehabilitation.", ta: "தொண்டை துளை தொடர்ந்து உள்ளது, மறுவாழ்வை தொடரும்போது குழாய் அகற்றல் திட்டங்கள் நிறுத்தி வைக்கப்பட்டுள்ளன." },
            worsening: { en: "Attempts to reduce dependence on the tracheostomy have been unsuccessful and the need for it appears to be increasing rather than reducing.", ta: "தொண்டை துளையின் சார்பை குறைக்கும் முயற்சிகள் வெற்றியடையவில்லை." },
            failing: { en: "The tracheostomy is now a permanent fixture and your relative's care going forward will require ongoing airway management at home or in a long-term care facility.", ta: "தொண்டை துளை இப்போது நிரந்தர நிலையாக உள்ளது." },
          },
        },
      ],
    },
    {
      id: "mod_immunity",
      order: 13,
      label: { en: "Immunity Status", ta: "நோய் எதிர்ப்பு சக்தி நிலை" },
      active: true,
      conditions: [
        {
          id: "cond_immuno",
          keyword: { en: "Immunocompromised State – Weakened Immune System", ta: "நோயெதிர்ப்பு பலவீன நிலை" },
          active: true,
          severity: {
            mild: { en: "Your relative's immune system is not functioning at full strength. This may be due to medications, an underlying illness, or a medical condition affecting the immune system. They are more vulnerable to infections.", ta: "உங்கள் உறவினரின் நோயெதிர்ப்பு அமைப்பு முழு வலிமையில் செயல்படவில்லை. அவர் தொற்றுகளுக்கு அதிக பாதிப்பு உடையவர்." },
            moderate: { en: "Your relative has a significantly weakened immune system. They are at high risk of developing unusual or severe infections. We are taking protective measures including isolation precautions.", ta: "உங்கள் உறவினரின் நோயெதிர்ப்பு அமைப்பு கணிசமாக பலவீனமடைந்துள்ளது. தனிமைப்படுத்தல் முன்னெச்சரிக்கைகள் உள்பட பாதுகாப்பு நடவடிக்கைகள் எடுக்கிறோம்." },
            severe: { en: "Your relative's immune system is severely suppressed, leaving them virtually defenceless against infections. They have developed a serious infection that is very difficult to treat in this setting.", ta: "உங்கள் உறவினரின் நோயெதிர்ப்பு அமைப்பு கடுமையாக அடக்கப்பட்டுள்ளது, தொற்றுகளுக்கு எதிராக நடைமுறையில் பாதுகாப்பு இல்லாமல் விடப்பட்டுள்ளது." },
            critical: { en: "The immune system has completely failed and the body cannot mount any defence against infections. Life-threatening opportunistic infections are present. We are giving the strongest available treatments.", ta: "நோயெதிர்ப்பு அமைப்பு முழுமையாக செயலிழந்துள்ளது, தொற்றுகளுக்கு எதிராக எந்த பாதுகாப்பையும் உருவாக்க உடலால் இயலவில்லை." },
          },
          trajectory: {
            improving: { en: "The infection markers are reducing and the immune status is showing some improvement. The treatment is working.", ta: "தொற்று குறிப்பான்கள் குறைகின்றன, நோய் எதிர்ப்பு நிலை சற்று முன்னேற்றத்தை காட்டுகிறது." },
            status_quo: { en: "The immune suppression and infection status remain unchanged. We continue aggressive treatment and protective measures.", ta: "நோய் எதிர்ப்பு அடக்கம் மற்றும் தொற்று நிலை மாறாமல் உள்ளது." },
            worsening: { en: "The immune system is failing further and new infections are developing on top of the current ones. This is a very concerning development.", ta: "நோயெதிர்ப்பு அமைப்பு மேலும் தோல்வியடைகிறது, தற்போதைய தொற்றுகளின் மேல் புதிய தொற்றுகள் உருவாகின்றன." },
            failing: { en: "The immune system cannot be restored and is no longer able to protect the body from infection. Each new infection is becoming harder to treat.", ta: "நோயெதிர்ப்பு அமைப்பை மீட்டெடுக்க முடியாது, தொற்றிலிருந்து உடலை பாதுகாக்க இனி இயலாது." },
          },
        },
      ],
    },
    {
      id: "mod_nutrition",
      order: 14,
      label: { en: "Nutritional Problems", ta: "ஊட்டச்சத்து பிரச்சனைகள்" },
      active: true,
      conditions: [
        {
          id: "cond_malnut",
          keyword: { en: "Severe Malnutrition / Inability to Feed", ta: "கடுமையான ஊட்டச்சத்து குறைபாடு / உணவளிக்க இயலாமை" },
          active: true,
          severity: {
            mild: { en: "Your relative is not able to take adequate nutrition by mouth due to their illness. Poor nutrition slows recovery and weakens the immune system. We are providing nutritional supplements through a tube passed into the stomach.", ta: "உங்கள் உறவினர் நோய் காரணமாக வாய் மூலம் போதுமான ஊட்டச்சத்தை உட்கொள்ள இயலவில்லை. வயிற்றில் செருகப்பட்ட குழாய் மூலம் ஊட்டச்சத்து சப்ளிமெண்ட்கள் வழங்குகிறோம்." },
            moderate: { en: "Your relative has significant malnutrition which is affecting their ability to heal and fight infection. The gut is not absorbing nutrients properly. We are working with our nutrition team.", ta: "உங்கள் உறவினருக்கு குணமடைவதற்கும் தொற்றை எதிர்க்கவும் திறனை பாதிக்கும் கணிசமான ஊட்டச்சத்து குறைபாடு உள்ளது." },
            severe: { en: "Your relative is severely malnourished. The muscles are wasting, wounds are not healing, and the immune system is critically weakened. Specialised intravenous nutrition is being provided.", ta: "உங்கள் உறவினர் கடுமையான ஊட்டச்சத்து குறைபாட்டில் உள்ளார். தசைகள் சுரிகின்றன, காயங்கள் குணமடைவதில்லை." },
            critical: { en: "Nutritional failure is now compounding all the other organ failures. The body has reached a state of catabolism where it is breaking down its own muscles for energy at an alarming rate.", ta: "ஊட்டச்சத்து செயலிழப்பு இப்போது மற்ற அனைத்து உறுப்பு செயலிழப்புகளையும் சேர்த்து கூட்டுகிறது." },
          },
          trajectory: {
            improving: { en: "Nutritional targets are being met and your relative is tolerating tube feeding well. Early signs of improved wound healing and muscle function are encouraging.", ta: "ஊட்டச்சத்து இலக்குகள் பூர்த்தி செய்யப்படுகின்றன, உங்கள் உறவினர் குழாய் உணவை நன்றாக சகித்துக்கொள்கிறார்." },
            status_quo: { en: "Nutrition is being maintained at the current level. The gut is tolerating the feeds but absorption remains partial.", ta: "ஊட்டச்சத்து தற்போதைய அளவில் பராமரிக்கப்படுகிறது. குடல் உணவை சகித்துக்கொள்கிறது, ஆனால் உறிஞ்சுதல் பகுதியாகவே உள்ளது." },
            worsening: { en: "The gut is not tolerating feeds and nutritional requirements are not being met. Intravenous nutrition is being increased but this cannot fully replace normal gut absorption.", ta: "குடல் உணவை சகிக்கவில்லை, ஊட்டச்சத்து தேவைகள் பூர்த்தி செய்யப்படவில்லை." },
            failing: { en: "Despite every nutritional strategy, the body is unable to utilise or absorb nutrients. This reflects the severity of the overall organ failure, and nutrition alone will not be able to sustain recovery.", ta: "ஒவ்வொரு ஊட்டச்சத்து உத்தியும் இருந்தாலும், உடல் ஊட்டச்சத்துக்களை பயன்படுத்தவோ உறிஞ்சவோ இயலவில்லை." },
          },
        },
      ],
    },
  ],
};

const CONSENT_STATEMENTS = [
  {
    id: "cs1",
    en: "The doctor explained the current medical condition in a language I understand.",
    ta: "மருத்துவர் தற்போதைய மருத்துவ நிலையை நான் புரிந்துகொள்ளும் மொழியில் விளக்கினார்.",
  },
  {
    id: "cs2",
    en: "I was given adequate time to ask questions and clarify my doubts.",
    ta: "கேள்விகள் கேட்கவும் என் சந்தேகங்களை தெளிவுபடுத்திக் கொள்ளவும் எனக்கு போதுமான நேரம் வழங்கப்பட்டது.",
  },
  {
    id: "cs3",
    en: "I was informed about the option of seeking a second medical opinion if I wish to do so.",
    ta: "நான் விரும்பினால் இரண்டாவது மருத்துவ கருத்தை நாடும் வாய்ப்பு பற்றி என்னிடம் தெரிவிக்கப்பட்டது.",
  },
  {
    id: "cs4",
    en: "I understand that the prognosis may change and further discussions will be held as needed.",
    ta: "முன்கணிப்பு மாறலாம் என்பதும் தேவைப்படும்போது மேலும் விவாதங்கள் நடத்தப்படும் என்பதும் எனக்கு புரிகிறது.",
  },
  {
    id: "cs5",
    en: "I was explained the treatment plan and the reasons for each intervention.",
    ta: "சிகிச்சை திட்டம் மற்றும் ஒவ்வொரு தலையீட்டிற்கான காரணங்கள் எனக்கு விளக்கப்பட்டன.",
  },
  {
    id: "cs6",
    en: "I understand my right to withdraw consent at any time and the implications of doing so.",
    ta: "எந்த நேரத்திலும் சம்மதத்தை திரும்பப் பெறும் என் உரிமையும் அதன் தாக்கங்களும் எனக்கு புரிகிறது.",
  },
];

const PROGNOSIS_LEVELS = [
  { id: "guarded", en: "Guarded", ta: "எச்சரிக்கையான", desc_en: "The outcome is uncertain. There are significant risks but recovery is possible with continued treatment.", desc_ta: "விளைவு நிச்சயமற்றது. கணிசமான அபாயங்கள் உள்ளன, ஆனால் தொடர்ந்த சிகிச்சையால் குணமடைவு சாத்தியம்." },
  { id: "poor", en: "Poor", ta: "மோசமான", desc_en: "The prognosis is poor. Despite active treatment, the likelihood of meaningful recovery is limited.", desc_ta: "முன்கணிப்பு மோசமானது. தீவிர சிகிச்சை இருந்தாலும், அர்த்தமுள்ள குணமடைவின் சாத்தியம் குறைவு." },
  { id: "very_poor", en: "Very Poor", ta: "மிகவும் மோசமான", desc_en: "The prognosis is very poor. The condition is life-threatening and survival is uncertain even with maximum support.", desc_ta: "முன்கணிப்பு மிகவும் மோசமானது. நிலை உயிருக்கு அபாயகரமானது, அதிகபட்ச ஆதரவு இருந்தாலும் உயிர்வாழ்வு நிச்சயமற்றது." },
  { id: "terminal", en: "Terminal", ta: "இறுதிக் கட்ட", desc_en: "The condition is terminal. Despite all medical efforts, survival is not expected. Our focus will shift to comfort and dignity.", desc_ta: "நிலை இறுதிக்கட்டத்தில் உள்ளது. அனைத்து மருத்துவ முயற்சிகள் இருந்தாலும், உயிர்வாழ்வு எதிர்பார்க்கப்படவில்லை. வசதி மற்றும் கண்ணியத்தில் கவனம் செலுத்துவோம்." },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEVERITY / TRAJECTORY COLORS
// ─────────────────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  mild:     { label: "Mild",     ta: "லேசான",       color: "bg-emerald-100 text-emerald-800 border-emerald-300", pill: "bg-emerald-500 text-white" },
  moderate: { label: "Moderate", ta: "நடுத்தர",     color: "bg-amber-100 text-amber-800 border-amber-300",       pill: "bg-amber-500 text-white" },
  severe:   { label: "Severe",   ta: "தீவிர",        color: "bg-orange-100 text-orange-800 border-orange-300",    pill: "bg-orange-500 text-white" },
  critical: { label: "Critical", ta: "மிக தீவிர",   color: "bg-red-100 text-red-800 border-red-300",             pill: "bg-red-600 text-white" },
};

const TRAJECTORY_CONFIG = {
  improving:  { label: "Improving",   ta: "மேம்படுகிறது",     icon: "↑", color: "bg-emerald-100 text-emerald-800 border-emerald-300", pill: "bg-emerald-500 text-white" },
  status_quo: { label: "Status Quo",  ta: "மாற்றமில்லை",      icon: "→", color: "bg-blue-100 text-blue-800 border-blue-300",          pill: "bg-blue-500 text-white" },
  worsening:  { label: "Worsening",   ta: "மோசமடைகிறது",      icon: "↓", color: "bg-orange-100 text-orange-800 border-orange-300",    pill: "bg-orange-500 text-white" },
  failing:    { label: "Failing",     ta: "செயலிழக்கிறது",    icon: "⚠", color: "bg-red-100 text-red-800 border-red-300",             pill: "bg-red-600 text-white" },
};

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — VOICE DICTATION ENGINE
//
// Spec (Section 10):
//   • Microphone button on every free text field
//   • Web Speech API, locale ta-IN (Tamil — India)
//   • Dictated text appears in Tamil script, fully editable after dictation
//   • Visual recording indicator: pulsing red mic + "கேட்கிறேன்..."
//   • Tap to stop; text appended to existing content
//   • Graceful fallback: mic button hidden if API unavailable, Tamil
//     keyboard input shown instead with informational note
//   • Continuous mode: accumulates all utterances until user stops
//   • Interim results shown live in a preview strip while speaking
//   • Works fully on Chrome (Android + Desktop)
//   • Language selector: Tamil (ta-IN) default; English (en-IN) also available
//     for bilingual fields
// ─────────────────────────────────────────────────────────────────────────────

/** Detect Web Speech API availability */
const SPEECH_AVAILABLE = (() => {
  try {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  } catch {
    return false;
  }
})();

/**
 * useSpeechDictation — reusable hook
 * Returns { listening, interim, start, stop, supported }
 * Appends final transcripts to the value via onChange.
 */
function useSpeechDictation({ value, onChange, lang = "ta-IN" }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim]     = useState("");
  const recRef = useRef(null);

  const stop = useCallback(() => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
      recRef.current = null;
    }
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    if (!SPEECH_AVAILABLE) return;
    // Stop any existing session
    if (recRef.current) { try { recRef.current.stop(); } catch {} }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;        // keep listening until user taps stop
    rec.interimResults = true;    // show live preview while speaking
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk += t + " ";
        else interimChunk += t;
      }
      if (finalChunk) {
        onChange((value || "") + (value ? " " : "") + finalChunk.trim());
        setInterim("");
      } else {
        setInterim(interimChunk);
      }
    };

    rec.onerror = (e) => {
      console.warn("Speech recognition error:", e.error);
      stop();
    };

    rec.onend = () => {
      // Auto-restart if user hasn't tapped stop (handles Android pause)
      if (recRef.current) {
        try { recRef.current.start(); } catch { stop(); }
      }
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
      setInterim("");
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      recRef.current = null;
    }
  }, [lang, value, onChange, stop]);

  // Clean up on unmount
  useEffect(() => () => stop(), [stop]);

  return { listening, interim, start, stop, supported: SPEECH_AVAILABLE };
}

/**
 * VoiceDictationButton — inline mic button for use beside any text field.
 * Shows as a pill button. Hidden automatically if Speech API unsupported.
 *
 * Props:
 *   value      string   current textarea value
 *   onChange   fn       called with new string value
 *   lang       string   "ta-IN" | "en-IN" (default: "ta-IN")
 *   label      string   displayed on button when idle (default: "Voice / குரல்")
 *   className  string   extra classes on wrapper
 */
function VoiceDictationButton({ value, onChange, lang = "ta-IN", label, className = "" }) {
  const { listening, interim, start, stop, supported } =
    useSpeechDictation({ value, onChange, lang });

  if (!supported) return null; // graceful fallback — button simply absent

  const btnLabel = label || (lang === "ta-IN" ? "குரல் / Voice" : "Voice");

  return (
    <div className={`inline-flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        onClick={listening ? stop : start}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
          transition-all active:scale-95 select-none
          ${listening
            ? "bg-red-500 text-white shadow-lg shadow-red-200"
            : "bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200"
          }`}
      >
        <span className={listening ? "animate-pulse" : ""}>🎤</span>
        {listening ? (
          <span style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            கேட்கிறேன்… (Stop)
          </span>
        ) : (
          <span>{btnLabel}</span>
        )}
      </button>
    </div>
  );
}

/**
 * VoiceTextarea — a full textarea + mic button + interim preview,
 * drop-in replacement anywhere free Tamil text is needed.
 *
 * Props:
 *   value, onChange, placeholder, rows — standard textarea props
 *   lang         "ta-IN" | "en-IN"
 *   voiceLabel   custom button label
 *   style        additional inline styles (e.g. font-family for Tamil)
 *   className    extra classes on the textarea
 *   disabled     bool
 */
function VoiceTextarea({
  value, onChange, placeholder, rows = 3,
  lang = "ta-IN", voiceLabel,
  style = {}, className = "", disabled = false,
}) {
  const { listening, interim, start, stop, supported } =
    useSpeechDictation({ value, onChange, lang });

  const tamilFont = lang === "ta-IN"
    ? { fontFamily: "'Noto Sans Tamil', 'FreeSans', sans-serif" }
    : {};

  return (
    <div className="relative">
      {/* Mic toggle button — top-right of textarea */}
      {supported && (
        <button
          type="button"
          onClick={listening ? stop : start}
          disabled={disabled}
          title={listening ? "Stop recording" : "Start voice input"}
          className={`absolute top-2 right-2 z-10 flex items-center gap-1 px-2.5 py-1.5
            rounded-lg text-xs font-semibold transition-all active:scale-95 select-none
            ${listening
              ? "bg-red-500 text-white animate-pulse shadow shadow-red-200"
              : "bg-blue-100 text-blue-600 border border-blue-200 hover:bg-blue-200"
            }`}
        >
          🎤
        </button>
      )}

      {/* Textarea */}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none
          focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50 pr-12
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${listening ? "border-red-300 ring-1 ring-red-200" : "border-gray-200"}
          ${className}`}
        style={{ ...tamilFont, ...style }}
      />

      {/* Interim transcript preview */}
      {listening && (
        <div className="mt-1 px-3 py-2 bg-red-50 border border-red-200 rounded-xl
          text-xs text-red-700 flex items-start gap-2">
          <span className="animate-pulse flex-shrink-0 mt-0.5">●</span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold"
              style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              கேட்கிறேன்…
            </span>
            {interim && (
              <span className="ml-2 text-red-600 italic break-words"
                style={tamilFont}>{interim}</span>
            )}
            {!interim && (
              <span className="ml-2 text-red-400 italic">Listening in {lang === "ta-IN" ? "Tamil" : "English"}…</span>
            )}
          </div>
          <button onClick={stop}
            className="flex-shrink-0 text-red-500 hover:text-red-700 font-bold text-base leading-none">
            ✕
          </button>
        </div>
      )}

      {/* Fallback note if speech not available */}
      {!supported && lang === "ta-IN" && (
        <p className="mt-1 text-xs text-gray-400 italic">
          🎤 Voice input available on Chrome browser. Use Tamil keyboard to type directly.
        </p>
      )}
    </div>
  );
}

/**
 * VoiceLangSelector — small pill group to choose dictation language.
 * Used above fields that accept both English and Tamil voice input.
 */
function VoiceLangSelector({ lang, onLangChange }) {
  if (!SPEECH_AVAILABLE) return null;
  return (
    <div className="flex items-center gap-1 mb-1">
      <span className="text-xs text-gray-400 mr-1">Voice lang:</span>
      {[
        { code: "ta-IN", label: "தமிழ்" },
        { code: "en-IN", label: "English" },
      ].map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => onLangChange(code)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
            ${lang === code
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
          style={code === "ta-IN" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : {}}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function ICUConsentApp() {
  const [appState, setAppState] = useState("disclaimer"); // disclaimer | pin_setup | pin_entry | app | settings | admin | admin_pin
  const [savedPin, setSavedPin] = useState("1234");
  const [adminPin, setAdminPin] = useState("9999");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  // Phase 6 — Settings state (persisted in sessionStorage)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = sessionStorage.getItem("icu_settings");
      return saved ? JSON.parse(saved) : {
        hospitalName: "",
        printerEmail: "",
        mrdEmail: "",
        mrdEmailEnabled: false,
        sessionTimeout: 5,       // minutes
        storageTier: "session",  // "session" | "local"
        appVersion: "1.0.0",
      };
    } catch { return { hospitalName: "", printerEmail: "", mrdEmail: "", mrdEmailEnabled: false, sessionTimeout: 5, storageTier: "session", appVersion: "1.0.0" }; }
  });

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    try { sessionStorage.setItem("icu_settings", JSON.stringify(newSettings)); } catch {}
  };
  // Phase 6 — Content overrides (institution admin edits, version history)
  // Structure: { [conditionKey]: { en, ta, history: [{en, ta, reason, date}] } }
  // Persistent content DB — stored in localStorage
  const [contentDB, setContentDB] = useState(() => loadContentDB());

  const updateContentDB = (newDB) => {
    setContentDB(newDB);
    saveContentDB(newDB);
  };
  const [contentOverrides, setContentOverrides] = useState(() => {
    try {
      const saved = sessionStorage.getItem("icu_content_overrides");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const saveContentOverride = (key, en, ta, reason) => {
    setContentOverrides(prev => {
      const existing = prev[key] || { history: [] };
      const newOverride = {
        en, ta,
        history: [
          { en, ta, reason, date: new Date().toISOString() },
          ...(existing.history || []).slice(0, 19), // keep last 20
        ],
      };
      const next = { ...prev, [key]: newOverride };
      try { sessionStorage.setItem("icu_content_overrides", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Form data
  const [patientData, setPatientData] = useState({ name: "", uhid: "", age: "", sessionNumber: "", paediatric: false });
  const [doctorData, setDoctorData] = useState({ name: "", designation: "", regNumber: "", ward: "", othersPresent: "", interpreterPresent: false, interpreterName: "" });
  const [selectedModules, setSelectedModules] = useState({});
  const [expandedModules, setExpandedModules] = useState({});
  const [prognosisData, setPrognosisData] = useState({ level: "", freeTextEn: "", freeTextTa: "", scores: { SOFA: "", APACHE_II: "", GCS: "", qSOFA: "" } });
  const [consentChecks, setConsentChecks] = useState(Object.fromEntries(CONSENT_STATEMENTS.map(s => [s.id, true])));
  const [refusal, setRefusal] = useState({ documented: false, reason: "" });
  const [signatoryData, setSignatoryData] = useState({ name: "", relationship: "", witnessName: "", witnessDesignation: "" });

  const inactivityTimer = useRef(null);

  // ── Phase 7 — PWA state ───────────────────────────────────────────────────
  const [isOffline, setIsOffline]           = useState(!navigator.onLine);
  const [updateReady, setUpdateReady]       = useState(false);
  const [updateMsg, setUpdateMsg]           = useState("");
  const [installable, setInstallable]       = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const onOffline = () => setIsOffline(true);
    const onOnline  = () => setIsOffline(false);
    const onUpdate  = (e) => { setUpdateReady(true); setUpdateMsg(e.detail?.message || "Update available"); };
    const onInstall = () => { setInstallable(true); setShowInstallBanner(true); };

    window.addEventListener("sw:offline",          onOffline);
    window.addEventListener("sw:online",           onOnline);
    window.addEventListener("sw:update-available", onUpdate);
    window.addEventListener("sw:install-available",onInstall);

    return () => {
      window.removeEventListener("sw:offline",          onOffline);
      window.removeEventListener("sw:online",           onOnline);
      window.removeEventListener("sw:update-available", onUpdate);
      window.removeEventListener("sw:install-available",onInstall);
    };
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (appState === "app") {
      inactivityTimer.current = setTimeout(() => {
        setAppState("pin_entry");
        setPinInput("");
        setPinError(false);
      }, 5 * 60 * 1000);
    }
  }, [appState]);

  useEffect(() => {
    const events = ["click", "keydown", "touchstart", "mousemove"];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivityTimer]);

  // ── PIN PAD ─────────────────────────────────────────────────────────────────
  const handlePinKey = (key) => {
    if (key === "del") {
      setPinInput(p => p.slice(0, -1));
      setPinError(false);
      return;
    }
    if (pinInput.length >= 4) return;
    const next = pinInput + key;
    setPinInput(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (appState === "pin_setup") {
          setSavedPin(next);
          setAppState("app");
          setPinInput("");
        } else if (appState === "admin_pin") {
          if (next === adminPin) {
            setAppState("admin");
            setPinInput("");
            setPinError(false);
          } else {
            setPinError(true);
            setTimeout(() => { setPinInput(""); setPinError(false); }, 800);
          }
        } else {
          if (next === savedPin) {
            setAppState("app");
            setPinInput("");
            setPinError(false);
          } else {
            setPinError(true);
            setTimeout(() => { setPinInput(""); setPinError(false); }, 800);
          }
        }
      }, 200);
    }
  };

  const totalSelectedConditions = Object.values(selectedModules).reduce((acc, conds) => acc + Object.keys(conds).length, 0);

  const toggleCondition = (moduleId, condId) => {
    setSelectedModules(prev => {
      const next = { ...prev };
      if (!next[moduleId]) next[moduleId] = {};
      if (next[moduleId][condId]) {
        const m = { ...next[moduleId] };
        delete m[condId];
        if (Object.keys(m).length === 0) delete next[moduleId];
        else next[moduleId] = m;
      } else {
        next[moduleId] = { ...next[moduleId], [condId]: { severity: "", trajectory: "" } };
      }
      return next;
    });
  };

  const setConditionLevel = (moduleId, condId, field, value) => {
    setSelectedModules(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [condId]: { ...prev[moduleId][condId], [field]: value },
      },
    }));
  };

  const isConditionSelected = (moduleId, condId) => !!(selectedModules[moduleId]?.[condId]);

  // ─── SCREENS ─────────────────────────────────────────────────────────────────

  if (appState === "disclaimer") return <DisclaimerScreen onAccept={() => setAppState("pin_setup")} />;
  if (appState === "pin_setup") return <PinScreen mode="setup" pinInput={pinInput} onKey={handlePinKey} error={pinError} />;
  if (appState === "pin_entry") return <PinScreen mode="entry" pinInput={pinInput} onKey={handlePinKey} error={pinError} />;
  if (appState === "admin_pin") return <PinScreen mode="admin" pinInput={pinInput} onKey={handlePinKey} error={pinError} onBack={() => { setPinInput(""); setPinError(false); setAppState("settings"); }} />;

  // SETTINGS OVERLAY
  if (appState === "settings") return (
    <SettingsScreen
      settings={settings}
      onSave={saveSettings}
      savedPin={savedPin}
      onChangePIN={(newPin) => setSavedPin(newPin)}
      adminPin={adminPin}
      onChangeAdminPIN={(newPin) => setAdminPin(newPin)}
      onEnterAdmin={() => { setPinInput(""); setPinError(false); setAppState("admin_pin"); }}
      onClose={() => setAppState("app")}
      onClearAll={() => {
        try { sessionStorage.clear(); } catch {}
        setContentOverrides({});
        setAppState("app");
      }}
    />
  );

  // ADMIN PANEL OVERLAY
  if (appState === "admin") return (
    <AdminPanel
      contentDB={contentDB}
      contentOverrides={contentOverrides}
      onSaveOverride={saveContentOverride}
      onUpdateContentDB={updateContentDB}
      onClose={() => setAppState("app")}
    />
  );

  // PREVIEW OVERLAY
  if (showPreview) {
    return (
      <PreviewScreen
        patientData={patientData}
        doctorData={doctorData}
        selectedModules={selectedModules}
        prognosisData={prognosisData}
        consentChecks={consentChecks}
        refusal={refusal}
        signatoryData={signatoryData}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  const steps = [
    { num: 1, label: "Patient" },
    { num: 2, label: "Clinician" },
    { num: 3, label: "Conditions" },
    { num: 4, label: "Prognosis" },
    { num: 5, label: "Consent" },
    { num: 6, label: "Signatory" },
    { num: 7, label: "Export" },
  ];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── OFFLINE BANNER ── */}
      {isOffline && (
        <div className="offline-banner bg-amber-500 text-white text-center py-2 px-4 text-xs font-semibold sticky top-0 z-50">
          📵 Offline — all features available from cache. Document generation queued.
        </div>
      )}

      {/* ── UPDATE NOTIFICATION ── shown at bottom when update is waiting */}
      {updateReady && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 print:hidden">
          <div className="max-w-2xl mx-auto bg-blue-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">🔄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">New content update available</p>
              <p className="text-xs text-blue-300">Will apply at next session start.</p>
              <p className="text-xs text-blue-300 mt-0.5" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                புதிய புதுப்பிப்பு அடுத்த அமர்வில் பயன்படுத்தப்படும்.
              </p>
            </div>
            <button onClick={() => setUpdateReady(false)}
              className="text-blue-300 hover:text-white text-xl flex-shrink-0">✕</button>
          </div>
        </div>
      )}

      {/* ── PWA INSTALL BANNER ── */}
      {showInstallBanner && (
        <div className="install-banner fixed bottom-0 left-0 right-0 z-50 p-4 print:hidden">
          <div className="max-w-2xl mx-auto bg-gray-900 text-white rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-sm font-bold">Add to Home Screen</p>
                <p className="text-xs text-gray-300">Use ICU Consent as a standalone app — works offline.</p>
              </div>
              <button onClick={() => setShowInstallBanner(false)}
                className="text-gray-400 hover:text-white text-xl ml-auto flex-shrink-0">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowInstallBanner(false)}
                className="py-2.5 rounded-xl border border-gray-600 text-gray-300 text-sm font-semibold">
                Not now
              </button>
              <button
                onClick={() => {
                  if (window.swPromptInstall) {
                    window.swPromptInstall().then(outcome => {
                      setShowInstallBanner(false);
                      setInstallable(false);
                    }).catch(() => setShowInstallBanner(false));
                  }
                }}
                style={{ background: "linear-gradient(135deg, #1B6CA8 0%, #0d4f80 100%)" }}
                className="py-2.5 rounded-xl text-white text-sm font-bold">
                Install App
              </button>
            </div>
          </div>
        </div>
      )}
      {/* TOP BAR */}
      <header style={{ background: "linear-gradient(135deg, #1B6CA8 0%, #0d4f80 100%)" }} className="text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold tracking-tight">ICU Prognosis Consent</h1>
              <p className="text-xs text-blue-200" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                ICU முன்கணிப்பு சம்மத பதிவு
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Voice availability indicator */}
              {SPEECH_AVAILABLE && (
                <span className="text-xs text-blue-200 flex items-center gap-1" title="Voice dictation available">
                  🎤 <span className="hidden sm:inline">Voice ready</span>
                </span>
              )}
              {totalSelectedConditions > 0 && (
                <span className="bg-white text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                  {totalSelectedConditions} selected
                </span>
              )}
              <button
                onClick={() => setAppState("settings")}
                className="text-blue-200 hover:text-white text-lg leading-none"
                title="Settings"
              >
                ⚙
              </button>
              <button
                onClick={() => setAppState("pin_entry")}
                className="text-blue-200 hover:text-white text-xs border border-blue-400 px-2 py-1 rounded"
              >
                Lock
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* STEP INDICATOR */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex flex-col items-center ${currentStep === s.num ? "opacity-100" : currentStep > s.num ? "opacity-70" : "opacity-30"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                    ${currentStep === s.num ? "border-blue-600 bg-blue-600 text-white" :
                    currentStep > s.num ? "border-blue-400 bg-blue-100 text-blue-700" :
                    "border-gray-300 bg-white text-gray-400"}`}>
                    {currentStep > s.num ? "✓" : s.num}
                  </div>
                  <span className="text-xs mt-0.5 hidden sm:block text-gray-600" style={{ fontSize: "10px" }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 w-4 sm:w-6 mx-1 ${currentStep > s.num ? "bg-blue-400" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-1">Step {currentStep} of {steps.length}</p>
        </div>
      </div>

      {/* SCREEN CONTENT */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {currentStep === 1 && (
          <Step1Patient
            data={patientData}
            onChange={setPatientData}
            onNext={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 2 && (
          <Step2Doctor
            data={doctorData}
            onChange={setDoctorData}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 3 && (
          <Step3Modules
            selectedModules={selectedModules}
            expandedModules={expandedModules}
            setExpandedModules={setExpandedModules}
            toggleCondition={toggleCondition}
            setConditionLevel={setConditionLevel}
            isConditionSelected={isConditionSelected}
            totalSelected={totalSelectedConditions}
            onBack={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
            onPreview={() => setShowPreview(true)}
          />
        )}
        {currentStep === 4 && (
          <Step4Prognosis
            data={prognosisData}
            onChange={setPrognosisData}
            onBack={() => setCurrentStep(3)}
            onNext={() => setCurrentStep(5)}
          />
        )}
        {currentStep === 5 && (
          <Step5Consent
            checks={consentChecks}
            setChecks={setConsentChecks}
            refusal={refusal}
            setRefusal={setRefusal}
            onBack={() => setCurrentStep(4)}
            onNext={() => setCurrentStep(6)}
          />
        )}
        {currentStep === 6 && (
          <Step6Signatory
            data={signatoryData}
            onChange={setSignatoryData}
            onBack={() => setCurrentStep(5)}
            onNext={() => setCurrentStep(7)}
          />
        )}
        {currentStep === 7 && (
          <Step7Export
            patientData={patientData}
            doctorData={doctorData}
            selectedModules={selectedModules}
            prognosisData={prognosisData}
            consentChecks={consentChecks}
            refusal={refusal}
            signatoryData={signatoryData}
            contentDB={contentDB}
            consentStatements={CONSENT_STATEMENTS}
            prognosisLevels={PROGNOSIS_LEVELS}
            onBack={() => setCurrentStep(6)}
            onPreview={() => setShowPreview(true)}
            onNewPatient={() => {
              // Phase 7 — Signal SW that session ended (safe to apply waiting update)
              if (window.swSignalSessionEnd) window.swSignalSessionEnd();
              setPatientData({ name: "", uhid: "", age: "", sessionNumber: "", paediatric: false });
              setDoctorData({ name: "", designation: "", regNumber: "", ward: "", othersPresent: "", interpreterPresent: false, interpreterName: "" });
              setSelectedModules({});
              setPrognosisData({ level: "", freeTextEn: "", freeTextTa: "", scores: { SOFA: "", APACHE_II: "", GCS: "", qSOFA: "" } });
              setConsentChecks(Object.fromEntries(CONSENT_STATEMENTS.map(s => [s.id, true])));
              setRefusal({ documented: false, reason: "" });
              setSignatoryData({ name: "", relationship: "", witnessName: "", witnessDesignation: "" });
              setCurrentStep(1);
            }}
          />
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCLAIMER SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function DisclaimerScreen({ onAccept }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #1B6CA8 0%, #0d3f6b 100%)" }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div style={{ background: "linear-gradient(135deg, #1B6CA8 0%, #0d4f80 100%)" }} className="px-6 py-8 text-white text-center">
          <div className="text-4xl mb-3">🏥</div>
          <h1 className="text-xl font-bold">ICU Prognosis Consent</h1>
          <p className="text-blue-200 text-sm mt-1">ICU முன்கணிப்பு சம்மத பதிவு</p>
          <p className="text-blue-200 text-xs mt-1">v1.0 — Documentation Tool</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h2 className="font-bold text-amber-800 text-sm mb-2">⚠ Important Disclaimer</h2>
            <p className="text-xs text-amber-700 leading-relaxed">
              This application is a <strong>documentation assistance tool</strong>. It does not constitute a medical records system. All generated documents must be <strong>printed, signed, and filed</strong> in the patient's physical medical record. The healthcare institution is solely responsible for document retention and medicolegal compliance. The developer bears no responsibility for document storage or medicolegal outcomes.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h2 className="font-bold text-blue-800 text-sm mb-2">முக்கிய அறிவிப்பு</h2>
            <p className="text-xs text-blue-700 leading-relaxed">
              இந்த பயன்பாடு ஒரு <strong>ஆவண உதவி கருவி</strong>. இது மருத்துவ பதிவு அமைப்பல்ல. உருவாக்கப்பட்ட அனைத்து ஆவணங்களும் <strong>அச்சிடப்பட்டு, கையொப்பமிட்டு</strong>, நோயாளியின் உடல் மருத்துவ பதிவில் சேர்க்கப்பட வேண்டும்.
            </p>
          </div>
          <button
            onClick={onAccept}
            style={{ background: "linear-gradient(135deg, #1B6CA8 0%, #0d4f80 100%)" }}
            className="w-full text-white py-4 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
          >
            I Understand and Accept<br />
            <span className="text-blue-200 font-normal text-xs">நான் புரிந்துகொண்டு ஒப்புக்கொள்கிறேன்</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function PinScreen({ mode, pinInput, onKey, error, onBack }) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","del"];
  const titles = { setup: "Set Institution PIN", entry: "Enter PIN", admin: "Enter Admin PIN" };
  const subtitles = { setup: "Choose a 4-digit PIN for this device", entry: "ICU Consent App", admin: "Admin access required" };
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B6CA8 0%, #0d3f6b 100%)" }}>
      <div className="text-center w-full max-w-xs px-6">
        {onBack && (
          <button onClick={onBack} className="text-blue-200 text-sm mb-6 flex items-center gap-1">
            ← Back
          </button>
        )}
        <div className="text-5xl mb-4">{mode === "admin" ? "🔐" : "🔒"}</div>
        <h2 className="text-white text-xl font-bold mb-1">{titles[mode] || "Enter PIN"}</h2>
        <p className="text-blue-200 text-sm mb-8">{subtitles[mode] || ""}</p>
        <div className="flex justify-center gap-4 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
              error ? "border-red-400 bg-red-400" :
              i < pinInput.length ? "border-white bg-white" : "border-blue-300 bg-transparent"
            }`} />
          ))}
        </div>
        {error && <p className="text-red-300 text-sm mb-4">Incorrect PIN. Try again.</p>}
        <div className="grid grid-cols-3 gap-3">
          {keys.map((k, i) => (
            k === "" ? <div key={i} /> :
            <button
              key={i}
              onClick={() => onKey(k)}
              className={`h-16 rounded-2xl font-bold text-xl transition-all active:scale-95 shadow-lg
                ${k === "del"
                  ? "bg-blue-800 text-blue-200 text-base"
                  : "bg-white bg-opacity-20 text-white hover:bg-opacity-30 border border-white border-opacity-20"
                }`}
            >
              {k === "del" ? "⌫" : k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ en, ta, icon }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        {icon && <span className="text-2xl">{icon}</span>}
        {en}
      </h2>
      <p className="text-sm text-gray-500" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{ta}</p>
    </div>
  );
}

function FieldLabel({ en, ta, required }) {
  return (
    <label className="block mb-1.5">
      <span className="text-sm font-semibold text-gray-700">{en}{required && <span className="text-red-500 ml-1">*</span>}</span>
      {ta && <span className="block text-xs text-gray-400" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{ta}</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 ${className}`}
    />
  );
}

function NavButtons({ onBack, onNext, nextLabel = "Next →", nextDisabled = false }) {
  return (
    <div className="flex gap-3 mt-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm active:scale-95 transition-all"
        >
          ← Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        style={nextDisabled ? {} : { background: "linear-gradient(135deg, #1B6CA8 0%, #0d4f80 100%)" }}
        className={`flex-2 flex-grow py-4 rounded-xl text-white font-bold text-sm shadow-lg active:scale-95 transition-all
          ${nextDisabled ? "bg-gray-300 cursor-not-allowed" : ""}`}
      >
        {nextLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — PATIENT DETAILS
// ─────────────────────────────────────────────────────────────────────────────
function Step1Patient({ data, onChange, onNext }) {
  const valid = data.name && data.uhid && data.age;
  return (
    <div>
      <SectionHeader en="Patient Details" ta="நோயாளி விவரங்கள்" icon="👤" />
      <Card className="p-5 space-y-4">
        <div>
          <FieldLabel en="Patient Name" ta="நோயாளியின் பெயர்" required />
          <Input value={data.name} onChange={v => onChange({ ...data, name: v })} placeholder="Full name" />
        </div>
        <div>
          <FieldLabel en="UHID / Hospital Number" ta="UHID / மருத்துவமனை எண்" required />
          <Input value={data.uhid} onChange={v => onChange({ ...data, uhid: v })} placeholder="Unique hospital ID" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel en="Age (years)" ta="வயது" required />
            <Input type="number" value={data.age} onChange={v => onChange({ ...data, age: v })} placeholder="Age" />
          </div>
          <div>
            <FieldLabel en="Session No." ta="அமர்வு எண்" />
            <Input type="number" value={data.sessionNumber} onChange={v => onChange({ ...data, sessionNumber: v })} placeholder="e.g. 1" />
          </div>
        </div>
        <label className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={data.paediatric}
            onChange={e => onChange({ ...data, paediatric: e.target.checked })}
            className="mt-0.5 w-5 h-5 rounded accent-amber-500"
          />
          <div>
            <span className="text-sm font-semibold text-amber-800">Paediatric Case</span>
            <p className="text-xs text-amber-600" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>குழந்தை நோயாளி (adds paediatric disclaimer)</p>
          </div>
        </label>
      </Card>
      <NavButtons onNext={onNext} nextDisabled={!valid} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — DOCTOR DETAILS
// ─────────────────────────────────────────────────────────────────────────────
function Step2Doctor({ data, onChange, onBack, onNext }) {
  const valid = data.name && data.designation;
  return (
    <div>
      <SectionHeader en="Clinician & Session Details" ta="மருத்துவர் மற்றும் அமர்வு விவரங்கள்" icon="🩺" />
      <Card className="p-5 space-y-4">
        <div>
          <FieldLabel en="Doctor Name" ta="மருத்துவரின் பெயர்" required />
          <Input value={data.name} onChange={v => onChange({ ...data, name: v })} placeholder="Dr. Full Name" />
        </div>
        <div>
          <FieldLabel en="Designation" ta="பதவி" required />
          <Input value={data.designation} onChange={v => onChange({ ...data, designation: v })} placeholder="e.g. Senior Resident, Consultant" />
        </div>
        <div>
          <FieldLabel en="Registration Number" ta="பதிவு எண்" />
          <Input value={data.regNumber} onChange={v => onChange({ ...data, regNumber: v })} placeholder="Medical council reg. no." />
        </div>
        <div>
          <FieldLabel en="Ward / Unit" ta="வார்டு / பிரிவு" />
          <Input value={data.ward} onChange={v => onChange({ ...data, ward: v })} placeholder="e.g. Medical ICU, RICU" />
        </div>
        <div>
          <FieldLabel en="Others Present" ta="இதர நபர்கள்" />
          <Input value={data.othersPresent} onChange={v => onChange({ ...data, othersPresent: v })} placeholder="e.g. Nursing Sister Name, Resident Name" />
        </div>
        <label className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={data.interpreterPresent}
            onChange={e => onChange({ ...data, interpreterPresent: e.target.checked })}
            className="mt-0.5 w-5 h-5 rounded accent-blue-500"
          />
          <div>
            <span className="text-sm font-semibold text-blue-800">Interpreter Present</span>
            <p className="text-xs text-blue-600">மொழிபெயர்ப்பாளர் இருந்தார்</p>
          </div>
        </label>
        {data.interpreterPresent && (
          <div>
            <FieldLabel en="Interpreter Name & Language" ta="மொழிபெயர்ப்பாளர் பெயர் மற்றும் மொழி" />
            <Input value={data.interpreterName} onChange={v => onChange({ ...data, interpreterName: v })} placeholder="Name — Language" />
          </div>
        )}

        {/* Voice-enabled session notes — spec: "any free text field" */}
        <div>
          <FieldLabel en="Session Notes (optional)" ta="அமர்வு குறிப்புகள்" />
          <VoiceTextarea
            value={data.sessionNotes || ""}
            onChange={v => onChange({ ...data, sessionNotes: v })}
            placeholder="Any additional session-specific notes... (voice input supported)"
            lang="en-IN"
            rows={2}
          />
        </div>
      </Card>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!valid} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — MODULE SELECTION
// ─────────────────────────────────────────────────────────────────────────────
function Step3Modules({ selectedModules, expandedModules, setExpandedModules, toggleCondition, setConditionLevel, isConditionSelected, totalSelected, onBack, onNext, onPreview }) {
  const toggleModule = (id) => setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🫀</span> Clinical Conditions
          </h2>
          <p className="text-sm text-gray-500" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>மருத்துவ நிலைகள்</p>
        </div>
        {totalSelected > 0 && (
          <button
            onClick={onPreview}
            className="text-xs bg-blue-100 text-blue-700 border border-blue-300 px-3 py-2 rounded-xl font-semibold"
          >
            Preview ({totalSelected})
          </button>
        )}
      </div>

      {totalSelected > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-semibold">{totalSelected} condition{totalSelected > 1 ? "s" : ""} selected</span>
          <span className="text-xs text-blue-500">{totalSelected} நிலை தேர்ந்தெடுக்கப்பட்டது</span>
        </div>
      )}

      <div className="space-y-3">
        {contentDB.modules.map(module => {
          const isExpanded = !!expandedModules[module.id];
          const moduleSelected = selectedModules[module.id] && Object.keys(selectedModules[module.id]).length > 0;
          return (
            <Card key={module.id} className={moduleSelected ? "border-blue-300 border-2" : ""}>
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${moduleSelected ? "bg-blue-500" : "bg-gray-200"}`} />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{module.label.en}</p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{module.label.ta}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 px-5 pb-4 space-y-4">
                  {module.conditions.map(cond => {
                    const selected = isConditionSelected(module.id, cond.id);
                    const selData = selectedModules[module.id]?.[cond.id] || {};
                    return (
                      <div key={cond.id} className={`rounded-xl border transition-all ${selected ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-gray-50"} p-4 mt-3`}>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleCondition(module.id, cond.id)}
                            className="mt-0.5 w-5 h-5 rounded accent-blue-600"
                          />
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{cond.keyword.en}</p>
                            <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{cond.keyword.ta}</p>
                          </div>
                        </label>

                        {selected && (
                          <div className="mt-4 space-y-4">
                            {/* SEVERITY */}
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Severity / தீவிரத்தன்மை</p>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                                  <button
                                    key={key}
                                    onClick={() => setConditionLevel(module.id, cond.id, "severity", key)}
                                    className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all active:scale-95
                                      ${selData.severity === key ? cfg.pill + " border-transparent shadow-md" : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"}`}
                                  >
                                    {cfg.label}<br/><span className="font-normal opacity-75" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{cfg.ta}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* TRAJECTORY */}
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trajectory / மருத்துவ போக்கு</p>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(TRAJECTORY_CONFIG).map(([key, cfg]) => (
                                  <button
                                    key={key}
                                    onClick={() => setConditionLevel(module.id, cond.id, "trajectory", key)}
                                    className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all active:scale-95
                                      ${selData.trajectory === key ? cfg.pill + " border-transparent shadow-md" : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"}`}
                                  >
                                    {cfg.icon} {cfg.label}<br/><span className="font-normal opacity-75" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{cfg.ta}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* INLINE PREVIEW */}
                            {(selData.severity || selData.trajectory) && (
                              <div className="mt-3 bg-white rounded-lg p-3 border border-blue-200 text-xs space-y-2">
                                <p className="font-bold text-blue-700 text-xs mb-1">Document Preview:</p>
                                {selData.severity && (
                                  <>
                                    <p className="text-gray-700 leading-relaxed">{cond.severity[selData.severity]?.en}</p>
                                    <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{cond.severity[selData.severity]?.ta}</p>
                                  </>
                                )}
                                {selData.trajectory && (
                                  <>
                                    <p className="text-gray-700 leading-relaxed mt-2">{cond.trajectory[selData.trajectory]?.en}</p>
                                    <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{cond.trajectory[selData.trajectory]?.ta}</p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={totalSelected === 0} nextLabel="Next →" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — PROGNOSIS
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — PROGNOSIS  (Phase 5: full voice dictation on all text fields)
// ─────────────────────────────────────────────────────────────────────────────
function Step4Prognosis({ data, onChange, onBack, onNext }) {
  const [voiceLang, setVoiceLang] = useState("ta-IN");
  const selectedPrognosis = PROGNOSIS_LEVELS.find(p => p.id === data.level);

  return (
    <div>
      <SectionHeader en="Overall Prognosis" ta="ஒட்டுமொத்த முன்கணிப்பு" icon="📊" />

      {/* PROGNOSIS LEVEL SELECTOR */}
      <Card className="p-5 mb-4">
        <p className="text-sm font-bold text-gray-700 mb-3">
          Select Prognosis Level / முன்கணிப்பு அளவு
        </p>
        <div className="grid grid-cols-2 gap-3">
          {PROGNOSIS_LEVELS.map(p => (
            <button
              key={p.id}
              onClick={() => onChange({ ...data, level: p.id })}
              className={`p-4 rounded-xl border-2 text-left transition-all active:scale-95
                ${data.level === p.id
                  ? p.id === "terminal"  ? "border-red-500 bg-red-50"
                  : p.id === "very_poor" ? "border-orange-500 bg-orange-50"
                  : p.id === "poor"      ? "border-amber-500 bg-amber-50"
                  : "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-gray-50"}`}
            >
              <p className={`font-bold text-sm ${data.level === p.id ? "text-gray-900" : "text-gray-600"}`}>
                {p.en}
              </p>
              <p className="text-xs mt-0.5"
                style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{p.ta}</p>
            </button>
          ))}
        </div>

        {selectedPrognosis && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
            <p className="text-gray-700 leading-relaxed">{selectedPrognosis.desc_en}</p>
            <p className="text-gray-600 leading-relaxed"
              style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {selectedPrognosis.desc_ta}
            </p>
          </div>
        )}
      </Card>

      {/* FREE TEXT — bilingual, both fields voice-enabled */}
      <Card className="p-5 mb-4">
        {/* Language selector for voice */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-700">Additional Prognosis Details</p>
          <VoiceLangSelector lang={voiceLang} onLangChange={setVoiceLang} />
        </div>

        {/* English free text */}
        <div className="mb-4">
          <FieldLabel
            en="English notes"
            ta="ஆங்கில குறிப்புகள்"
          />
          <VoiceTextarea
            value={data.freeTextEn}
            onChange={v => onChange({ ...data, freeTextEn: v })}
            placeholder="Additional clinical notes in English..."
            lang="en-IN"
            rows={3}
          />
        </div>

        {/* Tamil free text — default voice target */}
        <div>
          <FieldLabel
            en="Tamil notes (voice-enabled)"
            ta="தமிழ் குறிப்புகள் — குரல் உள்ளீடு"
          />
          <VoiceTextarea
            value={data.freeTextTa}
            onChange={v => onChange({ ...data, freeTextTa: v })}
            placeholder="தமிழில் கூடுதல் குறிப்புகள்... (மேலே உள்ள 🎤 ஐ அழுத்தவும்)"
            lang="ta-IN"
            rows={3}
          />
        </div>
      </Card>

      {/* CLINICAL SCORES */}
      <Card className="p-5">
        <p className="text-sm font-bold text-gray-700 mb-1">Clinical Scores (Optional)</p>
        <p className="text-xs text-gray-400 mb-4">
          Score calculators available in Version 2. Enter manually if known.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries({
            SOFA: "SOFA Score",
            APACHE_II: "APACHE II",
            GCS: "GCS",
            qSOFA: "qSOFA",
          }).map(([key, label]) => (
            <div key={key}>
              <FieldLabel en={label} />
              <Input
                type="number"
                value={data.scores[key]}
                onChange={v => onChange({ ...data, scores: { ...data.scores, [key]: v } })}
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </Card>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — CONSENT STATEMENTS
// ─────────────────────────────────────────────────────────────────────────────
function Step5Consent({ checks, setChecks, refusal, setRefusal, onBack, onNext }) {
  return (
    <div>
      <SectionHeader en="Consent Statements" ta="சம்மத அறிக்கைகள்" icon="📋" />
      <p className="text-xs text-gray-500 mb-4">All statements are pre-checked. Uncheck if not applicable.</p>

      <Card className="p-5 mb-4 space-y-4">
        {CONSENT_STATEMENTS.map((s, i) => (
          <label key={s.id} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${checks[s.id] ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
            <input
              type="checkbox"
              checked={!!checks[s.id]}
              onChange={e => setChecks({ ...checks, [s.id]: e.target.checked })}
              className="mt-0.5 w-5 h-5 rounded accent-green-500"
            />
            <div>
              <p className="text-sm text-gray-800 leading-relaxed">{i + 1}. {s.en}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{s.ta}</p>
            </div>
          </label>
        ))}
      </Card>

      <Card className="p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={refusal.documented}
            onChange={e => setRefusal({ ...refusal, documented: e.target.checked })}
            className="mt-0.5 w-5 h-5 rounded accent-red-500"
          />
          <div>
            <p className="text-sm font-semibold text-red-700">Document Refusal to Sign</p>
            <p className="text-xs text-red-500" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>கையொப்பமிட மறுத்தல் ஆவணப்படுத்தல்</p>
          </div>
        </label>
        {refusal.documented && (
          <div className="mt-4">
            <FieldLabel en="Reason for refusal / circumstances" ta="மறுப்புக்கான காரணம்" />
            <VoiceTextarea
              value={refusal.reason}
              onChange={v => setRefusal({ ...refusal, reason: v })}
              placeholder="Describe the circumstances of refusal..."
              lang="en-IN"
              rows={3}
              className="border-red-200 bg-red-50 focus:ring-red-400"
            />
          </div>
        )}
      </Card>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — SIGNATORY
// ─────────────────────────────────────────────────────────────────────────────
function Step6Signatory({ data, onChange, onBack, onNext }) {
  return (
    <div>
      <SectionHeader en="Signatory Details" ta="கையொப்பமிட்டவர் விவரங்கள்" icon="✍️" />
      <Card className="p-5 space-y-4 mb-4">
        <div>
          <FieldLabel en="Signatory Name" ta="கையொப்பமிட்டவர் பெயர்" />
          <Input value={data.name} onChange={v => onChange({ ...data, name: v })} placeholder="Name of person signing" />
        </div>
        <div>
          <FieldLabel en="Relationship to Patient" ta="நோயாளியுடனான உறவு" />
          <Input value={data.relationship} onChange={v => onChange({ ...data, relationship: v })} placeholder="e.g. Son, Daughter, Spouse" />
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Signature Mode</p>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-700 font-semibold">✓ Signature will be obtained on printed copy</p>
          <p className="text-xs text-blue-500 mt-1">கையொப்பம் அச்சிட்ட நகலில் பெறப்படும்</p>
        </div>
        <p className="text-xs text-gray-400 mt-2">Digital signature pad available in Version 2</p>
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <FieldLabel en="Witness Name" ta="சாட்சி பெயர்" />
          <Input value={data.witnessName} onChange={v => onChange({ ...data, witnessName: v })} placeholder="Witness full name" />
        </div>
        <div>
          <FieldLabel en="Witness Designation" ta="சாட்சி பதவி" />
          <Input value={data.witnessDesignation} onChange={v => onChange({ ...data, witnessDesignation: v })} placeholder="e.g. Staff Nurse, Resident Doctor" />
        </div>
      </Card>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Generate Document →" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4 — PDF ENGINE
// Calls /api/generate-pdf (Python/ReportLab backend) and triggers download.
// Falls back to browser print if the endpoint is unavailable.
// In production: POST JSON → receive PDF blob → save to device.
// ─────────────────────────────────────────────────────────────────────────────
async function generatePDF(payload, filename) {
  try {
    //const res = await fetch("/api/generate-pdf", {
    const res = await fetch("/api/generate-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return "downloaded";
  } catch {
    // Graceful fallback → browser print dialog
    window.print();
    return "printed";
  }
}

function composeEmail(payload, filename, printerEmail) {
  const { patientData, doctorData } = payload;
  const today = formatDate();
  const to      = encodeURIComponent(printerEmail || "");
  const subject = encodeURIComponent(
    `ICU Consent — ${patientData.name || "Patient"} — UHID ${patientData.uhid || "—"} — ${today}`
  );
  const body = encodeURIComponent(
    `Dear Team,\n\nPlease find attached the ICU Prognosis Consent document:\n\n` +
    `Patient  : ${patientData.name || "—"}\nUHID     : ${patientData.uhid || "—"}\n` +
    `Age      : ${patientData.age || "—"} yrs\nSession  : ${patientData.sessionNumber || "—"}\n` +
    `Doctor   : ${doctorData.name || "—"} — ${doctorData.designation || "—"}\n` +
    `Ward     : ${doctorData.ward || "—"}\nDate     : ${today}\n\n` +
    `File: ${filename}\nPlease attach the downloaded PDF to this email.\n\n` +
    `IMPORTANT: Ensure the printed, signed copy is filed in the patient's physical medical record.\n\n` +
    `— ICU Consent App v1.0 —`
  );
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7 — EXPORT  (Phase 4)
// ─────────────────────────────────────────────────────────────────────────────
function Step7Export({
  patientData, doctorData, selectedModules, prognosisData,
  consentChecks, refusal, signatoryData,
  onBack, onPreview, onNewPatient,
  contentDB, consentStatements, prognosisLevels,
}) {
  const docId    = useRef(generateUUID().split("-")[0].toUpperCase());
//  const filename = `ICU_Consent_${patientData.uhid || "NOID"}_${formatDate().replace(/\//g, "-")}_Session${patientData.sessionNumber || "1"}.pdf`;
  const filename = `ICU_Consent_${patientData.uhid || "NOID"}_${formatDate().replace(/\//g, "-")}_Session${patientData.sessionNumber || "1"}.docx`;


  // ── hospital header toggle ──────────────────────────────────────────────
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [hospitalName, setHospitalName]       = useState("");
  const [includeHeader, setIncludeHeader]     = useState(false);
  const [pendingAction, setPendingAction]     = useState(null); // "pdf" | "print" | "email"

  // ── email ────────────────────────────────────────────────────────────────
  const [showEmailRow, setShowEmailRow]       = useState(false);
  const [printerEmail, setPrinterEmail]       = useState("");

  // ── status ───────────────────────────────────────────────────────────────
  const [status, setStatus] = useState("idle"); // idle | working | done_dl | done_pr | error

  const buildPayload = (inclHdr) => ({
    patientData, doctorData, selectedModules, prognosisData,
    consentChecks, refusal, signatoryData,
    hospitalName: inclHdr ? hospitalName : "",
    includeHospitalHeader: inclHdr,
    docId: docId.current,
    contentDB,
    consentStatements,
    prognosisLevels,
  });

  const initiateAction = (action) => {
    setPendingAction(action);
    setShowHeaderModal(true);
  };

  const proceed = async (inclHdr) => {
    setShowHeaderModal(false);
    const payload = buildPayload(inclHdr);

    if (pendingAction === "print") {
      window.print();
      return;
    }
    if (pendingAction === "email") {
      setStatus("working");
      await generatePDF(payload, filename);
      composeEmail(payload, filename, printerEmail);
      setStatus("done_dl");
      return;
    }
    // "pdf"
    setStatus("working");
    const result = await generatePDF(payload, filename);
    setStatus(result === "downloaded" ? "done_dl" : "done_pr");
  };

  const StatusBanner = () => {
    if (status === "working")  return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-3">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-700">Generating PDF…</p>
          <p className="text-xs text-blue-500">ReportLab rendering bilingual document with Tamil font.</p>
        </div>
      </div>
    );
    if (status === "done_dl") return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-xl mb-3">
        <p className="text-sm font-semibold text-green-700">✅ PDF downloaded!</p>
        <p className="text-xs text-green-600 mt-0.5">{filename}</p>
      </div>
    );
    if (status === "done_pr") return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-3">
        <p className="text-sm font-semibold text-blue-700">🖨 Print dialog opened.</p>
      </div>
    );
    if (status === "error") return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-3">
        <p className="text-sm font-semibold text-red-700">⚠ PDF API unavailable — print dialog used as fallback.</p>
      </div>
    );
    return null;
  };

  return (
    <div>
      {/* ── HOSPITAL HEADER MODAL ──────────────────────────────────────────── */}
      {showHeaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="font-bold text-gray-900 mb-1">Include hospital header?</h3>
            <p className="text-xs text-gray-500 mb-4">Applies to this export only. Selection is remembered for the session.</p>
            <div className="space-y-3 mb-5">
              <label className="flex items-start gap-3 p-3 border-2 border-blue-200 rounded-xl cursor-pointer bg-blue-50">
                <input type="radio" name="hm" checked={includeHeader}
                  onChange={() => setIncludeHeader(true)} className="mt-1 accent-blue-600 w-4 h-4" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-blue-900">Yes — include hospital name</p>
                  {includeHeader && (
                    <input autoFocus value={hospitalName} onChange={e => setHospitalName(e.target.value)}
                      placeholder="Type hospital name…"
                      className="mt-2 w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  )}
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer">
                <input type="radio" name="hm" checked={!includeHeader}
                  onChange={() => setIncludeHeader(false)} className="accent-blue-600 w-4 h-4" />
                <p className="font-semibold text-sm text-gray-700">No — generic header only</p>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowHeaderModal(false)}
                className="py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm">
                Cancel
              </button>
              <button onClick={() => proceed(includeHeader)}
                style={{ background: "linear-gradient(135deg,#1B6CA8,#0d4f80)" }}
                className="py-3 rounded-xl text-white font-bold text-sm">
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionHeader en="Document Ready" ta="ஆவணம் தயார்" icon="📄" />

      {/* SUMMARY */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">✅</div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900">Document Ready</p>
            <p className="text-xs text-gray-500 truncate">{filename}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
          <p><span className="font-semibold">Patient:</span> {patientData.name || "—"} · UHID: {patientData.uhid || "—"}</p>
          <p><span className="font-semibold">Doctor:</span> {doctorData.name || "—"} — {doctorData.designation || "—"}</p>
          <p><span className="font-semibold">Doc ID:</span> {docId.current} · {formatDate()}</p>
        </div>
      </Card>

      {/* EXPORT OPTIONS */}
      <Card className="p-5 mb-4">
        <p className="text-sm font-bold text-gray-700 mb-3">Export Options</p>
        <StatusBanner />
        <div className="space-y-3">

          {/* Preview */}
          <button onClick={onPreview}
            style={{ background: "linear-gradient(135deg,#1B6CA8,#0d4f80)" }}
            className="w-full py-4 rounded-xl text-white font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
            👁 &nbsp;Preview Full Document
          </button>

          {/* Print */}
          <button onClick={() => initiateAction("print")} disabled={status === "working"}
            className="w-full py-4 rounded-xl border-2 border-blue-600 text-blue-700 font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            🖨 &nbsp;Print Document
          </button>

          {/* Download PDF */}
          <button onClick={() => initiateAction("pdf")} disabled={status === "working"}
            className="w-full py-4 rounded-xl border-2 border-emerald-500 text-emerald-700 font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            📥 &nbsp;Download PDF
            <span className="text-xs font-normal text-emerald-400 ml-1">ReportLab · Tamil embedded</span>
          </button>

          {/* Email */}
          <div>
            <button onClick={() => setShowEmailRow(r => !r)} disabled={status === "working"}
              className="w-full py-4 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              📧 &nbsp;Email to Printer / MRD
              <span className="text-gray-400 text-sm">{showEmailRow ? "▲" : "▼"}</span>
            </button>
            {showEmailRow && (
              <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Printer / MRD email address</label>
                  <input type="email" value={printerEmail} onChange={e => setPrinterEmail(e.target.value)}
                    placeholder="printer@hospital.in"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Downloads PDF then opens your email client with the document details pre-filled.
                  Attach the downloaded PDF manually. MRD CC address configurable in Admin Settings (Phase 6).
                </p>
                <button onClick={() => initiateAction("email")} disabled={status === "working"}
                  style={{ background: "linear-gradient(135deg,#1B6CA8,#0d4f80)" }}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all disabled:opacity-50">
                  📧 &nbsp;Download PDF &amp; Compose Email
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* REMINDER */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4">
        <p className="text-sm font-bold text-amber-800 mb-1">⚠ Important Reminder</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          Ensure the printed document is <strong>signed by the patient or next of kin</strong> and <strong>filed in the physical medical record</strong> before clearing this session.
          Date and time fields are intentionally blank — to be handwritten by the clinician at time of signing.
        </p>
        <p className="text-xs text-amber-600 mt-2" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
          அச்சிட்ட ஆவணத்தில் கையொப்பம் பெற்று நோயாளியின் மருத்துவ பதிவில் சேர்க்கவும்.
        </p>
      </div>

      {/* NAV */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onBack}
          className="py-4 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm active:scale-95 transition-all">
          ← Back
        </button>
        <button
          onClick={() => { if (window.confirm("Start a new patient session? Current data will be cleared.")) onNewPatient(); }}
          className="py-4 rounded-xl border-2 border-blue-300 text-blue-700 font-bold text-sm active:scale-95 transition-all">
          New Patient +
        </button>
      </div>

      <button
        onClick={() => {
          if (window.confirm(
            "DISCHARGE & CLEAR\n\nPlease ensure all printed signed copies are filed in the patient's physical medical record.\n\nConfirm and clear all session data?"
          )) onNewPatient();
        }}
        className="w-full mt-3 py-4 rounded-xl border-2 border-red-300 text-red-600 font-bold text-sm active:scale-95 transition-all">
        🗑 Discharge &amp; Clear Patient Data
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW SCREEN — Phase 4
// Inline editing · Hospital header toggle · Download PDF · Print
// ─────────────────────────────────────────────────────────────────────────────
function PreviewScreen({ patientData, doctorData, selectedModules, prognosisData, consentChecks, refusal, signatoryData, onClose }) {
  const docId = useRef(generateUUID().split("-")[0].toUpperCase()).current;
  const today = formatDate();
  //const filename = `ICU_Consent_${patientData.uhid || "NOID"}_${today.replace(/\//g, "-")}_Session${patientData.sessionNumber || "1"}.pdf`;
  const filename = `ICU_Consent_${patientData.uhid || "NOID"}_${today.replace(/\//g, "-")}_Session${patientData.sessionNumber || "1"}.docx`;


  const selectedPrognosis  = PROGNOSIS_LEVELS.find(p => p.id === prognosisData.level);
  const hasScores          = Object.values(prognosisData.scores || {}).some(v => v !== "");
  const activeConsents     = CONSENT_STATEMENTS.filter(s => consentChecks[s.id]);

  // ── Phase 4 controls ────────────────────────────────────────────────────
  const [editMode, setEditMode]       = useState(false);
  const [editNotes, setEditNotes]     = useState("");
  const [inclHeader, setInclHeader]   = useState(false);
  const [hospName, setHospName]       = useState("");
  const [pdfStatus, setPdfStatus]     = useState("idle"); // idle|working|done|error

  const handleDownload = async () => {
    setPdfStatus("working");
    const payload = {
      patientData, doctorData, selectedModules, prognosisData,
      consentChecks, refusal, signatoryData,
      hospitalName: inclHeader ? hospName : "",
      includeHospitalHeader: inclHeader,
      docId,
      contentDB: contentDB,
      consentStatements: CONSENT_STATEMENTS,
      prognosisLevels: PROGNOSIS_LEVELS,
    };
    const result = await generatePDF(payload, filename);
    setPdfStatus(result === "downloaded" ? "done" : "printed");
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      {/* ── TOP BAR ── */}
      <div style={{ background: "linear-gradient(135deg,#1B6CA8,#0d4f80)" }}
        className="sticky top-0 z-10 text-white px-4 py-3 shadow-lg print:hidden">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <button onClick={onClose} className="font-semibold text-sm flex-shrink-0">← Back</button>
            <h2 className="font-bold text-sm">Document Preview</h2>
            <div className="flex gap-2">
              <button onClick={() => setEditMode(e => !e)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${editMode ? "bg-amber-400 text-amber-900" : "bg-white bg-opacity-20 text-white"}`}>
                {editMode ? "✓ Editing" : "✏ Edit"}
              </button>
              <button onClick={() => window.print()}
                className="text-xs bg-white bg-opacity-20 px-3 py-1.5 rounded-lg font-bold">
                🖨 Print
              </button>
            </div>
          </div>
          {/* Hospital header row */}
          <div className="flex items-center gap-3 bg-white bg-opacity-10 rounded-xl px-3 py-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold flex-shrink-0">
              <input type="checkbox" checked={inclHeader} onChange={e => setInclHeader(e.target.checked)}
                className="accent-white w-4 h-4" />
              Hospital Header
            </label>
            {inclHeader && (
              <input value={hospName} onChange={e => setHospName(e.target.value)}
                placeholder="Enter hospital name…"
                className="flex-grow bg-white bg-opacity-20 text-white placeholder-blue-200 rounded-lg px-3 py-1 text-xs border border-white border-opacity-30 focus:outline-none" />
            )}
          </div>
        </div>
      </div>

      {/* ── PDF STATUS ── */}
      {pdfStatus !== "idle" && (
        <div className="max-w-2xl mx-auto px-6 pt-3 print:hidden">
          {pdfStatus === "working" && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-700">Generating PDF…</p>
                <p className="text-xs text-blue-500">ReportLab · Carlito + FreeSans Tamil · A4</p>
              </div>
            </div>
          )}
          {pdfStatus === "done"    && <div className="p-3 bg-green-50 border border-green-200 rounded-xl"><p className="text-sm font-semibold text-green-700">✅ Downloaded: {filename}</p></div>}
          {pdfStatus === "printed" && <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl"><p className="text-sm font-semibold text-blue-700">🖨 Print dialog opened.</p></div>}
          {pdfStatus === "error"   && <div className="p-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm font-semibold text-red-700">⚠ API unavailable — print fallback used.</p></div>}
        </div>
      )}

      {/* ── INLINE EDIT BOX ── */}
      {editMode && (
        <div className="max-w-2xl mx-auto px-6 pt-3 print:hidden">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-800 mb-2">✏ Edit Mode — additional notes appended to this document only</p>
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
              placeholder="Type additional notes or one-time corrections here…"
              className="w-full border border-amber-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DOCUMENT BODY  —  matches layout of icu_consent_pdf.py exactly
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-2xl mx-auto px-6 py-6 print:px-0"
           style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>

        {/* PAGE HEADER */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
            borderBottom:"2px solid #1B3A5C", paddingBottom:"10px", marginBottom:"14px" }}>
          <div style={{ fontSize:"9pt", color:"#555" }}>
            {inclHeader && hospName
              ? <><strong style={{ fontSize:"12pt", color:"#1B3A5C" }}>{hospName}</strong><br/>ICU / Emergency Department</>
              : <span style={{ color:"#bbb", fontStyle:"italic" }}>ICU / Emergency Department</span>}
          </div>
          <div style={{ textAlign:"right", fontSize:"9pt" }}>
            <div style={{ fontSize:"11pt", fontWeight:700 }}>{patientData.name || "—"}</div>
            <div>UHID: <strong>{patientData.uhid || "—"}</strong> | Age: <strong>{patientData.age || "—"}</strong> yrs</div>
            <div>Session: <strong>{patientData.sessionNumber || "—"}</strong></div>
          </div>
        </div>

        {/* TITLE */}
        <div style={{ textAlign:"center", marginBottom:"14px", paddingBottom:"10px", borderBottom:"1px solid #ddd" }}>
          <div style={{ fontSize:"13pt", fontWeight:700, color:"#1B3A5C", marginBottom:"4px" }}>
            ICU / Emergency Prognosis Counselling and Consent Record
          </div>
          <div style={{ fontSize:"12pt", fontWeight:700, color:"#2a4a6a", fontFamily:"'Noto Sans Tamil', serif" }}>
            ICU / அவசர சிகிச்சை முன்கணிப்பு ஆலோசனை மற்றும் சம்மத பதிவு
          </div>
        </div>

        {/* CLINICIAN */}
        <section style={{ marginBottom:"16px" }}>
          <h2 style={{ fontSize:"9.5pt", fontWeight:700, color:"#1B3A5C", borderBottom:"1.5px solid #c0d0e0",
              paddingBottom:"4px", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
            Session &amp; Clinician Details
          </h2>
          {[
            ["Attending Doctor", `${doctorData.name || "—"} — ${doctorData.designation || "—"}${doctorData.regNumber ? ` (Reg: ${doctorData.regNumber})` : ""}`],
            ["Ward / Unit",      doctorData.ward],
            ["Others Present",   doctorData.othersPresent],
            doctorData.interpreterPresent ? ["Interpreter", doctorData.interpreterName || "Present"] : null,
          ].filter(Boolean).map(([label, val]) => val ? (
            <p key={label} style={{ fontSize:"9.5pt", marginBottom:"3px" }}>
              <strong style={{ color:"#555" }}>{label}:</strong>  {val}
            </p>
          ) : null)}
          <p style={{ fontSize:"8.5pt", color:"#bbb", fontStyle:"italic" }}>
            Date of Counselling: ________________  (to be handwritten at time of signing)
          </p>
        </section>

        {/* PAEDIATRIC */}
        {patientData.paediatric && (
          <div style={{ border:"2px solid #f59e0b", borderRadius:"6px", padding:"8px",
              background:"#fffbeb", marginBottom:"12px" }}>
            <p style={{ fontWeight:700, color:"#92400e", fontSize:"9.5pt" }}>⚠  PAEDIATRIC CASE</p>
            <p style={{ fontSize:"9pt", color:"#78350f", marginTop:"3px" }}>
              This document relates to a paediatric patient. Paediatric-specific clinical modules available in Version 2.
            </p>
            <p style={{ fontSize:"10pt", color:"#92400e", marginTop:"3px", fontFamily:"'Noto Sans Tamil', serif" }}>
              இந்த ஆவணம் ஒரு குழந்தை நோயாளியை சேர்ந்தது.
            </p>
          </div>
        )}

        {/* ORGAN-WISE */}
        <section style={{ marginBottom:"16px" }}>
          <h2 style={{ fontSize:"9.5pt", fontWeight:700, color:"#1B3A5C", borderBottom:"1.5px solid #c0d0e0",
              paddingBottom:"4px", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
            Clinical Condition and Organ Status
          </h2>
          <p style={{ fontSize:"11pt", fontWeight:700, color:"#2a4a6a", marginBottom:"10px",
              fontFamily:"'Noto Sans Tamil', serif" }}>
            மருத்துவ நிலை மற்றும் உறுப்பு செயல்பாடு
          </p>
          {contentDB.modules.map(module => {
            const modSel = selectedModules[module.id];
            if (!modSel || !Object.keys(modSel).length) return null;
            return (
              <div key={module.id} style={{ marginBottom:"14px" }}>
                <div style={{ fontSize:"11pt", fontWeight:700, color:"#1B3A5C", marginBottom:"2px" }}>{module.label.en}</div>
                <div style={{ fontSize:"11pt", fontWeight:700, color:"#2a4a6a", marginBottom:"8px", fontFamily:"'Noto Sans Tamil', serif" }}>{module.label.ta}</div>
                {module.conditions.map(cond => {
                  const sel = modSel[cond.id];
                  if (!sel) return null;
                  return (
                    <div key={cond.id} style={{ marginBottom:"10px", paddingBottom:"8px", borderBottom:"1px dashed #e5e5e5" }}>
                      <p style={{ fontSize:"9.5pt", fontStyle:"italic", color:"#555", marginBottom:"5px" }}>
                        {cond.keyword.en}  /  <span style={{ fontFamily:"'Noto Sans Tamil', serif" }}>{cond.keyword.ta}</span>
                      </p>
                      {sel.severity && cond.severity[sel.severity] && (<>
                        <p style={{ fontSize:"10.5pt", lineHeight:1.6, marginBottom:"5px" }}>{cond.severity[sel.severity].en}</p>
                        <p style={{ fontSize:"12pt", lineHeight:1.75, color:"#333", marginBottom:"8px", fontFamily:"'Noto Sans Tamil', serif" }}>{cond.severity[sel.severity].ta}</p>
                      </>)}
                      {sel.trajectory && cond.trajectory[sel.trajectory] && (<>
                        <p style={{ fontSize:"10.5pt", lineHeight:1.6, marginBottom:"5px" }}>{cond.trajectory[sel.trajectory].en}</p>
                        <p style={{ fontSize:"12pt", lineHeight:1.75, color:"#333", fontFamily:"'Noto Sans Tamil', serif" }}>{cond.trajectory[sel.trajectory].ta}</p>
                      </>)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>

        {/* SCORES */}
        {hasScores && (
          <section style={{ marginBottom:"16px" }}>
            <h2 style={{ fontSize:"9.5pt", fontWeight:700, color:"#1B3A5C", borderBottom:"1.5px solid #c0d0e0",
                paddingBottom:"4px", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
              Clinical Risk Assessment Scores
            </h2>
            <p style={{ fontSize:"9.5pt", color:"#555", marginBottom:"6px", fontFamily:"'Noto Sans Tamil', serif" }}>
              மருத்துவ ஆபத்து மதிப்பீட்டு புள்ளிகள்
            </p>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
              {Object.entries({ SOFA:"SOFA", APACHE_II:"APACHE II", GCS:"GCS", qSOFA:"qSOFA" }).map(([k,lbl]) =>
                prognosisData.scores[k] ? (
                  <div key={k} style={{ border:"1px solid #c0cfd8", borderRadius:"6px",
                      padding:"5px 12px", textAlign:"center", minWidth:"65px", background:"#f0f8ff" }}>
                    <div style={{ fontSize:"15pt", fontWeight:700, color:"#1B3A5C" }}>{prognosisData.scores[k]}</div>
                    <div style={{ fontSize:"7.5pt", color:"#666" }}>{lbl}</div>
                  </div>
                ) : null
              )}
            </div>
          </section>
        )}

        {/* PROGNOSIS */}
        <section style={{ marginBottom:"16px" }}>
          <h2 style={{ fontSize:"9.5pt", fontWeight:700, color:"#1B3A5C", borderBottom:"1.5px solid #c0d0e0",
              paddingBottom:"4px", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
            Overall Prognosis / ஒட்டுமொத்த முன்கணிப்பு
          </h2>
          {selectedPrognosis && (<>
            <div style={{ display:"inline-block", background:"#fee2e2", color:"#7f1d1d",
                fontWeight:700, fontSize:"11pt", padding:"3px 12px", borderRadius:"4px", marginBottom:"8px" }}>
              {selectedPrognosis.en}  /  <span style={{ fontFamily:"'Noto Sans Tamil', serif" }}>{selectedPrognosis.ta}</span>
            </div>
            <p style={{ fontSize:"10.5pt", lineHeight:1.6, marginBottom:"5px" }}>{selectedPrognosis.desc_en}</p>
            <p style={{ fontSize:"12pt", lineHeight:1.75, color:"#333", marginBottom:"8px", fontFamily:"'Noto Sans Tamil', serif" }}>{selectedPrognosis.desc_ta}</p>
          </>)}
          {prognosisData.freeTextEn && (
            <p style={{ fontSize:"10.5pt", lineHeight:1.6, borderLeft:"3px solid #1B6CA8",
                paddingLeft:"8px", background:"#f0f7ff", marginTop:"4px" }}>{prognosisData.freeTextEn}</p>
          )}
          {prognosisData.freeTextTa && (
            <p style={{ fontSize:"12pt", lineHeight:1.75, fontFamily:"'Noto Sans Tamil', serif",
                borderLeft:"3px solid #1B6CA8", paddingLeft:"8px", background:"#f0f7ff", marginTop:"4px" }}>{prognosisData.freeTextTa}</p>
          )}
        </section>

        {/* INLINE EDIT NOTES */}
        {editMode && editNotes && (
          <section style={{ marginBottom:"16px", background:"#fffbeb", border:"1px solid #f59e0b",
              borderRadius:"6px", padding:"10px" }}>
            <p style={{ fontSize:"9pt", fontWeight:700, color:"#92400e", marginBottom:"4px" }}>Additional Notes (Clinician)</p>
            <p style={{ fontSize:"10.5pt", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{editNotes}</p>
          </section>
        )}

        {/* CONSENT */}
        <section style={{ marginBottom:"16px" }}>
          <h2 style={{ fontSize:"9.5pt", fontWeight:700, color:"#1B3A5C", borderBottom:"1.5px solid #c0d0e0",
              paddingBottom:"4px", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
            Consent Acknowledgement / சம்மத உறுதிப்படுத்தல்
          </h2>
          {activeConsents.map((s, i) => (
            <div key={s.id} style={{ marginBottom:"9px" }}>
              <p style={{ fontSize:"10pt", lineHeight:1.55 }}>{i + 1}.  {s.en}</p>
              <p style={{ fontSize:"12pt", lineHeight:1.7, color:"#333", marginTop:"2px",
                  fontFamily:"'Noto Sans Tamil', serif" }}>{s.ta}</p>
            </div>
          ))}
        </section>

        {/* REFUSAL */}
        {refusal.documented && (
          <div style={{ border:"2px solid #ef4444", borderRadius:"6px", padding:"10px",
              background:"#fef2f2", marginBottom:"14px" }}>
            <p style={{ fontWeight:700, color:"#7f1d1d", fontSize:"9.5pt" }}>⚠  Documentation of Refusal to Sign</p>
            <p style={{ fontWeight:700, color:"#991b1b", fontSize:"10.5pt", marginTop:"2px",
                fontFamily:"'Noto Sans Tamil', serif" }}>கையொப்பமிட மறுத்தல் ஆவணப்படுத்தல்</p>
            <p style={{ fontSize:"9pt", color:"#7f1d1d", marginTop:"5px" }}>{refusal.reason}</p>
          </div>
        )}

        {/* SIGNATURE BLOCK */}
        <section style={{ marginTop:"20px", paddingTop:"12px", borderTop:"1.5px solid #1B3A5C" }}>
          <h2 style={{ fontSize:"9.5pt", fontWeight:700, color:"#1B3A5C", textTransform:"uppercase",
              letterSpacing:"0.5px", marginBottom:"10px" }}>
            Signature Block / கையொப்ப பகுதி
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"22px" }}>
            <div>
              {[
                { lbl:"Signatory Name / கையொப்பமிட்டவர் பெயர்", val: signatoryData.name },
                { lbl:"Relationship / நோயாளியுடனான உறவு",        val: signatoryData.relationship },
                { lbl:"Signature / கையொப்பம்",                   val: null },
              ].map(({ lbl, val }) => (
                <div key={lbl} style={{ marginBottom:"12px" }}>
                  <p style={{ fontSize:"8.5pt", fontWeight:600, color:"#555", marginBottom:"2px" }}>{lbl}</p>
                  <div style={{ borderBottom:"1px solid #aaa", minHeight: val ? "auto" : "24px",
                      paddingBottom:"2px", fontWeight:700, fontSize:"10pt" }}>{val || ""}</div>
                </div>
              ))}
            </div>
            <div>
              {[
                { lbl:"Witness / சாட்சி",             val: signatoryData.witnessName },
                { lbl:"Witness Designation / சாட்சி பதவி", val: signatoryData.witnessDesignation },
                { lbl:"Date / தேதி",                   val: null },
                { lbl:"Time / நேரம்",                   val: null },
              ].map(({ lbl, val }) => (
                <div key={lbl} style={{ marginBottom:"12px" }}>
                  <p style={{ fontSize:"8.5pt", fontWeight:600, color:"#555", marginBottom:"2px" }}>{lbl}</p>
                  <div style={{ borderBottom:"1px solid #aaa", minHeight: val ? "auto" : "24px",
                      paddingBottom:"2px", fontWeight:700, fontSize:"10pt" }}>{val || ""}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize:"7.5pt", color:"#888", fontStyle:"italic", textAlign:"center", marginTop:"10px",
              background:"#f8f8f8", padding:"6px", borderRadius:"4px", border:"1px solid #e5e5e5" }}>
            Date and time to be completed by the clinician at the time of signing. This is intentional — the app is a composition tool, not a timestamping authority.<br/>
            <span style={{ fontFamily:"'Noto Sans Tamil', serif", fontSize:"8.5pt" }}>
              தேதி மற்றும் நேரம் கையொப்பமிடும் போது மருத்துவரால் நிரப்பப்படவும்.
            </span>
          </div>
        </section>

        {/* FOOTER */}
        <div style={{ borderTop:"1px solid #ddd", paddingTop:"5px", marginTop:"16px",
            display:"flex", justifyContent:"space-between", fontSize:"7.5pt", color:"#bbb" }}>
          <span>Document ID: {docId}</span>
          <span>ICU Consent App v1.0 — {today}</span>
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 print:hidden shadow-lg">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm active:scale-95 transition-all">
            ← Back
          </button>
          <button onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl border-2 border-blue-600 text-blue-700 font-bold text-sm active:scale-95 transition-all">
            🖨 Print
          </button>
          <button onClick={handleDownload} disabled={pdfStatus === "working"}
            style={pdfStatus !== "working" ? { background:"linear-gradient(135deg,#1B6CA8,#0d4f80)" } : {}}
            className={`flex-2 flex-grow py-3 rounded-xl font-bold text-sm shadow active:scale-95 transition-all
              ${pdfStatus === "working" ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "text-white"}`}>
            {pdfStatus === "working"
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Generating…
                </span>
              : "📥 Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 6 — SETTINGS SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function SettingsScreen({ settings, onSave, savedPin, onChangePIN, adminPin, onChangeAdminPIN, onEnterAdmin, onClose, onClearAll }) {
  const [local, setLocal] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState("general"); // general | pins | storage
  const [saved, setSaved] = useState(false);

  // PIN change state
  const [newClinicalPIN, setNewClinicalPIN]   = useState("");
  const [newAdminPIN, setNewAdminPIN]         = useState("");
  const [pinSaved, setPinSaved]               = useState("");

  const handleSave = () => {
    onSave(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePINChange = (type) => {
    const val = type === "clinical" ? newClinicalPIN : newAdminPIN;
    if (!/^\d{4}$/.test(val)) { alert("PIN must be exactly 4 digits."); return; }
    if (type === "clinical") { onChangePIN(val); setNewClinicalPIN(""); }
    else { onChangeAdminPIN(val); setNewAdminPIN(""); }
    setPinSaved(type);
    setTimeout(() => setPinSaved(""), 2000);
  };

  const tabs = [
    { id: "general", label: "General" },
    { id: "pins",    label: "PINs" },
    { id: "storage", label: "Storage" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1B6CA8 0%, #0d4f80 100%)" }} className="sticky top-0 z-10 text-white px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={onClose} className="font-semibold text-sm">← Back</button>
          <h2 className="font-bold">Settings</h2>
          <button onClick={handleSave}
            className="text-xs bg-white text-blue-800 px-3 py-1.5 rounded-lg font-bold">
            {saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Tab bar */}
        <div className="flex gap-2 mb-5 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                ${activeTab === t.id ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── GENERAL TAB ── */}
        {activeTab === "general" && (
          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              <p className="text-sm font-bold text-gray-700">Institution Details</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hospital Name</label>
                <input value={local.hospitalName} onChange={e => setLocal({ ...local, hospitalName: e.target.value })}
                  placeholder="e.g. Apollo Hospitals, Chennai"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Printer Email Address</label>
                <input type="email" value={local.printerEmail} onChange={e => setLocal({ ...local, printerEmail: e.target.value })}
                  placeholder="printer@hospital.in"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="checkbox" checked={local.mrdEmailEnabled}
                    onChange={e => setLocal({ ...local, mrdEmailEnabled: e.target.checked })}
                    className="accent-blue-600 w-4 h-4" />
                  <span className="text-xs font-semibold text-gray-600">CC Medical Records Department</span>
                </label>
                {local.mrdEmailEnabled && (
                  <input type="email" value={local.mrdEmail} onChange={e => setLocal({ ...local, mrdEmail: e.target.value })}
                    placeholder="mrd@hospital.in"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                )}
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-bold text-gray-700 mb-3">Session Timeout</p>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map(mins => (
                  <button key={mins} onClick={() => setLocal({ ...local, sessionTimeout: mins })}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all
                      ${local.sessionTimeout === mins ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>
                    {mins} min
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-bold text-gray-700 mb-1">Admin Panel</p>
              <p className="text-xs text-gray-500 mb-3">Access content editor, version history, and advanced settings.</p>
              <button onClick={onEnterAdmin}
                style={{ background: "linear-gradient(135deg, #1B6CA8 0%, #0d4f80 100%)" }}
                className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all">
                🔐 Open Admin Panel
              </button>
            </Card>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400">ICU Consent App v{local.appVersion}</p>
              <p className="text-xs text-gray-400">Content DB v{contentDB.version} · {contentDB.modules.length} modules</p>
            </div>
          </div>
        )}

        {/* ── PINS TAB ── */}
        {activeTab === "pins" && (
          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              <p className="text-sm font-bold text-gray-700">Change Clinical PIN</p>
              <p className="text-xs text-gray-500">This PIN locks the app after inactivity. Required to open the app.</p>
              <input type="password" maxLength={4} value={newClinicalPIN}
                onChange={e => setNewClinicalPIN(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter new 4-digit PIN"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-center tracking-widest text-xl" />
              <button onClick={() => handlePINChange("clinical")}
                className="w-full py-3 rounded-xl border-2 border-blue-500 text-blue-700 font-bold text-sm active:scale-95 transition-all">
                {pinSaved === "clinical" ? "✓ Clinical PIN Updated" : "Update Clinical PIN"}
              </button>
            </Card>

            <Card className="p-5 space-y-4">
              <p className="text-sm font-bold text-gray-700">Change Admin PIN</p>
              <p className="text-xs text-gray-500">This PIN protects the Admin Panel and content editor.</p>
              <input type="password" maxLength={4} value={newAdminPIN}
                onChange={e => setNewAdminPIN(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter new 4-digit Admin PIN"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-center tracking-widest text-xl" />
              <button onClick={() => handlePINChange("admin")}
                className="w-full py-3 rounded-xl border-2 border-amber-500 text-amber-700 font-bold text-sm active:scale-95 transition-all">
                {pinSaved === "admin" ? "✓ Admin PIN Updated" : "Update Admin PIN"}
              </button>
            </Card>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-800 mb-1">⚠ Keep PINs safe</p>
              <p className="text-xs text-amber-700">Default clinical PIN: 1234 · Default admin PIN: 9999. Change both before clinical use.</p>
            </div>
          </div>
        )}

        {/* ── STORAGE TAB ── */}
        {activeTab === "storage" && (
          <div className="space-y-4">
            <Card className="p-5">
              <p className="text-sm font-bold text-gray-700 mb-3">Storage Tier</p>
              <div className="space-y-3">
                {[
                  { id: "session", label: "Session Only (Tier 1)", desc: "Data cleared when browser closes. Zero server storage. Recommended.", icon: "🔒" },
                  { id: "local",   label: "Local Device (Tier 2)", desc: "Data persists on this device. Clear manually on patient discharge.", icon: "💾" },
                ].map(opt => (
                  <label key={opt.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${local.storageTier === opt.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                    <input type="radio" name="storage" value={opt.id} checked={local.storageTier === opt.id}
                      onChange={() => setLocal({ ...local, storageTier: opt.id })} className="mt-1 accent-blue-600 w-4 h-4" />
                    <div>
                      <p className="font-semibold text-sm">{opt.icon} {opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            <div className="border-2 border-red-300 rounded-xl overflow-hidden">
              <div className="bg-red-50 p-4">
                <p className="text-sm font-bold text-red-800 mb-1">⚠ Clear All Local Data</p>
                <p className="text-xs text-red-700 leading-relaxed mb-3">
                  This will delete all patient session data, settings, and content overrides from this device. This cannot be undone.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm("DELETE ALL LOCAL DATA\n\nThis will erase all session data, settings, and content edits from this device.\n\nThis cannot be undone. Confirm?")) {
                      if (window.confirm("Are you absolutely sure? All data will be permanently erased.")) {
                        onClearAll();
                      }
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm active:scale-95 transition-all">
                  🗑 Clear ALL Local Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 6 — ADMIN PANEL
// ═════════════════════════════════════════════════════════════════════════════
function AdminPanel({ contentDB, contentOverrides, onSaveOverride, onUpdateContentDB, onClose }) {
  const [view, setView]           = useState("dashboard"); // dashboard | editor | search
  const [editTarget, setEditTarget] = useState(null); // { moduleId, condId, field, level }
  const [searchQuery, setSearchQuery] = useState("");

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const Dashboard = () => {
    const totalConditions = contentDB.modules.reduce((sum, m) => sum + m.conditions.length, 0);
    const totalSentences  = totalConditions * 8; // 4 severity + 4 trajectory per condition
    const overrideCount   = Object.keys(contentOverrides).length;

    return (
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Modules",    value: contentDB.modules.length, color: "blue" },
            { label: "Conditions", value: totalConditions,          color: "emerald" },
            { label: "Edits",      value: overrideCount,            color: overrideCount > 0 ? "amber" : "gray" },
          ].map(s => (
            <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-200 rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-bold text-${s.color}-700`}>{s.value}</p>
              <p className={`text-xs text-${s.color}-600`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); if (e.target.value.length > 1) setView("search"); }}
              placeholder="Search all English and Tamil content..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </Card>

        {/* Module list */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Content Modules</p>
          {contentDB.modules.map(module => {
            const editedInModule = module.conditions.some(c =>
              ["severity_mild","severity_moderate","severity_severe","severity_critical",
               "trajectory_improving","trajectory_status_quo","trajectory_worsening","trajectory_failing"]
              .some(level => contentOverrides[`${module.id}.${c.id}.${level}`])
            );
            return (
              <Card key={module.id} className={`overflow-hidden ${editedInModule ? "border-amber-300 border-2" : ""}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{module.label.en}</p>
                      <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{module.label.ta}</p>
                      <p className="text-xs text-gray-400 mt-1">{module.conditions.length} condition{module.conditions.length !== 1 ? "s" : ""}</p>
                    </div>
                    {editedInModule && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Edited</span>}
                  </div>
                  <div className="mt-3 space-y-1">
                    {module.conditions.map(cond => (
                      <button key={cond.id}
                        onClick={() => { setEditTarget({ moduleId: module.id, condId: cond.id }); setView("editor"); }}
                        className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all">
                        <p className="text-xs font-semibold text-gray-700">{cond.keyword.en}</p>
                        <p className="text-xs text-gray-400" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{cond.keyword.ta}</p>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        const newId = `cond_${Date.now()}`;
                        const newCond = {
                          id: newId,
                          keyword: { en: "New Condition", ta: "புதிய நிலை" },
                          active: true,
                          severity: {
                            mild:     { en: "", ta: "" },
                            moderate: { en: "", ta: "" },
                            severe:   { en: "", ta: "" },
                            critical: { en: "", ta: "" },
                          },
                          trajectory: {
                            improving:  { en: "", ta: "" },
                            status_quo: { en: "", ta: "" },
                            worsening:  { en: "", ta: "" },
                            failing:    { en: "", ta: "" },
                          },
                        };
                        module.conditions.push(newCond);
                        setEditTarget({ moduleId: module.id, condId: newId });
                        setView("editor");
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 border-dashed transition-all mt-1"
                    >
                      <p className="text-xs font-semibold text-blue-600">+ Add New Condition to {module.label.en}</p>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // ── SEARCH ─────────────────────────────────────────────────────────────────
  const SearchResults = () => {
    const q = searchQuery.toLowerCase();
    const results = [];

    for (const module of contentDB.modules) {
      for (const cond of module.conditions) {
        const checkText = (level, lang, text) => {
          if (text.toLowerCase().includes(q)) {
            results.push({ module, cond, level, lang, text, snippet: text.substring(0, 120) });
          }
        };
        for (const [level, texts] of Object.entries(cond.severity)) {
          checkText(`severity_${level}`, "en", texts.en);
          checkText(`severity_${level}`, "ta", texts.ta);
        }
        for (const [level, texts] of Object.entries(cond.trajectory)) {
          checkText(`trajectory_${level}`, "ta", texts.ta);
          checkText(`trajectory_${level}`, "en", texts.en);
        }
      }
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">{results.length} result{results.length !== 1 ? "s" : ""} for "<strong>{searchQuery}</strong>"</p>
        {results.slice(0, 30).map((r, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-blue-600 font-semibold mb-1">{r.module.label.en} → {r.cond.keyword.en}</p>
            <p className="text-xs text-gray-500 mb-1">{r.level.replace("_", " ")} · {r.lang === "ta" ? "Tamil" : "English"}</p>
            <p className="text-xs text-gray-700 leading-relaxed"
              style={r.lang === "ta" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : {}}>
              {r.snippet}{r.text.length > 120 ? "…" : ""}
            </p>
            <button
              onClick={() => { setEditTarget({ moduleId: r.module.id, condId: r.cond.id }); setView("editor"); }}
              className="mt-2 text-xs text-blue-600 font-semibold hover:underline">
              Edit this condition →
            </button>
          </Card>
        ))}
      </div>
    );
  };

  // ── CONTENT EDITOR ─────────────────────────────────────────────────────────
  const ContentEditor = () => {
    if (!editTarget) return null;
    const { moduleId, condId } = editTarget;
    const module = contentDB.modules.find(m => m.id === moduleId);
    const cond   = module?.conditions.find(c => c.id === condId);
    if (!cond) return null;

    const [activeLevel, setActiveLevel] = useState("severity_mild");
    const [showHistory, setShowHistory] = useState(false);
    const [editEn, setEditEn]           = useState("");
    const [editTa, setEditTa]           = useState("");
    const [reason, setReason]           = useState("");
    const [saveMsg, setSaveMsg]         = useState("");

    // Load current text (override if exists, otherwise original)
    useEffect(() => {
      const key = `${moduleId}.${condId}.${activeLevel}`;
      const override = contentOverrides[key];
      const [fieldType, level] = activeLevel.startsWith("severity_")
        ? ["severity", activeLevel.replace("severity_", "")]
        : ["trajectory", activeLevel.replace("trajectory_", "")];
      const orig = cond[fieldType]?.[level];
      setEditEn(override?.en ?? orig?.en ?? "");
      setEditTa(override?.ta ?? orig?.ta ?? "");
      setReason("");
    }, [activeLevel]);

    const handleSave = () => {
      if (!reason.trim()) { alert("Please enter a reason for this edit."); return; }
      const key = `${moduleId}.${condId}.${activeLevel}`;
      onSaveOverride(key, editEn, editTa, reason);
      setSaveMsg("Saved ✓");
      setTimeout(() => setSaveMsg(""), 2000);
    };

    const handleRestore = (histEntry) => {
      setEditEn(histEntry.en);
      setEditTa(histEntry.ta);
      setShowHistory(false);
    };

    const levelGroups = [
      { group: "Severity / தீவிரத்தன்மை", levels: [
        { id: "severity_mild",     label: "Mild",     ta: "லேசான",       color: "emerald" },
        { id: "severity_moderate", label: "Moderate", ta: "நடுத்தர",    color: "amber" },
        { id: "severity_severe",   label: "Severe",   ta: "தீவிர",       color: "orange" },
        { id: "severity_critical", label: "Critical", ta: "மிக தீவிர",   color: "red" },
      ]},
      { group: "Trajectory / மருத்துவ போக்கு", levels: [
        { id: "trajectory_improving",  label: "Improving",  ta: "மேம்படுகிறது",    color: "emerald" },
        { id: "trajectory_status_quo", label: "Status Quo", ta: "மாற்றமில்லை",     color: "blue" },
        { id: "trajectory_worsening",  label: "Worsening",  ta: "மோசமடைகிறது",    color: "orange" },
        { id: "trajectory_failing",    label: "Failing",    ta: "செயலிழக்கிறது",  color: "red" },
      ]},
    ];

    const key = `${moduleId}.${condId}.${activeLevel}`;
    const hasOverride = !!contentOverrides[key];
    const history = contentOverrides[key]?.history || [];

    const charCountEn = editEn.length;
    const charCountTa = editTa.length;

    // Compute live preview
    const previewEn = editEn;
    const previewTa = editTa;

    return (
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <button onClick={() => setView("dashboard")} className="text-blue-600 hover:underline">Modules</button>
          <span>›</span>
          <span className="text-gray-700 font-semibold">{module.label.en}</span>
          <span>›</span>
          <span className="text-gray-700">{cond.keyword.en}</span>
        </div>

        {/* Condition header */}
        <Card className="p-4">
          <p className="font-bold text-gray-900">{cond.keyword.en}</p>
          <p className="text-sm text-gray-500 mt-0.5" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{cond.keyword.ta}</p>
          {hasOverride && (
            <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
              ✏ This condition has institution edits
            </span>
          )}
        </Card>

        {/* Level selector */}
        {levelGroups.map(group => (
          <div key={group.group}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">{group.group}</p>
            <div className="grid grid-cols-2 gap-2">
              {group.levels.map(lvl => {
                const lvlKey = `${moduleId}.${condId}.${lvl.id}`;
                const isEdited = !!contentOverrides[lvlKey];
                return (
                  <button key={lvl.id}
                    onClick={() => setActiveLevel(lvl.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all active:scale-95
                      ${activeLevel === lvl.id
                        ? `border-${lvl.color}-500 bg-${lvl.color}-50`
                        : "border-gray-200 bg-white"}`}>
                    <p className="text-xs font-bold text-gray-800">{lvl.label}</p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{lvl.ta}</p>
                    {isEdited && <span className="text-xs text-amber-600 font-semibold">✏ edited</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Text editors */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700">Edit Content</p>
            {history.length > 0 && (
              <button onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-blue-600 font-semibold hover:underline">
                {showHistory ? "Hide" : "View"} History ({history.length})
              </button>
            )}
          </div>

          {/* Version history */}
          {showHistory && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3 max-h-64 overflow-y-auto">
              <p className="text-xs font-bold text-gray-600">Version History</p>
              {history.map((h, i) => (
                <div key={i} className="text-xs border-b border-gray-200 pb-2 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-gray-500">{new Date(h.date).toLocaleDateString("en-IN")} · {new Date(h.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    <button onClick={() => handleRestore(h)} className="text-blue-600 font-semibold hover:underline ml-2">Restore</button>
                  </div>
                  <p className="text-gray-500 italic mb-1">Reason: {h.reason}</p>
                  <p className="text-gray-700 line-clamp-2">{h.en.substring(0, 80)}…</p>
                </div>
              ))}
            </div>
          )}

          {/* English editor */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-600">English</label>
              <span className="text-xs text-gray-400">{charCountEn} chars</span>
            </div>
            <textarea value={editEn} onChange={e => setEditEn(e.target.value)} rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50"
            />
          </div>

          {/* Tamil editor */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-600">Tamil / தமிழ்</label>
              <span className="text-xs text-gray-400">{charCountTa} chars</span>
            </div>
            <VoiceTextarea
              value={editTa}
              onChange={setEditTa}
              placeholder="தமிழில் உரையை இங்கே எழுதவும் அல்லது குரல் மூலம் உள்ளிடவும்..."
              lang="ta-IN"
              rows={4}
            />
          </div>

          {/* Reason for edit */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Reason for edit <span className="text-red-500">*</span>
            </label>
            <input value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Corrected Tamil translation, Updated local terminology..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>

          <button onClick={handleSave}
            style={{ background: "linear-gradient(135deg, #1B6CA8 0%, #0d4f80 100%)" }}
            className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all">
            {saveMsg || "Save Changes"}
          </button>
        </Card>

        {/* Live preview */}
        <Card className="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Document Preview</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-800 leading-relaxed">{previewEn || <span className="text-gray-300 italic">English text will appear here</span>}</p>
            <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {previewTa || <span className="text-gray-300 italic">Tamil text will appear here</span>}
            </p>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d3f6b 0%, #0a2a4a 100%)" }} className="sticky top-0 z-10 text-white px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={view !== "dashboard" ? () => { setView("dashboard"); setSearchQuery(""); } : onClose}
            className="font-semibold text-sm">
            {view !== "dashboard" ? "← Modules" : "← Exit Admin"}
          </button>
          <div className="text-center">
            <h2 className="font-bold text-sm">Admin Panel</h2>
            <p className="text-xs text-blue-300">System Administrator</p>
          </div>
          <div className="w-16 text-right">
            {view === "editor" && editTarget && (
              <span className="text-xs text-blue-300">Editing</span>
            )}
          </div>
        </div>

        {/* Sub-nav */}
        {view !== "editor" && (
          <div className="max-w-2xl mx-auto mt-2 flex gap-2">
            {["dashboard", "search"].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize
                  ${view === v ? "bg-white text-blue-800" : "bg-white bg-opacity-15 text-white"}`}>
                {v === "dashboard" ? "📋 Modules" : "🔍 Search"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {view === "dashboard" && <Dashboard />}
        {view === "search"    && <SearchResults />}
        {view === "editor"    && <ContentEditor />}
      </div>
    </div>
  );
}
