import { cpSync } from "fs";

cpSync('node_modules/@markwhen/timeline/dist/index.html', 'html/timeline.html')
cpSync('node_modules/@markwhen/resume/dist/index.html', 'html/resume.html')
cpSync('node_modules/@markwhen/calendar/dist/index.html', 'html/calendar.html')