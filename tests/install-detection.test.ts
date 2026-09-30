import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { isDetected, isPluginInstalled } from "../lib/install-sources";

// Statut « installé » de la page Paramètres : une erreur ici affiche un
// outil installé comme absent (ou l'inverse) sans que rien ne casse.

describe("isDetected — champ detect des catalogues", () => {
  const root = mkdtempSync(path.join(tmpdir(), "detect-"));
  mkdirSync(path.join(root, ".claude", "skills", "impeccable"), { recursive: true });
  writeFileSync(path.join(root, "compose.yml"), "");
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("vrai si le dossier ou le fichier existe", () => {
    expect(isDetected(root, ".claude/skills/impeccable")).toBe(true);
    expect(isDetected(root, "compose.yml")).toBe(true);
  });

  it("faux si le chemin est absent ou non renseigné", () => {
    expect(isDetected(root, "node_modules/lefthook")).toBe(false);
    expect(isDetected(root, undefined)).toBe(false);
    expect(isDetected(root, "")).toBe(false);
  });
});

describe("isPluginInstalled — registre installed_plugins.json", () => {
  const project = path.resolve("/projets/interface");
  const registry = {
    version: 2,
    plugins: {
      "ponytail@ponytail": [{ scope: "project", projectPath: project }],
      "claude-mem@thedotmack": [
        { scope: "project", projectPath: path.resolve("/projets/autre") },
      ],
      "global@market": [{ scope: "user" }],
    },
  };

  it("installé en scope project sur ce dossier", () => {
    expect(isPluginInstalled(registry, "ponytail@ponytail", project)).toBe(true);
  });

  it("chemin comparé sans tenir compte de la casse (Windows)", () => {
    expect(
      isPluginInstalled(registry, "ponytail@ponytail", project.toUpperCase()),
    ).toBe(true);
  });

  it("installé pour un autre projet seulement → non installé ici", () => {
    expect(isPluginInstalled(registry, "claude-mem@thedotmack", project)).toBe(false);
  });

  it("installé en scope user → installé partout", () => {
    expect(isPluginInstalled(registry, "global@market", project)).toBe(true);
  });

  it("absent ou registre illisible → non installé", () => {
    expect(isPluginInstalled(registry, "inconnu@x", project)).toBe(false);
    expect(isPluginInstalled({}, "ponytail@ponytail", project)).toBe(false);
    expect(isPluginInstalled(null, "ponytail@ponytail", project)).toBe(false);
  });
});
