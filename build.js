import { cpSync } from "fs";

cpSync(
  "node_modules/@markwhen/timeline/dist/index.html",
  "view-templates/timeline.html"
);
cpSync(
  "node_modules/@markwhen/resume/dist/index.html",
  "view-templates/resume.html"
);
cpSync(
  "node_modules/@markwhen/calendar/dist/index.html",
  "view-templates/calendar.html"
);
