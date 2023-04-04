#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { parse } from "@markwhen/parser/lib/index.js";
import { readFileSync, writeFileSync, watch } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import { parse as parseHtml } from "node-html-parser";
import { Timelines } from "@markwhen/parser/lib/Types";
import { WebSocketServer } from "ws";

const er = (m: string) => {
  process.stderr.write(m);
  process.exit(1);
};

type ViewType = "timeline" | "calendar" | "resume" | "json";

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
  .option("port", {
    alias: "p",
    number: true,
    description: "If serving, port to serve from",
    default: 3000,
  })
  .option("socketPort", {
    alias: "s",
    number: true,
    desc: "If serving, port to serve socket from",
    default: 3001,
  })
  .demandCommand(1, "Provide an input markwhen file").argv;

function getParseFromFile(inputFileName: string | number) {
  const content = readFileSync(inputFileName, "utf-8");
  const parsed = parse(content);
  return { parsed, rawText: content };
}

function injectScript(domString: string, jsToInject: string) {
  const html = parseHtml(domString);
  const script = `<script>${jsToInject}</script>`;
  const head = html.getElementsByTagName("head")[0];
  head.innerHTML = script + head.innerHTML;
  return html.toString();
}

function templateHtml(viewType: Exclude<ViewType, "json">) {
  const currentPath = path.dirname(fileURLToPath(import.meta.url));
  const templateHtml = readFileSync(
    path.resolve(currentPath, `../view-templates/${viewType}.html`),
    "utf-8"
  );
  return templateHtml;
}

const appState = (parsed: Timelines, rawText: string) => ({
  app: {
    isDark: false,
    pageIndex: 0,
  },
  markwhen: {
    rawText,
    parsed: parsed.timelines,
    page: {
      parsed: parsed.timelines[0],
      transformed: parsed.timelines[0].events,
    },
  },
});

function getInitialHtml(
  parsed: Timelines,
  rawText: string,
  viewType: ViewType
) {
  if (viewType === "json") {
    return JSON.stringify(parsed);
  }

  return injectScript(
    templateHtml(viewType),
    `var __markwhen_initial_state = ${JSON.stringify(
      appState(parsed, rawText)
    )}`
  );
}

async function main() {
  const args = await argv;
  let inputFileName = args._[0];
  let serving = false;
  if (inputFileName === "serve") {
    serving = true;
    inputFileName = args._[1];
    if (!inputFileName) {
      er("Provide an input markwhen file");
    }
  }

  const { parsed, rawText } = getParseFromFile(inputFileName);

  const desintationArgsIndex = serving ? 2 : 1;
  if (args.destination && args._[desintationArgsIndex]) {
    er(
      `Ambiguous output - ${args.destination} & ${args._[desintationArgsIndex]}`
    );
    return;
  }

  let destination: string | undefined;
  if (args.destination) {
    destination = args.destination;
  } else if (args._[desintationArgsIndex]) {
    destination = `${args._[desintationArgsIndex]}`;
  }

  let outputType = args.outputType as ViewType | undefined;
  if (!args.outputType) {
    // Try to infer output type from filename
    const options = [
      [".json", "json"],
      ["timeline.html", "timeline"],
      ["calendar.html", "calendar"],
      ["resume.html", "resume"],
    ] as [string, typeof outputType][];

    for (const option of options) {
      if (destination?.endsWith(option[0])) {
        outputType = option[1];
      }
    }
  }

  if (serving) {
    if (outputType === "json") {
      console.log(
        "Specify a view to serve with --output: `mw serve file.mw --output timeline`"
      );
      return;
    }
    const wsPort =
      parseInt(process.env.SOCKET_PORT || "0") || args.socketPort || 3001;
    const wss = new WebSocketServer({ port: wsPort });
    wss.on("connection", (ws) => {
      watch(path.join("" + inputFileName), "utf-8", (type, f) => {
        console.log("Updating...");
        const { parsed, rawText } = getParseFromFile(inputFileName);
        ws.send(
          JSON.stringify({
            type: "state",
            request: true,
            id: `markwhen_1234`,
            params: appState(parsed, rawText),
          })
        );
      });
    });

    const app = express();
    app.get("/", (req, res) => {
      const html = injectScript(
        templateHtml((outputType as Exclude<ViewType, "json">) || "timeline"),
        `var __markwhen_wss_url = "ws://localhost:${wsPort}"; 
var __markwhen_initial_state = ${JSON.stringify(appState(parsed, rawText))}`
      );
      res.status(200).send(html);
    });

    const port = process.env.PORT || args.port || 3000;
    app.listen(port);
    console.log(`Server running at http://localhost:${port}`);
  } else if (outputType === "json") {
    const asJson = JSON.stringify(parsed);
    writeFileSync(destination || "timeline.mw.json", asJson);
    return;
  } else {
    const initialHtml = getInitialHtml(parsed, rawText, outputType || "json");
    writeFileSync(destination || `${outputType}.html`, initialHtml);
  }
}

main();
