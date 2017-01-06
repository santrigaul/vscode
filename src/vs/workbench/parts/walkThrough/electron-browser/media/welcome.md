## Welcome to Visual Studio Code

A lightweight yet powerful source code editor for Windows, Mac and Linux. It comes with built-in support for JavaScript, TypeScript and Node.js and has a rich ecosystem of [extensions](command:workbench.extensions.action.showPopularExtensions) for other languages (such as C++, C#, Python, PHP, Go) and runtimes.

Pick your favorite [color theme](command:workbench.action.selectTheme) and [keymap](command:workbench.extensions.action.showRecommendedKeymapExtensions) and consult our [keyboard reference](command:workbench.action.keybindingsReference) to get started. You can always get filterable list of [all commands](command:workbench.action.showCommands) (⇧⌘P).

## Editor Features

What follows is an incomplete selection of editor features we thought you would find interesting. Feel free to skip and pick as you please.

### Multi-Cursor Editing

Use ⇧⌥ while selecting text with the mouse to select a rectangular area and change multiple lines at once.

```css
.global-message-list.transition {
    -webkit-transition: top 200ms linear;
    -ms-transition:     top 200ms linear;
    -moz-transition:    top 200ms linear;
    -khtml-transition:  top 200ms linear;
    -o-transition:      top 200ms linear;
    transition:         top 200ms linear;
}
```

### IntelliSense

Visual Studio Code comes with powerful IntelliSense for JavaScript and TypeScript preinstalled. Other languages can be upgraded with better IntelliSense through one of the many [extensions](command:workbench.extensions.action.showPopularExtensions).

```js
var express = require('express');
var app = express();

app.get('/', function (req, res) {
    res.send(`Hello ${req.}`);
});

app.listen(3000);
```