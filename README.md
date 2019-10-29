> Wait and see.

# warriors-family-tree "Moth Flight"

A WIP (thus W.A.S.) automatic family tree for Erin Hunter's [*Warriors* series]( https://en.wikipedia.org/wiki/Warriors_(novel_series) ) .

Live site is on:  https://crystal-pool.github.io/warriors-family-tree/ .

Instruction for embedding the family tree in external web pages is available below.

If you experienced anything wrong or have any suggestions for this project, feel free to (apply for a GitHub account and) open an issue to let us know. You can also join the discussion in the [Discord channel](https://discord.gg/bx4Pw9j).

## Background

First book published in 2003, *Warriors* series is now a still on-going young-adult fiction series with more than 60 books, depicting more than 1200 cat characters. While this is a good thing for enriching the books, it can be a burden sorting out the family relation among the characters.

During the past 10+ years, editors on *Warriors* Wikis of different languages have been trying to maintain several family tree templates, updating them whenever a new book comes out, some cats born, some cats died, some cats fall in love with others, etc. While this is really something to do, proved by the official website now having [a big family-tree]( https://warriorcats.com/clans-cats/family-tree) since '19, maintaining them by hands poses several problems:

1. Though it has tried its best to make contributor's life easier, the current [Template:Family tree / Template:Tree chart]( https://en.wikipedia.org/wiki/Template:Tree_chart ) syntax is not very intuitive. When the problem scales, Wiki contributors are prone to make mistakes.
2. Maintaining a big family tree with all the characters on it is not very feasible. For readers, it's not easy to navigate. For contributors, it's not easy to arrange the layout by hands. (See the link above to the current family tree on the *Warriors* official website.)
3. Maintaining a set of family trees solves the problem above, but it will cause more serious problem: [You will have to keep track of a myriad of family trees]( https://warriors.fandom.com/wiki/Category:Family_Tree_Templates ). You need to keep them consistent when adding new characters.

As a contributor to [zhwarriorswiki (Chinese *Warriors* Wiki)](https://warriors.huijiwiki.com/), noting the few number thus very precious energy the Wiki contributors may have, CXuesong decided to use structured data to solve the family tree arrangement problem, so hopefully the contributors can put their energy into areas that cannot be covered by Alderbot. (Though the solution may come a little bit tad late :new_moon_with_face:) 

## The embeddable family tree

> Note: as the current project is still under development, the bootstrap script is updated much frequently. Though you are welcome to send feedback on the problems you meet at any time, it may take some time to fix them. If you decided to try this, be warned and get well-prepared.

While Warriors Family Tree is a standalone Web app, it can also be embedded into other web pages, such as the Wiki page for a *Warriors* character.

See https://codepen.io/cxuesong/pen/gOORBBJ for an example of this.

To embed Warriors Family Tree on a HTML page, you will need to load a script for bootstrapping first

```html
<script src="https://crystal-pool.github.io/warriors-family-tree/embed/wft-embed-umd.js"></script>
```

and prepare an empty container for hosting the family tree

```html
<div id="family-tree-container"></div>
```

Then, depending on the environment settings, you may use one of the following way to access the embed service. Ensure to write the code inside `<script>...</script>` tag that is AFTER the `<script>` tag loading `wft-embed-umd.js`.

```typescript
// No module loader present.
var WarriorsFamilyTreeEmbed = window.WarriorsFamilyTreeEmbed;
// Your code follows

// -- OR --

// AMD (Wikia)
require(["WarriorsFamilyTreeEmbed"], function (WarriorsFamilyTreeEmbed) {
    // Your code follows
});

// -- OR --

// CommonJS
var WarriorsFamilyTreeEmbed = require("WarriorsFamilyTreeEmbed");
// Your code follows
```

Finally, use the following code to display the family tree for a specific character in *Warriors* series

```typescript
var container = document.getElementById("family-tree-container");
WarriorsFamilyTreeEmbed.mountFamilyTree(container, { qName: "wd:Q621" })
```

### Insert `<script>` tag dynamically

If you cannot take full control of the HTML to insert a raw `<script>` tag, but you still have control of the JavaScript part (e.g. on MediaWiki sites), you can use the following snippet to load the script. Note that the module is available only after this script has been loaded.

```typescript
(function () {
    var script = document.createElement("script");
    script.addEventListener("load", function () {
        // The inner function is called when wft-embed-umd.js has been loaded.
        // Choose one of the approaches as shown above. E.g. use AMD syntax:
        require(["WarriorsFamilyTreeEmbed"], function (WarriorsFamilyTreeEmbed) {
            // Your code follows
        });
    });
    script.src = "https://crystal-pool.github.io/warriors-family-tree/embed/wft-embed-umd.js";
    document.head.appendChild(script);
})();

```

## Development

You should have Git and [Yarn]( https://yarnpkg.com/ ) installed. In the repository root, use the following command to get started

```powershell
# Install the dependencies
PS> yarn install
# Apply the adhoc-fix
PS> git apply ./patch.diff
```

Then, you may decide to build the project, or just start a local development server

```powershell
# Build the project
PS> yarn run build
# Start a local development server
PS> yarn run start
```

This repository uses TSLint for static checking

```powershell
PS> yarn run lint
```

