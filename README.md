# @markwhen/mw

`mw` is the [markwhen](https://docs.markwhen.com) command line interface (CLI). You can use it to parse markwhen files and optionally render a view of it (timeline+gantt/calendar/resume).

All html output is self-contained; js and css are inlined and there are no external scripts.

## Installation

```sh
npm i -g @markwhen/mw
```

## Usage

```sh
mw <input_file> [<destination>] [-o <outputType>] [-d <destination>]
```

|Option|Description|
|---|---|
|`outputType`|one of `json` \| `timeline` \| `calendar` \| `resume`|
|`destination`|File to write to. Output type can be inferred from the filename if `outputType` is not specified; i.e., files ending in `timeline.html` will produce the timeline view, files ending in `json` will produce the raw parse output.|

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