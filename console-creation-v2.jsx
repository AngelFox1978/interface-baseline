import React, { useState, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  CONSOLE DE CRÉATION — pupitre de régie pour vidéos courtes IA       */
/*  Palette : papier chaud + encre, accent corail "REC", teal "revenu" */
/*  Type    : Space Grotesk (display) + IBM Plex Mono (données)         */
/* ------------------------------------------------------------------ */

const C = {
  paper: "#F7F5EF",
  panel: "#FFFFFF",
  ink: "#191A1D",
  slate: "#6B6F76",
  line: "#E4E0D6",
  rec: "#E8503A",     // corail — live / record / risque
  teal: "#137A6E",    // revenu / positif
  amber: "#C98A1E",   // attention
};

const PLATFORMS = ["TikTok", "YouTube Shorts", "Instagram Reels", "YouTube (long)"];
const STAGES = [
  { id: "idee", label: "Idée" },
  { id: "script", label: "Script" },
  { id: "produite", label: "Produite" },
  { id: "publiee", label: "Publiée" },
];

/* ---------- appel API Claude ---------- */
async function callClaude(userText, { search = false } = {}) {
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: userText }],
  };
  if (search) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function extractJSON(text) {
  let t = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const a = t.indexOf("["), b = t.lastIndexOf("]");
  const o = t.indexOf("{"), p = t.lastIndexOf("}");
  let slice = null;
  if (a !== -1 && b !== -1 && (a < o || o === -1)) slice = t.slice(a, b + 1);
  else if (o !== -1 && p !== -1) slice = t.slice(o, p + 1);
  if (!slice) return null;
  try { return JSON.parse(slice); } catch { return null; }
}

/* ---------- petits composants ---------- */
function RecDot({ on = true, size = 8 }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: C.rec, opacity: on ? 1 : 0.3 }} />
      {on && <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: C.rec, animation: "pulse 1.6s ease-out infinite" }} />}
    </span>
  );
}

function RiskBadge({ level }) {
  const map = {
    faible: { c: C.teal, t: "RISQUE FAIBLE" },
    moyen: { c: C.amber, t: "RISQUE MOYEN" },
    eleve: { c: C.rec, t: "RISQUE ÉLEVÉ" },
  };
  const m = map[level] || map.moyen;
  return (
    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 0.5,
      color: m.c, border: `1px solid ${m.c}`, borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap" }}>
      {m.t}
    </span>
  );
}

function Spinner() {
  return <span style={{ display: "inline-block", width: 14, height: 14, border: `2px solid ${C.line}`,
    borderTopColor: C.rec, borderRadius: 999, animation: "spin .7s linear infinite" }} />;
}

/* ====================================================================== */
/*  TAB 1 — RADAR DE NICHES                                                */
/* ====================================================================== */
function NicheRadar({ niches, setNiches, nicheCount = 10, onSendToStudio }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toolsLoading, setToolsLoading] = useState(false);
  const [tools, setTools] = useState([]);
  const [toolsErr, setToolsErr] = useState("");

  async function scan() {
    setLoading(true); setErr(""); setNiches([]);
    const prompt = `Tu es analyste de tendances pour créateurs de vidéos courtes IA "faceless".
Recherche sur le web les niches porteuses MAINTENANT pour des chaînes faceless/IA sur TikTok et YouTube Shorts (France/Europe).
Réponds UNIQUEMENT par un tableau JSON de ${nicheCount} objets (un top ${nicheCount}), sans aucun texte avant ou après, sans backticks. Champs (français, très concis) :
"nom" (string), "pourquoi" (1 phrase courte : pourquoi ça marche maintenant), "format" (string court),
"monetisation_fr" (1 phrase : comment ça gagne en France), "risque" ("faible"|"moyen"|"eleve" : risque de démonétisation "slop"),
"angle" (1 exemple d'angle vidéo concret).`;
    try {
      const txt = await callClaude(prompt, { search: true });
      const json = extractJSON(txt);
      if (!json || !Array.isArray(json)) throw new Error("parse");
      setNiches(json);
    } catch (e) {
      setErr("Le scan n'a pas abouti. Réessaie — l'analyse interroge le web en direct et peut être un peu longue.");
    } finally {
      setLoading(false);
    }
  }

  async function scanTools() {
    setToolsLoading(true); setToolsErr(""); setTools([]);
    const prompt = `Tu es veilleur d'outils pour créateurs de vidéos courtes et diaporamas faceless (France, 2026).
Recherche sur le web les meilleurs outils du moment, avec leurs évolutions récentes (changements de prix, fonctions devenues payantes, conditions d'utilisation problématiques).
Couvre ces catégories : "Montage", "Voix off", "Visuel / IA", "Sous-titres", "Publication / suivi".
Réponds UNIQUEMENT par un tableau JSON de 8 à 10 objets, sans texte ni backticks. Champs (français, concis) :
"categorie" (une des catégories ci-dessus), "outil" (nom), "pour_quoi" (1 phrase : à quoi ça sert / sa force),
"prix" (ex: "Gratuit", "Gratuit + Pro ~12€/mois", "~24$/mois"), "note" (1 conseil ou piège à connaître, ex: paywall récent, filigrane, droits sur le contenu).`;
    try {
      const txt = await callClaude(prompt, { search: true });
      const json = extractJSON(txt);
      if (!json || !Array.isArray(json)) throw new Error("parse");
      setTools(json);
    } catch (e) {
      setToolsErr("La veille n'a pas abouti. Réessaie — elle interroge le web en direct.");
    } finally {
      setToolsLoading(false);
    }
  }

  return (
    <div>
      <Header
        eyebrow="Signal / live"
        title="Radar"
        sub="Claude interroge le web en direct : les niches qui tournent (avec leur risque de démonétisation) et les outils du moment à connaître." />
      <button onClick={scan} disabled={loading} style={btnPrimary(loading)}>
        {loading ? <><Spinner /> <span style={{ marginLeft: 8 }}>Scan en cours…</span></> : <>◉ Lancer le scan des tendances</>}
      </button>
      {err && <p style={{ color: C.rec, fontSize: 13, marginTop: 14 }}>{err}</p>}

      <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
        {niches.map((n, i) => (
          <div key={i} style={card()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: C.slate }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 style={{ margin: 0, fontFamily: "'Space Grotesk',sans-serif", fontSize: 19, color: C.ink }}>{n.nom}</h3>
              </div>
              <RiskBadge level={n.risque} />
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 14, color: C.ink, lineHeight: 1.5 }}>{n.pourquoi}</p>
            <div style={metaGrid()}>
              <Meta k="Format" v={n.format} />
              <Meta k="Monétisation FR" v={n.monetisation_fr} />
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 13, color: C.slate, fontStyle: "italic" }}>↳ {n.angle}</p>
            <button onClick={() => onSendToStudio(n)} style={btnGhost()}>Travailler cette niche →</button>
          </div>
        ))}
      </div>
      {!loading && niches.length === 0 && !err && (
        <p style={{ marginTop: 24, color: C.slate, fontSize: 14, lineHeight: 1.6 }}>
          Le radar est éteint. Lance un scan pour voir les niches du moment.<br />
          <span style={{ fontSize: 12 }}>Rappel : une niche « porteuse » sans angle humain reste démonétisable. Le radar évalue ce risque.</span>
        </p>
      )}

      <div style={{ marginTop: 34, borderTop: `1px solid ${C.line}`, paddingTop: 22 }}>
        <p style={eyebrowStyle()}>Veille / outils</p>
        <h3 style={{ margin: "3px 0 4px", fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, color: C.ink, letterSpacing: -0.3 }}>Outils du moment</h3>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: C.slate, maxWidth: 560, lineHeight: 1.5 }}>
          Montage, voix, visuel, sous-titres, publication — ce qui est recommandé en ce moment, avec les pièges (prix, filigrane, droits) à connaître.
        </p>
        <button onClick={scanTools} disabled={toolsLoading} style={{ ...btnPrimary(toolsLoading), marginTop: 0 }}>
          {toolsLoading ? <><Spinner /><span style={{ marginLeft: 8 }}>Veille en cours…</span></> : "◉ Scanner les outils"}
        </button>
        {toolsErr && <p style={{ color: C.rec, fontSize: 13, marginTop: 14 }}>{toolsErr}</p>}

        <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
          {tools.map((t, i) => (
            <div key={i} style={card()}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 0.5, color: C.teal,
                  border: `1px solid ${C.teal}`, borderRadius: 4, padding: "2px 6px" }}>{String(t.categorie || "").toUpperCase()}</span>
                <h4 style={{ margin: 0, fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, color: C.ink }}>{t.outil}</h4>
                {t.prix && <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.slate }}>{t.prix}</span>}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>{t.pour_quoi}</p>
              {t.note && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: C.amber, lineHeight: 1.45 }}>⚠ {t.note}</p>}
            </div>
          ))}
        </div>
        {!toolsLoading && tools.length === 0 && !toolsErr && (
          <p style={{ marginTop: 16, color: C.slate, fontSize: 13 }}>Lance la veille pour voir les outils recommandés en ce moment, et surtout ce qui a changé récemment.</p>
        )}
      </div>
    </div>
  );
}

/* ====================================================================== */
/*  TAB 2 — ATELIER (génération de fiche de production)                    */
/* ====================================================================== */
const PRESET_NICHES = ["Tutos outils IA", "Finance perso", "Productivité & IA", "Résumés de livres", "Histoire & culture", "Tech & comparatifs"];

function Studio({ seed, nicheList = [], batchCount = 20, onAddToPipeline }) {
  const [niche, setNiche] = useState("");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [dur, setDur] = useState("60");
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [slides, setSlides] = useState(null);
  const [format, setFormat] = useState("video");
  const [err, setErr] = useState("");

  // générateur de lot (20 idées)
  const liveNiches = (nicheList || []).map((n) => n.nom).filter(Boolean);
  const allNiches = Array.from(new Set([...liveNiches, ...PRESET_NICHES]));
  const [batchNiche, setBatchNiche] = useState(allNiches[0] || "Tutos outils IA");
  const [batchFormat, setBatchFormat] = useState("video");
  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasErr, setIdeasErr] = useState("");

  useEffect(() => {
    if (seed) { setNiche(seed.nom || ""); setTopic(seed.angle || ""); }
  }, [seed]);

  function parseIdeas(txt) {
    let t = txt.replace(/```json/gi, "").replace(/```/g, "").trim();
    const a = t.indexOf("[");
    if (a === -1) return null;
    let slice = t.slice(a);
    try { return JSON.parse(slice); } catch {}
    // récupération si la réponse a été tronquée : on coupe au dernier objet complet
    const lastObj = slice.lastIndexOf("}");
    if (lastObj !== -1) {
      try { return JSON.parse(slice.slice(0, lastObj + 1) + "]"); } catch {}
    }
    return null;
  }

  async function generateIdeas() {
    setIdeasLoading(true); setIdeasErr(""); setIdeas([]); setSheet(null); setSlides(null);
    const fmtLine = batchFormat === "mixte"
      ? `Mélange vidéos et diaporamas : pour chaque idée, choisis le format le plus pertinent et indique-le dans le champ "type" ("video" ou "diaporama").`
      : `Toutes les idées sont au format ${batchFormat === "diaporama" ? "diaporama (carrousel)" : "vidéo courte"}. Mets "type":"${batchFormat}" pour chaque idée.`;
    const prompt = `Tu es scénariste de contenus courts faceless qui RESPECTENT les règles d'authenticité des plateformes (pas de slop).
Niche : ${batchNiche}. Plateforme : ${platform}.
${fmtLine}
Donne ${batchCount} idées distinctes et concrètes, à fort potentiel de rétention, avec un vrai angle humain.
Réponds UNIQUEMENT par un tableau JSON de ${batchCount} objets, sans texte ni backticks. Sois TRÈS concis pour tout faire tenir.
Champs : "titre" (court, accrocheur), "type" ("video" ou "diaporama"), "hook" (phrase d'accroche courte), "angle" (l'apport humain, court).`;
    try {
      const txt = await callClaude(prompt);
      let json = parseIdeas(txt);
      if (!json || !Array.isArray(json) || json.length === 0) throw new Error("parse");
      if (batchFormat !== "mixte") json = json.map((it) => ({ ...it, type: batchFormat }));
      else json = json.map((it) => ({ ...it, type: it.type === "diaporama" ? "diaporama" : "video" }));
      setIdeas(json);
    } catch (e) {
      setIdeasErr("Le lot n'a pas abouti. Relance — un grand nombre d'idées peut être un peu long, et au-delà de ~25 la liste peut être tronquée.");
    } finally {
      setIdeasLoading(false);
    }
  }

  function scriptFromIdea(idea) {
    const t = idea.titre + (idea.angle ? " — " + idea.angle : "");
    const fmt = idea.type === "diaporama" ? "diaporama" : "video";
    setFormat(fmt);
    setNiche(batchNiche);
    setTopic(t);
    generate(t, fmt);
  }

  async function generate(overrideTopic, overrideFormat) {
    const t = (typeof overrideTopic === "string" && overrideTopic) ? overrideTopic : topic;
    const fmt = overrideFormat || format;
    if (!t.trim()) { setErr("Indique au moins un sujet."); return; }
    setLoading(true); setErr(""); setSheet(null); setSlides(null);
    const videoPrompt = `Tu es scénariste de vidéos courtes virales qui RESPECTENT les règles d'authenticité des plateformes (pas de slop).
Crée une fiche de production pour une vidéo.
Niche: ${niche || batchNiche || "(libre)"} | Sujet/angle: ${t} | Plateforme: ${platform} | Durée cible: ${dur}s.
Réponds UNIQUEMENT par un objet JSON, sans texte ni backticks. Champs (français) :
"titre" (accrocheur), "hook" (la phrase des 3 premières secondes), "hooks_alt" (tableau de 2 variantes d'accroche différentes, à tester en A/B),
"script" (tableau de 3 à 5 objets {temps:"0-5s", voix:"texte voix off", visuel:"plan/B-roll", texte_ecran:"overlay"}),
"cta" (appel à l'action de fin), "description" (legende publication courte), "hashtags" (tableau de 5 strings sans #),
"angle_humain" (1 phrase: l'apport humain/original qui évite la démonétisation),
"divulgation" (string: rappel si contenu IA réaliste à déclarer, sinon "Non requis ici").`;
    const slidePrompt = `Tu es créateur de carrousels (diaporamas) viraux pour réseaux sociaux, format idéal pour les tutos IA (captures annotées).
Crée la structure d'un carrousel.
Niche: ${niche || batchNiche || "(libre)"} | Sujet/angle: ${t} | Plateforme: ${platform}.
Réponds UNIQUEMENT par un objet JSON, sans texte ni backticks. Champs (français) :
"titre" (court), "slides" (tableau de 6 à 8 objets {texte:"le texte EXACT à mettre sur la slide, court et percutant", visuel:"la capture/le visuel à montrer"} ; la slide 1 = le hook visuel, la dernière = le CTA),
"description" (légende de publication courte), "hashtags" (tableau de 5 strings sans #),
"angle_humain" (1 phrase: l'apport humain qui évite le 'contenu non authentique').`;
    try {
      const txt = await callClaude(fmt === "diaporama" ? slidePrompt : videoPrompt);
      const json = extractJSON(txt);
      if (!json) throw new Error("parse");
      if (fmt === "diaporama") setSlides(json); else setSheet(json);
    } catch (e) {
      setErr("Génération échouée. Reformule le sujet et réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Header eyebrow="Plateau" title="Atelier" sub="Un lot d'idées (vidéos, diaporamas ou mixte) par niche, ou un script sur ton propre sujet." />

      <div style={card()}>
        <p style={eyebrowStyle()}>Générateur de lot · {batchCount} idées</p>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {[["video", "🎬 Vidéo"], ["diaporama", "▦ Diaporama"], ["mixte", "⇄ Mixte"]].map(([id, lbl]) => (
            <button key={id} onClick={() => setBatchFormat(id)}
              style={{ flex: 1, padding: "8px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13,
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600,
                border: `1px solid ${batchFormat === id ? C.ink : C.line}`,
                background: batchFormat === id ? C.ink : C.panel, color: batchFormat === id ? "#fff" : C.slate }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={batchNiche} onChange={(e) => setBatchNiche(e.target.value)} style={{ ...input(), width: "auto", minWidth: 200, flex: 1 }}>
            {allNiches.map((n) => <option key={n}>{n}</option>)}
          </select>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ ...input(), width: 160 }}>
            {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <button onClick={generateIdeas} disabled={ideasLoading} style={{ ...btnPrimary(ideasLoading), marginTop: 0 }}>
            {ideasLoading ? <><Spinner /><span style={{ marginLeft: 8 }}>Génération…</span></> : `⚡ Générer ${batchCount} idées`}
          </button>
        </div>
        {ideasErr && <p style={{ color: C.rec, fontSize: 13, marginTop: 10 }}>{ideasErr}</p>}

        {ideas.length > 0 && (
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            {ideas.map((it, i) => (
              <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.slate }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 600, color: C.ink }}>{it.titre}</span>
                  <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 0.5,
                    color: it.type === "diaporama" ? C.teal : C.rec, border: `1px solid ${it.type === "diaporama" ? C.teal : C.rec}`,
                    borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap" }}>
                    {it.type === "diaporama" ? "▦ DIAPORAMA" : "🎬 VIDÉO"}
                  </span>
                </div>
                {it.hook && <p style={{ margin: "6px 0 0", fontSize: 13, color: C.ink }}><b>Hook —</b> {it.hook}</p>}
                {it.angle && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.slate, fontStyle: "italic" }}>↳ {it.angle}</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => scriptFromIdea(it)} style={{ ...btnGhost(), marginTop: 0 }}>
                    {it.type === "diaporama" ? "▦ Générer le diaporama" : "✎ Script complet"}
                  </button>
                  <button onClick={() => onAddToPipeline({ title: it.titre, platform, niche: batchNiche })} style={{ ...btnGhost(), marginTop: 0 }}>+ Pipeline</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!ideasLoading && ideas.length === 0 && !ideasErr && (
          <p style={{ marginTop: 10, fontSize: 12.5, color: C.slate }}>Choisis une niche et lance le lot. Tu pourras développer chaque idée en script complet, ou l'envoyer directement au pipeline.</p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 14px" }}>
        <div style={{ flex: 1, height: 1, background: C.line }} />
        <span style={{ ...eyebrowStyle() }}>ou</span>
        <div style={{ flex: 1, height: 1, background: C.line }} />
      </div>

      <div style={card()}>
        <p style={eyebrowStyle()}>Ton idée à toi</p>
        <h3 style={{ margin: "3px 0 2px", fontFamily: "'Space Grotesk',sans-serif", fontSize: 19, color: C.ink }}>Écris ton propre sujet</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: C.slate, lineHeight: 1.5 }}>
          Une idée qui n'est pas dans la liste ? Donne-la ici, choisis le format, et Claude génère le script complet (hook, déroulé, légende, hashtags, apport humain).
        </p>

        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {[["video", "🎬 Vidéo"], ["diaporama", "▦ Diaporama"]].map(([id, lbl]) => (
            <button key={id} onClick={() => setFormat(id)}
              style={{ flex: 1, padding: "9px 12px", borderRadius: 7, cursor: "pointer", fontSize: 13.5,
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600,
                border: `1px solid ${format === id ? C.ink : C.line}`,
                background: format === id ? C.ink : C.panel, color: format === id ? "#fff" : C.slate }}>
              {lbl}
            </button>
          ))}
        </div>

        <Field label="Sujet / angle (ton idée)">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="ex : comparer 3 IA sur le même prompt et donner mon verdict" style={input()} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Niche">
            <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="ex : tutos IA" style={input()} />
          </Field>
          <Field label="Plateforme">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={input()}>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          {format === "video" && (
            <Field label="Durée (s)">
              <input value={dur} onChange={(e) => setDur(e.target.value.replace(/\D/g, ""))} style={{ ...input(), width: 90 }} />
            </Field>
          )}
          <button onClick={() => generate()} disabled={loading} style={{ ...btnPrimary(loading), marginBottom: 14 }}>
            {loading ? <><Spinner /><span style={{ marginLeft: 8 }}>Génération…</span></>
              : (format === "diaporama" ? "▦ Générer le diaporama" : "✎ Générer le script")}
          </button>
        </div>
        {err && <p style={{ color: C.rec, fontSize: 13 }}>{err}</p>}
      </div>

      {sheet && (
        <div style={{ ...card(), marginTop: 18 }}>
          <p style={eyebrowStyle()}>Titre</p>
          <h3 style={{ margin: "2px 0 0", fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, color: C.ink, lineHeight: 1.2 }}>{sheet.titre}</h3>

          <div style={{ marginTop: 14, padding: "10px 12px", background: C.paper, borderLeft: `3px solid ${C.rec}`, borderRadius: 4 }}>
            <p style={eyebrowStyle()}>Hook · 0–3s</p>
            <p style={{ margin: "2px 0 0", fontSize: 15, color: C.ink, fontWeight: 600 }}>{sheet.hook}</p>
          </div>

          {Array.isArray(sheet.hooks_alt) && sheet.hooks_alt.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={eyebrowStyle()}>Variantes de hook · à tester (A/B)</p>
              <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                {sheet.hooks_alt.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", border: `1px solid ${C.line}`, borderRadius: 6, padding: "7px 10px" }}>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.rec }}>{String.fromCharCode(66 + i)}</span>
                    <span style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.4 }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={{ ...eyebrowStyle(), marginTop: 18 }}>Script minuté</p>
          <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
            {(sheet.script || []).map((s, i) => (
              <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 6, padding: 10 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.rec }}>{s.temps}</span>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: C.ink }}><b>Voix —</b> {s.voix}</p>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: C.slate }}><b>Visuel —</b> {s.visuel}</p>
                {s.texte_ecran && <p style={{ margin: "3px 0 0", fontSize: 13, color: C.slate }}><b>À l'écran —</b> {s.texte_ecran}</p>}
              </div>
            ))}
          </div>

          <div style={metaGrid()}>
            <Meta k="CTA" v={sheet.cta} />
            <Meta k="Apport humain (anti-démonétisation)" v={sheet.angle_humain} />
          </div>
          <Meta k="Légende" v={sheet.description} />
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(sheet.hashtags || []).map((h, i) => (
              <span key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.teal,
                background: "#0f7a6e12", padding: "2px 7px", borderRadius: 4 }}>#{h}</span>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: C.amber, display: "flex", gap: 6 }}>
            <span>⚠</span><span><b>Divulgation IA :</b> {sheet.divulgation}</span>
          </div>

          <button onClick={() => onAddToPipeline({ title: sheet.titre, platform, niche })} style={{ ...btnPrimary(false), marginTop: 16 }}>
            + Ajouter au pipeline
          </button>
        </div>
      )}

      {slides && (
        <div style={{ ...card(), marginTop: 18 }}>
          <p style={eyebrowStyle()}>Diaporama · {(slides.slides || []).length} slides</p>
          <h3 style={{ margin: "2px 0 0", fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, color: C.ink, lineHeight: 1.2 }}>{slides.titre}</h3>

          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            {(slides.slides || []).map((s, i) => {
              const isFirst = i === 0, isLast = i === (slides.slides.length - 1);
              const tag = isFirst ? "HOOK" : isLast ? "CTA" : `SLIDE ${i + 1}`;
              const accent = isFirst ? C.rec : isLast ? C.teal : C.slate;
              return (
                <div key={i} style={{ border: `1px solid ${C.line}`, borderLeft: `3px solid ${accent}`, borderRadius: 6, padding: 10 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 0.5, color: accent }}>{tag}</span>
                  <p style={{ margin: "4px 0 0", fontSize: 15, color: C.ink, fontWeight: 600, lineHeight: 1.35 }}>{s.texte}</p>
                  {s.visuel && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: C.slate }}><b>Visuel —</b> {s.visuel}</p>}
                </div>
              );
            })}
          </div>

          <Meta k="Apport humain (anti-démonétisation)" v={slides.angle_humain} />
          <Meta k="Légende" v={slides.description} />
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(slides.hashtags || []).map((h, i) => (
              <span key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.teal,
                background: "#0f7a6e12", padding: "2px 7px", borderRadius: 4 }}>#{h}</span>
            ))}
          </div>

          <button onClick={() => onAddToPipeline({ title: slides.titre, platform, niche })} style={{ ...btnPrimary(false), marginTop: 16 }}>
            + Ajouter au pipeline
          </button>
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/*  TAB 3 — PIPELINE (persistant via window.storage)                      */
/* ====================================================================== */
function Pipeline({ items, setItems, weekGoal = 3 }) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [sortPerf, setSortPerf] = useState(false);
  const WEEK_GOAL = weekGoal;

  function add() {
    if (!title.trim()) return;
    setItems([{ id: Date.now(), title, platform, niche: "", stage: "idee", views: "", revenue: "", date: "", retention: "" }, ...items]);
    setTitle("");
  }
  function update(id, patch) { setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it))); }
  function remove(id) { setItems(items.filter((it) => it.id !== id)); }

  const published = items.filter((i) => i.stage === "publiee");
  const totViews = published.reduce((a, i) => a + (parseInt(i.views) || 0), 0);
  const totRev = published.reduce((a, i) => a + (parseFloat(i.revenue) || 0), 0);
  const retVals = published.map((i) => parseFloat(i.retention)).filter((x) => !isNaN(x));
  const avgRet = retVals.length ? Math.round(retVals.reduce((a, b) => a + b, 0) / retVals.length) : null;

  const weekAgo = Date.now() - 7 * 864e5;
  const weekCount = published.filter((i) => i.date && new Date(i.date).getTime() >= weekAgo).length;

  function exportCSV() {
    const head = ["titre", "plateforme", "niche", "etape", "date", "vues", "retention_%", "revenu_eur"];
    const rows = items.map((i) => [i.title, i.platform, i.niche, i.stage, i.date || "", i.views || "", i.retention || "", i.revenue || ""]);
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "pipeline.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <Header eyebrow="Régie" title="Pipeline" sub="Chaque vidéo, de l'idée au revenu. Sauvegardé automatiquement sur cet appareil." />

      <div style={{ display: "flex", gap: 18, marginBottom: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Stat k="Publiées" v={published.length} />
        <Stat k="Vues cumulées" v={totViews.toLocaleString("fr-FR")} />
        <Stat k="Rétention moy." v={avgRet === null ? "—" : avgRet + " %"} accent={C.amber} />
        <Stat k="Revenu saisi" v={totRev.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} accent={C.teal} />
        <button onClick={exportCSV} style={{ ...btnGhost(), marginTop: 0, marginLeft: "auto" }}>↓ Export CSV</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={eyebrowStyle()}>Objectif régularité · 7 derniers jours</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1, height: 8, background: C.line, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (weekCount / WEEK_GOAL) * 100)}%`, height: "100%",
                background: weekCount >= WEEK_GOAL ? C.teal : C.rec, borderRadius: 999, transition: "width .3s" }} />
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: weekCount >= WEEK_GOAL ? C.teal : C.slate }}>
              {weekCount} / {WEEK_GOAL}
            </span>
          </div>
        </div>
        <button onClick={() => setSortPerf((v) => !v)}
          style={{ ...btnGhost(), marginTop: 0, borderColor: sortPerf ? C.rec : C.ink, color: sortPerf ? C.rec : C.ink }}>
          {sortPerf ? "✓ Tri par performance" : "↕ Trier par performance"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Nouvelle idée de vidéo…" style={{ ...input(), flex: 1, marginTop: 0 }} />
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ ...input(), marginTop: 0, width: 150 }}>
          {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button onClick={add} style={{ ...btnPrimary(false), marginTop: 0 }}>+ Ajouter</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {STAGES.map((st) => {
          let col = items.filter((i) => i.stage === st.id);
          if (st.id === "publiee" && sortPerf) {
            col = [...col].sort((a, b) => {
              const ra = parseFloat(a.retention) || -1, rb = parseFloat(b.retention) || -1;
              if (rb !== ra) return rb - ra;
              return (parseInt(b.views) || 0) - (parseInt(a.views) || 0);
            });
          }
          return (
            <div key={st.id} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, minHeight: 120 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                {st.id === "publiee" ? <RecDot on /> : <span style={{ width: 8, height: 8, borderRadius: 999, background: C.line }} />}
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600, color: C.ink }}>{st.label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.slate, marginLeft: "auto" }}>{col.length}</span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {col.map((it) => {
                  const idx = STAGES.findIndex((s) => s.id === it.stage);
                  return (
                    <div key={it.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 6, padding: 8 }}>
                      <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.35, marginBottom: 4 }}>{it.title}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: C.slate, marginBottom: 6 }}>{it.platform}</div>
                      {it.stage === "publiee" && (
                        <div style={{ display: "grid", gap: 4, marginBottom: 6 }}>
                          <input type="date" value={it.date || ""} onChange={(e) => update(it.id, { date: e.target.value })}
                            style={{ ...miniInput(), width: "100%" }} />
                          <div style={{ display: "flex", gap: 4 }}>
                            <input value={it.views} onChange={(e) => update(it.id, { views: e.target.value.replace(/\D/g, "") })}
                              placeholder="vues" style={miniInput()} />
                            <input value={it.retention} onChange={(e) => update(it.id, { retention: e.target.value.replace(/[^\d]/g, "") })}
                              placeholder="rét. %" style={miniInput()} />
                          </div>
                          <input value={it.revenue} onChange={(e) => update(it.id, { revenue: e.target.value.replace(/[^\d.]/g, "") })}
                            placeholder="revenu €" style={{ ...miniInput(), width: "100%" }} />
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 4 }}>
                        {idx > 0 && <button onClick={() => update(it.id, { stage: STAGES[idx - 1].id })} style={stageBtn()}>←</button>}
                        {idx < STAGES.length - 1 && <button onClick={() => update(it.id, { stage: STAGES[idx + 1].id })} style={stageBtn()}>→</button>}
                        <button onClick={() => remove(it.id)} style={{ ...stageBtn(), color: C.rec, marginLeft: "auto" }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ====================================================================== */
/*  TAB 4 — REPÈRES (vérité plateforme, statique)                         */
/* ====================================================================== */
function Repere() {
  const blocks = [
    {
      h: "Seuils de monétisation — France, 2026",
      body: [
        ["TikTok Creator Rewards", "10 000 abonnés · 100 000 vues / 30 j · 18+ · vidéos > 60 s. RPM réel ≈ 0,40–1,00 $ / 1 000 vues. La France est éligible."],
        ["YouTube Partner Program", "1 000 abonnés + 4 000 h de visionnage (ou 10 M de vues Shorts / 90 j). Divulgation du contenu IA réaliste obligatoire."],
        ["Où est l'argent", "Les paiements publicitaires directs sont faibles. Le gros vient du TikTok Shop, de l'affiliation, des partenariats de marque, et de tes propres produits."],
      ],
    },
    {
      h: "Ce qui fait démonétiser (à éviter absolument)",
      body: [
        ["Contenu non authentique", "Vidéos produites en masse sur le même template, voix IA lisant un texte sans angle, diaporamas d'images IA sans montage ni narration."],
        ["Volume sans valeur", "Sortir 6 vidéos quasi identiques par jour = signal de ferme à contenu. Les plateformes évaluent la chaîne entière, pas la vidéo seule."],
        ["Non-divulgation", "Du contenu IA réaliste non déclaré = violation, label imposé, sanctions possibles."],
      ],
    },
    {
      h: "Ce qui reste monétisable",
      body: [
        ["IA = outil, pas substitut", "Tu écris l'angle, tu apportes une opinion/un savoir, tu montes avec intention. L'IA accélère, elle ne remplace pas le jugement."],
        ["Visuels originaux", "Animations, montage rythmé, vraie voix (ou voix IA fortement personnalisée) plutôt que stock + voix robotique brute."],
        ["Format constant, valeur neuve", "Un format reconnaissable est bon ; le répéter sans rien apporter de neuf est le problème."],
      ],
    },
    {
      h: "La stack d'outils, démêlée",
      body: [
        ["Script & idées", "Claude / un LLM (ce que fait l'onglet Atelier). C'est ici que se joue ton apport humain."],
        ["Voix off", "ElevenLabs ou équivalent. Personnalise la voix, ne laisse pas le preset par défaut."],
        ["Visuel / montage", "CapCut, ou des générateurs (Runway, Pika, HeyGen pour l'avatar). Ajoute toujours mouvement et coupe — pas de diaporama figé."],
        ["Publication & suivi", "Manuel pour l'instant. L'auto-publication réelle exige OAuth + l'API Content Posting de TikTok (accès soumis à validation) + les quotas de l'API YouTube Data + un backend."],
      ],
    },
    {
      h: "Produits numériques — l'honnête vérité",
      body: [
        ["Fabrication", "Rapide (template, e-book, preset, mini-formation). Ce n'est pas là qu'est la difficulté."],
        ["Distribution", "C'est tout le jeu. Sans audience, un produit ne se vend pas. D'où l'intérêt des vidéos comme haut de tunnel."],
        ["Le bon montage", "Vidéos → audience → produit. Tes deux idées (vidéos + produits) ne sont pas deux pistes, c'est une seule stratégie."],
      ],
    },
  ];
  return (
    <div>
      <Header eyebrow="Notes de régie" title="Repères" sub="La réalité plateforme, sans le discours des vendeurs de formation." />
      <div style={{ display: "grid", gap: 16 }}>
        {blocks.map((b, i) => (
          <div key={i} style={card()}>
            <h3 style={{ margin: 0, fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, color: C.ink }}>{b.h}</h3>
            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              {b.body.map((row, j) => (
                <div key={j} style={{ display: "grid", gridTemplateColumns: "minmax(120px,160px) 1fr", gap: 10, alignItems: "start" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.rec, lineHeight: 1.5 }}>{row[0]}</span>
                  <span style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55 }}>{row[1]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- éléments partagés ---------- */
function Header({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={eyebrowStyle()}>{eyebrow}</p>
      <h2 style={{ margin: "2px 0 0", fontFamily: "'Space Grotesk',sans-serif", fontSize: 30, color: C.ink, letterSpacing: -0.5 }}>{title}</h2>
      <p style={{ margin: "6px 0 0", fontSize: 14, color: C.slate, maxWidth: 560, lineHeight: 1.5 }}>{sub}</p>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <label style={eyebrowStyle()}>{label}</label>
      <div style={{ marginTop: 4 }}>{children}</div>
    </div>
  );
}
function Meta({ k, v }) {
  return (
    <div style={{ marginTop: 10 }}>
      <p style={eyebrowStyle()}>{k}</p>
      <p style={{ margin: "2px 0 0", fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>{v}</p>
    </div>
  );
}
function Stat({ k, v, accent }) {
  return (
    <div>
      <p style={eyebrowStyle()}>{k}</p>
      <p style={{ margin: "2px 0 0", fontFamily: "'IBM Plex Mono',monospace", fontSize: 24, color: accent || C.ink }}>{v}</p>
    </div>
  );
}

const eyebrowStyle = () => ({ margin: 0, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5,
  letterSpacing: 1.2, textTransform: "uppercase", color: C.slate });
const card = () => ({ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 18 });
const metaGrid = () => ({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 });
const input = () => ({ width: "100%", boxSizing: "border-box", marginTop: 0, padding: "10px 12px",
  border: `1px solid ${C.line}`, borderRadius: 6, fontSize: 14, color: C.ink, background: C.panel, outline: "none", fontFamily: "inherit" });
const miniInput = () => ({ width: "50%", boxSizing: "border-box", padding: "4px 6px", border: `1px solid ${C.line}`,
  borderRadius: 4, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", outline: "none" });
const stageBtn = () => ({ border: `1px solid ${C.line}`, background: C.panel, borderRadius: 4, padding: "2px 7px",
  fontSize: 12, cursor: "pointer", color: C.ink });
const btnPrimary = (loading) => ({ marginTop: 18, display: "inline-flex", alignItems: "center",
  background: loading ? C.slate : C.ink, color: "#fff", border: "none", borderRadius: 7, padding: "11px 18px",
  fontSize: 14, fontWeight: 600, cursor: loading ? "default" : "pointer", fontFamily: "'Space Grotesk',sans-serif" });
const btnGhost = () => ({ marginTop: 14, background: "transparent", color: C.ink, border: `1px solid ${C.ink}`,
  borderRadius: 6, padding: "7px 12px", fontSize: 13, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif" });

/* ====================================================================== */
/*  APP                                                                    */
/* ====================================================================== */
/*  TAB 5 — PARAMÈTRES                                                     */
/* ====================================================================== */
function Params({ settings, setSettings }) {
  function setNum(key, val, min, max) {
    let n = parseInt(val, 10);
    if (isNaN(n)) n = min;
    n = Math.max(min, Math.min(max, n));
    setSettings((s) => ({ ...s, [key]: n }));
  }
  const rows = [
    { key: "nicheCount", label: "Niches dans le Radar", hint: "Taille du top généré par le scan.", min: 3, max: 15 },
    { key: "batchCount", label: "Idées par lot (Atelier)", hint: "Nombre de vidéos/diaporamas proposés d'un coup. Au-delà de ~25, la liste peut être tronquée.", min: 3, max: 30 },
    { key: "weekGoal", label: "Objectif de publications / semaine", hint: "Cible de la barre de régularité dans le Pipeline.", min: 1, max: 14 },
  ];
  return (
    <div>
      <Header eyebrow="Réglages" title="Paramètres" sub="Définis combien Claude génère, et ton objectif de rythme. Sauvegardé automatiquement sur cet appareil." />
      <div style={{ ...card(), display: "grid", gap: 16 }}>
        {rows.map((r) => (
          <div key={r.key} style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12, alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 600, color: C.ink }}>{r.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.slate, lineHeight: 1.45 }}>{r.hint}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
              <button onClick={() => setNum(r.key, settings[r.key] - 1, r.min, r.max)} style={stageBtn()}>−</button>
              <input type="number" min={r.min} max={r.max} value={settings[r.key]}
                onChange={(e) => setNum(r.key, e.target.value, r.min, r.max)}
                style={{ ...input(), width: 56, textAlign: "center", padding: "8px 4px", fontFamily: "'IBM Plex Mono',monospace" }} />
              <button onClick={() => setNum(r.key, settings[r.key] + 1, r.min, r.max)} style={stageBtn()}>+</button>
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 14, fontSize: 12.5, color: C.slate, lineHeight: 1.5 }}>
        Astuce : génère petit au début (5–10 idées) pour ne pas te noyer. Tu augmentes quand tu maîtrises ton rythme de publication.
      </p>
    </div>
  );
}

/* ====================================================================== */
export default function App() {
  const [tab, setTab] = useState("radar");
  const [seed, setSeed] = useState(null);
  const [items, setItems] = useState([]);
  const [niches, setNiches] = useState([]);
  const [settings, setSettings] = useState({ nicheCount: 10, batchCount: 20, weekGoal: 3 });
  const [loaded, setLoaded] = useState(false);
  const tabs = [
    { id: "radar", label: "Radar" },
    { id: "atelier", label: "Atelier" },
    { id: "pipeline", label: "Pipeline" },
    { id: "repere", label: "Repères" },
    { id: "params", label: "Paramètres" },
  ];

  // fonts
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(l);
  }, []);

  // charger pipeline + réglages persistants
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("pipeline:items");
        if (r && r.value) setItems(JSON.parse(r.value));
      } catch (e) { /* clé absente ou storage indispo */ }
      try {
        const s = await window.storage.get("pipeline:settings");
        if (s && s.value) setSettings((prev) => ({ ...prev, ...JSON.parse(s.value) }));
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  // sauvegarder
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set("pipeline:items", JSON.stringify(items)); } catch (e) {}
    })();
  }, [items, loaded]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set("pipeline:settings", JSON.stringify(settings)); } catch (e) {}
    })();
  }, [settings, loaded]);

  function sendToStudio(n) { setSeed(n); setTab("atelier"); }
  function addToPipeline(card) {
    setItems((prev) => [{ id: Date.now(), title: card.title, platform: card.platform, niche: card.niche || "", stage: "script", views: "", revenue: "", date: "", retention: "" }, ...prev]);
    setTab("pipeline");
  }

  return (
    <div style={{ background: C.paper, minHeight: "100vh", color: C.ink, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(2.6); opacity: 0; } }
        * { -webkit-tap-highlight-color: transparent; }
        input:focus, select:focus { border-color: ${C.ink} !important; }
        @media (max-width: 640px){ .grid4 { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      {/* barre régie */}
      <div style={{ borderBottom: `1px solid ${C.line}`, background: C.panel }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <RecDot on />
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: -0.3 }}>
            CONSOLE<span style={{ color: C.rec }}>.</span>
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: C.slate, letterSpacing: 1, marginLeft: 2 }}>
            STUDIO DE CRÉATION
          </span>
          <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: C.teal }}>● EN LIGNE</span>
        </div>
      </div>

      {/* nav */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.line}`, overflowX: "auto" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: "14px 14px",
                fontSize: 14, fontWeight: tab === t.id ? 600 : 400, fontFamily: "'Space Grotesk',sans-serif",
                color: tab === t.id ? C.ink : C.slate, borderBottom: `2px solid ${tab === t.id ? C.rec : "transparent"}`,
                marginBottom: -1, whiteSpace: "nowrap" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* contenu */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 20px 60px" }}>
        {tab === "radar" && <NicheRadar niches={niches} setNiches={setNiches} nicheCount={settings.nicheCount} onSendToStudio={sendToStudio} />}
        {tab === "atelier" && <Studio seed={seed} nicheList={niches} batchCount={settings.batchCount} onAddToPipeline={addToPipeline} />}
        {tab === "pipeline" && <Pipeline items={items} setItems={setItems} weekGoal={settings.weekGoal} />}
        {tab === "repere" && <Repere />}
        {tab === "params" && <Params settings={settings} setSettings={setSettings} />}
      </div>
    </div>
  );
}
