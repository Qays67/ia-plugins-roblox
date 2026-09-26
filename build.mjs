#!/usr/bin/env node
/**
 * build.mjs — genere les fichiers d'installation du plugin XozAI.
 *
 *   node build.mjs
 *
 * Produit toujours :
 *   dist/XozAI.rbxmx              plugin complet (a installer dans Studio)
 *   dist/XozAI.luau               version "fichier unique" a coller dans un Script
 *   docs/download/XozAI.rbxmx     copie servie par le site (bouton Telecharger)
 *
 * Produit en plus si config.local.json existe :
 *   dist/private/XozAI-personnel.rbxmx   plugin avec TA cle deja remplie
 *
 * dist/private/ est ignore par git : ce build ne doit JAMAIS etre publie.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");
const PRIVATE_DIST = join(DIST, "private");
const DOCS_DOWNLOAD = join(ROOT, "docs", "download");
const LOCAL_CONFIG = join(ROOT, "config.local.json");

const PLUGIN_NAME = "XozAI";
const MODULES = ["Util", "Config", "Prompt", "Http", "Builder", "Actions", "UI"];

const MAIN_SOURCE = join(SRC, "init.server.luau");

/* ------------------------------------------------------------------ */
/* Lecture des sources                                                 */
/* ------------------------------------------------------------------ */

const readFile = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const escapeXml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const BUILT_IN_MARKER = "Config.BUILT_IN = {}";

/** Injecte des valeurs personnelles (cle API...) dans Config.luau. */
function injectBuiltIn(source, builtIn) {
  if (!builtIn) {
    return source;
  }
  if (!source.includes(BUILT_IN_MARKER)) {
    throw new Error(`Point d'injection ${BUILT_IN_MARKER} introuvable dans src/modules/Config.luau`);
  }
  const entries = Object.entries(builtIn)
    // Les cles commencant par "_" sont des commentaires (voir config.example.json).
    .filter(([key, value]) => !key.startsWith("_") && value !== null && value !== undefined && value !== "")
    // Cle entre crochets : valide en Luau quelle que soit la cle, la ou
    // "nom" = valeur serait une erreur de syntaxe.
    .map(([key, value]) => `\t[${JSON.stringify(key)}] = ${JSON.stringify(value)},`)
    .join("\n");

  return source.replace(BUILT_IN_MARKER, `Config.BUILT_IN = {\n${entries}\n}`);
}

/**
 * Renvoie la liste ordonnee des sources a empaqueter.
 * Le script principal en premier, puis les modules dans l'ordre de dependance.
 */
function collectSources(builtIn) {
  const sources = [{ name: PLUGIN_NAME, className: "Script", source: readFile(MAIN_SOURCE) }];

  for (const moduleName of MODULES) {
    const path = join(SRC, "modules", `${moduleName}.luau`);
    if (!existsSync(path)) {
      throw new Error(`Module introuvable : ${path}`);
    }
    let source = readFile(path);
    if (moduleName === "Config") {
      source = injectBuiltIn(source, builtIn);
    }
    sources.push({ name: moduleName, className: "ModuleScript", source });
  }

  return sources;
}

/* ------------------------------------------------------------------ */
/* Generation du .rbxmx                                                */
/* ------------------------------------------------------------------ */

let referentCounter = 0;
const nextReferent = () => `RBX${referentCounter++}`;

/**
 * IMPORTANT : on n'indente JAMAIS le contenu du ProtectedString.
 * Le code doit etre stocke octet pour octet, sinon les longues chaines
 * [[ ... ]] du prompt se retrouveraient decalees.
 */
function item(className, name, source, children = []) {
  const lines = [`<Item class="${className}" referent="${nextReferent()}">`, "\t<Properties>"];
  lines.push(`\t\t<string name="Name">${escapeXml(name)}</string>`);
  if (source !== null) {
    lines.push(`\t\t<ProtectedString name="Source">${escapeXml(source)}</ProtectedString>`);
  }
  lines.push("\t</Properties>");
  for (const child of children) {
    lines.push(child);
  }
  lines.push("</Item>");
  return lines.join("\n");
}

function buildRbxmx(sources) {
  referentCounter = 0;

  const moduleItems = sources
    .filter((entry) => entry.className === "ModuleScript")
    .map((entry) => item("ModuleScript", entry.name, entry.source));

  const modulesFolder = item("Folder", "Modules", null, moduleItems);
  const main = sources.find((entry) => entry.className === "Script");
  const root = item("Script", main.name, main.source, [modulesFolder]);

  return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
${root}
</roblox>
`;
}

/* ------------------------------------------------------------------ */
/* Generation du fichier unique .luau                                  */
/* ------------------------------------------------------------------ */

function rewriteRequires(source) {
  return source
    .replace(/require\(\s*script\.Modules\.([A-Za-z0-9_]+)\s*\)/g, "$1")
    .replace(/require\(\s*script\.Parent\.([A-Za-z0-9_]+)\s*\)/g, "$1");
}

function assertNoRequires(source, label) {
  const remaining = source.match(/require\(\s*script\b[^)]*\)/g);
  if (remaining) {
    throw new Error(`Le fichier ${label} contient des require(script...) non geres : ${remaining.join(", ")}`);
  }
}

function buildSingleFile(sources) {
  const chunks = [];

  chunks.push(`--[[
\t${PLUGIN_NAME} - version "fichier unique" (generee par build.mjs, ne pas editer a la main)
\tInstallation : colle tout ce code dans un Script, puis dans l'Explorateur :
\t  clic droit sur le Script > "Save as Local Plugin"
]]`);
  chunks.push("");
  chunks.push(
    "-- Ordre de chargement : " +
      sources
        .filter((entry) => entry.className === "ModuleScript")
        .map((entry) => entry.name)
        .join(" -> "),
  );
  chunks.push("");

  for (const entry of sources) {
    if (entry.className !== "ModuleScript") {
      continue;
    }
    const source = rewriteRequires(entry.source);
    assertNoRequires(source, entry.name);
    chunks.push("-- ============================================================");
    chunks.push(`-- Module : ${entry.name}`);
    chunks.push("-- ============================================================");
    // Le corps est colle tel quel : on ne touche pas a l'indentation pour que
    // les longues chaines [[ ... ]] restent identiques a la version .rbxmx.
    chunks.push(`local ${entry.name} = (function()`);
    chunks.push(source.trimEnd());
    chunks.push("end)()");
    chunks.push("");
  }

  const main = sources.find((entry) => entry.className === "Script");
  const mainSource = rewriteRequires(main.source);
  assertNoRequires(mainSource, MAIN_SOURCE);

  chunks.push("-- ============================================================");
  chunks.push("-- Script principal du plugin");
  chunks.push("-- ============================================================");
  chunks.push(mainSource.trimEnd());
  chunks.push("");

  return chunks.join("\n");
}

/* ------------------------------------------------------------------ */
/* Auto-tests                                                          */
/* ------------------------------------------------------------------ */

function unescapeXml(value) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** Le XML doit restituer exactement les sources, et les balises s'equilibrer. */
function verifyRbxmx(xml, sources) {
  const expected = sources.map((entry) => entry.source);
  const found = [...xml.matchAll(/<ProtectedString name="Source">([\s\S]*?)<\/ProtectedString>/g)].map((match) =>
    unescapeXml(match[1]),
  );

  if (found.length !== expected.length) {
    throw new Error(`Auto-test XML : ${found.length} source(s) retrouvee(s) au lieu de ${expected.length}`);
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (found[index] !== expected[index]) {
      throw new Error(`Auto-test XML : la source n°${index} ne survit pas a l'aller-retour`);
    }
  }

  const stack = [];
  for (const tag of xml.matchAll(/<\/?([A-Za-z][\w.]*)[^>]*?(\/?)>/g)) {
    const [full, name, selfClosing] = tag;
    if (selfClosing) {
      continue;
    }
    if (full.startsWith("</")) {
      if (stack.pop() !== name) {
        throw new Error(`Auto-test XML : balise fermante inattendue </${name}>`);
      }
    } else {
      stack.push(name);
    }
  }
  if (stack.length > 0) {
    throw new Error(`Auto-test XML : balises non fermees : ${stack.join(", ")}`);
  }
}

const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{20,}/g,
  /\bxgpt_[A-Za-z0-9]{16,}/g,
  /\bghp_[A-Za-z0-9]{20,}/g,
  /\bsk-ant-[A-Za-z0-9_-]{20,}/g,
  /\bAIza[A-Za-z0-9_-]{30,}/g,
];

/** Un artefact public ne doit JAMAIS contenir de cle API. */
function assertNoSecrets(text, label) {
  for (const pattern of SECRET_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, pattern.flags));
    if (matches) {
      throw new Error(
        `FUITE BLOQUEE : ${label} contient une cle d'API (${matches[0].slice(0, 12)}...).\n` +
          "Retire-la du code source : une cle publiee sur GitHub est compromise en quelques minutes.",
      );
    }
  }
}

/* ------------------------------------------------------------------ */

function main() {
  if (existsSync(DIST)) {
    rmSync(DIST, { recursive: true, force: true });
  }
  mkdirSync(DIST, { recursive: true });
  mkdirSync(DOCS_DOWNLOAD, { recursive: true });

  // ---------- artefacts publics (sans aucune cle) ----------
  const publicSources = collectSources(null);
  const rbxmx = buildRbxmx(publicSources);
  const single = buildSingleFile(publicSources);

  verifyRbxmx(rbxmx, publicSources);
  assertNoSecrets(rbxmx, `dist/${PLUGIN_NAME}.rbxmx`);
  assertNoSecrets(single, `dist/${PLUGIN_NAME}.luau`);

  writeFileSync(join(DIST, `${PLUGIN_NAME}.rbxmx`), rbxmx, "utf8");
  writeFileSync(join(DIST, `${PLUGIN_NAME}.luau`), single, "utf8");
  copyFileSync(join(DIST, `${PLUGIN_NAME}.rbxmx`), join(DOCS_DOWNLOAD, `${PLUGIN_NAME}.rbxmx`));

  const kb = (text) => `${(Buffer.byteLength(text) / 1024).toFixed(1)} Ko`;

  console.log("Build termine");
  console.log("-------------------------------");
  console.log(`  dist/${PLUGIN_NAME}.rbxmx            ${kb(rbxmx)}`);
  console.log(`  dist/${PLUGIN_NAME}.luau             ${kb(single)}`);
  console.log(`  docs/download/${PLUGIN_NAME}.rbxmx   ${kb(rbxmx)}   <- bouton du site`);

  // ---------- build personnel (cle injectee, jamais publie) ----------
  if (existsSync(LOCAL_CONFIG)) {
    let localConfig;
    try {
      localConfig = JSON.parse(readFileSync(LOCAL_CONFIG, "utf8"));
    } catch (error) {
      throw new Error(`config.local.json est illisible : ${error.message}`);
    }

    const privateSources = collectSources(localConfig);
    const privateRbxmx = buildRbxmx(privateSources);
    verifyRbxmx(privateRbxmx, privateSources);

    mkdirSync(PRIVATE_DIST, { recursive: true });
    writeFileSync(join(PRIVATE_DIST, `${PLUGIN_NAME}-personnel.rbxmx`), privateRbxmx, "utf8");

    console.log("");
    console.log(`  dist/private/${PLUGIN_NAME}-personnel.rbxmx   ${kb(privateRbxmx)}`);
    console.log("      -> build PERSONNEL : cle API incluse, dossier ignore par git.");
    console.log("      -> Ne le partage pas, ne le commite pas, ne le mets pas en ligne.");
  } else {
    console.log("");
    console.log("  (pas de config.local.json : build personnel non genere)");
  }

  console.log("");
  console.log("Auto-tests : XML aller-retour OK, aucun secret dans les artefacts publics.");
}

main();
