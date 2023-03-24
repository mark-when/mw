#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { parse } from "@markwhen/parser/lib/index.js";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { parse as parseHtml } from "node-html-parser";

const er = (m: string) => {
  process.stderr.write(m);
  process.exit(1);
};

const argv = yargs(hideBin(process.argv))
  .usage("$0 <inputFile> [-o <outputType>] [-d <destination>]")
  .option("outputType", {
    alias: "o",
    choices: ["json", "timeline", "calendar", "resume"],
    desc: 'Output type. Defaults to simply parsing the document and returning json. Specify a view like "timeline" to produce an html document.',
  })
  .option("destination", {
    alias: "d",
    string: true,
    description:
      'Output destination, e.g., "timeline.html". If "output" is not specified, will infer the output from the filename. For example, "MyTimeline.json" will produce json, "product_calendar.html" will produce the calendar view, "personal_timeline.html" will produce the timeline view, etc.',
  })
  .demandCommand(1, "Provide an input markwhen file").argv;

async function main() {
  const args = await argv;
  const inputFileName = args._[0];
  const content = readFileSync(inputFileName, "utf-8");
  const parsed = parse(content);

  if (args.destination && args._[1]) {
    er(`Ambiguous output - ${args.destination} & ${args._[1]}`);
    return;
  }

  let destination = "timeline.mw.json";
  if (args.destination) {
    destination = args.destination;
  } else if (args._[1]) {
    destination = `${args._[1]}`;
  }

  let outputType = "json" as "json" | "timeline" | "calendar" | "resume";
  if (!args.outputType) {
    // Try to infer output type from filename
    const options = [
      [".json", "json"],
      ["timeline.html", "timeline"],
      ["calendar.html", "calendar"],
      ["resume.html", "resume"],
    ] as [string, typeof outputType][];

    for (const option of options) {
      if (destination.endsWith(option[0])) {
        outputType = option[1];
      }
    }
  }

  if (outputType === "json") {
    const asJson = JSON.stringify(parsed);
    writeFileSync(destination, asJson);
    return;
  }

  const currentPath = path.dirname(fileURLToPath(import.meta.url));
  const templateHtml = readFileSync(
    path.resolve(currentPath, `../html/${outputType}.html`),
    "utf-8"
  );

  const appState = {
    app: {
      isDark: false,
      pageIndex: 0,
    },
    markwhen: {
      rawText: content,
      parsed: parsed.timelines,
      page: {
        parsed: parsed.timelines[0],
        transformed: parsed.timelines[0].events,
      },
    },
  };
  const html = parseHtml(templateHtml);
  const script = `<script>var __markwhen_initial_state = ${JSON.stringify(
    appState
  )}</script>`;
  const head = html.getElementsByTagName("head")[0];
  head.innerHTML = script + head.innerHTML;
  writeFileSync(destination, html.toString());
}

main();
