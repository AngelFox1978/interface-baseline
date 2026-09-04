import { describe, expect, it } from "vitest";
import {
  githubUrlRegex,
  installBodySchema,
  promptImportSchema,
  promptUpdateSchema,
  sourceAddSchema,
} from "../lib/validation";

// Motivation (docs/plan-amelioration.md, prompt 9) : les pièges Zod v4
// (comportement de .catch, champs requis) ne sont détectables ni au lint
// ni au build — seuls des tests de schémas les attrapent.

describe("promptImportSchema (POST /api/prompts)", () => {
  it("accepte un payload complet", () => {
    const r = promptImportSchema.safeParse({
      prompt_text: "Un prompt",
      titre: "Titre",
      cible: "claude",
      categorie: "dev",
      cas_usage: "tests",
      source_url: "https://exemple.fr",
      tags: ["a", "b"],
    });
    expect(r.success).toBe(true);
  });

  it("n'exige que prompt_text — un optionnel ABSENT reste undefined (le .catch ne joue que sur valeur invalide)", () => {
    const r = promptImportSchema.parse({ prompt_text: "x" });
    expect(r.titre).toBeUndefined();
    expect(r.tags).toBeUndefined();
  });

  it("un optionnel explicitement null est conservé null", () => {
    const r = promptImportSchema.parse({ prompt_text: "x", titre: null });
    expect(r.titre).toBeNull();
  });

  it("rejette un prompt_text vide ou composé d'espaces", () => {
    expect(promptImportSchema.safeParse({ prompt_text: "   " }).success).toBe(
      false,
    );
    expect(promptImportSchema.safeParse({}).success).toBe(false);
  });

  it("les optionnels mal typés retombent sur null (fallback .catch)", () => {
    const r = promptImportSchema.parse({
      prompt_text: "x",
      titre: 123,
      tags: "pas-un-tableau",
    });
    expect(r.titre).toBeNull();
    expect(r.tags).toBeNull();
  });
});

describe("promptUpdateSchema (PATCH /api/prompts/[id])", () => {
  it("exige titre et prompt_text non vides, et les trime", () => {
    const r = promptUpdateSchema.parse({
      titre: "  Titre  ",
      prompt_text: "  corps  ",
    });
    expect(r.titre).toBe("Titre");
    expect(r.prompt_text).toBe("corps");
  });

  it("rejette un titre vide", () => {
    expect(
      promptUpdateSchema.safeParse({ titre: "", prompt_text: "x" }).success,
    ).toBe(false);
  });

  it("tags invalide retombe sur [] (comportement de l'ancienne vérification manuelle)", () => {
    const r = promptUpdateSchema.parse({
      titre: "t",
      prompt_text: "p",
      tags: 42,
    });
    expect(r.tags).toEqual([]);
  });
});

describe("installBodySchema (POST github-sources / skills-library)", () => {
  it("accepte un id non vide", () => {
    expect(installBodySchema.safeParse({ id: "impeccable" }).success).toBe(
      true,
    );
  });

  it("rejette id vide, absent ou mal typé", () => {
    expect(installBodySchema.safeParse({ id: "" }).success).toBe(false);
    expect(installBodySchema.safeParse({}).success).toBe(false);
    expect(installBodySchema.safeParse({ id: 3 }).success).toBe(false);
    expect(installBodySchema.safeParse(null).success).toBe(false);
  });
});

describe("sourceAddSchema (PUT /api/github-sources)", () => {
  const ok = (url: string, mode = "clone-subdir") =>
    sourceAddSchema.safeParse({ url, mode }).success;

  it("accepte une URL https://github.com/owner/repo (espaces trimés)", () => {
    expect(ok("https://github.com/pbakaus/impeccable")).toBe(true);
    expect(ok("  https://github.com/a-b.c/repo_1  ")).toBe(true);
    expect(ok("https://github.com/x/y", "skills")).toBe(true);
  });

  it("rejette tout hôte autre que github.com et le http non chiffré", () => {
    expect(ok("https://evil.com/a/b")).toBe(false);
    expect(ok("https://gitlab.com/a/b")).toBe(false);
    expect(ok("http://github.com/a/b")).toBe(false);
    expect(ok("https://github.com.evil.com/a/b")).toBe(false);
  });

  it("rejette les sous-chemins, l'absence de repo et les caractères hostiles", () => {
    expect(ok("https://github.com/a/b/c")).toBe(false);
    expect(ok("https://github.com/seulement-owner")).toBe(false);
    expect(ok("https://github.com/a/b;rm -rf /")).toBe(false);
    expect(ok("https://github.com/a/b?x=1")).toBe(false);
    expect(ok("")).toBe(false);
  });

  it("rejette un mode hors liste (merge-template, package…)", () => {
    expect(ok("https://github.com/a/b", "merge-template")).toBe(false);
    expect(ok("https://github.com/a/b", "package")).toBe(false);
  });

  it("githubUrlRegex sert aussi de garde-fou aux URLs du catalogue skills", () => {
    expect(githubUrlRegex.test("https://github.com/anthropics/skills")).toBe(
      true,
    );
    expect(githubUrlRegex.test("file:///etc/passwd")).toBe(false);
  });
});
