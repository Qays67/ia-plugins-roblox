#!/usr/bin/env node
/**
 * install.mjs — installe le plugin dans Roblox Studio, en un seul geste.
 *
 *   node install.mjs
 *
 * Copie dist/XozAI.rbxmx dans le dossier Plugins de Roblox :
 *   Windows : %LOCALAPPDATA%\Roblox\Plugins
 *   macOS   : ~/Documents/Roblox/Plugins
 *
 * Relance ensuite Roblox Studio : le bouton XozAI apparait dans la barre d'outils.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, readFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = dirname(fileURLToPath(import.meta.url));

// Par defaut on installe le plugin PUBLIC : il ouvre l'assistant de configuration
// au premier lancement, ce qui evite de partir sur des reglages perimes.
// Avec --personal, on installe la version qui contient deja ta cle API.
const PUBLIC_SOURCES = [join(ROOT, "dist", "XozAI.rbxmx"), join(ROOT, "docs", "download", "XozAI.rbxmx")];
const PERSONAL_SOURCE = join(ROOT, "dist", "private", "XozAI-personnel.rbxmx");

function pluginsDirectory() {
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local");
    return join(localAppData, "Roblox", "Plugins");
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Documents", "Roblox", "Plugins");
  }
  return null;
}

function findSource() {
  if (process.argv.includes("--personal")) {
    if (existsSync(PERSONAL_SOURCE)) {
      return PERSONAL_SOURCE;
    }
    console.log("Pas de build personnel : lance 'node build.mjs' (il faut config.local.json).\n");
  }

  for (const candidate of PUBLIC_SOURCES) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  if (existsSync(PERSONAL_SOURCE)) {
    return PERSONAL_SOURCE;
  }

  return null;
}

/** Un fichier de moins de 2 Ko n'est presque jamais un vrai plugin. */
function sourceProblems(path) {
  const problems = [];
  const stats = statSync(path);
  const content = readFileSync(path, "utf8");

  if (stats.size < 2048) {
    problems.push(`le fichier ne fait que ${stats.size} octets (trop petit pour un plugin)`);
  }

  const trimmed = content.trimStart();
  if (trimmed.startsWith("<")) {
    if (!trimmed.startsWith("<roblox")) {
      problems.push(
        "ce n'est pas un fichier de plugin : le XML commence par autre chose que <roblox>\n" +
          "        (tu as probablement enregistre une page web GitHub au lieu du fichier)",
      );
    }
  } else if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<!DOCTYPE html")) {
    problems.push(
      "c'est une PAGE HTML, pas un plugin.\n" +
        "        Sur GitHub, clique sur le bouton 'Download raw file' (icone de telechargement),\n" +
        "        et non sur 'Enregistrer la page sous...'",
    );
  } else if (trimmed.startsWith("<!")) {
    problems.push("c'est un fichier texte ou HTML, pas un plugin.");
  }

  if (!content.includes('class="Script"')) {
    problems.push("aucun <Item class=\"Script\"> trouve dans le fichier");
  }

  return problems;
}

function listExistingPlugins(directory) {
  try {
    return readdirSync(directory).filter((entry) => {
      const full = join(directory, entry);
      try {
        return statSync(full).isFile() || statSync(full).isDirectory();
      } catch (error) {
        return false;
      }
    });
  } catch (error) {
    return [];
  }
}

function main() {
  const directory = pluginsDirectory();

  if (!directory) {
    console.error("Roblox Studio ne tourne pas nativement sur Linux.");
    console.error("Copie le fichier a la main : dist/XozAI.rbxmx");
    process.exitCode = 1;
    return;
  }

  console.log("Dossier Plugins de Roblox :");
  console.log(`  ${directory}`);
  console.log("");

  const source = findSource();
  if (!source) {
    console.error("Aucun plugin a installer.");
    console.error("Lance d'abord :  node build.mjs");
    process.exitCode = 1;
    return;
  }

  console.log("Fichier source :");
  console.log(`  ${source.replace(ROOT, ".")}`);

  const problems = sourceProblems(source);
  if (problems.length > 0) {
    console.error("");
    console.error("Ce fichier ne peut pas etre installe :");
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    console.error("");
    console.error("Regenere-le proprement avec :  node build.mjs");
    process.exitCode = 1;
    return;
  }

  console.log(`  taille : ${(statSync(source).size / 1024).toFixed(1)} Ko (fichier valide)`);
  console.log("");

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
    console.log(`Dossier Plugins cree : ${directory}`);
  } else {
    const existing = listExistingPlugins(directory);
    if (existing.length > 0) {
      console.log("Plugins deja presents dans ce dossier :");
      for (const entry of existing) {
        console.log(`  - ${entry}`);
      }
      console.log("");
    }
  }

  const target = join(directory, basename(source) === "XozAI-personnel.rbxmx" ? "XozAI.rbxmx" : basename(source));

  if (process.argv.includes("--dry-run")) {
    console.log("VERIFICATION SEULE (--dry-run) : rien n'a ete copie.");
    console.log(`  le fichier irait ici : ${target}`);
    console.log("");
    return;
  }

  copyFileSync(source, target);

  console.log("INSTALLE");
  console.log("--------------------------------------------");
  console.log(`  ${target}`);
  console.log("");
  console.log("Etapes suivantes :");
  console.log("  1. Ferme completement Roblox Studio (tous les processus, pas juste la fenetre)");
  console.log("  2. Relance Studio et ouvre ta place");
  console.log("  3. Un bouton 'XozAI' doit apparaitre dans la barre d'outils");
  console.log("  4. Clique dessus, va dans Reglages, choisis un fournisseur et colle ta cle API");
  console.log("");
}

main();
