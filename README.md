# @markwhen/mw

`mw` is the [markwhen](https://docs.markwhen.com) command line interface (CLI). You can use it to parse markwhen files and optionally render a view of it (timeline+gantt/calendar/resume).

All html output is self-contained; js and css are inlined and there are no external scripts.

## Installation

```sh
npm i -g @markwhen/mw
```

## Usage

### Output HTML

```sh
mw [serve] <input_file> [<destination>] [-o <outputType>] [-d <destination>] [-p <port>] [-s <socket_port>]
```

| Option        | Description                                                                                                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `serve`       | If provided, will start a server at the specified `port` and watch the `input_file` for changes                                                                                                                                   |
| `outputType`  | one of `json` \| `timeline` \| `calendar` \| `resume`                                                                                                                                                                             |
| `destination` | File to write to. Output type can be inferred from the filename if `outputType` is not specified; i.e., files ending in `timeline.html` will produce the timeline view, files ending in `json` will produce the raw parse output. |
| `port`        | If serving, port to serve from                                                                                                                                                                                                    |
| `socketPort`  | If serving, socket port to serve from                                                                                                                                                                                             |

Parse markwhen document and output json:

```sh
mw project.mw
# -> outputs timeline.mw.json
```

Render a timeline view:

```sh
mw my_markwhen_file.mw timeline.html
# -> outputs timeline.html (timeline+gantt view)
```

Render a calendar view:

```sh
mw ThingsToDo.mw ThingsToDo-calendar.html
# -> outputs ThingsToDo-calendar.html (calendar view - inferred from the filename)
```

### Start a server and watch file

`mw serve <input_file>` will start a server and reflect changes to the input file.

Watch `projects.mw` and get immediate updates in `localhost:3000`:

```sh
mw serve projects.mw -o calendar
```

## Changelog

### 1.0.1
- Support live serving with sockets
- Fix https://github.com/mark-when/markwhen/issues/107