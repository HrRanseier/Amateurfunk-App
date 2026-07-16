// Q-Codes & Betriebsabkürzungen — static offline reference data.
// One unified list; each entry is tagged by `type` ("qcode" | "abbr").
// `question` / `statement` mirror the Frage/Aussage form of a Q-code;
// for abbreviations the plain meaning lives in `statement`.

export type QEntryType = "qcode" | "abbr";

export type QEntry = {
  code: string;
  type: QEntryType;
  question?: string;
  statement?: string;
  practice?: string;
  mnemonic?: string;
  exam?: boolean;
  warning?: boolean;
  keywords: string;
};

export const QENTRIES: QEntry[] = [
  // ---------------------------------------------------------------- Q-Codes
  {
    code: "QRA",
    type: "qcode",
    question: "Wie ist der Name Ihrer Funkstelle?",
    statement: "Der Name meiner Funkstelle ist …",
    practice:
      'Im Amateurfunk kaum noch gebräuchlich, historisch auch für "Familie/Adresse" ("73 to ur QRA" = Grüße an die Familie).',
    keywords: "name der station, wer bist du, wer ist das, wer spricht da",
  },
  {
    code: "QRB",
    type: "qcode",
    question: "Wie groß ist die Entfernung zwischen unseren Stationen?",
    statement: "Die Entfernung beträgt …",
    keywords: "entfernung, wie weit, distanz, abstand",
  },
  {
    code: "QRG",
    type: "qcode",
    question: "Wie ist meine/Ihre genaue Frequenz?",
    statement: "Ihre/meine genaue Frequenz ist …",
    keywords: "frequenz, genaue frequenz, welche frequenz",
  },
  {
    code: "QRH",
    type: "qcode",
    question: "Ändert sich meine Frequenz?",
    statement: "Ihre Frequenz ändert sich.",
    keywords: "frequenz ändert sich, frequenz driftet, frequenz schwankt",
  },
  {
    code: "QRI",
    type: "qcode",
    question: "Wie ist der Ton meines Signals?",
    keywords: "tonqualität, wie klingt mein ton, tonhöhe",
  },
  {
    code: "QRK",
    type: "qcode",
    question: "Wie ist die Verständlichkeit meiner Signale?",
    statement: "Die Verständlichkeit ist …",
    practice: "Skala 1 (schlecht) bis 5 (sehr gut).",
    keywords: "verständlichkeit, wie gut versteht man mich, lesbarkeit, rapport",
  },
  {
    code: "QRL",
    type: "qcode",
    question: "Sind Sie beschäftigt? Ist diese Frequenz belegt?",
    statement: "Ich bin beschäftigt, bitte nicht stören.",
    practice: 'Übliche Frage vor dem Rufen auf einer scheinbar freien Frequenz ("QRL?").',
    mnemonic: '"Lazy"',
    exam: true,
    keywords: "arbeit, belegt, frei, besetzt, frequenz frei, stört es wenn ich rufe",
  },
  {
    code: "QRM",
    type: "qcode",
    question: "Werden Sie gestört?",
    statement: "Ich werde gestört.",
    practice: "Künstliche/menschengemachte Störungen.",
    mnemonic: '"Man-made"',
    exam: true,
    keywords: "interferenz, überlagerung, störung durch andere, andere funker stören, künstliche störung",
  },
  {
    code: "QRN",
    type: "qcode",
    question: "Werden Sie durch atmosphärische Störungen beeinträchtigt?",
    statement: "Ich werde durch atmosphärische Störungen beeinträchtigt.",
    practice: "Gewitter, statisches Rauschen.",
    mnemonic: '"Natural"',
    exam: true,
    keywords: "rauschen, gewitter, wetterstörung, statisches rauschen, natürliche störung",
  },
  {
    code: "QRO",
    type: "qcode",
    question: "Soll ich die Sendeleistung erhöhen?",
    statement: "Erhöhen Sie die Sendeleistung.",
    practice: "Betrieb mit hoher Leistung.",
    exam: true,
    keywords: "stark senden, hohe leistung, watt, leistung erhöhen, lauter senden",
  },
  {
    code: "QRP",
    type: "qcode",
    question: "Soll ich die Sendeleistung verringern?",
    statement: "Verringern Sie die Sendeleistung.",
    practice: "Betrieb mit geringer Leistung, meist unter 5 Watt.",
    exam: true,
    keywords: "schwach senden, wenig leistung, watt, leistung verringern, sparsam senden, batteriebetrieb",
  },
  {
    code: "QRQ",
    type: "qcode",
    question: "Soll ich schneller senden?",
    statement: "Senden Sie schneller.",
    mnemonic: 'Q wie "Quick"',
    exam: true,
    keywords: "schneller senden, schneller morsen, tempo erhöhen",
  },
  {
    code: "QRS",
    type: "qcode",
    question: "Soll ich langsamer senden?",
    statement: "Senden Sie langsamer.",
    mnemonic: 'S wie "Slow"',
    exam: true,
    keywords: "langsamer senden, langsamer morsen, tempo verringern",
  },
  {
    code: "QRT",
    type: "qcode",
    question: "Soll ich die Aussendung einstellen?",
    statement: "Stellen Sie die Aussendung ein.",
    practice:
      'Im Alltag oft im Sinne von "ich mache Schluss/beende die Verbindung", nicht als sofortiger Sendestopp.',
    mnemonic: '"Terminate"',
    exam: true,
    keywords: "aufhören, ende, feierabend, sendeschluss, ich beende, schluss machen",
  },
  {
    code: "QRU",
    type: "qcode",
    question: "Haben Sie etwas für mich?",
    statement: "Ich habe nichts für Sie.",
    keywords: "nichts für sie, keine nachricht, leer",
  },
  {
    code: "QRV",
    type: "qcode",
    question: "Sind Sie bereit?",
    statement: "Ich bin bereit.",
    practice: "Nicht verwechseln mit QSV.",
    exam: true,
    keywords: "bereit, empfangsbereit, sendebereit, startklar",
  },
  {
    code: "QRX",
    type: "qcode",
    question: "Wann rufen Sie mich wieder?",
    statement: "Ich rufe Sie wieder (später).",
    exam: true,
    keywords: "warten, später wieder melden, ich melde mich später, pause",
  },
  {
    code: "QRZ",
    type: "qcode",
    question: "Wer ruft mich?",
    practice:
      "Wird manchmal fälschlich statt CQ für den allgemeinen Anruf verwendet (siehe Abkürzung CQ); korrekt nur verwenden, wenn man gerufen wurde, das Rufzeichen aber nicht verstanden hat, häufig bei Pile-ups.",
    exam: true,
    keywords: "wer ruft, identifizieren, wer ist das, wer hat mich gerufen, rufzeichen wiederholen",
  },
  {
    code: "QSA",
    type: "qcode",
    question: "Wie ist die Signalstärke?",
    statement: "Die Signalstärke ist …",
    practice: "Skala 1 (kaum wahrnehmbar) bis 5 (sehr stark).",
    keywords: "signalstärke, wie stark ist mein signal, empfangsstärke",
  },
  {
    code: "QSB",
    type: "qcode",
    question: "Schwankt die Stärke meiner Signale?",
    statement: "Ihre/meine Signale schwanken (Fading).",
    exam: true,
    keywords: "schwankend, fading, signalstärke schwankt",
  },
  {
    code: "QSD",
    type: "qcode",
    statement: "Ihre Zeichengebung ist fehlerhaft/unklar.",
    keywords: "unklare zeichen, fehlerhafte morsezeichen, schlecht lesbar",
  },
  {
    code: "QSK",
    type: "qcode",
    statement: "Ich kann während meiner Sendepausen Signale empfangen (Break-in).",
    keywords: "durchhören während sendung, vollduplex, break-in",
  },
  {
    code: "QSL",
    type: "qcode",
    question: "Können Sie den Empfang bestätigen?",
    statement: "Ich bestätige den Empfang.",
    practice: 'Als Substantiv auch "QSL-Karte".',
    exam: true,
    keywords: "karte, bestätigungskarte, empfang bestätigen, hast du mich gehört, bestätigung",
  },
  {
    code: "QSO",
    type: "qcode",
    question: "Können Sie direkt mit … Funkverkehr aufnehmen?",
    practice: 'Im Alltag allgemeiner Begriff für "Funkverbindung/Funkgespräch".',
    exam: true,
    keywords: "funkverbindung, funkgespräch, kontakt, verbindung",
  },
  {
    code: "QSP",
    type: "qcode",
    statement: "Ich vermittle/leite weiter an …",
    keywords: "weiterleiten, vermitteln, nachricht weitergeben",
  },
  {
    code: "QSV",
    type: "qcode",
    statement: "Senden Sie eine Reihe von Vs (Einstellung/Test).",
    practice: "Nicht verwechseln mit QRV.",
    keywords: "testsignal senden, v senden, einstellung testen",
  },
  {
    code: "QSY",
    type: "qcode",
    question: "Soll ich die Frequenz wechseln?",
    statement: "Wechseln Sie die Frequenz.",
    exam: true,
    keywords: "frequenz wechseln, kanal wechseln, umschalten",
  },
  {
    code: "QTC",
    type: "qcode",
    statement: "Ich habe eine Nachricht/Mitteilung für Sie.",
    keywords: "nachricht, mitteilung, ich habe was für dich",
  },
  {
    code: "QTH",
    type: "qcode",
    question: "Wie ist Ihr Standort?",
    statement: "Mein Standort ist …",
    mnemonic: 'H wie "Home"',
    exam: true,
    keywords: "wohnort, ort, adresse, standort, wo bist du",
  },
  {
    code: "QTR",
    type: "qcode",
    question: "Wie spät ist es?",
    statement: "Die genaue Zeit ist …",
    keywords: "uhrzeit, wie spät ist es, genaue zeit",
  },
  {
    code: "73",
    type: "abbr",
    statement: "Beste Grüße",
    practice: "Übliche Verabschiedung am Ende eines QSO. KEIN Q-Code, sondern eigenständige Zahlen-Abkürzung.",
    keywords: "grüße, tschüss, verabschiedung, auf wiederhören",
  },
  {
    code: "88",
    type: "abbr",
    statement: "Küsse / Liebe Grüße",
    practice: "Informellere Verabschiedung, seltener als 73. KEIN Q-Code.",
    keywords: "küsse, liebe grüße, kuss",
  },

  // -------------------------------------------------------- Betriebsabkürzungen
  {
    code: "CQ",
    type: "abbr",
    statement: "Allgemeiner Anruf an alle Stationen.",
    practice: "Standard-Ruf zum Verbindungsaufbau.",
    keywords: "allgemeiner anruf, ich rufe, verbindung suchen, wer ist da",
  },
  {
    code: "CQ DX",
    type: "abbr",
    statement: "Allgemeiner Anruf, nur Fernverbindungen erwünscht.",
    keywords: "fernverbindung, dx anruf, seltenes land gesucht",
  },
  {
    code: "CQ TEST",
    type: "abbr",
    statement: "Allgemeiner Anruf im Rahmen eines Wettbewerbs.",
    keywords: "contest, wettbewerb anruf",
  },
  {
    code: "DX",
    type: "abbr",
    statement: "Große Entfernung / entfernte, seltene Station.",
    keywords: "entfernung, ferne station, exotisches land, seltenes land",
  },
  {
    code: "TX",
    type: "abbr",
    statement: "Sender (Transmitter).",
    keywords: "sender, senderteil",
  },
  {
    code: "RX",
    type: "abbr",
    statement: "Empfänger (Receiver).",
    keywords: "empfänger, empfangsteil",
  },
  {
    code: "CW",
    type: "abbr",
    statement: "Morsetelegrafie (Continuous Wave), Standard-Logbuchkennung.",
    keywords: "morsen, morsetelegrafie, telegrafie",
  },
  {
    code: "R",
    type: "abbr",
    statement: 'Bestätigung "richtig empfangen", in Telefonie "Roger".',
    keywords: "bestätigt, verstanden, roger, richtig empfangen",
  },
  {
    code: "K",
    type: "abbr",
    statement: 'Aufforderung zum Senden ("kommen"/"over").',
    keywords: "kommen, over, du bist dran, sende jetzt",
  },
  {
    code: "BK",
    type: "abbr",
    statement:
      'Auch "Break". Unterbrechungssignal für schnelle Zwischenrufe ohne volle Rufzeichennennung. Oft wird fachlich falsch "QRX" oder "X" verwendet!',
    keywords: "unterbrechen, zwischenruf, break",
  },
  {
    code: "MSG",
    type: "abbr",
    statement: "Mitteilung (Message).",
    keywords: "nachricht, mitteilung",
  },
  {
    code: "RST",
    type: "abbr",
    statement:
      "Rapport-System: R = Lesbarkeit (1–5), S = Signalstärke (1–9), T = Tonqualität (1–9, nur CW/Digital, entfällt bei Sprechfunk).",
    keywords: "rapport, signalbericht, wie ist mein signal",
  },
  {
    code: "PSE",
    type: "abbr",
    statement: "Bitte (Please).",
    keywords: "bitte",
  },
  {
    code: "TNX",
    type: "abbr",
    statement: "Danke (Thanks).",
    keywords: "danke, vielen dank",
  },
  {
    code: "HW?",
    type: "abbr",
    statement: "Wie ist der Empfang? (How copy?)",
    keywords: "hörst du mich, empfang wie",
  },
  {
    code: "HI",
    type: "abbr",
    statement: "Ausdruck für Lachen.",
    keywords: "lachen, haha, witzig",
  },
  {
    code: "GM / GA / GE / GN",
    type: "abbr",
    statement: "Guten Morgen / Guten Tag / Guten Abend / Gute Nacht.",
    keywords: "begrüßung, guten morgen, guten abend, gute nacht",
  },
  {
    code: "ES",
    type: "abbr",
    statement: '"und" (and)',
    keywords: "und",
  },
  {
    code: "UR",
    type: "abbr",
    statement: "Dein / Ihr (Your).",
    keywords: "dein, ihr, deine",
  },
  {
    code: "OM",
    type: "abbr",
    statement: "Freundliche Anrede für einen männlichen Funkamateur (Old Man).",
    keywords: "mann, kollege, anrede, funkamateur",
  },
  {
    code: "YL",
    type: "abbr",
    statement: "Weibliche Funkamateurin (Young Lady).",
    keywords: "frau, funkerin",
  },
  {
    code: "XYL",
    type: "abbr",
    statement: "Ehefrau eines Funkamateurs.",
    keywords: "ehefrau, frau des funkamateurs",
  },
  {
    code: "FB",
    type: "abbr",
    statement: "Sehr gut, ausgezeichnet (Fine Business).",
    keywords: "super, klasse, ausgezeichnet, sehr gut",
  },
  {
    code: "WX",
    type: "abbr",
    statement: "Wetter (Weather).",
    keywords: "wetter",
  },
  {
    code: "PWR",
    type: "abbr",
    statement: "Sendeleistung (Power).",
    keywords: "leistung, watt",
  },
  {
    code: "ANT",
    type: "abbr",
    statement: "Antenne.",
    keywords: "antenne",
  },
  {
    code: "RIG",
    type: "abbr",
    statement: "Funkgerät / Station.",
    keywords: "funkgerät, ausrüstung, station",
  },
  {
    code: "HR",
    type: "abbr",
    statement: "Hier (Here).",
    keywords: "hier, an diesem ort",
  },
  {
    code: "NW",
    type: "abbr",
    statement: "Jetzt (Now).",
    keywords: "jetzt, nun",
  },
  {
    code: "FER",
    type: "abbr",
    statement: "Für (For).",
    keywords: "für",
  },
  {
    code: "MNI",
    type: "abbr",
    statement: "Viele (Many).",
    keywords: "viele, viel",
  },
  {
    code: "99",
    type: "abbr",
    warning: true,
    statement:
      'Nicht verwenden! Bedeutet sinngemäß "Verschwinde!" und gilt unter Funkamateuren als unhöflich/beleidigend. Bei Störungen stattdessen "PSE QSY" senden.',
    keywords: "verschwinde, unhöflich, nicht verwenden, störung beenden",
  },
];

export function searchEntries(
  query: string,
  filter: "all" | "qcode" | "abbr",
  examOnly: boolean,
): QEntry[] {
  const q = query.trim().toLowerCase();
  const out = QENTRIES.filter((e) => {
    if (filter !== "all" && e.type !== filter) return false;
    if (examOnly && !e.exam) return false;
    if (!q) return true;
    const hay = `${e.code} ${e.question ?? ""} ${e.statement ?? ""} ${e.practice ?? ""} ${
      e.mnemonic ?? ""
    } ${e.keywords}`.toLowerCase();
    return hay.includes(q);
  });
  out.sort((a, b) => a.code.localeCompare(b.code, "de"));
  return out;
}
