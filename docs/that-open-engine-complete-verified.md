# THAT OPEN ENGINE - COMPLETE RENDERED SPECIFICATION & TUTORIALS

Generated with Iframe Rendering Extraction

---

# MODULE: 👨🏻‍💻 Introduction
**URL:** https://docs.thatopen.com/intro

# This page crashed.

e.getBoundingClientRect is not a function


---

# MODULE: 🤝 Get involved
**URL:** https://docs.thatopen.com/contributing

- 
- 🤝 Get involved

# 🤝 Get involved

Want to help us make this project even more amazing? Great! Contributing is easy, and on this page you'll find a quick guide on how to do it. 👇🏻

There are basically 3 places where you can help:

## 🐞 Spotting bugs​

Have you found a bug / something to improve? Create an issue in the corresponding repository (if it doesn't exist yet) so that we can start working on it! 💪🏻

If you are not sure where the issue belongs, you can just create it in the components repository and we'll redirect it to the right place!

## 🍻 Visiting the community​

Our community is the heart of our project. It's the place where all BIM software developers meet, share their wins and learn from each other.

You can be part of it by:

- Showing us what you built with our libraries!
- Answering questions of other BIM software developers.
- Sharing resources / tutorials.
- Starting interesting debates and conversations.

Showing us what you built with our libraries!

Answering questions of other BIM software developers.

Sharing resources / tutorials.

Starting interesting debates and conversations.

## 👨🏻‍💻 Coding​

The knowledge you need to help us depend on which part of the libraries you want to help us with. In general, basic knowledge of web development, TypeScript and Three.js should suffice. If you are not sure, don't hesitate to ask us!

This includes adding features and enhancing existing ones, fixing bugs or writing docs. The steps to contribute are the following:

### 🙏🏻 1. Ask first​

We have been creating and maintaining our libraries for years for free, and there is nothing we appreciate more than people who want to help us. 💕

At That Open Company we believe in a merit-based governance model over the libraries. That means that the people who have helped the most and for the longest have the most decision-making power over them.

Therefore, if you use the libraries and miss something, or just want to be part of the project, we strongly recommend that you ask first. It can save yourself days of work doing a PR that might be rejected by the maintainers. Also, if you ask, we'll gladly help you out in everything you need to start developing. 🚀

You can ask by opening a feature issue in any of our repositories or adding a comment to any existing one. That way, you open a friendly discussion where people can participate and maintainers decide. If you are not sure where the issue belongs, you can just create it in the components repository and we'll redirect it to the right place!

### 🚀 2. Start coding​

Once you have asked, and got a positive answer from one of the maintainers, you can start coding! To add / edit code of the library, you will need to:

- Install yarn using npm i -g yarn.
- Create a fork of the repository.
- Clone your fork to your local machine.
- Create a branch to work on that specific issue, and link that branch to the issue.
- Use the command yarn install to install all the dependencies of that library.
- Use the command yarn dev to run a local server where you can see the changes you make in the corresponding example.ts files. To see the changes, you have 2 options:

Run yarn build in the corresponding package.
To see the changes in real time, you can substitute the import statement path of the library by ../... For instance, in an example.ts in the @thatopen/components package, you can substitute the line import * as OBC from @thatopen/components by import * as OBC from ../.., and you'll see the changes you make to the code without needing to rebuild. Don't forget to change this statement back when you are done!
- Run yarn build in the corresponding package.
- To see the changes in real time, you can substitute the import statement path of the library by ../... For instance, in an example.ts in the @thatopen/components package, you can substitute the line import * as OBC from @thatopen/components by import * as OBC from ../.., and you'll see the changes you make to the code without needing to rebuild. Don't forget to change this statement back when you are done!
- Work on your fork of the repository locally. Please follow the basic clean rules!
- After making all your commits with the changes, run yarn build-libraries to check that you haven't created any errors in the examples.
- Create a pull request. The name should follow the conventional commits convention. If you are not sure, check out the title past pull requests!

Install yarn using npm i -g yarn.

Create a fork of the repository.

Clone your fork to your local machine.

Create a branch to work on that specific issue, and link that branch to the issue.

Use the command yarn install to install all the dependencies of that library.

Use the command yarn dev to run a local server where you can see the changes you make in the corresponding example.ts files. To see the changes, you have 2 options:

- Run yarn build in the corresponding package.
- To see the changes in real time, you can substitute the import statement path of the library by ../... For instance, in an example.ts in the @thatopen/components package, you can substitute the line import * as OBC from @thatopen/components by import * as OBC from ../.., and you'll see the changes you make to the code without needing to rebuild. Don't forget to change this statement back when you are done!

Work on your fork of the repository locally. Please follow the basic clean rules!

After making all your commits with the changes, run yarn build-libraries to check that you haven't created any errors in the examples.

Create a pull request. The name should follow the conventional commits convention. If you are not sure, check out the title past pull requests!

Then, someone from our team will reviewed it and, if everything is ok, merge it. That's it! Easy, right? 😋 We'll help you get started and give you anything you needs, so don't hesitate to reach out!

## 📏 Code guidelines​

Before opening a PR, please follow the rules below. They keep our releases smooth and our docs page rendering correctly. If you catch a violation, fix it at the source — it's almost always cheaper than cleaning up later.

These apply to all five packages (fragments, components, components-front, ui, ui-obc).

### 1. 📝 JSDoc rules​

The TypeDoc plugin that powers this docs site renders class/interface/type/function summaries into a markdown table. Anything with a newline in the description breaks that table. To keep rendering reliable, follow these rules:

#### 1.1 The summary of every exported item must be a single line​

Applies to class, abstract class, interface, type, const, function — anything TypeDoc puts in an index table.

```typescript
// ❌ Bad — two description lines/** * Manages block insertions across all drawings. * A block is a reusable named geometry definition. */export class BlockAnnotations { ... }// ✅ Good — single line description/** Manages block insertions across all drawings. */export class BlockAnnotations { ... }
```

If your description does not fit comfortably on one line, move the extra content to the constructor JSDoc (for classes) or rephrase (for interfaces/types/functions):

```typescript
/** A single technical drawing — the core spatial aggregate. */export class TechnicalDrawing {  /**   * Brings together a THREE.Group and a collection of viewports.   * Moving or rotating the container repositions the entire drawing   * in 3D world space without affecting local coordinates.   */  constructor(components: Components) { ... }}
```

@param, @returns, @example, @template, @fires, @element tags are fine even if they make the JSDoc span multiple lines — they get rendered in their own sections, not in the summary cell. The rule is about the description text only.

#### 1.2 Never put multiline code blocks inside @param descriptions​

TypeDoc inlines @param descriptions into a markdown table cell, and fenced code blocks inside a table cell turn into <code>{...}</code> HTML. MDX then tries to parse the literal { as a JSX expression and fails to build the docs.

```typescript
// ❌ Bad — fenced code block in @param description/** * @param config - The configuration. * Default configuration: * ```ts * { attributesDefault: true } * ``` */// ✅ Good — plain prose/** * @param config - The configuration. Defaults to returning all built-in * attributes and no relations. */
```

If you need a longer example, put it under @example (which gets its own section) instead of inside @param.

#### 1.3 Escape literal { / } in descriptions​

Anywhere else in a JSDoc description, literal curly braces — even inside prose — can choke MDX. Wrap them in backticks so they become inline code:

```typescript
// ❌ Bad — MDX will try to parse { value, label? } as a JS expression/** An array of mark objects ({ value, label? }) that define snap points. */// ✅ Good — backticks render the braces as literal text/** An array of mark objects (`{ value, label? }`) that define snap points. */
```

Same rule for TypeScript generics that appear in prose (`Map<string, number>`) — wrap them in backticks.

### 2. 🌐 example.ts rules​

Examples in src/**/example.ts are bundled into the docs site and shipped to docs.thatopen.com. That means every URL has to work from a browser loading the tutorial page, not from your local dev server.

#### 2.1 All fetch calls must use absolute github.io URLs​

```typescript
// ✅ Good — absolute github.io URLconst arqFile = await fetch(  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag");// ❌ Bad — relative path, 404s on deployed docsconst arqFile = await fetch("/resources/frags/school_arq.frag");
```

The domain should be the package's own github repo:


| Data Table |
| --- |
| PackageDomainfragmentshttps://thatopen.github.io/engine_fragment/resources/...components / components-front / ui / ui-obchttps://thatopen.github.io/engine_components/resources/... |

Exception: worker.mjs always lives in engine_fragment/resources/ because the worker ships with the fragments package.

Files named test.ts (not example.ts) are not bundled into the docs. They can keep using /resources/... for local dev.

#### 2.2 Adding a new resource? Commit the file to the repo​

If your new example fetches resources/foo/bar.json, the file must live in the repo's resources/ folder (which is what github.io serves). Checklist:

- Add the file to resources/<subfolder>/
- Reference it with the absolute github.io URL in example.ts
- Commit the resource file along with the example update

### 3. 🧱 web-ifc and wasm URLs​

When you bump web-ifc in package.json, update every reference to its wasm CDN URL at the same time. Grep for web-ifc@ and rewrite them all:

```typescript
// package.json"web-ifc": "0.0.77"        // bumped// example.ts — must matchwasm: { path: "https://unpkg.com/web-ifc@0.0.77/", absolute: true }
```

Out-of-sync versions will load wasm that doesn't match the runtime API and produce obscure errors at fetch time.

### 4. 📊 Chart examples​

#### 4.1 Use positive-only data for pie/doughnut/polarArea​

Negative slices make no visual sense on a pie chart and look broken.

```typescript
// ❌ Bad — random signed values on a pie chartconst value = Math.floor(Math.random() * 200 - 100);// ✅ Good — positive values for pie-family chartsconst value = Math.round(Math.random() * 90 + 10);
```

Reserve signed random values for bar/line/radar charts where negatives are meaningful.

#### 4.2 Transparent borders on a dark theme​

The bim-chart default borderColor is #000000, which draws a harsh black outline on the dark UI theme. Set it to transparent when you create a chart in an example:

```typescript
chart.borderColor = "#00000000";
```

### 5. 🎨 example.html theme​

Every example.html should use the same theme class as its sibling examples in the same folder. Our default is dark:

```typescript
<html lang="en" class="bim-ui-dark">
```

A stray bim-ui-light will make one example render on a white background while the rest use the dark theme — easy to notice in review, easy to miss in development.

### 6. 🧹 Don't ship debugging leftovers in example.html​

When you locally test a new example, you may temporarily change things like:

- the <script type="module" src="./test.ts"> tag (point at a test entry)
- the <title> to "Document" or a working name
- CSS margin tweaks for debugging

Revert these before committing — otherwise you'll ship broken tutorials.

### 📋 TL;DR checklist​

- Class/interface/type/function summary: one line.
- Never put fenced code blocks inside @param.
- Curly braces in JSDoc prose: wrap in backticks.
- example.ts fetch calls: absolute github.io URLs only.
- Bump web-ifc in package.json? Update every wasm URL at the same time.
- New resource file? Commit it to the repo's resources/ folder.
- example.html theme: bim-ui-dark, not bim-ui-light.
- Never commit debugging leftovers (./test.ts, <title>Document</title>, etc.).


---

# MODULE: 🔄️ Migrating previous versions
**URL:** https://docs.thatopen.com/migration

- 
- 🔄️ Migrating previous versions

# 🔄️ Migrating previous versions

We deliver new features and bugfixes with each release. While we try to keep the API as stable as possible, there might be situations in which it's impossible to do it without holding back the project progress. That's why we: 👇🏻

- Keep all the past docs in this page. 📚
- Make a migration guide for each version (starting in 3.1.x) covering all components. 🚀

Here you'll learn how to migrate to version 3.4.x from version 3.3.x.

This means migrating from:

- @thatopen/fragments@3.3.7 ➡️ @thatopen/fragments@3.4.0
- @thatopen/components@3.3.3 ➡️ @thatopen/components@3.4.0
- @thatopen/components-front@3.3.3 ➡️ @thatopen/components-front@3.4.0
- @thatopen/ui@3.3.7 ➡️ @thatopen/ui@3.4.0
- @thatopen/ui-obc@3.3.3 ➡️ @thatopen/ui-obc@3.4.0

## ☝🏻 Before you start​

You will need to upgrade all the versions of our libraries, as well as it's peer dependencies (watch out three.js). You can't combine old and new libraries. 📚➡️📚

This is the legend we'll use to have an easy overview of changes in the API:

- 🟰 means no breaking change in the API.
- 〰️ means something small changed (e.g. a method/component name changed).
- ➰ means something changed considerably or completely.
- 🔜 means the component has been removed temporarily.
- ✖️ means the component has been removed permanently.

You'll find more info about removed components below. 👇🏻

The main purpose of this article is to migrate existing apps, and you can't migrate features that didn't exist before. New features won't be covered here unless they are the substitution of a previous feature. To see how new features work, check out the latest tutorials. The only exception are new features that substitute existing ones, which will be covered here too.

And one last thing: if you get stuck, please ask in our community (ideally, providing a minimal example we can test). 🫡

## 🛑 About removed features​

If you have an existing app, it's possible that some of the features you used from previous versions are not there anymore, temporarily or permanently. Depending on the specific scenario, there are different solutions: 👇🏻

- ✖️ If the feature was permanently removed because it's not needed anymore (e.g. the culler), you shouldn't have a need to replace it.
it's not needed anymore (e.g. the culler), so you shouldn't have a need to replace it at all.
- ✖️ If the feature was permanently removed because what it did is done by something else (e.g. the civil tools, which have been merged into one), replacing the component with the new one should give you the features back.
- ✖️ If the feature was permanently removed because we consider it out of scope (like the Json exporter), we append the link to the original code here, so that you can copy and maintain it yourself in your project if you need it.
- 🔜 If the feature was temporarily removed because we will add it in a future path or release, you just have to wait until we add it. If you can't wait to have it in your solution, our suggestion is that you stick to the previous version of the library until we add it back.

✖️ If the feature was permanently removed because it's not needed anymore (e.g. the culler), you shouldn't have a need to replace it.
it's not needed anymore (e.g. the culler), so you shouldn't have a need to replace it at all.

✖️ If the feature was permanently removed because what it did is done by something else (e.g. the civil tools, which have been merged into one), replacing the component with the new one should give you the features back.

✖️ If the feature was permanently removed because we consider it out of scope (like the Json exporter), we append the link to the original code here, so that you can copy and maintain it yourself in your project if you need it.

🔜 If the feature was temporarily removed because we will add it in a future path or release, you just have to wait until we add it. If you can't wait to have it in your solution, our suggestion is that you stick to the previous version of the library until we add it back.

If you have any questions about your specific case, let us know in the community! 🫱🏻‍🫲🏻

## 📗 web-ifc​

The first thing you will need to do is update web-ifc (our core IFC library) to the correct version. All versions of the library should use the same web-ifc version (let us know otherwise). You can find the correct version here. Please install it as a dependency in your project and use the correct WASM file (tutorials like the IfcLoader cover this). 🙏🏻

## 📘 fragments​

### 🟰 All existing features​

The API hasn't changed for any of the Fragments existing features, so all existing apps should be working with the newest version of the library. If you have any issues, let us know! 👍🏻

## 📙 components​

### 🟰 All existing features​

The API hasn't changed for any of the components existing features, so all existing apps should be working with the newest version of the library. If you have any issues, let us know! 👍🏻

## 📕 components-front​

### 🟰 All existing features​

The API hasn't changed for any of the components front existing features, so all existing apps should be working with the newest version of the library. If you have any issues, let us know! 👍🏻

## 📔 ui​

### 🟰 All existing features​

The API hasn't changed for any of the ui existing features, so all existing apps should be working with the newest version of the library. If you have any issues, let us know! 👍🏻

## 📓 ui-obc​

### 🟰 All existing features​

The API hasn't changed for any of the ui obc existing features, so all existing apps should be working with the newest version of the library. If you have any issues, let us know! 👍🏻


---

# MODULE: 🧩 Components
**URL:** https://docs.thatopen.com/Tutorials/UserInterface/OBC/ViewCube

- 
- 👩🏻‍🏫 Tutorials
- UserInterface
- OBC
- ViewCube

# ViewCube

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 🧭 Navigating your 3D Scene with the ViewCube​

Users navigating a 3D BIM scene lose track of orientation as they orbit and pan — without a reference indicator, recovering a specific view like front or top requires manual camera adjustments.
The ViewCube is a compact 3D orientation indicator that stays in sync with the camera and lets users snap to predefined views by clicking its faces.
This tutorial covers creating a basic 3D world with scene, camera, and renderer; placing the ViewCube inside the viewport element and linking it to the camera; keeping it synchronized by calling the orientation update on every camera control event; and handling a face click event to reposition the camera to a specific look-at target with animation.
By the end, you'll have a viewport with a ViewCube that tracks camera orientation in real time and snaps the view on click.

### 🖖 Importing our Libraries​

We'll need:

- @thatopen/ui for UI initialization.
- @thatopen/components for the 3D engine and scene management.
- The local UI components package for extra UI features.

```typescript
import * as BUI from "@thatopen/ui";import * as OBC from "@thatopen/components";import * as CUI from "../..";
```

### 🚦 Initializing the UI​

As always, initialize the UI libraries at the start of your app:

```typescript
BUI.Manager.init();CUI.Manager.init();
```

### 🌎 Setting up a Simple 3D Scene​

Let's create a basic 3D world with a scene, camera, and renderer:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);const viewport = document.createElement("bim-viewport");world.renderer = new OBC.SimpleRenderer(components, viewport);world.camera = new OBC.SimpleCamera(components);
```

### ➕ Adding Grids and Initializing Components​

Optionally, add a grid to your scene and initialize all components:

```typescript
const grids = components.get(OBC.Grids);grids.create(world);components.init();
```

### 🧊 Adding the ViewCube​

Now, let's add the ViewCube and connect it to the camera:

```typescript
const viewCube = document.createElement("bim-view-cube");viewCube.camera = world.camera.three;viewport.append(viewCube);
```

This attaches the ViewCube to your viewport and links it to your camera's Three.js instance.

### 🔄 Keeping the ViewCube in Sync​

To keep the ViewCube orientation updated as the camera moves, listen for camera control updates:

```typescript
world.camera.controls.addEventListener("update", () =>  viewCube.updateOrientation(),);
```

### 🖱️ Handling ViewCube Interactions​

You can let users click on the ViewCube to change the camera's orientation. For example, set the camera to a specific view when the left face is clicked:

```typescript
viewCube.addEventListener("leftclick", () => {  world.camera.controls.setLookAt(-10, 10, 0, 1, 10, 0, true);});
```

### 🖼️ Laying Out the UI​

Let's use a grid layout to display the viewport:

```typescript
const app = document.getElementById("app") as BUI.Grid;app.layouts = {  main: {    template: `      "viewport"    `,    elements: { viewport },  },};
```

## 🎉 That's it!​

You now have a fully interactive ViewCube in your 3D scene, letting users easily orient themselves and explore your BIM models!


---

# MODULE: 🚀 Getting started
**URL:** https://docs.thatopen.com/fragments/getting-started

- 
- 🔥 Fragments
- 🚀 Getting started

# 🚀 Getting started

## 👩🏻‍🏫 Fragments ABC​

Fragments is our open native format (.frag). It has various benefits over other formats:

- 🏎️ Fast: With Fragments we can visualize gigabytes of BIM data in seconds, even in modest devices. It's not magic: it's because Fragments was specifically designed for this.
- 💎 Performant: Fragments doesn't just open gigabytes of data, hundreds of files, millions of objects in seconds. It can run all that data at 60 fps inside the browser while consuming very little RAM memory. This performance also affects the size of the files: a 2GB IFC STEP file becomes an 80 mb Fragments file.
- 🔌 More than a format: We have built all our BIM tools on top of Fragments. That means that using Fragments is not just using a format, but getting a whole free open source toolkit to build powerful full-stack BIM software in minutes. You can check them all out in the Tutorials section of these docs.
- 🌍 Compatible: Fragments is built with flatbuffers, a free and open source library from Google to create binary formats. This means that it's compatible with more than 15 programming languages.
- 🧹 Editable: Fragments is not just for viewing, but also for editing data (both properties and geometry).
- 🌍 Free and Open source: Fragments is completely free and open source (MIT License), so you can use them even for commercial purposes for free.

🏎️ Fast: With Fragments we can visualize gigabytes of BIM data in seconds, even in modest devices. It's not magic: it's because Fragments was specifically designed for this.

💎 Performant: Fragments doesn't just open gigabytes of data, hundreds of files, millions of objects in seconds. It can run all that data at 60 fps inside the browser while consuming very little RAM memory. This performance also affects the size of the files: a 2GB IFC STEP file becomes an 80 mb Fragments file.

🔌 More than a format: We have built all our BIM tools on top of Fragments. That means that using Fragments is not just using a format, but getting a whole free open source toolkit to build powerful full-stack BIM software in minutes. You can check them all out in the Tutorials section of these docs.

🌍 Compatible: Fragments is built with flatbuffers, a free and open source library from Google to create binary formats. This means that it's compatible with more than 15 programming languages.

🧹 Editable: Fragments is not just for viewing, but also for editing data (both properties and geometry).

🌍 Free and Open source: Fragments is completely free and open source (MIT License), so you can use them even for commercial purposes for free.

Yes, we know there are plenty of formats out there, including glTF, glb, IFC STEP, etc. So why bother creating our own format when we can simply use an existing one and not worry about its maintenance?

We really would like to use another format, but we've tried for years and they were not enough. Not fast enough, not performance enough, not editable enough... We aren't saying it's impossible to make something as good with them as we did with Fragments, just that we weren't able after years of trying. 😅

As of today, Fragments is not an official standard. It's a technology we created and use as native format because we needed it. It's actively maintained by us, and it can open, run and edit gigabytes of BIM data in seconds.

If you are building BIM software with our libraries, you don't need to know much about fragments and happily treat them as a black box. We do everything for you and provide the necessary APIs to work with them. If you want to build something more custom (like a Fragment importer / exporter) or your own tools on top of them, you'll find everything you need in this section of the docs. 😉

But first, let's get our feet wet with the basics: start using fragments in one of your projects! 🏃🏻‍♂️

## ⛷️ Try them!​

You can find the Fragments library here and the npm repo here. You can import it into your project like this:

```typescript
npm i @thatopen/fragments
```

Most of our libraries are based on Three.js, so you'll also need to import it. Make sure it's the same version as the one used by our libraries.

```typescript
npm i three
```

Finally, you also need to install some peer dependencies. These are other libraries we made and didn't include as regular dependencies to enable more flexible bundling scenarios. Again, make sure it's the same version as the one used by our libraries:

```typescript
npm i web-ifc
```

That's it! Now you are ready to start using Fragments. But where to start? Here you have a nice tutorial to make an app that converts IFC files to fragments in less than 5 minutes: 🏇🏻

Once you convert your files to fragments, they will load very, very fast. Here you have another tutorial to load fragments directly. While you can convert files to fragments on the fly like in the first example, the recommended approach is to store the Fragments and then always load them, like in this example: 😎

Cool, right? Now you can convert your bloated BIM data to fragments to load them in seconds in your app. If you need some guidance in your journey to discover all the components that we offer, check out the tutorial paths. If you want to know more about components, keep reading! 👇🏻

## 🔌 Compatibility​

Fragments is compatible with +15 programming languages because it's based on flatbuffers. That said, there are 2 big scenarios when using Fragments:

- 🌝 If you use JavaScript / TypeScript: you can import / export fragments by using our libraries AND use all the tech stack we've built around them: the powerful 3D viewer, all the BIM tools, our UI system, etc.
- 🌚 If you use another programming language: you can import / export fragments by building your own custom importer / exporter. You won't be able to use our 3D viewer / BIM tools because they were built in JavaScript / TypeScript, but you can build / use your own in your own tech stack.

🌝 If you use JavaScript / TypeScript: you can import / export fragments by using our libraries AND use all the tech stack we've built around them: the powerful 3D viewer, all the BIM tools, our UI system, etc.

🌚 If you use another programming language: you can import / export fragments by building your own custom importer / exporter. You won't be able to use our 3D viewer / BIM tools because they were built in JavaScript / TypeScript, but you can build / use your own in your own tech stack.

One of the main reasons to use Fragments is being able to use all the free/open-source tech stack we've built around them, like the powerful 3D viewer, the BIM tools, etc. So if you are working on another stack (Python, C#, C++, etc), you might be wondering what's in it for you. This is:

- ⏩ Fast and compact: A 2GB IFC STEP equals an 80 MB fragment, with all geometries and properties, which can be read in a couple of seconds even in modest devices.
- 🚪 Opens the door for an integration with our technology: While you might already have a certain tecnology stack, using Fragments might open the door to add a new piece to your app built with our technology. JavaScript / TypeScript are very flexible, so embedding our tecnology in your solution is likely feasible. This means you can have a powerful 3D viewer, a whole new set of BIM tools and more. Yes, all free and open source.
- 🫱🏻‍🫲🏻 Compatibility with other apps using our tools: As this project grows, there are more and more startups using our free/open-source libraries. All of them use Fragments natively. So if you decide to go for Fragments, you'll be natively compatible with all of them for free.

⏩ Fast and compact: A 2GB IFC STEP equals an 80 MB fragment, with all geometries and properties, which can be read in a couple of seconds even in modest devices.

🚪 Opens the door for an integration with our technology: While you might already have a certain tecnology stack, using Fragments might open the door to add a new piece to your app built with our technology. JavaScript / TypeScript are very flexible, so embedding our tecnology in your solution is likely feasible. This means you can have a powerful 3D viewer, a whole new set of BIM tools and more. Yes, all free and open source.

🫱🏻‍🫲🏻 Compatibility with other apps using our tools: As this project grows, there are more and more startups using our free/open-source libraries. All of them use Fragments natively. So if you decide to go for Fragments, you'll be natively compatible with all of them for free.

## ⚖️ Current state​

Fragments is NOT a standard, it's a format we created because we needed something lightweight, fast, efficient and easily editable. We tried with other formats for years, but they weren't enough. We wish we could rely on other formats so that we didn't have to invest time and resources in maintaining this, but we had no choice. Now we maintain and develop Fragments actively. 💪🏻

Fragments are free and open source. We built it for us, but as everything we have built until now, if someone else find them useful, we'll be happy! 😎


---

# MODULE: 🧩 The schema
**URL:** https://docs.thatopen.com/fragments/schema

- 
- 🔥 Fragments
- 🧩 The schema

# 🧩 The schema

## 🚸 Before you start​

Before reading this page, keep in mind that we've built a whole JavaScript / TypeScript tech stack on top of Fragments to make the heavy lifting for you. If you just want to build BIM software with our libraries, you can happily treat Fragments as a black box without worrying about its internal structure. 📦

If you want to build your custom importers / exporters, want to build Fragments custom tools in another programming languages or are just curious about it, go ahead! 🫡

## 👾 Introduction​

Fragments is a format built on top of Flatbuffers, an open source libraries to easily create binary formats that are compatible with any programming language. 😎

The way flatbuffers work is simple:

- ✍🏻 We create a schema. It's just a text file containing description of the data structures inside your file. The syntax is very simple and similar to C. The extension is .fbs (stands for flatbuffers schema). You can out the fragments schema below.
- 🔥 You use that schema file and the flatbuffers library to automatically create an importer / exporter of that file in any programming language. This is covered in the flatbuffers docs. We already did it for TypeScript/JavaScript and included it in our libraries, so you don't have to worry about that one! 😉

✍🏻 We create a schema. It's just a text file containing description of the data structures inside your file. The syntax is very simple and similar to C. The extension is .fbs (stands for flatbuffers schema). You can out the fragments schema below.

🔥 You use that schema file and the flatbuffers library to automatically create an importer / exporter of that file in any programming language. This is covered in the flatbuffers docs. We already did it for TypeScript/JavaScript and included it in our libraries, so you don't have to worry about that one! 😉

Flatbuffers is extensible, so even if we make changes (evolutions) to the schema in the future, it will be backwards compatible! 🐛▶️🦋

This is the schema file we created for fragments. Don't worry, we will cover it piece by piece in this page!

## 🏠 Check it out​

Before going in detail into each piece of the Fragments schema, let's check out a minimal Fragments file containing just a simple wall. In this example, you'll be able to see its data following the schema above, which might be useful for understanding how the schema works. You can even load your own IFC STEP files too to see their Fragments schema! 🚀

Keep in this example we are serializing ALL the data of the file to a JSON just to display it in the screen, which is very, very inneficient, beating Fragments performance benefits. Don't expect this demo to have the same performance as a production Fragmetns app. Avoid loading huge IFCs here if you don't want to see your browser freeze. 🙏🏻

You might want to revisit this example as a reference when trying to generate your own fragment files from IFC STEP or other data sources to have a reference of how it should look like: 👇🏻

## ✍🏻 General notes​

There are some decisions we've taken when definining the Fragments data schema whose motivation might not be obvious at first sight. We will cover them here.

### 🍱 Data structures​

In some parts of the schema you might find data structured in a specific way. They are not arbitrary: it's the way to be able to open gigabytes of BIM data in seconds. Keep in mind that we designed Fragments for performance, so every indirection decision that you see follows that purpose. 🚀

### 📃📃📃 String arrays​

You will see that in various places we are using string arrays (categories, attributes, relations, etc). This might seem inefficient memory-wise at first sight, as when we have an array with multiple strings, each string occupies size, regardless of whether it's duplicated or not. 🤔

However, flatbuffers allow to define unique strings, automatically deduplicating its size. So this array is as efficient as an array with unique strings and an index to relate them. 🍱

## 🧩 Model​

The Model is the main object and the entry point of all Fragment files. Each Fragments file has just one model, and it contains all the information of the file.  It has the following structure (we'll cover it step by step): 👇🏻

```typescript
table Model {    metadata: string; // JSON string for generic data about the file    guids: [string] (required); // An array of Global Unique Identifiers of items. Not all items may have a guid.    guids_items: [uint] (required); // An array that works as an indexation matching localIds indices with guids.    max_local_id: uint; // The smallest localID available when serializing. Used to know the next localID when adding a new item.    local_ids: [uint] (required); // File specific identification for each item.    categories: [string] (required); // An array of all item categories found in the file, stored as strings.    meshes: Meshes (required); // The object containing all explicit geometries of the model.    unique_attributes: [string]; // An array of unique item attributes in this model.    attributes: [Attribute]; // An array of items data stored as an array of arrays.    relation_names: [string]; // An array of unique relation names in this model.    relations: [Relation]; // An array of relations between different items stored as arrays of arrays.    relations_items: [int]; // An array that works as an indexation matching localIds indices with relations.    guid: string (required); // An global ID that identifies this model uniquely.    spatial_structure: SpatialStructure; // A tree representing the spatial relation between elements.}
```

### 📋 Metadata​

JSON string for generic data about the file itself. For example: {"schema":"IFC4"}". 🔖🔖🔖

### 🦋 Guids​

An array of Global Unique Identifiers of items. Not all items may have a guid. They should be consistent across exports from authoring applications. 🪨

### 🦋➡️♟️ Guids Items​

An array that works as an indexation matching localIds indices with guids. For instance, a Fragments file with the following data: 👇🏻

```typescript
{  "localIds": [34, 35, 36],  "guids": ["guid-abc", "guid-xyz"],  "guidsItems": [2, 1],  ...}
```

🧐 Means that there are 3 items:

- The first one has localId 34 and no guid.
- The second one has localId 35 and guid guid-xyz.
- The third one has localId 36 and guid guid-abc.

### 🥇🐛 Max Local Id​

The biggest localID found when serializing plus one. Used to know the next local id available when adding a new item. For example, if when loading an IFC STEP file the item with the highest express id (local id) was 34928, then the max local id will be 34929. 🖌️

### 🐛 Local Ids​

File specific identification for each item. They might vary with each export from authoring applications. All items must have a local id. If you are exporting Fragments from a data source that doesn't have local ids, you can just use an incremental uint starting at 0. 🔢

You may have noticed that fragments support both global ids (guids) and local ids. The main reason is that global ids are heavy, so if each item had its own global id, the file size would be huge. This also happens in IFC: each item has a local id (express id), and only some items have a global id. 🔎

### 🧬 Categories​

An array of all item categories (arbitrary strings used to classify items) found in the file. Categories are arbitrary, but all items must have a category. For instance, a Fragments file with the following data: 👇🏻

```typescript
{  "localIds": [34, 35, 36],  "categories": ["WALL", "SLAB", "WALL"],  ...}
```

🧐 Means that there are 3 items:

- The first one has localId 34 and category WALL.
- The second one has localId 35 and category SLAB.
- The third one has localId 36 and category WALL.

### 🪑 Meshes​

The object containing all explicit geometries of the model. That is, geometry used for fast visualization, not for modelling. It has the following structure (we'll check all its properties step by step): 👇🏻

```typescript
table Meshes {    coordinates: Transform (required); // The global coordinates of the model. Usually used in BIM models to locate the model geographically.    meshes_items: [uint] (required); // An array that works as an indexation matching localIds indices with meshes.    samples: [Sample] (required); // An array of all instances of meshes in this model.    representations: [Representation] (required); // Representations are a common interface for all geometry types. Each representation is an abstraction of a geometry and has its basic information.     materials: [Material] (required); // The list of unique geometry materials in this model.    circle_extrusions: [CircleExtrusion] (required); // The list of geometries defined as a wire with thickness. Used mainly for reinforcement bars.    shells: [Shell] (required); // The list of geometries defined as faces and holes (breps).    local_transforms: [Transform] (required); // Local transforms of the samples    global_transforms: [Transform] (required); // A set of local transformations for geometry samples. Each global transformation is assigned to a local id by meshes_items.}
```

#### 🗺️ Coordinates​

The global coordinates of the model. Usually used in BIM models to locate the model geographically. 🌍

#### 🦋➡️♟️ Meshes Items​

An array that works as an indexation matching localIds indices with meshes. For instance, a Fragments file with the following data: 👇🏻

```typescript
{  "localIds": [34, 35, 36],  "meshes": {  	"meshesItems": [0, 2],  	...   },  ...}
```

🧐 Means that there are 3 items:

- The first one has local id 34 and has assigned the mesh with index 0.
- The second one has local id 35 and has no mesh assigned.
- The third one has local id 36 and has assigned the mesh with index 1.

#### 👪 Samples​

An array of all instances of explicit geometries in this model. Each sample has the following structure: 🗼

```typescript
struct Sample {    item: uint; // The index of the global transform and item in meshesItems    material: uint; // The index of the material in materials    representation: uint; // The index of the representation in representations    local_transform: uint; // The index of the local transform in localTransforms}
```

For instance, a Fragments file with the following data: 👇🏻

```typescript
{  "localIds": [34, 35, 36],  "meshes": {"meshesItems": [0, 2],    "samples": [      {        "item": 0,        "material": 0,        "representation": 0,        "localTransform": 0      },      {        "item": 1,        "material": 0,        "representation": 1,        "localTransform": 0      }    ],    ...   },  ...}
```

🧐 Means that there are 3 items:

- The second one has localId 35 and has no mesh assigned.
- The first one has localId 34 and has assigned the mesh with index 0. This mesh has a geometry sample attached to it, with:

global transform index 0.
local transform index 0.
material index 0, representation index 0.
representation index 0.
- global transform index 0.
- local transform index 0.
- material index 0, representation index 0.
- representation index 0.
- The third one has localId 36 and has assigned the mesh with index 1. This mesh has a geometry sample attached to it, with:

global transform index 1.
local transform index 1.
material index 0, representation index 0.
representation index 0.
- global transform index 1.
- local transform index 1.
- material index 0, representation index 0.
- representation index 0.

- global transform index 0.
- local transform index 0.
- material index 0, representation index 0.
- representation index 0.

- global transform index 1.
- local transform index 1.
- material index 0, representation index 0.
- representation index 0.

✍🏻 So, the conclusions are:

- There are 2 geometric samples (instances).
- They are attached to different items (and therefore to different global transforms).
- They have different geometries (representations).
- They share the same material and the same local transformation.

#### 🃏 Representations​

Representations are a common interface for all geometry types. They are an abstraction of a geometry and have its basic information. Each representation has the following structure: 🗼

```typescript
enum RepresentationClass:byte {    NONE = 0, // No representation class    SHELL = 1, // Shell (brep) representation class    CIRCLE_EXTRUSION = 2, // Circle extrusion representation class (used for reinforcement bars)}struct Representation {    id: uint; // The index of the geometry in its corresponding array    bbox: BoundingBox; // The bounding box of the geometry    representation_class: RepresentationClass; // The class of the geometry (in which array it belongs: shells, circleExtrusions, etc.)}
```

For instance, a Fragments file with the following data: 👇🏻

```typescript
{  "meshes": {    "representations": [      {        "id": 0,        "representationClass": 1,        "bbox": {          "min": {"x": 0, "y": 0, "z": 0},          "max": {"x": 1, "y": 1, "z": 1},        }      },    ],    ...   },  ...}
```

🧐 Means that:

- There is 1 representation (geometry) in this model with a bounding box of 1x1x1.
- It's of type SHELL, so its geometry data is the element with index 0 in model.meshes.shells.

#### 🎨 Materials​

The list of unique materials in this model. Materials are defined by color, opacity, sidedness and line type (if any). Each material has the following structure: 🗼

```typescript
enum RenderedFaces:byte {    ONE = 0, // One rendered face    TWO = 1 // Two rendered faces}struct Material {    r: ubyte; // Red color value    g: ubyte; // Green color value    b: ubyte; // Blue color value    a: ubyte; // Alpha color value    rendered_faces: RenderedFaces; // Number of rendered faces    stroke: Stroke; // Line stroke type}
```

#### 🧵 Circle extrusions​

The list of geometries defined as a wire with a thickness. 🪡

We use this type of representation mainly for reinforcement bars, which are very computationally demanding and don't work well when represented as any other generic mesh. Using this specific geometry we can easily render dozens of thousands of rebars with ease.

Each circle extrusion has the following structure: 🗼

```typescript
enum AxisPartClass:byte {    NONE = 0, // No axis part class    WIRE = 1, // Straight line axis part class    WIRE_SET = 2, // Straight line set axis part class    CIRCLE_CURVE = 3 // Circular arc axis part class}struct Wire {    p1: FloatVector; // First point of the wire    p2: FloatVector; // Last point of the wire}table WireSet {    ps: [FloatVector]; // Ordered points of the wire set}struct CircleCurve {    aperture: float; // Angle of the arc    position: FloatVector; // Center of the arc    radius: float; // Radius of the arc    x_direction: FloatVector; // X axis of the arc    y_direction: FloatVector; // Y axis of the arc}table Axis {    wires: [Wire] (required); // Straight lines of the axis    order: [uint] (required); // Indices of the axis parts    parts: [AxisPartClass] (required); // Class of the axis parts    wire_sets: [WireSet] (required); // Straight line sets of the axis    circle_curves: [CircleCurve] (required); // Circular arcs of the axis}table CircleExtrusion {    radius: [double] (required); // Half of the thickness of the circle extrusion    axes: [Axis] (required); // Axes of the circle extrusion}
```

For instance, a Fragments file with the following data: 👇🏻

```typescript
{  "meshes": {    "representations": [      {        "id": 0,        "representationClass": 2,        "bbox": {          "min": {"x": 2.49, "y": 0.01, "z": 0.20},          "max": {"x": -2.49, "y": -0.01, "z": -0.20},        }      },    ],    "circleExtrusions": [      {        "radius": [0.01],        "axes": [          {            "wires": [              {                "p1": { "x": 2.48, "y": 0, "z": 0.09 },                "p2": { "x": 2.48, "y": 0, "z": -0.20 },              },              {                "p1": { "x": -2.39, "y": 4.22, "z": 0.19 },                "p2": { "x": 2.38, "y": 4.21, "z": 0.19 },              }            ],            "order": [0, 0, 1],            "parts": [1, 3, 1],            "wire_sets": [],            "circle_curves": [              {                "aperture": 1.57,                "position": { "x":  2.38, "y": 1.11, "z": 0.097 },                "radius": 0.09,                "x_direction": { "x": 0, "y": 1, "z": 0 },                "y_direction": { "x": 0, "y": 0, "z": 1 },              }            ],          }        ]      },    ],    ...   },  ...}
```

🧐 Means that:

- This model has a single representation that is an extrusion curve (probably a rebar).
- The rebar has a single axis made of 3 parts: 2 straight lines and 1 circular arc.
- The order of the parts is: line 0 - arc 0 - line 1 (looking at parts and order).

✍🏻 So, the conclusion is that it's a bar with a circular bend.

#### 🐚 Shells​

The list of geometries defined as face profiles and holes, similar to breps. Used for the vast majority of meshes. Each shell has the following structure: 🗼

```typescript
enum ShellType:byte {    NONE = 0, // Default shell type (less than 65535 points)    BIG = 1, // Big shell type (less than 4294967295 points)}table ShellHole {    indices: [ushort] (required); // Indices of the points of the hole    profile_id: ushort; // Index of the profile to which the hole belongs}table ShellProfile {    indices: [ushort] (required); // Indices of the points of the profile}table BigShellHole {    indices: [uint] (required); // Indices of the points of the hole    profile_id: ushort; // Index of the profile to which the hole belongs}table BigShellProfile {    indices: [uint] (required); // Indices of the points of the profile}table Shell {    profiles: [ShellProfile] (required); // Exterior profiles of the shell    holes: [ShellHole] (required); // Holes of the shell    points: [FloatVector] (required); // Points of the shell    big_profiles: [BigShellProfile] (required); // Exterior profiles of the shell (if the shell has more than 65535 points)    big_holes: [BigShellHole] (required); // Holes of the shell (if the shell has more than 65535 points)    type: ShellType; // Type of the shell (less than 65535 points or more than 65535 points)}
```

Shells can be of 2 types: default or big. Big shells consume more memory and are only used for shells with more than 65,535 points (which is the max ushort value). This way we have the way of both worlds: meshes that don't consume a lot of memory, while supporting certain big objects. Big shells are rare in BIM, being less than 1% of objects. ✨

For instance, a fragments file with the following data: 👇🏻

```typescript
{  "meshes": {    "representations": [      {        "id": 0,        "representationClass": 1,        "bbox": {          "min": {"x": 0, "y": 0, "z":0},          "max": {"x": 1, "y": 1, "z": 1},        }      },    ],    "shells": [      {        "type": 0,        "points": [          {"x": 0, "y": 0, "z":0},          {"x": 1, "y": 0, "z":0},          {"x": 0, "y": 1, "z":1},          {"x": 0, "y": 0, "z":1},          {"x": 0.25, "y": 0.25, "z":0.25},          {"x": 0.75, "y": 0.25, "z":0.25},          {"x": 0.25, "y": 0.75, "z":0.75},          {"x": 0.25, "y": 0.25, "z":0.75},        ],        "profiles": [          { "indices": [0, 1, 2, 3] },        ],        "holes": [          { "indices": [4, 5, 6, 7], "profileId": 0 },        ],        "bigProfiles": [],        "bigHoles": [],      },    ],    ...   },  ...}
```

🧐 Means that:

- This model has a single representation that is a shell.
- The shell has 8 points, 1 exterior profile and 1 hole.
- It's probably a square face with a square hole inside.

#### 🗺️📌 Local transforms​

A set of local transformations for geometry samples.

All samples require a local transformation. For samples that have no local transformation, we use a no-transform transformation: ➿

```typescript
{  "position": {"x": 0, "y": 0, "z": 0},  "xDirection": {"x": 1, "y": 0, "z": 0},  "yDirection": {"x": 0, "y": 1, "z": 0},}
```

#### 🌍📌 Global transforms​

A set of global transformations for geometry samples.

Each global transformation is assigned to an item local id by meshesItems. This means that:

- There can't be a global trasformation that is not assigned to an item.
- If an item has a geometry representation, it needs at least a global transform assigned to it via meshesItems. Remember that all items have local ids.
- Items without geometry representation don't have a global transform assigned to them.

🚀 So if you have a BIM model containing just one chair made of 3 geometry instances, then you will have at least 1 item (local id), 1 global transform assigned to it, and 3 samples assigned to that global transform. In fragments, a "BIM object" is just a set of geometry samples assigned to the same global transform (which means they are assigned to the same item / local id). This approach allows to reuse geometries, transforms and materials across items.

For instance, a fragments file with the following data: 👇🏻

```typescript
{  "localIds": [34, 35, 36],  "meshes": {    "meshesItems": [2, 0, 1],    "globalTransforms": [      {        "position": {"x": 0, "y": 0, "z": 0},        "xDirection": {"x": 1, "y": 0, "z": 0},        "yDirection": {"x": 0, "y": 1, "z": 0},      },      {        "position": {"x": 1, "y": 0, "z": 0},        "xDirection": {"x": 1, "y": 0, "z": 0},        "yDirection": {"x": 0, "y": 1, "z": 0},      },      {        "position": {"x": 0, "y": 0, "z": 1},        "xDirection": {"x": 1, "y": 0, "z": 0},        "yDirection": {"x": 0, "y": 1, "z": 0},      },    ],    ...   },  ...}
```

🧐 Means that:

- This model has 3 items.
- The 3 items have global transforms, so they likely have some geometry samples representing them.
- The first global transform is assigned to the item with local id 36.
- The second global transform is assigned to the item with local id 35.
- The third global transform is assigned to the item with local id 34.

### 🗞️🔥 Unique attributes​

An array of unique item attributes in this model. 📃

Yes, you might have noticed that Fragments have both attributes and uniqueAttributes. The reason is that some use cases require to get the full deduplicated list of attributes very fast, and this is why uniqueAttributes exists. This doesn't have a memory impact thanks to this. 🤯

### 🗞️ Attributes​

An array of item data stored as an array of arrays. Each attribute has the following structure: 🗼

```typescript
table Attribute {    data: [string] (required); // The attributes of an item, represented as an array of strings}
```

For instance, a fragments file with the following data: 👇🏻

```typescript
{  "localIds": [34, 35, 36],  "attributes": [    {      data: [        "["Name","Basic Wall 1","IFCLABEL"]",      ]    },    {      data: [        "["Name","Basic Wall 2","IFCLABEL"]",      ]    },    {      data: [        "["Name","Basic Wall 3","IFCLABEL"]",      ]    }  ],  ...}
```

🧐 Means that:

- This model has 3 items.
- The item with local id 34 has an attribute "Name" with value "Basic Wall 1".
- The item with local id 35 has an attribute "Name" with value "Basic Wall 2".
- The item with local id 36 has an attribute "Name" with value "Basic Wall 3".

All samples require an attributes entry. For samples that have no attributes (which is rare in BIM), we use an empty attributes entry: ➿

```typescript
{  "localIds": [34],  "attributes": [    {      data: []    },  ],  ...}
```

### 🫱🏻‍🫲🏻🏷️ Relations Names​

An array of relation identifiers in this model.

### 🫱🏻‍🫲🏻 Relations​

An array of relations between different items stored as arrays of arrays. We use this data structure for the same optimization reason as for attributes. Each relation has the following structure: 🗼

```typescript
table Relation {    data: [string] (required); // The relation of an item, represented as an array of strings}
```

### 🫱🏻‍🫲🏻➡️♟️ Relations Items​

An array that works as an indexation matching localIds indices with relations, similar to meshesItems. For instance, a fragments file with the following data:

```typescript
{  "localIds": [34, 35, 36],  "relationsItems": [1],  "relations": [    {      data: [        "["IsDecomposedBy", 34]",        "["IsDecomposedBy", 36]",      ]    },  ],  ...}
```

🧐 Means that:

- This model has 3 items.
- The item with local id 35 has 2 relations.
- The relations are with items 34 and 36 respectively and named "IsDecomposedBy".

### 🦋 Guid​

An global ID that identifies this model uniquely.

### 🌳 Spatial structure​

A tree representing the spatial hierarchy of elements. It has the following structure: 🗼

```typescript
table SpatialStructure {    local_id: uint = null; // Local id of the current spatial node    category: string; // Category of the current spatial node    children: [SpatialStructure]; // Child spatial nodes of the current spatial node}
```

As you can see, the structure is recursive, so you can build a whole tree with it. We use this structure to group items of the same category together, as shown in the example below. 🍱

For instance, a typical spatial tree can look like this:

```typescript
{  "localIds": [34, 35, 36],  "spatialStructure": {    "localId": null,    "category": "IFCPROJECT",    "children": [      {        "localId": 34,        "category": null,        "children": [          {            "localId": null,            "category": "IFCSITE",            "children": [              {                "localId": 35,                "category": null,                "children": [                  {                    "localId": null,                    "category": "IFCBUILDINGSTOREY",                    "children": [                      {                        "localId": 36,                        "category": null,                        "children": []                      }                    ]                  }                ]              }            ]          }        ]      }    ],    ...  }}
```

🧐 Means that:

- This model has 3 items.
- Their categories are IFCPROJECT, IFCSITE and IFCBUILDINGSTOREY respectively.
- They form a spatial tree where 36 is a child of 35, which is a child of 34.

:::


---

# MODULE: 🦾 Building your own exporter/importer
**URL:** https://docs.thatopen.com/fragments/custom-building

- 
- 🔥 Fragments
- 🦾 Building your own exporter/importer

# 🦾 Building your own exporter/importer

## 🎯 Introduction​

Fragments is built on top of Flatbuffers, which allow to create binary formats that are compatible with over 15 programming languages. In a nutshell, this is what you can do: 👇🏻

- 🌝 You can automatically create a fragments importer / exporter, allowing you to read / write Fragments files created by you, by us or by other developers.
- 🌚 You can't have our powerful 3D viewer / BIM tools in your programming language, because we created all that in JavaScript / TypeScript. That said, JavaScript / TypeScript is one of the most flexible stacks nowadays, so if you want our 3D technology, there's a good chance you can embed it in your app.

🌝 You can automatically create a fragments importer / exporter, allowing you to read / write Fragments files created by you, by us or by other developers.

🌚 You can't have our powerful 3D viewer / BIM tools in your programming language, because we created all that in JavaScript / TypeScript. That said, JavaScript / TypeScript is one of the most flexible stacks nowadays, so if you want our 3D technology, there's a good chance you can embed it in your app.

That said, let's get started! 🚀

## ✍🏻 Creating a Fragments exporter/importer​

To create your own Fragments exporter / importer you just need to do 3 things:

- 📃 Download the Fragments schema file, which you can find here.
- 🤖 Download the flatbuffers executable file from their official release page.
- ▶️ Execute the flatbuffers executable using a terminal (e.g. VS Code terminal) passing the path of the .fbs file and the language you want to work with. You can find an example for each supported language here.

📃 Download the Fragments schema file, which you can find here.

🤖 Download the flatbuffers executable file from their official release page.

▶️ Execute the flatbuffers executable using a terminal (e.g. VS Code terminal) passing the path of the .fbs file and the language you want to work with. You can find an example for each supported language here.

If you did everything right, you should now have your own Fragment importer / exporter in your programming language. In short: you can start reading and writting fragments! We'll give you some pointers to do this in the following points. 🥳

If you use a low level programming language like C, C++ or Rust, flatbuffers will feel like home. Feel free to skip this section. But if you use a flexible programming language like Python or JavaScript, flatbuffers may be a bit weird for you. 👀

The main reason is because flatbuffers are very strict when reading and creating files. In languages like JavaScript or Python you can declare objects or arrays and then extend or shrink them at will, twist variable types as you like and pretty much do anything you can think of. Flatbuffers are strict and rigid. You really have to stick to their data types and follow their rules to make them work. But hey, in exchange for this strictness, you'll get blazing speed! 🚀🚀🚀

### ⬇️ Importing Fragments​

The very first thing you should to to familiarize yourself with Fragments and flatbuffers is reading an existing fragments file. You can find some in our repositories, but our recommendation is that you download the simple wall from the schema example (just press the wall button and then the download button). You can also load your own IFC file there to get its fragment file and download it. 🏃🏻‍♂️

Keep in mind that some of the .frag files we have in our repositories are compressed. If you have troubles reading them, you can try unzipping them first. If you still have issues, don't hesitate to ask us in the community.

Now you can follow the flatbuffers reading tutorial (in your programming language) to read the file and traverse all the information inside it. If you do it well, you should be able to see the same things that you see in the schema live example. 🚀

### ↗️ Exporting Fragments​

Once you are able to read a fragments file successfully and have familiarized yourself with the flatbuffers API, you should be ready to export your own fragments files. To do this, you'll need to study and understand the schema if you haven't already, as well as the flatbuffers docs for exporting. 📚

As a reference you can check out our IFC - Fragment exporter in typescript. It has quite a number of pieces because extracting the data from IFC is not easy, but if you pay close attention to this file for geometry, this file for properties and this file to build the model with the other 2, you'll get the feeling of exporting with flatbuffers. 🧑🏻‍💻

We might make more examples in the future, but this should be enough to build your exporter! 👏🏻


---

# MODULE: Components
**URL:** https://docs.thatopen.com/Tutorials/Components/

- 
- 👩🏻‍🏫 Tutorials
- Components

# Components

TOC
|
documentation
|
demo
|
community
|
npm package

TOC
|
documentation
|
demo
|
community
|
npm package

# Open BIM Components

This library is a collection of BIM tools based on Three.js and other libraries. It includes pre-made features to easily build browser-based 3D BIM applications, such as postproduction, dimensions, floorplan navigation, DXF export and much more.

## 🤝 Want our help?​

Are you developing a project with our technology and would like our help?
Apply now to join That Open Accelerator Program!

## Packages​

This library contains 2 packages:

@thatopen/components - The core functionality. Compatible both with browser and Node.js environments.

@thatopen/components-front - Features exclusive for browser environments.

## Usage​

You need to be familiar with Three.js API to be able to use this library effectively. In the following example, we will create a cube in a 3D scene that can be navigated with the mouse or touch events. You can see the full example here and the deployed app here.

```typescript
/* eslint import/no-extraneous-dependencies: 0 */import * as THREE from "three";import * as OBC from "../..";const container = document.getElementById("container")!;const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.SimpleCamera(components);components.init();const material = new THREE.MeshLambertMaterial({ color: "#6528D7" });const geometry = new THREE.BoxGeometry();const cube = new THREE.Mesh(geometry, material);world.scene.three.add(cube);world.scene.setup();world.camera.controls.setLookAt(3, 3, 3, 0, 0, 0);
```

## 🤝 Contributing​

Thinking of sending a PR? Awesome! Please read our contributing guide first — it covers the code conventions we follow (JSDoc, examples, resources, etc.) so your changes sail through review.


---

# MODULE: BCFTopics
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/BCFTopics

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- BCFTopics

# BCFTopics

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 👌 Communicating The Right Way​

BIM teams need to communicate issues, clashes, and design questions in a way that other tools can read and respond to — emails and PDFs break that chain because they're disconnected from the model.
BCF is the open standard for this: a topic bundles an issue's metadata, comments, and links to viewpoints so any BCF-compatible tool can open and continue the conversation.
This tutorial covers configuring the component with a signed-in author, custom topic types, statuses, and users; creating a topic with full metadata (title, description, due date, type, priority, stage, labels, assignee); auto-creating a viewpoint and linking it to every new topic via an event; adding and editing comments; updating topic properties with the set() method to trigger reactive UI events; exporting topics to a .bcf file; and importing an existing .bcf file (versions 2.1 and 3.0).
By the end, you'll have a complete BCF issue management pipeline that can exchange files with any BCF-compatible BIM tool.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(68, 23, -8.5, 21.5, -5.5, 23);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = ["https://thatopen.github.io/engine_components/resources/frags/school_arq.frag"];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using The BCFTopics Component​

Let's enable your app to handle BCF files effortlessly. BCF files are compressed archives (zip) containing folders, each representing a topic. Topics are communications within a project, such as design issues, progress updates, or information requests. They include metadata like title, description, status, assignee, stage, comments, and some more.

BCF files also contain viewpoints, which store camera positions, targets, and references to IFC model entities via GUIDs. Viewpoints are linked to topics, but a topic can exist without a viewpoint, while a viewpoint must belong to a topic.

In That Open Engine, you can create topics and viewpoints independently, then link them as needed. This tutorial focuses on topics. To get started, create an instance of the topics component:

```typescript
const bcfTopics = components.get(OBC.BCFTopics);bcfTopics.setup({  author: "signed.user@mail.com", // This will be the mail used in all topics created  types: new Set([...bcfTopics.config.types, "Information", "Coordination"]),  statuses: new Set(["Active", "In Progress", "Done", "In Review", "Closed"]),  users: new Set(["juan.hoyos4@gmail.com"]),  version: "3",});
```

The component supports callbacks for topic creation, deletion, and updates. Here's an example of creating a new viewpoint whenever a topic is created:

```typescript
const viewpoints = components.get(OBC.Viewpoints);bcfTopics.list.onItemSet.add(async ({ value: topic }) => {  const viewpoint = viewpoints.create();  viewpoint.world = world;  // Topics include references to the viewpoints.  // The reference is made using the viewpoint GUID instead of the whole viewpoint object.  // This prevents having possible memory leaks.  topic.viewpoints.add(viewpoint.guid);  // Comments can be optionally related to viewpoints.  // In this case, each time a comment is added the default viewpoint is used on it.  topic.comments.onItemSet.add(({ value: comment }) => {    comment.viewpoint = viewpoint.guid;  });});
```

For more details on viewpoints, check the dedicated tutorial.

### 📡 Creating Topics​

With the component set up, let's create a topic. While you can instantiate a Topic directly, it's best to use the BCFTopics component. This ensures the topic is tracked and accessible later. Here's how to create a topic:

```typescript
const topic = bcfTopics.create({  title: "Missing information",  description: "It seems these elements are badly defined.",  dueDate: new Date("08-01-2020"),  type: "Clash",  priority: "Major",  stage: "Design",  labels: new Set(["Architecture", "Cost Estimation"]),  assignedTo: "juan.hoyos@thatopen.com",});
```

By BCF standards, topics must include a guid, type, status, title, creationDate, and creationAuthor. However, when creating a topic, all parameters are optional because default values are preconfigured. You can customize these defaults, including additional properties, to better suit your app. Here's how:

```typescript
// Only topics creater after this will be affected.// creationDate is excluded as is taken from the current date.// creationAuthor is excluded as is taken from BCFTopics.config.author// guid is excluded as its set internally by the class.OBC.Topic.default = {  title: "Custom Default Title",  type: "Custom Default Topic Type",  status: "Custom Default Topic Status",  priority: "Custom Default Priority", // this is optional};
```

One of the most common things in topics is to create comments. You can do it very easily like this:

```typescript
const firstComment = topic.createComment(  "What if we talk about this next meeting?",);const secondComment = topic.createComment("Hi there! I agree.");
```

Comments automatically set the author and creationDate based on BCFTopics.config.author and the current date.

### 🔄 Editing Topics​

Topics are editable like regular classes. Direct property updates won't trigger events, but using the set method will. Here's an example of listening for topic updates:

```typescript
bcfTopics.list.onItemUpdated.add(({ value: topic }) => {  console.log(`Topic ${topic.title} was updated!`);});// This updates the information, but doesn't trigger any update.topic.title = "Updated Title";// This updates the information, but also triggers updates listened by the UI in `@thatopen/ui`topic.set({ title: "New Title" });topic.comments.onItemUpdated.add(({ value: comment }) => {  console.log("The following comment has been updated:", comment);});// When you update a comment, it triggers an event you can listen in topic.comments.onItemUpdatedfirstComment.comment =  "What if we talk about this next meeting with all partners?";secondComment.comment = "Will tell you tomorrow when is more convenient!";
```

### ⏬ Exporting BCF Files​

A robust BCF system is incomplete without the ability to export files for use in other BIM applications. Here's a simple function to export BCF files:

```typescript
const exportBCF = async () => {  // You can indicate which topics to export. All are exported by default  const bcf = await bcfTopics.export();  // You must set the extension by yourself. The export just gives the binary data.  const bcfFile = new File([bcf], "topics.bcf");  const a = document.createElement("a");  a.href = URL.createObjectURL(bcfFile);  a.download = bcfFile.name;  a.click();  URL.revokeObjectURL(a.href);};
```

### ⏫ Importing BCF Files​

The BCFTopics component allows importing valid BCF files (versions 2.1/3.0). Here's a simple implementation:

```typescript
const loadBCF = () => {  const input = document.createElement("input");  input.multiple = false;  input.accept = ".bcf";  input.type = "file";  input.addEventListener("change", async () => {    const file = input.files?.[0];    if (!file) return;    const buffer = await file.arrayBuffer();    const { topics, viewpoints } = await bcfTopics.load(new Uint8Array(buffer));    console.log(topics, viewpoints);  });  input.click();};
```

Uploading a BCF file creates corresponding topics and their associated viewpoints. For more details on viewpoints, refer to the dedicated tutorial.

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
const panel = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`    <bim-panel active label="BCFTopics Tutorial" class="options-menu">      <bim-panel-section label="Info">        <bim-label style="width: 14rem; white-space: normal;">💡 To fully experience this tutorial, open your browser console!</bim-label>       </bim-panel-section>      <bim-panel-section label="Controls">        <bim-button @click=${exportBCF} label="Export BCF"></bim-button>         <bim-button @click=${loadBCF} label="Load BCF"></bim-button>      </bim-panel-section>    </bim-panel>  `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to create, edit, import, and export BCF files, as well as manage topics effectively. Congratulations! Keep going with more tutorials in the documentation.


---

# MODULE: BoundingBoxer
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/BoundingBoxer

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- BoundingBoxer

# BoundingBoxer

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📄 Playing with Boxes​

Fitting the camera to a model, centering a view on a category of elements, or computing the overall extent of a scene all require knowing where objects are in 3D space. Doing that geometry by hand for large BIM models is impractical. The BoundingBoxer computes axis-aligned bounding boxes for any set of elements in one call, whether that's all loaded models or a filtered selection.
This tutorial covers computing the merged bounding box of all loaded models, computing a bounding box for elements filtered by category, fitting the camera to either result, setting the camera to standard orientations (top, front, left, etc.), and visualizing bounding boxes with Three.js helpers. By the end, you'll have a set of spatial utilities ready to power camera fitting and element focusing in any BIM application.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",  "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using The Bounding Boxer Component​

Now that our setup is done, lets see how you can create the bounding boxes of the model. BIM models are complex, but don't worry: creating the bounding boxes is a piece of cake thanks to the BoundingBoxer. First, get an instance of the component:

```typescript
const boxer = components.get(OBC.BoundingBoxer);
```

Next, it's just a matter of adding items, entire models, or previously computed boxes to the component so the merged bounding boxes can be calculated. To keep it simple, let's create a function that retrieves the merged bounding box of all loaded models:

```typescript
const getLoadedModelsBoundings = () => {  // As a good practice, always clean up the boxer list first  // so no previous boxes added are taken into account  boxer.list.clear();  boxer.addFromModels();  // This computes the merged box of the list.  const box = boxer.get();  // As a good practice, always clean up the boxer list after the calculation  boxer.list.clear();  return box;};
```

While knowing the overall bounding box of the entire context is useful, it is often more practical to determine the bounding box of a specific collection of elements. For instance, this can be used to focus the camera on those elements for a close-up view. Let's dive in and create a function that, given a category, get the elements boundings in the architectural model.

```typescript
const getByCategory = async (category: string) => {  const arqId = [...fragments.list.keys()].find((modelId) =>    /arq/.test(modelId),  );  if (!arqId) return null;  const model = fragments.list.get(arqId);  if (!model) return null;  const items = await model.getItemsOfCategories([new RegExp(`^${category}$`)]);  const localIds = Object.values(items).flat();  // As elements from categories are dispersed around the whole model  // the camera fit based on the boundings will be very imperceptible.  // For this reason, we will take the first element of the category  // so its easier to see the result  const effectiveIds = localIds.slice(0, 1);  // An OBC.ModelIdMap represents selections within the engine.  // Here, we are defining a selection for the architectural model  // that includes all items belonging to the specified category.  const modelIdMap: OBC.ModelIdMap = { [arqId]: new Set(effectiveIds) };  boxer.list.clear();  await boxer.addFromModelIdMap(modelIdMap);  const box = boxer.get();  boxer.list.clear();  return box;};
```

Adding bounding boxes from a ModelIdMap (selections in That Open Engine) becomes very powerful when combined with other components, such as the ItemsFinder. Check out the tutorial for that component!

### 🛠️ Other Bounding Boxer Utilities​

Bounding boxes are incredibly versatile and, when used correctly, can be adapted to various workflows. One convenient use case is moving the camera to view the scene from specific angles, such as the bottom, top, left, right, front, or back of the entire viewer context. This operation is commonly combined with a view cube. The bounding boxer includes a built-in method that provides the necessary camera information to set the view perfectly. Here's how you can do it:

```typescript
const viewFromOrientation = async (  orientation: "front" | "back" | "left" | "right" | "top" | "bottom",) => {  const camera = world.camera;  if (!camera.hasCameraControls()) return;  const { position, target } = await boxer.getCameraOrientation(orientation);  await camera.controls.setLookAt(    position.x,    position.y,    position.z,    target.x,    target.y,    target.z,    true,  );};
```

### 📐 Bounding Helpers​

Visualizing the bounding box can often be very helpful. Fortunately, ThreeJS provides a convenient helper for this purpose. Let's create a function to generate a helper for a given bounding box:

```typescript
let helpers: THREE.Box3Helper[] = [];const createBoxHelper = (box: THREE.Box3) => {  const helper = new THREE.Box3Helper(box);  world.scene.three.add(helper);  helpers.push(helper);};const disposeHelpers = () => {  const disposer = components.get(OBC.Disposer);  for (const helper of helpers) {    disposer.destroy(helper);  }  helpers = [];};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
const panel = BUI.Component.create<BUI.PanelSection>(() => {  let categoriesDropdown: BUI.Dropdown | undefined;  let orientationsDropdown: BUI.Dropdown | undefined;  const onFitModels = ({ target }: { target: BUI.Button }) => {    target.loading = true;    const box = getLoadedModelsBoundings();    const sphere = new THREE.Sphere();    box.getBoundingSphere(sphere);    world.camera.controls.fitToSphere(sphere, true);    target.loading = false;  };  const onAddModelsHelper = () => {    const box = getLoadedModelsBoundings();    createBoxHelper(box);  };  const onAddCategoryHelper = async ({ target }: { target: BUI.Button }) => {    if (!categoriesDropdown) return;    target.loading = true;    const [category] = categoriesDropdown.value;    const box = await getByCategory(category);    if (!box) {      target.loading = false;      return;    }    createBoxHelper(box);    target.loading = false;  };  const onCategoriesDropdownCreated = async (e?: Element) => {    if (!e) return;    const arqId = [...fragments.list.keys()].find((modelId) =>      /arq/.test(modelId),    );    if (!arqId) return;    const model = fragments.list.get(arqId);    if (!model) return;    const dropdown = e as BUI.Dropdown;    categoriesDropdown = dropdown;    dropdown.innerHTML = "";    const modelCategories = await model.getItemsWithGeometryCategories();    for (const [index, category] of modelCategories.entries()) {      const option = BUI.Component.create(        () =>          BUI.html`<bim-option ?checked=${index === 0} label=${category}></bim-option>`,      );      dropdown.append(option);    }  };  const onFitCategoryItem = async ({ target }: { target: BUI.Button }) => {    if (!categoriesDropdown) return;    target.loading = true;    const [category] = categoriesDropdown.value;    const box = await getByCategory(category);    if (!box) {      target.loading = false;      return;    }    const sphere = new THREE.Sphere();    box.getBoundingSphere(sphere);    world.camera.controls.fitToSphere(sphere, true);    target.loading = false;  };  const onDisposeHelpers = () => {    disposeHelpers();  };  const onOrientationsDropdownCreated = (e?: Element) => {    if (!e) return;    orientationsDropdown = e as BUI.Dropdown;  };  const onSetOrientation = async ({ target }: { target: BUI.Button }) => {    if (!orientationsDropdown) return;    target.loading = true;    const [orientation] = orientationsDropdown.value;    await viewFromOrientation(orientation);    target.loading = false;  };  return BUI.html`    <bim-panel active label="Bounding Boxer Tutorial" class="options-menu">      <bim-panel-section label="General">        <bim-label style="width: 15rem; white-space: normal;">Get rid of all helpers created, to prevent memory leaks.</bim-label>        <bim-button label="Dispose Helpers" @click=${onDisposeHelpers}></bim-button>      </bim-panel-section>      <bim-panel-section label="By Models">        <bim-button label="Fit Models" @click=${onFitModels}></bim-button>        <bim-button label="Add Helper" @click=${onAddModelsHelper}></bim-button>      </bim-panel-section>      <bim-panel-section label="By Categories">        <bim-label style="width: 15rem; white-space: normal;">As elements from categories are dispersed around the whole model, the camera fit will take the first element of the category so its easier to see the result.</bim-label>        <bim-dropdown ${BUI.ref(onCategoriesDropdownCreated)} required></bim-dropdown>        <bim-button label="Fit Category Item" @click=${onFitCategoryItem}></bim-button>        <bim-button label="Add Helper" @click=${onAddCategoryHelper}></bim-button>      </bim-panel-section>      <bim-panel-section label="Orientation">        <bim-label style="width: 15rem; white-space: normal;">Please, be aware there may be some discrepancies between Back, Front, Left and Right because of how the model was created in the authoring software.</bim-label>        <bim-dropdown ${BUI.ref(onOrientationsDropdownCreated)} required>          <bim-option label="Back" value="back"></bim-option>          <bim-option label="Left" value="left"></bim-option>          <bim-option label="Right" value="right"></bim-option>          <bim-option label="Top" value="top"></bim-option>          <bim-option label="Bottom" value="bottom"></bim-option>        </bim-dropdown>        <bim-button label="Set Camera Orientation" @click=${onSetOrientation}></bim-button>      </bim-panel-section>    </bim-panel>  `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to:

- Compute and visualize bounding boxes for entire models or specific selections.
- Use bounding boxes to adjust camera views dynamically.
Congratulations! Keep going with more tutorials in the documentation.


---

# MODULE: Classifier
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/Classifier

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- Classifier

# Classifier

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📄 Making Items Groupings​

Isolating all walls on a specific floor, highlighting every element in a room, or letting users browse the model by discipline all require grouping elements by some criteria. Without a classification system, that means writing custom queries and managing element sets manually for every feature. The Classifier centralizes that logic into named groups that can combine fixed element lists with live queries — and update automatically when new models load.
This tutorial covers creating a custom classification group with static elements (specific slabs added programmatically), adding a dynamic query to that same group (first floor walls), using the built-in classifiers to group all elements by category and by building storey, and isolating any group's elements with one click from a UI panel. By the end, you'll have a flexible classification system ready to drive visibility, selection, and filtering features in any BIM application.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",  "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using The Classifier Component​

The classifier component is straightforward to use. Groups can be static, dynamic, or combined. Static groups consist of a fixed set of elements that you specify, while dynamic groups use queries to define the elements within the group. Combined groups, on the other hand, includes both static and dynamic elements. To begin, let's obtain an instance of the component:

```typescript
const classifier = components.get(OBC.Classifier);
```

The most common use case for static groups is to allow users to manually assign selected elements to a group. However, for demonstration purposes, let's add some elements programmatically. Let's start by creating a group:

```typescript
const classificationName = "Custom Classification";const groupName = "My Group";classifier.getGroupData("Custom Classification", "My Group");
```

To replicate the functionality of adding static elements, let's programmatically include the first two slabs from each model. After retrieving these elements, we can add them to the group.

```typescript
const slabsModelIdMap: OBC.ModelIdMap = {};for (const [modelId, model] of fragments.list) {  const items = await model.getItemsOfCategories([/SLAB/]);  const localIds = Object.values(items).flat().slice(0, 2);  slabsModelIdMap[modelId] = new Set(localIds);}classifier.addGroupItems(classificationName, groupName, slabsModelIdMap);
```

You don't need to worry about making the Classifier component work with multiple models; it handles this automatically (as do all other components) using the modelIdMap.

### 🧩 Adding Dynamic Items​

While adding static items to classifier groups is useful, the component truly shines when you define queries to assign items dynamically. This is an advanced feature because if you load additional models after the dynamic group has been set, it will automatically update with the new items. To do it, let's first configure some simple query using the corresponding component:

```typescript
const finder = components.get(OBC.ItemsFinder);const queryName = "First Floor Walls";finder.create("First Floor Walls", [  {    categories: [/WALL/],    relation: {      name: "ContainedInStructure",      query: {        categories: [/STOREY/],        attributes: { queries: [{ name: /Name/, value: /01/ }] },      },    },  },]);
```

For more information about the query system in the engine, please refer to the Items Finder tutorial in the documentation.

Once the query has been set, it is just a matter of adding it to the group:

```typescript
classifier.setGroupQuery(classificationName, groupName, {  name: queryName,});
```

From this point forward, when we get the items from the classifier group we have created, the result will include the combination of the static items (the first two slabs of each model) plus all the dynamic items (all the walls in the first floor of each model).

### 🏷️ Built-in Ways to Classify​

While is very convinient to do custom groupings based on static and dynamic items, the classifier comes with some methods to classify the model in the most common ways: by category, levels and models. Let's do it as follows:

```typescript
const addDefaultGroupings = async () => {  await classifier.byCategory();  await classifier.byIfcBuildingStorey({ classificationName: "Levels" });};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
type GroupsTableData = {  Classification: string;  Name: string;  Actions: string;};interface GroupsTableState {  components: OBC.Components;}const groupsTableTemplate = (_state: GroupsTableState) => {  const onCreated = (e?: Element) => {    if (!e) return;    const table = e as BUI.Table<GroupsTableData>;    table.loadFunction = async () => {      const data: BUI.TableGroupData<GroupsTableData>[] = [];      for (const [classification, groups] of classifier.list) {        for (const [name] of groups) {          data.push({            data: { Name: name, Classification: classification, Actions: "" },          });        }      }      return data;    };    table.loadData(true);  };  return BUI.html`    <bim-table ${BUI.ref(onCreated)}></bim-table>  `;};const [groupsTable, updateTable] = BUI.Component.create<  BUI.Table<GroupsTableData>,  GroupsTableState>(groupsTableTemplate, {  components,});groupsTable.style.maxHeight = "25rem";groupsTable.hiddenColumns = ["Classification"];groupsTable.columns = ["Name", { name: "Actions", width: "auto" }];groupsTable.noIndentation = true;groupsTable.headersHidden = true;groupsTable.dataTransform = {  Actions: (_, rowData) => {    const { Name, Classification } = rowData;    if (!(Name && Classification)) return _;    const classification = classifier.list.get(Classification);    if (!classification) return _;    const groupData = classification.get(Name);    if (!groupData) return _;    const hider = components.get(OBC.Hider);    const onClick = async ({ target }: { target: BUI.Button }) => {      target.loading = true;      const modelIdMap = await groupData.get();      await hider.isolate(modelIdMap);      target.loading = false;    };    return BUI.html`<bim-button icon="solar:cursor-bold" @click=${onClick}></bim-button>`;  },};classifier.list.onItemSet.add(() => setTimeout(() => updateTable()));const panel = BUI.Component.create<BUI.PanelSection>(() => {  const onResetVisibility = async ({ target }: { target: BUI.Button }) => {    target.loading = true;    const hider = components.get(OBC.Hider);    await hider.set(true);    target.loading = false;  };  const onAddDefaults = async () => {    await addDefaultGroupings();  };  return BUI.html`    <bim-panel active label="Classifier Tutorial" class="options-menu">      <bim-panel-section style="min-width: 14rem" label="General">        <bim-button label="Reset Visibility" @click=${onResetVisibility}></bim-button>      </bim-panel-section>      <bim-panel-section label="Groupings">        <bim-button label="Add Defaults" @click=${onAddDefaults}></bim-button>        ${groupsTable}      </bim-panel-section>    </bim-panel>  `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to classify your BIM models using static and dynamic groups. Congratulations! Keep going with more tutorials in the documentation.


---

# MODULE: Clipper
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/Clipper

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- Clipper

# Clipper

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## ✂️ Cutting Models​

Inspecting the interior of a BIM model — checking wall thicknesses, MEP routing, or structural connections — is impossible when geometry blocks the view. Clipping planes solve this by cutting through the model along any surface, revealing exactly what's inside.
This tutorial covers creating clipping planes on double click, deleting them individually or all at once, toggling them on and off, and customizing their color, opacity and size. By the end, you'll have a fully working clipping tool ready to drop into any BIM application.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(68, 23, -8.5, 21.5, -5.5, 23);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = ["https://thatopen.github.io/engine_components/resources/frags/school_arq.frag"];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using The Clipper Component​

Now comes the exciting part! We will add a Simple Clipper to our scene. While you can instantiate it directly, it's recommended to use the components.get(OBC.Clipper) method to retrieve it. All components are designed to function as singletons within a components instance, and using this approach ensures proper singleton behavior.

```typescript
// Initialize the Raycaster for the world to track mouse position for clipping planes.const casters = components.get(OBC.Raycasters);casters.get(world);const clipper = components.get(OBC.Clipper);clipper.enabled = true;
```

Now, we want a way to create a clipping plane on demand. You can do it with a Single Click or Double Click of a mouse. For this tutorial, we will use Double Click. This will cast a ray from the mouse position to the scene and check if the ray intersects with any of the 3D objects. If it does, it will create a new clipping plane in the point of intersection.

```typescript
container.ondblclick = () => {  if (clipper.enabled) {    clipper.create(world);  }};
```

We can also easily toggle the clipping planes' enabled state, allowing them to either cut or not cut the model, depending on the specific requirements of your application.

```typescript
const toggleClippings = () => {  for (const [, clipping] of clipper.list) {    clipping.enabled = !clipping.enabled;  }};
```

The Raycaster is used to detect intersections within the scene. When the clipper detects a face under the mouse click, it places a clipping plane at the point of intersection. 😎

### 🧹 Deleting Clipping Planes​

Now that we know how to create multiple clipping planes, it's equally important to understand how to delete them when needed. Clipping planes can be removed using clipper.delete(world) (which deletes the first plane detected under the mouse using the Raycaster in the specified world) or clipper.delete(world, plane) (which deletes a specific clipping plane).

```typescript
window.onkeydown = (event) => {  if (event.code === "Delete" || event.code === "Backspace") {    if (clipper.enabled) clipper.delete(world);  }};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
const panel = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`    <bim-panel active label="Clipper Tutorial" class="options-menu">      <bim-panel-section label="Commands">        <bim-label>Double click: Create clipping plane</bim-label>        <bim-label>Delete key: Delete clipping plane</bim-label>      </bim-panel-section>      <bim-panel-section label="Controls">        <bim-checkbox label="Component Enabled" checked           @change="${({ target }: { target: BUI.Checkbox }) => {            clipper.config.enabled = target.value;          }}">        </bim-checkbox>                <bim-checkbox label="Clipper Visible" checked           @change="${({ target }: { target: BUI.Checkbox }) => {            clipper.config.visible = target.value;          }}">        </bim-checkbox>              <bim-color-input           label="Planes Color" color="#202932"           @input="${({ target }: { target: BUI.ColorInput }) => {            clipper.config.color = new THREE.Color(target.color);          }}">        </bim-color-input>                <bim-number-input           slider step="0.01" label="Planes Opacity" value="0.2" min="0.1" max="1"          @change="${({ target }: { target: BUI.NumberInput }) => {            clipper.config.opacity = target.value;          }}">        </bim-number-input>                <bim-number-input          slider step="0.1" label="Planes Size" value="5" min="2" max="10"          @change="${({ target }: { target: BUI.NumberInput }) => {            clipper.config.size = target.value;          }}">        </bim-number-input>        <bim-checkbox label="Auto Scale Planes" checked          @change="${({ target }: { target: BUI.Checkbox }) => {            clipper.autoScalePlanes = target.value;            for (const [, plane] of clipper.list) {              plane.autoScale = target.value;              if (!target.value) {                plane.size = clipper.size;              }            }          }}">        </bim-checkbox>        <bim-button           label="Toggle Clippings"           @click=${toggleClippings}>          </bim-button>                       <bim-button           label="Delete All"           @click="${() => {            clipper.deleteAll();          }}">          </bim-button>                     </bim-panel-section>    </bim-panel>  `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to create and manipulate clipping planes, toggle their visibility, and delete them as needed. Congratulations! Keep exploring more tutorials in the documentation to enhance your skills further.


---

# MODULE: EdgeProjector
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/EdgeProjector

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- EdgeProjector

# EdgeProjector

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📐 2D Edge Projections​

Technical drawings and floor plans require 2D line work derived from 3D model geometry — but extracting clean edges from a BIM model manually is complex and slow. The EdgeProjector automates this by computing visible and hidden edge projections from any direction, turning 3D model geometry into the line segments needed for plans, sections, and elevations.
This tutorial covers projecting all model items from any standard orientation (top, front, left, etc.), projecting only a filtered subset by category, controlling near and far clipping planes to isolate specific floors or sections, adjusting the angle threshold for edge detection, and toggling hidden line visibility. By the end, you'll have a configurable 2D projection tool ready to feed technical drawings with accurate line work from any BIM model.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene:

```typescript
const fragPaths = ["https://thatopen.github.io/engine_components/resources/frags/school_arq.frag"];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using the Edge Projector Component​

Now let's use the EdgeProjector to generate 2D edge projections from model items. First, get an instance of the component:

```typescript
const edgeProjector = components.get(OBC.EdgeProjector);
```

The EdgeProjector wraps the three-edge-projection library. You can configure its underlying generator settings:

```typescript
edgeProjector.generator.angleThreshold = 50;// Compute model bounding box for plane helpers and slider rangesconst boxer = components.get(OBC.BoundingBoxer);boxer.list.clear();boxer.addFromModels();const modelBox = boxer.get();boxer.list.clear();const modelSize = new THREE.Vector3();modelBox.getSize(modelSize);const modelCenter = new THREE.Vector3();modelBox.getCenter(modelCenter);// Orientation presetsconst orientations: Record<  string,  { direction: THREE.Vector3; up: THREE.Vector3 }> = {  "Top (Plan)": {    direction: new THREE.Vector3(0, -1, 0),    up: new THREE.Vector3(0, 0, -1),  },  Front: {    direction: new THREE.Vector3(0, 0, -1),    up: new THREE.Vector3(0, 1, 0),  },  Back: {    direction: new THREE.Vector3(0, 0, 1),    up: new THREE.Vector3(0, 1, 0),  },  Left: {    direction: new THREE.Vector3(-1, 0, 0),    up: new THREE.Vector3(0, 1, 0),  },  Right: {    direction: new THREE.Vector3(1, 0, 0),    up: new THREE.Vector3(0, 1, 0),  },};// Get the model extent along a direction (returns { min, max } as signed distances from center)const getExtentAlongDirection = (dir: THREE.Vector3) => {  const corners = [    new THREE.Vector3(modelBox.min.x, modelBox.min.y, modelBox.min.z),    new THREE.Vector3(modelBox.max.x, modelBox.min.y, modelBox.min.z),    new THREE.Vector3(modelBox.min.x, modelBox.max.y, modelBox.min.z),    new THREE.Vector3(modelBox.max.x, modelBox.max.y, modelBox.min.z),    new THREE.Vector3(modelBox.min.x, modelBox.min.y, modelBox.max.z),    new THREE.Vector3(modelBox.max.x, modelBox.min.y, modelBox.max.z),    new THREE.Vector3(modelBox.min.x, modelBox.max.y, modelBox.max.z),    new THREE.Vector3(modelBox.max.x, modelBox.max.y, modelBox.max.z),  ];  let minD = Infinity;  let maxD = -Infinity;  for (const c of corners) {    const d = c.dot(dir);    if (d < minD) minD = d;    if (d > maxD) maxD = d;  }  return { min: minD, max: maxD };};// Get the plane size perpendicular to a directionconst getPlaneSizeForDirection = (dir: THREE.Vector3) => {  const absDir = new THREE.Vector3(    Math.abs(dir.x),    Math.abs(dir.y),    Math.abs(dir.z),  );  // The plane size is the extent in the two axes perpendicular to the direction  if (absDir.y > 0.9) return Math.max(modelSize.x, modelSize.z) * 1.2;  if (absDir.x > 0.9) return Math.max(modelSize.y, modelSize.z) * 1.2;  return Math.max(modelSize.x, modelSize.y) * 1.2;};// Current orientation statelet currentOrientation = "Top (Plan)";let currentExtent = getExtentAlongDirection(  edgeProjector.projectionDirection.clone().negate(),);// Initialize near/far to model bounds along current directionedgeProjector.nearPlane = currentExtent.min;edgeProjector.farPlane = currentExtent.max;// Visual clip plane helpers — oriented perpendicular to projection directionconst clipPlaneMat = (color: number) =>  new THREE.MeshBasicMaterial({    color,    transparent: true,    opacity: 0.15,    side: THREE.DoubleSide,    depthWrite: false,  });let planeSize = getPlaneSizeForDirection(edgeProjector.projectionDirection);const nearPlaneHelper = new THREE.Mesh(  new THREE.PlaneGeometry(planeSize, planeSize),  clipPlaneMat(0x00aaff),);nearPlaneHelper.visible = false;world.scene.three.add(nearPlaneHelper);const farPlaneHelper = new THREE.Mesh(  new THREE.PlaneGeometry(planeSize, planeSize),  clipPlaneMat(0xff4400),);farPlaneHelper.visible = false;world.scene.three.add(farPlaneHelper);// Orient a plane helper perpendicular to the projection direction at a given depthconst orientPlaneHelper = (  helper: THREE.Mesh,  dir: THREE.Vector3,  depth: number,) => {  // The plane's normal should face opposite to the projection direction  const quat = new THREE.Quaternion().setFromUnitVectors(    new THREE.Vector3(0, 0, 1),    dir.clone().negate(),  );  helper.quaternion.copy(quat);  // Position along the projection direction at the given depth  // depth is measured along -projectionDirection (the "look" axis)  helper.position    .copy(modelCenter)    .addScaledVector(dir.clone().negate(), depth - modelCenter.dot(dir.clone().negate()));  // Simpler: position = dir.negate * depth  helper.position.copy(dir.clone().negate().multiplyScalar(depth));  // Project center onto perpendicular plane and add  const centerOnAxis = dir.clone().negate().multiplyScalar(modelCenter.dot(dir.clone().negate()));  const centerPerp = modelCenter.clone().sub(centerOnAxis);  helper.position.add(centerPerp);};const updatePlaneHelpers = () => {  const dir = edgeProjector.projectionDirection;  orientPlaneHelper(nearPlaneHelper, dir, edgeProjector.nearPlane);  orientPlaneHelper(farPlaneHelper, dir, edgeProjector.farPlane);  nearPlaneHelper.visible = edgeProjector.nearPlane > currentExtent.min;  farPlaneHelper.visible = edgeProjector.farPlane < currentExtent.max;};const updateOrientation = (name: string) => {  const preset = orientations[name];  if (!preset) return;  currentOrientation = name;  edgeProjector.projectionDirection.copy(preset.direction);  // Recompute extent along new direction  // The "depth" axis is -projectionDirection  const depthAxis = preset.direction.clone().negate();  currentExtent = getExtentAlongDirection(depthAxis);  edgeProjector.nearPlane = currentExtent.min;  edgeProjector.farPlane = currentExtent.max;  // Resize plane helpers  planeSize = getPlaneSizeForDirection(preset.direction);  nearPlaneHelper.geometry.dispose();  nearPlaneHelper.geometry = new THREE.PlaneGeometry(planeSize, planeSize);  farPlaneHelper.geometry.dispose();  farPlaneHelper.geometry = new THREE.PlaneGeometry(planeSize, planeSize);  updatePlaneHelpers();};// Initialize helpersupdatePlaneHelpers();
```

Now let's create a material for displaying the projected edges and a helper function to generate the projection for all loaded model items. We'll also add a translucent white plane below the projection to make the edges easier to see:

```typescript
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });const hiddenLineMaterial = new THREE.LineBasicMaterial({  color: 0x888888,  transparent: true,  opacity: 0.3,});let visibleLines: THREE.LineSegments | null = null;let hiddenLines: THREE.LineSegments | null = null;let backgroundPlane: THREE.Mesh | null = null;const cleanProjection = () => {  if (visibleLines) {    visibleLines.removeFromParent();    visibleLines.geometry.dispose();    visibleLines = null;  }  if (hiddenLines) {    hiddenLines.removeFromParent();    hiddenLines.geometry.dispose();    hiddenLines = null;  }  if (backgroundPlane) {    backgroundPlane.removeFromParent();    backgroundPlane.geometry.dispose();    (backgroundPlane.material as THREE.Material).dispose();    backgroundPlane = null;  }};// Create a background plane and position the results relative to itconst addResultPlane = () => {  const dir = edgeProjector.projectionDirection;  const depthAxis = dir.clone().negate();  // Position the result plane just above the model along the depth axis  const resultDepth = currentExtent.max + 3;  const resultPlaneSize = planeSize * 1.3;  const planeGeom = new THREE.PlaneGeometry(resultPlaneSize, resultPlaneSize);  const planeMat = new THREE.MeshBasicMaterial({    color: 0xffffff,    transparent: true,    opacity: 0.9,    side: THREE.DoubleSide,  });  backgroundPlane = new THREE.Mesh(planeGeom, planeMat);  // Orient perpendicular to projection direction  const quat = new THREE.Quaternion().setFromUnitVectors(    new THREE.Vector3(0, 0, 1),    dir.clone().negate(),  );  backgroundPlane.quaternion.copy(quat);  // Position along depth axis  const centerPerp = modelCenter    .clone()    .sub(depthAxis.clone().multiplyScalar(modelCenter.dot(depthAxis)));  backgroundPlane.position    .copy(depthAxis.clone().multiplyScalar(resultDepth))    .add(centerPerp);  world.scene.three.add(backgroundPlane);  return { resultDepth, depthAxis, centerPerp };};const generateProjection = async () => {  cleanProjection();  // Build a ModelIdMap with all items that have geometry  const modelIdMap: OBC.ModelIdMap = {};  for (const [modelId, model] of fragments.list) {    const idsWithGeometry = await model.getItemsIdsWithGeometry();    modelIdMap[modelId] = new Set(idsWithGeometry);  }  const { visible, hidden } = await edgeProjector.get(modelIdMap, world, {    onProgress: (message, progress) => {      if (progress !== undefined) {        console.log(`${message}: ${(progress * 100).toFixed(1)}%`);      } else {        console.log(message);      }    },  });  const { resultDepth, depthAxis } = addResultPlane();  // Offset edges slightly in front of the background plane (along depth axis only)  const edgeOffset = depthAxis.clone().multiplyScalar(resultDepth + 0.01);  visibleLines = new THREE.LineSegments(visible, lineMaterial);  visibleLines.position.copy(edgeOffset);  hiddenLines = new THREE.LineSegments(hidden, hiddenLineMaterial);  hiddenLines.visible = false;  hiddenLines.position.copy(edgeOffset);  world.scene.three.add(visibleLines);  world.scene.three.add(hiddenLines);};
```

We can also project a subset of items. Let's create a function that projects only items matching a category:

```typescript
const generateCategoryProjection = async (category: string) => {  cleanProjection();  const arqId = [...fragments.list.keys()].find((modelId) =>    /arq/.test(modelId),  );  if (!arqId) return;  const model = fragments.list.get(arqId);  if (!model) return;  const items = await model.getItemsOfCategories([new RegExp(`^${category}$`)]);  const localIds = Object.values(items).flat();  if (localIds.length === 0) return;  const modelIdMap: OBC.ModelIdMap = { [arqId]: new Set(localIds) };  const { visible, hidden } = await edgeProjector.get(modelIdMap, world);  const { resultDepth, depthAxis, centerPerp } = addResultPlane();  const edgeOffset = depthAxis    .clone()    .multiplyScalar(resultDepth + 0.01)    .add(centerPerp);  visibleLines = new THREE.LineSegments(visible, lineMaterial);  visibleLines.position.copy(edgeOffset);  hiddenLines = new THREE.LineSegments(hidden, hiddenLineMaterial);  hiddenLines.visible = false;  hiddenLines.position.copy(edgeOffset);  world.scene.three.add(visibleLines);  world.scene.three.add(hiddenLines);};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
const panel = BUI.Component.create<BUI.PanelSection>(() => {  let categoriesDropdown: BUI.Dropdown | undefined;  let orientationDropdown: BUI.Dropdown | undefined;  let nearInput: BUI.NumberInput | undefined;  let farInput: BUI.NumberInput | undefined;  const onGenerateAll = async ({ target }: { target: BUI.Button }) => {    target.loading = true;    await generateProjection();    target.loading = false;  };  const onGenerateCategory = async ({ target }: { target: BUI.Button }) => {    if (!categoriesDropdown) return;    target.loading = true;    const [category] = categoriesDropdown.value;    await generateCategoryProjection(category);    target.loading = false;  };  const onCategoriesDropdownCreated = async (e?: Element) => {    if (!e) return;    const arqId = [...fragments.list.keys()].find((modelId) =>      /arq/.test(modelId),    );    if (!arqId) return;    const model = fragments.list.get(arqId);    if (!model) return;    const dropdown = e as BUI.Dropdown;    categoriesDropdown = dropdown;    dropdown.innerHTML = "";    const modelCategories = await model.getItemsWithGeometryCategories();    for (const [index, category] of modelCategories.entries()) {      const option = BUI.Component.create(        () =>          BUI.html`<bim-option ?checked=${index === 0} label=${category}></bim-option>`,      );      dropdown.append(option);    }  };  const onOrientationDropdownCreated = (e?: Element) => {    if (!e) return;    orientationDropdown = e as BUI.Dropdown;  };  const onOrientationChange = () => {    if (!orientationDropdown) return;    const [name] = orientationDropdown.value;    updateOrientation(name);    // Update near/far slider ranges and values    if (nearInput) {      nearInput.min = currentExtent.min;      nearInput.max = currentExtent.max;      nearInput.value = currentExtent.min;    }    if (farInput) {      farInput.min = currentExtent.min;      farInput.max = currentExtent.max;      farInput.value = currentExtent.max;    }  };  const onClean = () => {    cleanProjection();  };  const onAngleChange = ({ target }: { target: BUI.NumberInput }) => {    edgeProjector.generator.angleThreshold = target.value;  };  const onToggleHidden = ({ target }: { target: BUI.Checkbox }) => {    if (hiddenLines) hiddenLines.visible = target.checked;  };  const onCullerPrecisionChange = ({ target }: { target: BUI.NumberInput }) => {    edgeProjector.cullerPixelsPerMeter = target.value;  };  const onNearPlaneCreated = (e?: Element) => {    if (!e) return;    nearInput = e as BUI.NumberInput;  };  const onFarPlaneCreated = (e?: Element) => {    if (!e) return;    farInput = e as BUI.NumberInput;  };  const onNearPlaneChange = ({ target }: { target: BUI.NumberInput }) => {    edgeProjector.nearPlane = target.value;    updatePlaneHelpers();  };  const onFarPlaneChange = ({ target }: { target: BUI.NumberInput }) => {    edgeProjector.farPlane = target.value;    updatePlaneHelpers();  };  return BUI.html`    <bim-panel active label="Edge Projector Tutorial" class="options-menu">      <bim-panel-section label="Orientation">        <bim-dropdown ${BUI.ref(onOrientationDropdownCreated)} required @change=${onOrientationChange}>          <bim-option checked label="Top (Plan)"></bim-option>          <bim-option label="Front"></bim-option>          <bim-option label="Back"></bim-option>          <bim-option label="Left"></bim-option>          <bim-option label="Right"></bim-option>        </bim-dropdown>      </bim-panel-section>      <bim-panel-section label="Clipping">        <bim-number-input ${BUI.ref(onNearPlaneCreated)} vertical value=${currentExtent.min} min=${currentExtent.min} max=${currentExtent.max} step=0.1 slider label="Near Plane" @change=${onNearPlaneChange}></bim-number-input>        <bim-number-input ${BUI.ref(onFarPlaneCreated)} vertical value=${currentExtent.max} min=${currentExtent.min} max=${currentExtent.max} step=0.1 slider label="Far Plane" @change=${onFarPlaneChange}></bim-number-input>      </bim-panel-section>      <bim-panel-section label="Settings">        <bim-number-input vertical value=${edgeProjector.generator.angleThreshold} min=0 max=180 step=1 slider label="Angle Threshold" @change=${onAngleChange}></bim-number-input>        <bim-number-input vertical value=${edgeProjector.cullerPixelsPerMeter} min=0.01 max=1 step=0.01 slider label="Culler Precision" @change=${onCullerPrecisionChange}></bim-number-input>        <bim-checkbox label="Show Hidden Lines" @change=${onToggleHidden}></bim-checkbox>      </bim-panel-section>      <bim-panel-section label="All Items">        <bim-button label="Generate Projection" @click=${onGenerateAll}></bim-button>      </bim-panel-section>      <bim-panel-section label="By Category">        <bim-dropdown ${BUI.ref(onCategoriesDropdownCreated)} required></bim-dropdown>        <bim-button label="Generate Category Projection" @click=${onGenerateCategory}></bim-button>      </bim-panel-section>      <bim-panel-section label="General">        <bim-button label="Clean Projection" @click=${onClean}></bim-button>      </bim-panel-section>    </bim-panel>  `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to:

- Generate 2D edge projections from BIM model items.
- Configure projection orientation for plans, sections, and elevations.
- Use near/far clipping planes to isolate specific floors or sections.
- Filter by category and toggle hidden lines.
Congratulations! Keep going with more tutorials in the documentation.


---

# MODULE: FragmentsManager
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/FragmentsManager

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- FragmentsManager

# FragmentsManager

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📄 Managing Fragments Models​

Loading large BIM models directly as IFC files on every session is slow — IFC parsing is expensive and blocks the main thread. Fragments solve this by converting IFC geometry into a compact, worker-based format that loads over 10x faster and keeps the app responsive during processing. The FragmentsManager is the entry point for working with this format inside the Components ecosystem.
This tutorial covers initializing the FragmentsManager with its worker, loading multiple Fragment models concurrently, reacting to model load and removal events to wire them into the scene, exporting loaded models back to .frag files, and disposing individual or all models to free memory. By the end, you'll have the foundational model management setup that every other tutorial in the library depends on.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);components.init();components.get(OBC.Grids).create(world);
```

### ✨ Utilizing the FragmentsManager Component​

Great! With the base viewer setup complete, let's dive into using the FragmentsManager component. This component serves as a convenient wrapper around the core FragmentsModels class from the @thatopen/fragments library. One of the key advantages of using Fragments in That Open Engine is its worker-based architecture, which offloads most operations (data retrieval, visibility management, color adjustments, etc.) to a separate thread. This ensures that the app remains responsive during processing. To get started, the first step is to specify the URL of the Fragments worker:

When using the Components libraries, you should not use FragmentsModels directly. Instead, always use FragmentsManager. FragmentsManager is designed to integrate Fragments with the Components ecosystem, ensuring compatibility with pre-built features (such as Highlighter, Measurement, and more). Using FragmentsModels directly when Components are involved may cause these features to not work correctly with the loaded fragments!

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();
```

Once initialization is complete, you can safely retrieve the component instance and proceed with its setup:

```typescript
const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);
```

The initialization should only be performed once for the entire application instance.

Since the manager has already been initialized, we can proceed with its configuration. Fragments utilize culling and LOD (Level of Detail in 3D graphics, not LOD from BIM) to optimize geometry rendering by offloading parts that are not visible to the user. A common approach is to apply culling and LOD based on camera movements. By leveraging the world's camera controls, we can detect when the camera is about to stop moving (rest) and instruct the manager to update the visual state of all models accordingly:

```typescript
world.camera.controls.addEventListener("update", () => fragments.core.update());
```

### 🗂️ Fragments List​

When a model is loaded, it is added to memory and the manager's list. This list serves as a centralized place to manage all loaded fragments. Use it to detect when models are added or removed. Usually, that is used to tell the loaded model which camera to use for culling and LOD updates, and add it to the ThreeJS scene:

```typescript
fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});
```

### 🗂️ Fragments Materials List​

Coplanar geometries produce z-fighting. To avoid this, we will add a polygon offset to the materials as they are loaded in fragments.

```typescript
fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const loadFragments = async () => {  // you can provide as many files as you need  const fragPaths = [    "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",    "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",  ];  // Promise.all loads models concurrently for faster execution.  await Promise.all(    fragPaths.map(async (path) => {      const modelId = path.split("/").pop()?.split(".").shift();      if (!modelId) return null;      const file = await fetch(path);      const buffer = await file.arrayBuffer();      // this is the main function to load the fragments      return fragments.core.load(buffer, { modelId });    }),  );};
```

### 🎁 Exporting the Fragments Model​

At any point, you can download the models that have been loaded (although it may be unnecessary since you already have the original files used to load them). Exporting the models is straightforward and can be done as follows:

```typescript
const downloadFragments = async () => {  for (const [, model] of fragments.list) {    const fragsBuffer = await model.getBuffer(false);    const file = new File([fragsBuffer], `${model.modelId}.frag`);    const link = document.createElement("a");    link.href = URL.createObjectURL(file);    link.download = file.name;    link.click();    URL.revokeObjectURL(link.href);  }};
```

### 🗑️ Deleting Models​

You can delete loaded models at any time to free up memory when they are no longer needed. Once a model is deleted, it is removed from memory and the fragments list. Deleting models is simple and can be done as follows:

```typescript
const deleteArchModel = () => {  const modelIds = [...fragments.list.keys()];  const modelId = modelIds.find((key) => /arq/.test(key));  if (!modelId) return;  fragments.core.disposeModel(modelId);};const deleteAllModels = () => {  for (const [modelId] of fragments.list) {    fragments.core.disposeModel(modelId);  }};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
const [panel, updatePanel] = BUI.Component.create<BUI.PanelSection, {}>((_) => {  const onLoadFragments = async ({ target }: { target: BUI.Button }) => {    target.loading = true;    await loadFragments();    target.loading = false;  };  let loadFragmentsBtn: BUI.TemplateResult | undefined;  if (fragments.list.size === 0) {    loadFragmentsBtn = BUI.html`      <bim-button label="Load fragments" @click=${onLoadFragments}></bim-button>    `;  }  let disposeArchModelBtn: BUI.TemplateResult | undefined;  if ([...fragments.list.keys()].some((key) => /arq/.test(key))) {    disposeArchModelBtn = BUI.html`      <bim-button label="Dispose Arch Model" @click=${deleteArchModel}></bim-button>      `;  }  let downloadFragmentsBtn: BUI.TemplateResult | undefined;  let disposeModelsBtn: BUI.TemplateResult | undefined;  if (fragments.list.size > 0) {    disposeModelsBtn = BUI.html`      <bim-button label="Dispose All Models" @click=${deleteAllModels}></bim-button>    `;    downloadFragmentsBtn = BUI.html`      <bim-button label="Export fragments" @click=${downloadFragments}></bim-button>    `;  }  return BUI.html`    <bim-panel active label="FragmentsManager Tutorial" class="options-menu">      <bim-panel-section label="Controls">        ${loadFragmentsBtn}        ${disposeArchModelBtn}        ${disposeModelsBtn}        ${downloadFragmentsBtn}      </bim-panel-section>    </bim-panel>  `;}, {});const updateFunction = () => updatePanel();fragments.list.onItemSet.add(updateFunction);fragments.list.onItemDeleted.add(updateFunction);document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to load, manage, and interact with Fragments models in your application. Congratulations! Keep going with more tutorials in the documentation.


---

# MODULE: Grids
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/Grids

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- Grids

# Grids

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📄 Adding Fancy Grids​

Without a spatial reference, users navigating an empty or partially loaded 3D scene have no sense of scale or orientation. An infinite grid provides that grounding — a neutral plane that adapts to the model's coordinate system and stays out of the way.
This tutorial covers creating a grid for a world, snapping it to a specific building storey elevation read directly from the model, and controlling its visibility, color, and primary and secondary cell sizes through a UI panel. By the end, you'll have a configurable grid ready to orient your users in any BIM scene.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(68, 23, -8.5, 21.5, -5.5, 23);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",];const [model] = await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using The Grids Component​

The Grids component is straightforward to use. It allows you to create an infinite grid for any world in your application. Here's how you can proceed:

```typescript
const grids = components.get(OBC.Grids);// create the grid for the world we setconst grid = grids.create(world);
```

Now, something convenient to do is set the grid at some height based on your model levels. For it, you need to know the levels (storeys if using IFC schema) of your model and get it's computed elevation from the attributes. First, let's get the model levels and it's attributes:

```typescript
const storeys = await model!.getItemsOfCategories([/BUILDINGSTOREY/]);const localIds = Object.values(storeys).flat();const data = await model!.getItemsData(localIds);
```

Then, we can create a very simple helper function that returns the storey elevation based on it's name:

```typescript
const getStoreyElevation = async (name: string) => {  const storey = data.find((attributes) => {    if (!("Name" in attributes && "value" in attributes.Name)) return false;    return attributes.Name.value === name;  });  if (!storey) return 0;  if (!("Elevation" in storey && "value" in storey.Elevation)) return 0;  const [, coordHeight] = await model!.getCoordinates();  return storey.Elevation.value + coordHeight;};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
const panel = BUI.Component.create<BUI.PanelSection>(() => {  const onGridLevelChange = async ({ target }: { target: BUI.Dropdown }) => {    const [level] = target.value;    if (!level) return;    const elevation = await getStoreyElevation(level);    grid.three.position.y = elevation;  };  return BUI.html`    <bim-panel active label="Grids Tutorial" class="options-menu">      <bim-panel-section label="Section">        <bim-dropdown @change=${onGridLevelChange} placeholder="Select a grid level">          ${data.map((attributes) => {            if (!("Name" in attributes && "value" in attributes.Name)) {              return null;            }            return BUI.html`<bim-option label=${attributes.Name.value}></bim-option>`;          })}        </bim-dropdown>        <bim-checkbox label="Grid visible" checked           @change="${({ target }: { target: BUI.Checkbox }) => {            grid.config.visible = target.value;          }}">        </bim-checkbox>              <bim-color-input           label="Grid Color" color="#bbbbbb"           @input="${({ target }: { target: BUI.ColorInput }) => {            grid.config.color = new THREE.Color(target.color);          }}">        </bim-color-input>                <bim-number-input           slider step="0.1" label="Grid primary size" value="1" min="0" max="10"          @change="${({ target }: { target: BUI.NumberInput }) => {            grid.config.primarySize = target.value;          }}">        </bim-number-input>                <bim-number-input           slider step="0.1" label="Grid secondary size" value="10" min="0" max="20"          @change="${({ target }: { target: BUI.NumberInput }) => {            grid.config.secondarySize = target.value;          }}">        </bim-number-input>      </bim-panel-section>    </bim-panel>  `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to [insert here the learnings]. Congratulations! Keep going with more tutorials in the documentation.


---

# MODULE: Hider
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/Hider

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- Hider

# Hider

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📄 Managing Items Visibility​

When reviewing a BIM model, seeing everything at once makes it hard to focus — walls block structure, MEP clutters architecture, and the floor you care about is buried under every other storey. Without a visibility system, controlling what's shown means manipulating Three.js objects directly for every feature that needs it.
This tutorial covers isolating all elements of a given category (showing only those, hiding everything else), hiding a specific category while keeping the rest visible, and resetting all elements back to fully visible in one call. By the end, you'll have a reusable visibility control that any other component — classifier, finder, selection — can drive by passing a ModelIdMap.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",  "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using The Hider Component​

The Hider component is very handy, as it is the main tool used for isolating, hiding, or performing any other operation related to item visibility. First of all, let's get the instance:

```typescript
const hider = components.get(OBC.Hider);
```

Starting with isolation, let's create a handy function that let's isolate items based on the category:

```typescript
const isolateByCategory = async (categories: string[]) => {  // An OBC.ModelIdMap represents selections within the engine.  // Here, we are defining a selection of the loaded model  // that includes all items belonging to the specified category.  const modelIdMap: OBC.ModelIdMap = {};  const categoriesRegex = categories.map((cat) => new RegExp(`^${cat}$`));  for (const [, model] of fragments.list) {    const items = await model.getItemsOfCategories(categoriesRegex);    const localIds = Object.values(items).flat();    modelIdMap[model.modelId] = new Set(localIds);  }  await hider.isolate(modelIdMap);};
```

You don't need to worry about making the Hider component work with multiple models, it handles this automatically (as do all other components) using the modelIdMap.

As you can see, it's quite straightforward. Now, let's create another helper function to hide items instead of isolating them:

```typescript
const hideByCategory = async (categories: string[]) => {  const modelIdMap: OBC.ModelIdMap = {};  const categoriesRegex = categories.map((cat) => new RegExp(`^${cat}$`));  for (const [, model] of fragments.list) {    const items = await model.getItemsOfCategories(categoriesRegex);    const localIds = Object.values(items).flat();    modelIdMap[model.modelId] = new Set(localIds);  }  await hider.set(false, modelIdMap);};
```

Managing the visibility with ModelIdMaps (selections in That Open Engine) becomes very powerful when combined with other components, such as the ItemsFinder. Check out the tutorial for that component!

Finally, you can easily reset the visibility of all items as follows:

```typescript
const resetVisibility = async () => {  await hider.set(true);};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
const categoriesDropdownTemplate = () => {  const onCreated = async (e?: Element) => {    if (!e) return;    const dropdown = e as BUI.Dropdown;    const modelCategories = new Set<string>();    for (const [, model] of fragments.list) {      const categories = await model.getItemsWithGeometryCategories();      for (const category of categories) {        if (!category) continue;        modelCategories.add(category);      }    }    for (const category of modelCategories) {      const option = BUI.Component.create(        () => BUI.html`<bim-option label=${category}></bim-option>`,      );      dropdown.append(option);    }  };  return BUI.html`    <bim-dropdown multiple ${BUI.ref(onCreated)}></bim-dropdown>  `;};const panel = BUI.Component.create<BUI.PanelSection>(() => {  const categoriesDropdownA = BUI.Component.create<BUI.Dropdown>(    categoriesDropdownTemplate,  );  const categoriesDropdownB = BUI.Component.create<BUI.Dropdown>(    categoriesDropdownTemplate,  );  const onIsolateCategory = async ({ target }: { target: BUI.Button }) => {    if (!categoriesDropdownA) return;    const categories = categoriesDropdownA.value;    if (categories.length === 0) return;    target.loading = true;    await isolateByCategory(categories);    target.loading = false;  };  const onHideCategory = async ({ target }: { target: BUI.Button }) => {    if (!categoriesDropdownB) return;    const categories = categoriesDropdownB.value;    if (categories.length === 0) return;    target.loading = true;    await hideByCategory(categories);    target.loading = false;  };  const onResetVisibility = async ({ target }: { target: BUI.Button }) => {    target.loading = true;    await resetVisibility();    target.loading = false;  };  return BUI.html`    <bim-panel active label="Hider Tutorial" class="options-menu">      <bim-panel-section style="width: 14rem" label="General">        <bim-button label="Reset Visibility" @click=${onResetVisibility}></bim-button>      </bim-panel-section>      <bim-panel-section label="Isolation">        ${categoriesDropdownA}        <bim-button label="Isolate Category" @click=${onIsolateCategory}></bim-button>      </bim-panel-section>      <bim-panel-section label="Hiding">        ${categoriesDropdownB}        <bim-button label="Hide Category" @click=${onHideCategory}></bim-button>      </bim-panel-section>    </bim-panel>  `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to manage item visibility in BIM models using the Hider component. You learned how to use the Hider component to isolate, hide, and reset visibility of items. Congratulations! Keep going with more tutorials in the documentation.


---

# MODULE: IDSSpecifications
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/IDSSpecifications

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- IDSSpecifications

# IDSSpecifications

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 🧐 Reviewing Your IFC Files​

Project owners and BIM managers need to verify that IFC models meet data requirements before they're used downstream — but checking whether every door has a fire rating, or every wall has a load-bearing classification, element by element is impractical at model scale.
IDS (Information Delivery Specification) is the open standard for this: a specification declares which elements are in scope (applicability facets) and what data they must carry (requirement facets), then tests the model and reports which elements pass or fail.
This tutorial covers creating a specification with a name and target IFC version, defining an entity facet to select all doors as the applicable scope, defining a property facet to require FireRating in Pset_DoorCommon, running the test against a loaded model, converting the results into a ModelIdMap, and visualizing passing and failing elements with color highlighting and a ghost mode for easier inspection.
By the end, you'll have a working IDS compliance checker that colorizes which elements meet or violate a data requirement.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";import * as FRAGS from "@thatopen/fragments";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using the IDS Specifications Component​

Leveraging this component in That Open Engine is straightforward. The process revolves around creating specifications based on facets from the IDS schema. Let's begin by obtaining the component instance:

```typescript
const ids = components.get(OBC.IDSSpecifications);
```

Next, let's create a new specification. In this example, the specification will require that all doors must have the FireRating property defined.

```typescript
const spec = ids.create("Sample", ["IFC4"]);spec.description =  "All doors must have FireRating specified in Pset_DoorCommon";
```

IDS schema uses "facets" to define conditions for elements. Facets identify elements (applicability) and specify requirements. Common types include entity, attribute, property, material, classification, and partOf. Learn more in the IDS schema GitHub repository. In this example, we use two facets: one to match IfcDoor items (entity facet for applicability) and another to verify the FireRating property (property facet for requirements).

```typescript
const entity = new OBC.IDSEntity(components, {  type: "simple",  parameter: "IFCDOOR",});const property = new OBC.IDSProperty(  components,  {    type: "simple",    parameter: "Pset_DoorCommon",  },  { type: "simple", parameter: "FireRating" },);
```

Next, simply provide the facets to the specification:

```typescript
spec.applicability.add(entity);spec.requirements.add(property);
```

### 👻 Ghost Mode for Easy Inspection (optional)​

For demonstration purposes, let's create functions that make it easier to review the test results:

```typescript
const originalColors = new Map<  FRAGS.BIMMaterial,  { color: number; transparent: boolean; opacity: number }>();const setModelTransparent = (components: OBC.Components) => {  const fragments = components.get(OBC.FragmentsManager);  const materials = [...fragments.core.models.materials.list.values()];  for (const material of materials) {    if (material.userData.customId) continue;    // save colors    let color: number | undefined;    if ("color" in material) {      color = material.color.getHex();    } else {      color = material.lodColor.getHex();    }    originalColors.set(material, {      color,      transparent: material.transparent,      opacity: material.opacity,    });    // set color    material.transparent = true;    material.opacity = 0.05;    material.needsUpdate = true;    if ("color" in material) {      material.color.setColorName("white");    } else {      material.lodColor.setColorName("white");    }  }};const restoreModelMaterials = () => {  for (const [material, data] of originalColors) {    const { color, transparent, opacity } = data;    material.transparent = transparent;    material.opacity = opacity;    if ("color" in material) {      material.color.setHex(color);    } else {      material.lodColor.setHex(color);    }    material.needsUpdate = true;  }  originalColors.clear();};const toggleGhost = () => {  if (originalColors.size) {    restoreModelMaterials();  } else {    setModelTransparent(components);  }};
```

### ✨ Testing a Specification​

Testing a specification is straightforward. Use the class method to test it and convert the result into a ModelIdMap for easy integration with other engine components. Below is a function that tests the specification and highlights passing and failing elements in green and red, respectively.

The colorizing method below is for demonstration purposes only. For real-world applications, use the Highlighter component. Refer to its tutorial for detailed usage.

```typescript
const testSpec = async () => {  const result = await spec.test([/arq/]);  const { fail, pass } = ids.getModelIdMap(result);  const highlightPromises = [fragments.resetHighlight()];  highlightPromises.push(    fragments.highlight(      {        customId: "green",        color: new THREE.Color("green"),        renderedFaces: FRAGS.RenderedFaces.ONE,        opacity: 1,        transparent: false,      },      pass,    ),  );  highlightPromises.push(    fragments.highlight(      {        customId: "red",        color: new THREE.Color("red"),        renderedFaces: FRAGS.RenderedFaces.ONE,        opacity: 1,        transparent: false,      },      fail,    ),  );  highlightPromises.push(fragments.core.update(true));  await Promise.all(highlightPromises);  toggleGhost();};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
const panel = BUI.Component.create<BUI.PanelSection>(() => {  const onReviewModel = async ({ target }: { target: BUI.Button }) => {    target.loading = true;    await testSpec();    target.loading = false;  };  return BUI.html`    <bim-panel active label="IDS Specifications Tutorial" class="options-menu">      <bim-panel-section label="General">        <bim-button label="Toogle Ghost" @click=${toggleGhost}></bim-button>      </bim-panel-section>      <bim-panel-section label="Specification">        <bim-button label="Review Model" @click=${onReviewModel}></bim-button>      </bim-panel-section>    </bim-panel>  `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to create IDS specifications, test them, and visualize the results in a 3D scene. Congratulations! Keep exploring more tutorials in the documentation to enhance your skills further.


---

# MODULE: IfcLoader
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/IfcLoader

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- IfcLoader

# IfcLoader

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📄 Loading IFC Models​

Loading IFC models at runtime is too slow for production — the engine must parse and convert it to Fragments before anything can render. The recommended workflow is to do that conversion once, save the resulting .frag file, and load that on every subsequent session.
This tutorial covers configuring the IFC loader with the web-ifc WASM binary, wiring the FragmentsManager to receive the converted result, loading an IFC file with a progress callback, and downloading the generated Fragments file so it can be reused directly. By the end, you'll have a complete IFC import pipeline that produces a reusable Fragment asset.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);components.init();components.get(OBC.Grids).create(world);
```

### ✨ Using The IfcLoader Component​

With the basic world already set up, it's now time to bring it to life by loading some IFC files. That Open Engine does not directly load IFC files. When an IFC file is "loaded", the engine first converts it into something called Fragments and then loads it into the scene. The model you see is the result of this process.

Fragments are That Open Company's open-source binary format for storing BIM models. They are built on top of Flatbuffers from Google, making them lightweight and highly efficient for storing vast amounts of BIM data.

All That Open Engine works on top of Fragments, and that's why the conversion process must take place. So, let's start by getting the component instance:

```typescript
const ifcLoader = components.get(OBC.IfcLoader);
```

For memory efficiency reasons, we don't convert each an every element to fragments by default. You can see the list in IfcImporter.classes and check out the full list here. If you convert an IFC to fragments and miss some elements, you probably need to add their IFC classes to the list. You can access the importer instance in the onIfcImporterInitialized event.

```typescript
ifcLoader.onIfcImporterInitialized.add((importer) => {  console.log(importer.classes);});
```

With the loader in place, it needs to be properly configured. This involves setting up web-ifc (the core library responsible for reading IFC files) to ensure it is ready to convert IFC files into Fragments:

```typescript
await ifcLoader.setup({  autoSetWasm: false,  wasm: {    path: "https://unpkg.com/web-ifc@0.0.77/",    absolute: true,  },});
```

When an IFC file is converted to Fragments, another component handles the converted file: the FragmentsManager. Therefore, it is essential to configure this component first before attempting to "load" any IFC file:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());// Ensures that once the Fragments model is loaded// (converted from the IFC in this case),// it utilizes the world camera for updates// and is added to the scene.fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

For additional information about the FragmentsManager, refer to the corresponding component tutorial available in the documentation.

Great! With everything configured, let's proceed to create a function that will load an IFC model into the viewer:

```typescript
const loadIfc = async (path: string) => {  const file = await fetch(path);  const data = await file.arrayBuffer();  const buffer = new Uint8Array(data);  await ifcLoader.load(buffer, false, "example", {    processData: {      progressCallback: (progress) => console.log(progress),    },  });};
```

The IfcLoader component provides a quick and convenient way to convert IFC files into Fragments and load them into the engine. However, for greater control over the conversion process, it is recommended to use the Fragments library directly. The conversion mechanism is the same, but the core library offers a less abstracted approach.

Once the file is loaded, you can leverage any of the engine's components to interact with it. Each component is a specialized tool designed for specific tasks with Fragment Models. There are components for measurements, model classification, visibility operations, plan generation, and much more. Check out the full documentation to learn more!

### 🎁 Exporting the Fragments Model​

The primary goal of this process is to load the Fragments Model instead of the IFC file. This approach is more efficient because the time-consuming part is the conversion process, not the actual loading of the model into the scene. So, how can you obtain the Fragments Model resulting from the conversion? It's simple! Here's how:

```typescript
const downloadFragments = async () => {  // fragments.list holds all the fragments loaded  const [model] = fragments.list.values();  if (!model) return;  const fragsBuffer = await model.getBuffer(false);  const file = new File([fragsBuffer], "school_str.frag");  const link = document.createElement("a");  link.href = URL.createObjectURL(file);  link.download = file.name;  link.click();  URL.revokeObjectURL(link.href);};
```

Now that you can download the Fragments Model, what's next? You should continue loading this file instead of the original IFC file. To learn how to consistently load Fragments Models instead of the original IFC file, refer to the FragmentsManager tutorial.

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
const [panel, updatePanel] = BUI.Component.create<BUI.PanelSection, {}>((_) => {  let downloadBtn: BUI.TemplateResult | undefined;  if (fragments.list.size > 0) {    downloadBtn = BUI.html`      <bim-button label="Download Fragments" @click=${downloadFragments}></bim-button>    `;  }  let loadBtn: BUI.TemplateResult | undefined;  if (fragments.list.size === 0) {    const onLoadIfc = async ({ target }: { target: BUI.Button }) => {      target.label = "Conversion in progress...";      target.loading = true;      await loadIfc(        "https://thatopen.github.io/engine_components/resources/ifc/school_str.ifc",      );      target.loading = false;      target.label = "Load IFC";    };    loadBtn = BUI.html`      <bim-button label="Load IFC" @click=${onLoadIfc}></bim-button>      <bim-label>Open the console to see the progress!</bim-label>    `;  }  return BUI.html`    <bim-panel active label="IfcLoader Tutorial" class="options-menu">      <bim-panel-section label="Controls">        ${loadBtn}        ${downloadBtn}      </bim-panel-section>    </bim-panel>  `;}, {});document.body.append(panel);fragments.list.onItemSet.add(() => updatePanel());
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to load IFC models, convert them to Fragments, and interact with them in a 3D scene. Congratulations! Keep going with more tutorials in the documentation.


---

# MODULE: ItemsFinder
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/ItemsFinder

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- ItemsFinder

# ItemsFinder

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📄 Finding the Items you Need​

Filtering "all walls on the first floor" or "all masonry walls named X" by hand means traversing element trees and writing custom queries per use case. As models get larger and features multiply, that becomes unmanageable. A declarative query system lets you define the selection criteria once and run it across any number of loaded models automatically.
This tutorial covers creating queries by category (walls and slabs), by category combined with attribute matching (masonry walls by name regex), and by category combined with a relational constraint (columns contained in a specific building storey). By the end, you'll have named, reusable queries that return a ModelIdMap — ready to feed directly into visibility, highlighting, or classification operations.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import * as FRAGS from "@thatopen/fragments";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",  "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using The Items Finder Component​

Using the Items Finder component is straightforward. The only thing you need to focus on is understanding the types of attributes and relationships your model may have, as well as the values you expect from them. The rest is handled automatically by the component itself. Let's begin by obtaining the component instance:

```typescript
const finder = components.get(OBC.ItemsFinder);
```

When using the finder, you create queries to locate the items you are searching for. Essentially, you can search based on three criteria: categories, attributes, and relationships. While this may seem limited, it is far more powerful than you might think. Let's create a few queries using one or more of these criteria. We'll start by searching for categories:

```typescript
finder.create("Walls & Slabs", [{ categories: [/WALL/, /SLAB/] }]);
```

When you create queries, as demonstrated earlier, the query data is automatically stored within the Items Finder component under its list property.

When searching for categories as shown earlier, the result will include all items matching any of the specified categories. This is because a single item cannot belong to more than one category. To make things more interesting, let's search for all items that match specific criteria in their attributes:

```typescript
finder.create("Masonry Walls", [  {    categories: [/WALL/],    attributes: { queries: [{ name: /Name/, value: /Masonry/ }] },  },]);
```

As demonstrated, we are now searching for walls that include the word "Masonry" in their "Name" attribute. Note that both the name and value of the attribute are defined using regular expressions. This approach offers greater flexibility in specifying search criteria.

For improved flexibility, attribute values can also be numbers, booleans, or arrays of regular expressions.

To keep making things even more interesting, let's create a query that is able to find the items that relates with another under some conditions:

```typescript
// First, define a query to find building storeys// where the Name attribute contains the word "Entry".const entryLevel: FRAGS.ItemsQueryParams = {  categories: [/BUILDINGSTOREY/],  attributes: { queries: [{ name: /Name/, value: /Entry/ }] },};// Next, we retrieve all columns that are related// to any item matching the entryLevel query under the// relation named ContainedInStructure.finder.create("First Level Columns", [  {    categories: [/COLUMN/],    relation: { name: "ContainedInStructure", query: entryLevel },  },]);
```

As demonstrated, this approach can become incredibly powerful with minimal code, as long as you understand the expected attribute types and the relationships within your model.

If your Fragment Models implement the IFC schema, refer to the buildingSMART documentation to learn more about the available attributes and relationship types.

Lastly, let's create a helper function to return the modelIdMap result of the query:

```typescript
const getResult = async (name: string) => {  const finderQuery = finder.list.get(name);  if (!finderQuery) return {};  const result = await finderQuery.test();  return result;};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
type QueriesListTableData = {  Name: string;  Actions: string;};const queriesListTemplate = () => {  const onCreated = (e?: Element) => {    if (!e) return;    const table = e as BUI.Table<QueriesListTableData>;    table.loadFunction = async () => {      const data: BUI.TableGroupData<QueriesListTableData>[] = [];      for (const [name] of finder.list) {        data.push({          data: { Name: name, Actions: "" },        });      }      return data;    };    table.loadData(true);  };  return BUI.html`    <bim-table ${BUI.ref(onCreated)}></bim-table>  `;};const queriesList =  BUI.Component.create<BUI.Table<QueriesListTableData>>(queriesListTemplate);queriesList.style.maxHeight = "25rem";queriesList.columns = ["Name", { name: "Actions", width: "auto" }];queriesList.noIndentation = true;queriesList.headersHidden = true;queriesList.dataTransform = {  Actions: (_, rowData) => {    const { Name } = rowData;    if (!Name) return _;    const hider = components.get(OBC.Hider);    const onClick = async ({ target }: { target: BUI.Button }) => {      target.loading = true;      const modelIdMap = await getResult(Name);      await hider.isolate(modelIdMap);      target.loading = false;    };    return BUI.html`<bim-button icon="solar:cursor-bold" @click=${onClick}></bim-button>`;  },};const panel = BUI.Component.create<BUI.PanelSection>(() => {  const onResetVisibility = async ({ target }: { target: BUI.Button }) => {    target.loading = true;    const hider = components.get(OBC.Hider);    await hider.set(true);    target.loading = false;  };  return BUI.html`    <bim-panel active label="Items Finder Tutorial" class="options-menu">      <bim-panel-section style="min-width: 14rem" label="General">        <bim-button label="Reset Visibility" @click=${onResetVisibility}></bim-button>      </bim-panel-section>      <bim-panel-section label="Queries">        ${queriesList}      </bim-panel-section>    </bim-panel>  `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to use the Items Finder component to create powerful queries for your 3D models. Congratulations! Keep exploring more tutorials in the documentation to enhance your skills further.


---

# MODULE: OrthoPerspectiveCamera
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/OrthoPerspectiveCamera

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- OrthoPerspectiveCamera

# OrthoPerspectiveCamera

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📄 Handling Fancy Cameras​

BIM applications need two navigation modes: perspective for exploring the 3D model naturally, and orthographic for reading plans and sections with accurate proportions. Switching between them mid-session — without losing the camera position — is what the OrthoPerspectiveCamera is built for.
This tutorial covers switching between perspective and orthographic projections, changing navigation modes (Orbit, First Person, and Plan), locking user input, and fitting the camera to the loaded model. By the end, you'll have a fully controllable camera ready for both 3D exploration and 2D plan navigation.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(68, 23, -8.5, 21.5, -5.5, 23);components.init();const grid = components.get(OBC.Grids).create(world);
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using The OrthoPerspectiveCamera Component​

We have already created the camera while setting up the world, making it incredibly simple. However, the camera itself comes with some exciting features that can be triggered through the UI in this tutorial. Since the camera can switch between different projections, the world's grid needs to be updated accordingly:

```typescript
world.camera.projection.onChanged.add(() => {  const projection = world.camera.projection.current;  grid.fade = projection === "Perspective";});
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will create a simple UI for the OrthoPerspectiveCamera. It will have 4 elements:

#### 🎛️ Navigation mode​

This will control the navigation mode of the OrthoPerspectiveCamera. It will have 3 options:

- Orbit: for 3D orbiting around the scene.
- FirstPerson: for navigating the scene in with the mouse wheel in first person.
- Plan: for navigating 2d plans (blocking the orbit).

#### 📐 Projections​

Like its name implies, the OrthoPerspectiveCamera has 2 projections, and it's really easy to toggle between them. The camera position will remain the same, which is really convenient when you switch between different projections!

#### ❌ Toggling user input​

Sometimes you might want to remove control from the user. For example, imagine you are animating the camera and you don't want the user to move the camera around. You can use the setUserInput method to toggle this.

#### 🔎 Focusing objects​

The OrthoPerspectiveCamera has a fit method that will fit the camera to a list of meshes. This is really useful when you want to bring attention to a specific part of the scene, or for allowing your user to navigate the scene by focusing objects.

```typescript
const panel = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`    <bim-panel active label="OrthoPerspectiveCamera Tutorial" class="options-menu">      <bim-panel-section label="Section">        <bim-dropdown required label="Navigation Mode"             @change="${({ target }: { target: BUI.Dropdown }) => {              const selected = target.value[0] as OBC.NavModeID;              const { current } = world.camera.projection;              const isOrtho = current === "Orthographic";              const isFirstPerson = selected === "FirstPerson";              if (isOrtho && isFirstPerson) {                alert("First person is not compatible with ortho!");                target.value[0] = world.camera.mode.id;                return;              }              world.camera.set(selected);            }}">          <bim-option checked label="Orbit"></bim-option>          <bim-option label="FirstPerson"></bim-option>          <bim-option label="Plan"></bim-option>        </bim-dropdown>                        <bim-dropdown required label="Projection"             @change="${({ target }: { target: BUI.Dropdown }) => {              const selected = target.value[0] as OBC.CameraProjection;              const isOrtho = selected === "Orthographic";              const isFirstPerson = world.camera.mode.id === "FirstPerson";              if (isOrtho && isFirstPerson) {                alert("First person is not compatible with ortho!");                target.value[0] = world.camera.projection.current;                return;              }              world.camera.projection.set(selected);            }}">          <bim-option checked label="Perspective"></bim-option>          <bim-option label="Orthographic"></bim-option>        </bim-dropdown>        <bim-checkbox           label="Allow User Input" checked           @change="${({ target }: { target: BUI.Checkbox }) => {            world.camera.setUserInput(target.checked);          }}">          </bim-checkbox>                  <bim-button           label="Fit Model"           @click=${() => world.camera.fitToItems()}>        </bim-button>      </bim-panel-section>    </bim-panel>  `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to use the OrthoPerspectiveCamera component effectively, toggle between projections, navigate your scene, and even fit the camera to the models. Congratulations! Keep exploring more tutorials in the documentation to enhance your skills further.


---

# MODULE: Raycasters
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/Raycasters

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- Raycasters

# Raycasters

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📄 Picking With the Mouse​

Knowing which element the user is pointing at is the foundation of almost every interaction in a BIM app — selecting, highlighting, inspecting, placing tools. Without it, clicks and hovers have no context. The Raycaster bridges the mouse position and the 3D scene, identifying exactly which model element is underneath the cursor.
This tutorial covers casting a ray on double click, resolving the hit to a specific model element, changing its color, and displaying its name in a UI panel. By the end, you'll have a working element picker that you can build any selection-driven feature on top of.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import * as FRAGS from "@thatopen/fragments";import * as THREE from "three";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(68, 23, -8.5, 21.5, -5.5, 23);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using The Raycasters Component​

With the model now loaded, we can leverage the raycaster to pick items in the scene. Let's retrieve the raycaster as shown below:

```typescript
const casters = components.get(OBC.Raycasters);// Each raycaster is associated with a specific world.// Here, we retrieve the raycaster for the `world` used in our scene.const caster = casters.get(world);
```

With the world caster available, we can cast a ray under any condition we choose. In this example, we'll perform a raycast each time the user double-clicks within the viewer container.

```typescript
// We set a selection callback, so we can decide what// happen with the selected element laterlet onSelectCallback = (_modelIdMap: OBC.ModelIdMap) => {};container.addEventListener("dblclick", async () => {  const result = (await caster.castRay()) as any;  if (!result) return;  // The modelIdMap is how selections are represented in the engine.  // The keys are modelIds, while the values are sets of localIds (items within the model)  const modelIdMap = { [result.fragments.modelId]: new Set([result.localId]) };  onSelectCallback(modelIdMap);});
```

Now, for added functionality, let's modify the color of the selected element by reassigning the selection callback to something more useful. Additionally, we'll store the attributes of the selected element in a variable that can be utilized to display information (like the Name) in the UI for this example.

```typescript
let onItemSelected = () => {};let attributes: FRAGS.ItemData | undefined;// We set the color outside just to be able to change it from the UIconst color = new THREE.Color("purple");onSelectCallback = async (modelIdMap) => {  const modelId = Object.keys(modelIdMap)[0];  if (modelId && fragments.list.get(modelId)) {    const model = fragments.list.get(modelId)!;    const [data] = await model.getItemsData([...modelIdMap[modelId]]);    attributes = data;  }  await fragments.highlight(    {      color,      renderedFaces: FRAGS.RenderedFaces.ONE,      opacity: 1,      transparent: false,    },    modelIdMap,  );  await fragments.core.update(true);  onItemSelected();};
```

In this example, we are directly using fragments.highlight for demonstration purposes. However, the recommended approach is to utilize the Highlighter component. Please refer to the corresponding tutorial for detailed instructions.

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
const [panel, updatePanel] = BUI.Component.create<BUI.PanelSection, {}>((_) => {  const onColorChange = ({ target }: { target: BUI.ColorInput }) => {    color.set(target.color);  };  let nameLabel = BUI.html`<bim-label>There is no item name to display.</bim-label>`;  if (attributes && "value" in attributes.Name) {    nameLabel = BUI.html`<bim-label>${attributes.Name.value}</bim-label>`;  }  const onClearColors = async ({ target }: { target: BUI.Button }) => {    target.loading = true;    await fragments.resetHighlight();    await fragments.core.update(true);    target.loading = false;  };  return BUI.html`    <bim-panel active label="Raycasters Tutorial" class="options-menu">      <bim-panel-section label="Controls">        <bim-label>Double Click: Colorize element</bim-label>        <bim-color-input @input=${onColorChange} color=#${color.getHexString()}></bim-color-input>        <bim-button label="Clear Colors" @click=${onClearColors}></bim-button>      </bim-panel-section>      <bim-panel-section label="Item Data">        ${nameLabel}      </bim-panel-section>    </bim-panel>  `;}, {});onItemSelected = () => updatePanel();document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to pick objects in the scene using raycasting. Congratulations! Keep exploring more tutorials in the documentation to enhance your skills further.


---

# MODULE: ShadowedScene
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/ShadowedScene

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- ShadowedScene

# ShadowedScene

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

### 🚀 Handling BIM models like a boss​

Flat-lit 3D scenes feel disconnected and hard to read — without shadows, users lose depth cues and the model looks like a technical diagram rather than a real building. The ShadowedScene adds ground shadows that follow the model geometry, making the scene immediately more readable and visually grounded.
This tutorial covers setting up a ShadowedScene in place of the standard scene, configuring shadow cascade and resolution, enabling cast and receive shadows per mesh, and toggling shadows on and off at runtime. By the end, you'll have a BIM scene with live shadows that update as the camera comes to rest.

```typescript
import * as THREE from "three";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a simple scene​

We will start by creating a simple scene with a camera and a renderer. If you don't know how to set up a scene, you can check the Worlds tutorial.

```typescript
const container = document.getElementById("container")!;const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.ShadowedScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.ShadowedScene(components);world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);components.init();world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);const grids = components.get(OBC.Grids);const grid = grids.create(world);// Set up fragments// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});const modelId = "example";const file = await fetch(  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",);const data = await file.arrayBuffer();const buffer = new Uint8Array(data);const model = await fragments.core.load(buffer, {  modelId,  camera: world.camera.three,});world.scene.three.add(model.object);// Set up statsconst stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🧩 Adding some UI​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will create a simple panel with a set of buttons that call the previously defined functions. For more information about the UI library, you can check the specific documentation for it!

```typescript
const panel = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`    <bim-panel active label="Shadowed Scene Tutorial" class="options-menu">      <bim-panel-section>        <bim-button icon="solar:sun-bold" label="Toggle Shadows" @click="${() => {          world.scene.shadowsEnabled = !world.scene.shadowsEnabled;        }}">        </bim-button>      </bim-panel-section>    </bim-panel>    `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### 🎉 Wrap up​

That's it! Now you know how to load, export and dispose Fragments in your app. Fragments are much faster than raw IFC models, so you should definitely store them in your app if you want your users to have a fast loading experience. For bigger models you can use streaming, but that's another tutorial!


---

# MODULE: TechnicalDrawings
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/TechnicalDrawings/

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- TechnicalDrawings

# TechnicalDrawings

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📐 Technical Drawings​

BIM models communicate design intent in 3D, but construction documentation still relies on 2D drawings with precise annotations — wall lengths, clearances, structural spans. Adding those annotations manually to a screenshot loses the connection to the model data and can't be exported to CAD. Technical drawings solve this by anchoring 2D annotation geometry directly in 3D space, on top of projection lines derived from the model, and exporting everything to DXF.
This tutorial covers creating a drawing container in the 3D scene, loading projection lines from a model, registering a linear dimensions system, placing dimensions interactively by clicking projection line segments, rendering text labels on commit, and exporting the result to DXF. By the end, you'll understand the core architecture of the technical drawing system that all the other drawing tutorials build on.

### 🖖 Importing our Libraries​

First, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";// @ts-ignoreimport { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";import { Font } from "three/examples/jsm/loaders/FontLoader.js";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../../index";
```

### 🌎 Setting up the scene​

Nothing special here — just a regular 3D scene with a camera, renderer, and scene.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.SimpleCamera(components);await world.camera.controls.setLookAt(48.213, 33.495, -5.062, 13.117, -1.205, 22.223);components.init();
```

### 🏗️ Loading a BIM model​

A technical drawing is most useful when it has real geometry to annotate. Here we
load the architectural model in Fragment format — a worker-based geometry system
that keeps the main thread free while processing large models. The model gives the
drawing spatial context: the projection lines we'll add later are wall outlines
extracted directly from it.

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});const arqFile = await fetch("https://thatopen.github.io/engine_components/resources/frags/school_arq.frag");const arqBuffer = await arqFile.arrayBuffer();await fragments.core.load(arqBuffer, { modelId: "school_arq" });
```

### 📐 Creating a TechnicalDrawing​

The TechnicalDrawings manager creates and tracks all drawings in your app. Each
drawing is a group that holds all annotation geometry as one unit — moving or
rotating it repositions everything at once, with no extra bookkeeping required.
We also load a pre-computed set of projection lines here — wall outlines already
flattened to the drawing plane. Adding them through the drawing rather than directly
to the scene enables BVH-accelerated raycasting, which is what lets the app snap to
individual segments efficiently. Without it, hit detection degrades to brute-force
across every segment — noticeably slow for dense projections.

```typescript
const techDrawings = components.get(OBC.TechnicalDrawings);// Passing the world configures it automatically: the drawing's group is added to// the scene, its lifecycle is tied to the world, and Three.js rendering layer 1// (where all annotation geometry lives) is enabled on the world camera.const drawing = techDrawings.create(world);drawing.three.position.y = 11.427046;const projData = await fetch("https://thatopen.github.io/engine_components/resources/projections/projection.json").then((r) => r.json()) as { positions: number[] };const projGeo = new THREE.BufferGeometry();projGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(projData.positions), 3));drawing.layers.create("projection", { material: new THREE.LineBasicMaterial({ color: 0xff0000 }) });const projLines = new THREE.LineSegments(projGeo);drawing.addProjectionLines(projLines, "projection");
```

### 🔌 Registering a system and reacting to commits​

Annotation systems are registered once on TechnicalDrawings and work across as
many drawings as you create. Configure styles and event handlers once; they apply
everywhere without any extra bookkeeping per drawing.
The most important thing to understand about annotation systems is that text
rendering is entirely consumer-side. The system stores the measurement data and
fires events when annotations are created, updated, or deleted — but how you turn
that data into visible text is completely up to you. This keeps the core library
free of DOM and font dependencies, so it runs equally well in Node.js and the
browser.
Here we load a TTF font once and generate a label mesh on every commit, then attach
it as a child of the annotation group so it moves, rotates, and disappears together
with the rest of the annotation automatically.

If you need production-ready text labels with correct positioning, rotation, and
multi-style support out of the box, components-front ships a DrawingEditor that
handles all of this for you. What you see here is intentionally minimal — it shows
the pattern, not the full implementation.

```typescript
// Register LinearDimensions once — works across all drawingsconst dims = techDrawings.use(OBC.LinearAnnotations);// Forward reference — onCommit calls updatePanel() but BUI.Component.create()// comes later. It starts as a no-op and gets reassigned after the panel is built.let updatePanel = () => {};let font: Font | null = null;const ttfLoader = new TTFLoader();ttfLoader.load("https://thatopen.github.io/engine_components/resources/fonts/PlusJakartaSans-Medium.ttf", (ttf: any) => {  font = new Font(ttf);});dims.onCommit.add((committed) => {  for (const { item: dim, group } of committed) {    if (!font) continue;    const style = dims.styles.get(dim.style) ?? dims.styles.get("default")!;    const dist = dim.pointA.distanceTo(dim.pointB);    const text = `${dist.toFixed(2)} m`;    const shapes = font.generateShapes(text, style.fontSize);    const geo = new THREE.ShapeGeometry(shapes);    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: style.color, side: THREE.DoubleSide }));    // ShapeGeometry is built in the XY plane; rotating -90° around X maps it to    // the XZ drawing plane so it lies flat on the ground alongside the other geometry.    mesh.rotation.x = -Math.PI / 2;    mesh.layers.set(1);    // Centre the geometry pivot so the label stays centred over its anchor point.    const bbox = new THREE.Box3().setFromObject(mesh);    const bc = bbox.getCenter(new THREE.Vector3());    mesh.position.set(-bc.x, 0, -bc.z);    const ab = new THREE.Vector3().subVectors(dim.pointB, dim.pointA);    const perp = new THREE.Vector3(-ab.z, 0, ab.x).normalize();    const mid = dim.pointA.clone().add(dim.pointB).multiplyScalar(0.5).addScaledVector(perp, dim.offset);    const labelGroup = new THREE.Group();    labelGroup.layers.set(1);    labelGroup.position.copy(mid).addScaledVector(perp, Math.sign(dim.offset) * style.textOffset).setY(0.005);    labelGroup.add(mesh);    group.add(labelGroup);  }  updatePanel();});dims.onDelete.add(() => updatePanel());
```

### 🕹️ Interactive placement via state machine​

Every annotation system in That Open Engine is driven by a state machine. Instead
of managing interaction logic yourself, you feed pointer events to the system and it
handles all state transitions internally. The available events are typed, so
TypeScript tells you exactly what each state accepts.
For linear dimensions, a single click on a projection line locks onto both of its
endpoints at once, then a second click sets how far the dimension line sits from the
measured segment. This is the most natural way to annotate geometry that already
exists in the drawing.
The target drawing is passed only when a dimension is committed — the final click.
This keeps the state machine stateless with respect to drawings, so you can freely
switch which drawing is active between interactions.
We also do our own raycasting against the drawing to find which segment the cursor
is hovering over, and keep a hover highlight updated on every mouse move.

```typescript
// Hover highlight — a single line slightly above Y=0 so it always renders on top.const hoverGeo = new THREE.BufferGeometry().setFromPoints([  new THREE.Vector3(),  new THREE.Vector3(),]);const hoverLine = new THREE.Line(  hoverGeo,  new THREE.LineBasicMaterial({ color: 0x0077ff, depthTest: false }),);hoverLine.layers.set(1);// renderOrder 999 ensures it always draws on top of other annotation geometry.// frustumCulled = false prevents it from disappearing when the endpoints are// near the screen edge and the bounding box falls partially outside the frustum.hoverLine.renderOrder = 999;hoverLine.frustumCulled = false;hoverLine.visible = false;drawing.three.add(hoverLine);
```

To update the highlight and forward cursor positions to the state machine, we need
to translate mouse events into 3D coordinates. One helper maps pixel coordinates to
normalized device coordinates for the raycaster; another projects the resulting ray
onto the drawing's local plane, so positions sent to the state machine are always
expressed in drawing space rather than world space.

```typescript
const raycaster = new THREE.Raycaster();const getNDC = (e: MouseEvent): THREE.Vector2 => {  const rect = container.getBoundingClientRect();  return new THREE.Vector2(    ((e.clientX - rect.left) / rect.width) * 2 - 1,    -((e.clientY - rect.top) / rect.height) * 2 + 1,  );};// Resolve a ray to a point in drawing local space (XZ plane, Y = 0).const _drawingPlane = new THREE.Plane();const getDrawingPoint = (ray: THREE.Ray): THREE.Vector3 => {  const normal = new THREE.Vector3(0, 1, 0).transformDirection(drawing.three.matrixWorld);  const origin = new THREE.Vector3().setFromMatrixPosition(drawing.three.matrixWorld);  _drawingPlane.setFromNormalAndCoplanarPoint(normal, origin);  const worldPt = new THREE.Vector3();  ray.intersectPlane(_drawingPlane, worldPt);  return drawing.three.worldToLocal(worldPt);};
```

With those helpers in place, the event listeners are the glue between raw browser
input and the drawing. On every mouse move we update the hover highlight and, if the
state machine is waiting for an offset position, forward the latest drawing-space
point to it. Clicks and Escape are sent as typed events — the state machine simply
ignores anything that doesn't apply to its current state.
The drawing is passed to both the line-selection event and the final offset click —
the system needs it as soon as placement begins so it can render the live preview
geometry on the right drawing while you move the cursor.

```typescript
container.addEventListener("mousemove", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  const hit = drawing.raycast(raycaster.ray);  if (hit?.line) {    const pos = hoverGeo.attributes.position as THREE.BufferAttribute;    pos.setXYZ(0, hit.line.start.x, 0.01, hit.line.start.z);    pos.setXYZ(1, hit.line.end.x, 0.01, hit.line.end.z);    pos.needsUpdate = true;    hoverLine.visible = true;  } else {    hoverLine.visible = false;  }  if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "MOUSE_MOVE", point: getDrawingPoint(raycaster.ray) });  }});container.addEventListener("mouseleave", () => { hoverLine.visible = false; });document.addEventListener("keydown", (e) => {  if (e.key === "Escape") dims.sendMachineEvent({ type: "ESCAPE" });});container.addEventListener("click", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  const hit = drawing.raycast(raycaster.ray);  if (dims.machineState.kind === "awaitingFirstPoint" && hit?.line) {    // drawing is required here so the system knows where to render the live preview.    dims.sendMachineEvent({ type: "SELECT_LINE", line: hit.line, drawing });    return;  }  if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "CLICK", point: getDrawingPoint(raycaster.ray), drawing });  }});
```

### 📤 Exporting to DXF​

A built-in exporter converts any drawing to a DXF string — the standard format for
technical drawings in CAD applications. All annotation systems are exported
automatically, including their text labels. Here we build the file client-side and
trigger a browser download without any server round-trip.

```typescript
const dxfExporter = components.get(OBC.DxfManager).exporter;const exportDxf = () => {  const dxf = dxfExporter.export([{ drawing, viewports: [{}] }]);  const blob = new Blob([dxf], { type: "application/dxf" });  const url = URL.createObjectURL(blob);  const a = document.createElement("a");  a.href = url;  a.download = "technical-drawing.dxf";  a.click();  URL.revokeObjectURL(url);};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to
our app. We need to initialize it once before creating any components:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more
information about the UI library, you can check the specific documentation for it!

```typescript
const [panel, _updatePanel] = BUI.Component.create<BUI.PanelSection, Record<string, never>>(  (_) => BUI.html`    <bim-panel active label="Technical Drawings" class="options-menu">      <bim-panel-section label="Linear Dimensions">        <bim-label>Hover a projection line to highlight it</bim-label>        <bim-label>Click it to start a dimension</bim-label>        <bim-label>Click again to set the offset distance</bim-label>        <bim-label>Committed: ${drawing.annotations.getBySystem(dims).size}</bim-label>        <bim-label style="width: 14rem; white-space: normal; opacity: 0.6; font-size: 0.8em;">Note: text labels are always horizontal in this example. See components-front for full rotation support.</bim-label>        <bim-button label="Clear all"          @click=${() => { dims.clear([drawing]); updatePanel(); }}>        </bim-button>      </bim-panel-section>      <bim-panel-section label="Export">        <bim-button label="Export DXF" @click=${exportDxf}>        </bim-button>      </bim-panel-section>    </bim-panel>  `,  {},);updatePanel = _updatePanel;document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is
visiting our app from their phone, allowing to show or hide the menu. Otherwise,
the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`    <bim-button class="phone-menu-toggler" icon="solar:settings-bold"      @click="${() => {        if (panel.classList.contains("options-menu-visible")) {          panel.classList.remove("options-menu-visible");        } else {          panel.classList.add("options-menu-visible");        }      }}">    </bim-button>  `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the
performance of our app. We will add it to the top left corner of the viewport.
This way, we'll make sure that the memory consumption and the FPS of our app are
under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! You now know how to create a drawing, register annotation systems,
react to commits for text rendering, feed events to the state machine for
interactive placement, and export to DXF. Check the other examples to go deeper:
custom styles, multi-viewport drawings, and model-driven annotations.


---

# MODULE: AnnotationStyles
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/TechnicalDrawings/AnnotationStyles

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- TechnicalDrawings
- AnnotationStyles

# AnnotationStyles

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 🎨 Annotation Styles​

Dimensions that all look the same make drawings harder to read — architects, structural engineers, and MEP teams each have their own visual conventions for tick marks, colors, and units. Annotation styles let you define those conventions once by name and apply them consistently across every dimension in the drawing.
This tutorial covers registering named styles using all built-in line and mesh tick builders, implementing a fully custom mesh tick builder from scratch, setting per-style measurement units, and switching styles live from a UI dropdown. By the end, you'll have a catalogue of dimension styles — including a custom one — ready to apply to any annotation system.

### 🖖 Importing our Libraries​

First, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";// @ts-ignoreimport { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";import { Font } from "three/examples/jsm/loaders/FontLoader.js";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../../../../index";
```

### 🌎 Setting up the scene​

Nothing special here — just a regular 3D scene. Annotation geometry lives on a
separate layer so it can be toggled independently from model geometry; we need to
make sure the world camera has that layer enabled.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.SimpleCamera(components);await world.camera.controls.setLookAt(48.213, 33.495, -5.062, 13.117, -1.205, 22.223);components.init();
```

### 🏗️ Loading a BIM model​

A technical drawing is most useful when it has real geometry to annotate. We load
the architectural model in Fragment format — a worker-based geometry system that
keeps the main thread free while processing large models. The drawing's Y position
is aligned to the floor cut plane used when generating the projection lines, so the
wall outlines land exactly where they should in the scene.

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});const arqFile = await fetch("https://thatopen.github.io/engine_components/resources/frags/school_arq.frag");const arqBuffer = await arqFile.arrayBuffer();await fragments.core.load(arqBuffer, { modelId: "school_arq" });
```

### 📐 Creating the drawing and loading projection lines​

We create the drawing, align its Y position to the floor cut plane, and load a
pre-computed set of projection lines — wall outlines already flattened to the
drawing plane — onto a named layer, then register the linear dimensions system
that we'll style in the next sections.

```typescript
const techDrawings = components.get(OBC.TechnicalDrawings);const drawing = techDrawings.create(world);drawing.three.position.y = 11.427046;const projData = await fetch("https://thatopen.github.io/engine_components/resources/projections/projection.json").then((r) =>  r.json(),) as { positions: number[] };const projGeo = new THREE.BufferGeometry();projGeo.setAttribute(  "position",  new THREE.BufferAttribute(new Float32Array(projData.positions), 3),);drawing.layers.create("projection", { material: new THREE.LineBasicMaterial({ color: 0xff0000 }) });const projLines = new THREE.LineSegments(projGeo);drawing.addProjectionLines(projLines, "projection");const dims = techDrawings.use(OBC.LinearAnnotations);
```

### 🎨 Registering styles with built-in tick builders​

The dimensions system already comes with a default style pre-registered. You can
add more named styles at any time — they are plain objects, so there is no
boilerplate. The library ships several line tick builders and filled (mesh) tick
builders ready to combine. Here we register one style per builder so you can
switch between them from the panel and see how each looks on the drawing. For the
filled shapes, the line tick is suppressed so only the solid mark appears at each
endpoint — the same technique used any time you want a mesh-only endpoint.

```typescript
const baseStyle = {  tickSize: 0.4,  extensionGap: 0.05,  extensionOvershoot: 0.2,  textOffset: 0.4,  fontSize: 0.45,};dims.styles.set("arrow",         { ...baseStyle, lineTick: OBC.ArrowTick,    color: 0x0055ff });dims.styles.set("dot",           { ...baseStyle, lineTick: OBC.DotTick,      color: 0x009999 });dims.styles.set("none",          { ...baseStyle, lineTick: OBC.NoTick,       color: 0x00aa44 });dims.styles.set("filled-arrow",  { ...baseStyle, lineTick: OBC.NoTick, meshTick: OBC.FilledArrowTick,  color: 0xff6600 });dims.styles.set("filled-circle", { ...baseStyle, lineTick: OBC.NoTick, meshTick: OBC.FilledCircleTick, color: 0xaa00cc });dims.styles.set("filled-square", { ...baseStyle, lineTick: OBC.NoTick, meshTick: OBC.FilledSquareTick, color: 0xcc0044 });
```

### 🔷 Creating a custom mesh tick builder​

A mesh tick builder has the same inputs as a line tick builder, but returns
coordinates for non-indexed triangles instead of line segments — every three
triplets form one filled triangle. This lets you render a solid shape at the
endpoint, which is something you can't achieve with line geometry alone.
Here we implement a diamond tick (a rhombus pointing toward the endpoint).
We suppress the line tick so only the solid diamond appears — giving the dimension
a clean, filled mark with no line arrowhead on top.

If you want both a line mark and a filled shape at the same endpoint, just supply
both builders in the style — they render independently and compose naturally.

```typescript
const DiamondTick: OBC.MeshTickBuilder = (tip, lineDir, size) => {  const perp  = new THREE.Vector3(-lineDir.z, 0, lineDir.x);  const mid   = tip.clone().addScaledVector(lineDir, -size * 0.5);  const back  = tip.clone().addScaledVector(lineDir, -size);  const left  = mid.clone().addScaledVector(perp, -size * 0.3);  const right = mid.clone().addScaledVector(perp,  size * 0.3);  // Two triangles: tip→left→back and tip→back→right.  return [    tip.x,   tip.y,   tip.z,   left.x,  left.y,  left.z,  back.x,  back.y,  back.z,    tip.x,   tip.y,   tip.z,   back.x,  back.y,  back.z,  right.x, right.y, right.z,  ];};
```

### 📐 Registering the custom style​

With the builder ready we register the custom style exactly as we did for the
built-in ones. We also set a unit on this style — annotations can display
measurements in any unit you like, and the library ships several common presets
ready to use. You can also supply your own by providing a conversion factor and
a display suffix.

```typescript
dims.styles.set("custom", {  lineTick: OBC.NoTick,  meshTick: DiamondTick,  tickSize: 0.4,  extensionGap: 0.05,  extensionOvershoot: 0.2,  color: 0xff6600,  textOffset: 0.4,  fontSize: 0.45,  unit: OBC.Units.cm,});
```

### 🔤 Reacting to commits — rendering text labels​

Text rendering is consumer-side — the system fires commit events with the
measurement data and we build the label geometry ourselves. Here we await the
font load as a proper promise rather than holding a nullable reference, so the
font is guaranteed to be ready the moment any dimension is committed.

```typescript
// Forward reference — onCommit calls updatePanel() but BUI.Component.create()// comes later. It starts as a no-op and gets reassigned after the panel is built.let updatePanel = () => {};const ttfLoader = new TTFLoader();const font: Font = await new Promise((resolve) => {  ttfLoader.load("https://thatopen.github.io/engine_components/resources/fonts/PlusJakartaSans-Medium.ttf", (ttf: any) => {    resolve(new Font(ttf));  });});dims.onCommit.add((committed) => {  for (const { item: dim, group } of committed) {    const style = dims.styles.get(dim.style) ?? dims.styles.get("default")!;    const unit  = style.unit ?? OBC.Units.m;    const text  = `${(dim.pointA.distanceTo(dim.pointB) * unit.factor).toFixed(2)} ${unit.suffix}`;    const shapes = font.generateShapes(text, style.fontSize);    const geo    = new THREE.ShapeGeometry(shapes);    const mesh   = new THREE.Mesh(      geo,      new THREE.MeshBasicMaterial({ color: style.color, side: THREE.DoubleSide }),    );    // ShapeGeometry is built in the XY plane; rotating -90° around X maps it to    // the XZ drawing plane so it lies flat on the ground alongside the other geometry.    mesh.rotation.x = -Math.PI / 2;    mesh.layers.set(1);    // Centre the geometry pivot so the label stays centred over its anchor point.    const bbox = new THREE.Box3().setFromObject(mesh);    const bc   = bbox.getCenter(new THREE.Vector3());    mesh.position.set(-bc.x, 0, -bc.z);    const ab   = new THREE.Vector3().subVectors(dim.pointB, dim.pointA);    const perp = new THREE.Vector3(-ab.z, 0, ab.x).normalize();    const mid  = dim.pointA.clone().add(dim.pointB).multiplyScalar(0.5)      .addScaledVector(perp, dim.offset);    const labelGroup = new THREE.Group();    labelGroup.layers.set(1);    labelGroup.position      .copy(mid)      .addScaledVector(perp, Math.sign(dim.offset) * style.textOffset)      .setY(0.005);    labelGroup.add(mesh);    group.add(labelGroup);  }  updatePanel();});dims.onDelete.add(() => updatePanel());
```

### 🖱️ Interactive placement​

To try the styles live we need a hover highlight and the standard event wiring. The
hover highlight tracks the projection line under the cursor so the user knows what
will be snapped; the event listeners route clicks and key presses to the state
machine. The style-specific detail worth noting: whichever style is active in the
dropdown at the moment the second click lands is the one recorded on the dimension —
switching styles mid-placement is perfectly valid.

```typescript
const hoverGeo  = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);const hoverLine = new THREE.Line(  hoverGeo,  new THREE.LineBasicMaterial({ color: 0x0077ff, depthTest: false }),);hoverLine.layers.set(1);// renderOrder 999 ensures it always draws on top of other annotation geometry.// frustumCulled = false prevents it from disappearing when the endpoints are// near the screen edge and the bounding box falls partially outside the frustum.hoverLine.renderOrder = 999;hoverLine.frustumCulled = false;hoverLine.visible = false;drawing.three.add(hoverLine);const raycaster    = new THREE.Raycaster();const _drawingPlane = new THREE.Plane();const getNDC = (e: MouseEvent): THREE.Vector2 => {  const rect = container.getBoundingClientRect();  return new THREE.Vector2(    ((e.clientX - rect.left) / rect.width)  *  2 - 1,    -((e.clientY - rect.top)  / rect.height) *  2 + 1,  );};const getDrawingPoint = (ray: THREE.Ray): THREE.Vector3 => {  const normal = new THREE.Vector3(0, 1, 0).transformDirection(drawing.three.matrixWorld);  const origin = new THREE.Vector3().setFromMatrixPosition(drawing.three.matrixWorld);  _drawingPlane.setFromNormalAndCoplanarPoint(normal, origin);  const worldPt = new THREE.Vector3();  ray.intersectPlane(_drawingPlane, worldPt);  return drawing.three.worldToLocal(worldPt);};container.addEventListener("mousemove", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  const hit = drawing.raycast(raycaster.ray);  if (hit?.line) {    const pos = hoverGeo.attributes.position as THREE.BufferAttribute;    pos.setXYZ(0, hit.line.start.x, 0.01, hit.line.start.z);    pos.setXYZ(1, hit.line.end.x,   0.01, hit.line.end.z);    pos.needsUpdate = true;    hoverLine.visible = true;  } else {    hoverLine.visible = false;  }  if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "MOUSE_MOVE", point: getDrawingPoint(raycaster.ray) });  }});container.addEventListener("mouseleave", () => { hoverLine.visible = false; });document.addEventListener("keydown", (e) => {  if (e.key === "Escape") dims.sendMachineEvent({ type: "ESCAPE" });});container.addEventListener("click", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  const hit = drawing.raycast(raycaster.ray);  if (dims.machineState.kind === "awaitingFirstPoint" && hit?.line) {    dims.sendMachineEvent({ type: "SELECT_LINE", line: hit.line, drawing });    return;  }  if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "CLICK", point: getDrawingPoint(raycaster.ray), drawing });  }});
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to
our app. We need to initialize it once before creating any components:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more
information about the UI library, you can check the specific documentation for it!

```typescript
const styleNames = ["default", "arrow", "dot", "none", "filled-arrow", "filled-circle", "filled-square", "custom"];const [panel, _updatePanel] = BUI.Component.create<  BUI.PanelSection,  Record<string, never>>(  (_) => BUI.html`    <bim-panel active label="Annotation Styles" class="options-menu">      <bim-panel-section label="Linear Dimensions">        <bim-label>Hover a projection line, then click to place a dimension</bim-label>        <bim-label>Committed: ${drawing.annotations.getBySystem(dims).size}</bim-label>        <bim-dropdown          label="Active style"          @change=${(e: any) => { dims.activeStyle = e.target.value[0]; }}>          ${styleNames.map(            (name) => BUI.html`              <bim-option label=${name} value=${name}                ?checked=${dims.activeStyle === name}>              </bim-option>`,          )}        </bim-dropdown>        <bim-button label="Clear all"          @click=${() => { dims.clear(); updatePanel(); }}>        </bim-button>      </bim-panel-section>    </bim-panel>  `,  {},);updatePanel = _updatePanel;document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is
visiting our app from their phone, allowing to show or hide the menu. Otherwise,
the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => BUI.html`  <bim-button class="phone-menu-toggler" icon="solar:settings-bold"    @click="${() => {      if (panel.classList.contains("options-menu-visible")) {        panel.classList.remove("options-menu-visible");      } else {        panel.classList.add("options-menu-visible");      }    }}">  </bim-button>`);document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the
performance of our app. We will add it to the top left corner of the viewport.
This way, we'll make sure that the memory consumption and the FPS of our app are
under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! You now know how to register named styles, use the built-in tick
builders, and implement your own from scratch. Both flavours are just plain
functions — plug them into any style and they integrate with rendering, picking,
and DXF export exactly like the built-in ones. Head to the next examples to
learn about multiple viewports and model-driven annotations.


---

# MODULE: AnnotationSystems
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/TechnicalDrawings/AnnotationSystems

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- TechnicalDrawings
- AnnotationSystems

# AnnotationSystems

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 🔖 Annotation Systems​

A technical drawing typically needs more than one type of annotation — wall lengths require linear dimensions, corners need angle dimensions, and specific elements need callout leaders. Managing multiple annotation tools at once, each with its own interaction flow, can quickly turn into a tangle of event handlers and state. Annotation systems solve this by encapsulating each tool's state machine independently, so they can coexist on the same drawing with a single shared input dispatcher.
This tutorial covers registering linear, leader, and angle annotation systems on the same drawing, wiring a single set of mouse and keyboard events to route input to whichever tool is active, rendering text labels on commit for each system, and switching between tools from a UI dropdown. By the end, you'll have a multi-tool annotation setup ready to place dimensions, leaders, and angles on any technical drawing.

### 🖖 Importing our Libraries​

First, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";// @ts-ignoreimport { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";import { Font } from "three/examples/jsm/loaders/FontLoader.js";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../../../../index";
```

### 🌎 Setting up the scene​

Nothing special here — just a regular 3D scene. Annotation geometry lives on a
separate layer so it can be toggled independently from model geometry; we need to
make sure the world camera has that layer enabled.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.SimpleCamera(components);await world.camera.controls.setLookAt(48.213, 33.495, -5.062, 13.117, -1.205, 22.223);components.init();
```

### 🏗️ Loading a BIM model​

A technical drawing is most useful when it has real geometry to annotate. We load
the architectural model in Fragment format — a worker-based geometry system that
keeps the main thread free while processing large models. The drawing's Y position
is aligned to the floor cut plane used when generating the projection lines, so the
wall outlines land exactly where they should in the scene.

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});const arqFile = await fetch("https://thatopen.github.io/engine_components/resources/frags/school_arq.frag");const arqBuffer = await arqFile.arrayBuffer();await fragments.core.load(arqBuffer, { modelId: "school_arq" });
```

### 📐 Creating the drawing and loading projection lines​

We create the drawing, align its Y position to the floor cut plane, and load a
pre-computed set of projection lines — wall outlines already flattened to the
drawing plane — onto a named layer. Two of the three systems snap to these lines
when the user clicks, so they are the geometry the placement workflows pivot around.

```typescript
const techDrawings = components.get(OBC.TechnicalDrawings);const drawing = techDrawings.create(world);drawing.three.position.y = 11.427046;const projData = await fetch("https://thatopen.github.io/engine_components/resources/projections/projection.json").then((r) =>  r.json(),) as { positions: number[] };const projGeo = new THREE.BufferGeometry();projGeo.setAttribute(  "position",  new THREE.BufferAttribute(new Float32Array(projData.positions), 3),);drawing.layers.create("projection", { material: new THREE.LineBasicMaterial({ color: 0xff0000 }) });const projLines = new THREE.LineSegments(projGeo);drawing.addProjectionLines(projLines, "projection");
```

### 🔌 Registering the systems​

Three systems, three lines — each registered independently on the same drawing.
Their geometry coexists in the same container group with no extra scene management
needed.

```typescript
const dims     = techDrawings.use(OBC.LinearAnnotations);const leaders  = techDrawings.use(OBC.LeaderAnnotations);const angleDims = techDrawings.use(OBC.AngleAnnotations);
```

### 🔤 Text labels​

All three systems render lines and ticks, but text labels are always your
responsibility as the consumer — you generate them in the commit handler and attach
them to the annotation group so they move, hide, and delete together with the
geometry automatically. We load a single font here and share it across all systems.

```typescript
let font: Font | null = null;const ttfLoader = new TTFLoader();ttfLoader.load("https://thatopen.github.io/engine_components/resources/fonts/PlusJakartaSans-Medium.ttf", (ttf: any) => {  font = new Font(ttf);});const createTextMesh = (  text: string,  fontSize: number,  color: number,): THREE.Mesh | null => {  if (!font) return null;  const shapes = font.generateShapes(text, fontSize);  const geo    = new THREE.ShapeGeometry(shapes);  const mesh   = new THREE.Mesh(    geo,    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),  );  // ShapeGeometry is built in the XY plane; rotating −90° around X maps it to  // the XZ drawing plane so it lies flat alongside the annotation geometry.  mesh.rotation.x = -Math.PI / 2;  mesh.layers.set(1);  // Centre the pivot so the label stays centred over its anchor point.  const bbox = new THREE.Box3().setFromObject(mesh);  const bc   = bbox.getCenter(new THREE.Vector3());  mesh.position.set(-bc.x, 0, -bc.z);  return mesh;};// Forward reference — commit handlers call updatePanel() but// BUI.Component.create() comes later. Starts as a no-op, reassigned after the panel.let updatePanel = () => {};dims.onCommit.add((committed) => {  for (const { item: dim, group } of committed) {    const style = dims.styles.get(dim.style) ?? dims.styles.get("default")!;    const text  = `${dim.pointA.distanceTo(dim.pointB).toFixed(2)} m`;    const mesh  = createTextMesh(text, style.fontSize, style.color);    if (!mesh) continue;    const ab   = new THREE.Vector3().subVectors(dim.pointB, dim.pointA);    const perp = new THREE.Vector3(-ab.z, 0, ab.x).normalize();    const mid  = dim.pointA.clone().add(dim.pointB).multiplyScalar(0.5)      .addScaledVector(perp, dim.offset);    const g = new THREE.Group();    g.layers.set(1);    g.position.copy(mid)      .addScaledVector(perp, Math.sign(dim.offset) * style.textOffset)      .setY(0.005);    g.add(mesh);    group.add(g);  }  updatePanel();});leaders.onCommit.add((committed) => {  for (const { item: ann, group } of committed) {    const style  = leaders.styles.get(ann.style) ?? leaders.styles.get("default")!;    const extDir = new THREE.Vector3()      .subVectors(ann.extensionEnd, ann.elbow)      .setY(0)      .normalize();    const mesh = createTextMesh(ann.text, style.fontSize, style.color);    if (!mesh) continue;    // Offset by the text's half-extent in the extension direction so the near    // edge of the label starts at textOffset — never overlapping the line.    const size = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());    const halfExtent = Math.abs(extDir.x) * (size.x / 2) + Math.abs(extDir.z) * (size.z / 2);    const g = new THREE.Group();    g.layers.set(1);    g.position.copy(ann.extensionEnd)      .addScaledVector(extDir, style.textOffset + halfExtent)      .setY(0.005);    g.add(mesh);    group.add(g);  }  updatePanel();});angleDims.onCommit.add((committed) => {  for (const { item: dim, group } of committed) {    const style    = angleDims.styles.get(dim.style) ?? angleDims.styles.get("default")!;    const angleRad = OBC.computeAngle(dim);    const text     = `${THREE.MathUtils.radToDeg(angleRad).toFixed(1)}°`;    const bisector = OBC.computeBisectorAngle(dim);    const radius   = dim.arcRadius + style.textOffset;    const mesh = createTextMesh(text, style.fontSize, style.color);    if (!mesh) continue;    const g = new THREE.Group();    g.layers.set(1);    g.position.set(      dim.vertex.x + Math.cos(bisector) * radius,      0.005,      dim.vertex.z + Math.sin(bisector) * radius,    );    g.add(mesh);    group.add(g);  }  updatePanel();});
```

### 🎯 Hover highlight and shared utilities​

Linear dimensions and angle dimensions both snap to projection lines, so we add a
highlight that follows the cursor and lights up whichever line is beneath it. We
also set up the raycaster and two coordinate helpers that all three state machines
share.

```typescript
const raycaster     = new THREE.Raycaster();const _drawingPlane = new THREE.Plane();const getNDC = (e: MouseEvent): THREE.Vector2 => {  const rect = container.getBoundingClientRect();  return new THREE.Vector2(    ((e.clientX - rect.left) / rect.width)  *  2 - 1,    -((e.clientY - rect.top)  / rect.height) *  2 + 1,  );};const getDrawingPoint = (ray: THREE.Ray): THREE.Vector3 => {  const normal = new THREE.Vector3(0, 1, 0).transformDirection(    drawing.three.matrixWorld,  );  const origin = new THREE.Vector3().setFromMatrixPosition(    drawing.three.matrixWorld,  );  _drawingPlane.setFromNormalAndCoplanarPoint(normal, origin);  const worldPt = new THREE.Vector3();  ray.intersectPlane(_drawingPlane, worldPt);  return drawing.three.worldToLocal(worldPt);};const hoverGeo  = new THREE.BufferGeometry().setFromPoints([  new THREE.Vector3(),  new THREE.Vector3(),]);const hoverLine = new THREE.Line(  hoverGeo,  new THREE.LineBasicMaterial({ color: 0x0077ff, depthTest: false }),);hoverLine.layers.set(1);// renderOrder 999 ensures it always draws on top of other annotation geometry.// frustumCulled = false prevents it from disappearing when the endpoints are// near the screen edge and the bounding box falls partially outside the frustum.hoverLine.renderOrder = 999;hoverLine.frustumCulled = false;hoverLine.visible = false;drawing.three.add(hoverLine);
```

### 📏 Linear dimensions​

The first click snaps to a projection line and locks the two measured endpoints.
Moving the cursor then drags the dimension line along the perpendicular; a second
click commits it at the current offset. Hovering before the first click shows which
segment would be picked.

```typescript
type ActiveTool = "linear" | "leader" | "angle" | null;let activeTool: ActiveTool = null;const handleLinearMove = (  _hit: OBC.DrawingIntersection | null,  ray: THREE.Ray,): void => {  if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "MOUSE_MOVE", point: getDrawingPoint(ray) });  }};const handleLinearClick = (  hit: OBC.DrawingIntersection | null,  ray: THREE.Ray,): void => {  if (dims.machineState.kind === "awaitingFirstPoint" && hit?.line) {    dims.sendMachineEvent({ type: "SELECT_LINE", line: hit.line, drawing });  } else if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "CLICK", point: getDrawingPoint(ray), drawing });  }};
```

### 🏷️ Leader annotations​

Leaders are placed freely — no snapping needed. Three successive clicks set the
arrow tip, the bend point, and the far end of the extension. After the third click
the state machine enters a text-entry state; we listen to that transition and call
the browser prompt immediately so the flow feels like one uninterrupted gesture.

```typescript
leaders.onMachineStateChanged.add((state: OBC.LeaderAnnotationState) => {  if (state.kind !== "enteringText") return;  const text = window.prompt("Label text:") ?? "";  leaders.sendMachineEvent(    text.trim()      ? { type: "SUBMIT_TEXT", text: text.trim() }      : { type: "ESCAPE" },  );});const handleLeaderMove = (ray: THREE.Ray): void => {  const s = leaders.machineState;  if (s.kind === "placingElbow" || s.kind === "placingExtension") {    leaders.sendMachineEvent({ type: "MOUSE_MOVE", point: getDrawingPoint(ray) });  }};const handleLeaderClick = (ray: THREE.Ray): void => {  const s = leaders.machineState;  if (    s.kind === "awaitingArrowTip" ||    s.kind === "placingElbow"     ||    s.kind === "placingExtension"  ) {    leaders.sendMachineEvent({ type: "CLICK", point: getDrawingPoint(ray), drawing });  }};
```

### 📐 Angle dimensions​

Angle dimensions share the hover-and-snap mechanic with linear ones: two projection-
line clicks define the two arms, and the system computes their intersection as the
vertex automatically. After both lines are selected, moving the cursor sets the arc
radius; a final click commits.

```typescript
const handleAngleMove = (  hit: OBC.DrawingIntersection | null,  ray: THREE.Ray,): void => {  const s = angleDims.machineState;  if (s.kind === "awaitingFirstLine" || s.kind === "committed") return;  angleDims.sendMachineEvent({    type: "MOUSE_MOVE",    point: getDrawingPoint(ray),    line:  hit?.line ?? undefined,  });};const handleAngleClick = (  hit: OBC.DrawingIntersection | null,  ray: THREE.Ray,): void => {  const s = angleDims.machineState;  if (    (s.kind === "awaitingFirstLine" || s.kind === "awaitingSecondLine") &&    hit?.line  ) {    // Snap to the closest point on the hit line so the arm direction is exact.    const snapped = new THREE.Vector3();    hit.line.closestPointToPoint(hit.point, true, snapped);    angleDims.sendMachineEvent({ type: "CLICK", point: snapped, line: hit.line, drawing });  } else if (s.kind === "positioningArc") {    angleDims.sendMachineEvent({ type: "CLICK", point: getDrawingPoint(ray), drawing });  }};
```

### 🖱️ Wiring the event listeners​

A single set of DOM listeners drives all three systems. The active tool decides
which handler gets each event, and Escape resets every system at once so there is
never any ambiguous state left behind when the user switches tools.

```typescript
container.addEventListener("mousemove", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  const hit = drawing.raycast(raycaster.ray);  // Hover highlight — only relevant for the two systems that snap to lines.  if (hit?.line && (activeTool === "linear" || activeTool === "angle")) {    const pos = hoverGeo.attributes.position as THREE.BufferAttribute;    pos.setXYZ(0, hit.line.start.x, 0.01, hit.line.start.z);    pos.setXYZ(1, hit.line.end.x,   0.01, hit.line.end.z);    pos.needsUpdate = true;    hoverLine.visible = true;  } else {    hoverLine.visible = false;  }  if (activeTool === "linear") handleLinearMove(hit, raycaster.ray);  if (activeTool === "leader") handleLeaderMove(raycaster.ray);  if (activeTool === "angle")  handleAngleMove(hit, raycaster.ray);});container.addEventListener("mouseleave", () => { hoverLine.visible = false; });container.addEventListener("click", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  const hit = drawing.raycast(raycaster.ray);  if (activeTool === "linear") handleLinearClick(hit, raycaster.ray);  if (activeTool === "leader") handleLeaderClick(raycaster.ray);  if (activeTool === "angle")  handleAngleClick(hit, raycaster.ray);});document.addEventListener("keydown", (e) => {  if (e.key !== "Escape") return;  dims.sendMachineEvent({ type: "ESCAPE" });  leaders.sendMachineEvent({ type: "ESCAPE" });  angleDims.sendMachineEvent({ type: "ESCAPE" });  hoverLine.visible = false;});
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to
our app. We need to initialize it once before creating any components:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more
information about the UI library, you can check the specific documentation for it!

```typescript
const [panel, _updatePanel] = BUI.Component.create<  BUI.PanelSection,  Record<string, never>>(  (_) => BUI.html`    <bim-panel active label="Annotation Systems" class="options-menu">      <bim-panel-section label="Active Tool">        <bim-dropdown label="Tool"          @change=${(e: any) => {            const val = e.target.value[0] as string;            activeTool = (val || null) as ActiveTool;            // Reset all systems when switching so no placement is left dangling.            dims.sendMachineEvent({ type: "ESCAPE" });            leaders.sendMachineEvent({ type: "ESCAPE" });            angleDims.sendMachineEvent({ type: "ESCAPE" });            hoverLine.visible = false;          }}>          <bim-option label="None"               value=""       ?checked=${!activeTool}></bim-option>          <bim-option label="Linear Dimension"   value="linear" ?checked=${activeTool === "linear"}></bim-option>          <bim-option label="Leader Annotation"  value="leader" ?checked=${activeTool === "leader"}></bim-option>          <bim-option label="Angle Dimension"    value="angle"  ?checked=${activeTool === "angle"}></bim-option>        </bim-dropdown>      </bim-panel-section>      <bim-panel-section label="Annotations">        <bim-label>Linear: ${drawing.annotations.getBySystem(dims).size} · Leader: ${drawing.annotations.getBySystem(leaders).size} · Angle: ${drawing.annotations.getBySystem(angleDims).size}</bim-label>        <bim-button label="Clear all"          @click=${() => {            dims.clear();            leaders.clear();            angleDims.clear();            updatePanel();          }}>        </bim-button>      </bim-panel-section>    </bim-panel>  `,  {},);updatePanel = _updatePanel;document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is
visiting our app from their phone, allowing to show or hide the menu. Otherwise,
the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => BUI.html`  <bim-button class="phone-menu-toggler" icon="solar:settings-bold"    @click="${() => {      if (panel.classList.contains("options-menu-visible")) {        panel.classList.remove("options-menu-visible");      } else {        panel.classList.add("options-menu-visible");      }    }}">  </bim-button>`);document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the
performance of our app. We will add it to the top left corner of the viewport.
This way, we'll make sure that the memory consumption and the FPS of our app are
under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! The routing pattern is the key takeaway: each system owns its state
machine and the DOM events simply forward to whichever one is active. Adding a
fourth system — built-in or custom — means registering it on the drawing and adding
one branch to the dispatcher. Head to the next examples to learn about styles,
custom systems, and model-driven annotations.


---

# MODULE: CustomAnnotationSystems
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/TechnicalDrawings/CustomAnnotationSystems

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- TechnicalDrawings
- CustomAnnotationSystems

# CustomAnnotationSystems

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 🔧 Custom Annotation Systems​

The built-in annotation systems cover the most common cases, but every project eventually needs something specific — a custom symbol, a domain marker, a notation type that doesn't exist in the library. Without a clear extension point, that means working around the system instead of with it. The annotation system abstract base provides exactly that: a structural contract that makes custom systems first-class citizens, fully integrated with the drawing manager, the DXF exporter, and the interactive state machine.
This tutorial covers implementing a custom CrossMarkers annotation system from scratch — defining its data types, state machine, geometry builder, handle picker, live preview, and DXF exporter registration. By the end, you'll have a template for building any custom annotation type that plugs into the engine exactly like the built-in ones.

### 🖖 Importing our Libraries​

First, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../../../../index";
```

### 🌎 Setting up the scene​

Nothing special here — just a regular 3D scene. Annotation geometry lives on a
separate layer so it can be toggled independently from model geometry; we need to
make sure the world camera has that layer enabled.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.SimpleCamera(components);await world.camera.controls.setLookAt(48.213, 33.495, -5.062, 13.117, -1.205, 22.223);components.init();
```

### 🏗️ Loading a BIM model​

A technical drawing is most useful when it has real geometry to annotate. We load
the architectural model in Fragment format — a worker-based geometry system that
keeps the main thread free while processing large models. The drawing's Y position
is aligned to the floor cut plane used when generating the projection lines, so the
wall outlines land exactly where they should in the scene.

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});const arqFile = await fetch("https://thatopen.github.io/engine_components/resources/frags/school_arq.frag");const arqBuffer = await arqFile.arrayBuffer();await fragments.core.load(arqBuffer, { modelId: "school_arq" });
```

### 📐 Creating the drawing and loading projection lines​

We create the drawing, align its Y position to the floor cut plane, and load a
pre-computed set of projection lines — wall outlines already flattened to the
drawing plane — onto a named layer so there is some geometry to look at while
we explore custom systems.

```typescript
const techDrawings = components.get(OBC.TechnicalDrawings);const drawing = techDrawings.create(world);drawing.three.position.y = 11.427046;const projData = await fetch("https://thatopen.github.io/engine_components/resources/projections/projection.json").then((r) =>  r.json(),) as { positions: number[] };const projGeo = new THREE.BufferGeometry();projGeo.setAttribute(  "position",  new THREE.BufferAttribute(new Float32Array(projData.positions), 3),);drawing.layers.create("projection", { material: new THREE.LineBasicMaterial({ color: 0xff0000 }) });const projLines = new THREE.LineSegments(projGeo);drawing.addProjectionLines(projLines, "projection");
```

### 🔧 Defining a custom annotation system​

The abstract base class handles the full CRUD lifecycle — adding, updating,
deleting, clearing, picking, disposing, and material caching are all provided out
of the box. To build a custom system you only need to implement two things:
geometry construction for a single item, and handle-picking for interactive
editing. Everything else — storing the data, managing Three.js groups, and
cleaning up on dispose — happens automatically.
Optionally, override the preview update hook to drive a live cursor-follow object
while the state machine is waiting for input.

#### Types​

```typescript
interface CrossMarkerStyle extends OBC.BaseAnnotationStyle {  /** Half-length of each bar of the cross, in drawing local units. lineSize: number;}interface CrossMarker {  uuid:     string;  position: THREE.Vector3;  style:    string;}interface CrossMarkerData {  position: THREE.Vector3;  style?:   string;}interface CrossMarkerSystem extends OBC.DrawingSystemDescriptor {  item:   CrossMarker;  data:   CrossMarkerData;  style:  CrossMarkerStyle;  handle: never;}
```

#### State machine​

Our system has a single interactive state with a nullable preview position — the
simplest possible state machine, but it demonstrates the full pattern. The events
carry an optional drawing reference so the system knows which drawing to commit
to on click — the same convention used by all built-in systems.

```typescript
type CrossMarkerState = { kind: "awaitingPoint"; preview: THREE.Vector3 | null };type CrossMarkerEvent =  | { type: "MOUSE_MOVE"; point: THREE.Vector3; drawing?: OBC.TechnicalDrawing }  | { type: "CLICK";      point: THREE.Vector3; drawing?: OBC.TechnicalDrawing }  | { type: "ESCAPE" };function crossMarkerMachine(  state: CrossMarkerState,  event: CrossMarkerEvent,): CrossMarkerState {  switch (state.kind) {    case "awaitingPoint": {      if (event.type === "MOUSE_MOVE") {        return { kind: "awaitingPoint", preview: event.point.clone().setY(0) };      }      if (event.type === "ESCAPE") {        return { kind: "awaitingPoint", preview: null };      }      // CLICK does not change state — handled in sendMachineEvent().      return state;    }  }}
```

#### The CrossMarkers class​

The class extends the abstract drawing system base and implements the state
machine interface. The constructor receives Components (not a drawing), so the
system is a global singleton: one instance shared across all drawings, with data
stored per-drawing inside the drawing itself.

```typescript
class CrossMarkers  extends OBC.AnnotationSystem<CrossMarkerSystem>  implements OBC.Transitionable<CrossMarkerState, CrossMarkerEvent>, OBC.Disposable{  enabled = true;  // ── State machine ──────────────────────────────────────────────────────────  machineState: CrossMarkerState = { kind: "awaitingPoint", preview: null };  readonly onMachineStateChanged = new OBC.Event<CrossMarkerState>();  constructor(components: OBC.Components) {    super(components);    this.styles.set("default",  { color: 0xff6600, textOffset: 0, fontSize: 0, lineSize: 0.25 });    this.styles.set("emphasis", { color: 0x0066ff, textOffset: 0, fontSize: 0, lineSize: 0.45 });    // Preview geometry: 4 vertices (two line segments) updated on every MOUSE_MOVE.    // Configured here; attached to a drawing the first time a MOUSE_MOVE arrives.    const geo = new THREE.BufferGeometry();    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12), 3));    this._previewObject = new THREE.LineSegments(geo, this._previewMaterial);    this._previewObject.userData.isDimension = true;    this._previewObject.layers.set(1);    // renderOrder 999 ensures it always draws on top of other annotation geometry.    // frustumCulled = false prevents it from disappearing when endpoints are near the screen edge.    this._previewObject.renderOrder = 999;    this._previewObject.frustumCulled = false;    this._previewObject.visible = false;    // Override the base preview material colour to distinguish it from committed geometry.    this._previewMaterial.color.setHex(0x0077ff);    this._previewMaterial.transparent = true;    this._previewMaterial.opacity = 0.5;  }  // ── Transitionable ─────────────────────────────────────────────────────────  sendMachineEvent(event: CrossMarkerEvent): void {    const eventDrawing = (event as { drawing?: OBC.TechnicalDrawing }).drawing ?? null;    if (eventDrawing) this._previewDrawing = eventDrawing;    // Commit before transitioning so the preview stays at the clicked position    // until the next MOUSE_MOVE arrives.    if (event.type === "CLICK" && this._previewDrawing) {      this.add(this._previewDrawing, { position: event.point.clone().setY(0) });    }    const next = crossMarkerMachine(this.machineState, event);    if (next !== this.machineState) {      this.machineState = next;      this._updatePreview();      this.onMachineStateChanged.trigger(this.machineState);    }  }  // ── AnnotationSystem abstract ──────────────────────────────────────────────  protected _buildGroup(marker: CrossMarker, style: CrossMarkerStyle): THREE.Group {    const { x, z } = marker.position;    const s = style.lineSize;    const positions = new Float32Array([      x - s, 0, z,     x + s, 0, z,    // horizontal bar      x,     0, z - s, x,     0, z + s, // vertical bar    ]);    const geo = new THREE.BufferGeometry();    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));    const ls = new THREE.LineSegments(geo, this._getMaterial(marker.style));    // Exporters traverse children looking for this flag.    ls.userData.isDimension = true;    ls.layers.set(1);    const group = new THREE.Group();    group.add(ls);    return group;  }  pickHandle(    drawing: OBC.TechnicalDrawing,    ray: THREE.Ray,    threshold = 0.15,  ): { uuid: string; handle: never } | null {    // Simple point-to-ray check for the cross centres.    for (const [uuid, entry] of drawing.annotations) {      if (entry.system !== (this as any)) continue;      const marker = entry.data as CrossMarker;      const worldPos = drawing.three.localToWorld(marker.position.clone());      if (ray.distanceToPoint(worldPos) < threshold) return { uuid, handle: null as never };    }    return null;  }  // ── Preview ────────────────────────────────────────────────────────────────  protected _updatePreview(): void {    if (!this.machineState.preview || !this._previewDrawing || !this._previewObject) {      if (this._previewObject) this._previewObject.visible = false;      return;    }    // Move preview to the correct drawing's container when the active drawing changes.    if (this._previewObject.parent !== this._previewDrawing.three) {      this._previewDrawing.three.add(this._previewObject);    }    const style = this._resolveStyle(this.activeStyle);    const { x, z } = this.machineState.preview;    const s = style.lineSize;    const pos = this._previewObject.geometry.attributes.position as THREE.BufferAttribute;    pos.setXYZ(0, x - s, 0, z);     pos.setXYZ(1, x + s, 0, z);    pos.setXYZ(2, x,     0, z - s); pos.setXYZ(3, x,     0, z + s);    pos.needsUpdate = true;    this._previewObject.visible = true;  }  protected _onDispose(): void {    this.onMachineStateChanged.reset();  }}
```

### 🔌 Registering the system​

Registering the system on techDrawings makes it a global singleton — one instance
shared across all drawings, exactly like the built-in systems. The first call
instantiates it; any subsequent call returns the same instance, so it is safe to
call from multiple places without creating duplicates.

```typescript
const markers = techDrawings.use(CrossMarkers);// Forward reference — onCommit/onUpdate/onDelete call updatePanel() but// BUI.Component.create() comes later. Starts as a no-op, reassigned after the panel.let updatePanel = () => {};markers.onCommit.add(() => updatePanel());markers.onUpdate.add(() => updatePanel());markers.onDelete.add(() => updatePanel());
```

### 🖱️ Wiring the state machine​

We wire the DOM events to the system's state machine: moving the cursor keeps
the live preview in sync, clicking commits a marker at that position, and pressing
Escape — or moving the cursor outside the canvas — hides the preview. Each event
carries the active drawing so the system knows where to commit the marker.

```typescript
const raycaster    = new THREE.Raycaster();const _drawingPlane = new THREE.Plane();const getNDC = (e: MouseEvent): THREE.Vector2 => {  const rect = container.getBoundingClientRect();  return new THREE.Vector2(    ((e.clientX - rect.left) / rect.width)  *  2 - 1,    -((e.clientY - rect.top)  / rect.height) *  2 + 1,  );};const getDrawingPoint = (ray: THREE.Ray): THREE.Vector3 => {  const normal = new THREE.Vector3(0, 1, 0).transformDirection(    drawing.three.matrixWorld,  );  const origin = new THREE.Vector3().setFromMatrixPosition(    drawing.three.matrixWorld,  );  _drawingPlane.setFromNormalAndCoplanarPoint(normal, origin);  const worldPt = new THREE.Vector3();  ray.intersectPlane(_drawingPlane, worldPt);  return drawing.three.worldToLocal(worldPt);};container.addEventListener("mousemove", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  markers.sendMachineEvent({ type: "MOUSE_MOVE", point: getDrawingPoint(raycaster.ray), drawing });});container.addEventListener("mouseleave", () => {  markers.sendMachineEvent({ type: "ESCAPE" });});container.addEventListener("click", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  markers.sendMachineEvent({ type: "CLICK", point: getDrawingPoint(raycaster.ray), drawing });});document.addEventListener("keydown", (e) => {  if (e.key === "Escape") markers.sendMachineEvent({ type: "ESCAPE" });});
```

### 📤 Registering a DXF exporter​

Custom systems are silently skipped during DXF export unless you explicitly
register an exporter for them — built-in systems take care of this internally.
The registration callback receives your typed system instance and a write context
with helpers for emitting DXF entities.
One detail worth knowing: the write helpers accept drawing-space coordinates
directly — the axis transformation to DXF space is handled internally, so no
manual remapping is needed.

```typescript
const dxfExporter = components.get(OBC.DxfManager).exporter;dxfExporter.registerSystemExporter(CrossMarkers, (sys, ctx) => {  // drawing is captured from the outer scope — one drawing in this tutorial.  for (const [, marker] of drawing.annotations.getBySystem(sys)) {    const style    = sys.styles.get(marker.style) ?? sys.styles.get("default")!;    const aciColor = ctx.hexToAci(style.color);    const layer    = drawing.activeLayer;    const x = marker.position.x;    const z = marker.position.z; // pass drawing-space Z directly — writeLine maps it internally    const s = style.lineSize;    ctx.writeLine(x - s, z,     x + s, z,     layer, aciColor); // horizontal bar    ctx.writeLine(x,     z - s, x,     z + s, layer, aciColor); // vertical bar  }});
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to
our app. We need to initialize it once before creating any components:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more
information about the UI library, you can check the specific documentation for it!

```typescript
const [panel, _updatePanel] = BUI.Component.create<  BUI.PanelSection,  Record<string, never>>(  (_) => BUI.html`    <bim-panel active label="Custom Annotation Systems" class="options-menu">      <bim-panel-section label="Cross Markers">        <bim-label>Move the cursor over the drawing to preview, click to place</bim-label>        <bim-label>Committed: ${drawing.annotations.getBySystem(markers).size}</bim-label>        <bim-button          label="Toggle style (all)"          ?disabled=${drawing.annotations.getBySystem(markers).size === 0}          @click=${() => {            const data = drawing.annotations.getBySystem(markers);            const uuids = [...data.keys()];            // Pick the next style based on the first marker so all markers stay in sync.            const first = data.get(uuids[0])!;            const next  = first.style === "default" ? "emphasis" : "default";            markers.update(drawing, uuids, { style: next });          }}>        </bim-button>        <bim-button          label="Clear all"          @click=${() => { markers.clear([drawing]); updatePanel(); }}>        </bim-button>      </bim-panel-section>      <bim-panel-section label="Export">        <bim-button          label="Export DXF"          @click=${() => {            const dxf = dxfExporter.export([{ drawing, viewports: [{}] }]);            const blob = new Blob([dxf], { type: "application/dxf" });            const url = URL.createObjectURL(blob);            const a = document.createElement("a");            a.href = url;            a.download = "custom-annotations.dxf";            a.click();            URL.revokeObjectURL(url);          }}>        </bim-button>      </bim-panel-section>    </bim-panel>  `,  {},);updatePanel = _updatePanel;document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is
visiting our app from their phone, allowing to show or hide the menu. Otherwise,
the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => BUI.html`  <bim-button class="phone-menu-toggler" icon="solar:settings-bold"    @click="${() => {      if (panel.classList.contains("options-menu-visible")) {        panel.classList.remove("options-menu-visible");      } else {        panel.classList.add("options-menu-visible");      }    }}">  </bim-button>`);document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the
performance of our app. We will add it to the top left corner of the viewport.
This way, we'll make sure that the memory consumption and the FPS of our app are
under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! You've built a fully custom annotation system that integrates with the
drawing manager, the DXF exporter, and the interactive state machine infrastructure
exactly like the built-in systems. The state machine shown here is intentionally
minimal, but the same pattern scales to systems as complex as any of the built-ins
without any changes to the surrounding infrastructure.


---

# MODULE: DrawingBlocks
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/TechnicalDrawings/DrawingBlocks

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- TechnicalDrawings
- DrawingBlocks

# DrawingBlocks

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 🧱 Drawing Blocks​

Placing recurring symbols — column circles, door swings, stair patterns — one by one as raw geometry means duplicating data for every instance and losing any connection between them. Blocks solve this by defining the geometry once and stamping lightweight references across the drawing, each with its own position, rotation, and scale but sharing a single BufferGeometry in memory.
This tutorial covers defining reusable block geometries for a column symbol and a door swing, inserting them on click at any position on the drawing, and updating an insertion's rotation after placement. By the end, you'll have a working block system ready to populate a floor plan with repeated symbols at no extra memory cost per instance.

### 🖖 Importing our Libraries​

First, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../../../../index";
```

### 🌎 Setting up the scene​

Nothing special here — just a regular 3D scene. Annotation geometry lives on a
separate layer so it can be toggled independently from model geometry; we need to
make sure the world camera has that layer enabled.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.SimpleCamera(components);await world.camera.controls.setLookAt(48.213, 33.495, -5.062, 13.117, -1.205, 22.223);components.init();
```

### 🏗️ Loading a BIM model​

A technical drawing is most useful when it has real geometry to annotate. We load
the architectural model in Fragment format — a worker-based geometry system that
keeps the main thread free while processing large models. The drawing's Y position
is aligned to the floor cut plane used when generating the projection lines, so the
wall outlines land exactly where they should in the scene.

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});const arqFile = await fetch("https://thatopen.github.io/engine_components/resources/frags/school_arq.frag");const arqBuffer = await arqFile.arrayBuffer();await fragments.core.load(arqBuffer, { modelId: "school_arq" });
```

### 📐 Creating the drawing and loading projection lines​

We create the drawing, align its Y position to the floor cut plane used when
generating the projection lines, and load them onto a named layer. The layer
gives all geometry added through it a shared colour — here red — so the projection
lines appear without needing an explicit material. The block insertions will sit on
top of this plan so you can see them in context.

```typescript
const techDrawings = components.get(OBC.TechnicalDrawings);const drawing = techDrawings.create(world);drawing.three.position.y = 11.427046;const projData = await fetch("https://thatopen.github.io/engine_components/resources/projections/projection.json").then((r) =>  r.json(),) as { positions: number[] };const projGeo = new THREE.BufferGeometry();projGeo.setAttribute(  "position",  new THREE.BufferAttribute(new Float32Array(projData.positions), 3),);drawing.layers.create("projection", { material: new THREE.LineBasicMaterial({ color: 0xff0000 }) });const projLines = new THREE.LineSegments(projGeo);drawing.addProjectionLines(projLines, "projection");
```

### 🔷 Defining block geometry​

A block definition is plain BufferGeometry in block-local XZ space, centered at
the origin. When geometry comes from a 3D model you can use the static
TechnicalDrawing.toDrawingSpace() helper to project it flat; here we build the
symbols by hand since the shapes are simple enough to describe mathematically.
We define two blocks: a circular column symbol and an architectural door swing.
Block definitions are global to the system — you register them once and they're
available to every drawing you create.

```typescript
const blocks = techDrawings.use(OBC.BlockAnnotations);blocks.styles.set("COLUMN", { color: 0x0055cc, textOffset: 0, fontSize: 0 });blocks.styles.set("DOOR",   { color: 0xcc4400, textOffset: 0, fontSize: 0 });// ── Column: 16-sided polygon ──────────────────────────────────────────────────const colPts: number[] = [];const COL_R = 0.35;const COL_SEGS = 16;for (let i = 0; i < COL_SEGS; i++) {  const a0 = (i / COL_SEGS) * Math.PI * 2;  const a1 = ((i + 1) / COL_SEGS) * Math.PI * 2;  colPts.push(Math.cos(a0) * COL_R, 0, Math.sin(a0) * COL_R);  colPts.push(Math.cos(a1) * COL_R, 0, Math.sin(a1) * COL_R);}const columnGeo = new THREE.BufferGeometry();columnGeo.setAttribute(  "position",  new THREE.BufferAttribute(new Float32Array(colPts), 3),);blocks.define("COLUMN", { lines: columnGeo });// ── Door: quarter-arc sweep + door leaf + wall opening ────────────────────────const DOOR_W = 0.9;const DOOR_SEGS = 12;const doorPts: number[] = [];// Quarter-circle sweep showing the door's range of motion.for (let i = 0; i < DOOR_SEGS; i++) {  const a0 = (i / DOOR_SEGS) * (Math.PI / 2);  const a1 = ((i + 1) / DOOR_SEGS) * (Math.PI / 2);  doorPts.push(Math.cos(a0) * DOOR_W, 0, Math.sin(a0) * DOOR_W);  doorPts.push(Math.cos(a1) * DOOR_W, 0, Math.sin(a1) * DOOR_W);}// Door leaf in the closed position.doorPts.push(0, 0, 0, DOOR_W, 0, 0);// Wall opening — the two jamb lines.doorPts.push(0, 0, 0, 0, 0, DOOR_W);const doorGeo = new THREE.BufferGeometry();doorGeo.setAttribute(  "position",  new THREE.BufferAttribute(new Float32Array(doorPts), 3),);blocks.define("DOOR", { lines: doorGeo });
```

### 📍 Inserting blocks​

Clicking anywhere on the drawing stamps the active block at that position. Each
insertion is independent — it carries its own position, rotation, and scale — but
all insertions of the same block share the underlying geometry, so nothing is
duplicated in memory.

```typescript
// Forward reference — onCommit calls updatePanel() but BUI.Component.create()// comes later. Starts as a no-op, reassigned after the panel is built.let updatePanel = () => {};let lastInsertedUuid: string | null = null;blocks.onCommit.add(([{ item }]) => {  lastInsertedUuid = item.uuid;  updatePanel();});let activeBlock: "COLUMN" | "DOOR" = "COLUMN";let nextRotation = 0;const raycaster     = new THREE.Raycaster();const _drawingPlane = new THREE.Plane();const getNDC = (e: MouseEvent): THREE.Vector2 => {  const rect = container.getBoundingClientRect();  return new THREE.Vector2(    ((e.clientX - rect.left) / rect.width)  *  2 - 1,    -((e.clientY - rect.top)  / rect.height) *  2 + 1,  );};const getDrawingPoint = (ray: THREE.Ray): THREE.Vector3 => {  const normal = new THREE.Vector3(0, 1, 0).transformDirection(    drawing.three.matrixWorld,  );  const origin = new THREE.Vector3().setFromMatrixPosition(    drawing.three.matrixWorld,  );  _drawingPlane.setFromNormalAndCoplanarPoint(normal, origin);  const worldPt = new THREE.Vector3();  ray.intersectPlane(_drawingPlane, worldPt);  return drawing.three.worldToLocal(worldPt);};container.addEventListener("click", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  const position = getDrawingPoint(raycaster.ray);  blocks.add(drawing, {    blockName: activeBlock,    position,    rotation: nextRotation,    scale: 1,    style: activeBlock,  });});
```

### 🔄 Updating insertions​

Any property of a committed insertion can be changed after the fact — position,
rotation, scale, and colour are all live. Here we expose a rotation step so you
can spin the last-placed block in 45° increments to see how a single definition
looks at different orientations.

```typescript
const rotateLastBlock = () => {  if (!lastInsertedUuid) return;  const ins = drawing.annotations.getBySystem(blocks).get(lastInsertedUuid)!;  blocks.update(drawing, [lastInsertedUuid], { rotation: ins.rotation + Math.PI / 4 });};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to
our app. We need to initialize it once before creating any components:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more
information about the UI library, you can check the specific documentation for it!

```typescript
const [panel, _updatePanel] = BUI.Component.create<  BUI.PanelSection,  Record<string, never>>(  (_) => BUI.html`    <bim-panel active label="Drawing Blocks" class="options-menu">      <bim-panel-section label="Active Block">        <bim-dropdown label="Block"          @change=${(e: any) => { activeBlock = e.target.value[0]; }}>          <bim-option label="Column" value="COLUMN" ?checked=${activeBlock === "COLUMN"}></bim-option>          <bim-option label="Door"   value="DOOR"   ?checked=${activeBlock === "DOOR"}></bim-option>        </bim-dropdown>        <bim-label>Click anywhere on the drawing to place</bim-label>      </bim-panel-section>      <bim-panel-section label="Insertions">        ${(() => {          const insertions = [...drawing.annotations.getBySystem(blocks).values()];          return BUI.html`            <bim-label>Columns: ${insertions.filter((i) => i.blockName === "COLUMN").length} · Doors: ${insertions.filter((i) => i.blockName === "DOOR").length}</bim-label>          `;        })()}        <bim-button          label="Rotate last 45°"          ?disabled=${!lastInsertedUuid}          @click=${rotateLastBlock}>        </bim-button>        <bim-button          label="Clear all"          @click=${() => {            blocks.clear([drawing]);            lastInsertedUuid = null;            updatePanel();          }}>        </bim-button>      </bim-panel-section>    </bim-panel>  `,  {},);updatePanel = _updatePanel;document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is
visiting our app from their phone, allowing to show or hide the menu. Otherwise,
the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => BUI.html`  <bim-button class="phone-menu-toggler" icon="solar:settings-bold"    @click="${() => {      if (panel.classList.contains("options-menu-visible")) {        panel.classList.remove("options-menu-visible");      } else {        panel.classList.add("options-menu-visible");      }    }}">  </bim-button>`);document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the
performance of our app. We will add it to the top left corner of the viewport.
This way, we'll make sure that the memory consumption and the FPS of our app are
under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! The define-once, insert-many pattern keeps your drawing lean: no matter
how many columns or doors you place, the geometry lives in memory exactly once per
block. Swap the hand-crafted symbols for geometry projected from a loaded IFC model
using TechnicalDrawing.toDrawingSpace() and the rest of the code stays identical.


---

# MODULE: DrawingLayers
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/TechnicalDrawings/DrawingLayers

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- TechnicalDrawings
- DrawingLayers

# DrawingLayers

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 🗂️ Drawing Layers​

A floor plan with wall outlines, reference baselines, and dimensions all sharing the same color and visibility is impossible to read and edit efficiently. Layers solve this by grouping geometry into named channels — each with its own color, line style, and visibility toggle — so disciplines can be managed independently without touching each other's geometry.
This tutorial covers creating named layers for projection lines, reference geometry, and dimensions, assigning geometry and annotation groups to their respective layers, and controlling each layer's visibility, color, and line style (solid vs. dashed) from a live UI panel. By the end, you'll have a layered drawing where each discipline can be shown, hidden, or restyled in one action.

### 🖖 Importing our Libraries​

First, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";// @ts-ignoreimport { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";import { Font } from "three/examples/jsm/loaders/FontLoader.js";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../../../../index";
```

### 🌎 Setting up the scene​

Nothing special here — just a regular 3D scene. Annotation geometry lives on a
separate Three.js layer so it can be toggled independently from model geometry;
we need to make sure the world camera has that layer enabled.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.SimpleCamera(components);await world.camera.controls.setLookAt(48.213, 33.495, -5.062, 13.117, -1.205, 22.223);components.init();
```

### 🏗️ Loading a BIM model​

We load the architectural model in Fragment format so the 3D context is visible
while we work on the drawing. The projection lines we'll use in the next section
were generated from a horizontal cut of this very model, so everything aligns
automatically once the drawing is positioned at the right height.

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});const arqFile = await fetch("https://thatopen.github.io/engine_components/resources/frags/school_arq.frag");const arqBuffer = await arqFile.arrayBuffer();await fragments.core.load(arqBuffer, { modelId: "school_arq" });
```

### 📐 Creating the drawing​

A TechnicalDrawing is a container in 3D space that holds all the flat geometry
for a given section cut. Every drawing starts with a default layer "0" — the same
convention as AutoCAD — so geometry always has somewhere to live even before you
define your own layer structure. We'll add two more layers on top of it.

```typescript
const techDrawings = components.get(OBC.TechnicalDrawings);const drawing = techDrawings.create(world);// Align the drawing plane to the floor cut used when generating the projection data.drawing.three.position.y = 11.427046;
```

### 🗂️ Organising geometry into named layers​

Here is where layers earn their value. We create three named layers on top of the
default "0": one for the projection lines generated from the model, one for a
small set of hand-crafted reference lines, and one for linear dimensions. Each
layer is an independent channel — toggle it off, recolour it, and the others are
untouched.
The reference lines here are just two crossing baselines, but the same pattern
applies to any hand-drawn geometry you want to keep separate from the model output:
setout grids, detail boundaries, revision marks, or any other markup that does not
come from the automated projection pipeline.

```typescript
const projData = await fetch("https://thatopen.github.io/engine_components/resources/projections/projection.json").then((r) =>  r.json(),) as { positions: number[] };drawing.layers.create("Geometry",   { material: new THREE.LineBasicMaterial({ color: 0xff0000 }) });drawing.layers.create("Reference",  { material: new THREE.LineBasicMaterial({ color: 0x0055ff }) });drawing.layers.create("Dimensions", { material: new THREE.LineBasicMaterial({ color: 0x4488ff }) });const projGeo = new THREE.BufferGeometry();projGeo.setAttribute(  "position",  new THREE.BufferAttribute(new Float32Array(projData.positions), 3),);drawing.addProjectionLines(new THREE.LineSegments(projGeo), "Geometry");// Two crossing baselines placed near the centre of the plan.const refGeo = new THREE.BufferGeometry();refGeo.setAttribute(  "position",  new THREE.BufferAttribute(new Float32Array([     6.5, 0,  5,   18.5, 0,  5,   // horizontal baseline    12,   0, -0.5,  12,  0,  9.5, // vertical baseline  ]), 3),);drawing.addProjectionLines(new THREE.LineSegments(refGeo), "Reference");
```

### 📏 Giving dimensions their own layer​

We assign all linear dimensions to a dedicated "dimensions" layer. This gives
us a single visibility switch for the entire annotation set — handy when you want
to check the geometry without the measurement clutter, or export a clean base plan.
One thing worth noting: the colour swatch for the "dimensions" layer in the panel
has no effect on how the annotations actually look. Each annotation system renders
with the colour defined in its own style, so the layer colour is purely
organisational — it has no influence on the geometry.

```typescript
const dims = techDrawings.use(OBC.LinearAnnotations);
```

### 🔤 Reacting to commits — rendering text labels​

Text rendering is consumer-side, as in the other tutorials. We await the font load
before continuing so any programmatically added dimensions are guaranteed to show
their label on the first commit event.

```typescript
// Forward reference — onCommit calls updatePanel() but BUI.Component.create()// comes later. Starts as a no-op and gets reassigned after the panel is built.let updatePanel = () => {};const ttfLoader = new TTFLoader();const font: Font = await new Promise((resolve) => {  ttfLoader.load("https://thatopen.github.io/engine_components/resources/fonts/PlusJakartaSans-Medium.ttf", (ttf: any) => {    resolve(new Font(ttf));  });});dims.onCommit.add((committed) => {  for (const { item: dim, group } of committed) {    // Assign to the Dimensions layer — applies current visibility immediately.    drawing.layers.assign(group, "Dimensions");    const style = dims.styles.get(dim.style) ?? dims.styles.get("default")!;    const unit  = style.unit ?? OBC.Units.m;    const text  = `${(dim.pointA.distanceTo(dim.pointB) * unit.factor).toFixed(2)} ${unit.suffix}`;    const shapes = font.generateShapes(text, style.fontSize);    const geo    = new THREE.ShapeGeometry(shapes);    const mesh   = new THREE.Mesh(      geo,      new THREE.MeshBasicMaterial({ color: style.color, side: THREE.DoubleSide }),    );    // ShapeGeometry is built in the XY plane; rotating -90° around X maps it to    // the XZ drawing plane so it lies flat alongside the other geometry.    mesh.rotation.x = -Math.PI / 2;    mesh.layers.set(1);    // Centre the geometry pivot so the label stays centred over its anchor point.    const bbox = new THREE.Box3().setFromObject(mesh);    const bc   = bbox.getCenter(new THREE.Vector3());    mesh.position.set(-bc.x, 0, -bc.z);    const ab   = new THREE.Vector3().subVectors(dim.pointB, dim.pointA);    const perp = new THREE.Vector3(-ab.z, 0, ab.x).normalize();    const mid  = dim.pointA.clone().add(dim.pointB).multiplyScalar(0.5)      .addScaledVector(perp, dim.offset);    const labelGroup = new THREE.Group();    labelGroup.layers.set(1);    labelGroup.position      .copy(mid)      .addScaledVector(perp, Math.sign(dim.offset) * style.textOffset)      .setY(0.005);    labelGroup.add(mesh);    group.add(labelGroup);  }  updatePanel();});dims.onDelete.add(() => updatePanel());
```

### 🖱️ Interactive placement​

Hover over a projection line to preview it, then click to start a dimension.
A second click sets the offset. Escape cancels at any point.
One thing worth noting: the raycaster picks lines on any layer, including hidden
ones. If your workflow calls for picking only visible lines, you can check
drawing.layers.get(hit.layer)?.visible on the result and discard hidden hits.

```typescript
const hoverGeo  = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);const hoverLine = new THREE.Line(  hoverGeo,  new THREE.LineBasicMaterial({ color: 0x0077ff, depthTest: false }),);hoverLine.layers.set(1);// renderOrder 999 ensures it always draws on top of other annotation geometry.// frustumCulled = false prevents it from disappearing when its endpoints are near// the screen edge and the bounding box falls partially outside the frustum.hoverLine.renderOrder = 999;hoverLine.frustumCulled = false;hoverLine.visible = false;drawing.three.add(hoverLine);const raycaster     = new THREE.Raycaster();const _drawingPlane = new THREE.Plane();const getNDC = (e: MouseEvent): THREE.Vector2 => {  const rect = container.getBoundingClientRect();  return new THREE.Vector2(    ((e.clientX - rect.left) / rect.width)  *  2 - 1,    -((e.clientY - rect.top)  / rect.height) *  2 + 1,  );};const getDrawingPoint = (ray: THREE.Ray): THREE.Vector3 => {  const normal = new THREE.Vector3(0, 1, 0).transformDirection(drawing.three.matrixWorld);  const origin = new THREE.Vector3().setFromMatrixPosition(drawing.three.matrixWorld);  _drawingPlane.setFromNormalAndCoplanarPoint(normal, origin);  const worldPt = new THREE.Vector3();  ray.intersectPlane(_drawingPlane, worldPt);  return drawing.three.worldToLocal(worldPt);};container.addEventListener("mousemove", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  const hit = drawing.raycast(raycaster.ray);  if (hit?.line) {    const pos = hoverGeo.attributes.position as THREE.BufferAttribute;    pos.setXYZ(0, hit.line.start.x, 0.01, hit.line.start.z);    pos.setXYZ(1, hit.line.end.x,   0.01, hit.line.end.z);    pos.needsUpdate = true;    hoverLine.visible = true;  } else {    hoverLine.visible = false;  }  if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "MOUSE_MOVE", point: getDrawingPoint(raycaster.ray) });  }});container.addEventListener("mouseleave", () => { hoverLine.visible = false; });document.addEventListener("keydown", (e) => {  if (e.key === "Escape") dims.sendMachineEvent({ type: "ESCAPE" });});container.addEventListener("click", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  const hit = drawing.raycast(raycaster.ray);  if (dims.machineState.kind === "awaitingFirstPoint" && hit?.line) {    dims.sendMachineEvent({ type: "SELECT_LINE", line: hit.line, drawing });    return;  }  if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "CLICK", point: getDrawingPoint(raycaster.ray), drawing });  }});
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to
our app. We need to initialize it once before creating any components:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more
information about the UI library, you can check the specific documentation for it!
The layers section renders one row per layer. Each row has a visibility toggle, a
colour picker that recolours all geometry on that layer in one shot, and a line-type
selector that swaps between solid and dashed. Switching to dashed also triggers a
line-distance computation so Three.js knows where to place the gaps.

```typescript
// Convert a hex number to a CSS colour string for the native <input type="color">.const toHexColor = (n: number) => "#" + n.toString(16).padStart(6, "0");const [panel, _updatePanel] = BUI.Component.create<  BUI.PanelSection,  Record<string, never>>(  (_) => BUI.html`    <bim-panel active label="Drawing Layers" class="options-menu">      <bim-panel-section label="Layers">        ${[...drawing.layers].map(([name, layer]) => BUI.html`          <div style="display:flex; flex-direction:row; gap:0.5rem; justify-content:space-between;">            <bim-checkbox              style="flex:0"              inverted              label=${name}              ?checked=${layer.visible}              @change=${(e: any) => {                drawing.layers.setVisibility(name, e.target.checked);                updatePanel();              }}>            </bim-checkbox>            <bim-color-input              style="max-width:fit-content"              color=${toHexColor(layer.material.color.getHex())}              @input=${(e: any) => {                drawing.layers.setColor(name, parseInt(e.target.color.slice(1), 16));                updatePanel();              }}>            </bim-color-input>            <bim-dropdown              style="max-width:fit-content"              @change=${(e: any) => {                const isDashed = e.target.value[0] === "dashed";                const color = layer.material.color.getHex();                const mat = isDashed                  ? new THREE.LineDashedMaterial({ color, dashSize: 0.3, gapSize: 0.2 })                  : new THREE.LineBasicMaterial({ color });                drawing.layers.setMaterial(name, mat);                if (isDashed) {                  drawing.three.traverse((child) => {                    if (child.userData.layer === name && (child as THREE.LineSegments).isLineSegments) {                      (child as THREE.LineSegments).computeLineDistances();                    }                  });                }                updatePanel();              }}>              <bim-option label="Solid" value="solid"                ?checked=${!(layer.material instanceof THREE.LineDashedMaterial)}>              </bim-option>              <bim-option label="Dashed" value="dashed"                ?checked=${layer.material instanceof THREE.LineDashedMaterial}>              </bim-option>            </bim-dropdown>          </div>        `)}      </bim-panel-section>      <bim-panel-section label="Linear Dimensions">        <bim-label>Hover a projection line, then click to place a dimension</bim-label>        <bim-label>Committed: ${drawing.annotations.getBySystem(dims).size}</bim-label>        <bim-button          label="Clear all"          @click=${() => { dims.clear(); updatePanel(); }}>        </bim-button>      </bim-panel-section>    </bim-panel>  `,  {},);updatePanel = _updatePanel;document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is
visiting our app from their phone, allowing to show or hide the menu. Otherwise,
the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => BUI.html`  <bim-button class="phone-menu-toggler" icon="solar:settings-bold"    @click="${() => {      if (panel.classList.contains("options-menu-visible")) {        panel.classList.remove("options-menu-visible");      } else {        panel.classList.add("options-menu-visible");      }    }}">  </bim-button>`);document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the
performance of our app. We will add it to the top left corner of the viewport.
This way, we'll make sure that the memory consumption and the FPS of our app are
under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! The layer system is intentionally minimal: a name, a colour, and a
visibility flag — no complex inheritance or locking mechanics. That simplicity
is exactly what makes it composable. You can extend it by subscribing to
drawing.layers.onItemSet and drawing.layers.onItemDeleted to drive any external UI,
or go further and map IFC building systems to layers automatically by reading
discipline metadata from the model before the projection lines are loaded.


---

# MODULE: ModelDrivenAnnotations
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/TechnicalDrawings/ModelDrivenAnnotations

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- TechnicalDrawings
- ModelDrivenAnnotations

# ModelDrivenAnnotations

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 🏔️ Model-Driven Annotations​

Documenting slopes on roofs, ramps, or site grading by hand is error-prone — the data is already encoded in the model geometry as face normals, so measuring it manually introduces unnecessary risk. Model-driven annotations extract that data directly from a surface click, bypassing the multi-step placement workflow entirely.
This tutorial covers clicking any surface to read its face normal, deriving the slope ratio and downhill direction from it, and recording the result as a SlopeAnnotations entry on the drawing — in either percentage or degrees format. By the end, you'll have a one-click slope annotation tool that reads geometry directly from the model with no manual input required.

### 🖖 Importing our Libraries​

First, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";// @ts-ignoreimport { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";import { Font } from "three/examples/jsm/loaders/FontLoader.js";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../../../../index";
```

### 🌎 Setting up the scene​

Nothing special here — just a regular 3D scene. Annotation geometry lives on a
separate layer so it can be toggled independently from model geometry; we need to
make sure the world camera has that layer enabled.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.SimpleCamera(components);await world.camera.controls.setLookAt(48.213, 33.495, -5.062, 13.117, -1.205, 22.223);components.init();
```

### 🏗️ Loading a BIM model​

With the scene ready, we bring in the architectural model. The building geometry
is what we'll click on to derive slope annotations — face normals encoded in the
mesh tell us both the steepness and the downhill direction of each surface.

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});const arqFile = await fetch("https://thatopen.github.io/engine_components/resources/frags/school_arq.frag");const arqBuffer = await arqFile.arrayBuffer();await fragments.core.load(arqBuffer, { modelId: "school_arq" });
```

### 📐 Creating the drawing and loading projection lines​

We create the drawing and load a pre-computed set of projection lines — a building
floor plan already flattened to the drawing plane. These give the slope annotations
spatial context: the arrows will appear projected onto the plan directly below the
surfaces they measure.

```typescript
const techDrawings = components.get(OBC.TechnicalDrawings);const drawing = techDrawings.create(world);drawing.three.position.y = 11.427046;const projData = await fetch("https://thatopen.github.io/engine_components/resources/projections/projection.json").then((r) =>  r.json(),) as { positions: number[] };const projGeo = new THREE.BufferGeometry();projGeo.setAttribute(  "position",  new THREE.BufferAttribute(new Float32Array(projData.positions), 3),);drawing.layers.create("projection", { material: new THREE.LineBasicMaterial({ color: 0xff0000 }) });const projLines = new THREE.LineSegments(projGeo);drawing.addProjectionLines(projLines, "projection");
```

### 📍 Registering SlopeAnnotations​

Registration follows the same one-line pattern as every other system. Here we
configure two named styles that display the same slope ratio in different formats:
one in percentage and one in degrees. Switching the active style before a click
decides which format is applied to the new annotation.

```typescript
const slopes = techDrawings.use(OBC.SlopeAnnotations);slopes.styles.set("percentage", {  lineTick: OBC.NoTick,  meshTick: OBC.FilledArrowTick,  tickSize: 0.09,  length: 0.6,  color: 0xdd3300,  textOffset: 0.14,  fontSize: 0.14,  format: "percentage",});slopes.styles.set("degrees", {  lineTick: OBC.NoTick,  meshTick: OBC.FilledArrowTick,  tickSize: 0.09,  length: 0.6,  color: 0x0055cc,  textOffset: 0.14,  fontSize: 0.14,  format: "degrees",});slopes.activeStyle = "percentage";
```

### 🔤 Text labels​

Slope annotations render the directional arrow, but the text label is
consumer-side — built from the committed annotation data and attached to the
annotation group so it moves, hides, and is deleted together with the arrow
automatically.
We factor label construction into a helper so the same logic can run both when an
annotation is first created and when it is updated later (for example when switching
between the percentage and degrees styles).

```typescript
let font: Font | null = null;const ttfLoader = new TTFLoader();ttfLoader.load("https://thatopen.github.io/engine_components/resources/fonts/PlusJakartaSans-Medium.ttf", (ttf: any) => {  font = new Font(ttf);});const createTextMesh = (  text: string,  fontSize: number,  color: number,): THREE.Mesh | null => {  if (!font) return null;  const shapes = font.generateShapes(text, fontSize);  const geo = new THREE.ShapeGeometry(shapes);  const mesh = new THREE.Mesh(    geo,    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),  );  // ShapeGeometry is built in the XY plane; rotating −90° around X maps it to  // the XZ drawing plane so it lies flat alongside the annotation geometry.  mesh.rotation.x = -Math.PI / 2;  mesh.layers.set(1);  // Centre the pivot so the label stays centred over its anchor point.  const bbox = new THREE.Box3().setFromObject(mesh);  const bc = bbox.getCenter(new THREE.Vector3());  mesh.position.set(-bc.x, 0, -bc.z);  return mesh;};const buildLabelGroup = (ann: OBC.SlopeAnnotation): THREE.Group | null => {  const style = slopes.styles.get(ann.style) ?? slopes.styles.get("percentage")!;  const text = OBC.formatSlope(ann.slope, style.format);  const mesh = createTextMesh(text, style.fontSize, style.color);  if (!mesh) return null;  // Place the label beside the arrow midpoint, offset perpendicular to the direction.  const mid = ann.position.clone().addScaledVector(ann.direction, style.length / 2);  const perp = new THREE.Vector3(-ann.direction.z, 0, ann.direction.x);  // The text is always written along X. When perp has a large X component (near-vertical  // arrow), the text extends parallel to the offset and can cross the arrow. Compute how  // much the text reaches in the perp direction and ensure the offset clears it.  const bbox = new THREE.Box3().setFromObject(mesh);  const halfW = (bbox.max.x - bbox.min.x) / 2;  const halfH = Math.abs(bbox.max.z - bbox.min.z) / 2;  const perpExtent = Math.abs(perp.x) * halfW + Math.abs(perp.z) * halfH;  const offset = Math.max(style.textOffset, perpExtent + 0.05);  const g = new THREE.Group();  // Flag so onUpdate can identify and replace this group without touching the arrow.  g.userData.isLabel = true;  g.layers.set(1);  g.position.copy(mid).addScaledVector(perp, offset).setY(0.005);  g.add(mesh);  return g;};// Forward reference — onCommit/onUpdate/onDelete handlers call updatePanel() but// BUI.Component.create() comes later. Starts as a no-op, reassigned after the panel.let updatePanel = () => {};slopes.onCommit.add(([{ item: ann, group }]) => {  const label = buildLabelGroup(ann);  if (label) group.add(label);  updatePanel();});slopes.onUpdate.add(({ item: ann, group }) => {  // Replace the stale label with a freshly generated one.  const old = group.children.find((c) => c.userData?.isLabel);  if (old) {    old.traverse((c) => {      if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();      if ((c as THREE.Mesh).material instanceof THREE.Material)        ((c as THREE.Mesh).material as THREE.Material).dispose();    });    group.remove(old);  }  const label = buildLabelGroup(ann);  if (label) group.add(label);  updatePanel();});slopes.onDelete.add(() => updatePanel());
```

### 🖱️ Annotating surfaces from clicks​

This is where the model-driven pattern comes together. On every click we raycast
against the surface meshes, read the face normal from the hit, and derive both the
slope ratio and the downhill direction from it. The result goes straight to the
system — no state machine, no multi-click workflow. All the data is already in the
geometry.

```typescript
const casters = components.get(OBC.Raycasters);const caster = casters.get(world);container.addEventListener("click", async () => {  const hit = await caster.castRay() as any;  if (!hit?.normal) return;  // Fragment hit exposes the normal directly in world space — no matrix transform needed.  const worldNormal = hit.normal as THREE.Vector3;  // A near-zero horizontal component means a flat surface — nothing to annotate.  const run = Math.sqrt(worldNormal.x ** 2 + worldNormal.z ** 2);  if (run < 1e-6) return;  // A near-zero vertical component means a vertical surface — slope would be infinite.  const yAbs = Math.abs(worldNormal.y);  if (yAbs < 1e-6) return;  const slope = run / yAbs;  // The downhill direction is the horizontal projection of the normal — water flows  // in the direction the surface faces horizontally.  const direction = new THREE.Vector3(    worldNormal.x,    0,    worldNormal.z,  ).normalize();  // Project the hit point onto the drawing plane (Y = 0 in drawing local space).  const position = drawing.three.worldToLocal(hit.point.clone());  position.y = 0;  slopes.add(drawing, { position, direction, slope, style: slopes.activeStyle });});
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to
our app. We need to initialize it once before creating any components:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more
information about the UI library, you can check the specific documentation for it!

```typescript
const [panel, _updatePanel] = BUI.Component.create<  BUI.PanelSection,  Record<string, never>>(  (_) => BUI.html`    <bim-panel active label="Model Driven Annotations" class="options-menu">      <bim-panel-section label="Slope Annotations">        <bim-label>Click any surface to annotate its slope</bim-label>        <bim-label>Committed: ${drawing.annotations.getBySystem(slopes).size}</bim-label>        <bim-label>Active style: ${slopes.activeStyle}</bim-label>        <bim-button          label="Toggle style (percentage / degrees)"          @click=${() => {            slopes.activeStyle =              slopes.activeStyle === "percentage" ? "degrees" : "percentage";            updatePanel();          }}>        </bim-button>        <bim-button          label="Clear all"          @click=${() => {            slopes.clear();            updatePanel();          }}>        </bim-button>      </bim-panel-section>    </bim-panel>  `,  {},);updatePanel = _updatePanel;document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is
visiting our app from their phone, allowing to show or hide the menu. Otherwise,
the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => BUI.html`  <bim-button class="phone-menu-toggler" icon="solar:settings-bold"    @click="${() => {      if (panel.classList.contains("options-menu-visible")) {        panel.classList.remove("options-menu-visible");      } else {        panel.classList.add("options-menu-visible");      }    }}">  </bim-button>`);document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the
performance of our app. We will add it to the top left corner of the viewport.
This way, we'll make sure that the memory consumption and the FPS of our app are
under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! The model-driven pattern keeps annotation logic decoupled from user
interaction: click a surface, let the geometry tell you the slope, and let the
system record it. Swap the tilted planes for real fragment geometry loaded from an
IFC file and the rest of the code stays exactly the same — the workflow scales from
simple tutorials to production BIM applications without modification.


---

# MODULE: MultiDrawingViewports
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/TechnicalDrawings/MultiDrawingViewports

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- TechnicalDrawings
- MultiDrawingViewports

# MultiDrawingViewports

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 🗂️ Multiple Drawing Viewports​

A single viewport showing the full floor plan is rarely enough — construction drawings typically combine a general view with one or more detail areas at different scales on the same sheet. Setting this up manually means managing multiple cameras, canvases, and coordinate systems. The viewport system handles all of that: each viewport is an independent window into the same drawing, with its own bounds and scale, rendered together into a paper-space canvas that only updates when annotation data changes.
This tutorial covers creating two viewports on a single drawing framing different areas of the same floor plan, rendering them into a floating paper-space canvas, making viewport boundaries resizable and movable directly in the 3D view, and placing linear dimensions from the paper-space canvas without touching the 3D viewport. By the end, you'll have a multi-viewport sheet layout with interactive bounds and direct paper-space annotation.

### 🖖 Importing our Libraries​

First, let's install all necessary dependencies to make this example work:

```typescript
import * as THREE from "three";// @ts-ignoreimport { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";import { Font } from "three/examples/jsm/loaders/FontLoader.js";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../../../../index";
```

### 🌎 Setting up the scene​

Nothing special here — just a regular 3D scene setup. We'll keep the 3D canvas
filling the entire viewport and float the paper-space panel over it in the
bottom-left corner. That overlay approach keeps both views accessible at the
same time without splitting the page.

```typescript
document.body.style.cssText = "margin:0; width:100vw; height:100vh; overflow:hidden; position:relative;";const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;container.style.cssText = "position:absolute; inset:0;";world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.SimpleCamera(components);await world.camera.controls.setLookAt(48.213, 33.495, -5.062, 13.117, -1.205, 22.223);components.init();
```

### 🏗️ Loading a BIM model​

A technical drawing is most useful when it has real geometry to annotate. Here we
load the architectural model in Fragment format — a worker-based geometry system
that keeps the main thread free while processing large models. The model gives the
drawing spatial context: the projection lines we'll add later are wall outlines
extracted directly from it.

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});const arqFile = await fetch("https://thatopen.github.io/engine_components/resources/frags/school_arq.frag");const arqBuffer = await arqFile.arrayBuffer();await fragments.core.load(arqBuffer, { modelId: "school_arq" });
```

### 📐 Creating the drawing and loading projection lines​

Here we create the drawing and load a set of pre-computed projection lines —
wall outlines already flattened to drawing space. We register them for picking,
which enables efficient raycasting against individual segments. We'll use that
later to let the user click projection lines and place dimensions on them. The
lines live on layer 1 so the viewport cameras pick them up in the paper-space
render automatically.

```typescript
const techDrawings = components.get(OBC.TechnicalDrawings);const drawing = techDrawings.create(world);drawing.three.position.y = 11.427046;const projData = await fetch("https://thatopen.github.io/engine_components/resources/projections/projection.json").then((r) =>  r.json(),) as { positions: number[] };const projGeo = new THREE.BufferGeometry();projGeo.setAttribute(  "position",  new THREE.BufferAttribute(new Float32Array(projData.positions), 3),);drawing.layers.create("projection", { material: new THREE.LineBasicMaterial({ color: 0xff0000 }) });const projLines = new THREE.LineSegments(projGeo);drawing.addProjectionLines(projLines, "projection");
```

### 🗂️ Creating the viewports​

Let's add two viewports to the drawing. Each one is defined by a bounding
rectangle and a scale — the library handles the camera and anchors everything
to the drawing, so both viewports move together if you ever reposition it in
3D space.
Here we frame two different areas of the same plan — a wider view and a smaller
detail area. Both start at 1:100, but we'll let the user change each scale
independently from the UI panel.

```typescript
const viewportA = drawing.viewports.create({  left:   -0.996,  right:  16.493,  top:    -57.877,  bottom: -64.375,  scale:   100,});const viewportB = drawing.viewports.create({  left:   -5.040,  right:  -1.434,  top:     0.568,  bottom: -5.934,  scale:   100,});
```

Here's something really nice: each viewport comes with an optional helper that
draws its boundary rectangle in the 3D view. Thanks to how rendering layers
work, it shows up in the 3D perspective but never bleeds into the paper-space
canvas — clean separation with zero extra effort!
In this tutorial we'll make both helpers interactive. The user can drag the
corner and edge handles to resize a viewport's bounds live, or drag the border
itself to move the entire viewport. Every time the bounds change, the next
paper-space render reflects the updated window automatically. Because the
helpers have no browser dependencies, we forward pointer events to them
manually — keeping the core library portable across environments.

```typescript
viewportA.helperVisible = true;viewportB.helperVisible = true;viewportA.helper.resizable = true;viewportA.helper.movable = true;viewportB.helper.resizable = true;viewportB.helper.movable = true;
```

### 📄 Paper-space renderer​

Here's the heart of this tutorial: a separate paper-space canvas that renders
both viewports side by side. Each viewport gets its own independent region on
the canvas, and since the viewport bounds already define exactly what each one
should show, no additional camera setup is needed.
The key design decision we're making here is that this canvas never renders
from the animation loop. It only updates when annotation data actually changes.
The 3D perspective view keeps updating every frame as usual, but the paper-space
canvas stays still unless something meaningful happens — a great pattern for
output-oriented views!
We'll control the visual size of the panel with a scale constant — tweaking it
zooms the entire panel without touching the drawing scales. The panel floats
over the 3D view, and areas where no viewport is rendered stay transparent so
the grid background shows through.

```typescript
// ── Floating paper-space panel ────────────────────────────────────────────// Pixels per drawing unit in paper space. Changing this value zooms the// entire paper panel in or out uniformly; it never affects the drawing scale.const PPU = 40;// Gap in CSS px between the two viewport regions.const PAPER_GAP = 16;// Padding around all viewports inside the paper panel.const PAPER_PAD = 20;const paperWrapper = document.createElement("div");paperWrapper.style.cssText = `  position: absolute;  bottom: 24px;  left: 24px;  background-color: #e8e8e8;  background-image:    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);  background-size: ${PPU}px ${PPU}px;  border: 2px solid #888;  border-radius: 4px;  overflow: hidden;`;const paperCanvas = document.createElement("canvas");paperCanvas.style.cssText = "position:absolute; top:0; left:0; display:block;";
```

One of the nicest things about viewports is that you can export each one to
DXF independently. Pass a viewport to the exporter and it automatically clips
the geometry to that viewport's bounds and normalises the coordinates — the
exported file reflects exactly what's visible in that view. Resize a viewport
and the next export reflects the new bounds automatically. Very handy!

```typescript
const dxfExporter = components.get(OBC.DxfManager).exporter;const exportViewport = (viewport: OBC.DrawingViewport, filename: string) => {  const dxf  = dxfExporter.export([{ drawing, viewports: [{ viewport }] }]);  const blob = new Blob([dxf], { type: "application/dxf" });  const url  = URL.createObjectURL(blob);  const a    = document.createElement("a");  a.href = url; a.download = filename; a.click();  URL.revokeObjectURL(url);};
```

Let's add a simple selection interaction: clicking a viewport in the paper
panel selects it, and the side panel then shows controls for that viewport —
like changing its scale or exporting it to DXF. We add a thin border overlay
over each rendered region that doubles as the visual outline and the click
target. Nothing fancy, but it makes the whole thing feel interactive!

```typescript
// ── Viewport selection state ──────────────────────────────────────────────type ViewportEntry = { id: string; viewport: OBC.DrawingViewport; borderEl: HTMLElement };const viewportEntries: ViewportEntry[] = [];let selectedViewport: OBC.DrawingViewport | null = null;let selectedId = "";let editingViewport: OBC.DrawingViewport | null = null;const selectViewport = (viewport: OBC.DrawingViewport) => {  const entry = viewportEntries.find(e => e.viewport === viewport);  if (!entry) return;  selectedViewport = viewport;  selectedId = entry.id;  for (const e of viewportEntries) {    e.borderEl.style.border = `1.5px solid ${e.viewport === viewport ? "#0055ff" : "#000"}`;  }  updatePanel();};// ── Border divs (outline + click to select) ───────────────────────────────const makeViewportBorderEl = (id: string, viewport: OBC.DrawingViewport) => {  const el = document.createElement("div");  el.style.cssText = `    position: absolute;    box-sizing: border-box;    border: 1.5px solid #000;    cursor: pointer;    pointer-events: auto;    user-select: none;  `;  const tag = document.createElement("span");  tag.textContent = id;  tag.style.cssText = `    position: absolute;    top: 3px; left: 4px;    font: 10px/1 monospace;    color: #000;    background: rgba(255,255,255,0.75);    padding: 1px 4px;    border-radius: 2px;    pointer-events: none;  `;  el.appendChild(tag);  // stopPropagation prevents the click from reaching the 3D container listener  // below, which would otherwise interpret it as a dimension placement event.  el.addEventListener("click", (e) => { e.stopPropagation(); selectViewport(viewport); });  // Expose tag so renderPaperSpace can update the scale label.  (el as any)._tag = tag;  return el;};const borderElA = makeViewportBorderEl("A", viewportA);const borderElB = makeViewportBorderEl("B", viewportB);viewportEntries.push(  { id: "A", viewport: viewportA, borderEl: borderElA },  { id: "B", viewport: viewportB, borderEl: borderElB },);paperWrapper.append(paperCanvas, borderElA, borderElB);document.body.append(paperWrapper);
```

Here's the render function. Each time it's called, it recomputes the canvas
size to fit both viewports side by side at their current scales, then renders
each one into its region. It also repositions the clickable overlays and
refreshes the scale labels so they stay in sync with what's on screen.

```typescript
// Black crosshair SVG cursor used in edit mode.const CROSSHAIR_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cline x1='10' y1='0' x2='10' y2='8' stroke='black' stroke-width='1.5'/%3E%3Cline x1='10' y1='12' x2='10' y2='20' stroke='black' stroke-width='1.5'/%3E%3Cline x1='0' y1='10' x2='8' y2='10' stroke='black' stroke-width='1.5'/%3E%3Cline x1='12' y1='10' x2='20' y2='10' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E") 10 10, crosshair`;// alpha:true so transparent areas of the canvas let the CSS grid show through.const paperRenderer = new THREE.WebGLRenderer({ canvas: paperCanvas, antialias: true, alpha: true });// Pixel-space bounds of each viewport in the paper canvas (CSS pixels, updated every render).const paperRegions = new Map<OBC.DrawingViewport, { x: number; y: number; w: number; h: number }>();// Disable autoclear so we can render multiple viewports in one frame using scissor regions// and clear each region manually with a different background colour.paperRenderer.autoClear = false;function renderPaperSpace() {  // Physical pixels per CSS pixel — needed for sharp rendering on high-DPI screens.  const dpr = window.devicePixelRatio;  // Per-viewport CSS pixel dimensions. Base PPU is calibrated at 1:100;  // scaling by 100/drawingScale keeps physical size consistent across scales.  const vpDims = viewportEntries.map(({ viewport }) => {    const ppu = (PPU * 100) / viewport.drawingScale;    return {      w: Math.round((viewport.right  - viewport.left)   * ppu),      h: Math.round((viewport.top    - viewport.bottom) * ppu),    };  });  const totalW = vpDims.reduce((s, d, i) => s + d.w + (i > 0 ? PAPER_GAP : 0), 0) + 2 * PAPER_PAD;  const totalH = Math.max(...vpDims.map(d => d.h)) + 2 * PAPER_PAD;  paperWrapper.style.width  = `${totalW}px`;  paperWrapper.style.height = `${totalH}px`;  paperRenderer.setPixelRatio(dpr);  paperRenderer.setSize(totalW, totalH);  // WebGL scissor/viewport calls use physical pixels, not CSS pixels.  // We round to integers to prevent subpixel misalignment between adjacent regions.  const W    = Math.round(totalW   * dpr);  const H    = Math.round(totalH   * dpr);  const padD = Math.round(PAPER_PAD * dpr);  paperRenderer.setScissorTest(true);  // Clear full canvas to transparent so CSS grid shows through.  paperRenderer.setClearColor(0x000000, 0);  paperRenderer.setViewport(0, 0, W, H);  paperRenderer.setScissor(0, 0, W, H);  paperRenderer.clear();  // Each viewport gets an opaque white background then its scene render.  paperRenderer.setClearColor(0xffffff, 1);  let xOffset = PAPER_PAD;  for (let i = 0; i < viewportEntries.length; i++) {    const { id, viewport, borderEl } = viewportEntries[i];    const { w, h } = vpDims[i];    const wd = Math.round(w * dpr);    const hd = Math.round(h * dpr);    const xd = Math.round(xOffset * dpr);    paperRenderer.setViewport(xd, H - padD - hd, wd, hd);    paperRenderer.setScissor(xd, H - padD - hd, wd, hd);    paperRenderer.clear();    paperRenderer.render(world.scene.three, viewport.camera);    paperRegions.set(viewport, { x: xOffset, y: PAPER_PAD, w, h });    (borderEl as any)._tag.textContent = `${id} — 1:${viewport.drawingScale}`;    borderEl.style.left   = `${xOffset}px`;    borderEl.style.top    = `${PAPER_PAD}px`;    borderEl.style.width  = `${w}px`;    borderEl.style.height = `${h}px`;    xOffset += w + PAPER_GAP;  }  paperRenderer.setScissorTest(false);}
```

### 📏 Annotation system and text rendering​

In this tutorial we'll use a linear dimensions system to give the paper-space
canvas something meaningful to display and to demonstrate the event-driven
render pattern. Worth noting: text rendering is intentionally left to your app —
the system stores the measurement data and fires events, but how you visualise
the labels is entirely up to you. That keeps the core library free of DOM and
font dependencies, so it works the same in Node.js and the browser.
We'll load a TTF font once up front and reuse it whenever a dimension is
committed.

```typescript
const dims = techDrawings.use(OBC.LinearAnnotations);dims.styles.get("default")!.textOffset = 0.3;const ttfLoader = new TTFLoader();const font: Font = await new Promise((resolve) => {  ttfLoader.load("https://thatopen.github.io/engine_components/resources/fonts/PlusJakartaSans-Medium.ttf", (ttf: any) => {    resolve(new Font(ttf));  });});
```

When a dimension is committed, we create a text label from the measured
distance and attach it to the annotation so it moves and disappears together
with it — no extra bookkeeping needed. We also kick off a paper-space re-render
so the canvas immediately reflects the new annotation.

```typescript
// Forward reference — onCommit calls updatePanel() but BUI.Component.create()// comes later. It starts as a no-op and gets reassigned after the panel is built.let updatePanel = () => {};dims.onCommit.add((committed) => {  for (const { item: dim, group } of committed) {    const style = dims.styles.get(dim.style) ?? dims.styles.get("default")!;    const text  = `${dim.pointA.distanceTo(dim.pointB).toFixed(2)} m`;    const shapes = font.generateShapes(text, style.fontSize);    const geo    = new THREE.ShapeGeometry(shapes);    const mesh   = new THREE.Mesh(      geo,      new THREE.MeshBasicMaterial({ color: style.color, side: THREE.DoubleSide }),    );    // ShapeGeometry is built in the XY plane; rotating -90° around X maps it to    // the XZ drawing plane so it lies flat on the ground alongside the other geometry.    mesh.rotation.x = -Math.PI / 2;    mesh.layers.set(1);    const bbox = new THREE.Box3().setFromObject(mesh);    const bc   = bbox.getCenter(new THREE.Vector3());    mesh.position.set(-bc.x, 0, -bc.z);    const ab   = new THREE.Vector3().subVectors(dim.pointB, dim.pointA);    const perp = new THREE.Vector3(-ab.z, 0, ab.x).normalize();    const mid  = dim.pointA.clone().add(dim.pointB).multiplyScalar(0.5)      .addScaledVector(perp, dim.offset);    const labelGroup = new THREE.Group();    labelGroup.layers.set(1);    labelGroup.position      .copy(mid)      .addScaledVector(perp, Math.sign(dim.offset) * style.textOffset)      .setY(0.005);    labelGroup.add(mesh);    group.add(labelGroup);  }  renderPaperSpace();  updatePanel();});dims.onDelete.add(() => { renderPaperSpace(); updatePanel(); });
```

### 🔵 Pre-populated dimensions​

Let's seed a few dimensions at startup so the viewports show something right
away — it's much easier to understand the paper-space layout when there's
actual annotation data to look at.

```typescript
dims.add(drawing, { pointA: new THREE.Vector3(-3.054, 0.000, -0.347), pointB: new THREE.Vector3(-3.054, 0.000, 5.754), offset: 0.6, style: "default" });dims.add(drawing, { pointA: new THREE.Vector3(-0.378, 0.000, 61.239), pointB: new THREE.Vector3(2.260, 0.000, 61.239), offset: 0.2, style: "default" });dims.add(drawing, { pointA: new THREE.Vector3(2.260, 0.000, 61.239), pointB: new THREE.Vector3(5.000, 0.000, 61.239), offset: 0.2, style: "default" });dims.add(drawing, { pointA: new THREE.Vector3(5.000, 0.000, 61.239), pointB: new THREE.Vector3(7.740, 0.000, 61.239), offset: 0.2, style: "default" });dims.add(drawing, { pointA: new THREE.Vector3(7.740, 0.000, 61.239), pointB: new THREE.Vector3(10.480, 0.000, 61.239), offset: 0.2, style: "default" });dims.add(drawing, { pointA: new THREE.Vector3(10.480, 0.000, 61.239), pointB: new THREE.Vector3(13.220, 0.000, 61.239), offset: 0.2, style: "default" });dims.add(drawing, { pointA: new THREE.Vector3(13.220, 0.000, 61.239), pointB: new THREE.Vector3(15.960, 0.000, 61.239), offset: 0.2, style: "default" });renderPaperSpace();
```

### 🖱️ Interactive placement​

Now let's wire up the interactions on the 3D canvas. Two things share the same
pointer events here: viewport manipulation (moving and resizing bounds) and
dimension placement from the 3D view. We give priority to the viewport helper
— if it has an active operation in progress, dimension placement is suppressed
until the operation completes.

```typescript
const hoverGeo  = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);const hoverLine = new THREE.Line(  hoverGeo,  new THREE.LineBasicMaterial({ color: 0x0077ff, depthTest: false }),);hoverLine.layers.set(1);// renderOrder 999 ensures it always draws on top of other annotation geometry.// frustumCulled = false prevents it from disappearing when the endpoints are// near the screen edge and the bounding box falls partially outside the frustum.hoverLine.renderOrder = 999;hoverLine.frustumCulled = false;hoverLine.visible = false;drawing.three.add(hoverLine);const raycaster     = new THREE.Raycaster();const _drawingPlane = new THREE.Plane();const getNDC = (e: MouseEvent): THREE.Vector2 => {  const rect = container.getBoundingClientRect();  return new THREE.Vector2(    ((e.clientX - rect.left) / rect.width)  *  2 - 1,    -((e.clientY - rect.top)  / rect.height) *  2 + 1,  );};const getDrawingPoint = (ray: THREE.Ray): THREE.Vector3 => {  const normal = new THREE.Vector3(0, 1, 0).transformDirection(drawing.three.matrixWorld);  const origin = new THREE.Vector3().setFromMatrixPosition(drawing.three.matrixWorld);  _drawingPlane.setFromNormalAndCoplanarPoint(normal, origin);  const worldPt = new THREE.Vector3();  ray.intersectPlane(_drawingPlane, worldPt);  return drawing.three.worldToLocal(worldPt);};const anyHelperDragging = () => viewportEntries.some(e => e.viewport.helper.isDragging);container.addEventListener("mousemove", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  const ray = raycaster.ray;  // Always forward to helpers: hover detection + live bound updates.  for (const { viewport } of viewportEntries) viewport.helper.onPointerMove(ray);  // While a helper operation is active, keep paper space in sync and skip  // dimension-related logic.  if (anyHelperDragging()) {    renderPaperSpace();    return;  }  const hit = drawing.raycast(ray);  if (hit?.line) {    const pos = hoverGeo.attributes.position as THREE.BufferAttribute;    pos.setXYZ(0, hit.line.start.x, 0.01, hit.line.start.z);    pos.setXYZ(1, hit.line.end.x,   0.01, hit.line.end.z);    pos.needsUpdate = true;    hoverLine.visible = true;  } else {    hoverLine.visible = false;  }  if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "MOUSE_MOVE", point: getDrawingPoint(ray) });  }});container.addEventListener("mouseleave", () => { hoverLine.visible = false; });document.addEventListener("keydown", (e) => {  if (e.key === "Escape") {    if (creatingViewport) { creatingViewport = false; updatePanel(); return; }    for (const { viewport } of viewportEntries) viewport.helper.onPointerUp();    if (editingViewport && dims.machineState.kind === "awaitingFirstPoint") {      // No dimension in progress — exit edit mode.      exitEditMode();    } else {      // Dimension in progress — cancel it but stay in edit mode.      dims.sendMachineEvent({ type: "ESCAPE" });      hoverLine.visible = false;      renderPaperSpace();    }  }});container.addEventListener("click", (e) => {  raycaster.setFromCamera(getNDC(e), world.camera.three);  const ray = raycaster.ray;  // ── Viewport helper: click–move–click model ───────────────────────────  // Second click while a helper operation is active → confirm.  if (anyHelperDragging()) {    for (const { viewport } of viewportEntries) viewport.helper.onPointerUp();    renderPaperSpace();    return;  }  // First click → try to start a helper operation on any viewport.  for (const { viewport } of viewportEntries) viewport.helper.onPointerDown(ray);  if (anyHelperDragging()) return; // helper consumed the click  // ── New viewport creation ─────────────────────────────────────────────  if (creatingViewport) {    addNewViewport(getDrawingPoint(ray));    creatingViewport = false;    updatePanel();    return;  }  // ── Dimension placement ───────────────────────────────────────────────  const hit = drawing.raycast(ray);  if (dims.machineState.kind === "awaitingFirstPoint" && hit?.line) {    dims.sendMachineEvent({ type: "SELECT_LINE", line: hit.line, drawing });    return;  }  if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "CLICK", point: getDrawingPoint(ray), drawing });  }});
```

### 📏 Dimensioning directly in paper space​

One of the most useful things we can add is the ability to place dimensions
directly from the paper-space canvas — without having to switch back to the 3D
view. The key insight is that a viewport's camera is already a fully valid
camera for raycasting: pointing a ray from it at the drawing plane gives exactly
the same drawing-local coordinates that the 3D view would produce. So all the
snapping, state machine, and geometry logic works identically — the only
difference is where the ray originates.
To avoid conflicts with the single-click selection, we use a two-mode approach:
a single click selects a viewport, and a double-click activates edit mode for
it. While edit mode is active, pointer events on that viewport's overlay are
transparent, so clicks reach the paper canvas beneath and drive the dimension
state machine directly. Pressing Escape cancels any dimension in progress; a
second Escape exits edit mode entirely. Clicking any viewport border also exits
edit mode.

```typescript
// ── Paper-space edit mode ─────────────────────────────────────────────────// Double-clicking a viewport border enters edit mode: pointer-events on that// border div are disabled so subsequent clicks reach the paper canvas below.const enterEditMode = (vp: OBC.DrawingViewport, el: HTMLElement) => {  // Reset all border divs first in case one was already transparent to events.  for (const e of viewportEntries) e.borderEl.style.pointerEvents = "auto";  selectViewport(vp);  editingViewport = vp;  el.style.pointerEvents = "none";  el.style.border = "1.5px dashed #0055ff";  paperCanvas.style.cursor = CROSSHAIR_CURSOR;  updatePanel();};const exitEditMode = () => {  if (!editingViewport) return;  editingViewport = null;  for (const e of viewportEntries) {    e.borderEl.style.pointerEvents = "auto";    e.borderEl.style.border = `1.5px solid ${e.viewport === selectedViewport ? "#0055ff" : "#000"}`;  }  paperCanvas.style.cursor = "";  hoverLine.visible = false;  renderPaperSpace();  updatePanel();};// A single click on any viewport border exits edit mode (and cancels any dimension// in progress). Double-click is the only way to enter edit mode.const leaveEditOnClick = () => {  if (!editingViewport) return;  dims.sendMachineEvent({ type: "ESCAPE" });  hoverLine.visible = false;  exitEditMode();};for (const { viewport, borderEl } of viewportEntries) {  borderEl.addEventListener("dblclick", (e) => { e.stopPropagation(); enterEditMode(viewport, borderEl); });  borderEl.addEventListener("click", leaveEditOnClick);}// ── Viewport creation mode ────────────────────────────────────────────────// vpCounter starts after A and B so the first new viewport gets label C.let creatingViewport = false;let vpCounter = viewportEntries.length;const addNewViewport = (center: THREE.Vector3) => {  const R = 2.5;  // top/bottom use negated drawing-Z: the viewport camera looks down with up = -Z,  // so more negative Z in drawing space = higher on paper = larger top value.  const vp = drawing.viewports.create({    left:   center.x - R, right:  center.x + R,    top:   -center.z + R, bottom: -center.z - R,    scale: 100,  });  vp.helperVisible = true;  vp.helper.resizable = true;  vp.helper.movable = true;  const label = String.fromCharCode(65 + vpCounter % 26) + (vpCounter >= 26 ? String(Math.floor(vpCounter / 26)) : "");  vpCounter++;  const borderEl = makeViewportBorderEl(label, vp);  paperWrapper.appendChild(borderEl);  const entry: ViewportEntry = { id: label, viewport: vp, borderEl };  viewportEntries.push(entry);  borderEl.addEventListener("dblclick", (e2) => { e2.stopPropagation(); enterEditMode(vp, borderEl); });  borderEl.addEventListener("click", leaveEditOnClick);  renderPaperSpace();};// ── Paper-space dimensioning ──────────────────────────────────────────────// Resolves which viewport (if any) the cursor is over and returns a ray from// that viewport's orthographic camera. Everything downstream (raycast, snap,// getDrawingPoint) works identically to the 3D-canvas path.const getPaperRay = (e: MouseEvent): { ray: THREE.Ray; viewport: OBC.DrawingViewport } | null => {  const rect = paperCanvas.getBoundingClientRect();  const cx = e.clientX - rect.left;  const cy = e.clientY - rect.top;  for (const { viewport: vp } of viewportEntries) {    const r = paperRegions.get(vp);    if (!r || cx < r.x || cx > r.x + r.w || cy < r.y || cy > r.y + r.h) continue;    raycaster.setFromCamera(      new THREE.Vector2(        ((cx - r.x) / r.w) * 2 - 1,        -((cy - r.y) / r.h) * 2 + 1,      ),      vp.camera,    );    return { ray: raycaster.ray, viewport: vp };  }  return null;};paperCanvas.addEventListener("mousemove", (e) => {  const result = getPaperRay(e);  if (!result) { hoverLine.visible = false; return; }  const hit = drawing.raycast(result.ray, result.viewport);  if (hit?.line) {    const pos = hoverGeo.attributes.position as THREE.BufferAttribute;    pos.setXYZ(0, hit.line.start.x, 0.01, hit.line.start.z);    pos.setXYZ(1, hit.line.end.x,   0.01, hit.line.end.z);    pos.needsUpdate = true;    hoverLine.visible = true;  } else {    hoverLine.visible = false;  }  if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "MOUSE_MOVE", point: getDrawingPoint(result.ray) });  }  renderPaperSpace();});paperCanvas.addEventListener("mouseleave", () => { hoverLine.visible = false; });paperCanvas.addEventListener("click", (e) => {  const result = getPaperRay(e);  if (!result) return;  const hit = drawing.raycast(result.ray, result.viewport);  if (dims.machineState.kind === "awaitingFirstPoint" && hit?.line) {    dims.sendMachineEvent({ type: "SELECT_LINE", line: hit.line, drawing });    return;  }  if (dims.machineState.kind === "positioningOffset") {    dims.sendMachineEvent({ type: "CLICK", point: getDrawingPoint(result.ray), drawing });  }});
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to
our app. For more information about the UI library, you can check the specific
documentation for it!

```typescript
BUI.Manager.init();const [panel, _updatePanel] = BUI.Component.create<  BUI.PanelSection,  Record<string, never>>(  (_) => BUI.html`    <bim-panel active label="Multiple Viewports" class="options-menu" style="max-width: 20rem;">      <bim-panel-section label="Viewports">        ${creatingViewport ? BUI.html`          <bim-label style="white-space: normal;">Click anywhere on the drawing to place a 5 m viewport. Press Esc to cancel.</bim-label>          <bim-button label="Cancel"            @click=${() => { creatingViewport = false; updatePanel(); }}>          </bim-button>        ` : BUI.html`          <bim-button label="Add Viewport"            @click=${() => { creatingViewport = true; updatePanel(); }}>          </bim-button>        `}      </bim-panel-section>      <bim-panel-section label="Linear Dimensions">        ${editingViewport ? BUI.html`          <bim-label style="white-space: normal;">Hover a projection line and click to anchor the first point, then click to set the offset. Press Esc to cancel a dimension in progress, or Esc again to exit edit mode.</bim-label>        ` : BUI.html`          <bim-label style="white-space: normal;">Double-click a viewport to enter edit mode and start placing dimensions.</bim-label>        `}        <bim-label style="white-space: normal;">Committed: ${dims.get([drawing]).size}</bim-label>        <bim-button label="Clear all"          @click=${() => { dims.clear([drawing]); renderPaperSpace(); updatePanel(); }}>        </bim-button>      </bim-panel-section>      <bim-panel-section label="Viewport">        ${selectedViewport ? BUI.html`          <bim-label style="white-space: normal;">Click: select · Double-click: edit mode</bim-label>          <bim-label style="white-space: normal;">Viewport ${selectedId} — 1:${selectedViewport.drawingScale}</bim-label>          <bim-dropdown            label="Scale"            @change=${(e: Event) => {              const val = (e.target as BUI.Dropdown).value as string[];              if (!val.length) return;              selectedViewport!.drawingScale = parseInt(val[0], 10);              renderPaperSpace();              updatePanel();            }}>            ${[50, 100, 200].map((s) => BUI.html`              <bim-option                label="1:${s}"                value="${s}"                ?checked=${s === selectedViewport!.drawingScale}>              </bim-option>            `)}          </bim-dropdown>          <bim-button label="Export DXF"            @click=${() => exportViewport(selectedViewport!, `viewport-${selectedId.toLowerCase()}.dxf`)}>          </bim-button>        ` : BUI.html`          <bim-label style="white-space: normal;">Click a viewport to select it · Double-click to edit</bim-label>        `}      </bim-panel-section>    </bim-panel>  `,  {},);updatePanel = _updatePanel;document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is
visiting our app from their phone, allowing to show or hide the menu. Otherwise,
the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => BUI.html`  <bim-button class="phone-menu-toggler" icon="solar:settings-bold"    @click="${() => {      if (panel.classList.contains("options-menu-visible")) {        panel.classList.remove("options-menu-visible");      } else {        panel.classList.add("options-menu-visible");      }    }}">  </bim-button>`);document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the
performance of our app. We will add it to the top left corner of the viewport.
This way, we'll make sure that the memory consumption and the FPS of our app are
under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! You now know how to host multiple viewports on a single drawing,
render them into a shared event-driven canvas, let users resize and reposition
viewport bounds interactively, place dimensions directly from paper space, and
export each view to DXF independently. The key takeaway is that the library
handles all the spatial logic with no browser dependencies — your app just
decides how to display and interact with it. Pretty powerful combination!


---

# MODULE: Viewpoints
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/Viewpoints

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- Viewpoints

# Viewpoints

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📄 Storing View Information​

In collaborative BIM workflows, teams need to point each other to specific locations in the model — a clashing duct, a problematic wall, a structural element to review. Without a standard way to save and restore camera positions alongside element selections, that context is lost between sessions and tools. Viewpoints, part of the BCF standard, solve this by bundling camera position, selected elements, and a snapshot into a single reusable reference.
This tutorial covers creating a viewpoint from the current camera, updating its snapshot and position, associating model elements by GUID and by category query, restoring the camera from a saved viewpoint, isolating its elements in the scene, and linking it to a BCF topic. By the end, you'll have a complete viewpoint workflow ready to integrate into any BIM coordination feature.

```typescript
import * as THREE from "three";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",  "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using The Viewpoints Component​

Creating viewpoints is extremely simple. Let's start by getting the component's instance to use it along the example:

```typescript
const viewpoints = components.get(OBC.Viewpoints);viewpoints.world = world;
```

Once completed, creating the viewpoint is straightforward. Let's define a helper function to streamline the process, allowing us to maintain the flow of the example and execute the function from the UI.

```typescript
let viewpoint: OBC.Viewpoint | undefined;const createViewpoint = async () => {  viewpoint = viewpoints.create();  // You can set an optional title for UI purposes  viewpoint.title = "My Viewpoint";  // Update the viewpoint to capture the current camera data, as this is the most common use case:  await viewpoint.updateCamera();};
```

By default, the method used to update the viewpoint camera captures a snapshot of the current world's camera view. This snapshot is included when the viewpoint is exported as part of a BCF topic. You can update the snapshot at any time:

```typescript
const updateSnapshot = () => {  if (!viewpoint) return;  viewpoint.takeSnapshot();};
```

The viewpoint position is automatically set based on the world's camera by default. If you need to update it, you can adjust the camera position and trigger the corresponding method. For demonstration purposes, let's create a general function that can be triggered later using a button:

```typescript
const updateViewpointCamera = async () => {  if (!viewpoint) return;  console.log("Position before updating", viewpoint.position);  await viewpoint.updateCamera();  console.log("Position after updating", viewpoint.position);};
```

Setting the camera back to the viewpoint position is straightforward. Let's create a simple function that can be triggered from the UI:

```typescript
const setWorldCamera = async () => {  if (!viewpoint) return;  const initialPosition = new THREE.Vector3();  world.camera.controls.getPosition(initialPosition);  console.log("Camera position before updating", initialPosition);  await viewpoint.go();  const finalPosition = new THREE.Vector3();  world.camera.controls.getPosition(finalPosition);  console.log("Camera position before updating", finalPosition);};
```

### 🧱 Adding and Retrieving Model Elements​

Viewpoints make it easy to store and retrieve selected elements. You can add elements using GUIDs obtained from ModelIdMaps. For instance, if you already have some GUIDs, you can add them to a viewpoint. Since the viewpoint will be created dynamically using the UI in this example, let's listen for the creation of a new viewpoint and add some default items to it:

```typescript
viewpoints.list.onItemSet.add(({ value: viewpoint }) => {  viewpoint.selectionComponents.add(    "3V$FMCDUfCoPwUaHMPfteW",    "1fIVuvFffDJRV_SJESOtCZ",  );});
```

While GUIDs are ideal for transferring selections between BIM apps, within That Open Engine, ModelIdMaps are more commonly used for selections. For example, the Highlighter component generates these maps based on model selections. Here's how to programmatically create a ModelIdMap for all doors in the model and add it to the viewpoint:

```typescript
// Once again, as the viewpoint will be created on demand// let's listen for the creation event to assing the doors to itviewpoints.list.onItemSet.add(async ({ value: viewpoint }) => {  const finder = components.get(OBC.ItemsFinder);  const doors = await finder.getItems([{ categories: [/DOOR/] }]);  const guids = await fragments.modelIdMapToGuids(doors);  viewpoint.selectionComponents.add(...guids);});
```

In BCF, the elements associated with a viewpoint are referred to as components. If you're unsure how to use the ItemsFinder to retrieve the elements you need, check out the corresponding component tutorial for guidance.

Viewpoint components include the GUIDs added earlier and new ones from the FragmentIdMap. Here's a simple function to log selection components as GUIDs and a FragmentIdMap for use with Highlighter or Hider:

```typescript
const reportComponents = async () => {  if (!viewpoint) return;  const selectionGuids = viewpoint.selectionComponents;  const selectionMap = await viewpoint.getSelectionMap();  console.log(selectionGuids, selectionMap);};
```

To make things more engaging, let's isolate the elements associated with the viewpoint as follows:

```typescript
const isolateComponents = async () => {  if (!viewpoint) return;  const items = await viewpoint.getSelectionMap();  const hider = components.get(OBC.Hider);  hider.isolate(items);};
```

### 🔗 Linking Viewpoints to Topics​

Viewpoints can be linked to topics to enhance communication. While topics and viewpoints are created independently, you can associate one or more viewpoint GUIDs with a topic as follows:

```typescript
// Once again, as the viewpoint will be created on demand// let's listen for the creation event to assing the doors to itviewpoints.list.onItemSet.add(({ value: viewpoint }) => {  const bcfTopics = components.get(OBC.BCFTopics);  const topic = bcfTopics.create();  topic.viewpoints.add(viewpoint.guid);});
```

Simple as that! Using GUIDs instead of full viewpoint objects helps avoid memory leaks when deleting viewpoints. Finally, just for fun, let's get the data from the viewpoint snapshot so it can be displayed in the UI

```typescript
const getViewpointSnapshotData = () => {  if (!viewpoint) return null;  const data = viewpoints.snapshots.get(viewpoint.snapshot);  if (!data) return null;  return data;};
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
const [panel, updatePanel] = BUI.Component.create<BUI.PanelSection, {}>((_) => {  const onResetVisibility = async ({ target }: { target: BUI.Button }) => {    target.loading = true;    const hider = components.get(OBC.Hider);    await hider.set(true);    target.loading = false;  };  let controls = BUI.html`    <bim-panel-section label="Viewpoint Creation">      <bim-label>To start, hit the button below to create a new viewpoint</bim-label>      <bim-button label="Create Viewpoint" @click=${createViewpoint}></bim-button>    </bim-panel-section>  `;  if (viewpoint) {    const snapshotData = getViewpointSnapshotData();    let snapshotElement: BUI.TemplateResult | undefined;    if (snapshotData) {      const blob = new Blob([snapshotData], { type: "image/png" });      const url = URL.createObjectURL(blob);      snapshotElement = BUI.html`        <img src="${url}" alt="Viewpoint Snapshot" style="max-width: 20rem;"/>      `;    }    const onDeleteViewpoint = () => {      if (!viewpoint) return;      const { guid } = viewpoint;      viewpoint = undefined;      viewpoints.list.delete(guid);    };    controls = BUI.html`      <bim-panel-section label="Controls">        <bim-button @click=${updateSnapshot} label="Update Snapshot"></bim-button>        ${snapshotElement}        <bim-button @click=${updateViewpointCamera} label="Update Viewpoint Camera"></bim-button>        <bim-button @click=${setWorldCamera} label="Set World Camera"></bim-button>        <bim-button @click=${reportComponents} label="Report Selection Components"></bim-button>        <bim-button @click=${isolateComponents} label="Isolate Components"></bim-button>        <bim-button @click=${onDeleteViewpoint} label="Delete Viewpoint"></bim-button>      </bim-panel-section>    `;  }  return BUI.html`    <bim-panel active label="Viewpoints Tutorial" class="options-menu">      <bim-panel-section label="Information">        <bim-label style="white-space: normal; width: 18rem;">To better experience this tutorial, open the developer tool's console in your browser to see some logs.</bim-label>        <bim-button label="Reset Visibility" @click=${onResetVisibility}></bim-button>      </bim-panel-section>      ${controls}    </bim-panel>  `;}, {});viewpoints.list.onItemDeleted.add(() => updatePanel());viewpoints.list.onItemUpdated.add(() => updatePanel());document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to create, update, and manage viewpoints effectively using That Open Engine. Congratulations! Keep exploring more tutorials in the documentation to enhance your skills further.


---

# MODULE: Views
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/Views

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- Views

# Views

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## 📄 Adding 2D Views​

Reviewing a BIM model in 3D is great for spatial understanding, but design communication still relies on 2D — floor plans to check room layouts, elevations to read façade heights, sections to inspect wall and slab assemblies. Switching to these views manually is tedious; generating them programmatically from the model data is the right approach.
This tutorial covers generating floor plan views automatically from IFC storeys, creating elevation views from the model's bounding box, and placing arbitrary section views interactively with a double click on any surface. By the end, you'll have a fully working 2D views system with plans, elevations, and on-demand sections navigable from a UI panel.

### 🖖 Importing our Libraries​

First things first, let's install all necessary dependencies to make this example work:

```typescript
import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🌎 Setting up a Simple Scene​

To get started, let's set up a basic ThreeJS scene. This will serve as the foundation for our application and allow us to visualize the 3D models effectively:

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;const container = document.getElementById("container")!;world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.OrthoPerspectiveCamera(components);await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);components.init();
```

### 🛠️ Setting Up Fragments​

Now, let's configure the FragmentsManager. This will allow us to load models effortlessly and start manipulating them with ease:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());world.onCameraChanged.add((camera) => {  for (const [, model] of fragments.list) {    model.useCamera(camera.three);  }  fragments.core.update(true);});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📂 Loading Fragments Models​

With the core setup complete, it's time to load a Fragments model into our scene. Fragments are optimized for fast loading and rendering, making them ideal for large-scale 3D models.

You can use the sample Fragment files available in our repository for testing. If you have an IFC model you'd like to convert to Fragments, check out the IfcImporter tutorial for detailed instructions.

```typescript
const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",  "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

### ✨ Using The Views Component​

With just one single component, you can create any 2D view you need (plan, elevation, or section). Actually, you can create views at any arbitrary position and normal direction you want. But first things first, let's start by getting an instance of the component.

```typescript
const views = components.get(OBC.Views);// The range defines how far the view will "see".// You can specify a default value, but it can be changed// independently for each view instance after creation.OBC.Views.defaultRange = 100;
```

Views created with the component need a world to be displayed. You can specify the world at creation time, but it's more convenient to set the world directly in the Views component, so all new views created will inherit the value.

```typescript
views.world = world;
```

### 🏢 Creating Views From IFC Storeys​

Despite you can create arbitrary views with the component, it's most common use is to represent the floor plans. You can do the calculations by yourself, but the component comes with a handy method that lets create the views from the IfcStoreys. Doing it is very simple, and you can proceed as follows:

```typescript
// You can specify which models the storeys will be taken from// in order to create the views.// In this case, just the architectural model will be used.await views.createFromIfcStoreys({ modelIds: [/arq/] });
```

It's worth noting that the built-in method to create views from storeys assumes your Fragments Model comes from an IFC model, as it uses the IfcBuildingStorey attributes to extract the information. If your model uses a different schema than IFC, then you must create the views yourself based on the model attributes.

### 🧭 Creating Elevation Views​

Elevations are another useful type of view. They allow you to visualize the model from specific directions, such as north, south, east, or west. To achieve this, the model's bounding boxes are required. However, you don't need to do anything manually, as there is a built-in method that handles the heavy lifting. You can proceed as follows:

```typescript
views.createElevations({ combine: true });
```

Please be aware that the models used in this tutorial have z-fighting issues. This occurs because the same slabs and many walls are present in both models. Because of that, you will see some glitches in the views (even in 3D).

### ✂️ Creating Arbitrary Views​

So far, we have seen how to create views very easily for the most common use cases: plans and elevations. However, construction projects often require very specific 2D views to be made, called sections. As they can be located anywhere in the model, it is more convenient to create them manually. They can be created programmatically or through user interaction. In this case, let's use the Raycaster component to create sections when the user double-clicks on a surface.

```typescript
const casters = components.get(OBC.Raycasters);const caster = casters.get(world);window.addEventListener("dblclick", async () => {  const result = await caster.castRay();  if (!result) return;  const { normal, point } = result;  if (!(normal && point)) return;  // you should invert the normal direction  // so the view looks inside  const invertedNormal = normal.clone().negate();  const view = views.create(invertedNormal, point.addScaledVector(normal, 1), {    id: `View - ${views.list.size + 1}`,    world,  });  // You can specify a different range from the default once the view is created.  view.range = 10;  // Displaying the helper is optional and is recommended only for debugging purposes.  view.helpersVisible = true;});
```

### 🧩 Adding some UI (optional but recommended)​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will add some UI to play around with the actions in this tutorial. For more information about the UI library, you can check the specific documentation for it!

```typescript
type ViewsListTableData = {  Name: string;  Actions: string;};interface ViewsListState {  components: OBC.Components;}const viewsTemplate: BUI.StatefullComponent<ViewsListState> = (state) => {  const { components } = state;  const views = components.get(OBC.Views);  const onCreated = (e?: Element) => {    if (!e) return;    const table = e as BUI.Table<ViewsListTableData>;    table.data = [...views.list.keys()].map((key) => {      return {        data: {          Name: key,          Actions: "",        },      };    });  };  return BUI.html`<bim-table ${BUI.ref(onCreated)}></bim-table>`;};const [viewsTable, updateViewsTable] = BUI.Component.create<  BUI.Table<ViewsListTableData>,  ViewsListState>(viewsTemplate, { components });viewsTable.headersHidden = true;viewsTable.noIndentation = true;viewsTable.columns = ["Name", { name: "Actions", width: "auto" }];viewsTable.dataTransform = {  Actions: (_, rowData) => {    const { Name } = rowData;    if (!Name) return _;    const views = components.get(OBC.Views);    const view = views.list.get(Name);    if (!view) return _;    const onOpen = () => {      views.open(Name);    };    const onRemove = () => {      views.list.delete(Name);    };    return BUI.html`      <bim-button label-hidden icon="solar:cursor-bold" label="Open" @click=${onOpen}></bim-button>      <bim-button label-hidden icon="material-symbols:delete" label="Remove" @click=${onRemove}></bim-button>    `;  },};const updateFunction = () => updateViewsTable();views.list.onItemSet.add(updateFunction);views.list.onItemDeleted.add(updateFunction);views.list.onItemUpdated.add(updateFunction);views.list.onCleared.add(updateFunction);const panel = BUI.Component.create<BUI.PanelSection>(() => {  const onCloseView = () => views.close();  return BUI.html`    <bim-panel active label="2D Views Tutorial" class="options-menu">      <bim-panel-section  label="Info">        <bim-label style="width: 16rem; white-space: normal;" icon="noto-v1:light-bulb">Tip: Go inside the building and double click a wall to create a section</bim-label>      </bim-panel-section>      <bim-panel-section  label="Views">        <bim-button label="Close Active 2D View" @click=${onCloseView}></bim-button>        ${viewsTable}      </bim-panel-section>    </bim-panel>  `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! Now you're able to create 2D views such as plans, elevations, and sections programmatically in your BIM app. Congratulations! Keep going with more tutorials in the documentation.


---

# MODULE: Worlds
**URL:** https://docs.thatopen.com/Tutorials/Components/Core/Worlds

- 
- 👩🏻‍🏫 Tutorials
- Components
- Core
- Worlds

# Worlds

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

### 🌎 Creating our 3D world​

Every BIM application needs a 3D environment to display models — a scene, a camera, and a renderer wired together and running. Setting this up from scratch with raw Three.js requires boilerplate that distracts from the actual app logic. The Worlds component gives you that foundation in a few lines, with sensible defaults and singleton management built in.
This tutorial covers creating a world with a scene, camera, and renderer, loading a BIM model into it, and controlling background color and light intensities through a UI panel. By the end, you'll have the minimal working scene that every other tutorial in the library builds on.

```typescript
import * as THREE from "three";import Stats from "stats.js";import * as BUI from "@thatopen/ui";// You have to import * as OBC from "@thatopen/components"import * as OBC from "../..";
```

### 🖼️ Getting the container​

Next, we need to tell the library where do we want to render the 3D scene. We have added an DIV  element to this HTML page that occupies the whole width and height of the viewport. Let's fetch it by its ID:

```typescript
const container = document.getElementById("container")!;
```

### 🚀 Creating a components instance​

Now we will create a new instance of the Components class. This class is the main entry point of the library. It will be used to register and manage all the components in your application.

Once you are done with your application, you need to dispose the Components instance to free up the memory. This is a requirement of Three.js, which can't dispose the memory of 3D related elements automatically.

```typescript
const components = new OBC.Components();
```

### 🌎 Setting up the world​

Now we are ready to create our first world. We will use the Worlds component to manage all the worlds in your application. Instead of instancing it, we can get it from the Components instance. All components are singleton, so this is always a better way to get them.

```typescript
const worlds = components.get(OBC.Worlds);
```

We can create a new world by calling the create method of the Worlds component. It's a generic method, so we can specify the type of the scene, the camera and the renderer we want to use.

```typescript
const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();
```

Now we can set the scene, the camera and the renderer of the world, and call the init method to start the rendering process.

```typescript
world.scene = new OBC.SimpleScene(components);world.renderer = new OBC.SimpleRenderer(components, container);world.camera = new OBC.SimpleCamera(components);components.init();
```

We could add some lights, but the SimpleScene class can do that easier for us using its setup method:

```typescript
world.scene.setup();
```

We'll make the background of the scene transparent so that it looks good in our docs page, but you don't have to do that in your app!

```typescript
world.scene.three.background = null;
```

### 🏷️ The That Open logo​

Every SimpleRenderer draws a small That Open Company logo in the bottom-left corner of its container. It's on by default, and it's how people discover that the tools powering your app are built by That Open Company, the team that keeps @thatopen/components, @thatopen/fragments, and the rest of the stack free and open source.
Every viewport that keeps the logo visible helps us reach more developers, which in turn lets us keep investing in the libraries you're using to build your app. If the logo works for your design, we'd genuinely appreciate you leaving it on. Thank you! 💜
That said, we know it won't fit every product. If your app needs a clean viewport (a full-bleed print view, a white-label embed, a customer-branded surface), you can hide it per renderer via the showLogo property. It's live, so you can flip it at any time after the renderer is created.

```typescript
world.renderer.showLogo = true;
```

### 💄 Adding things to our scene​

Now we are ready to start adding some 3D entities to our scene. We will load a Fragments model:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId });  }),);
```

Finally, we will make the camera look at the model:

```typescript
await world.camera.controls.setLookAt(68, 23, -8.5, 21.5, -5.5, 23);await fragments.core.update(true);
```

### 🧩 Adding some UI​

We will use the @thatopen/ui library to add some simple and cool UI elements to our app. First, we need to call the init method of the BUI.Manager class to initialize the library:

```typescript
BUI.Manager.init();
```

Now we will create a new panel with some inputs to change the background color of the scene and the intensity of the directional and ambient lights. For more information about the UI library, you can check the specific documentation for it!

```typescript
const panel = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`    <bim-panel label="Worlds Tutorial" class="options-menu">      <bim-panel-section label="Controls">              <bim-color-input           label="Background Color" color="#202932"           @input="${({ target }: { target: BUI.ColorInput }) => {            world.scene.config.backgroundColor = new THREE.Color(target.color);          }}">        </bim-color-input>                <bim-number-input           slider step="0.1" label="Directional lights intensity" value="1.5" min="0.1" max="10"          @change="${({ target }: { target: BUI.NumberInput }) => {            world.scene.config.directionalLight.intensity = target.value;          }}">        </bim-number-input>                <bim-number-input           slider step="0.1" label="Ambient light intensity" value="1" min="0.1" max="5"          @change="${({ target }: { target: BUI.NumberInput }) => {            world.scene.config.ambientLight.intensity = target.value;          }}">        </bim-number-input>              </bim-panel-section>    </bim-panel>    `;});document.body.append(panel);
```

And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.

```typescript
const button = BUI.Component.create<BUI.PanelSection>(() => {  return BUI.html`      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"        @click="${() => {          if (panel.classList.contains("options-menu-visible")) {            panel.classList.remove("options-menu-visible");          } else {            panel.classList.add("options-menu-visible");          }        }}">      </bim-button>    `;});document.body.append(button);
```

### ⏱️ Measuring the performance (optional)​

We'll use the Stats.js to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.

```typescript
const stats = new Stats();stats.showPanel(2);document.body.append(stats.dom);stats.dom.style.left = "0px";stats.dom.style.zIndex = "unset";world.renderer.onBeforeUpdate.add(() => stats.begin());world.renderer.onAfterUpdate.add(() => stats.end());
```

### 🎉 Wrap up​

That's it! You have created your first 3D world and added some UI elements to it. You can now play with the inputs to see how the scene changes.


---

# MODULE: Fragments
**URL:** https://docs.thatopen.com/Tutorials/Fragments/

- 
- 👩🏻‍🏫 Tutorials
- Fragments

# Fragments

TOC
|
documentation
|
demo
|
community
|
npm package

TOC
|
documentation
|
demo
|
community
|
npm package

# Fragments

Fragments is an open-source library designed to store, display, navigate, and edit massive amounts of BIM data with exceptional efficiency—on any device.

This repository contains the format and a whole toolkit to start building on top.

## 🤝 Want our help?​

Are you developing a project with our technology and would like our help?
Apply now to join That Open Accelerator Program!

## 🧩 The Format​

Fragments defines an open BIM format optimized for handling large datasets efficiently.

- Binary and compact for performance
- Free and open source
- Supports geometries, properties, and relationships

Binary and compact for performance

Free and open source

Supports geometries, properties, and relationships

The format is built with Google's FlatBuffers, an efficient cross-platform serialization library. This means you can create your own Fragments importer/exporter in any programming language. Just refer to the FlatBuffers documentation to get started.

📄 You can find the Fragments schema here. It defines what kind of data Fragments can store—anything the schema supports, you can include.

This library also includes a TypeScript/JavaScript importer/exporter, so you can get up and running fast. But feel free to build your own!

That said, the easiest way to generate Fragments is by using the built-in IfcImporter, described below.

## 🚀 The 3D Engine​

Fragments comes with a high-performance 3D viewer built on top of Three.js. It’s designed to handle millions of elements in seconds, making it ideal for web-based BIM applications.

With it, you can:

- Display large BIM models efficiently on any device
- Highlight, filter, raycast, and snap elements
- Retrieve properties and interact with the model

Display large BIM models efficiently on any device

Highlight, filter, raycast, and snap elements

Retrieve properties and interact with the model

## 🔄 Importers and exporters​

This library includes an IfcImporter that works both in the frontend and backend. It makes it simple to bring your IFC data into the Fragments ecosystem.

We're planning to release more importers/exporters to help integrate Fragments into a wide variety of BIM workflows.

Whether you're building a lightweight BIM viewer, a full-scale application, or just exploring the future of open BIM formats, Fragments gives you the tools to do it—fast, open, and free.

For more information and tutorials, check out our documentation.

## 🤝 Contributing​

Thinking of sending a PR? Awesome! Please read our contributing guide first — it covers the code conventions we follow (JSDoc, examples, resources, etc.) so your changes sail through review.


---

# MODULE: UserInterface
**URL:** https://docs.thatopen.com/Tutorials/UserInterface/

- 
- 👩🏻‍🏫 Tutorials
- UserInterface

# UserInterface

TOC
|
Documentation
|
Demo
|
Community
|
NPM Package

TOC
|
Documentation
|
Demo
|
Community
|
NPM Package

# BIM UI Components

BIM UI Components is the ultimate set of user interface elements you need to create fully featured BIM applications 🚀

## 🤝 Want our help?​

Are you developing a project with our technology and would like our help?
Apply now to join That Open Accelerator Program!

## How it works? 🤓​

This library is a monorepo where separate but correlated repositories exists in the packages folder. The main repository resides in core.

- @thatopen/ui: This is the core library. Here, you will find all the core components needed to build your user interfaces, so you can expect a button, panel, toolbar, table, inputs, and some other components.

Now, from the @thatopen/ui you can't expect to have functionalities in your components. In other words, if you need a button component to load an IFC file from @thatopen/components you will need to code that by yourself 🙁. However, as the goal of the library is to save you as much time as possible, we've created implementations of the components based on things we know you're probably going to need at some point 💪. Here is were it comes the other repository in the monorepo.

Think on the following repository as plug-n-play functional components that uses the core library to build ready to go pieces of UI with the functionalities to work nice and neat:

- @thatopen/ui-obc: Here you will find pre-made functional components for many things in @thatopen/components (the entry point of That Open Engine). You can expect to have from a button that loads an IFC file, to a table to configure your app tools or a panel to view all your model classifications. Basically, @thatopen/components gives you the functionality, while @thatopen/ui-obc gives you the UI to interact with those functionalities.

[!IMPORTANT]
All the implementation libraries need @thatopen/ui to be installed along with the respective packages they are giving UIs to. See the respective package.json files in each repository.

### Why a monorepo? 🤷‍♀️​

Easy, because we care about your final app bundle size. You see, the repositories that contains implementations of the UIComponents for different libraries, relies on the libraries to be installed in the project because they're required as peerDependencies. So, if we included all the pre-built UIComponents from @thatopen/ui-obc in the core library, you will always need to have @thatopen/components and @thatopen/components-front installed in your project even tough you're not using it.

### Does these components works in my favorite framework? 🤔​

Well... yes! You name it, React? Angular? Vue? Svelte? The answer is absolutely yes. Basically, you can use these componentes anywhere HTML is accepted. If you're wondering how is that possible, is becase we're using Web Components 🔥

If you're new to Web Components, no worries! Simply put, Web Components is a browser API that let's you define your own HTML tags (DOM Elements) to be used in the document. They define the look and behavior of the elements. Have you ever seen an HTML that looks something like this?

```typescript
<div>  <unknown-tag /></div>
```

As you may recall from your HTML knowledge, <unkown-tag /> is not somethings built-in in HTML... well, that's because is a Web Component! So the developer created it's own tag to use it in the document.

Web Components are extremely powerfull because they do mostly the same as the components you create in any framework, just they are framework agnostic and feel way more built-in. In other words, if you create a component in your framework you're not allowed to write the following directly in your HTML file:

```typescript
<my-framework-component />
```

You always need to rely on your framework tools in order to render your component, so you must use JavaScript. However, if you create a Web Component you can use it in your HTML with nothing else needed.

[!IMPORTANT]
Despite Web Components is a browser API, we used Lit to create the components as it makes the process way much easier. Also, we recommend checking your favorite framework documentation to implement web components, some of them needs a pretty basic setup to get up and running.

## Getting Started​

To use the UIComponents, you need to install at least the core library from your terminal like this:

```typescript
npm i @thatopen/ui
```

Then, you need to tell the library to register the components, so you can use them in any HTML syntax. To do it, in your entry JavaScript file execute the following:

```typescript
import * as BUI from "@thatopen/ui"BUI.Manager.init()
```

Finally, in your HTML file you can start to use the components!

```typescript
<bim-grid id="grid">  <bim-toolbars-container style="grid-area: header">    <bim-toolbar label="Toolbar A" active>      <bim-toolbar-section label="Build">        <bim-button vertical label="My Button" icon="solar:bookmark-square-minimalistic-bold"></bim-button>        <bim-toolbar-group>          <bim-button icon="solar:album-bold"></bim-button>          <bim-button icon="solar:archive-linear"></bim-button>          <bim-button icon="solar:battery-charge-minimalistic-broken"></bim-button>          <bim-button icon="solar:bluetooth-square-outline"></bim-button>        </bim-toolbar-group>      </bim-toolbar-section>    </bim-toolbar>    <bim-toolbar label="Toolbar B">      <bim-toolbar-section label="Section">        <bim-button vertical label="Button A" icon="bx:command"></bim-button>        <bim-button vertical label="Button B" icon="bx:fast-forward-circle"></bim-button>        <bim-button vertical label="Button C" icon="bx:support"></bim-button>      </bim-toolbar-section>    </bim-toolbar>  </bim-toolbars-container>  <div id="my-panel" style="grid-area: sidebar; background-color: var(--bim-ui_bg-base)">    <bim-panel label="Panel A">      <bim-panel-section label="Build">        <bim-text-input label="Tool Name" value="BCFManager"></bim-text-input>        <bim-input label="Position" vertical>          <bim-number-input pref="X" min="1" value="10" max="50" suffix="m" slider></bim-number-input>          <bim-number-input pref="X" min="1" value="20" max="50" suffix="m" slider></bim-number-input>          <bim-number-input pref="X" min="1" value="30" max="50" suffix="m" slider></bim-number-input>        </bim-input>        <bim-dropdown label="IFC Entity">          <bim-option label="IFCWALL"></bim-option>          <bim-option label="IFCWINDOW"></bim-option>          <bim-option label="IFCSLAB"></bim-option>        </bim-dropdown>      </bim-panel-section>    </bim-panel>  </div></bim-grid>
```

[!TIP]
You can get any icon from Iconify!

And, in your JavaScript file:

```typescript
const grid = document.getElementById("grid")grid.layouts = {  main: `    "header header" auto    "sidebar content" 1fr    "sidebar content" 1fr    / auto 1fr  `}grid.setLayout("main")
```

To know more about the UIComponents, you can explore the README files in each repository under the packages folder and also explore the documentation. You can find the link at the top of this README file.

## 🤝 Contributing​

Thinking of sending a PR? Awesome! Please read our contributing guide first — it covers the code conventions we follow (JSDoc, examples, resources, etc.) so your changes sail through review.


---

# MODULE: Attributes
**URL:** https://docs.thatopen.com/Tutorials/UserInterface/OBC/Attributes

- 
- 👩🏻‍🏫 Tutorials
- UserInterface
- OBC
- Attributes

# Attributes

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## Data-Driven Charts for BIM  BIM 🚀​

BIM managers and project leads who want to understand model composition at a glance — how many column types exist, what names appear most — currently have to count or filter elements manually, with no direct link between the chart and the model itself.
The attributes chart factory generates a live chart tied to a BIM model: it queries a category and attribute, groups the results, and returns both the chart element and an update function that can be re-targeted to any model or attribute after load.
This tutorial covers setting up a 3D world and loading a Fragment model; creating a pie chart and a bar chart from the attributes chart factory with initial empty filters; connecting a shared chart legend that shows entry labels and fires a visibility toggle when clicked; updating both charts on model load to query column names; highlighting chart entries that exceed a threshold value; filtering the chart to show only entries above that threshold; and resetting the chart to its original state.
By the end, you'll have a side-panel with two attribute-driven charts linked to the 3D model, a shared legend that toggles element visibility, and highlight, filter, and reset actions wired to chart data.

```typescript
import * as OBC from "@thatopen/components";import * as BUI from "@thatopen/ui";import * as OBCF from "@thatopen/components-front";import * as BUIC from "../..";
```

### 📋 Initializing the UI​

As always, let's first initialize the UI library. Remember you only have to do it once in your entire app.

```typescript
BUI.Manager.init();
```

### 🌎 Setting Up the 3D World​

Since our charts will be visualizing data from a 3D model, we first need a place to display that model. We'll set up a simple 3D world containing a scene, a camera, and a renderer. This will be the canvas where our BIM model lives. If you're new to this, be sure to check out the "Worlds" tutorial for a detailed guide.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.name = "main";const sceneComponent = new OBC.SimpleScene(components);sceneComponent.setup();world.scene = sceneComponent;const viewport = document.createElement("bim-viewport");const rendererComponent = new OBC.SimpleRenderer(components, viewport);world.renderer = rendererComponent;const cameraComponent = new OBC.SimpleCamera(components);world.camera = cameraComponent;await world.camera.controls.setLookAt(65, 19, -27, 12.6, -5, -1.4);viewport.addEventListener("resize", () => {  rendererComponent.resize();  cameraComponent.updateAspect();});const grids = components.get(OBC.Grids);grids.create(world);components.init();
```

### 🧩 Configuring Loaders and Managers​

To get data from a BIM model, we first need to load it. Here, we'll set up the IfcLoader to handle IFC files and the FragmentsManager to process the model's geometry and data into an efficient format. These components work together to get our model into the scene and make its data accessible for our charts.

```typescript
const ifcLoader = components.get(OBC.IfcLoader);await ifcLoader.setup({  wasm: { absolute: true, path: "https://unpkg.com/web-ifc@0.0.77/" },});// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📊 Creating the Attribute Charts​

Here comes the magic. Instead of building charts from scratch, we'll use our powerful attributesChart factory. This function creates a bim-chart pre-configured to automatically extract and display data from your BIM models based on specified attributes.
We'll create two instances: a pie chart and a bar chart. We'll initialize them with empty attribute and category filters, as we'll populate them dynamically once the model is loaded.

```typescript
const [pieChart, updatePie] = BUIC.charts.attributesChart({  type: "pie",  addLabels: false,  attribute: /empty/,  category: /empty/,  modelId: "",  components,});const [barChart, updateBar] = BUIC.charts.attributesChart({  type: "bar",  addLabels: false,  attribute: /empty/,  category: /empty/,  modelId: "",  components,});pieChart.borderColor = "#00000000";barChart.borderColor = "#00000000";
```

### 🏷️ Adding Interactive Labels​

To make our charts interactive, we'll add a <bim-chart-legend> component. This will serve as a dynamic legend for our charts. We'll then connect its label-click event to the Hider component. This setup allows users to click on a label in the legend to instantly show or hide all the corresponding elements in the 3D model, providing a seamless link between the data visualization and the model itself.

```typescript
const labels = BUI.Component.create(() => {  return BUI.html`    <bim-chart-legend>      <bim-label slot="no-chart" icon="ph:warning-fill" style="--bim-icon--c: gold;">No charts Attached</bim-label>      <bim-label slot="missing-data" icon="ph:warning-fill" style="--bim-icon--c: gold;">No data to display</bim-label>    </bim-chart-legend>`;}) as BUI.ChartLegend;const hider = components.get(OBC.Hider);(labels as any).addEventListener("label-click", async (event: CustomEvent) => {  const { data, visibility } = event.detail;  for (const info of data) {    const { modelIdMap } = info;    await hider.set(visibility, modelIdMap);  }});pieChart.addEventListener("data-loaded", () => {  labels.charts = [...labels.charts, pieChart];});barChart.addEventListener("data-loaded", () => {  labels.charts = [...labels.charts, barChart];});world.camera.controls.addEventListener("update", () =>  fragments.core.update(true),);
```

### 🎣 Loading the Model and Populating the Charts​

This is where we connect the model to our charts. We'll listen for the onItemSet event on the FragmentsManager. As soon as our model is loaded, this event will fire.
Inside the event handler, we'll call the updatePie and updateBar functions that we got from our factory. We'll pass them the attribute (Name) and category (DOOR) we want to analyze. This tells the charts to automatically find all elements matching the criteria, count them, and display the results. After that, we proceed to load a model fragment.

```typescript
fragments.list.onItemSet.add(async ({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  await fragments.core.update(true);  updatePie({    attribute: /^Name$/,    category: /COLUMN/,    modelId: model.modelId,  });  updateBar({    attribute: /^Name$/,    category: /COLUMN/,    modelId: model.modelId,  });  pieChart.label = "Pie Chart Data";  barChart.label = "Bar Chart Data";});const name = "sample";const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId: name });  }),);
```

### ✨ Interacting with Chart Data​

Our charts come with built-in methods for easy data manipulation. To demonstrate this, we'll create three buttons:

- Highlight: Uses the highlight() method to visually emphasize data points that meet a certain condition (e.g., values greater than 100).
- Filter: Uses the filterByValue() method to hide data points that don't meet the condition.
- Reset: Uses the reset() method to restore the chart to its original state.

```typescript
const onHighlight = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.highlight((entry) => {    if (!("value" in entry)) return false;    return entry.value > 100;  });  target.loading = false;};const highlightButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Highlight" @click=${onHighlight}></bim-button>`;});const onFilter = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.filterByValue((entry) => {    if (!("value" in entry)) return false;    return entry.value > 100;  });  target.loading = false;};const filterButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Filter" @click=${onFilter}></bim-button>`;});const onReset = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.reset();  target.loading = false;};const resetButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Reset" @click=${onReset}></bim-button>`;});
```

### 🏗️ Assembling the UI Panel​

With all our components ready, it's time to put them together. We'll create a <bim-panel> to neatly organize our chart, the interactive labels, and the action buttons into separate sections. This panel will serve as the main UI for our chart visualization.

```typescript
const chartPanel = BUI.Component.create(() => {  return BUI.html`    <bim-panel style="display: flex; flex-direction: column; height: 100%;">      <bim-panel-section label="Attributes Pie Chart" icon="raphael:piechart" style="flex: 1;">        ${pieChart}      </bim-panel-section>      <bim-panel-section label="Labels" icon="raphael:tag" style="flex: 0.1;">      ${labels}      </bim-panel-section>      <bim-panel-section label="Actions" style="display: flex; flex-direction: column; gap: 1.5rem;">        ${highlightButton}        ${filterButton}        ${resetButton}      </bim-panel-section>     </bim-panel>`;});const highlighter = components.get(OBCF.Highlighter);highlighter.setup({ world });
```

Finally, let's create a BIM Grid element and provide both the panel and the viewport to display everything.

```typescript
const app = document.createElement("bim-grid") as BUI.Grid<["main"]>;app.layouts = {  main: {    template: `    "chartPanel viewport 3fr"    /25rem 1fr    `,    elements: { chartPanel, viewport },  },};app.layout = "main";document.body.append(app);
```

### 🎉 Congratulations!​

You've successfully built a powerful BIM data visualization tool! You've learned how to use the attributesChart to automatically analyze model data based on specific properties (like "Name" for all "DOORs"), link the chart to an interactive legend, and connect it all back to the 3D model for a seamless user experience. You're now ready to create insightful, attribute-based dashboards in your own BIM applications. Keep up the great work!


---

# MODULE: Categories
**URL:** https://docs.thatopen.com/Tutorials/UserInterface/OBC/Categories

- 
- 👩🏻‍🏫 Tutorials
- UserInterface
- OBC
- Categories

# Categories

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## Visualizing BIM Data by Category 🏛️​

Architects and project managers who need a quick breakdown of model composition — how many walls, doors, slabs, and columns are in the model — have no way to get that overview without manually querying each category or opening a spreadsheet.
The categories chart factory counts elements by IFC category across a loaded model and populates a chart automatically, with no manual data preparation beyond providing the model ID map.
This tutorial covers setting up a 3D world and configuring the Fragment loader; creating a pie chart and a bar chart from the categories chart factory; building a model ID map by collecting element IDs with geometry across all loaded models; updating both charts on model load with that map; connecting a shared chart legend that displays category labels; and wiring highlight, filter by threshold, and reset actions to the pie chart.
By the end, you'll have a side-panel with two category-distribution charts populated automatically from the loaded model, a shared legend, and interactive data actions.

```typescript
import * as OBC from "@thatopen/components";import * as OBCF from "@thatopen/components-front";import * as BUI from "@thatopen/ui";import * as BUIC from "../..";
```

### 📋 Initializing the UI​

As always, let's first initialize the UI library. Remember you only have to do it once in your entire app.

```typescript
BUI.Manager.init();
```

### 🌎 Setting Up the 3D World​

Since our charts will be visualizing data from a 3D model, we first need a place to display that model. We'll set up a simple 3D world containing a scene, a camera, and a renderer. This will be the canvas where our BIM model lives. If you're new to this, be sure to check out the "Worlds" tutorial for a detailed guide.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.name = "main";const sceneComponent = new OBC.SimpleScene(components);sceneComponent.setup();world.scene = sceneComponent;const viewport = document.createElement("bim-viewport");const rendererComponent = new OBC.SimpleRenderer(components, viewport);world.renderer = rendererComponent;const cameraComponent = new OBC.SimpleCamera(components);world.camera = cameraComponent;await world.camera.controls.setLookAt(65, 19, -27, 12.6, -5, -1.4);viewport.addEventListener("resize", () => {  rendererComponent.resize();  cameraComponent.updateAspect();});const grids = components.get(OBC.Grids);grids.create(world);components.init();
```

### 🧩 Configuring Loaders and Managers​

To get data from a BIM model, we first need to load it. Here, we'll set up the IfcLoader to handle IFC files and the FragmentsManager to process the model's geometry and data into an efficient format. These components work together to get our model into the scene and make its data accessible for our charts.

```typescript
const ifcLoader = components.get(OBC.IfcLoader);await ifcLoader.setup({  wasm: { absolute: true, path: "https://unpkg.com/web-ifc@0.0.77/" },});// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📊 Creating the Category Charts​

Now, let's create the charts. We'll use the categoriesChart factory, which is specifically designed to create charts that visualize the distribution of elements by their IFC category. It automatically counts how many items belong to each category (e.g., IFCWALL, IFCDOOR, IFCWINDOW) and displays the results.
We will create a pie chart and a bar chart instance. They will be populated with data later.

```typescript
const [pieChart, updatePie] = BUIC.charts.categoriesChart({  type: "pie",  addLabels: true,  modelIdMap: {},  components,});const [barChart, updateBar] = BUIC.charts.categoriesChart({  type: "bar",  addLabels: false,  modelIdMap: {},  components,});pieChart.borderColor = "#00000000";barChart.borderColor = "#00000000";
```

### 🗺️ Mapping the Model Data​

Before the chart can count the categories, it needs to know which elements to consider. We'll create a helper function called buildModelIdMap that iterates through our loaded model fragments and gathers the IDs of all items that have geometry. This map of Model IDs to Element IDs will be the input for our charts.

```typescript
async function buildModelIdMap() {  const modelIdMap: { [modelId: string]: Set<number> } = {};  for (const [modelId, model] of fragments.list) {    const localIds: number[] = [];    const geometryItems = await model.getItemsWithGeometry();    for (const item of geometryItems) {      if (!item) continue;      const localId = await item.getLocalId();      if (!localId) continue;      localIds.push(localId);      modelIdMap[modelId] = new Set(localIds);    }  }  return modelIdMap;}
```

### 🏷️ Adding Interactive Labels​

A chart is even better when it's interactive. We'll add a <bim-chart-legend> component to act as a dynamic legend. This component will automatically display the categories found in our charts. We will later connect this to the model to allow filtering by clicking on the labels.

```typescript
const labels = BUI.Component.create(() => {  return BUI.html`    <bim-chart-legend>      <bim-label slot="no-chart" icon="ph:warning-fill" style="--bim-icon--c: gold;">No charts Attached</bim-label>      <bim-label slot="missing-data" icon="ph:warning-fill" style="--bim-icon--c: gold;">No data to display</bim-label>    </bim-chart-legend>`;}) as BUI.ChartLegend;pieChart.addEventListener("data-loaded", () => {  labels.charts = [...labels.charts, pieChart];});barChart.addEventListener("data-loaded", () => {  labels.charts = [...labels.charts, barChart];});world.camera.controls.addEventListener("update", () =>  fragments.core.update(true),);
```

### 🚀 Loading the Model & Populating the Charts​

Now, let's tie everything together. We'll listen for the onItemSet event on the FragmentsManager. When a new model is loaded, we'll execute our logic:

- Add the model to our 3D world.
- Call our buildModelIdMap() function to get all the element IDs.
- Pass this map to our updatePie() and updateBar() functions.
This will trigger the charts to process the data and display the count of elements for each category found in the model.

```typescript
fragments.list.onItemSet.add(async ({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  await fragments.core.update(true);  const modelIdMap = await buildModelIdMap();  updatePie({ modelIdMap });  updateBar({ modelIdMap });  pieChart.label = "Pie Chart Data";  barChart.label = "Bar Chart Data";});
```

### ✨ Interacting with Chart Data​

Our charts come with built-in methods for easy data manipulation. To demonstrate this, we'll create three buttons:

- Highlight: Uses the highlight() method to visually emphasize data points that meet a certain condition (e.g., values greater than 100).
- Filter: Uses the filterByValue() method to hide data points that don't meet the condition.
- Reset: Uses the reset() method to restore the chart to its original state.

```typescript
const onHighlight = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.highlight((entry) => {    if (!("value" in entry)) return false;    return entry.value > 100;  });  target.loading = false;};const highlightButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Highlight" @click=${onHighlight}></bim-button>`;});const onFilter = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.filterByValue((entry) => {    if (!("value" in entry)) return false;    return entry.value > 100;  });  target.loading = false;};const filterButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Filter" @click=${onFilter}></bim-button>`;});const onReset = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.reset();  target.loading = false;};const resetButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Reset" @click=${onReset}></bim-button>`;});
```

### 🏗️ Assembling the UI Panel​

With all our components ready, it's time to put them together. We'll create a <bim-panel> to neatly organize our pie chart, bar chart, the interactive labels, and the action buttons into separate sections. This panel will serve as the main UI for our chart visualization.

```typescript
const chartPanel = BUI.Component.create(() => {  const [loadFragBtn] = BUIC.buttons.loadFrag({ components });  return BUI.html`    <bim-panel style="display: flex; flex-direction: column; height: 100%;">      <bim-panel-section label="Categories Pie Chart" icon="raphael:piechart" style="flex: 1;">        ${pieChart}      </bim-panel-section>      <bim-panel-section label="Categories Bar Chart" icon="raphael:barchart" style="flex: 1;">        ${barChart}      </bim-panel-section>      <bim-panel-section label="Labels" icon="raphael:tag" style="flex: 0.1;">      ${labels}      </bim-panel-section>      <bim-panel-section label="Actions" style="display: flex; flex-direction: column; gap: 1.5rem;">        ${loadFragBtn}        ${highlightButton}        ${filterButton}        ${resetButton}      </bim-panel-section>     </bim-panel>`;});
```

### 🤝 Linking Chart Events to the 3D Model​

To complete the integration, we'll set up the Highlighter component. This will allow interactions in our chart (like clicking a label or a chart segment) to visually affect the 3D model, creating a true two-way connection between the data and the geometry.

```typescript
const highlighter = components.get(OBCF.Highlighter);highlighter.setup({ world });
```

### 🏁 Final Layout​

Finally, let's create a <bim-grid> element to define the overall layout of our application, placing our newly created chart panel alongside the 3D viewport.

```typescript
const app = document.createElement("bim-grid") as BUI.Grid<["main"]>;app.layouts = {  main: {    template: `    "chartPanel viewport 3fr"    /25rem 1fr    `,    elements: { chartPanel, viewport },  },};app.layout = "main";document.body.append(app);
```

### 🎉 Congratulations!​

You've successfully built a powerful BIM data visualization tool! You've learned how to use the categoriesChart to automatically generate charts from your model's data, link them with interactive labels, and display everything in a clean, professional-looking panel. You're now ready to bring powerful data insights to your own BIM applications. Keep up the great work!


---

# MODULE: IDS
**URL:** https://docs.thatopen.com/Tutorials/UserInterface/OBC/IDS

- 
- 👩🏻‍🏫 Tutorials
- UserInterface
- OBC
- IDS

# IDS

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## Visualizing IDS Validation Results 📊​

BIM managers and data quality teams need to verify that elements comply with project data requirements — such as all doors having a fire rating — but reviewing validation results element by element in a spreadsheet gives no spatial or quantitative overview of how many elements passed or failed.
The IDS chart factory takes a validation result object and generates a chart that breaks down pass, fail, and unchecked counts visually, with no manual data transformation required.
This tutorial covers defining an IDS specification with an entity applicability facet (all doors) and a property requirement facet (FireRating in Pset_DoorCommon); running the validation against a loaded model; highlighting passing elements in green and failing elements in red directly in the viewport; creating a pie chart and a bar chart from the IDS result; connecting a shared legend; and wiring highlight, filter by threshold, and reset actions to the pie chart.
By the end, you'll have a validation dashboard with pass/fail charts linked to color-coded elements in the 3D model, giving an immediate spatial and quantitative view of IDS compliance.

```typescript
import * as OBC from "@thatopen/components";import * as OBCF from "@thatopen/components-front";import * as BUI from "@thatopen/ui";import * as FRAGS from "@thatopen/fragments";import * as THREE from "three";import * as BUIC from "../..";
```

### 📋 Initializing the UI​

As always, let's first initialize the UI library. Remember you only have to do it once in your entire app.

```typescript
BUI.Manager.init();
```

### 🌎 Setting Up the 3D World​

Our validation results will be linked to a 3D model, so we first need a place to display it. We'll set up a simple 3D world containing a scene, a camera, and a renderer.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.name = "main";const sceneComponent = new OBC.SimpleScene(components);sceneComponent.setup();world.scene = sceneComponent;const viewport = document.createElement("bim-viewport");const rendererComponent = new OBC.SimpleRenderer(components, viewport);world.renderer = rendererComponent;const cameraComponent = new OBC.SimpleCamera(components);world.camera = cameraComponent;await world.camera.controls.setLookAt(65, 19, -27, 12.6, -5, -1.4);viewport.addEventListener("resize", () => {  rendererComponent.resize();  cameraComponent.updateAspect();});const grids = components.get(OBC.Grids);grids.create(world);components.init();
```

### 🧩 Configuring Loaders and Managers​

Next, we'll configure the IfcLoader and FragmentsManager. These components are essential for loading our BIM model and processing its geometry and data so that it can be rendered and, more importantly, audited against our IDS rules.

```typescript
const ifcLoader = components.get(OBC.IfcLoader);ifcLoader.settings.autoSetWasm = false;await ifcLoader.setup({  wasm: { absolute: false, path: "https://unpkg.com/web-ifc@0.0.77/" },});// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### 📜 Defining the IDS Specification​

This is the heart of our validation workflow. We'll use the IDSSpecifications component to programmatically define a data requirement. An IDS is made of "facets," which define what to check (applicability) and what to check for (requirements).
In this example, we'll create a simple specification:

- Applicability: Look for all elements of the type IFCDOOR.
- Requirement: Check if they have a property named FireRating inside the Pset_DoorCommon property set.

```typescript
const ids = components.get(OBC.IDSSpecifications);const spec = ids.create("Sample", ["IFC4"]);spec.description =  "All doors must have FireRating specified in Pset_DoorCommon";const entity = new OBC.IDSEntity(components, {  type: "simple",  parameter: "IFCDOOR",});const property = new OBC.IDSProperty(  components,  {    type: "simple",    parameter: "Pset_DoorCommon",  },  { type: "simple", parameter: "FireRating" },);spec.applicability.add(entity);spec.requirements.add(property);
```

### 🚀 Loading the BIM Model​

With our validation rule defined, let's load the BIM model we want to test. We will listen for when the model is added to the FragmentsManager to continue with our logic.

```typescript
const name = "sample";fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});const fragPaths = [  "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",];await Promise.all(  fragPaths.map(async (path) => {    const modelId = path.split("/").pop()?.split(".").shift();    if (!modelId) return null;    const file = await fetch(path);    const buffer = await file.arrayBuffer();    return fragments.core.load(buffer, { modelId: name });  }),);
```

### ✅ Running the Validation & Visualizing Results​

Now that the model is loaded and the IDS is defined, let's run the test! We'll call spec.test() on our model. This will return a detailed result object.
We'll then use a helper function, ids.getModelIdMap(), to easily get the IDs of all elements that passed and failed the validation. To provide immediate visual feedback, we'll use the FragmentsManager to highlight the passing elements in green and the failing ones in red directly in the 3D viewport.

```typescript
const idsResult = await spec.test([new RegExp(name)]);const { fail, pass } = ids.getModelIdMap(idsResult);const highlightPromises = [fragments.resetHighlight()];highlightPromises.push(  fragments.highlight(    {      customId: "green",      color: new THREE.Color("green"),      renderedFaces: FRAGS.RenderedFaces.ONE,      opacity: 1,      transparent: false,    },    pass,  ),);highlightPromises.push(  fragments.highlight(    {      customId: "red",      color: new THREE.Color("red"),      renderedFaces: FRAGS.RenderedFaces.ONE,      opacity: 1,      transparent: false,    },    fail,  ),);highlightPromises.push(fragments.core.update(true));await Promise.all(highlightPromises);
```

### 📈 Creating the IDS Chart​

With the validation complete, it's time to visualize the results. We'll use the idsChart factory, which is specifically designed for this purpose. We simply pass the idsResult object we obtained from the validation step, and the factory will generate charts that clearly display the number of passing, failing, and unchecked elements.

```typescript
const [pieChart] = BUIC.charts.idsChart({  type: "pie",  addLabels: true,  idsResult,  components,});const [barChart] = BUIC.charts.idsChart({  type: "bar",  addLabels: false,  idsResult,  components,});pieChart.borderColor = "#00000000";barChart.borderColor = "#00000000";
```

### 🏷️ Adding Interactive Labels​

To complement our charts, we'll add a <bim-chart-legend> component. This will act as a legend, showing the different result types (Pass, Fail, Unchecked). In a more advanced implementation, you could connect this to the Highlighter to allow users to toggle the visibility of element groups by clicking the labels.

```typescript
const labels = BUI.Component.create<BUI.ChartLegend>(() => {  return BUI.html`    <bim-chart-legend>      <bim-label slot="missing-data">No data to display</bim-label>      <bim-label slot="no-chart">No chart attached</bim-label>    </bim-chart-legend>`;});pieChart.addEventListener("data-loaded", () => {  labels.charts = [...labels.charts, pieChart];});barChart.addEventListener("data-loaded", () => {  labels.charts = [...labels.charts, barChart];});
```

### ✨ Interacting with Chart Data​

Our charts also support further client-side interaction. To demonstrate, we'll create buttons that use the chart's built-in highlight(), filterByValue(), and reset() methods to dynamically explore the results without re-running the validation.

```typescript
const onHighlight = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.highlight((entry) => {    if (!("value" in entry)) return false;    return entry.value > 100;  });  target.loading = false;};const highlightButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Highlight" @click=${onHighlight}></bim-button>`;});const onFilter = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.filterByValue((entry) => {    if (!("value" in entry)) return false;    return entry.value > 100;  });  target.loading = false;};const filterButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Filter" @click=${onFilter}></bim-button>`;});const onReset = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.reset();  target.loading = false;};const resetButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Reset" @click=${onReset}></bim-button>`;});
```

### 🏗️ Assembling the UI Panel​

Now, let's bring all our UI elements together. We'll create a <bim-panel> that neatly organizes our pie and bar charts, the legend, and our action buttons into a clean, professional-looking dashboard.

```typescript
const chartPanel = BUI.Component.create(() => {  return BUI.html`    <bim-panel style="display: flex; flex-direction: column; height: 100%;">      <bim-panel-section label="IDS Result Pie Chart" icon="raphael:piechart" style="flex: 1;">        ${pieChart}      </bim-panel-section>      <bim-panel-section label="IDS Result Bar Chart" icon="raphael:barchart" style="flex: 1;">        ${barChart}      </bim-panel-section>      <bim-panel-section label="Labels" icon="raphael:tag" style="flex: 0.1;">      ${labels}      </bim-panel-section>      <bim-panel-section label="Actions" style="display: flex; flex-direction: column; gap: 1.5rem;">        ${highlightButton}        ${filterButton}        ${resetButton}      </bim-panel-section>     </bim-panel>`;});
```

### 🤝 Linking Chart Events to the 3D Model​

Although we've already highlighted the initial validation results, we also need to set up the Highlighter component. This ensures that future interactions (e.g., from clicking on chart segments, which can be implemented separately) can also be visually linked back to the 3D model.

```typescript
const highlighter = components.get(OBCF.Highlighter);highlighter.setup({ world });
```

### 🏁 Final Layout​

Finally, let's create a <bim-grid> element to define the overall layout of our application, placing our newly created validation dashboard alongside the 3D viewport.

```typescript
const app = document.createElement("bim-grid") as BUI.Grid<["main"]>;app.layouts = {  main: {    template: `    "chartPanel viewport 3fr"    /25rem 1fr    `,    elements: { chartPanel, viewport },  },};app.layout = "main";document.body.append(app);
```

### 🎉 Congratulations!​

Excellent work! You've just built a complete, interactive IDS validation dashboard from scratch. You've learned how to define data requirements, test a BIM model, and visualize the pass/fail results with charts that are directly linked to the 3D view. This is a crucial tool for any data quality workflow, and you're now equipped to implement it in your own applications. Well done!


---

# MODULE: ItemsData
**URL:** https://docs.thatopen.com/Tutorials/UserInterface/OBC/ItemsData

- 
- 👩🏻‍🏫 Tutorials
- UserInterface
- OBC
- ItemsData

# ItemsData

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## Displaying data the simplest way 🔥🔥​

Users who click on an element in a BIM viewer expect to see its attributes and property sets immediately in a side panel — but querying the model data, formatting it into a hierarchy, and keeping the panel in sync with selection requires wiring several systems together manually.
The items data table factory produces a pre-structured properties panel that updates automatically when fed a model ID map, displaying all attributes and relations in a searchable, expandable tree.
This tutorial covers initializing the Fragment loader and adding loaded models to the scene; creating the properties table with an empty initial model ID map; wiring the Highlighter so the table updates on every selection change and clears on deselect; toggling row expansion; copying the current table contents as TSV to the clipboard; and filtering properties with a debounced search input.
By the end, you'll have a properties panel that populates with the selected element's full data on every click, with expand, copy, and search controls.

```typescript
import * as BUI from "@thatopen/ui";import * as OBC from "@thatopen/components";import * as OBCF from "@thatopen/components-front";// You have to import from "@thatopen/ui-obc"import * as BUIC from "../..";
```

### 📋 Initializing the UI​

As always, let's first initialize the UI library. Remember you only have to do it once in your entire app.

```typescript
BUI.Manager.init();
```

### 🌎 Setting up a simple scene​

We will start by creating a simple scene with a camera and a renderer. If you don't know how to set up a scene, you can check the Worlds tutorial.

```typescript
const viewport = document.createElement("bim-viewport");const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.name = "main";const sceneComponent = new OBC.SimpleScene(components);sceneComponent.setup();world.scene = sceneComponent;const rendererComponent = new OBC.SimpleRenderer(components, viewport);world.renderer = rendererComponent;const cameraComponent = new OBC.SimpleCamera(components);world.camera = cameraComponent;await world.camera.controls.setLookAt(65, 19, -27, 12.6, -5, -1.4);viewport.addEventListener("resize", () => {  rendererComponent.resize();  cameraComponent.updateAspect();});components.init();const grids = components.get(OBC.Grids);grids.create(world);components.get(OBC.Clipper).create(world);
```

### Setting up the components​

First of all, we're going to get the FragmentIfcLoader from an existing components instance:

```typescript
const ifcLoader = components.get(OBC.IfcLoader);await ifcLoader.setup();
```

Just after we have setup the loader, let's then configure the FragmentManager so any time a model is loaded it gets added to some world scene created before:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () =>  fragments.core.update(true),);fragments.list.onItemSet.add(({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

You don't need to add the model into the scene to display its properties. However, as we are going to display the properties for each selected element, then having the model into the scene is obvious, right?

Now, the any Fragments Model loaded includes everything the Element Properties component needs in order to work! So the following is a piece of cake.

### Creating the properties table​

Let's create an instance of the functional component, like this:

```typescript
const [propertiesTable, updatePropertiesTable] = BUIC.tables.itemsData({  components,  modelIdMap: {},});propertiesTable.preserveStructureOnFilter = true;propertiesTable.indentationInText = false;
```

Cool! properties table created. Then after, let's tell the properties table to update each time the user makes a selection over the model. For it, we will use the highlighter from @thatopen/components-front:

```typescript
const highlighter = components.get(OBCF.Highlighter);highlighter.setup({ world });highlighter.events.select.onHighlight.add((modelIdMap) => {  updatePropertiesTable({ modelIdMap });});highlighter.events.select.onClear.add(() =>  updatePropertiesTable({ modelIdMap: {} }),);
```

### Creating a panel to append the table​

Allright! Let's now create a BIM Panel to control some aspects of the properties table and to trigger some functionalities like expanding the rows children and copying the values to TSV, so you can paste your element values inside a spreadsheet application 😉

```typescript
const propertiesPanel = BUI.Component.create(() => {  const [loadFragBtn] = BUIC.buttons.loadFrag({ components });  const onTextInput = (e: Event) => {    const input = e.target as BUI.TextInput;    propertiesTable.queryString = input.value !== "" ? input.value : null;  };  const expandTable = (e: Event) => {    const button = e.target as BUI.Button;    propertiesTable.expanded = !propertiesTable.expanded;    button.label = propertiesTable.expanded ? "Collapse" : "Expand";  };  const copyAsTSV = async () => {    await navigator.clipboard.writeText(propertiesTable.tsv);  };  return BUI.html`    <bim-panel label="Properties">      <bim-panel-section label="Element Data">        ${loadFragBtn}        <div style="display: flex; gap: 0.5rem;">          <bim-button @click=${expandTable} label=${propertiesTable.expanded ? "Collapse" : "Expand"}></bim-button>           <bim-button @click=${copyAsTSV} label="Copy as TSV"></bim-button>         </div>         <bim-text-input @input=${onTextInput} placeholder="Search Property" debounce="250"></bim-text-input>        ${propertiesTable}      </bim-panel-section>    </bim-panel>  `;});
```

Finally, let's create a BIM Grid element and provide both the panel and the viewport to display everything.

```typescript
const app = document.createElement("bim-grid") as BUI.Grid<["main"]>;app.layouts = {  main: {    template: `    "propertiesPanel viewport"    /25rem 1fr    `,    elements: { propertiesPanel, viewport },  },};app.layout = "main";document.body.append(app);
```

Congratulations! You have now created a fully working properties table for your app in less than 5 minutes of work. Keep going with more tutorials! 💪


---

# MODULE: ModelsList
**URL:** https://docs.thatopen.com/Tutorials/UserInterface/OBC/ModelsList

- 
- 👩🏻‍🏫 Tutorials
- UserInterface
- OBC
- ModelsList

# ModelsList

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## Managing your loaded models 🏢​

Developers building a multi-model BIM viewer need a panel that lists every loaded model with metadata and lets users remove them — but wiring the model list to load and dispose events, displaying schema tags, and adding a download action requires plumbing that distracts from the actual application logic.
The models list factory produces a table that stays in sync with the Fragment manager automatically, showing each loaded model's metadata and exposing configurable per-row actions.
This tutorial covers setting up the Fragment loader and adding models to the scene on load; creating the models list with a schema metadata tag and a download action enabled; placing the list inside a panel alongside a load button; and composing everything into a grid layout next to the viewport.
By the end, you'll have a model management panel that lists every loaded model with its schema tag and a download button, updating automatically as models are loaded or removed.

```typescript
import * as OBC from "@thatopen/components";import * as BUI from "@thatopen/ui";// You have to import from "@thatopen/ui-obc"import * as BUIC from "../..";
```

### 📋 Initializing the UI​

As always, let's first initialize the UI library. Remember you only have to do it once in your entire app.

```typescript
BUI.Manager.init();
```

### 🌎 Setting up a simple scene​

We will start by creating a simple scene with a camera and a renderer. If you don't know how to set up a scene, you can check the Worlds tutorial.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.name = "main";const sceneComponent = new OBC.SimpleScene(components);sceneComponent.setup();world.scene = sceneComponent;const viewport = document.createElement("bim-viewport");const rendererComponent = new OBC.SimpleRenderer(components, viewport);world.renderer = rendererComponent;const cameraComponent = new OBC.SimpleCamera(components);world.camera = cameraComponent;viewport.addEventListener("resize", () => {  rendererComponent.resize();  cameraComponent.updateAspect();});const viewerGrids = components.get(OBC.Grids);viewerGrids.create(world);components.init();
```

### Setting up the components​

First of all, we're going to get the FragmentIfcLoader from an existing components instance:

```typescript
const ifcLoader = components.get(OBC.IfcLoader);await ifcLoader.setup();
```

The step above is super important as none of the existing functional components setup any tool, they just get it as they are! So, if we don't setup the FragmentIfcLoader then the wasm path is not going to be defined and an error will arise 🤓. Just after we have setup the loader, let's then configure the FragmentManager so any time a model is loaded it gets added to some world scene created before:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());fragments.list.onItemSet.add(async ({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  await fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### Creating the models list component​

Allright! Now that some basic events are setup, it's time to create a new fresh models list component:

```typescript
const [modelsList] = BUIC.tables.modelsList({  components,  metaDataTags: ["schema"],  actions: { download: true },});
```

Now that we have a brand new models list created, we need to add it to the HTML page. For it, let's create simple BIM panel component where we include the models list and also a pre-made IFC load button 👇

```typescript
const panel = BUI.Component.create(() => {  const [loadFragBtn] = BUIC.buttons.loadFrag({ components });  return BUI.html`   <bim-panel label="IFC Models">    <bim-panel-section label="Importing">      ${loadFragBtn}    </bim-panel-section>    <bim-panel-section icon="mage:box-3d-fill" label="Loaded Models">      ${modelsList}    </bim-panel-section>   </bim-panel>   `;});
```

Finally, let's append the BIM Panel to the page to see the models list working 😉

```typescript
const app = document.createElement("bim-grid") as BUI.Grid<["main"]>;app.layouts = {  main: {    template: `      "panel viewport"      / 23rem 1fr    `,    elements: { panel, viewport },  },};app.layout = "main";document.body.append(app);
```

Congratulations! You've now a ready to go user interface that let's you show and dispose IFC models loaded into your app 🥳


---

# MODULE: SheetBoard
**URL:** https://docs.thatopen.com/Tutorials/UserInterface/OBC/SheetBoard

- 
- 👩🏻‍🏫 Tutorials
- UserInterface
- OBC
- SheetBoard

# SheetBoard

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## Composing Technical Drawing Sheets 📐​

Architects and technical drafters who prepare construction document sheets need to arrange multiple drawing views — a full floor plan alongside room-scale details — on numbered sheets with title blocks, but wiring geometry projection, viewport scaling, sheet layout, annotation tools, and DXF export into a single coherent canvas requires assembling many independent systems by hand.
The SheetBoard component is a multi-sheet drawing canvas that hosts PaperSpace sheets, each containing positioned technical drawing viewports at configurable scales, with a built-in edit mode that activates annotation tools directly inside any viewport.
This tutorial covers creating a hidden 3D world as a geometry container for the drawing; defining floor plan geometry with outer walls and an interior partition with a doorway gap; creating three named viewports at different scales (1:100 full plan, two 1:50 room details); loading a font for annotation labels; configuring two PaperSpace sheets with title block templates, labels, and sheet numbers; placing viewports onto each sheet at specific pixel offsets after layout; wiring double-click to enter edit mode for a viewport; canceling with Escape; requesting re-renders on mouse move; and downloading DXF exports per viewport or per full sheet.
By the end, you'll have a two-sheet drawing board with a floor plan overview and two room detail viewports, wired for edit mode entry, real-time mouse feedback, and DXF export at the viewport and sheet level.

### 🖖 Importing our Libraries​

```typescript
import * as THREE from "three";import * as BUI from "@thatopen/ui";import * as OBC from "@thatopen/components"import * as OBF from "@thatopen/components-front"import * as CUI from "../..";
```

### 📋 Initializing the UI​

As always, let's first initialize the UI libraries. Remember you only have to do this once in your entire app.

```typescript
BUI.Manager.init();CUI.Manager.init();
```

### 🌎 Setting Up the 3D World​

The SheetBoard needs a 3D world to project geometry from. We'll create one with a hidden renderer — it's never shown on screen, but it provides the scene container that the technical drawings system requires.

```typescript
// ── OBC world (hidden — only needed as scene container for the drawing) ────const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer>();world.scene = new OBC.SimpleScene(components);world.scene.setup();world.scene.three.background = null;// Hidden container: the 3D world renderer is never shown on screen.// The SheetBoard is the only visible renderer.const hiddenContainer = document.createElement("div");hiddenContainer.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;";document.body.appendChild(hiddenContainer);world.renderer = new OBC.SimpleRenderer(components, hiddenContainer);world.camera = new OBC.SimpleCamera(components);// Layer 1 stays disabled on the world camera — the drawing is only visible// through the SheetBoard viewports, not in any 3D view.components.init();
```

### ✏️ Creating the Technical Drawing​

Now let's create the drawing geometry. We'll define a simple floor plan: an outer rectangular perimeter and an interior partition wall with a doorway gap. Three viewports are created from the same drawing — a 1:100 overview of the full plan, and two 1:50 detail views for each room.

```typescript
// ── TechnicalDrawings ─────────────────────────────────────────────────────const techDrawings = components.get(OBC.TechnicalDrawings);function makeLines(pts: number[]): THREE.LineSegments {  const geo = new THREE.BufferGeometry();  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial());}// ── Drawing 1: Floor plan ─────────────────────────────────────────────────const drawing = techDrawings.create(world);drawing.layers.create("geometry");// Outer perimeterdrawing.addProjectionLines(makeLines([  -8, 0,  6,   8, 0,  6,   8, 0,  6,   8, 0, -6,   8, 0, -6,  -8, 0, -6,  -8, 0, -6,  -8, 0,  6,]), "geometry");// Interior partition with doorway (gap between z=−0.75 and z=0.75)drawing.addProjectionLines(makeLines([   0, 0,  6,    0, 0,  0.75,   0, 0, -0.75, 0, 0, -6,  -8, 0,  0,    0, 0,  0,]), "geometry");const vpA = drawing.viewports.create({ left: -10, right: 10, top: 8,  bottom: -8, scale: 100, name: "Floor Plan" });const vpB = drawing.viewports.create({ left:   0, right:  9, top: 7,  bottom: -7, scale:  50, name: "Right Room" });const vpC = drawing.viewports.create({ left: -9,  right:  0, top: 7,  bottom: -7, scale:  50, name: "Left Room" });
```

### 🖊️ Setting Up the Drawing Editor​

The DrawingEditor handles annotation interactions inside any active viewport. We load a font for dimension labels so any annotation tool registered later can render text correctly.

```typescript
// ── DrawingEditor ─────────────────────────────────────────────────────────const editor = components.get(OBF.DrawingEditor);// Font for dimension labels — adjust the path to match your dev server setup.await editor.fonts.load("/resources/fonts/PlusJakartaSans-Medium.ttf");
```

### 📄 Configuring Sheets and Title Blocks​

Each PaperSpace element represents a numbered sheet. We assign a label, sheet number, and a title block template function to each one. The title block template receives a mm helper (converts millimetres to CSS pixels at the sheet's resolution), the drawing area element, and sheet metadata — and returns any HTML layout you need.

```typescript
// ── SheetBoard and papers ────────────────────────────────────────────────const board = document.getElementById("board") as CUI.SheetBoard;board.components = components as any;const paperA = document.getElementById("paper-a") as BUI.PaperSpace;const paperB = document.getElementById("paper-b") as BUI.PaperSpace;function makeTitleBlock(scale: string) {  return (    mm: (v: number) => string,    drawingArea: BUI.TemplateResult,    info: { label: string; sheetNumber: string },  ): BUI.TemplateResult => BUI.html`    <div style="width:100%;height:100%;display:flex;flex-direction:column;font-family:Arial,sans-serif;color:#1a1a1a;">      <div style="flex:1;border:${mm(0.7)} solid #222;overflow:hidden;">${drawingArea}</div>      <div style="height:${mm(20)};border:${mm(0.7)} solid #222;border-top:none;display:grid;grid-template-columns:1fr ${mm(30)} ${mm(30)};">        <div style="display:flex;align-items:center;padding:0 ${mm(3)};border-right:${mm(0.5)} solid #ccc;">          <span style="font-size:${mm(5)};font-weight:bold;">${info.label}</span>        </div>        <div style="display:flex;flex-direction:column;justify-content:center;padding:0 ${mm(2)};border-right:${mm(0.5)} solid #ccc;gap:${mm(1)};">          <span style="font-size:${mm(2.5)};color:#666;">SCALE</span>          <span style="font-size:${mm(3.5)};font-weight:600;">${scale}</span>        </div>        <div style="display:flex;flex-direction:column;justify-content:center;padding:0 ${mm(2)};gap:${mm(1)};">          <span style="font-size:${mm(2.5)};color:#666;">SHEET</span>          <span style="font-size:${mm(3.5)};font-weight:600;">${info.sheetNumber}</span>        </div>      </div>    </div>  `;}paperA.label = "General Arrangement";paperA.sheetNumber = "A-01";paperA.titleBlockTemplate = makeTitleBlock("Various");paperB.label = "Details & Sections";paperB.sheetNumber = "A-02";paperB.titleBlockTemplate = makeTitleBlock("1:50 / 1:100");
```

### 📐 Placing Viewports on Sheets​

Viewports are positioned on each sheet in pixel coordinates relative to the sheet's drawing area. We wait for the layout to settle before reading sheet dimensions, then place the full floor plan and the right room detail on sheet A-01, and the left room detail on sheet A-02.

```typescript
paperA.style.position = "absolute";paperA.style.left = "0";paperA.style.top = "0";requestAnimationFrame(() => {  requestAnimationFrame(() => {    const aW = paperA.offsetWidth;    paperB.style.position = "absolute";    paperB.style.left = `${aW + 60}px`;    paperB.style.top = "0";    // paperA (General Arrangement) — full floor plan + right room detail    board.addViewport(paperA, drawing.uuid, vpA.uuid, { x:  10, y: 10 }); // Floor Plan 1:100    board.addViewport(paperA, drawing.uuid, vpB.uuid, { x: 230, y: 10 }); // Right Room 1:50    // paperB — left room detail    board.addViewport(paperB, drawing.uuid, vpC.uuid, { x: 10, y: 10 }); // Left Room 1:50  });});
```

### 🔌 Wiring SheetBoard and Editor Interactions​

The SheetBoard fires events that connect user gestures to the DrawingEditor. Double-clicking a viewport enters edit mode for that viewport. Pressing Escape cancels any in-progress operation and exits edit mode. Mouse moves trigger re-renders so hover highlights appear in real time. DXF export events from the viewport toolbar and sheet toolbar trigger file downloads.

```typescript
// ── SheetBoard ↔ DrawingEditor wiring ───────────────────────────────────function exitEditMode() {  editor.activeDrawing = null;  editor.activeTool = null;  board.exitEditMode();  board.requestRender();}// Double-click on a viewport → enter edit mode for that viewport.// If another viewport was being edited, cancel it first.board.addEventListener("viewportactivate", (e) => {  const { drawingId, viewportId } = (e as CustomEvent<{ drawingId: string; viewportId: string }>).detail;  const techDrawings = components.get(OBC.TechnicalDrawings);  const drawing = techDrawings.list.get(drawingId);  const vp = drawing?.viewports.get(viewportId);  if (!drawing || !vp) return;  if (editor.activeDrawing) editor.cancel();  editor.activeDrawing = drawing;  const vpEl = board.getViewportElement(drawingId, viewportId);  if (vpEl) editor.setSource(vpEl, vp);  board.enterEditMode(drawingId, viewportId);});// Escape → cancel any in-progress operation and exit edit mode.document.addEventListener("keydown", (e) => {  if (e.key !== "Escape" || !editor.activeDrawing) return;  editor.cancel();  exitEditMode();});// Re-render on every editor mousemove so hover highlights appear in real time// (the board only renders on demand).editor.onDrawingMouseMove.add(() => board.requestRender());// Download the DXF string as a file when the viewport toolbar triggers a single-viewport export.board.addEventListener("viewportdxfexport", (e) => {  const { drawingId, viewportId, dxf } = (e as CustomEvent<{ drawingId: string; viewportId: string; dxf: string }>).detail;  const name = components.get(OBC.TechnicalDrawings).list.get(drawingId)!.viewports.get(viewportId)!.name;  const blob = new Blob([dxf], { type: "application/dxf" });  const url = URL.createObjectURL(blob);  const a = document.createElement("a");  a.href = url;  a.download = `${name ?? viewportId}.dxf`;  a.click();  URL.revokeObjectURL(url);});// Download the DXF string as a file when the paper toolbar triggers an export.board.addEventListener("paperdxfexport", (e) => {  const { paper, dxf } = (e as CustomEvent<{ paper: BUI.PaperSpace; dxf: string }>).detail;  const name = (paper.getAttribute("label") || "drawing") + ".dxf";  const blob = new Blob([dxf], { type: "application/dxf" });  const url = URL.createObjectURL(blob);  const a = document.createElement("a");  a.href = url;  a.download = name;  a.click();  URL.revokeObjectURL(url);});
```

### 🎉 Congratulations!​

You've successfully built a multi-sheet technical drawing board with in-place annotation and DXF export. From here, you can add more drawings, viewports, and sheets — or connect real BIM geometry by projecting IFC elements through the TechnicalDrawings system.


---

# MODULE: SpatialTree
**URL:** https://docs.thatopen.com/Tutorials/UserInterface/OBC/SpatialTree

- 
- 👩🏻‍🏫 Tutorials
- UserInterface
- OBC
- SpatialTree

# SpatialTree

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## Showing your model tree 🌲​

Architects and BIM coordinators navigating a large model need to understand its spatial hierarchy — which elements belong to which floor, zone, or space — but the 3D viewport alone gives no structural overview, and building a tree view that stays in sync with loaded models requires significant custom logic.
The spatial tree factory reads the IFC spatial structure from any loaded Fragment model and renders it as an interactive nested table that updates automatically when models are added or removed.
This tutorial covers setting up the Fragment loader and Highlighter with zoom-to-selection; creating the spatial tree with an initially empty model list; enabling preserve-structure on filter so the hierarchy stays visible during search; placing the tree in a panel with a load button and a debounced search input; and wiring a grid layout alongside the viewport.
By the end, you'll have a spatial tree panel that populates automatically for every loaded model, stays synchronized with the scene, and supports live search across the hierarchy.

```typescript
import * as OBC from "@thatopen/components";import * as OBCF from "@thatopen/components-front";import * as BUI from "@thatopen/ui";// You have to import from "@thatopen/ui-obc"import * as BUIC from "../..";
```

### 📋 Initializing the UI​

As always, let's first initialize the UI library. Remember you only have to do it once in your entire app.

```typescript
BUI.Manager.init();
```

### 🌎 Setting up a simple scene​

We will start by creating a simple scene with a camera and a renderer. If you don't know how to set up a scene, you can check the Worlds tutorial.

```typescript
const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.SimpleCamera,  OBC.SimpleRenderer>();world.name = "main";const sceneComponent = new OBC.SimpleScene(components);sceneComponent.setup();world.scene = sceneComponent;const viewport = document.createElement("bim-viewport");const rendererComponent = new OBC.SimpleRenderer(components, viewport);world.renderer = rendererComponent;const cameraComponent = new OBC.SimpleCamera(components);world.camera = cameraComponent;viewport.addEventListener("resize", () => {  rendererComponent.resize();  cameraComponent.updateAspect();});const viewerGrids = components.get(OBC.Grids);viewerGrids.create(world);components.init();
```

### Setting up the components​

First of all, we're going to get the FragmentIfcLoader from an existing components instance:

```typescript
const ifcLoader = components.get(OBC.IfcLoader);await ifcLoader.setup();
```

###💡 Getting the highlighter
Now, we will basically get the highlighter and set it up. This will create and configure 2 things:

- Selecting: when clicking on an element.
- Hovering: when hovering the mouse over an element.

```typescript
const highlighter = components.get(OBCF.Highlighter);highlighter.setup({ world });highlighter.zoomToSelection = true;
```

The step above is super important as none of the existing functional components setup any tool, they just get it as they are! So, if we don't setup the FragmentIfcLoader then the wasm path is not going to be defined and an error will arise 🤓. Just after we have setup the loader, let's then configure the FragmentManager so any time a model is loaded it gets added to some world scene created before:

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());fragments.list.onItemSet.add(async ({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  await fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});
```

### Creating the tree​

Doing this is extremely simple thanks to the information saved in the Fragments file and the power of the UI components from That Open Engine. To proceed with the creation, you can do the following 💪

```typescript
const [spatialTree] = BUIC.tables.spatialTree({  components,  models: [],});spatialTree.preserveStructureOnFilter = true;
```

As you see, we've passed an empty models list because in the first place there are no models. However, the Spatial Tree updates it-self each time a new model comes into the scene! Which makes it really handy to work with.
Great! As we already created the Spatial Tree instance, let's add it to the HTML page. For it, let's create simple BIM panel component where we include the tree and also a pre-made IFC load button 👇

```typescript
const panel = BUI.Component.create(() => {  const [loadFragBtn] = BUIC.buttons.loadFrag({ components });  const onSearch = (e: Event) => {    const input = e.target as BUI.TextInput;    spatialTree.queryString = input.value;  };  return BUI.html`   <bim-panel label="Spatial Tree">    <bim-panel-section label="Model Tree">      ${loadFragBtn}      <bim-text-input @input=${onSearch} placeholder="Search..." debounce="200"></bim-text-input>      ${spatialTree}    </bim-panel-section>   </bim-panel>   `;});
```

Finally, let's append the BIM Panel to the page to see the Spatial Tree working 😉

```typescript
const app = document.getElementById("app") as BUI.Grid<["main"]>;app.layouts = {  main: {    template: `      "panel viewport"      / 30rem 1fr    `,    elements: { panel, viewport },  },};app.layout = "main";
```

Congratulations! You've now a ready to go user interface that let's you show your model tree. 🥳


---

# MODULE: Topics
**URL:** https://docs.thatopen.com/Tutorials/UserInterface/OBC/Topics

- 
- 👩🏻‍🏫 Tutorials
- UserInterface
- OBC
- Topics

# Topics

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## Visualizing BCF Topics 📋​

Project coordinators who track BCF issues across disciplines need to answer questions like "how many issues are still active?" or "who has the most items assigned?" — but scanning a flat list of topics gives no aggregate view of status, priority, or workload distribution.
The topics chart factory reads BCF topic data directly and groups it by any topic property — status, priority, author, stage — returning a chart and an update function that can regroup the same data on demand without reloading.
This tutorial covers generating 20 randomized BCF topics with realistic properties (type, status, priority, author, assigned to, stage, labels, dates); creating a pie chart and a bar chart from the topics chart factory; connecting a shared legend; displaying the raw topic data in a side-by-side topics list table; wiring a grouper dropdown that switches both charts between any topic property; randomizing the full dataset and refreshing charts and table simultaneously; and wiring highlight, filter by threshold, and reset actions.
By the end, you'll have a two-panel BCF dashboard with dynamically regroupable charts, a synchronized topics table, and controls to explore the data from any angle.

```typescript
import * as OBC from "@thatopen/components";import * as BUI from "@thatopen/ui";// eslint-disable-next-line import/no-unresolvedimport * as THREE from "three";import * as BUIC from "../..";const components = new OBC.Components();
```

### 📋 Initializing the UI​

As always, let's first initialize the UI library. Remember you only have to do it once in your entire app.

```typescript
BUI.Manager.init();
```

### 🎲 Generating Sample BCF Data​

In a real application, you would load BCF data from a file or an API. For this example, we'll programmatically generate a set of 20 random topics. We'll use the BCFTopics component to create topics with realistic properties like status, priority, type, author, and creation dates. This will give us a nice dataset to visualize.

```typescript
const bcfTopics = components.get(OBC.BCFTopics);bcfTopics.setup()const types = ["Inquiry", "Remark", "Fault", "Request", "Clash"];const statuses = ["Active", "In Progress", "Closed"];const priorities = ["Minor", "Normal", "Major"];const creationAuthors = ["Alice", "Bob", "Charlie", "David", "Eve"];const assignedToList = ["Frank", "Grace", "Heidi", "Ivan", "Judy", undefined];const stages = ["Coordination", "Execution", "Review", "Done", undefined];const allLabels = [  "Structural",  "MEP",  "Architectural",  "Urgent",  "RFC",  "On-hold",];const getRandomElement = <T>(arr: T[]): T =>  arr[Math.floor(Math.random() * arr.length)];const getRandomDate = (start: Date, end: Date): Date => {  return new Date(    start.getTime() + Math.random() * (end.getTime() - start.getTime()),  );};const creationDates = Array.from({ length: 6 }, () =>  getRandomDate(new Date(2023, 0, 1), new Date()),);const generateRandomTopic = (index: number) => {  const creationDate = getRandomElement(creationDates);  const modifiedDate =    Math.random() > 0.5 ? getRandomDate(creationDate, new Date()) : undefined;  return bcfTopics.create({    guid: THREE.MathUtils.generateUUID(),    type: getRandomElement(types),    status: getRandomElement(statuses),    title: `Topic ${index + 1}: Minor issue found on level ${(index % 3) + 1}`,    priority: getRandomElement(priorities),    index,    labels: new Set(allLabels.filter(() => Math.random() > 0.7)),    creationDate,    creationAuthor: getRandomElement(creationAuthors),    modifiedDate,    modifiedAuthor: modifiedDate      ? getRandomElement(creationAuthors)      : undefined,    assignedTo: getRandomElement(assignedToList),    description: `This is a detailed description for topic ${index + 1}. It outlines the issue and the expected resolution.`,    stage: getRandomElement(stages),  });};const topics = Array.from({ length: 20 }, (_, i) => generateRandomTopic(i));
```

### 📊 Creating the Topics Charts​

Now, let's visualize our generated data. We'll use the topicsChart factory, which is specifically designed to work with BCF topic data. We'll pass our array of topics to the factory to create two chart instances: a pie chart and a bar chart. These charts will, by default, group the topics by their status.

```typescript
const [pieChart, updatePie] = BUIC.charts.topicsChart({  components,  type: "pie",  addLabels: false,});const [barChart, updateBar] = BUIC.charts.topicsChart({  components,  type: "bar",  addLabels: false,});pieChart.label = "Pie Chart Data";barChart.label = "Bar Chart Data";pieChart.borderColor = "#00000000";barChart.borderColor = "#00000000";
```

### 📑 Adding a Legend and a Details Table​

To complement our charts, we'll add two more components:

- A <bim-chart-legend> component to serve as a dynamic legend for our charts.
- A topicsList table, created with a factory, to display the raw topic data in a clear, tabular format. This allows users to see the details behind the chart visualizations.

```typescript
const labels = BUI.Component.create<BUI.ChartLegend>(() => {  return BUI.html`    <bim-chart-legend>      <bim-label slot="missing-data">No data to display</bim-label>      <bim-label slot="no-chart">No chart attached</bim-label>    </bim-chart-legend>`;});pieChart.addEventListener("data-loaded", () => {  labels.charts = [...labels.charts, pieChart];});barChart.addEventListener("data-loaded", () => {  labels.charts = [...labels.charts, barChart];});const [topicsTable, updateTopicsTable] = BUIC.tables.topicsList({  topics,  components,});// Let's hide some columns as we don't need them// for this tutorial.topicsTable.hiddenColumns = ["Guid", "DueDate", "Actions"]
```

### 🎛️ Creating Dynamic Controls​

To make our dashboard truly interactive, we'll add a set of controls. This is a key feature of the topicsChart.

- Group by Dropdown: The topicsChart can group data by any topic property. We'll create a dropdown that allows the user to select a property (e.g., 'status', 'priority', 'creationAuthor'), and we'll call the update function on our charts to dynamically regroup and redisplay the data.
- Randomize Button: This button will call our data generation function again to create a new set of topics, demonstrating how the charts and table can be updated with a completely new dataset.
- Filter/Highlight Buttons: We'll also include the standard highlight, filter, and reset buttons to show how you can perform further client-side analysis on the displayed data.

```typescript
const onHighlight = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.highlight((entry) => {    if (!("value" in entry)) return false    return entry.value > 100;  });  target.loading = false;};const highlightButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Highlight" @click=${onHighlight}></bim-button>`;});const onFilter = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.filterByValue((entry) => {    if (!("value" in entry)) return false    return entry.value > 100;  });  target.loading = false;};const filterButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Filter" @click=${onFilter}></bim-button>`;});const onReset = ({ target }: { target: BUI.Button }) => {  target.loading = true;  pieChart.reset();  target.loading = false;};const resetButton = BUI.Component.create(() => {  return BUI.html`    <bim-button label="Reset" @click=${onReset}></bim-button>`;});const grouperDropdown = document.createElement("bim-dropdown") as BUI.Dropdown;grouperDropdown.label = "Group by";const properties = [  "type",  "status",  "priority",  "creationDate",  "creationAuthor",  "modifiedDate",  "modifiedAuthor",  "dueDate",  "assignedTo",  "stage",];for (const prop of properties) {  const option = document.createElement("bim-option") as BUI.Option;  option.label = prop;  option.value = prop;  grouperDropdown.appendChild(option);}grouperDropdown.addEventListener("change", () => {  updateBar({    grouper: grouperDropdown.value[0],  });  updatePie({    grouper: grouperDropdown.value[0],  });  BUI.ContextMenu.removeMenus();});const randomizeButton = document.createElement("bim-button") as BUI.Button;randomizeButton.label = "Randomize";randomizeButton.addEventListener("click", () => {  bcfTopics.list.clear()  Array.from({ length: 20 }, (_, i) => generateRandomTopic(i));  updateBar();  updatePie();  updateTopicsTable();});
```

### 🏗️ Assembling the Dashboard​

With all our individual components ready, it's time to assemble the final dashboard. We'll create two main panels:

- A left panel containing our pie chart, bar chart, the legend, and all the interactive action buttons.
- A right panel containing the detailed topics table.
Finally, we'll use a <bim-grid> to arrange these two panels side-by-side, creating a clean, two-column dashboard layout.

```typescript
const leftPanel = BUI.Component.create(() => {  return BUI.html`    <bim-panel style="display: flex; flex-direction: column; height: 100%; gap: 1rem;">      <bim-panel-section label="Topics Pie Chart" icon="raphael:piechart" style="flex: 1;">        ${pieChart}      </bim-panel-section>      <bim-panel-section label="Topics Bar Chart" icon="raphael:barchart" style="flex: 1;">        ${barChart}      </bim-panel-section>      <bim-panel-section label="Labels" icon="raphael:tag" style="flex: 0.1;">      ${labels}      </bim-panel-section>      <bim-panel-section label="Actions" style="display: flex; flex-direction: column; gap: 1.5rem;">        ${grouperDropdown}        ${randomizeButton}        ${highlightButton}        ${filterButton}        ${resetButton}      </bim-panel-section>    </bim-panel>  `;});const rightPanel = BUI.Component.create(() => {  return BUI.html`    <bim-panel>      <bim-panel-section>        ${topicsTable}      </bim-panel-section>    </bim-panel>  `;});const app = document.createElement("bim-grid") as BUI.Grid<["main"]>;app.layouts = {  main: {    template: `    "leftPanel rightPanel"    / 25rem 1fr    `,    elements: { leftPanel, rightPanel },  },};app.layout = "main";document.body.append(app);
```

### 🎉 Congratulations!​

Fantastic! You've just built a complete, interactive BCF dashboard. You've learned how to generate sample data, visualize it with the topicsChart, display details in a topicsList table, and provide powerful dynamic controls for grouping and filtering. This is a perfect foundation for building tools to manage and analyze project issues in your own BIM applications. Great job!


---

# MODULE: TopicsUI
**URL:** https://docs.thatopen.com/Tutorials/UserInterface/OBC/TopicsUI

- 
- 👩🏻‍🏫 Tutorials
- UserInterface
- OBC
- TopicsUI

# TopicsUI

Copying and pasting? We've got you covered! You can find the full source code of this tutorial here.

## Showing BCF Topics the Easy Way ✨​

Teams collaborating on a BIM project need to create, review, and export BCF issues directly in the viewer — but building a complete BCF workflow UI (topic list, creation form, detail panel with comments, viewpoints, and related topics, plus BCF export) from scratch is a substantial frontend investment.
The UI components package provides ready-made functional pieces — topics list table, topic form, information section, comments section, viewpoints section, and relations section — that can be composed into a production-ready BCF interface without writing layout or data-binding logic.
This tutorial covers configuring BCFTopics with a user roster and discipline labels; auto-creating a viewpoint for every new topic; creating a topics list table with user avatar styles and selectable rows; building a topic creation form wrapped in a modal dialog with submit and cancel callbacks; composing a custom topic detail panel from information, comments, viewpoints, related topics, and a custom communication section; updating the detail panel on row click with hover feedback; and wiring a download button that exports selected topics (or all topics) as a BCF file.
By the end, you'll have a three-column BCF interface — topic list, 3D viewport, and topic detail panel — with topic creation, full detail view, and selective BCF export.

### 🏗 Scaffolding the Application​

First of all, let's import the dependencies we need to get this working:

```typescript
// eslint-disable-next-line import/no-extraneous-dependenciesimport * as BUI from "@thatopen/ui";import * as OBC from "@thatopen/components";// You have to import * from "@thatopen/ui-obc"import * as CUI from "../../..";
```

Next, it's always necessary to initialize the core UI library no matter if you're using functional components from @thatopen/ui-obc. Also, let's setup @thatopen/components with the minimum things to get a World up and running to load models.

```typescript
BUI.Manager.init();const viewport = document.createElement("bim-viewport");const components = new OBC.Components();const worlds = components.get(OBC.Worlds);const world = worlds.create<  OBC.SimpleScene,  OBC.OrthoPerspectiveCamera,  OBC.SimpleRenderer>();const sceneComponent = new OBC.SimpleScene(components);sceneComponent.setup();world.scene = sceneComponent;const rendererComponent = new OBC.SimpleRenderer(components, viewport);world.renderer = rendererComponent;const cameraComponent = new OBC.OrthoPerspectiveCamera(components);world.camera = cameraComponent;cameraComponent.controls.setLookAt(10, 5.5, 5, -4, -1, -6.5);viewport.addEventListener("resize", () => {  rendererComponent.resize();  cameraComponent.updateAspect();});components.init();const grids = components.get(OBC.Grids);grids.create(world);
```

### 🏦 Loading a Model and Setting the BCFTopics​

Just after setting up the world, let's programatically load a model 👇

```typescript
// `FragmentsManager.getWorker()` fetches the matching worker for this library version from unpkg and returns a blob URL.// You can also pass your own URL to `fragments.init(...)` if you'd rather host the worker yourself.const workerUrl = await OBC.FragmentsManager.getWorker();const fragments = components.get(OBC.FragmentsManager);fragments.init(workerUrl);world.camera.controls.addEventListener("update", () => fragments.core.update());fragments.list.onItemSet.add(async ({ value: model }) => {  model.useCamera(world.camera.three);  world.scene.three.add(model.object);  await fragments.core.update(true);});// Remove z fightingfragments.core.models.materials.list.onItemSet.add(({ value: material }) => {  if (!("isLodMaterial" in material && material.isLodMaterial)) {    material.polygonOffset = true;    material.polygonOffsetUnits = 1;    material.polygonOffsetFactor = Math.random();  }});const ifcLoader = components.get(OBC.IfcLoader);await ifcLoader.setup({  autoSetWasm: false,  wasm: {    path: "https://unpkg.com/web-ifc@0.0.77/",    absolute: true,  },});const file = await fetch(  "https://thatopen.github.io/engine_ui-components/resources/small.ifc",);const buffer = await file.arrayBuffer();const typedArray = new Uint8Array(buffer);await ifcLoader.load(typedArray, true, "small");// world.scene.three.add(model.object);
```

You don't need to add the model into the scene to create topics! We just add it for demostration purposes.

Before creating the table to display topics to the user, let's do some initial setup of the BCFTopics component. If you're unsure about the basics of working with the BCFTopics component, first check the corresponding tutorial.

```typescript
const users: CUI.TopicUserStyles = {  "jhon.doe@example.com": {    name: "Jhon Doe",    picture:      "https://www.profilebakery.com/wp-content/uploads/2023/04/Profile-Image-AI.jpg",  },  "user_a@something.com": {    name: "User A",    picture:      "https://www.profilebakery.com/wp-content/uploads/2023/04/Portrait-Photography.jpg",  },  "user_b@something.com": {    name: "User B",    picture:      "https://www.profilebakery.com/wp-content/uploads/2023/04/AI-Portrait.jpg",  },};const topics = components.get(OBC.BCFTopics);// We setup the component to create a list of users.// This list will appear automatically in the topics form.// The recommendation is always set an email (as per the BCF standard).topics.setup({  users: new Set(Object.keys(users)),  labels: new Set(["Architecture", "Structure", "MEP"]),});// Add a default viewpoint to the topics each time they get created.const viewpoints = components.get(OBC.Viewpoints);topics.list.onItemSet.add(({ value: topic }) => {  const viewpoint = viewpoints.create();  viewpoint.world = world;  topic.viewpoints.add(viewpoint.guid);});
```

Once the BCFTopics component has been initialized, let's see how to setup a plug-n-play UI for it! The BIM Components UI package (@thatopen/ui-obc) comes with some UIs to support the usage of the BCFTopics component. Among the components you got:
👉 TopicsList: a table to display the topics created with the component (or the ones you choose to see).
👉 TopicForm: a form to create new or update existing topics.
👉 TopicComments: a table to display the list of comments for a single topic.
👉 TopicCommentsSection: an element to display the comments for a single topic and also a text area to add them.
👉 TopicInformationSection: an element to display the topic markup information and a button with the form included to update it.
👉 TopicRelationsSection: an element to display the topics related with another and the functionality to link them.
👉 TopicViewpointsSection: an element to display the topics viewpoints with the functionality create new or link existing viewpoints.
Is entirely up to you what to use, but using them together gives you a ready to go UI with everything you need to have a production ready BCF integration in your BIM app! Let's start with the topics list table.

### 🔨 Displaying the Topics List in a Table​

The topics list table is the easiest way to display all topics created in the app using the BCFTopics component. Creating it is really simple, as you just need to write the following:

```typescript
const [topicsList] = CUI.tables.topicsList({  components,  dataStyles: { users },});// Let's make row selection possible so we can decide which topics to download.topicsList.selectableRows = true;
```

That's it. You don't need anything else other than creating an instance of the UI component and place it anywhere you want in the app. The table updates by it-self anytime a new topic has been created or modified!

### 📃 Using the Topics Form UI​

Let's now define a topic form so creating them is easier than ever:

```typescript
const [topicForm, updateTopicForm] = CUI.forms.topic({  components,  styles: { users },});// Optionally, you can activate the dropdown searchbox for the// assignee input in case you have too many users in your app.const assigneeDropdown = topicForm.querySelector<BUI.Dropdown>(  "bim-dropdown[name='assignedTo']",);if (assigneeDropdown) assigneeDropdown.searchBox = true;// We won't add the form directly to the page, but will wrap it inside a dialog element to show it as a modal.const topicsModal = BUI.Component.create<HTMLDialogElement>(() => {  return BUI.html`    <dialog class="form-dialog">     <bim-panel style="border-radius: var(--bim-ui_size-base); width: 22rem;">      ${topicForm}     </bim-panel>     </dialog>  `;});document.body.append(topicsModal);
```

As the modal is already on the page, lets create a very simple button to display the modal on demand:

```typescript
const showFormBtn = BUI.Component.create(() => {  const onClick = () => {    topicsModal.showModal();  };  return BUI.html`    <bim-button style="flex: 0" @click=${onClick} label="Create Topic" icon="material-symbols:task"></bim-button>  `;});
```

The form component already includes the classic submit and cancel buttons. You can access them from the element by using querySelectors, but its more cumbersome than it should be. For that reason, the form state includes one callback for each button, so you decide what happens when they are clicked. In this case, the most logical thing is to close the modal when the user clicks them. Let's update the form state to include the callbacks:

```typescript
updateTopicForm({  onCancel: () => {    topicsModal.close();  },  onSubmit: () => {    // There is no need to create the topic, it happens automatically inside the form component.    topicsModal.close();  },});
```

Awesome! Topic form setup correctly 😎

### 🎫 Creating a Custom Topic Panel​

With the form set up, what if we use the topic panel to see it's full information? Typically, you will display the full information for one topic at the same time; in such case, you only need to create one topic panel component. However, you can create as many panels as you need. In this tutorial we will create one as follows:

```typescript
// You don't have to create this interface, it's made just for demonstration purposes.// This interface allows you to update the actions in each functional section of the topics UI.// This is great when you have an app with user permission settings.interface TopicPanelActions {  information: Partial<CUI.TopicInformationSectionActions>;  viewpoints: Partial<CUI.TopicViewpointsSectionActions>;  relatedTopics: Partial<CUI.TopicRelationsSectionActions>;  comments: Partial<CUI.TopicCommentsSectionActions>;}interface TopicPanelUI {  components: OBC.Components;  topic?: OBC.Topic;  styles?: Partial<CUI.TopicStyles>;  actions?: Partial<TopicPanelActions>;  world?: OBC.World;}// By default, it doesn't know which topic to display, so will show a default message of not topic selected.const [topicPanel, updateTopicPanel] = BUI.Component.create<  HTMLElement,  TopicPanelUI>(  (state) => {    const { components, topic, world, actions, styles } = state;    let topicSections: BUI.TemplateResult | undefined;    let missingTopicSection: BUI.TemplateResult | undefined;    if (topic) {      const [information] = CUI.sections.topicInformation({        components,        topic,        actions: actions?.information,        styles,      });      const [viewpoints] = CUI.sections.topicViewpoints({        components,        topic,        world,        actions: actions?.viewpoints,      });      const [relatedTopics] = CUI.sections.topicRelations({        components,        topic,        actions: actions?.relatedTopics,      });      const [comments] = CUI.sections.topicComments({        topic,        actions: actions?.comments,        styles: styles?.users,      });      const onReminderClick = () => {        // eslint-disable-next-line no-alert        window.alert(          `An email will be sent to ${topic.assignedTo}! (obviosuly not, this is just for demo purposes)`,        );      };      topicSections = BUI.html`        <bim-panel-section label="Information" icon="ph:info-bold">          ${information}        </bim-panel-section>        <bim-panel-section label="Comments" icon="majesticons:comment-line">          ${comments}        </bim-panel-section>        <bim-panel-section label="Viewpoints" icon="tabler:camera">          ${viewpoints}        </bim-panel-section>        <bim-panel-section label="Related Topics" icon="tabler:link">          ${relatedTopics}        </bim-panel-section>        <!-- This is a custom section where you can add any functionality you like -->        <bim-panel-section label="Communication" icon="tabler:link">          ${            topic.assignedTo              ? BUI.html`                <bim-button @click=${onReminderClick} label="Send Mail Reminder" icon="mingcute:send-fill"></bim-button>               `              : BUI.html`                <bim-label style="white-space: normal">The topic must have an assignee to use the communication tools. Update the topic with a new assignee!</bim-label>              `          }        </bim-panel-section>      `;    } else {      missingTopicSection = BUI.html`        <bim-panel-section label="Missing Topic" icon="material-symbols:chat-error">          ${!topic ? BUI.html`<bim-label>There is no topic to display in this panel!</bim-label>` : null}        </bim-panel-section>       `;    }    return BUI.html`      <bim-panel>        ${missingTopicSection}        ${topicSections}      </bim-panel>     `;  },  { components, world, styles: { users } },);// Lets update the topic panel in case the topic information gets update somewhere else in the app.topics.list.onItemUpdated.add(() => updateTopicPanel());
```

Unsure about creating custom functional UI components like the panel above? Check the Component tutorial.

It may seem complex, but it's simpler than it looks! We provide functional pieces, and you decide how to combine them to define your UIs. This approach offers flexibility for customization, unlike pre-made panels that are easier to implement but harder to modify. You can create panels with functional pieces already working and add custom UIs for additional features.
To update the topic panel with specific data, it depends on your app's logic. In this case, we can assign a click to each row created on the topicsList to update the panel, as follows:

```typescript
// @ts-ignoretopicsList.addEventListener(  "rowcreated",  (event: CustomEvent<BUI.RowCreatedEventDetail<{ Guid: string }>>) => {    const { row } = event.detail;    row.addEventListener("click", () => {      const { Guid } = row.data;      if (!Guid) return;      const topic = topics.list.get(Guid);      if (!topic) return;      updateTopicPanel({ topic });    });    row.style.cursor = "pointer";    row.addEventListener("mouseover", () => {      row.style.backgroundColor = `color-mix(        in lab,        var(--bim-ui_bg-contrast-20) 30%,        var(--bim-ui_main-base) 10%      )`;    });    row.addEventListener("mouseout", () => {      row.style.removeProperty("background-color");    });  },);
```

### ⏬ Creating a Button to Download BCFs​

To complete our BCF integration, let's create a button to download the topics created using the BCFTopics component:

```typescript
const downloadBtn = BUI.Component.create(() => {  const onDownload = async () => {    const selectedTopics = [...topicsList.selection]      .map(({ Guid }) => {        if (!(Guid && typeof Guid === "string")) return null;        const topic = topics.list.get(Guid);        return topic;      })      .filter((topic) => topic) as OBC.Topic[];    const topicsToExport =      selectedTopics.length > 0 ? selectedTopics : [...topics.list.values()];    if (topicsToExport.length === 0) return;    const bcfData = await topics.export(topicsToExport);    const bcfFile = new File([bcfData], "topics.bcf");    const a = document.createElement("a");    a.href = URL.createObjectURL(bcfFile);    a.download = bcfFile.name;    a.click();    URL.revokeObjectURL(a.href);  };  return BUI.html`<bim-button style="flex: 0" @click=${onDownload} label="Download BCF" icon="material-symbols:download"></bim-button> `;});
```

### 🥅 Creating a Panel to Hold the Table​

Let's now create a BIM Panel to hold the topics list while also adding the corresponding buttons to trigger the functionalities like showing the form and downloading the BCF file:

```typescript
const bcfPanel = BUI.Component.create(() => {  const onTextInput = (e: Event) => {    const input = e.target as BUI.TextInput;    topicsList.queryString = input.value;  };  return BUI.html`    <bim-panel>      <bim-panel-section label="BCF" fixed>        <div style="display: flex; justify-content: space-between; gap: 0.5rem">          <bim-text-input style="flex-grow: 0; flex-basis: 15rem" @input=${onTextInput} placeholder="Search a topic..." debounce="100"></bim-text-input>          <div style="display: flex; gap: 0.5rem">            ${showFormBtn}            ${downloadBtn}          </div>         </div>         ${topicsList}      </bim-panel-section>    </bim-panel>  `;});
```

Finally, let's create a BIM Grid element and provide the panels to the viewport to display everything.

```typescript
const app = document.createElement("bim-grid") as BUI.Grid<["main"]>;app.layouts = {  main: {    template: `    "customTopicPanel viewport"    "customTopicPanel bcfPanel" 25rem    /24rem 1fr    `,    elements: { bcfPanel, viewport, customTopicPanel: topicPanel },  },};app.layout = "main";document.body.append(app);
```

Congratulations! You have now created a fully working BCF user interface for your app in less than 10 minutes of work. Keep going with more tutorials! 💪


---

# MODULE: 📋 API
**URL:** https://docs.thatopen.com/api/

- 
- 📋 API

# 📋 API

## Packages​


| Data Table |
| --- |
| NameVersionDescription@thatopen/components3.4.2Collection of core functionalities to author BIM apps.@thatopen/components-front3.4.2Collection of frontend tools to author BIM apps.@thatopen/fragments3.4.3Simple geometric system built on top of Three.js to display 3D BIM data efficiently.@thatopen/ui3.4.0Collection of web components (UI components) meant to be used, but not limited to, BIM applications.@thatopen/ui-obc3.4.0Collection of web components (UI components) implementations to use with @thatopen/components. |


---

# MODULE: @thatopen/components
**URL:** https://docs.thatopen.com/api/@thatopen/components/

- 
- 📋 API
- @thatopen
- @thatopen/components

# @thatopen/components

## Enumerations​


| Data Table |
| --- |
| EnumerationDescriptionRendererModeThe mode of the renderer. If MANUAL, the renderer will be updated on command. If AUTO, the renderer will render on every update tick. |

## Classes​


| Data Table |
| --- |
| ClassDescriptionAngleAnnotationsGlobal drawing system that manages angle dimension annotations across all TechnicalDrawing instances.AnnotationSystemAbstract base for all annotation sub-systems operating on a TechnicalDrawing.AsyncEventSimple event handler by Jason Kleban. Keep in mind that if you want to remove it later, you might want to declare the callback as an object. If you want to maintain the reference to this, you will need to declare the callback as an arrow function.BCFTopicsBCFTopics manages Building Collaboration Format (BCF) data the engine. It provides functionality for importing, exporting, and manipulating BCF data. 📕 Tutorial. 📘 API.BaseBase class of the library. Useful for finding out the interfaces something implements.BaseCameraAbstract class representing a camera in a 3D world. All cameras should use this class as a base.BaseRendererAbstract class representing a renderer for a 3D world. All renderers should use this class as a base.BaseSceneAbstract class representing a base scene in the application. All scenes should use this class as a base.BaseWorldItemOne of the elements that make a world. It can be either a scene, a camera or a renderer.BlockAnnotationsGlobal drawing system that manages block insertions across all TechnicalDrawing instances.BoundingBoxerAn implementation of bounding box utilities that works for fragments. 📕 Tutorial. 📘 API.CalloutAnnotationsGlobal drawing system that manages callout annotations across all TechnicalDrawing instances.ClassifierThe Classifier component is responsible for grouping items from different models based on criteria. 📕 Tutorial. 📘 API.ClipperA lightweight component to easily create, delete and handle clipping planes. 📕 Tutorial. 📘 API.CommentRepresents a comment in a BCF Topic.ComponentComponents are the building blocks of this library. Components are singleton elements that contain specific functionality. For instance, the Clipper Component can create, delete and handle 3D clipping planes. Components must be unique (they can't be instanced more than once per Components instance), and have a static UUID that identifies them uniquely. The can be accessed globally using the Components instance.ComponentsThe entry point of the Components library. It can create, delete and access all the components of the library globally, update all the updatable components automatically and dispose all the components, preventing memory leaks.ConfigManagerA tool to manage all the configuration from the app centrally. 📘 API.DataMapA class that extends the built-in Map class and provides additional events for item set, update, delete, and clear operations.DataSetA class that extends the built-in Set class and provides additional functionality. It triggers events when items are added, deleted, or the set is cleared.DisposerA tool to safely remove meshes, geometries, materials and other items from memory to prevent memory leaks. 📘 API.DrawingAnnotationsFlat annotation store for a TechnicalDrawing, keyed by UUID.DrawingLayersManages the named layers of a TechnicalDrawing.DrawingViewportRepresents a framed orthographic window into a TechnicalDrawing.DrawingViewportHelperVisualises the bounds of a DrawingViewport as a rectangle in the 3D scene.DrawingViewportsManages the viewports of a TechnicalDrawing.DxfExporterSerializes TechnicalDrawing content to DXF format (AC1015 / AutoCAD R2000).DxfManagerManages DXF import and export for technical drawings.EdgeProjectorComponent that generates 2D edge projections from fragment model items.EventSimple event handler by Jason Kleban. Keep in mind that if you want to remove it later, you might want to declare the callback as an object. If you want to maintain the reference to this, you will need to declare the callback as an arrow function.EventManagerSimple class to easily toggle and reset event lists.FastModelPickerA fast model picker that uses color coding to identify fragment models under the mouse cursor. This is much faster than raycasting for simple model identification.FastModelPickersA component that manages a FastModelPicker for each world and automatically disposes it when its corresponding world is disposed.FinderQueryRepresents a finder query for retrieving items based on specified parameters. This class encapsulates the query logic, caching mechanism, and result management.FirstPersonModeA NavigationMode that allows first person navigation, simulating FPS video games.FragmentsManagerComponent to load, delete and manage fragments efficiently. 📕 Tutorial. 📘 API. Before calling FragmentsManager.init, you need a URL for the fragments worker. The recommended way to get it is FragmentsManager.getWorker, which fetches the version-matched worker from unpkg.GridsA component that manages grid instances. Each grid is associated with a unique world. 📕 Tutorial. 📘 API.HiderA component that manages visibility of fragments within a 3D scene. It extends the base Component class and provides methods to control fragment visibility and isolation. 📕 Tutorial. 📘 API.IDSSpecificationRepresents a single specification from the Information Delivery Specification (IDS) standard.IDSSpecificationsComponent that manages Information Delivery Specification (IDS) data. It provides functionality for importing, exporting, and manipulating IDS data. 📕 Tutorial. 📘 API.IfcFragmentSettingsConfiguration of the IFC-fragment conversion.IfcLoaderThe IfcLoader component is responsible of converting IFC files into Fragments. 📕 Tutorial. 📘 API.ItemsFinderManages and executes queries to find items within models based on specified criteria. This class provides functionalities to create, store, and execute FinderQuery instances, allowing for efficient retrieval of items that match given query parameters. 📕 Tutorial. 📘 API.LeaderAnnotationsGlobal drawing system that manages leader (arrow + text) annotations across all TechnicalDrawing instances.LinearAnnotationsGlobal drawing system that manages linear dimension annotations across all TechnicalDrawing instances.MeasurementUtilsUtility component for performing measurements on 3D meshes by providing methods for measuring distances between edges and faces. 📘 API.ModelIdMapUtilsUtility class for manipulating and managing ModelIdMap objects. A ModelIdMap is a mapping of model identifiers (strings) to sets of local IDs (numbers). This class provides methods for joining, intersecting, cloning, adding, removing, and comparing ModelIdMap objects, as well as converting between ModelIdMap and plain JavaScript objects.MouseA helper to easily get the real position of the mouse in the Three.js canvas to work with tools like the raycaster, even if it has been transformed through CSS or doesn't occupy the whole screen.OrbitModeA NavigationMode that allows 3D navigation and panning like in many 3D and CAD softwares.OrthoPerspectiveCameraA flexible camera that uses yomotsu's cameracontrols to control the camera in 2D and 3D. It supports multiple navigation modes, such as 2D floor plan navigation, first person and 3D orbit. This class extends the SimpleCamera class and adds additional functionality for managing different camera projections and navigation modes. 📕 Tutorial. 📘 API.PlanModeA NavigationMode that allows to navigate floorplans in 2D, like many BIM tools.ProjectionManagerObject to control the CameraProjection of the OrthoPerspectiveCamera.RaycastersA component that manages a raycaster for each world and automatically disposes it when its corresponding world is disposed. 📕 Tutorial. 📘 API.ShadowedSceneA scene that supports efficient cast shadows. 📕 Tutorial. 📘 API.SimpleCameraA basic camera that uses yomotsu's cameracontrols to control the camera in 2D and 3D. Check out it's API to find out what features it offers.SimpleGridAn infinite grid. Created by fyrestar and translated to typescript by dkaraush.SimplePlaneEach of the clipping planes created by the clipper.SimpleRaycasterA simple raycaster that allows to easily get items from the scene using the mouse and touch events.SimpleRendererA basic renderer capable of rendering Objec3Ds.SimpleSceneA basic 3D scene to add objects hierarchically, and easily dispose them when you are finished with it.SimpleWorldA class representing a simple world in a 3D environment. It extends the Base class and implements the World interface.SlopeAnnotationsGlobal drawing system that manages slope annotations across all TechnicalDrawing instances.TechnicalDrawingA single technical drawing — the core spatial aggregate.TechnicalDrawingHelperVisualises a TechnicalDrawing's projection volume in the 3D scene and exposes three gizmo anchors for interactive control.TechnicalDrawingsOBC Component that creates and manages TechnicalDrawing instances.VertexPickerA class that provides functionality for picking vertices in a 3D scene.ViewpointRepresents a BCF compliant viewpoint from BuildingSMART. The Viewpoint class provides methods for managing and interacting with viewpoints. It includes functionality for setting viewpoint properties, updating the camera, applying color to components, and serializing the viewpoint for export.ViewsThe Views class is responsible for managing and interacting with a collection of 2D sections. It provides methods for creating, opening, closing, and managing views, as well as generating views from specific configurations such as IFC storeys or bounding boxes. 📕 Tutorial. 📘 API.WorldsA class representing a collection of worlds within a game engine. It manages the creation, deletion, and update of worlds. 📕 Tutorial. 📘 API. |

## Interfaces​


| Data Table |
| --- |
| InterfaceDescriptionAddClassificationConfigConfiguration options for adding a classification.AnnotationEntryA single annotation entry stored in DrawingAnnotations, bundling the owning system, the annotation data, and its Three.js group.AxisGizmoLikeMinimal interface for a translate-only gizmo that can be configured and attached to one of the helper's control handles.BCFTopicsConfigConfiguration settings for managing BCF topics. This interface defines the properties and their meanings used to control the behavior of exporting and importing BCF topics.BCFViewpointRepresents a Building Collaboration Format (BCF) viewpoint. This interface is compliant with the BCF API specifications.BaseAnnotationStyleMinimum style contract shared by every annotation system.BlockDefinitionThe geometry content of a named block. At least one of lines or mesh must be provided.BlockInsertionA single placed instance of a named block definition.BlockStyleStyle for a BlockAnnotations system.CalloutAnnotationThe committed data for a single callout annotation.CalloutAnnotationStyleVisual appearance of a callout annotation.CameraControllableWhether a camera uses the Camera Controls library.ClassificationGroupDataRepresents the data structure for a classification group.ClassificationGroupQueryRepresents a query for a classification group.ClassifyItemRelationsConfigConfiguration interface for classifying item by relation values.ConfigurableWhether this component supports to be configured.CreateElevationViewsConfigConfiguration options for creating views from bounding boxes.CreateViewConfigConfiguration options for creating views from a plane.CreateViewFromIfcStoreysConfigConfiguration options for creating a view from IFC storeys.CreateableWhether this component supports create and destroy operations. This generally applies for components that work with instances, such as clipping planes or dimensions.DimensionUnitDefines how a measured value (in drawing-space metres) is converted to a display string.DisposableWhether this component has to be manually destroyed once you are done with it to prevent memory leaks. This also ensures that the DOM events created by that component will be cleaned up.DrawingIntersectionResult of a successful raycast against a TechnicalDrawing.DrawingLayerA named organizational layer on a TechnicalDrawing.DrawingSystemDescriptor"Type bag" descriptor that fully parameterises an annotation system.DrawingViewportConfigConfiguration to create a DrawingViewport.DxfDrawingEntryOne drawing with one or more viewport placements to export.DxfPaperOptionsPaper sheet dimensions for paper-space export.DxfTextOptionsOptional text formatting overrides for DxfWriteContext.writeText.DxfViewportEntryOne viewport placement within a drawing entry.DxfWriteContextWrite-context passed to custom system exporters registered viaDxfExporter.registerSystemExporter.EdgeProjectionResultResult of an edge projection, containing visible/hidden geometries and a mapping from group indices to model item identifiers.EventableWhether it has events or not.HideableWhether the geometric representation of this component can be hidden or shown in the Three.js scene.LeaderAnnotationThe committed data for a single leader annotation.LeaderAnnotationStyleVisual appearance of a leader annotation.LinearAnnotationThe committed data for a single linear annotation.LinearAnnotationStyleVisual appearance of a linear annotation. Registered by name on the component.MeasureEdgeRepresents an edge measurement result.NavigationModeAn object that determines the behavior of the camera controls and the user input (e.g. 2D floor plan mode, first person mode, etc).ProgressBasic type to describe the progress of any kind of process.QueryTestConfigConfiguration for testing queries.RemoveClassifierItemsConfigConfiguration options for removing items from a classifier.ResizeableWhether this component can be resized. The meaning of this can vary depending on the component: resizing a Renderer component could mean changing its resolution, whereas resizing a Mesh would change its scale.SerializedFinderQueryRepresents a serialized query for an item finder.SerializedQueryParametersRepresents the serialized query parameters used for item finding.ShadowedSceneConfigConfiguration interface for the ShadowedScene. Defines properties for directional and ambient lights, as well as shadows.SimpleGridConfigConfiguration interface for the SimpleGrid.SimpleSceneConfigConfiguration interface for the SimpleScene.SlopeAnnotationA single committed slope annotation.SlopeAnnotationStyleVisual appearance of a slope annotation.TransitionableWhether this component manages its interaction through an explicit state machine.UpdateableWhether this component should be updated each frame.VertexPickerConfigConfiguration interface for the VertexPicker component.ViewpointBitmapRepresents a bitmap image associated with a viewpoint. This interface is compliant with the BCF API specifications.ViewpointCameraRepresents the properties of a camera viewpoint in a 3D space. This interface is compliant with the BCF API specifications.ViewpointClippingPlaneRepresents a clipping plane in a viewpoint, defined by its location and direction. This interface is compliant with the BCF API specifications.ViewpointColoringRepresents the coloring information for a viewpoint, including the color and associated components. This interface is compliant with the BCF API specifications.ViewpointComponentRepresents a component within a viewpoint, typically used in Building Information Modeling (BIM) workflows. This interface is compliant with the BCF API specifications.ViewpointComponentsRepresents the components of a viewpoint in the BCF API. This interface is compliant with the BCF API specifications.ViewpointLineRepresents a line defined by a start and end point in a viewpoint. This interface is compliant with the BCF API specifications.ViewpointSnapshotRepresents a snapshot of a viewpoint, including its type and data. This interface is compliant with the BCF API specifications.ViewpointVectorRepresents a 3D vector with x, y, and z coordinates.ViewpointVisibilityRepresents the visibility settings for a viewpoint. This interface is compliant with the BCF API specifications.WithUiWhether it has a UI or not.WorldRepresents a 3D world with meshes, scene, camera, renderer, and other properties. |

## Type Aliases​


| Data Table |
| --- |
| Type aliasDescriptionAngleAnnotationDataEditable fields of AngleAnnotation — everything except the uuid.BlockInsertionDataEditable fields of BlockInsertion — everything except the uuid.CalloutAnnotationDataEditable fields of CalloutAnnotation — everything except uuid.CameraProjectionThe projection system of the camera.ClassifierIntersectionInputRepresents the input structure for a classifier intersection operation. Defines a record where the keys are classification names and the values are arrays of group names within those classifications.EnclosureBuilderDefines a closed shape (cloud, rectangle, circle, etc.) that forms the body of a callout annotation.IDSCheckResultThe result of a check performed by an IDSFacet test.LeaderAnnotationDataEditable fields of LeaderAnnotation — everything except uuid.LineTickBuilderA function that produces tick mark geometry at one endpoint of a dimension or leader line.LinearAnnotationDataEditable fields of LinearAnnotation — everything except the uuid.MeshTickBuilderA function that produces filled tick mark geometry (triangles) at one endpoint.ModelIdMapMapping of model identifiers to a collection of numbers representing localIds.NavModeIDThe extensible list of supported navigation modes.QueryResultAggregationRepresents the type of aggregation used in a query result. inclusive: Equivalent to OR. exclusive: Equivalent to AND.SlopeAnnotationDataEditable fields of SlopeAnnotation — everything except the uuid.SlopeFormatHow the slope value is displayed in the text label.ViewpointOrthogonalCameraRepresents an orthogonal camera viewpoint, extending the base ViewpointCamera type. This interface is compliant with the BCF API specifications.ViewpointPerspectiveCameraRepresents a perspective camera viewpoint compliant with the BCF API specifications. Extends the ViewpointCamera type and includes additional properties specific to perspective cameras. |

## Variables​


| Data Table |
| --- |
| VariableDescriptionCircleEnclosureElliptical enclosure — an ellipse approximated with line segments centred on center.CloudEnclosureRevision-cloud enclosure — a bumpy rectangle centred on center.RectEnclosureRectangular enclosure — a plain axis-aligned rectangle centred on center.UnitsBuilt-in DimensionUnit presets. |

## Functions​


| Data Table |
| --- |
| FunctionDescriptionArrowTickClosed arrowhead tick — two wing lines plus a base line connecting them.DiagonalTickDiagonal slash tick (architectural style).DotTickDot tick — a small circle drawn with line segments at the endpoint.FilledArrowTickFilled arrowhead tick (solid triangle, requires a THREE.Mesh).FilledCircleTickFilled circle tick (solid disc, requires a THREE.Mesh).FilledSquareTickFilled square tick (solid square, requires a THREE.Mesh).NoTickNo tick — dimension line ends cleanly at the extension lines.OpenArrowTickOpen-V arrowhead tick — two lines from the tip to the wing points, no base.angleDimensionMachinePure state transition function for the angle dimension tool.buildAnglePositionsBuilds the flat vertex positions for a single committed angle dimension.buildAnglePreviewPositionsBuilds vertex positions for the live preview during positioningArc.buildCalloutPositionsBuilds the flat vertex positions for a committed callout annotation.buildCalloutPreviewPositionsBuilds vertex positions for the live preview during interactive placement.buildDimensionPositionsBuilds the flat vertex positions (x,y,z triplets) for a single committed linear dimension.buildDimensionsBuilds an array of LinearAnnotations from consecutive point pairs, all sharing the same perpendicular offset.buildLeaderPositionsBuilds the flat vertex positions for a committed leader annotation.buildLeaderPreviewPositionsBuilds vertex positions for the live preview.buildPreviewPositionsBuilds the flat vertex positions for a live dimension preview.buildSlopePositionsBuilds the LineSegments position array for a committed slope annotation.calloutAnnotationMachinePure state transition function for the callout annotation tool.computeAlignmentMatrixComputes a local-to-world transformation matrix that maps a technical drawing's local coordinate system onto a target plane in 3D world space.computeAngleReturns the angle in radians between the two rays defined by the dimension.computeBisectorAngleReturns the angle (in radians, in the XZ plane) of the bisector ray between the two measured rays.computeOffsetComputes the signed offset from a cursor position to the measurement axis defined by the first and last points.formatSlopeConverts a slope ratio to a human-readable string.getAngleTickEndpointsReturns the tip position and inward tangent direction for each tick endpoint of an angle dimension arc.getDimensionTickEndpointsReturns the tip position and inward direction for each tick endpoint of a linear dimension.getSlopeTipReturns the tip position of a slope annotation in drawing local space.leaderAnnotationMachinePure state transition function for the leader annotation tool.linearDimensionMachinePure state transition function for the linear dimension tool. |


---

# MODULE: AngleAnnotations
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/AngleAnnotations

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- AngleAnnotations

# AngleAnnotations

Global drawing system that manages angle dimension annotations across all TechnicalDrawing instances.

## Extends​

- AnnotationSystem<AngleAnnotationSystem>

## Implements​

- Transitionable<AngleAnnotationState, AngleAnnotationEvent>
- Disposable


---

# MODULE: abstract AnnotationSystem\<TSystem\>
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/AnnotationSystem

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- abstract AnnotationSystem\<TSystem\>

# abstract AnnotationSystem<TSystem>

Abstract base for all annotation sub-systems operating on a TechnicalDrawing.

## Extended by​

- LinearAnnotations
- AngleAnnotations
- LeaderAnnotations
- BlockAnnotations
- SlopeAnnotations
- CalloutAnnotations

## Type parameters​


| Data Table |
| --- |
| Type parameterDescriptionTSystem extends DrawingSystemDescriptorA DrawingSystemDescriptor that declares the item, data, style, and handle types for this specific system. |

## Properties​

### _item​

Internal

readonly _item: TSystem["item"]

Declaration-only type marker. Never set at runtime. Used by
DrawingAnnotations.getBySystem for variance-free type inference:
TypeScript can read TSystem["item"] from this covariant readonly field
without triggering the invariance issues of the styles DataMap events.

## Methods​

### pickHandle()​

abstract pickHandle(drawing, ray, threshold?): null | object

Return the closest pickable handle on drawing for the given world-space
ray, or null if nothing is within threshold units.

#### Parameters​


| Data Table |
| --- |
| ParameterTypedrawingTechnicalDrawingrayRaythreshold?number |

#### Returns​

null | object


---

# MODULE: AsyncEvent\<T\>
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/AsyncEvent

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- AsyncEvent\<T\>

# AsyncEvent<T>

Simple event handler by Jason Kleban. Keep in mind that if you want to remove it later, you might want to declare the callback as an object. If you want to maintain the reference to this, you will need to declare the callback as an arrow function.

## Type parameters​


| Data Table |
| --- |
| Type parameterT |

## Properties​

### enabled​

enabled: boolean = true

Whether this event is active or not. If not, it won't trigger.

## Methods​

### add()​

add(handler): void

Add a callback to this event instance.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionhandlerT extends void ? () => Promise<void> : (data) => Promise<void>the callback to be added to this event. |

#### Returns​

void

### remove()​

remove(handler): void

Removes a callback from this event instance.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionhandlerT extends void ? () => Promise<void> : (data) => Promise<void>the callback to be removed from this event. |

#### Returns​

void

### reset()​

reset(): void

Gets rid of all the suscribed events.

#### Returns​

void

### trigger()​

trigger(data?): Promise<void>

Triggers all the callbacks assigned to this event.

#### Parameters​


| Data Table |
| --- |
| ParameterTypedata?T |

#### Returns​

Promise<void>


---

# MODULE: BCFTopics
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/BCFTopics

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- BCFTopics

# BCFTopics

BCFTopics manages Building Collaboration Format (BCF) data the engine. It provides functionality for importing, exporting, and manipulating BCF data. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Implements​

- Disposable
- Configurable<BCFTopicsConfigManager, BCFTopicsConfig>

## Accessors​

### usedLabels​

get usedLabels(): Set<string>

Retrieves the unique set of labels used across all topics.

#### Returns​

Set<string>

A Set containing the unique labels.

### usedPriorities​

get usedPriorities(): Set<undefined | string>

Retrieves the unique set of topic priorities used across all topics.

#### Returns​

Set<undefined | string>

A Set containing the unique topic priorities.
Note: This method filters out any null or undefined priorities.

### usedStages​

get usedStages(): Set<undefined | string>

Retrieves the unique set of topic stages used across all topics.

#### Returns​

Set<undefined | string>

A Set containing the unique topic stages.
Note: This method filters out any null or undefined stages.

### usedStatuses​

get usedStatuses(): Set<string>

Retrieves the unique set of topic statuses used across all topics.

#### Returns​

Set<string>

A Set containing the unique topic statuses.

### usedTypes​

get usedTypes(): Set<string>

Retrieves the unique set of topic types used across all topics.

#### Returns​

Set<string>

A Set containing the unique topic types.

### usedUsers​

get usedUsers(): Set<string>

Retrieves the unique set of users associated with topics.

#### Returns​

Set<string>

A Set containing the unique users.
Note: This method collects users from the creation author, assigned to, modified author, and comment authors.

## Methods​

### create()​

create(data?): Topic

Creates a new BCFTopic instance and adds it to the list.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondata?Partial<BCFTopic>Optional partial BCFTopic object to initialize the new topic with.If not provided, default values will be used. |

#### Returns​

Topic

The newly created BCFTopic instance.

### dispose()​

dispose(): void

Disposes of the BCFTopics component and triggers the onDisposed event.

#### Returns​

void

#### Implementation of​

Disposable . dispose

#### Remarks​

This method clears the list of topics and triggers the onDisposed event.
It also resets the onDisposed event listener.

### export()​

export(topics): Promise<Blob>

Exports the given topics to a BCF (Building Collaboration Format) zip file.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiontopicsIterable<Topic>The topics to export. Defaults to all topics in the list. |

#### Returns​

Promise<Blob>

A promise that resolves to a Blob containing the exported BCF zip file.

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable

### load()​

load(data): Promise<object>

Loads BCF (Building Collaboration Format) data into the engine.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondataUint8ArrayThe BCF data to load. |

#### Returns​

Promise<object>

A promise that resolves to an object containing the created viewpoints and topics.

topics: Topic[]

viewpoints: Viewpoint[] = createdViewpoints

#### Throws​

An error if the BCF version is not supported.

### updateExtensions()​

updateExtensions(): void

Updates the set of extensions (types, statuses, priorities, labels, stages, users) based on the current topics.
This method iterates through each topic in the list and adds its properties to the corresponding sets in the config.

#### Returns​

void

### updateViewpointReferences()​

updateViewpointReferences(): void

Updates the references to viewpoints in the topics.
This function iterates through each topic and checks if the viewpoints exist in the viewpoints list.
If a viewpoint does not exist, it is removed from the topic's viewpoints.

#### Returns​

void


---

# MODULE: abstract Base
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Base

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- abstract Base

# abstract Base

Base class of the library. Useful for finding out the interfaces something implements.

## Extended by​

- Component
- BaseWorldItem
- SimpleWorld

## Methods​

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable


---

# MODULE: abstract BaseCamera
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/BaseCamera

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- abstract BaseCamera

# abstract BaseCamera

Abstract class representing a camera in a 3D world. All cameras should use this class as a base.

## Extends​

- BaseWorldItem

## Extended by​

- SimpleCamera

## Properties​

### controls?​

optional abstract controls: CameraControls

Optional CameraControls instance for controlling the camera.
This property is only available if the camera is controllable.

### enabled​

abstract enabled: boolean

Whether the camera is enabled or not.

### onWorldChanged​

readonly onWorldChanged: Event<object>

Event that is triggered when a world is added or removed from the worlds map.
The event payload contains the world instance and the action ("added" or "removed").

#### Type declaration​

action: "added" | "removed"

world: World

#### Inherited from​

BaseWorldItem . onWorldChanged

### three​

abstract three: Camera

The Three.js camera instance.

## Accessors​

### currentWorld​

set currentWorld(value): void

The current world this item is associated with. It can be null if no world is currently active.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevaluenull | World |

## Methods​

### hasCameraControls()​

hasCameraControls(): this is CameraControllable

Checks whether the instance is CameraControllable.

#### Returns​

this is CameraControllable

True if the instance is controllable, false otherwise.

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

BaseWorldItem . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

BaseWorldItem . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

BaseWorldItem . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

BaseWorldItem . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

BaseWorldItem . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

BaseWorldItem . isUpdateable


---

# MODULE: abstract BaseRenderer
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/BaseRenderer

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- abstract BaseRenderer

# abstract BaseRenderer

Abstract class representing a renderer for a 3D world. All renderers should use this class as a base.

## Extends​

- BaseWorldItem

## Extended by​

- SimpleRenderer

## Implements​

- Updateable
- Disposable
- Resizeable

## Properties​

### clippingPlanes​

clippingPlanes: Plane[] = []

The list of clipping planes used by this instance of the renderer.

### onAfterUpdate​

onAfterUpdate: Event<unknown>

Updateable.onBeforeUpdate

#### Implementation of​

Updateable . onAfterUpdate

### onBeforeUpdate​

onBeforeUpdate: Event<unknown>

Updateable.onAfterUpdate

#### Implementation of​

Updateable . onBeforeUpdate

### onClippingPlanesUpdated​

readonly onClippingPlanesUpdated: Event<unknown>

Event that fires when there has been a change to the list of clipping
planes used by the active renderer.

### onDisposed​

readonly onDisposed: Event<undefined>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### onResize​

readonly onResize: Event<Vector2>

Resizeable.onResize

#### Implementation of​

Resizeable . onResize

### onWorldChanged​

readonly onWorldChanged: Event<object>

Event that is triggered when a world is added or removed from the worlds map.
The event payload contains the world instance and the action ("added" or "removed").

#### Type declaration​

action: "added" | "removed"

world: World

#### Inherited from​

BaseWorldItem . onWorldChanged

### three​

abstract three: WebGLRenderer

The three.js WebGLRenderer instance associated with this renderer.

#### Abstract​

## Accessors​

### currentWorld​

set currentWorld(value): void

The current world this item is associated with. It can be null if no world is currently active.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevaluenull | World |

## Methods​

### dispose()​

abstract dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### getSize()​

abstract getSize(): Vector2

Resizeable.getSize

#### Returns​

Vector2

#### Implementation of​

Resizeable . getSize

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

BaseWorldItem . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

BaseWorldItem . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

BaseWorldItem . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

BaseWorldItem . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

BaseWorldItem . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

BaseWorldItem . isUpdateable

### resize()​

abstract resize(size): void

Resizeable.resize

#### Parameters​


| Data Table |
| --- |
| ParameterTypesizeundefined | Vector2 |

#### Returns​

void

#### Implementation of​

Resizeable . resize

### setPlane()​

setPlane(active, plane, isLocal?): void

Sets or removes a clipping plane from the renderer.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionactivebooleanA boolean indicating whether the clipping plane should be active or not.planePlaneThe clipping plane to be added or removed.isLocal?booleanAn optional boolean indicating whether the clipping plane is local to the object. If not provided, it defaults to false. |

#### Returns​

void

#### Remarks​

This method adds or removes a clipping plane from the clippingPlanes array.
If active is true and the plane is not already in the array, it is added.
If active is false and the plane is in the array, it is removed.
The three.clippingPlanes property is then updated to reflect the current state of the clippingPlanes array,
excluding any planes marked as local.

### update()​

abstract update(delta?): void | Promise<void>

Updateable.update

#### Parameters​


| Data Table |
| --- |
| ParameterTypedelta?number |

#### Returns​

void | Promise<void>

#### Implementation of​

Updateable . update

### updateClippingPlanes()​

updateClippingPlanes(): void

Updates the clipping planes and triggers the onClippingPlanesUpdated event.

#### Returns​

void

#### Remarks​

This method is typically called when there is a change to the list of clipping planes
used by the active renderer.


---

# MODULE: abstract BaseScene
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/BaseScene

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- abstract BaseScene

# abstract BaseScene

Abstract class representing a base scene in the application. All scenes should use this class as a base.

## Extends​

- BaseWorldItem

## Extended by​

- SimpleScene

## Implements​

- Disposable

## Properties​

### ambientLights​

ambientLights: Map<string, AmbientLight>

The set of ambient lights managed by this scene component.

### directionalLights​

directionalLights: Map<string, DirectionalLight>

The set of directional lights managed by this scene component.

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### onWorldChanged​

readonly onWorldChanged: Event<object>

Event that is triggered when a world is added or removed from the worlds map.
The event payload contains the world instance and the action ("added" or "removed").

#### Type declaration​

action: "added" | "removed"

world: World

#### Inherited from​

BaseWorldItem . onWorldChanged

### three​

abstract three: Object3D<Object3DEventMap>

Abstract property representing the three.js object associated with this scene.
It should be implemented by subclasses.

## Accessors​

### currentWorld​

set currentWorld(value): void

The current world this item is associated with. It can be null if no world is currently active.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevaluenull | World |

## Methods​

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

BaseWorldItem . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

BaseWorldItem . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

BaseWorldItem . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

BaseWorldItem . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

BaseWorldItem . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

BaseWorldItem . isUpdateable


---

# MODULE: abstract BaseWorldItem
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/BaseWorldItem

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- abstract BaseWorldItem

# abstract BaseWorldItem

One of the elements that make a world. It can be either a scene, a camera or a renderer.

## Extends​

- Base

## Extended by​

- BaseCamera
- BaseRenderer
- BaseScene

## Properties​

### onWorldChanged​

readonly onWorldChanged: Event<object>

Event that is triggered when a world is added or removed from the worlds map.
The event payload contains the world instance and the action ("added" or "removed").

#### Type declaration​

action: "added" | "removed"

world: World

## Accessors​

### currentWorld​

set currentWorld(value): void

The current world this item is associated with. It can be null if no world is currently active.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevaluenull | World |

## Methods​

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Base . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Base . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Base . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Base . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Base . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Base . isUpdateable


---

# MODULE: BlockAnnotations
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/BlockAnnotations

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- BlockAnnotations

# BlockAnnotations

Global drawing system that manages block insertions across all TechnicalDrawing instances.

## Extends​

- AnnotationSystem<BlockAnnotationsSystem>

## Implements​

- Disposable

## Constructors​

### new BlockAnnotations()​

new BlockAnnotations(components): BlockAnnotations

A block is a named, reusable geometry definition (e.g. a furniture symbol
or a detail imported from a DXF). Multiple insertions of the same block share
the same THREE.BufferGeometry, so only the transform (position, rotation,
scale) differs per instance.

Register via TechnicalDrawings.use:

```typescript
const blocks = techDrawings.use(BlockAnnotations);
```

Typical workflow:

```typescript
// 1. Project external geometry to drawing spaceconst projected = TechnicalDrawing.toDrawingSpace(ifcLines, drawing);// 2. Register the block definition (global — do this once)blocks.define("CHAIR", { lines: projected.geometry });// 3. Insert on any drawingblocks.add(drawing, { blockName: "CHAIR", position, rotation: 0, scale: 1, style: "default" });
```

#### Parameters​


| Data Table |
| --- |
| ParameterTypecomponentsComponents |

#### Returns​

BlockAnnotations

#### Overrides​

AnnotationSystem<BlockAnnotationsSystem>.constructor

## Properties​

### definitions​

readonly definitions: DataMap<string, BlockDefinition>

Named block definitions in block-local XZ space.
Register via define. Geometry is shared across all drawings and insertions.

## Methods​

### define()​

define(name, definition): void

Registers a block definition by name (global — not tied to any drawing).
All geometry must be in block-local XZ space (Y = 0).
Use TechnicalDrawing.toDrawingSpace to project external geometry first.

Replaces any existing definition with the same name without disposing the old geometry.

#### Parameters​


| Data Table |
| --- |
| ParameterTypenamestringdefinitionBlockDefinition |

#### Returns​

void

### pick()​

pick(ray, threshold): null | string

Overrides the base pick to use the correct LineSegments.raycast (pair-based)
rather than THREE.Line.prototype.raycast (continuous-line).

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valuerayRayundefinedthresholdnumber0.05 |

#### Returns​

null | string

#### Overrides​

AnnotationSystem.pick


---

# MODULE: BoundingBoxer
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/BoundingBoxer

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- BoundingBoxer

# BoundingBoxer

An implementation of bounding box utilities that works for fragments. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Implements​

- Disposable

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### list​

readonly list: DataSet<Box3>

A readonly dataset containing instances of THREE.Box3.

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

## Methods​

### addFromModelIdMap()​

addFromModelIdMap(items): Promise<void>

Asynchronously adds bounding boxes to the list by merging boxes from models
specified in the provided ModelIdMap.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionitemsModelIdMapA map where keys are model IDs and values are arrays of local IDs               representing specific parts of the models to include in the bounding box. |

A map where keys are model IDs and values are arrays of local IDs

representing specific parts of the models to include in the bounding box.

#### Returns​

Promise<void>

### addFromModels()​

addFromModels(modelIds?): void

Adds bounding boxes from models to the current list based on optional filtering criteria.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodelIds?RegExp[]An optional array of regular expressions used to filter models by their IDs.                  If provided, only models whose IDs match at least one of the regular expressions                  will have their bounding boxes added to the list. If not, all models will be used. |

An optional array of regular expressions used to filter models by their IDs.

If provided, only models whose IDs match at least one of the regular expressions

will have their bounding boxes added to the list. If not, all models will be used.

#### Returns​

void

### dispose()​

dispose(full): void

Disposable.dispose

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valuefullbooleantrue |

#### Returns​

void

#### Implementation of​

Disposable . dispose

### get()​

get(): Box3

Combines all bounding boxes in the list property into a single bounding box.

#### Returns​

Box3

A THREE.Box3 instance representing the union of all bounding boxes in the list.

### getCameraOrientation()​

getCameraOrientation(orientation, offsetFactor): Promise<object>

Calculates the camera orientation and position based on the specified orientation
and an optional offset factor.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valueDescriptionorientation"front" | "back" | "left" | "right" | "top" | "bottom"undefinedSpecifies the direction of the camera relative to the bounding box.offsetFactornumber1A multiplier applied to the distance between the camera and the bounding box.                      Defaults to 1. |

A multiplier applied to the distance between the camera and the bounding box.

Defaults to 1.

#### Returns​

Promise<object>

An object containing:

- position: A THREE.Vector3 representing the calculated camera position.
- target: A THREE.Vector3 representing the center of the bounding box, which the camera should target.

position: Vector3

target: Vector3 = center

### getCenter()​

getCenter(modelIdMap): Promise<Vector3>

Calculates and returns the center point of the bounding box derived from the provided model ID map.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodelIdMapModelIdMapA mapping of model IDs and localIds used to generate the bounding box. |

#### Returns​

Promise<Vector3>

A THREE.Vector3 object representing the center point of the bounding box.

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable


---

# MODULE: CalloutAnnotations
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/CalloutAnnotations

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- CalloutAnnotations

# CalloutAnnotations

Global drawing system that manages callout annotations across all TechnicalDrawing instances.

## Extends​

- AnnotationSystem<CalloutAnnotationSystem>

## Implements​

- Transitionable<CalloutAnnotationState, CalloutAnnotationEvent>
- Disposable


---

# MODULE: Classifier
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Classifier

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Classifier

# Classifier

The Classifier component is responsible for grouping items from different models based on criteria. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Implements​

- Disposable

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### list​

readonly list: DataMap<string, DataMap<string, ClassificationGroupData>>

A nested data map that organizes classification groups.
The outer map uses strings as keys, and the inner map contains ClassificationGroupData, also keyed by strings.

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### uuid​

static readonly uuid: "e25a7f3c-46c4-4a14-9d3d-5115f24ebeb7"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### addGroupItems()​

addGroupItems(classification, group, items): void

Adds items to a specific group within a classification.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionclassificationstringThe classification to which the group belongs.groupstringThe group to which the items will be added.itemsModelIdMapA map of model IDs to add to the group. |

#### Returns​

void

### aggregateItemRelations()​

aggregateItemRelations(classification, query, relation, config?): Promise<void>

From the items passing the query, use the specified relation to create groupings
This method retrieves and processes related items, applying a custom aggregation callback to register
relations between items based on their attributes and local IDs.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionclassificationstringThe classification type used to filter items.queryItemsQueryParamsQuery parameters for filtering items, defined by FRAGS.ItemsQueryParams.relationstringThe type of relation to aggregate (e.g., "ContainedInStructure", "HasAssociations").config?ClassifyItemRelationsConfigOptional configuration for the aggregation process. |

#### Returns​

Promise<void>

A promise that resolves when the aggregation process is complete.

#### Remarks​

- The aggregationCallback function processes each item and registers relations based on the item's
attribute value and the local ID of its relations.
- Items without the specified attribute or relations are ignored during aggregation.

### aggregateItems()​

aggregateItems(classification, query, config?): Promise<void>

Aggregates items based on a classification and query, applying a provided function to each item.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionclassificationstringThe classification string used to categorize the items.queryItemsQueryParamsThe query parameters used to find items.config?objectOptional configuration for data and item processing.config.aggregationCallback?(item, register) => voidOptional function to apply to each item; defaults to this.defaultSaveFunction if not provided.                      This function receives the item data and a register function to associate item local IDs with names.                      If no function is provided, the default save function is used.config.data?Partial<ItemsDataConfig>Optional data configuration to pass to the item retrieval.config.modelIds?RegExp[]- |

Optional function to apply to each item; defaults to this.defaultSaveFunction if not provided.

This function receives the item data and a register function to associate item local IDs with names.

If no function is provided, the default save function is used.

#### Returns​

Promise<void>

#### Remarks​

The register function within the config.func allows associating item local IDs with a given name under the specified classification.
It is used to keep track of which items belong to which classification.

### byCategory()​

byCategory(config?): Promise<void>

Asynchronously processes and adds classifications by category.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionconfig?AddClassificationConfigOptional configuration for adding classifications. |

#### Returns​

Promise<void>

A promise that resolves once the categories have been processed and added.

### byIfcBuildingStorey()​

byIfcBuildingStorey(config?): Promise<void>

Asynchronously processes and adds classifications by IfcBuildingStorey.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionconfig?AddClassificationConfigOptional configuration for adding classifications. |

#### Returns​

Promise<void>

A promise that resolves once the storeys have been processed and added.

### byModel()​

byModel(config?): Promise<void>

Asynchronously processes models based on the provided configuration and updates classification groups.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionconfig?AddClassificationConfigOptional configuration for adding classifications. Contains the following properties. |

#### Returns​

Promise<void>

A promise that resolves when the processing is complete.

### defaultSaveFunction()​

defaultSaveFunction(item): null | string

The default save function used by the classifier.
It extracts the 'value' property from the item's Name and returns it as a string.
If the 'value' property does not exist, it returns null.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionitemItemDataThe item data to extract the value from. |

#### Returns​

null | string

The extracted value as a string, or null if the value does not exist.

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### find()​

find(data): Promise <ModelIdMap>

Asynchronously finds a set of ModelIdMaps based on the provided classification data.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondataClassifierIntersectionInputAn object with classifications as keys and an array of groups as values. |

#### Returns​

Promise <ModelIdMap>

A promise that resolves to a ModelIdMap representing the intersection of all ModelIdMaps found.

### getGroupData()​

getGroupData(classification, group): ClassificationGroupData

Retrieves data associated with a specific group within a classification.
If the group data does not exist, it creates a new entry.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionclassificationstringThe classification string.groupstringThe group string within the classification. |

#### Returns​

ClassificationGroupData

The data object associated with the group, containing a map and a get method.

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable

### removeItems()​

removeItems(modelIdMap, config?): void

Removes items from the classifier based on the provided model ID map and configuration.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodelIdMapModelIdMapA map containing model IDs to be removed.config?RemoveClassifierItemsConfigOptional configuration for removing items.s. |

#### Returns​

void

#### Remarks​

If no configuration is provided, items will be removed from all classifications

### setGroupQuery()​

setGroupQuery(classification, group, query): void

Sets the query for a specific group within a classification.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionclassificationstringThe classification to target.groupstringThe group within the classification to target.queryClassificationGroupQueryThe query to set for the group. |

#### Returns​

void


---

# MODULE: Clipper
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Clipper

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Clipper

# Clipper

A lightweight component to easily create, delete and handle clipping planes. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Implements​

- Createable
- Disposable
- Hideable
- Configurable<ClipperConfigManager, ClipperConfig>

## Properties​

### Type()​

Type: (...args) => SimplePlane = SimplePlane

The type of clipping plane to be created.
Default is SimplePlane.

#### Parameters​


| Data Table |
| --- |
| ParameterType...argsany |

#### Returns​

SimplePlane

### autoScalePlanes​

autoScalePlanes: boolean = true

Whether clipping planes should automatically scale based on
camera distance. When true, the plane surface stays proportional
to the arrow gizmo as you zoom in/out. Default is true.

### config​

config: ClipperConfigManager

Configurable.config

#### Implementation of​

Configurable . config

### isSetup​

isSetup: boolean = false

Configurable.isSetup

#### Implementation of​

Configurable . isSetup

### list​

readonly list: DataMap<string, SimplePlane>

A list of all the clipping planes created by this component.

### onAfterCancel​

readonly onAfterCancel: Event<unknown>

Event that fires after the user cancels the creation of a clipping plane.

### onAfterCreate​

readonly onAfterCreate: Event <SimplePlane>

Event that fires after a clipping plane has been created.

#### Param​

The newly created clipping plane.

### onAfterDelete​

readonly onAfterDelete: Event <SimplePlane>

Event that fires after a clipping plane has been deleted.

#### Param​

The deleted clipping plane.

### onAfterDrag​

readonly onAfterDrag: Event <SimplePlane>

Event that fires when the user stops dragging a clipping plane.

### onBeforeCancel​

readonly onBeforeCancel: Event<unknown>

Event that fires when the user cancels the creation of a clipping plane.

### onBeforeCreate​

readonly onBeforeCreate: Event<unknown>

Event that fires when the user starts creating a clipping plane.

### onBeforeDelete​

readonly onBeforeDelete: Event<unknown>

Event that fires when the user starts deleting a clipping plane.

### onBeforeDrag​

readonly onBeforeDrag: Event <SimplePlane>

Event that fires when the user starts dragging a clipping plane.

### onDisposed​

readonly onDisposed: Event<string>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### onSetup​

readonly onSetup: Event<unknown>

Configurable.onSetup

#### Implementation of​

Configurable . onSetup

### orthogonalY​

orthogonalY: boolean = false

Whether to force the clipping plane to be orthogonal in the Y direction
(up). This is desirable when clipping a building horizontally and a
clipping plane is created in its roof, which might have a slight
slope for draining purposes.

### toleranceOrthogonalY​

toleranceOrthogonalY: number = 0.7

The tolerance that determines whether an almost-horizontal clipping plane
will be forced to be orthogonal to the Y direction. orthogonalY
has to be true for this to apply.

### uuid​

static readonly uuid: "66290bc5-18c4-4cd1-9379-2e17a0617611"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Accessors​

### enabled​

get enabled(): boolean

Component.enabled

set enabled(state): void

Component.enabled

#### Parameters​


| Data Table |
| --- |
| ParameterTypestateboolean |

#### Returns​

boolean

### material​

get material(): MeshBasicMaterial

The material of the clipping plane representation.

set material(material): void

The material of the clipping plane representation.

#### Parameters​


| Data Table |
| --- |
| ParameterTypematerialMeshBasicMaterial |

#### Returns​

MeshBasicMaterial

### size​

get size(): number

The size of the geometric representation of the clippings planes.

set size(size): void

The size of the geometric representation of the clippings planes.

#### Parameters​


| Data Table |
| --- |
| ParameterTypesizenumber |

#### Returns​

number

### visible​

get visible(): boolean

Hideable.visible

set visible(state): void

Hideable.visible

#### Parameters​


| Data Table |
| --- |
| ParameterTypestateboolean |

#### Returns​

boolean

## Methods​

### create()​

create(world): Promise<null | SimplePlane>

Createable.create

#### Parameters​


| Data Table |
| --- |
| ParameterTypeworldWorld |

#### Returns​

Promise<null | SimplePlane>

#### Implementation of​

Createable . create

### createFromNormalAndCoplanarPoint()​

createFromNormalAndCoplanarPoint(world, normal, point): string

Creates a plane in a certain place and with a certain orientation,
without the need of the mouse.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionworldWorldthe world where this plane should be created.normalVector3the orientation of the clipping plane.pointVector3the position of the clipping plane.navigation. |

#### Returns​

string

### delete()​

delete(world, planeId?): Promise<void>

Createable.delete

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionworldWorldthe world where the plane to delete is.planeId?stringthe plane to delete. If undefined, the first planefound under the cursor will be deleted. |

#### Returns​

Promise<void>

#### Implementation of​

Createable . delete

### deleteAll()​

deleteAll(types?): void

Deletes all the existing clipping planes.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiontypes?Set<string>the types of planes to be deleted. If not provided, all planes will be deleted. |

#### Returns​

void

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable

### setup()​

setup(config?): void

Configurable.setup

#### Parameters​


| Data Table |
| --- |
| ParameterTypeconfig?Partial<ClipperConfig> |

#### Returns​

void

#### Implementation of​

Configurable . setup


---

# MODULE: Comment
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Comment

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Comment

# Comment

Represents a comment in a BCF Topic.

## Constructors​

### new Comment()​

new Comment(components, text): Comment

Constructs a new BCF Topic Comment instance.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptioncomponentsComponentsThe Components instance.textstringThe initial comment text. |

#### Returns​

Comment

## Accessors​

### comment​

get comment(): string

Gets the comment text.

set comment(value): void

Sets the comment text and updates the modified date and author.
The author will be the one defined in BCFTopics.config.author

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionvaluestringThe new comment text. |

#### Returns​

string

The comment text.


---

# MODULE: abstract Component
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Component

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- abstract Component

# abstract Component

Components are the building blocks of this library. Components are singleton elements that contain specific functionality. For instance, the Clipper Component can create, delete and handle 3D clipping planes. Components must be unique (they can't be instanced more than once per Components instance), and have a static UUID that identifies them uniquely. The can be accessed globally using the Components instance.

## Extends​

- Base

## Extended by​

- ConfigManager
- Disposer
- Grids
- Worlds
- Raycasters
- Clipper
- Views
- FastModelPickers
- VertexPicker
- EdgeProjector
- FragmentsManager
- IfcLoader
- Hider
- BoundingBoxer
- ItemsFinder
- Classifier
- BCFTopics
- IDSSpecifications
- MeasurementUtils
- TechnicalDrawings
- DxfManager

## Properties​

### enabled​

abstract enabled: boolean

Whether this component is active or not. The behaviour can vary depending
on the type of component. E.g. a disabled dimension tool will stop creating
dimensions, while a disabled camera will stop moving. A disabled component
will not be updated automatically each frame.

## Methods​

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Base . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Base . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Base . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Base . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Base . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Base . isUpdateable


---

# MODULE: Components
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Components

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Components

# Components

The entry point of the Components library. It can create, delete and access all the components of the library globally, update all the updatable components automatically and dispose all the components, preventing memory leaks.

## Implements​

- Disposable

## Properties​

### enabled​

enabled: boolean = false

If disabled, the animation loop will be stopped.
Default value is false.

### list​

readonly list: DataMap<string, Component>

The list of components created in this app.
The keys are UUIDs and the values are instances of the components.

### onDisposed​

readonly onDisposed: Event<void>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### onInit​

readonly onInit: Event<undefined>

Event that triggers the Components instance is initialized.

#### Remarks​

This event is triggered once when the Components.init method has been called and finish processing.
This is useful to set configuration placeholders that need to be executed when the components instance is initialized.
For example, enabling and configuring custom effects in a post-production renderer.

#### Example​

```typescript
const components = new Components();components.onInit.add(() => {  // Enable custom effects in the post-production renderer  // or any other operation dependant on the component initialization});components.init();
```

### release​

static readonly release: "2.4.3" = "2.4.3"

The version of the @thatopen/components library.

## Methods​

### add()​

add(uuid, instance): void

Adds a component to the list of components.
Throws an error if a component with the same UUID already exists.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionuuidstringThe unique identifier of the component.instanceComponentThe instance of the component to be added. |

#### Returns​

void

#### Throws​

Will throw an error if a component with the same UUID already exists.

### dispose()​

dispose(): void

Disposes the memory of all the components and tools of this instance of
the library. A memory leak will be created if:

- An instance of the library ends up out of scope and this function isn't
called. This is especially relevant in Single Page Applications (React,
Angular, Vue, etc).
- Any of the objects of this instance (meshes, geometries,materials, etc) is
referenced by a reference type (object or array).

An instance of the library ends up out of scope and this function isn't
called. This is especially relevant in Single Page Applications (React,
Angular, Vue, etc).

Any of the objects of this instance (meshes, geometries,materials, etc) is
referenced by a reference type (object or array).

You can learn more about how Three.js handles memory leaks
here.

#### Returns​

void

#### Implementation of​

Disposable . dispose

### get()​

get<U>(Component): U

Retrieves a component instance by its constructor function.
If the component does not exist in the list, it will be created and added.

#### Type parameters​


| Data Table |
| --- |
| Type parameterDescriptionU extends ComponentThe type of the component to retrieve. |

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionComponentObjectThe constructor function of the component to retrieve. |

#### Returns​

U

The instance of the requested component.

#### Throws​

Will throw an error if a component with the same UUID already exists.

### init()​

init(): void

Initializes the Components instance.
This method starts the animation loop, sets the enabled flag to true,
and calls the update method.

#### Returns​

void


---

# MODULE: ConfigManager
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/ConfigManager

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- ConfigManager

# ConfigManager

A tool to manage all the configuration from the app centrally. 📘 API.

## Extends​

- Component

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### list​

list: DataMap<string, Configurator<any, any>>

The list of all configurations of this app.

### uuid​

static readonly uuid: "b8c764e0-6b24-4e77-9a32-35fa728ee5b4"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable


---

# MODULE: DataMap\<K, V\>
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/DataMap

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- DataMap\<K, V\>

# DataMap<K, V>

A class that extends the built-in Map class and provides additional events for item set, update, delete, and clear operations.

## Extends​

- Map<K, V>

## Type parameters​


| Data Table |
| --- |
| Type parameterDescriptionKThe type of keys in the map.VThe type of values in the map. |

## Constructors​

### new DataMap()​

new DataMap<K, V>(iterable?): DataMap<K, V>

Constructs a new DataMap instance.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptioniterable?null | Iterable<readonly [K, V]>An iterable object containing key-value pairs to populate the map. |

#### Returns​

DataMap<K, V>

#### Overrides​

Map<K, V>.constructor

## Properties​

### guard()​

guard: (key, value) => boolean

A function that acts as a guard for adding items to the set.
It determines whether a given value should be allowed to be added to the set.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionkeyKThe key of the entry to be checked against the guard.valueVThe value of the entry to be checked against the guard. |

#### Returns​

boolean

### onCleared​

readonly onCleared: Event<unknown>

An event triggered when the map is cleared.

### onItemDeleted​

readonly onItemDeleted: Event<K>

An event triggered when an item is deleted from the map.

### onItemSet​

readonly onItemSet: Event<object>

An event triggered when a new item is set in the map.

#### Type declaration​

key: K

value: V

### onItemUpdated​

readonly onItemUpdated: Event<object>

An event triggered when an existing item in the map is updated.

#### Type declaration​

key: K

value: V

## Methods​

### add()​

add(value): K

Sets the value in the map with a randomly generated uuidv4 key.
Only use this if your keys are strings

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionvalueVThe value of the item to set. |

#### Returns​

K

The key used.

### clear()​

clear(): void

Clears the map and triggers the onCleared event.

#### Returns​

void

#### Overrides​

Map.clear

### delete()​

delete(key): boolean

Deletes the specified key from the map and triggers the onItemDeleted event if the key was found.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionkeyKThe key of the item to delete. |

#### Returns​

boolean

True if the key was found and deleted; otherwise, false.

#### Overrides​

Map.delete

### dispose()​

dispose(): void

Clears the map and resets the events.

#### Returns​

void

### set()​

set(key, value): DataMap<K, V>

Sets the value for the specified key in the map.
If the item is new, then onItemSet is triggered.
If the item is already in the map, then onItemUpdated is triggered.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionkeyKThe key of the item to set.valueVThe value of the item to set. |

#### Returns​

DataMap<K, V>

The DataMap instance.

#### Overrides​

Map.set


---

# MODULE: DataSet\<T\>
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/DataSet

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- DataSet\<T\>

# DataSet<T>

A class that extends the built-in Set class and provides additional functionality. It triggers events when items are added, deleted, or the set is cleared.

## Extends​

- Set<T>

## Type parameters​


| Data Table |
| --- |
| Type parameterDescriptionTThe type of elements in the set. |

## Constructors​

### new DataSet()​

new DataSet<T>(iterable?): DataSet<T>

Constructs a new instance of the DataSet class.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptioniterable?null | Iterable<T>An optional iterable object to initialize the set with. |

#### Returns​

DataSet<T>

#### Overrides​

Set<T>.constructor

## Properties​

### guard()​

guard: (value) => boolean

A function that acts as a guard for adding items to the set.
It determines whether a given value should be allowed to be added to the set.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionvalueTThe value to be checked against the guard. |

#### Returns​

boolean

### onCleared​

readonly onCleared: Event<unknown>

An event that is triggered when the set is cleared.

### onItemAdded​

readonly onItemAdded: Event<T>

An event that is triggered when a new item is added to the set.

### onItemDeleted​

readonly onItemDeleted: Event<unknown>

An event that is triggered when an item is deleted from the set.

## Methods​

### add()​

add(...value): DataSet<T>

Adds one or multiple values to the set and triggers the onItemAdded event per each.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescription...valueT[]The value to add to the set. |

#### Returns​

DataSet<T>

- The set instance.

#### Overrides​

Set.add

### clear()​

clear(): void

Clears the set and triggers the onCleared event.

#### Returns​

void

#### Overrides​

Set.clear

### delete()​

delete(value): boolean

Deletes a value from the set and triggers the onItemDeleted event.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionvalueTThe value to delete from the set. |

#### Returns​

boolean

- True if the value was successfully deleted, false otherwise.

#### Overrides​

Set.delete

### dispose()​

dispose(): void

Clears the set and resets the onItemAdded, onItemDeleted, and onCleared events.

#### Returns​

void


---

# MODULE: Disposer
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Disposer

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Disposer

# Disposer

A tool to safely remove meshes, geometries, materials and other items from memory to prevent memory leaks. 📘 API.

## Extends​

- Component

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### uuid​

static readonly uuid: "76e9cd8e-ad8f-4753-9ef6-cbc60f7247fe"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### destroy()​

destroy(object, materials, recursive): void

Removes a mesh, its geometry and its materials from memory. If you are
using any of these in other parts of the application, make sure that you
remove them from the mesh before disposing it.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valueDescriptionobjectObject3D<Object3DEventMap>undefinedthe objectto remove.materialsbooleantruewhether to dispose the materials of the mesh.recursivebooleantruewhether to recursively dispose the children of the mesh. |

#### Returns​

void

### disposeGeometry()​

disposeGeometry(geometry): void

Disposes a geometry from memory.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiongeometryBufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>thegeometry to remove. |

the

geometry

to remove.

#### Returns​

void

### get()​

get(): Set<string>

Return the UUIDs of all disposed components.

#### Returns​

Set<string>

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable


---

# MODULE: DrawingAnnotations
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/DrawingAnnotations

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- DrawingAnnotations

# DrawingAnnotations

Flat annotation store for a TechnicalDrawing, keyed by UUID.

## Extends​

- DataMap<string, AnnotationEntry>

## Constructors​

### new DrawingAnnotations()​

new DrawingAnnotations(): DrawingAnnotations

Each entry bundles the owning system, the data, and the Three.js group —
so a single drawing.annotations.get(uuid) gives full access to all three.

Systems write here when they create or update annotations; consumers read
from here or subscribe to system-level events (onCommit, onDelete).

```typescript
// Get everything for a known UUIDconst { system, data, three } = drawing.annotations.get(uuid)!;// Iterate all annotations owned by a specific systemfor (const [uuid, dim] of drawing.annotations.getBySystem(dims)) { ... }
```

#### Returns​

DrawingAnnotations

#### Overrides​

FRAGS.DataMap<string, AnnotationEntry>.constructor

## Methods​

### getBySystem()​

getBySystem<T>(system): Map<string, T>

Returns a snapshot map of uuid → item for all annotations owned by
system on this drawing. TypeScript infers the item type from the
system's _item declaration marker, avoiding DataMap event variance issues.

#### Type parameters​


| Data Table |
| --- |
| Type parameterT |

#### Parameters​


| Data Table |
| --- |
| ParameterTypesystemobjectsystem._itemT |

#### Returns​

Map<string, T>


---

# MODULE: DrawingLayers
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/DrawingLayers

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- DrawingLayers

# DrawingLayers

Manages the named layers of a TechnicalDrawing.

## Extends​

- DataMap<string, DrawingLayer>

## Constructors​

### new DrawingLayers()​

new DrawingLayers(container): DrawingLayers

Accessible via drawing.layers. Each layer owns a THREE.LineBasicMaterial
that is shared across all projection LineSegments assigned to it —
mutating the material (e.g. via setColor) is reflected on every line
immediately without any scene traversal. Annotation systems always use their
own style material and are not affected by layer materials.

Extends DataMap<string, DrawingLayer> so consumers get reactive events
(onItemSet, onItemDeleted, …) directly on drawing.layers.

Layer "0" always exists and cannot be removed.

```typescript
drawing.layers.create("walls", { material: new THREE.LineBasicMaterial({ color: 0x333333 }) });drawing.layers.setColor("walls", 0x888888);drawing.layers.setVisibility("walls", false);
```

#### Parameters​


| Data Table |
| --- |
| ParameterTypecontainerGroup<Object3DEventMap> |

#### Returns​

DrawingLayers

#### Overrides​

FRAGS.DataMap<string, DrawingLayer>.constructor

## Methods​

### assign()​

assign(object, name): void

Assigns an object to a named layer, applies the layer's material (if the
object is a LineSegments), and immediately reflects the layer's current
visibility state.

Use this instead of setting object.userData.layer directly so that
the material and visibility are always in sync at insertion time.

Does nothing if the layer does not exist.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionobjectObject3D<Object3DEventMap>The Three.js object to assign.namestringLayer name. |

#### Returns​

void

### create()​

create(name, options?): DrawingLayer

Creates a new layer. If a layer with the same name already exists, returns
the existing one without modifying it.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionnamestringUnique layer name.options?objectOptional material and visibility. If no material is given,  a default black LineBasicMaterial is created. Visibility defaults to true.options.material?LineBasicMaterial-options.visible?boolean- |

Optional material and visibility. If no material is given,

a default black LineBasicMaterial is created. Visibility defaults to true.

#### Returns​

DrawingLayer

The (possibly pre-existing) layer object.

### resolveColor()​

Internal

resolveColor(name): undefined | number

Used by DxfExporter to read the layer color for DXF output.

#### Parameters​


| Data Table |
| --- |
| ParameterTypenamestring |

#### Returns​

undefined | number

### setColor()​

setColor(name, color): void

Updates the color of a layer's material and fires reactive events.

Because all LineSegments on the same layer share the same material
instance, the change is reflected immediately on all of them — no scene
traversal is required.

Does nothing if the layer does not exist.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionnamestringLayer name.colornumberHex color (e.g. 0xff0000). |

#### Returns​

void

### setMaterial()​

setMaterial(name, material): void

Replaces the material of a layer and updates all LineSegments currently
assigned to it. The previous material is disposed.

Does nothing if the layer does not exist.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionnamestringLayer name.materialLineBasicMaterialNew material to assign. |

#### Returns​

void

### setVisibility()​

setVisibility(name, visible): void

Shows or hides all objects assigned to the given layer.

Does nothing if the layer does not exist.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionnamestringLayer name.visiblebooleantrue to show, false to hide. |

#### Returns​

void


---

# MODULE: DrawingViewport
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/DrawingViewport

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- DrawingViewport

# DrawingViewport

Represents a framed orthographic window into a TechnicalDrawing.

## Constructors​

### new DrawingViewport()​

new DrawingViewport(config): DrawingViewport

The viewport lives in the drawing's local coordinate system (XZ plane, Y = 0).
Its camera must be added as a child of the drawing's container so that
any world-space transform applied to the container automatically moves the camera.

The camera uses layer 1 exclusively, so only geometry explicitly assigned
to layer 1 (projection lines, dimensions) is visible in paper-space renders.

Local coordinate convention:

- X right → world +X
- Y up (screen) → world -Z
- Normal (out of plane) → world +Y

#### Parameters​


| Data Table |
| --- |
| ParameterTypeconfigDrawingViewportConfig |

#### Returns​

DrawingViewport

## Properties​

### camera​

readonly camera: OrthographicCamera

The Three.js orthographic camera for this viewport.
Add it to the drawing container via DrawingViewports.add.

### name​

name: string

Human-readable label for this viewport.

### onDisposed​

readonly onDisposed: Event<void>

Disposable.onDisposed

### uuid​

readonly uuid: string

Unique identifier for this viewport instance.

## Accessors​

### bbox​

get bbox(): Box3

Axis-aligned bounding box of this viewport in world drawing space (Y = 0).
Used by clipLine and PDF/DXF exporters.

Because screen-up = world −Z, the world Z range visible to the camera is
[−top, −bottom], not [bottom, top].

#### Returns​

Box3

### drawingScale​

get drawingScale(): number

Drawing scale denominator (e.g. 100 = 1:100).

#### Returns​

number

### helper​

get helper(): DrawingViewportHelper

The DrawingViewportHelper for this viewport.

The helper is created lazily on first access and cached. It is a
THREE.Group on layer 0, so it is visible to the perspective camera but
invisible to the viewport's own orthographic camera (layer 1 only).

Use helperVisible to attach/detach it to the drawing container
automatically, or manage it manually with drawing.three.add/remove.

#### Returns​

DrawingViewportHelper

### helperVisible​

get helperVisible(): boolean

Shows or hides the DrawingViewportHelper by attaching it to or
removing it from the drawing's container group.

Setting this to true before the viewport has been registered via
DrawingViewports.add() has no effect until registration occurs.

#### Returns​

boolean

### localXAxis​

get localXAxis(): Vector3

Local X axis direction (world +X).

#### Returns​

Vector3

### localYAxis​

get localYAxis(): Vector3

Local Y axis direction (world -Z).

#### Returns​

Vector3

### normal​

get normal(): Vector3

Drawing plane normal (world +Y).

#### Returns​

Vector3

### size​

get size(): Vector2

Viewport size in millimetres (based on local units × 1000).

#### Returns​

Vector2

## Methods​

### clipLine()​

clipLine(line): null | Line3

Clips a line segment to this viewport's bounding box.
Returns null when the line is entirely outside the viewport.

#### Parameters​


| Data Table |
| --- |
| ParameterTypelineLine3 |

#### Returns​

null | Line3

### dispose()​

dispose(): void

Destroys this viewport. The camera must be removed from its parent separately.

#### Returns​

void

### setContainer()​

Internal

setContainer(container): void

Called by DrawingViewports.add after the viewport is registered.
Stores a reference to the drawing container so that helperVisible
can attach the helper automatically.

#### Parameters​


| Data Table |
| --- |
| ParameterTypecontainerGroup<Object3DEventMap> |

#### Returns​

void


---

# MODULE: DrawingViewportHelper
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/DrawingViewportHelper

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- DrawingViewportHelper

# DrawingViewportHelper

Visualises the bounds of a DrawingViewport as a rectangle in the 3D scene.

## Extends​

- Group

## Constructors​

### new DrawingViewportHelper()​

new DrawingViewportHelper(viewport): DrawingViewportHelper

Works exactly like the built-in Three.js helpers (e.g. THREE.CameraHelper):
the result is a plain THREE.Group you can add wherever you like in the scene
graph.  It renders on layer 0, so it is visible to the perspective camera
but invisible to the viewport's own orthographic camera (which only renders
layer 1).

Typically you do not construct this directly — use
DrawingViewport.helperVisible = true instead, which attaches the helper to
the drawing container automatically.

When editable is true, two kinds of interaction are enabled:

- Resize — hover one of the eight handle spheres (corners + edge midpoints)
and drag to resize the viewport in that direction.
- Move — hover the border rectangle itself and drag to translate the
entire viewport while keeping its width and height constant.

In both cases the border and the hovered element turn orange as visual
feedback, and isDragging becomes true for the duration of the drag.

The class contains no browser API references and is safe in Node.js
environments; the consumer forwards events:

```typescript
container.addEventListener("mousemove", (e) => {  raycaster.setFromCamera(getNDC(e), camera);  viewport.helper.onPointerMove(raycaster.ray);});container.addEventListener("mousedown", (e) => {  raycaster.setFromCamera(getNDC(e), camera);  viewport.helper.onPointerDown(raycaster.ray);});container.addEventListener("mouseup", () => viewport.helper.onPointerUp());
```

#### Parameters​


| Data Table |
| --- |
| ParameterTypeviewportViewportBoundsController |

#### Returns​

DrawingViewportHelper

#### Overrides​

THREE.Group.constructor

## Accessors​

### isDragging​

get isDragging(): boolean

true while either a resize or a move drag is in progress.

#### Returns​

boolean

### movable​

get movable(): boolean

When true, hovering and dragging the border rectangle translates the
entire viewport while keeping its width and height constant.

#### Returns​

boolean

### resizable​

get resizable(): boolean

When true, the eight handle spheres are shown and resize drag is enabled.

#### Returns​

boolean

## Methods​

### dispose()​

dispose(): void

Releases all Three.js geometry and material resources.

#### Returns​

void

### onPointerDown()​

onPointerDown(ray): void

Forward mousedown events here.

- If a handle is hovered, begins a resize drag.
- If the border is hovered (and no handle), begins a move drag.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionrayRayWorld-space ray at the moment of the press. |

#### Returns​

void

### onPointerMove()​

onPointerMove(ray): void

Forward mousemove events here.

- Resize drag active: updates the bound(s) controlled by the active handle.
- Move drag active: translates all four bounds by the cursor delta,
preserving the viewport's width and height.
- No drag: highlights handles on hover; highlights the border when the
cursor is over it and no handle is hovered.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionrayRayWorld-space ray, e.g. from THREE.Raycaster.setFromCamera. |

#### Returns​

void

### onPointerUp()​

onPointerUp(): void

Forward mouseup events here to end any active drag.

#### Returns​

void

### update()​

update(): void

Rebuilds the border geometry and repositions all handles to match the
current viewport bounds.  Called automatically by the viewport whenever
any bound changes; you rarely need to call this yourself.

#### Returns​

void


---

# MODULE: DrawingViewports
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/DrawingViewports

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- DrawingViewports

# DrawingViewports

Manages the viewports of a TechnicalDrawing.

## Extends​

- DataMap<string, DrawingViewport>

## Constructors​

### new DrawingViewports()​

new DrawingViewports(container): DrawingViewports

Accessible via drawing.viewports. Extends DataMap so consumers get
reactive events (onItemSet, onBeforeDelete, …) for free.

```typescript
const vp = drawing.viewports.create({ left: -1, right: 5, top: 1, bottom: -4 });drawing.viewports.delete(vp.uuid); // disposes and removes
```

#### Parameters​


| Data Table |
| --- |
| ParameterTypecontainerGroup<Object3DEventMap> |

#### Returns​

DrawingViewports

#### Overrides​

FRAGS.DataMap<string, DrawingViewport>.constructor

## Methods​

### create()​

create(config): DrawingViewport

Creates a new DrawingViewport, adds its camera to the drawing
container, and registers it.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionconfigDrawingViewportConfigBounds and scale for the new viewport. |

#### Returns​

DrawingViewport

The newly created viewport.


---

# MODULE: DxfExporter
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/DxfExporter

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- DxfExporter

# DxfExporter

Serializes TechnicalDrawing content to DXF format (AC1015 / AutoCAD R2000).

## Constructors​

### new DxfExporter()​

new DxfExporter(_components): DxfExporter

Used through DxfManager:

```typescript
const dxf = components.get(OBC.DxfManager).exporter.export([  { drawing, viewports: [{ viewport, x: 10, y: 10 }] },], { widthMm: 420, heightMm: 297, margin: 10 });
```

#### Parameters​


| Data Table |
| --- |
| ParameterType_componentsComponents |

#### Returns​

DxfExporter

## Properties​

### config​

config: object

Export configuration options.

- trueColor — when true, upgrades the output to AC1018 (AutoCAD 2004+) and
emits group code 420 (RGB true color) alongside group code 62 (ACI) on every
entity. Modern viewers prioritize 420; older apps fall back to 62.
Note: the adaptive black/white behavior of ACI 7 is lost when true color is on,
since viewers treat the explicit RGB as fixed. Defaults to false.

#### trueColor​

trueColor: boolean = false

### precision​

precision: number = 2

Decimal places used when formatting measurement text in DXF.

## Methods​

### export()​

export(entries, paper?): string

Serializes one or more drawings to a DXF string.

When paper is supplied the output uses millimetres (INSUNITS=4) and
each viewport is placed at its (x, y) position on the sheet.
Without paper the output uses world units (INSUNITS=6).

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionentriesDxfDrawingEntry[]Drawings with their viewport placements.paper?DxfPaperOptionsOptional paper sheet dimensions for paper-space export. |

#### Returns​

string

### registerSystemExporter()​

registerSystemExporter<T>(SystemClass, handler): void

Registers a custom DXF exporter for a DrawingSystem subclass.

#### Type parameters​


| Data Table |
| --- |
| Type parameterT extends AnnotationSystem<any> |

#### Parameters​


| Data Table |
| --- |
| ParameterTypeSystemClassObjecthandler(sys, ctx) => void |

#### Returns​

void


---

# MODULE: DxfManager
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/DxfManager

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- DxfManager

# DxfManager

Manages DXF import and export for technical drawings.

## Extends​

- Component

## Constructors​

### new DxfManager()​

new DxfManager(components): DxfManager

```typescript
const manager = components.get(OBC.DxfManager);const dxf = manager.exporter.export([{ drawing, viewports: [{ viewport }] }]);
```

#### Parameters​


| Data Table |
| --- |
| ParameterTypecomponentsComponents |

#### Returns​

DxfManager

#### Overrides​

Component.constructor

## Properties​

### exporter​

readonly exporter: DxfExporter

Handles DXF serialisation of TechnicalDrawing content.

## Methods​

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable


---

# MODULE: EdgeProjector
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/EdgeProjector

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- EdgeProjector

# EdgeProjector

Component that generates 2D edge projections from fragment model items.

## Extends​

- Component

## Implements​

- Disposable

## Properties​

### cullerPixelsPerMeter​

cullerPixelsPerMeter: number = 0.05

Resolution of the visibility culler in pixels per meter.
Higher values = more accurate occlusion but slower culling.

### farPlane​

farPlane: number = Infinity

Far clipping plane along the projection direction.
Meshes whose AABB is fully "beyond" this plane (farther from the viewer) are excluded.
Set to Infinity to disable.

### generator​

readonly generator: any

The underlying ProjectionGenerator from three-edge-projection.
You can configure angleThreshold, iterationTime, includeIntersectionEdges, and useWebGPU.

### nearPlane​

nearPlane: number = -Infinity

Near clipping plane along the projection direction.
Meshes whose AABB is fully "behind" this plane (closer to the viewer) are excluded.
Set to -Infinity to disable.

### projectionDirection​

readonly projectionDirection: Vector3

The direction the projector looks along. Meshes are projected onto the plane
perpendicular to this direction. Default is top-down (plan view).

Common values:

- Top/Plan: (0, -1, 0)
- Front: (0, 0, -1)
- Back: (0, 0, 1)
- Left: (-1, 0, 0)
- Right: (1, 0, 0)

## Methods​

### get()​

get(modelIdMap, world, config?): Promise <EdgeProjectionResult>

Generates 2D edge projections for the given model items.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodelIdMapModelIdMapA map of model IDs to sets of local IDs specifying items to project.worldWorldThe world whose renderer will be used for visibility culling.config?objectOptional configuration.config.onProgress?(message, progress?) => voidOptional progress callback receiving (message, progress?, collector?). |

#### Returns​

Promise <EdgeProjectionResult>

Visible/hidden geometries with a group vertex attribute, and a groups mapping.

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable


---

# MODULE: Event\<T\>
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Event

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Event\<T\>

# Event<T>

Simple event handler by Jason Kleban. Keep in mind that if you want to remove it later, you might want to declare the callback as an object. If you want to maintain the reference to this, you will need to declare the callback as an arrow function.

## Type parameters​


| Data Table |
| --- |
| Type parameterT |

## Properties​

### enabled​

enabled: boolean = true

Whether this event is active or not. If not, it won't trigger.

## Methods​

### add()​

add(handler): void

Add a callback to this event instance.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionhandlerT extends void ? () => void : (data) => voidthe callback to be added to this event. |

#### Returns​

void

### remove()​

remove(handler): void

Removes a callback from this event instance.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionhandlerT extends void ? () => void : (data) => voidthe callback to be removed from this event. |

#### Returns​

void

### reset()​

reset(): void

Gets rid of all the suscribed events.

#### Returns​

void

### trigger()​

trigger(data?): void

Triggers all the callbacks assigned to this event.

#### Parameters​


| Data Table |
| --- |
| ParameterTypedata?T |

#### Returns​

void


---

# MODULE: EventManager
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/EventManager

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- EventManager

# EventManager

Simple class to easily toggle and reset event lists.

## Properties​

### list​

list: Set <Event<any> | AsyncEvent<any>>

The list of events managed by this instance.

## Methods​

### add()​

add(events): void

Adds events to this manager.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptioneventsIterable <Event<any> | AsyncEvent<any>>the events to add. |

#### Returns​

void

### remove()​

remove(events): void

Removes events from this manager.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptioneventsIterable <Event<any> | AsyncEvent<any>>the events to remove. |

#### Returns​

void

### reset()​

reset(): void

Resets all the events managed by this instance.

#### Returns​

void

### set()​

set(active): void

Sets all the events managed by this instance as enabled or disabled.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionactivebooleanwhether to turn on or off the events. |

#### Returns​

void


---

# MODULE: FastModelPicker
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/FastModelPicker

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- FastModelPicker

# FastModelPicker

A fast model picker that uses color coding to identify fragment models under the mouse cursor. This is much faster than raycasting for simple model identification.

## Implements​

- Disposable

## Properties​

### components​

components: Components

The components instance to which this FastModelPicker belongs.

### debugMode​

debugMode: boolean = false

Whether debug mode is enabled. When enabled, shows the color-coded canvas.

### enabled​

enabled: boolean = true

Component.enabled

### mouse​

readonly mouse: Mouse

The position of the mouse in the screen.

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### world​

world: World

A reference to the world instance to which this FastModelPicker belongs.
This is used to access the camera and scene.

## Methods​

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### getModelAt()​

getModelAt(position?): Promise<null | string>

Gets the model ID at the given screen position.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionposition?Vector2Optional screen position. If not provided, uses current mouse position. |

#### Returns​

Promise<null | string>

The model ID at the position, or null if no model is found.

### setDebugMode()​

setDebugMode(enabled): void

Enables or disables debug mode.
When enabled, shows a canvas with the color-coded render.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeenabledboolean |

#### Returns​

void


---

# MODULE: FastModelPickers
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/FastModelPickers

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- FastModelPickers

# FastModelPickers

A component that manages a FastModelPicker for each world and automatically disposes it when its corresponding world is disposed.

## Extends​

- Component

## Implements​

- Disposable

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### list​

list: Map<string, FastModelPicker>

A Map that stores FastModelPicker instances for each world.
The key is the world's UUID, and the value is the corresponding FastModelPicker instance.

### onDisposed​

onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### uuid​

static readonly uuid: "4a82430c-7ff2-49ea-9401-60807502dad6"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### delete()​

delete(world): void

Deletes the FastModelPicker instance associated with the given world.
If a FastModelPicker instance exists for the given world, it will be disposed and removed from the list.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionworldWorldThe world for which to delete the FastModelPicker instance. |

#### Returns​

void

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### get()​

get(world): FastModelPicker

Retrieves a FastModelPicker instance for the given world.
If a FastModelPicker instance already exists for the world, it will be returned.
Otherwise, a new FastModelPicker instance will be created and added to the list.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionworldWorldThe world for which to retrieve or create a FastModelPicker instance. |

#### Returns​

FastModelPicker

The FastModelPicker instance for the given world.

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable


---

# MODULE: FinderQuery
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/FinderQuery

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- FinderQuery

# FinderQuery

Represents a finder query for retrieving items based on specified parameters. This class encapsulates the query logic, caching mechanism, and result management.

## Properties​

### cache​

cache: boolean = true

Determines whether the query results should be cached.

### result​

readonly result: null | ModelIdMap = null

The result of the query, a map of modelIds to localIds.
Null if the query has not been executed or has not been cached.

## Accessors​

### aggregation​

set aggregation(value): void

Sets the aggregation value (AND/OR) for the query and resets the cache if the new value differs.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevalueQueryResultAggregation |

### queries​

set queries(value): void

The query parameters used to find items.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevalueItemsQueryParams[] |

## Methods​

### clearCache()​

clearCache(): void

Clears the cached result of the query, forcing a re-evaluation on the next access.

#### Returns​

void

### fromJSON()​

fromJSON(data): FinderQuery

Deserializes a JSON object into a FinderQuery instance.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondataSerializedFinderQueryA SerializedFinderQuery object representing the serialized query. |

#### Returns​

FinderQuery

A FinderQuery instance.

### test()​

test(config?): Promise <ModelIdMap>

Executes the finder query to retrieve items based on the configured query and optional model IDs.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionconfig?QueryTestConfigOptional configuration object. |

#### Returns​

Promise <ModelIdMap>

A promise that resolves to a ModelIdMap containing the search results.

### toJSON()​

toJSON(): SerializedFinderQuery

Serializes the finder query into a JSON-compatible format.
Converts regular expressions to strings.

#### Returns​

SerializedFinderQuery

A SerializedFinderQuery object representing the serialized query.


---

# MODULE: FirstPersonMode
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/FirstPersonMode

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- FirstPersonMode

# FirstPersonMode

A NavigationMode that allows first person navigation, simulating FPS video games.

## Implements​

- NavigationMode

## Properties​

### enabled​

enabled: boolean = false

NavigationMode.enabled

#### Implementation of​

NavigationMode . enabled

### id​

readonly id: "FirstPerson" = "FirstPerson"

NavigationMode.id

#### Implementation of​

NavigationMode . id

## Methods​

### set()​

set(active): void

NavigationMode.set

#### Parameters​


| Data Table |
| --- |
| ParameterTypeactiveboolean |

#### Returns​

void

#### Implementation of​

NavigationMode . set


---

# MODULE: FragmentsManager
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/FragmentsManager

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- FragmentsManager

# FragmentsManager

Component to load, delete and manage fragments efficiently. 📕 Tutorial. 📘 API. Before calling FragmentsManager.init, you need a URL for the fragments worker. The recommended way to get it is FragmentsManager.getWorker, which fetches the version-matched worker from unpkg.

## Extends​

- Component

## Implements​

- Disposable

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### onDisposed​

readonly onDisposed: Event<undefined>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### onFragmentsLoaded​

readonly onFragmentsLoaded: Event<any>

Event triggered when fragments are loaded.

### uuid​

static readonly uuid: "fef46874-46a3-461b-8c44-2922ab77c806"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Accessors​

### list​

get list(): DataMap<string, FragmentsModel>

Map containing all loaded fragment models.
The key is the group's unique identifier, and the value is the model itself.

#### Returns​

DataMap<string, FragmentsModel>

## Methods​

### applyBaseCoordinateSystem()​

applyBaseCoordinateSystem(object, originalCoordinateSystem?): Matrix4

Applies the base coordinate system to the provided object.

This function takes an object and its original coordinate system as input.
It then inverts the original coordinate system and applies the base coordinate system
to the object. This ensures that the object's position, rotation, and scale are
transformed to match the base coordinate system (which is taken from the first model loaded).

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionobjectVector3 | Object3D<Object3DEventMap>The object to which the base coordinate system will be applied.This should be an instance of THREE.Object3D.originalCoordinateSystem?Matrix4The original coordinate system of the object.This should be a THREE.Matrix4 representing the object's transformation matrix. |

#### Returns​

Matrix4

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### getData()​

getData(items, config?): Promise<Record<string, ItemData[]>>

Retrieves data for specified items from multiple models.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionitemsModelIdMapA map of model IDs to an array of local IDs, specifying which items to retrieve data for.config?Partial<ItemsDataConfig>Optional configuration for data retrieval. |

#### Returns​

Promise<Record<string, ItemData[]>>

A record mapping model IDs to an array of item data.

### guidsToModelIdMap()​

guidsToModelIdMap(guids): Promise <ModelIdMap>

Converts a collection of IFC GUIDs to a fragmentIdMap.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionguidsIterable<string>An iterable collection of global IDs to be converted to a fragment ID map. |

#### Returns​

Promise <ModelIdMap>

A fragment ID map, where the keys are fragment IDs and the values are the corresponding express IDs.

### init()​

init(workerURL, options?): void

Initializes the fragments core with the given worker URL.
The recommended way to obtain the URL is FragmentsManager.getWorker:

```typescript
fragments.init(await OBC.FragmentsManager.getWorker());
```

#### Parameters​


| Data Table |
| --- |
| ParameterTypeworkerURLstringoptions?objectoptions.classicWorker?boolean |

#### Returns​

void

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable

### modelIdMapToGuids()​

modelIdMapToGuids(modelIdMap): Promise<string[]>

Converts a fragment ID map to a collection of GUIDs.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodelIdMapModelIdMapA ModelIdMap to be converted to a collection of GUIDs. |

#### Returns​

Promise<string[]>

An array of GUIDs.

### getWorker()​

static getWorker(): Promise<string>

Returns a blob URL for the fragments worker matching the installed
@thatopen/fragments version. Delegates to FRAGS.FragmentsModels.getWorker.
This is the recommended way to obtain the URL passed to FragmentsManager.init.

#### Returns​

Promise<string>

#### Example​

```typescript
const fragments = components.get(OBC.FragmentsManager);fragments.init(await OBC.FragmentsManager.getWorker());
```


---

# MODULE: Grids
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Grids

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Grids

# Grids

A component that manages grid instances. Each grid is associated with a unique world. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Implements​

- Disposable

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### list​

list: Map<string, SimpleGrid>

A map of world UUIDs to their corresponding grid instances.

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### uuid​

static readonly uuid: "d1e814d5-b81c-4452-87a2-f039375e0489"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### create()​

create(world): SimpleGrid

Creates a new grid for the given world.
Throws an error if a grid already exists for the world.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionworldWorldThe world to create the grid for. |

#### Returns​

SimpleGrid

The newly created grid.

#### Throws​

Will throw an error if a grid already exists for the given world.

### delete()​

delete(world): void

Deletes the grid associated with the given world.
If a grid does not exist for the given world, this method does nothing.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionworldWorldThe world for which to delete the grid. |

#### Returns​

void

#### Remarks​

This method will dispose of the grid and remove it from the internal list.
If the world is disposed before calling this method, the grid will be automatically deleted.

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable


---

# MODULE: Hider
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Hider

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Hider

# Hider

A component that manages visibility of fragments within a 3D scene. It extends the base Component class and provides methods to control fragment visibility and isolation. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### uuid​

static readonly uuid: "dd9ccf2d-8a21-4821-b7f6-2949add16a29"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### getVisibilityMap()​

getVisibilityMap(state, modelIds?): Promise<Record<string, number[]>>

Asynchronously retrieves a map of model IDs to their corresponding item IDs based on visibility state.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionstatebooleanThe visibility state to filter items by.modelIds?string[]Optional array of model IDs to filter the items. If not provided, all models will be considered. |

#### Returns​

Promise<Record<string, number[]>>

A promise that resolves to a ModelIdMap record where the keys are model IDs and the values are arrays of item IDs that match the visibility state.

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable

### isolate()​

isolate(modelIdMap): Promise<void>

Isolates fragments within the 3D scene by hiding all other fragments and showing only the specified ones.
It calls the set method twice: first to hide all fragments, and then to show only the specified ones.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodelIdMapModelIdMapA map of model IDs and their corresponding itemIds to be isolated. |

#### Returns​

Promise<void>

### set()​

set(visible, modelIdMap?): Promise<void>

Sets the visibility of fragment items within the 3D scene.
If no modelIdMap parameter is provided, all fragments will be set to the specified visibility.
If it is provided, only the specified fragment items will be affected.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionvisiblebooleanThe visibility state to set for the items.modelIdMap?ModelIdMapAn optional map of modelIds and their corresponding itemIds to be affected.If not provided, all fragment items will be affected. |

#### Returns​

Promise<void>

### toggle()​

toggle(modelIdMap): Promise<void>

Toggles the visibility of specified items in the fragments.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodelIdMapModelIdMapAn object where the keys are model IDs and the values are arrays of local IDs representing the fragments to be toggled. |

#### Returns​

Promise<void>

A promise that resolves when all visibility toggles and the core update are complete.


---

# MODULE: IDSSpecification
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/IDSSpecification

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- IDSSpecification

# IDSSpecification

Represents a single specification from the Information Delivery Specification (IDS) standard.

## Remarks​

This class provides methods for testing a model against the specification,
as well as serializing the specification into XML format.

## Implements​

- IDSSpecificationData

## Methods​

### serialize()​

serialize(): string

Serializes the IDSSpecification instance into XML format.

#### Returns​

string

The XML representation of the IDSSpecification.

#### Remarks​

This method is not meant to be used directly. It is used by the IDSSpecifications component.

### test()​

test(modelIds, config): Promise <IDSCheckResult>

Tests the model to test against the specification's requirements.

#### Parameters​


| Data Table |
| --- |
| ParameterTypemodelIdsRegExp[]configobjectconfig.skipIfFailsboolean |

#### Returns​

Promise <IDSCheckResult>

An array representing the test results.
If no requirements are defined for the specification, an empty array is returned.


---

# MODULE: IDSSpecifications
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/IDSSpecifications

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- IDSSpecifications

# IDSSpecifications

Component that manages Information Delivery Specification (IDS) data. It provides functionality for importing, exporting, and manipulating IDS data. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Methods​

### create()​

create(name, ifcVersion, identifier?): IDSSpecification

Creates a new IDSSpecification instance and adds it to the list.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionnamestringThe name of the IDSSpecification.ifcVersionIfcVersion[]An array of IfcVersion values that the specification supports.identifier?string- |

#### Returns​

IDSSpecification

The newly created IDSSpecification instance.

### export()​

export(info, specifications): string

Exports the IDSSpecifications data into an XML string.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptioninfoIDSInfoThe metadata information for the exported XML.specificationsIterable <IDSSpecification>An optional iterable of IDSSpecification instances to export.If not provided, all specifications in the list will be exported. |

#### Returns​

string

A string containing the exported IDSSpecifications data in XML format.

### getModelIdMap()​

getModelIdMap(result): object

Processes the results of an IDS check and categorizes the items into passing and failing.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionresultIDSCheckResultAn IDSCheckResult object containing the check results for various model IDs. |

#### Returns​

object

An object containing two ModelIdMap objects:

- pass: A ModelIdMap representing items that passed the check.
- fail: A ModelIdMap representing items that failed the check.

fail: ModelIdMap

pass: ModelIdMap

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable

### load()​

load(data): IDSSpecification[]

Parses and processes an XML string containing Information Delivery Specification (IDS) data.
It creates IDSSpecification instances based on the parsed data and returns them in an array.
Also, the instances are added to the list array.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondatastringThe XML string to parse. |

#### Returns​

IDSSpecification[]

An array of IDSSpecification instances created from the parsed data.


---

# MODULE: IfcFragmentSettings
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/IfcFragmentSettings

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- IfcFragmentSettings

# IfcFragmentSettings

Configuration of the IFC-fragment conversion.

## Properties​

### autoSetWasm​

autoSetWasm: boolean = true

Whether to automatically set the path to the WASM file for web-ifc.
If set to true, the path will be set to the default path of the WASM file.
If set to false, the path must be provided manually in the wasm.path property.
Default value is true.

### customLocateFileHandler​

customLocateFileHandler: null | LocateFileHandlerFn = null

Custom function to handle the file location for web-ifc.
This function will be called when web-ifc needs to locate a file.
If set to null, the default file location handler will be used.

#### Param​

The URL of the file to locate.

### wasm​

wasm: object

Path of the WASM for web-ifc.

#### absolute​

absolute: boolean

#### logLevel?​

optional logLevel: LogLevel

#### path​

path: string

### webIfc​

webIfc: LoaderSettings

Loader settings for web-ifc.


---

# MODULE: IfcLoader
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/IfcLoader

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- IfcLoader

# IfcLoader

The IfcLoader component is responsible of converting IFC files into Fragments. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Implements​

- Disposable

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### onDisposed​

readonly onDisposed: Event<string>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### onIfcImporterInitialized​

readonly onIfcImporterInitialized: Event<IfcImporter>

An event triggered when the IFC importer is initialized.

### onIfcStartedLoading​

readonly onIfcStartedLoading: Event<void>

An event triggered when the IFC file starts loading.

### onSetup​

readonly onSetup: Event<void>

An event triggered when the setup process is completed.

### settings​

settings: IfcFragmentSettings

The settings for the IfcLoader.
It includes options for excluding categories, setting WASM paths, and more.

### webIfc​

webIfc: IfcAPI

The instance of the Web-IFC library used for handling IFC data.

### uuid​

static readonly uuid: "a659add7-1418-4771-a0d6-7d4d438e4624"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### cleanUp()​

cleanUp(): void

Cleans up the IfcLoader component by resetting the Web-IFC library,
clearing the visited fragments and fragment instances maps, and creating a new instance of the Web-IFC library.

#### Returns​

void

#### Remarks​

This method is called automatically after using the .load() method, so usually you don't need to use it manually.

#### Example​

```typescript
const ifcLoader = components.get(IfcLoader);ifcLoader.cleanUp();
```

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable

### load()​

load(data, coordinate, name, config?): Promise<FragmentsModel>

Loads an IFC file and processes it for 3D visualization.

By default, the loader imports a minimal set of attributes and relations
needed for typical visualization workflows.

Default attributes

- Base entities: Project, Site, Building, BuildingStorey
- Materials: IFC material definitions and layers
- Properties: Property Sets, quantities (area, volume, length, etc.)

Default relations

- DefinesByProperties (IsDefinedBy / DefinesOccurrence)
- AssociatesMaterial (HasAssociations / AssociatedTo)
- Aggregates (IsDecomposedBy / Decomposes)
- ContainedInSpatialStructure (ContainsElements / ContainedInStructure)

If you need all attributes or relations to be loaded, you can enable them
via the instanceCallback.

The callback provides direct access to the underlying IfcImporter,
allowing advanced configuration before processing begins.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondataUint8ArrayThe Uint8Array containing the IFC file data.coordinatebooleanBoolean indicating whether to coordinate the loaded IFC data. Default is true.namestringName for the fragments model.config?objectOptional extra data for loading the IFC.config.instanceCallback?(importer) => void-config.processData?Omit<ProcessData, "bytes">-config.userData?Record<string, any>- |

#### Returns​

Promise<FragmentsModel>

A Promise that resolves to the FragmentsModel containing the loaded and processed IFC data.

#### Examples​

// Load all attributes and relations using the instanceCallback

```typescript
const model = await ifcLoader.load(ifcData, true, "modelName", {  instanceCallback: (importer) => {    importer.addAllAttributes();    importer.addAllRelations();  },});
```

// Default loading (built-in attributes and relations only)

```typescript
const ifcLoader = components.get(IfcLoader);const model = await ifcLoader.load(ifcData);
```

### readIfcFile()​

readIfcFile(data): Promise<number>

Reads an IFC file and initializes the Web-IFC library.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondataUint8ArrayThe Uint8Array containing the IFC file data. |

#### Returns​

Promise<number>

A Promise that resolves when the IFC file is opened and initialized.

#### Remarks​

This method sets the WASM path and initializes the Web-IFC library based on the provided settings.
It also opens the IFC model using the provided data and settings.

#### Example​

```typescript
const ifcLoader = components.get(IfcLoader);await ifcLoader.readIfcFile(ifcData);
```

### setup()​

setup(config?): Promise<void>

Sets up the IfcLoader component with the provided configuration.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionconfig?Partial <IfcFragmentSettings>Optional configuration settings for the IfcLoader.If not provided, the existing settings will be used. |

#### Returns​

Promise<void>

A Promise that resolves when the setup process is completed.

#### Remarks​

If the autoSetWasm option is enabled in the configuration,
the method will automatically set the WASM paths for the Web-IFC library.

#### Example​

```typescript
const ifcLoader = new IfcLoader(components);await ifcLoader.setup({ autoSetWasm: true });
```


---

# MODULE: ItemsFinder
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/ItemsFinder

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- ItemsFinder

# ItemsFinder

Manages and executes queries to find items within models based on specified criteria. This class provides functionalities to create, store, and execute FinderQuery instances, allowing for efficient retrieval of items that match given query parameters. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Implements​

- Serializable <SerializedFinderQuery>

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### list​

readonly list: DataMap<string, FinderQuery>

A map of FinderQuery objects, indexed by a string key.

### uuid​

static readonly uuid: "0da7ad77-f734-42ca-942f-a074adfd1e3a"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### addFromCategories()​

addFromCategories(modelIds?): Promise<string[]>

Adds queries based on categories from items that have geometry.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodelIds?RegExp[]An optional array of model IDs to filter fragments. If not provided, all fragments are processed. |

#### Returns​

Promise<string[]>

An array with the categories used to create the queries

### create()​

create(name, queries): FinderQuery

Creates a new FinderQuery instance and adds it to the list of queries.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionnamestringThe name of the query.queriesItemsQueryParams[]The queries to use. |

#### Returns​

FinderQuery

The newly created FinderQuery instance.

### export()​

export(): object

Serializes the ItemsFinder's data into a format suitable for export.

#### Returns​

object

An object containing an array of serialized finder queries.

data: SerializedFinderQuery[]

#### Implementation of​

Serializable.export

### getItems()​

getItems(queries, config?): Promise <ModelIdMap>

Retrieves items from specified models based on a query.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionqueriesItemsQueryParams[]The query parameters to filter items.config?object-config.aggregation?QueryResultAggregation-config.items?ModelIdMap-config.modelIds?RegExp[]- |

#### Returns​

Promise <ModelIdMap>

A map of model IDs to sets of item IDs that match the query.

### import()​

import(result): FinderQuery[]

Imports a list of FinderQuery instances from a SerializationResult containing serialized finder query data.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionresultSerializationResult <SerializedFinderQuery, Record<string, any>>The SerializationResult containing the serialized SerializedFinderQuery data. |

#### Returns​

FinderQuery[]

An array of FinderQuery instances created from the serialized data. Returns an empty array if the input data is null or undefined.

#### Implementation of​

Serializable.import

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable


---

# MODULE: LeaderAnnotations
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/LeaderAnnotations

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- LeaderAnnotations

# LeaderAnnotations

Global drawing system that manages leader (arrow + text) annotations across all TechnicalDrawing instances.

## Extends​

- AnnotationSystem<LeaderAnnotationSystem>

## Implements​

- Transitionable<LeaderAnnotationState, LeaderAnnotationEvent>
- Disposable


---

# MODULE: LinearAnnotations
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/LinearAnnotations

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- LinearAnnotations

# LinearAnnotations

Global drawing system that manages linear dimension annotations across all TechnicalDrawing instances.

## Extends​

- AnnotationSystem<LinearAnnotationSystem>

## Implements​

- Transitionable<LinearAnnotationState, LinearAnnotationEvent>
- Disposable


---

# MODULE: MeasurementUtils
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/MeasurementUtils

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- MeasurementUtils

# MeasurementUtils

Utility component for performing measurements on 3D meshes by providing methods for measuring distances between edges and faces. 📘 API.

## Extends​

- Component

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### uuid​

static uuid: string = "267ca032-672f-4cb0-afa9-d24e904f39d6"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### getItemsVolume()​

getItemsVolume(modelIdMap): Promise<number>

Calculates the total volume of items for a given map of model IDs to local IDs.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodelIdMapModelIdMapA map where the key is the model ID and the value is an array of local IDs. |

#### Returns​

Promise<number>

A promise that resolves to the total volume of the specified items.

### getVolumeFromFragments()​

getVolumeFromFragments(modelIdMap): Promise<number>

#### Parameters​


| Data Table |
| --- |
| ParameterTypemodelIdMapModelIdMap |

#### Returns​

Promise<number>

#### Deprecated​

Use getItemsVolume instead.

Calculates the volume of a set of items.

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable

### round()​

round(vector): void

Method to round the vector's components to a specified number of decimal places.
This is used to ensure numerical precision in edge detection.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionvectorVector3The vector to round. |

#### Returns​

void

The vector with rounded components.

### convertUnits()​

static convertUnits(value, fromUnit, toUnit, precision): number

Converts a value from one unit to another for length, area, or volume without using external libraries.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valueDescriptionvaluenumberundefinedThe value to convert.fromUnitstringundefinedThe unit of the input value (e.g., "m", "cm", "mm" for lengths; "m2", "cm2" for areas; "m3", "cm3" for volumes).toUnitstringundefinedThe unit to convert to (e.g., "cm", "mm", "m" for lengths; "cm2", "m2" for areas; "cm3", "m3" for volumes).precisionnumber2The number of decimal places to round the result to, as number between 0 and 5. (default is 2). |

#### Returns​

number

The converted value rounded to the specified precision.

#### Throws​

If the rounding value is not a valid integer or is out of range (0-5).

### distanceFromPointToLine()​

static distanceFromPointToLine(point, lineStart, lineEnd, clamp): number

Utility method to calculate the distance from a point to a line segment.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valueDescriptionpointVector3undefinedThe point from which to calculate the distance.lineStartVector3undefinedThe start point of the line segment.lineEndVector3undefinedThe end point of the line segment.clampbooleanfalseIf true, the distance will be clamped to the line segment's length. |

#### Returns​

number

The distance from the point to the line segment.


---

# MODULE: ModelIdMapUtils
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/ModelIdMapUtils

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- ModelIdMapUtils

# ModelIdMapUtils

Utility class for manipulating and managing ModelIdMap objects. A ModelIdMap is a mapping of model identifiers (strings) to sets of local IDs (numbers). This class provides methods for joining, intersecting, cloning, adding, removing, and comparing ModelIdMap objects, as well as converting between ModelIdMap and plain JavaScript objects.

## Methods​

### add()​

static add(target, source, clone): void

Adds all entries from one ModelIdMap to another.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valueDescriptiontargetModelIdMapundefinedThe ModelIdMap to add to.sourceModelIdMapundefinedThe ModelIdMap to add from.clonebooleanfalse- |

#### Returns​

void

### clone()​

static clone(source): ModelIdMap

Creates a deep clone of a ModelIdMap.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionsourceModelIdMapThe ModelIdMap to clone. |

#### Returns​

ModelIdMap

A new ModelIdMap with the same model identifiers and localIds as the original.

### fromRaw()​

static fromRaw(raw): ModelIdMap

Creates a ModelIdMap from a plain JavaScript object with array values.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionrawobjectA plain JavaScript object where each key (model ID) maps to an array of local IDs. |

#### Returns​

ModelIdMap

A ModelIdMap.

### intersect()​

static intersect(maps): ModelIdMap

Creates a new ModelIdMap from the intersection of multiple ModelIdMaps.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmapsModelIdMap[]An array of ModelIdMaps. |

#### Returns​

ModelIdMap

A new ModelIdMap containing only model identifiers and localIds present in all input maps.

### isEmpty()​

static isEmpty(map): boolean

Checks if a ModelIdMap is empty.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmapModelIdMapThe ModelIdMap to check. |

#### Returns​

boolean

True if the ModelIdMap is empty, false otherwise.

### isEqual()​

static isEqual(a, b): boolean

Checks if two ModelIdMaps are equal.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionaModelIdMapThe first ModelIdMap.bModelIdMapThe second ModelIdMap. |

#### Returns​

boolean

True if the ModelIdMaps are equal, false otherwise.

### join()​

static join(maps): ModelIdMap

Creates a new ModelIdMap from the union of multiple ModelIdMaps.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmapsModelIdMap[]An array of ModelIdMaps to join. |

#### Returns​

ModelIdMap

A new ModelIdMap containing all model identifiers and localIds from all input maps.

### remove()​

static remove(target, source, clone): void

Remove all entries from one ModelIdMap to another.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valueDescriptiontargetModelIdMapundefinedThe ModelIdMap to subtract from.sourceModelIdMapundefinedThe ModelIdMap to subtract.clonebooleanfalse- |

#### Returns​

void

### toRaw()​

static toRaw(map): object

Converts a ModelIdMap into a plain JavaScript object with array values.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmapModelIdMapThe ModelIdMap to convert. |

#### Returns​

object

A plain JavaScript object where each key (model ID) maps to an array of local IDs.


---

# MODULE: Mouse
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Mouse

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Mouse

# Mouse

A helper to easily get the real position of the mouse in the Three.js canvas to work with tools like the raycaster, even if it has been transformed through CSS or doesn't occupy the whole screen.

## Implements​

- Disposable

## Properties​

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

## Accessors​

### position​

get position(): Vector2

The real position of the mouse or touch of the Three.js canvas.

#### Returns​

Vector2

### rawPosition​

get rawPosition(): Vector2

The raw position of the mouse or touch of the Three.js canvas.

#### Returns​

Vector2

## Methods​

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose


---

# MODULE: OrbitMode
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/OrbitMode

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- OrbitMode

# OrbitMode

A NavigationMode that allows 3D navigation and panning like in many 3D and CAD softwares.

## Implements​

- NavigationMode

## Properties​

### enabled​

enabled: boolean = true

NavigationMode.enabled

#### Implementation of​

NavigationMode . enabled

### id​

readonly id: "Orbit" = "Orbit"

NavigationMode.id

#### Implementation of​

NavigationMode . id

## Methods​

### set()​

set(active): void

NavigationMode.set

#### Parameters​


| Data Table |
| --- |
| ParameterTypeactiveboolean |

#### Returns​

void

#### Implementation of​

NavigationMode . set


---

# MODULE: OrthoPerspectiveCamera
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/OrthoPerspectiveCamera

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- OrthoPerspectiveCamera

# OrthoPerspectiveCamera

A flexible camera that uses yomotsu's cameracontrols to control the camera in 2D and 3D. It supports multiple navigation modes, such as 2D floor plan navigation, first person and 3D orbit. This class extends the SimpleCamera class and adds additional functionality for managing different camera projections and navigation modes. 📕 Tutorial. 📘 API.

## Extends​

- SimpleCamera

## Properties​

### onAfterUpdate​

readonly onAfterUpdate: Event <SimpleCamera>

Updateable.onAfterUpdate

#### Inherited from​

SimpleCamera . onAfterUpdate

### onAspectUpdated​

readonly onAspectUpdated: Event<unknown>

Event that is triggered when the aspect of the camera has been updated.
This event is useful when you need to perform actions after the aspect of the camera has been changed.

#### Inherited from​

SimpleCamera . onAspectUpdated

### onBeforeUpdate​

readonly onBeforeUpdate: Event <SimpleCamera>

Updateable.onBeforeUpdate

#### Inherited from​

SimpleCamera . onBeforeUpdate

### onDisposed​

readonly onDisposed: Event<string>

Disposable.onDisposed

#### Inherited from​

SimpleCamera . onDisposed

### onWorldChanged​

readonly onWorldChanged: Event<object>

Event that is triggered when a world is added or removed from the worlds map.
The event payload contains the world instance and the action ("added" or "removed").

#### Type declaration​

action: "added" | "removed"

world: World

#### Inherited from​

SimpleCamera . onWorldChanged

### projection​

readonly projection: ProjectionManager

A ProjectionManager instance that manages the projection modes of the camera.

### three​

three: PerspectiveCamera | OrthographicCamera

A three.js PerspectiveCamera or OrthographicCamera instance.
This camera is used for rendering the scene.

#### Inherited from​

SimpleCamera . three

### threeOrtho​

readonly threeOrtho: OrthographicCamera

A THREE.OrthographicCamera instance that represents the orthographic camera.
This camera is used when the projection mode is set to orthographic.

### threePersp​

readonly threePersp: PerspectiveCamera

A THREE.PerspectiveCamera instance that represents the perspective camera.
This camera is used when the projection mode is set to perspective.

## Accessors​

### controls​

get controls(): CameraControls

The object that controls the camera. An instance of
yomotsu's cameracontrols.
Transforming the camera directly will have no effect: you need to use this
object to move, rotate, look at objects, etc.

#### Returns​

CameraControls

### enabled​

get enabled(): boolean

Getter for the enabled state of the camera controls.
If the current world is null, it returns false.
Otherwise, it returns the enabled state of the camera controls.

set enabled(enabled): void

Setter for the enabled state of the camera controls.
If the current world is not null, it sets the enabled state of the camera controls to the provided value.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionenabledbooleanThe new enabled state of the camera controls. |

#### Returns​

boolean

The enabled state of the camera controls.

### mode​

get mode(): NavigationMode

Getter for the current navigation mode.
Throws an error if the mode is not found or the camera is not initialized.

#### Throws​

Throws an error if the mode is not found or the camera is not initialized.

#### Returns​

NavigationMode

The current navigation mode.

## Methods​

### addCustomNavigationMode()​

addCustomNavigationMode(mode): void

Adds a custom NavigationMode to the camera that can be used using the OrthoPerspectiveCamera.set method.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodeNavigationModeThe custom NavigationMode to add. |

#### Returns​

void

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Overrides​

SimpleCamera . dispose

### fit()​

fit(meshes, offset): Promise<void>

Make the camera view fit all the specified meshes.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valueDescriptionmeshesIterable<Mesh<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>>undefinedthe meshes to fit. If it is not defined, it willevaluate Components.meshes.offsetnumber1.5the distance to the fit object |

#### Returns​

Promise<void>

### hasCameraControls()​

hasCameraControls(): this is CameraControllable

Checks whether the instance is CameraControllable.

#### Returns​

this is CameraControllable

True if the instance is controllable, false otherwise.

#### Inherited from​

SimpleCamera . hasCameraControls

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

SimpleCamera . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

SimpleCamera . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

SimpleCamera . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

SimpleCamera . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

SimpleCamera . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

SimpleCamera . isUpdateable

### set()​

set(mode): void

Sets a new NavigationMode and disables the previous one.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodestringThe NavigationMode to set. |

#### Returns​

void

### setUserInput()​

setUserInput(active): void

Allows or prevents all user input.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionactivebooleanwhether to enable or disable user inputs. |

#### Returns​

void

### update()​

update(_delta): void

Updateable.update

#### Parameters​


| Data Table |
| --- |
| ParameterType_deltanumber |

#### Returns​

void

#### Inherited from​

SimpleCamera . update

### updateAspect()​

updateAspect(): void

Updates the aspect of the camera to match the size of the
Components.renderer.

#### Returns​

void

#### Inherited from​

SimpleCamera . updateAspect


---

# MODULE: PlanMode
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/PlanMode

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- PlanMode

# PlanMode

A NavigationMode that allows to navigate floorplans in 2D, like many BIM tools.

## Implements​

- NavigationMode

## Properties​

### enabled​

enabled: boolean = false

NavigationMode.enabled

#### Implementation of​

NavigationMode . enabled

### id​

readonly id: "Plan" = "Plan"

NavigationMode.id

#### Implementation of​

NavigationMode . id

## Methods​

### set()​

set(active): void

NavigationMode.set

#### Parameters​


| Data Table |
| --- |
| ParameterTypeactiveboolean |

#### Returns​

void

#### Implementation of​

NavigationMode . set


---

# MODULE: ProjectionManager
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/ProjectionManager

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- ProjectionManager

# ProjectionManager

Object to control the CameraProjection of the OrthoPerspectiveCamera.

## Properties​

### camera​

camera: PerspectiveCamera | OrthographicCamera

The camera controlled by this ProjectionManager.
It can be either a PerspectiveCamera or an OrthographicCamera.

### current​

current: CameraProjection = "Perspective"

Current projection mode of the camera.
Default is "Perspective".

### matchOrthoDistanceEnabled​

matchOrthoDistanceEnabled: boolean = false

Match Ortho zoom with Perspective distance when changing projection mode

### onChanged​

readonly onChanged: Event<PerspectiveCamera | OrthographicCamera>

Event that fires when the CameraProjection changes.

## Methods​

### set()​

set(projection): Promise<void>

Sets the CameraProjection of the OrthoPerspectiveCamera.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionprojectionCameraProjectionthe new projection to set. If it is the current projection,it will have no effect. |

#### Returns​

Promise<void>

### toggle()​

toggle(): Promise<void>

Changes the current CameraProjection from Ortographic to Perspective
and vice versa.

#### Returns​

Promise<void>


---

# MODULE: Raycasters
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Raycasters

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Raycasters

# Raycasters

A component that manages a raycaster for each world and automatically disposes it when its corresponding world is disposed. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Implements​

- Disposable

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### list​

list: Map<string, SimpleRaycaster>

A Map that stores raycasters for each world.
The key is the world's UUID, and the value is the corresponding SimpleRaycaster instance.

### onDisposed​

onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### uuid​

static readonly uuid: "d5d8bdf0-db25-4952-b951-b643af207ace"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### delete()​

delete(world): void

Deletes the SimpleRaycaster instance associated with the given world.
If a SimpleRaycaster instance exists for the given world, it will be disposed and removed from the list.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionworldWorldThe world for which to delete the SimpleRaycaster instance. |

#### Returns​

void

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### get()​

get(world): SimpleRaycaster

Retrieves a SimpleRaycaster instance for the given world.
If a SimpleRaycaster instance already exists for the world, it will be returned.
Otherwise, a new SimpleRaycaster instance will be created and added to the list.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionworldWorldThe world for which to retrieve or create a SimpleRaycaster instance. |

#### Returns​

SimpleRaycaster

The SimpleRaycaster instance for the given world.

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable


---

# MODULE: ShadowedScene
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/ShadowedScene

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- ShadowedScene

# ShadowedScene

A scene that supports efficient cast shadows. 📕 Tutorial. 📘 API.

## Extends​

- SimpleScene

## Implements​

- Disposable
- Configurable<SimpleSceneConfigManager, ShadowedSceneConfig>

## Properties​

### ambientLights​

ambientLights: Map<string, AmbientLight>

The set of ambient lights managed by this scene component.

#### Inherited from​

SimpleScene . ambientLights

### autoBias​

autoBias: boolean = true

Whether the bias property should be set automatically depending on the shadow distance.

### config​

config: SimpleSceneConfigManager

Configurable.config

#### Implementation of​

Configurable . config

#### Inherited from​

SimpleScene . config

### directionalLights​

directionalLights: Map<string, DirectionalLight>

The set of directional lights managed by this scene component.

#### Inherited from​

SimpleScene . directionalLights

### isSetup​

isSetup: boolean = false

Configurable.isSetup

#### Implementation of​

Configurable . isSetup

#### Inherited from​

SimpleScene . isSetup

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

#### Inherited from​

SimpleScene . onDisposed

### onSetup​

readonly onSetup: Event<unknown>

Configurable.onSetup

#### Implementation of​

Configurable . onSetup

#### Inherited from​

SimpleScene . onSetup

### onWorldChanged​

readonly onWorldChanged: Event<object>

Event that is triggered when a world is added or removed from the worlds map.
The event payload contains the world instance and the action ("added" or "removed").

#### Type declaration​

action: "added" | "removed"

world: World

#### Inherited from​

SimpleScene . onWorldChanged

### three​

three: Scene

The underlying Three.js scene object.
It is used to define the 3D space containing objects, lights, and cameras.

#### Inherited from​

SimpleScene . three

## Accessors​

### bias​

get bias(): number

The getter for the bias to prevent artifacts (stripes). It usually ranges between 0 and -0.005.

set bias(value): void

The setter for the bias to prevent artifacts (stripes). It usually ranges between 0 and -0.005.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevaluenumber |

#### Returns​

number

### currentWorld​

set currentWorld(value): void

The current world this item is associated with. It can be null if no world is currently active.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevaluenull | World |

### distanceRenderer​

get distanceRenderer(): DistanceRenderer

Getter to get the renderer used to determine the farthest distance from the camera.

#### Returns​

DistanceRenderer

### shadowsEnabled​

get shadowsEnabled(): boolean

Getter to see whether the shadows are enabled or not in this scene instance.

set shadowsEnabled(value): void

Setter to control whether the shadows are enabled or not in this scene instance.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevalueboolean |

#### Returns​

boolean

## Methods​

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

#### Overrides​

SimpleScene.dispose

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

SimpleScene . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

SimpleScene . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

SimpleScene . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

SimpleScene . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

SimpleScene . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

SimpleScene . isUpdateable

### setup()​

setup(config?): void

Configurable.setup

#### Parameters​


| Data Table |
| --- |
| ParameterTypeconfig?Partial <ShadowedSceneConfig> |

#### Returns​

void

#### Implementation of​

Configurable . setup

#### Overrides​

SimpleScene . setup

### updateShadows()​

updateShadows(): Promise<void>

Update all the shadows of the scene.

#### Returns​

Promise<void>


---

# MODULE: SimpleCamera
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/SimpleCamera

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- SimpleCamera

# SimpleCamera

A basic camera that uses yomotsu's cameracontrols to control the camera in 2D and 3D. Check out it's API to find out what features it offers.

## Extends​

- BaseCamera

## Extended by​

- OrthoPerspectiveCamera

## Implements​

- Updateable
- Disposable

## Properties​

### onAfterUpdate​

readonly onAfterUpdate: Event <SimpleCamera>

Updateable.onAfterUpdate

#### Implementation of​

Updateable . onAfterUpdate

### onAspectUpdated​

readonly onAspectUpdated: Event<unknown>

Event that is triggered when the aspect of the camera has been updated.
This event is useful when you need to perform actions after the aspect of the camera has been changed.

### onBeforeUpdate​

readonly onBeforeUpdate: Event <SimpleCamera>

Updateable.onBeforeUpdate

#### Implementation of​

Updateable . onBeforeUpdate

### onDisposed​

readonly onDisposed: Event<string>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### onWorldChanged​

readonly onWorldChanged: Event<object>

Event that is triggered when a world is added or removed from the worlds map.
The event payload contains the world instance and the action ("added" or "removed").

#### Type declaration​

action: "added" | "removed"

world: World

#### Inherited from​

BaseCamera . onWorldChanged

### three​

three: PerspectiveCamera | OrthographicCamera

A three.js PerspectiveCamera or OrthographicCamera instance.
This camera is used for rendering the scene.

#### Overrides​

BaseCamera . three

## Accessors​

### controls​

get controls(): CameraControls

The object that controls the camera. An instance of
yomotsu's cameracontrols.
Transforming the camera directly will have no effect: you need to use this
object to move, rotate, look at objects, etc.

#### Returns​

CameraControls

### enabled​

get enabled(): boolean

Getter for the enabled state of the camera controls.
If the current world is null, it returns false.
Otherwise, it returns the enabled state of the camera controls.

set enabled(enabled): void

Setter for the enabled state of the camera controls.
If the current world is not null, it sets the enabled state of the camera controls to the provided value.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionenabledbooleanThe new enabled state of the camera controls. |

#### Returns​

boolean

The enabled state of the camera controls.

## Methods​

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### hasCameraControls()​

hasCameraControls(): this is CameraControllable

Checks whether the instance is CameraControllable.

#### Returns​

this is CameraControllable

True if the instance is controllable, false otherwise.

#### Inherited from​

BaseCamera . hasCameraControls

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

BaseCamera . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

BaseCamera . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

BaseCamera . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

BaseCamera . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

BaseCamera . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

BaseCamera . isUpdateable

### update()​

update(_delta): void

Updateable.update

#### Parameters​


| Data Table |
| --- |
| ParameterType_deltanumber |

#### Returns​

void

#### Implementation of​

Updateable . update

### updateAspect()​

updateAspect(): void

Updates the aspect of the camera to match the size of the
Components.renderer.

#### Returns​

void


---

# MODULE: SimpleGrid
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/SimpleGrid

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- SimpleGrid

# SimpleGrid

An infinite grid. Created by fyrestar and translated to typescript by dkaraush.

## Implements​

- Hideable
- Disposable
- Configurable<SimpleGridConfigManager, SimpleGridConfig>

## Properties​

### components​

components: Components

The components instance to which this grid belongs.

### config​

config: SimpleGridConfigManager

Configurable.config

#### Implementation of​

Configurable . config

### isSetup​

isSetup: boolean = false

Configurable.isSetup

#### Implementation of​

Configurable . isSetup

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### onSetup​

readonly onSetup: Event<unknown>

Configurable.onSetup

#### Implementation of​

Configurable . onSetup

### three​

readonly three: Mesh<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>

The Three.js mesh that contains the infinite grid.

### world​

world: World

The world instance to which this Raycaster belongs.

## Accessors​

### fade​

get fade(): boolean

Whether the grid should fade away with distance. Recommended to be true for
perspective cameras and false for orthographic cameras.

set fade(active): void

Whether the grid should fade away with distance. Recommended to be true for
perspective cameras and false for orthographic cameras.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeactiveboolean |

#### Returns​

boolean

### material​

get material(): ShaderMaterial

The material of the grid.

#### Returns​

ShaderMaterial

### visible​

get visible(): boolean

Hideable.visible

set visible(visible): void

Hideable.visible

#### Parameters​


| Data Table |
| --- |
| ParameterTypevisibleboolean |

#### Returns​

boolean

## Methods​

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### setup()​

setup(config?): void

Configurable.setup

#### Parameters​


| Data Table |
| --- |
| ParameterTypeconfig?Partial <SimpleGridConfig> |

#### Returns​

void

#### Implementation of​

Configurable . setup


---

# MODULE: SimplePlane
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/SimplePlane

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- SimplePlane

# SimplePlane

Each of the clipping planes created by the clipper.

## Implements​

- Disposable
- Hideable

## Properties​

### components​

components: Components

The components instance to which this plane belongs.

### normal​

readonly normal: Vector3

The normal vector of the clipping plane.

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### onDraggingEnded​

readonly onDraggingEnded: Event<unknown>

Event that fires when the user stops dragging a clipping plane.

### onDraggingStarted​

readonly onDraggingStarted: Event<unknown>

Event that fires when the user starts dragging a clipping plane.

### origin​

readonly origin: Vector3

The origin point of the clipping plane.

### three​

readonly three: Plane

The THREE.js Plane object representing the clipping plane.

### type​

type: string = "default"

A custom string to identify what this plane is used for.

### world​

world: World

The world instance to which this plane belongs.

## Accessors​

### controls​

get controls(): TransformControls

Getter for the transform controls of the clipping plane.
The controls allow interactive manipulation (translation, rotation, etc.) of the clipping plane.

#### Returns​

TransformControls

The transform controls of the clipping plane.

### enabled​

get enabled(): boolean

Getter for the enabled state of the clipping plane.

set enabled(state): void

Setter for the enabled state of the clipping plane.
Updates the clipping plane state in the renderer and throws an error if no renderer is found.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionstatebooleanThe new enabled state. |

#### Returns​

boolean

The current enabled state.

### helper​

get helper(): Object3D<Object3DEventMap>

Getter for the helper object of the clipping plane.
The helper object is a THREE.Object3D that contains the clipping plane mesh and other related objects.
It is used for positioning, rotating, and scaling the clipping plane in the 3D scene.

#### Returns​

Object3D<Object3DEventMap>

The helper object of the clipping plane.

### meshes​

get meshes(): Mesh<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>[]

The meshes used for raycasting

#### Returns​

Mesh<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>[]

### planeMaterial​

get planeMaterial(): Material | Material[]

The material of the clipping plane representation.

set planeMaterial(material): void

The material of the clipping plane representation.

#### Parameters​


| Data Table |
| --- |
| ParameterTypematerialMaterial | Material[] |

#### Returns​

Material | Material[]

### size​

get size(): number

The size of the clipping plane representation.

set size(size): void

Sets the size of the clipping plane representation.

#### Parameters​


| Data Table |
| --- |
| ParameterTypesizenumber |

#### Returns​

number

### visible​

get visible(): boolean

Hideable.visible

set visible(state): void

Hideable.visible

#### Parameters​


| Data Table |
| --- |
| ParameterTypestateboolean |

#### Returns​

boolean

## Methods​

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### setFromNormalAndCoplanarPoint()​

setFromNormalAndCoplanarPoint(normal, point): void

Sets the clipping plane's normal and origin from the given normal and point.
This method resets the clipping plane's state, updates the normal and origin,
and positions the helper object accordingly.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionnormalVector3The new normal vector for the clipping plane.pointVector3The new origin point for the clipping plane. |

#### Returns​

void

### update()​

update(): void

Updateable.update

#### Returns​

void


---

# MODULE: SimpleRaycaster
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/SimpleRaycaster

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- SimpleRaycaster

# SimpleRaycaster

A simple raycaster that allows to easily get items from the scene using the mouse and touch events.

## Implements​

- Disposable

## Properties​

### components​

components: Components

The components instance to which this Raycaster belongs.

### enabled​

enabled: boolean = true

Component.enabled

### mouse​

readonly mouse: Mouse

The position of the mouse in the screen.

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### three​

readonly three: Raycaster

A reference to the Three.js Raycaster instance.
This is used for raycasting operations.

### useFastModelPicking​

useFastModelPicking: boolean = false

Whether to use fast model picking to optimize raycasting.
When enabled, the raycaster will first use FastModelPicker to identify
which model is under the mouse, then only raycast that specific model.
This can significantly improve performance when there are many models.

### world​

world: World

A reference to the world instance to which this Raycaster belongs.
This is used to access the camera and meshes.

## Methods​

### castRay()​

castRay(data?): Promise<null | Intersection<Object3D<Object3DEventMap>>>

Throws a ray from the camera to the mouse or touch event point and returns
the first item found. This also takes into account the clipping planes
used by the renderer.

#### Parameters​


| Data Table |
| --- |
| ParameterTypedata?objectdata.items?Object3D<Object3DEventMap>[]data.position?Vector2data.snappingClasses?SnappingClass[] |

#### Returns​

Promise<null | Intersection<Object3D<Object3DEventMap>>>

### castRayFromVector()​

castRayFromVector(origin, direction, items): null | Intersection<Object3D<Object3DEventMap>>

Casts a ray from a given origin in a given direction and returns the first item found.
This method also takes into account the clipping planes used by the renderer.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionoriginVector3The origin of the ray.directionVector3The direction of the ray.itemsMesh<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>[]The meshes to query. If not provided, it will query all the meshes stored in World.meshes. |

#### Returns​

null | Intersection<Object3D<Object3DEventMap>>

The first intersection found or null if no intersection was found.

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose


---

# MODULE: SimpleRenderer
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/SimpleRenderer

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- SimpleRenderer

# SimpleRenderer

A basic renderer capable of rendering Objec3Ds.

## Extends​

- BaseRenderer

## Constructors​

### new SimpleRenderer()​

new SimpleRenderer(components, container, parameters?): SimpleRenderer

Constructor for the SimpleRenderer class.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptioncomponentsComponentsThe components instance.containerHTMLElementThe HTML container where the THREE.js canvas will be rendered.parameters?Partial<WebGLRendererParameters>Optional parameters for the THREE.js WebGLRenderer. |

#### Returns​

SimpleRenderer

#### Overrides​

BaseRenderer.constructor

## Properties​

### clippingPlanes​

clippingPlanes: Plane[] = []

The list of clipping planes used by this instance of the renderer.

#### Inherited from​

BaseRenderer . clippingPlanes

### container​

container: HTMLElement

The HTML container of the THREE.js canvas where the scene is rendered.

### enabled​

enabled: boolean = true

Indicates whether the renderer is enabled. If it's not, it won't be updated.
Default is true.

### mode​

mode: RendererMode = RendererMode.AUTO

The mode of the renderer. If MANUAL, the renderer will be updated manually. If AUTO, the renderer will render on every update tick.

### needsUpdate​

needsUpdate: boolean = false

Whether the renderer needs to be updated. If true, the renderer will be updated on the next frame.

### onAfterUpdate​

onAfterUpdate: Event<unknown>

Updateable.onBeforeUpdate

#### Inherited from​

BaseRenderer . onAfterUpdate

### onBeforeUpdate​

onBeforeUpdate: Event<unknown>

Updateable.onAfterUpdate

#### Inherited from​

BaseRenderer . onBeforeUpdate

### onClippingPlanesUpdated​

readonly onClippingPlanesUpdated: Event<unknown>

Event that fires when there has been a change to the list of clipping
planes used by the active renderer.

#### Inherited from​

BaseRenderer . onClippingPlanesUpdated

### onDisposed​

readonly onDisposed: Event<undefined>

Disposable.onDisposed

#### Inherited from​

BaseRenderer . onDisposed

### onResize​

readonly onResize: Event<Vector2>

Resizeable.onResize

#### Inherited from​

BaseRenderer . onResize

### onWorldChanged​

readonly onWorldChanged: Event<object>

Event that is triggered when a world is added or removed from the worlds map.
The event payload contains the world instance and the action ("added" or "removed").

#### Type declaration​

action: "added" | "removed"

world: World

#### Inherited from​

BaseRenderer . onWorldChanged

### three​

three: WebGLRenderer

The THREE.js WebGLRenderer instance.

#### Overrides​

BaseRenderer . three

## Accessors​

### currentWorld​

set currentWorld(value): void

The current world this item is associated with. It can be null if no world is currently active.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevaluenull | World |

### showLogo​

get showLogo(): boolean

Whether the That Open Company logo is shown as a small overlay in the
bottom-left corner of the renderer container. Defaults to true.

The logo is how people discover that the libraries powering this app
come from That Open Company, the team that keeps
@thatopen/components, @thatopen/fragments, and the rest of the stack
free and open source. If the logo fits your design, please consider
leaving it on; every visible mark helps us reach more developers and
keep investing in the libraries you're building on. Thank you.

If your app needs a clean viewport (full-bleed print view, white-label
embed, customer-branded surface), set it to false:

```typescript
world.renderer.showLogo = false;
```

#### Returns​

boolean

## Methods​

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Overrides​

BaseRenderer . dispose

### getSize()​

getSize(): Vector2

Resizeable.getSize.

#### Returns​

Vector2

#### Overrides​

BaseRenderer . getSize

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

BaseRenderer . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

BaseRenderer . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

BaseRenderer . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

BaseRenderer . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

BaseRenderer . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

BaseRenderer . isUpdateable

### resize()​

resize(size?): void

Resizeable.resize

#### Parameters​


| Data Table |
| --- |
| ParameterTypesize?Vector2 |

#### Returns​

void

#### Overrides​

BaseRenderer . resize

### setPlane()​

setPlane(active, plane, isLocal?): void

Sets or removes a clipping plane from the renderer.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionactivebooleanA boolean indicating whether the clipping plane should be active or not.planePlaneThe clipping plane to be added or removed.isLocal?booleanAn optional boolean indicating whether the clipping plane is local to the object. If not provided, it defaults to false. |

#### Returns​

void

#### Inherited from​

BaseRenderer . setPlane

#### Remarks​

This method adds or removes a clipping plane from the clippingPlanes array.
If active is true and the plane is not already in the array, it is added.
If active is false and the plane is in the array, it is removed.
The three.clippingPlanes property is then updated to reflect the current state of the clippingPlanes array,
excluding any planes marked as local.

### setupEvents()​

setupEvents(active): void

Sets up and manages the event listeners for the renderer.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionactivebooleanA boolean indicating whether to activate or deactivate the event listeners. |

#### Returns​

void

#### Throws​

Will throw an error if the renderer does not have an HTML container.

### update()​

update(): void

Updateable.update

#### Returns​

void

#### Overrides​

BaseRenderer . update

### updateClippingPlanes()​

updateClippingPlanes(): void

Updates the clipping planes and triggers the onClippingPlanesUpdated event.

#### Returns​

void

#### Inherited from​

BaseRenderer . updateClippingPlanes

#### Remarks​

This method is typically called when there is a change to the list of clipping planes
used by the active renderer.


---

# MODULE: SimpleScene
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/SimpleScene

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- SimpleScene

# SimpleScene

A basic 3D scene to add objects hierarchically, and easily dispose them when you are finished with it.

## Extends​

- BaseScene

## Extended by​

- ShadowedScene

## Implements​

- Configurable<SimpleSceneConfigManager, SimpleSceneConfig>

## Properties​

### ambientLights​

ambientLights: Map<string, AmbientLight>

The set of ambient lights managed by this scene component.

#### Inherited from​

BaseScene . ambientLights

### config​

config: SimpleSceneConfigManager

Configurable.config

#### Implementation of​

Configurable . config

### directionalLights​

directionalLights: Map<string, DirectionalLight>

The set of directional lights managed by this scene component.

#### Inherited from​

BaseScene . directionalLights

### isSetup​

isSetup: boolean = false

Configurable.isSetup

#### Implementation of​

Configurable . isSetup

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Inherited from​

BaseScene . onDisposed

### onSetup​

readonly onSetup: Event<unknown>

Configurable.onSetup

#### Implementation of​

Configurable . onSetup

### onWorldChanged​

readonly onWorldChanged: Event<object>

Event that is triggered when a world is added or removed from the worlds map.
The event payload contains the world instance and the action ("added" or "removed").

#### Type declaration​

action: "added" | "removed"

world: World

#### Inherited from​

BaseScene . onWorldChanged

### three​

three: Scene

The underlying Three.js scene object.
It is used to define the 3D space containing objects, lights, and cameras.

#### Overrides​

BaseScene . three

## Accessors​

### currentWorld​

set currentWorld(value): void

The current world this item is associated with. It can be null if no world is currently active.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevaluenull | World |

## Methods​

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

BaseScene . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

BaseScene . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

BaseScene . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

BaseScene . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

BaseScene . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

BaseScene . isUpdateable

### setup()​

setup(config?): void

Configurable.setup

#### Parameters​


| Data Table |
| --- |
| ParameterTypeconfig?Partial <SimpleSceneConfig> |

#### Returns​

void

#### Implementation of​

Configurable . setup


---

# MODULE: SimpleWorld\<T, U, S\>
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/SimpleWorld

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- SimpleWorld\<T, U, S\>

# SimpleWorld<T, U, S>

A class representing a simple world in a 3D environment. It extends the Base class and implements the World interface.

## Extends​

- Base

## Type parameters​


| Data Table |
| --- |
| Type parameterValueDescriptionT extends BaseSceneBaseSceneThe type of the scene. Default is BaseScene.U extends BaseCameraBaseCameraThe type of the camera. Default is BaseCamera.S extends BaseRendererBaseRendererThe type of the renderer. Default is BaseRenderer. |

## Implements​

- World
- Disposable
- Updateable

## Properties​

### enabled​

enabled: boolean = true

Indicates whether the world is currently enabled.
When disabled, the world will not be updated.

### isDisposing​

isDisposing: boolean = false

Indicates whether the world is currently being disposed. This is useful to prevent trying to access world's elements when it's being disposed, which could cause errors when you dispose a world.

#### Implementation of​

World . isDisposing

### meshes​

readonly meshes: Set<Mesh<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>>

All the loaded meshes. These meshes will be taken into account in operations like raycasting.

#### Implementation of​

World . meshes

### name?​

optional name: string

An optional name for the world.

### onAfterUpdate​

readonly onAfterUpdate: Event<unknown>

Updateable.onAfterUpdate

#### Implementation of​

Updateable . onAfterUpdate

### onBeforeUpdate​

readonly onBeforeUpdate: Event<unknown>

Updateable.onBeforeUpdate

#### Implementation of​

Updateable . onBeforeUpdate

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### uuid​

readonly uuid: string

A unique identifier for the world. Is not meant to be changed at any moment.

#### Implementation of​

World . uuid

## Accessors​

### camera​

get camera(): U

Getter for the camera. If no camera is initialized, it throws an error.

set camera(camera): void

Setter for the camera. It sets the current camera, adds the world to the camera's worlds set,
sets the current world in the camera, and triggers the camera's onWorldChanged event with the added action.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptioncameraUThe new camera to be set. |

#### Returns​

U

The current camera.

### renderer​

get renderer(): null | S

Getter for the renderer.

set renderer(renderer): void

Setter for the renderer. It sets the current renderer, adds the world to the renderer's worlds set,
sets the current world in the renderer, and triggers the renderer's onWorldChanged event with the added action.
If a new renderer is set, it also triggers the onWorldChanged event with the removed action for the old renderer.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionrenderernull | SThe new renderer to be set or null to remove the current renderer. |

#### Returns​

null | S

The current renderer or null if no renderer is set. Some worlds don't need a renderer to work (when your mail goal is not to display a 3D viewport to the user).

### scene​

get scene(): T

Getter for the scene. If no scene is initialized, it throws an error.

set scene(scene): void

Setter for the scene. It sets the current scene, adds the world to the scene's worlds set,
sets the current world in the scene, and triggers the scene's onWorldChanged event with the added action.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionsceneTThe new scene to be set. |

#### Returns​

T

The current scene.

## Methods​

### dispose()​

dispose(disposeResources): void

Disposable.dispose

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valuedisposeResourcesbooleantrue |

#### Returns​

void

#### Implementation of​

Disposable . dispose

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Base . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Base . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Base . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Base . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Base . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Base . isUpdateable

### update()​

update(delta?): void

Updateable.update

#### Parameters​


| Data Table |
| --- |
| ParameterTypedelta?number |

#### Returns​

void

#### Implementation of​

Updateable . update


---

# MODULE: SlopeAnnotations
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/SlopeAnnotations

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- SlopeAnnotations

# SlopeAnnotations

Global drawing system that manages slope annotations across all TechnicalDrawing instances.

## Extends​

- AnnotationSystem<SlopeAnnotationSystem>

## Implements​

- Disposable

## Constructors​

### new SlopeAnnotations()​

new SlopeAnnotations(components): SlopeAnnotations

Because slope data comes from the 3D model, there is no state machine.
Call add directly with the computed slope values:

```typescript
slopes.add(drawing, { position, direction, slope, style: "default" });
```

#### Parameters​


| Data Table |
| --- |
| ParameterTypecomponentsComponents |

#### Returns​

SlopeAnnotations

#### Overrides​

AnnotationSystem<SlopeAnnotationSystem>.constructor


---

# MODULE: TechnicalDrawing
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/TechnicalDrawing

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- TechnicalDrawing

# TechnicalDrawing

A single technical drawing — the core spatial aggregate.

## Constructors​

### new TechnicalDrawing()​

new TechnicalDrawing(components): TechnicalDrawing

Brings together:

- A three (THREE.Group) that anchors the drawing in world space.
All 2D geometry (projection lines, dimensions) must be added as children of
this group so they inherit its world transform.
- A collection of viewports, each defining an orthographic framing
window and owning a camera that is itself a child of the container.

Moving or rotating the container repositions the entire drawing — including
all its viewport cameras — in the 3D world without affecting any local
coordinates.

### Rotation convention​

The drawing projects geometry along its local −Y axis. The drawing
plane is the local XZ plane (Y = 0).

When rotating drawing.three, two constraints must hold at the same time:

- Projection direction — local −Y must point toward the surface you
want to capture.
- Text orientation — local +X must point toward the right side of the
screen when the drawing is viewed from the projection direction.
Violating this causes annotations and dimension text to appear mirrored.

For the six standard orthographic views, use orientTo — it enforces
both constraints with a single call:

```typescript
drawing.orientTo(new THREE.Vector3(0, -1, 0)); // top / plandrawing.orientTo(new THREE.Vector3(0,  0, -1)); // front elevation
```

Typically created via TechnicalDrawings.create.

#### Parameters​


| Data Table |
| --- |
| ParameterTypecomponentsComponents |

#### Returns​

TechnicalDrawing

## Properties​

### activeLayer​

activeLayer: string = "0"

Name of the layer new annotations will be assigned to when added via any
drawing system. Must be a layer registered via DrawingLayers.create.
Defaults to "0".

### annotations​

readonly annotations: DrawingAnnotations

Typed access to all annotation data stored on this drawing.

```typescript
const dims = techDrawings.use(OBC.LinearAnnotations);const data = drawing.annotations.getBySystem(dims);// DataMap<annotationUuid, LinearAnnotation>
```

### far​

far: number = 10

Depth of the projection capture volume, in world units, measured from the
drawing plane along the local -Y axis (the projection direction).

Used by TechnicalDrawingHelper to visualise the volume, and by
addProjectionFromItems to set the far clipping plane of the
EdgeProjector automatically.

Defaults to 10.

### layers​

readonly layers: DrawingLayers

Layer manager for this drawing.
Use it to create layers, set colors, control visibility, and subscribe to
lifecycle events for reactive UI.

```typescript
drawing.layers.create("walls", { color: 0x333333 });drawing.layers.setColor("walls", 0x888888);drawing.layers.setVisibility("walls", false);
```

### onDisposed​

readonly onDisposed: Event<void>

Disposable.onDisposed

### three​

readonly three: Group<Object3DEventMap>

Root Three.js group for all 2D content belonging to this drawing.
All geometry (projection lines, dimensions) must be added as children so
they inherit its world transform.

### uuid​

readonly uuid: string

Unique identifier for this drawing instance.

### viewports​

readonly viewports: DrawingViewports

All viewports registered on this drawing, keyed by their UUID.

### world​

world: null | World = null

The world that hosts this drawing. Set automatically by
TechnicalDrawings.create — do not assign manually unless you are
managing the drawing's scene integration yourself.

## Methods​

### addProjectionFromItems()​

addProjectionFromItems(modelIdMap, config): Promise<void>

Projects the visible and hidden edges of the given BIM model items onto
this drawing using EdgeProjector.

The projection direction is inferred from the drawing's current world
orientation (local -Y axis). The capture volume extends from the drawing
plane by far world units along that direction. Items outside the
volume are excluded automatically.

Both layer names must already exist on this drawing before calling this
method — create them with DrawingLayers.create beforehand.

```typescript
drawing.layers.create("visible", { material: new THREE.LineBasicMaterial({ color: 0x000000 }) });drawing.layers.create("hidden",  { material: new THREE.LineDashedMaterial({ color: 0x888888, dashSize: 0.2, gapSize: 0.1 }) });await drawing.addProjectionFromItems(modelIdMap, {  layers: { visible: "visible", hidden: "hidden" },  onProgress: (msg, pct) => console.log(msg, pct),});
```

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionmodelIdMapModelIdMapItems to project, keyed by model ID.configobjectRequired layer names and optional progress callback.config.layersobject-config.layers.hiddenstring-config.layers.visiblestring-config.onProgress?(message, progress?) => void- |

#### Returns​

Promise<void>

### addProjectionLines()​

addProjectionLines(ls, layer): LineSegments<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>

Adds a THREE.LineSegments to this drawing's container and
automatically computes a BVH on its geometry so that raycast can
pick individual line segments efficiently.

Use this instead of drawing.three.add() whenever the geometry will
participate in picking. Plain container.add() still works for rendering,
but without BVH the raycast falls back to a brute-force O(n) test on every
segment — noticeably slow for dense projections.

The layer assignment and Three.js rendering-layer setup (layer 1) are handled
internally — the caller does not need to touch userData or ls.layers.
If the named layer has a color defined, it is applied to the material immediately.

```typescript
drawing.layers.create("walls", { color: 0x333333 });drawing.addProjectionLines(wallLines, "walls");
```

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valueDescriptionlsLineSegments<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>undefinedThe LineSegments to add.layerstring"0"Layer name to assign. Defaults to "0". If the layer does not  exist, a warning is logged and the lines fall back to "0". |

Layer name to assign. Defaults to "0". If the layer does not

exist, a warning is logged and the lines fall back to "0".

#### Returns​

LineSegments<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>

The same LineSegments instance, for chaining.

### alignTo()​

alignTo(drawingPoints, worldPoints): void

Aligns this drawing to a target plane in 3D world space using three
point correspondences.

Pass three points picked on the drawing (in drawing local space) and
three corresponding points picked on the 3D model (in world space).
The drawing's container will be repositioned, rotated, and uniformly
scaled so that the drawing points map to their world counterparts.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondrawingPointsVector3[]Three non-collinear points in drawing local space.worldPointsVector3[]Three corresponding points in world space. |

#### Returns​

void

#### Throws​

If either set of points is collinear or degenerate — see
computeAlignmentMatrix for details.

### dispose()​

dispose(): void

Disposes all viewports, layers, annotations and removes the container (and all its Three.js geometry) from memory.

#### Returns​

void

### orientTo()​

orientTo(direction): void

Orients the drawing to one of the six standard orthographic projection
directions.

Pass any of the six axis-aligned unit vectors. The method sets
drawing.three.quaternion to the correct rotation so that:

- The drawing's local −Y axis aligns with direction.
- The drawing's local +X axis points toward the right side of the
screen when the drawing is viewed from that direction, ensuring
annotations and text render without mirroring.

```typescript
drawing.orientTo(new THREE.Vector3(0, -1,  0)); // top / plandrawing.orientTo(new THREE.Vector3(0,  1,  0)); // bottom / RCPdrawing.orientTo(new THREE.Vector3(0,  0, -1)); // front elevationdrawing.orientTo(new THREE.Vector3(0,  0,  1)); // back elevationdrawing.orientTo(new THREE.Vector3(-1, 0,  0)); // right elevationdrawing.orientTo(new THREE.Vector3(1,  0,  0)); // left elevation
```

A console warning is emitted if direction does not match any of the six
standard axes.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondirectionVector3Desired projection direction (need not be pre-normalized). |

#### Returns​

void

### raycast()​

raycast(ray, viewport): null | DrawingIntersection

Intersects a pre-built ray against all layer-1 LineSegments in this drawing.

The caller is responsible for building the ray (via THREE.Raycaster.setFromCamera
or any other method) so this method stays agnostic to which camera or canvas
the pick originated from.

The returned DrawingIntersection.point is in drawing local space
(XZ plane, Y = 0), ready to use for dimension creation or snapping.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valueDescriptionrayRayundefinedWorld-space ray to cast.viewportnull | DrawingViewportnullThe viewport the ray was built from, if any. Pass null  when picking from the 3D world camera. |

The viewport the ray was built from, if any. Pass null

when picking from the 3D world camera.

#### Returns​

null | DrawingIntersection

The closest intersection, or null if nothing was hit.

### toDrawingSpace()​

static toDrawingSpace(ls, drawing): LineSegments<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>

Projects a THREE.LineSegments from any world-space position onto the
given drawing's local XZ plane (Y = 0), returning a new THREE.LineSegments
ready to be added to container.

Vertex coordinates are transformed from the input object's local space →
world space → drawing local space, then Y is zeroed.  The input object is
not modified.

```typescript
const projected = TechnicalDrawing.toDrawingSpace(myIFCLines, drawing);drawing.three.add(projected);
```

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionlsLineSegments<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>Source LineSegments to project. Its world matrix must be  up-to-date (call updateWorldMatrix(true, false) if unsure).drawingTechnicalDrawingTarget drawing whose local XZ plane is used as destination. |

Source LineSegments to project. Its world matrix must be

up-to-date (call updateWorldMatrix(true, false) if unsure).

#### Returns​

LineSegments<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>

A new LineSegments with the projected geometry in drawing local
space. No material is assigned — set one before rendering.


---

# MODULE: TechnicalDrawingHelper
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/TechnicalDrawingHelper

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- TechnicalDrawingHelper

# TechnicalDrawingHelper

Visualises a TechnicalDrawing's projection volume in the 3D scene and exposes three gizmo anchors for interactive control.

## Extends​

- Group

## Constructors​

### new TechnicalDrawingHelper()​

new TechnicalDrawingHelper(drawing): TechnicalDrawingHelper

Works exactly like the built-in Three.js helpers (e.g. THREE.CameraHelper):
add it as a child of drawing.three so it inherits the drawing's world
transform automatically.

It renders on layer 0 — visible to the perspective camera, invisible to
the drawing's orthographic cameras (which only render layer 1).

The helper draws three things:

- A rectangular frame on the drawing plane (Y = 0 in drawing local space).
- Four pillar lines dropping from each corner along the projection direction
(local −Y) to the far boundary.
- A matching rectangle at the far boundary.

### Interactive control via gizmos​

Three THREE.Object3D anchors are exposed for TransformControls:


| Data Table |
| --- |
| AnchorControlsConstrained axisfarHandledrawing.farlocal YwidthHandlewidth (symmetric)local XheightHandleheight (symmetric)local Z |

Use the corresponding attach*Gizmo methods instead of configuring the
gizmos manually — they enforce the correct axis constraints, local space,
and change listeners automatically:

```typescript
const helper = new TechnicalDrawingHelper(drawing);helper.width = 20;helper.height = 15;drawing.three.add(helper);// Main gizmo — full translate + rotate on drawing.threeconst mainGizmo = new TransformControls(camera, domElement);mainGizmo.attach(drawing.three);scene.add(mainGizmo);// Depth gizmo — controls drawing.farconst farGizmo = new TransformControls(camera, domElement);scene.add(farGizmo);helper.attachFarGizmo(farGizmo);// Width gizmoconst widthGizmo = new TransformControls(camera, domElement);scene.add(widthGizmo);helper.attachWidthGizmo(widthGizmo);// Height gizmoconst heightGizmo = new TransformControls(camera, domElement);scene.add(heightGizmo);helper.attachHeightGizmo(heightGizmo);
```

Call update after changing width, height, or
drawing.far programmatically to rebuild the geometry.

#### Parameters​


| Data Table |
| --- |
| ParameterTypedrawingDrawingProjectionSource |

#### Returns​

TechnicalDrawingHelper

#### Overrides​

THREE.Group.constructor

## Properties​

### farHandle​

readonly farHandle: Object3D<Object3DEventMap>

Gizmo anchor positioned at the centre of the bottom frame.
Pass a TransformControls instance to attachFarGizmo — do not
manipulate this object's position directly.

### height​

height: number = 10

Height of the drawing frame indicator along the local Z axis, in world
units. Call update after changing this value programmatically.

### heightHandle​

readonly heightHandle: Object3D<Object3DEventMap>

Gizmo anchor positioned at the bottom-edge midpoint of the top frame.
Pass a TransformControls instance to attachHeightGizmo — do not
manipulate this object's position directly.

### width​

width: number = 10

Width of the drawing frame indicator along the local X axis, in world
units. Call update after changing this value programmatically.

### widthHandle​

readonly widthHandle: Object3D<Object3DEventMap>

Gizmo anchor positioned at the right-edge midpoint of the top frame.
Pass a TransformControls instance to attachWidthGizmo — do not
manipulate this object's position directly.

## Methods​

### attachFarGizmo()​

attachFarGizmo(gizmo): void

Configures a TransformControls instance to control drawing.far and
attaches it to the farHandle.

The gizmo is constrained to the drawing's local Y axis (the projection
direction) and wired to update drawing.far on every change. Call this
once — calling it again on the same gizmo accumulates listeners.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiongizmoAxisGizmoLikeA TransformControls instance (or any AxisGizmoLike). |

#### Returns​

void

### attachHeightGizmo()​

attachHeightGizmo(gizmo): void

Configures a TransformControls instance to control height and
attaches it to the heightHandle.

The gizmo is constrained to the drawing's local Z axis. Height grows
symmetrically — dragging the bottom-edge handle outward expands both sides.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiongizmoAxisGizmoLikeA TransformControls instance (or any AxisGizmoLike). |

#### Returns​

void

### attachWidthGizmo()​

attachWidthGizmo(gizmo): void

Configures a TransformControls instance to control width and
attaches it to the widthHandle.

The gizmo is constrained to the drawing's local X axis. Width grows
symmetrically — dragging the right-edge handle outward expands both sides.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiongizmoAxisGizmoLikeA TransformControls instance (or any AxisGizmoLike). |

#### Returns​

void

### dispose()​

dispose(): void

Releases all Three.js geometry and material resources.

#### Returns​

void

### update()​

update(): void

Rebuilds the helper geometry and repositions all gizmo anchors to match
the current width, height, and drawing.far. Call this
whenever any of those values change programmatically.

#### Returns​

void


---

# MODULE: TechnicalDrawings
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/TechnicalDrawings

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- TechnicalDrawings

# TechnicalDrawings

OBC Component that creates and manages TechnicalDrawing instances.

## Extends​

- Component

## Implements​

- Disposable

## Constructors​

### new TechnicalDrawings()​

new TechnicalDrawings(components): TechnicalDrawings

A TechnicalDrawing is a 2D drawing plane that lives in 3D world space.
It contains projection lines and dimension annotations (layer 1 geometry)
framed by one or more orthographic DrawingViewports.

The drawing's container (a THREE.Group) can be freely transformed in the
3D world — all viewports and geometry move together as a single unit.

#### Parameters​


| Data Table |
| --- |
| ParameterTypecomponentsComponents |

#### Returns​

TechnicalDrawings

#### Overrides​

Component.constructor

#### Example​

```typescript
const techDrawings = components.get(TechnicalDrawings);const drawing = techDrawings.create(world);// Add layer-1 geometry to the drawingconst lines = new THREE.LineSegments(geometry, material);lines.layers.set(1);drawing.three.add(lines);// Add viewportsconst vp = drawing.viewports.create({ left: -1, right: 5, top: 1, bottom: -4 });
```

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### list​

readonly list: DataMap<string, TechnicalDrawing>

All active drawings, keyed by their UUID.

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### systems​

readonly systems: DataMap<Function, AnnotationSystem<any>>

Global system instances keyed by their constructor.
Register a system with use; inspect or iterate here for UI purposes.

### uuid​

static readonly uuid: "5c7d3b9a-4e8f-4a2b-9c1d-0e3f2a5b7c8d"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### create()​

create(world): TechnicalDrawing

Creates a new TechnicalDrawing hosted in the given world.

The drawing's Three.js group is added to the world's scene and its
lifecycle is tied to the world — it is automatically removed when the
world is disposed. Three.js rendering layer 1 is enabled on the world
camera so that annotation geometry is visible in the 3D view. Both
perspective and orthographic cameras are configured when using
OrthoPerspectiveCamera.

To hide the drawing from the 3D view without removing it from the world,
either set drawing.three.visible = false or disable layer 1 on the
world camera: world.camera.three.layers.disable(1).

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionworldWorldThe world that will host this drawing. |

#### Returns​

TechnicalDrawing

The newly created drawing.

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable

### use()​

use<T>(SystemClass): T

Returns the global singleton instance of the given system, creating it if it
does not yet exist. The system constructor must accept Components as its
only argument (new-style global systems). Safe to call multiple times — always
returns the same instance.

```typescript
const dims = techDrawings.use(OBC.LinearAnnotations);dims.styles.set("default", { ... });
```

#### Type parameters​


| Data Table |
| --- |
| Type parameterT extends AnnotationSystem<any> |

#### Parameters​


| Data Table |
| --- |
| ParameterTypeSystemClassObject |

#### Returns​

T


---

# MODULE: VertexPicker
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/VertexPicker

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- VertexPicker

# VertexPicker

A class that provides functionality for picking vertices in a 3D scene.

## Extends​

- Component

## Implements​

- Disposable

## Properties​

### components​

components: Components

A reference to the Components instance associated with this VertexPicker.

#### Overrides​

Component.components

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### onEnabled​

readonly onEnabled: Event<boolean>

An event that is triggered when the picker is enabled or disabled

### onVertexFound​

readonly onVertexFound: Event<Vector3>

An event that is triggered when a vertex is found.
The event passes a THREE.Vector3 representing the position of the found vertex.

### onVertexLost​

readonly onVertexLost: Event<Vector3>

An event that is triggered when a vertex is lost.
The event passes a THREE.Vector3 representing the position of the lost vertex.

### workingPlane​

workingPlane: null | Plane = null

A reference to the working plane used for vertex picking.
This plane is used to determine which vertices are considered valid for picking.
If this value is null, all vertices are considered valid.

## Accessors​

### config​

get config(): Partial <VertexPickerConfig>

Gets the current configuration for the VertexPicker component.

#### Example​

```typescript
const currentConfig = vertexPicker.config;console.log(currentConfig.snapDistance); // Output: 0.25
```

set config(value): void

Sets the configuration for the VertexPicker component.

#### Example​

```typescript
vertexPicker.config = {  snapDistance: 0.5,  showOnlyVertex: true,};
```

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionvaluePartial <VertexPickerConfig>A Partial object containing the configuration properties to update.The properties not provided in the value object will retain their current values. |

#### Returns​

Partial <VertexPickerConfig>

A copy of the current VertexPickerConfig object.

### enabled​

get enabled(): boolean

Gets the current enabled state of the VertexPicker.

set enabled(value): void

Sets the enabled state of the VertexPicker.
When enabled, the VertexPicker will actively search for vertices in the 3D scene.
When disabled, the VertexPicker will stop searching for vertices and reset the picked point.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionvaluebooleanThe new enabled state. |

#### Returns​

boolean

The current enabled state.

## Methods​

### dispose()​

dispose(): void

Disposable.dispose

#### Returns​

void

#### Implementation of​

Disposable . dispose

### get()​

get(world): Promise<null | Vector3>

Performs the vertex picking operation based on the current state of the VertexPicker.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionworldWorldThe World instance to use for raycasting. |

#### Returns​

Promise<null | Vector3>

The current picked point, or null if no point is picked.

#### Remarks​

This method checks if the VertexPicker is enabled. If not, it returns the current picked point.
If enabled, it performs raycasting to find the closest intersecting object.
It then determines the closest vertex or point on the face, based on the configuration settings.
If the picked point is on the working plane (if defined), it triggers the onVertexFound event and updates the pickedPoint.
If the picked point is not on the working plane, it resets the pickedPoint.
If no intersecting object is found, it triggers the onVertexLost event and resets the pickedPoint.

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable


---

# MODULE: Viewpoint
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Viewpoint

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Viewpoint

# Viewpoint

Represents a BCF compliant viewpoint from BuildingSMART. The Viewpoint class provides methods for managing and interacting with viewpoints. It includes functionality for setting viewpoint properties, updating the camera, applying color to components, and serializing the viewpoint for export.

## Properties​

### clippingPlanes​

readonly clippingPlanes: DataSet<string>

ClippingPlanes can be used to define a subsection of a building model that is related to the topic.
Each clipping plane is defined by Location and Direction.
The Direction vector points in the invisible direction meaning the half-space that is clipped.

### componentColors​

readonly componentColors: DataMap<string, string[]>

A map of colors and components GUIDs that should be colorized when displaying a viewpoint.
For this to work, call viewpoint.colorize()

### defaultVisibility​

defaultVisibility: boolean = true

When true, all components should be visible unless listed in the exceptions
When false all components should be invisible unless listed in the exceptions

### exceptionComponents​

readonly exceptionComponents: DataSet<string>

A list of components GUIDs to hide when defaultVisibility = true or to show when defaultVisibility = false

### openingsVisible​

openingsVisible: boolean = false

Boolean flags to allow fine control over the visibility of openings.
A typical use of these flags is when DefaultVisibility=true but openings should remain hidden.

#### Default​

```typescript
false
```

### selectionComponents​

readonly selectionComponents: DataSet<string>

A list of components GUIDs that should be selected (highlighted) when displaying a viewpoint.

### snapshot​

snapshot: string

The snapshotID that will be used for this viewpoint when exported.

### spaceBoundariesVisible​

spaceBoundariesVisible: boolean = false

Boolean flags to allow fine control over the visibility of space boundaries.
A typical use of these flags is when DefaultVisibility=true but space boundaries should remain hidden.

#### Default​

```typescript
false
```

### spacesVisible​

spacesVisible: boolean = false

Boolean flags to allow fine control over the visibility of spaces.
A typical use of these flags is when DefaultVisibility=true but spaces should remain hidden.

#### Default​

```typescript
false
```

## Accessors​

### direction​

get direction(): Vector3

Retrieves the direction vector of the viewpoint's camera.

#### Returns​

Vector3

A THREE.Vector3 representing the direction of the viewpoint's camera.

### position​

get position(): Vector3

Retrieves the position vector of the viewpoint's camera.

set position(value): void

Sets the position of the viewpoint's camera.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionvalueVector3The new position for the viewpoint's camera. |

#### Returns​

Vector3

A THREE.Vector3 representing the position of the viewpoint's camera.

### projection​

get projection(): CameraProjection

Retrieves the projection type of the viewpoint's camera.

#### Returns​

CameraProjection

A string representing the projection type of the viewpoint's camera.
It can be either 'Perspective' or 'Orthographic'.

### topics​

get topics(): Topic[]

Retrieves the list of BCF topics associated with the current viewpoint.

#### Remarks​

This function retrieves the BCFTopics manager from the components,
then filters the list of topics to find those associated with the current viewpoint.

#### Returns​

Topic[]

An array of BCF topics associated with the current viewpoint.

### world​

set world(value): void

Represents the world in which the viewpoint will take effect.

#### Parameters​


| Data Table |
| --- |
| ParameterTypevaluenull | World |

## Methods​

### applyVisibility()​

applyVisibility(): Promise<void>

Applies visibility settings to components based on default visibility, exceptions, and selections.

This method adjusts the visibility of components using the Hider instance. It ensures that:

- The default visibility is applied to all components.
- Exceptions are handled to override the default visibility.
- Selected components are always visible.

#### Returns​

Promise<void>

### go()​

go(_config?): Promise<void>

Sets the viewpoint of the camera in the world.

#### Parameters​


| Data Table |
| --- |
| ParameterType_config?object_config.applyClippings?boolean_config.applyVisibility?boolean_config.clippingsVisibility?boolean_config.transition?boolean |

#### Returns​

Promise<void>

A Promise that resolves when the camera has been set.

#### Remarks​

This function calculates the target position based on the viewpoint information.
It sets the visibility of the viewpoint components and then applies the viewpoint using the camera's controls.

#### Throws​

An error if the world's camera does not have camera controls.

### serialize()​

serialize(version): Promise<string>

Serializes the viewpoint into a buildingSMART compliant XML string for export.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionversionstringThe version of the BCF Manager to use for serialization.                  If not provided, the current version of the manager will be used. |

The version of the BCF Manager to use for serialization.

If not provided, the current version of the manager will be used.

#### Returns​

Promise<string>

A Promise that resolves to an XML string representing the viewpoint.
The XML string follows the BCF VisualizationInfo schema.

#### Throws​

An error if the world's camera does not have camera controls.

#### Throws​

An error if the world's renderer is not available.

### set()​

set(data): void

Fully replace the properties of the viewpoint with the provided data.
The properties not included will remain unchanged.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondataPartial <BCFViewpoint>An object containing the properties to be set. |

#### Returns​

void

#### Remarks​

The guid will be ommited as it shouldn't change after it has been initially set.

### setClippingState()​

setClippingState(state): void

Sets the enabled state of all clipping planes associated with this viewpoint.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionstatebooleanA boolean indicating whether the clipping planes should be enabled or disabled. |

#### Returns​

void

### setClippingVisibility()​

setClippingVisibility(visibility): void

Sets the visibility of all clipping planes associated with this viewpoint.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionvisibilitybooleanA boolean indicating whether the clipping planes should be visible (true) or hidden (false). |

#### Returns​

void

### setColorizationState()​

setColorizationState(state): Promise<void>

Asynchronously sets the colorization state for the viewpoint's components.
When the state is true, it applies the defined component colors to the corresponding fragments.
When the state is false, it resets the highlight for the corresponding fragments.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionstatebooleanA boolean indicating whether to apply or reset the colorization.               If true, the components will be colorized. If false, the colorization will be reset. |

A boolean indicating whether to apply or reset the colorization.

If true, the components will be colorized. If false, the colorization will be reset.

#### Returns​

Promise<void>

A Promise that resolves when all colorization or reset operations are complete.

#### Remarks​

Be careful when using this method along with the Highlighter as it can cause unwanted results

### takeSnapshot()​

takeSnapshot(): Promise<boolean>

Captures a snapshot of the current viewpoint and stores it in the snapshots manager.

#### Returns​

Promise<boolean>

### toJSON()​

toJSON(): BCFViewpoint

Converts the current viewpoint instance into a JSON representation compliant with the BCFViewpoint format.

#### Returns​

BCFViewpoint

A BCF API JSON complaint object representing the viewpoint, including its GUID, components,
visibility settings, clipping planes, camera configuration, and snapshot data.

### updateCamera()​

updateCamera(takeSnapshot): Promise<boolean>

Updates the camera settings of the viewpoint based on the current world's camera and renderer.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valuetakeSnapshotbooleantrue |

#### Returns​

Promise<boolean>

A boolean indicating if the camera data was updated or not.

### updateClippingPlanes()​

updateClippingPlanes(): void

Updates the collection of clipping planes by clearing the current set and adding enabled planes
from the associated Clipper component.

#### Returns​

void


---

# MODULE: Views
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Views

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Views

# Views

The Views class is responsible for managing and interacting with a collection of 2D sections. It provides methods for creating, opening, closing, and managing views, as well as generating views from specific configurations such as IFC storeys or bounding boxes. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Properties​

### list​

readonly list: DataMap<string, View>

A readonly map that associates string keys with View instances.
This map is used to store and manage a collection of views.

### world​

world: null | World = null

The default world to be used when creating views.

- If world is set to null, views can still specify another world directly in their instance.
- This property allows views to inherit a default world context unless explicitly overridden.

### defaultRange​

static defaultRange: number = 15

The default range value used by the Views component.
This represents the standard range setting applied unless explicitly overridden.

## Accessors​

### hasOpenViews​

get hasOpenViews(): boolean

Determines whether there are any open views in this component's list.

#### Returns​

boolean

## Methods​

### close()​

close(id?): void

Closes a view by its unique identifier and performs necessary cleanup operations.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionid?stringThe unique identifier of the view to be closed. If not provided, all opened views across worlds will be closed. |

#### Returns​

void

#### Remarks​

This method resets the world to use its default camera.

### create()​

create(normal, point, config?): View

Creates a new view with the specified normal vector, point, and optional configuration.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionnormalVector3The normal vector defining the orientation of the view.pointVector3The point in space where the view is centered.config?CreateViewConfigOptional configuration for the view creation. |

#### Returns​

View

The newly created View instance.

#### Remarks​

The created view will be added to the component's list data map.

### createElevations()​

createElevations(config?): View[]

Creates views representing the front, back, left, and right sides of bounding boxes for specified models or a combined bounding box of all models.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionconfig?objectOptional configuration object for creating bounding views.config.combine?boolean-config.modelIds?RegExp[]-config.namingCallback?(modelId) => object-config.world?World- |

#### Returns​

View[]

A promise that resolves to an array of View objects created from the boundings.

#### Remarks​

The method calculates bounding boxes for the specified models, optionally combines them into a single bounding box, and creates views for the planes representing the bounding box sides.

### createFromIfcStoreys()​

createFromIfcStoreys(config?): Promise<View[]>

Creates views from IFC storeys based on the provided configuration.
This method iterates through the fragments of the model, filters storeys
based on the configuration, and generates views for each storey.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionconfig?CreateViewFromIfcStoreysConfigOptional configuration for creating views from IFC storeys. |

#### Returns​

Promise<View[]>

A promise that resolves to an array of View objects created from the IFC storeys.

#### Remarks​

Each IfcBuilsingStorey is represented as a plane in 3D space, with its elevation adjusted by the offset. The created views will be added to the component's list data map.

### createFromPlane()​

createFromPlane(plane, config?): View

Creates a new view from the specified plane and optional configuration.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionplanePlaneThe THREE.Plane object representing the plane to create the view from.config?CreateViewConfigOptional configuration for creating the view. |

#### Returns​

View

The newly created View instance.

#### Remarks​

The created view will be added to the component's list data map.

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable

### open()​

open(id): void

Opens a view by its unique identifier. Ensures that no more than one view
is opened in the same world at a time. If the view is already open, the method
returns without performing any action.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionidstringThe unique identifier of the view to open. |

#### Returns​

void

#### Remarks​

This method changes world camera to use the view's.


---

# MODULE: Worlds
**URL:** https://docs.thatopen.com/api/@thatopen/components/classes/Worlds

- 
- 📋 API
- @thatopen
- @thatopen/components
- classes
- Worlds

# Worlds

A class representing a collection of worlds within a game engine. It manages the creation, deletion, and update of worlds. 📕 Tutorial. 📘 API.

## Extends​

- Component

## Implements​

- Updateable
- Disposable

## Properties​

### enabled​

enabled: boolean = true

Component.enabled

#### Overrides​

Component . enabled

### list​

list: DataMap<string, World>

A collection of worlds managed by this component.
The key is the unique identifier (UUID) of the world, and the value is the World instance.

### onAfterUpdate​

readonly onAfterUpdate: Event<unknown>

Updateable.onAfterUpdate

#### Implementation of​

Updateable . onAfterUpdate

### onBeforeUpdate​

readonly onBeforeUpdate: Event<unknown>

Updateable.onBeforeUpdate

#### Implementation of​

Updateable . onBeforeUpdate

### onDisposed​

readonly onDisposed: Event<unknown>

Disposable.onDisposed

#### Implementation of​

Disposable . onDisposed

### uuid​

static readonly uuid: "fdb61dc4-2ec1-4966-b83d-54ea795fad4a"

A unique identifier for the component.
This UUID is used to register the component within the Components system.

## Methods​

### create()​

create<T, U, S>(): SimpleWorld<T, U, S>

Creates a new instance of a SimpleWorld and adds it to the list of worlds.

#### Type parameters​


| Data Table |
| --- |
| Type parameterValueDescriptionT extends BaseSceneBaseSceneThe type of the scene, extending from BaseScene. Defaults to BaseScene.U extends BaseCameraBaseCameraThe type of the camera, extending from BaseCamera. Defaults to BaseCamera.S extends BaseRendererBaseRendererThe type of the renderer, extending from BaseRenderer. Defaults to BaseRenderer. |

#### Returns​

SimpleWorld<T, U, S>

#### Throws​

- Throws an error if a world with the same UUID already exists in the list.

### delete()​

delete(world): void

Deletes a world from the list of worlds.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionworldWorldThe world to be deleted. |

#### Returns​

void

#### Throws​

- Throws an error if the provided world is not found in the list.

### dispose()​

dispose(): void

Disposes of the Worlds component and all its managed worlds.
This method sets the enabled flag to false, disposes of all worlds, clears the list,
and triggers the onDisposed event.

#### Returns​

void

#### Implementation of​

Disposable . dispose

### isConfigurable()​

isConfigurable(): this is Configurable<any, any>

Whether is component is Configurable.

#### Returns​

this is Configurable<any, any>

#### Inherited from​

Component . isConfigurable

### isDisposeable()​

isDisposeable(): this is Disposable

Whether is component is Disposable.

#### Returns​

this is Disposable

#### Inherited from​

Component . isDisposeable

### isHideable()​

isHideable(): this is Hideable

Whether is component is Hideable.

#### Returns​

this is Hideable

#### Inherited from​

Component . isHideable

### isResizeable()​

isResizeable(): this is Resizeable

Whether is component is Resizeable.

#### Returns​

this is Resizeable

#### Inherited from​

Component . isResizeable

### isSerializable()​

isSerializable(): this is Serializable<any, Record<string, any>>

Whether is component is Serializable.

#### Returns​

this is Serializable<any, Record<string, any>>

#### Inherited from​

Component . isSerializable

### isUpdateable()​

isUpdateable(): this is Updateable

Whether is component is Updateable.

#### Returns​

this is Updateable

#### Inherited from​

Component . isUpdateable

### update()​

update(delta?): void | Promise<void>

Updateable.update

#### Parameters​


| Data Table |
| --- |
| ParameterTypedelta?number |

#### Returns​

void | Promise<void>

#### Implementation of​

Updateable . update


---

# MODULE: @thatopen/components-front
**URL:** https://docs.thatopen.com/api/@thatopen/components-front/

- 
- 📋 API
- @thatopen
- @thatopen/components-front

# @thatopen/components-front

## Enumerations​


| Data Table |
| --- |
| EnumerationDescriptionEdgeDetectionPassModeThe mode of the edge detection pass. |

## Classes​


| Data Table |
| --- |
| ClassDescriptionAngleRepresents an angle defined by three points in 3D space: a start point, a vertex (center), and an end point.AngleMeasurementA measurement tool to measure angles between 3 points in 3D and display a visual arc with the numeric angle value.AreaMeasurementAreaMeasurement allows users to measure and interact with areas in a 3D environment. This class provides functionality for creating, updating, and deleting area measurements, as well as managing their visual representation. 📕 Tutorial. 📘 API.CivilCrossSectionNavigatorThis component is used to navigate and visualize cross sections of a 3D model. 📕 Tutorial. 📘 API.CivilNavigatorsThis component provides functionality for navigating and interacting with civil engineering data in a 3D environment. 📕 Tutorial. 📘 API.CivilRaycasterThis component provides functionality for navigating and interacting with civil engineering data in a 3D environment. 📕 Tutorial. 📘 API.ClipEdgesThe ClipEdges class is responsible for managing and rendering clipped edges and fills in a ThreeJS scene based on specified styles and models. 📕 Tutorial. 📘 API.ClipStylerA component that can style Clipping Planes by adding edges and fills. 📕 Tutorial. 📘 API.DimensionLineA class representing a simple dimension line in a 3D space.DrawingEditorFront component that centralises all interaction for OBC.TechnicalDrawing.DrawingToolBase class for all drawing tools.FontManagerManages font loading and creates Three.js text meshes for annotation labels.GlossPassA postprocessing pass that applies a gloss effect to the rendered scene. The gloss effect makes surfaces appear more reflective based on their angle relative to the camera view.GraphicVertexPickerA class to provide a graphical marker for picking vertices in a 3D scene.HighlighterThis component allows highlighting and selecting fragments in a 3D scene. 📕 Tutorial. 📘 API.HovererThe Hoverer class is responsible for managing hover effects on 3D objects within a scene. It supports animations for fading in and out hover effects and manages the lifecycle of associated 3D meshes. 📕 Tutorial. 📘 API.LengthMeasurementA basic dimension tool to measure distances between 2 points in 3D and display a 3D symbol displaying the numeric value. 📕 Tutorial. 📘 API.MarkRepresents a marker in the 3D world.MarkerComponent for Managing Markers along with creating different types of markers. Every marker is a Simple2DMarker. For every marker that needs to be added, you can use the Manager to add the marker and change its look and feel. 📕 Tutorial. 📘 API.MeasurementAbstract class that gives the core elements to create any measurement component. 📘 API.MesherMesher is a class that manages the creation and removal of THREE.Mesh objects from fragment data. It allows to efficiently retrieve and remove meshes for specific model items. 📘 API.OutlinerThis component allows adding a colored outline with thickness to fragments in a 3D scene. 📕 Tutorial. 📘 API.PostproductionRendererA class that extends RendererWith2D and adds post-processing capabilities. 📕 Tutorial. 📘 API.RendererWith2DA basic renderer capable of rendering 3D and 2D objects (Objec3Ds and CSS2DObjects respectively).VolumeMeasurementA basic dimension tool to measure volumes and display a 3D symbol with the numeric value. 📕 Tutorial. 📘 API. |

## Interfaces​


| Data Table |
| --- |
| InterfaceDescriptionClipEdgesCreationConfigConfiguration for creating ClipEdges.ClipEdgesItemStyleRepresents the style configuration for clip edges items.ClipStyleRepresents the style configuration for clipping edges, including materials for lines and fills.DimensionDataInterface representing the data required to create a dimension line.DrawingPointerEventA processed pointer event in drawing local space.HighlightEventsInterface defining the events that the Highlighter class can trigger. Each highlighter has its own set of events, identified by the highlighter name.HighlighterConfigInterface defining the configuration options for the Highlighter class.IGroupedMarkersInterface representing a group of markers.IMarkerInterface representing a marker object.LinearPlacementContextContext passed to every PlacementMode registered on LinearAnnotationsTool.PlacementModeA single placement strategy for a DrawingTool. |

## Type Aliases​


| Data Table |
| --- |
| Type aliasDescriptionDrawingCursorAlias exposed on DrawingEditor.cursor — same shape as DrawingPointerEvent. |

## Variables​


| Data Table |
| --- |
| VariableDescriptionIndividualModeOne click → one dimension. Auto-confirms once both endpoints are set.LineModeClicking a projection line locks onto both its endpoints at once, then a second click sets the offset distance.SequentialModeKeeps the session open after each confirmation so points can be chained. |

## Functions​


| Data Table |
| --- |
| FunctionDescriptiondist2D2-D distance between two Vector3s on the XZ plane (ignores Y). |


---

# MODULE: @thatopen/fragments
**URL:** https://docs.thatopen.com/api/@thatopen/fragments/

- 
- 📋 API
- @thatopen
- @thatopen/fragments

# @thatopen/fragments

## Enumerations​


| Data Table |
| --- |
| EnumerationDescriptionCurrentLodEnum representing the current level of detail (LOD) for a mesh.EditRequestTypeTypes of edit requests.ItemConfigClassEnum representing the configuration class for an item in a Fragments model.LodModeEnum representing the mode of the LOD / culling system.SnappingClassEnum representing the snapping class for a raycast operation. |

## Classes​


| Data Table |
| --- |
| ClassDescriptionEditorThe Editor class provides functionality for editing and managing Fragments models. It handles operations like editing model elements, saving changes and managing edit history.FragmentsModelThe main class for managing a 3D model loaded from a fragments file. Handles geometry, materials, visibility, highlighting, sections, and more. This class orchestrates multiple specialized managers to handle different aspects of the model like mesh management, item data, raycasting, etc. It maintains the overall state and provides the main interface for interacting with the model. The model data is loaded and processed asynchronously across multiple threads.FragmentsModelsThe main class for managing multiple 3D models loaded from fragments files. Handles loading, disposing, updating, raycasting, highlighting and coordinating multiple FragmentsModel instances. This class acts as the main entry point for working with fragments models. A FragmentsModels instance needs a worker to process fragments off the main thread. The recommended way to obtain the worker URL is via the static FragmentsModels.getWorker method, which fetches the version-matched worker from unpkg. Check the method docs for more info.GeometryEngineThe geometry engine is responsible for generating geometry using web-ifc. It provides a high-level API to generate common BIM shapes like extrusions, sweeps, walls, and profiles.IfcImporterAn objet to convert IFC files into fragments.LoadAbortedErrorError thrown when a model load is aborted via FragmentsModels.abort().SingleThreadedFragmentsModelThe main class for managing a 3D model loaded from a fragments file in a single thread. It's designed for easy data querying in the backend, so all the 3D visualization logic is not present. |

## Interfaces​


| Data Table |
| --- |
| InterfaceDescriptionAggregateMapParent-child aggregation relationships between building elements (e.g. roof to slabs).AttributesInterface representing the attributes of a model item.BaseCreateRequestBase interface for all create edit requests.BaseEditRequestBase interface for all edit requests.BaseUpdateRequestBase interface for all update edit requests.CRSDataInterface representing the Coordinate Reference System (CRS) data extracted from an IFC model's IFCPROJECTEDCRS and IFCMAPCONVERSION entities.CreateGlobalTransformRequestInterface for create global transform edit requests.CreateItemRequestInterface for create item edit requests.CreateLocalTransformRequestInterface for create local transform edit requests.CreateMaterialRequestInterface for create material edit requests.CreateRelationRequestInterface for create relation edit requests.CreateRepresentationRequestInterface for create representation edit requests.CreateSampleRequestInterface for create sample edit requests.DeleteGlobalTransformRequestInterface for delete global transform edit requests.DeleteItemRequestInterface for delete item edit requests.DeleteLocalTransformRequestInterface for delete local transform edit requests.DeleteMaterialRequestInterface for delete material edit requests.DeleteRelationRequestInterface for delete relation edit requests.DeleteRepresentationRequestInterface for delete representation edit requests.DeleteSampleRequestInterface for delete sample edit requests.GroupDataPer-group output data: the set of IFC entity IDs to include and any rewritten relationship lines.IfcSplitterDepsDependencies that must be provided by the caller (Node.js modules).IfcSplitterFsSubset of Node.js fs used by the splitter.IfcSplitterPathSubset of Node.js path used by the splitter.ItemAttributeInterface representing the attributes of an item in a Fragments model.ItemDataInterface representing the data of an item in a Fragments model.ItemsDataConfigInterface representing the configuration for item data in a Fragments model.MappedInformationResultInterface representing the result of an information query for a specific item type.MappedResultInputInterface representing the input for a result query in a Fragments model.MappedSelectionInputInterface representing the input for a selection query in a Fragments model.ModelIdMapInterface representing a map of model IDs to their corresponding local IDs.RaycastDataInterface representing the data for a raycast operation.RaycastResultInterface representing the result of a raycast operation.RectangleRaycastDataInterface representing the data for a rectangle raycast operation.RectangleRaycastResultInterface representing the result of a rectangle raycast operation.RelsModifyChangeInterface representing a change event when relations are modified in a model item.SpatialTreeItemInterface representing an item in a spatial tree.StyleMapsReverse indices for IFCSTYLEDITEM and IFCMATERIALDEFINITIONREPRESENTATION backward pointers.UpdateGlobalTransformRequestInterface for update global transform edit requests.UpdateItemRequestInterface for update item edit requests.UpdateLocalTransformRequestInterface for update local transform edit requests.UpdateMaterialRequestInterface for update material edit requests.UpdateMaxLocalIdRequestInterface for update max local id edit requests.UpdateMetadataRequestInterface for update metadata edit requests.UpdateRelationRequestInterface for update relation edit requests.UpdateRepresentationRequestInterface for update representation edit requests.UpdateSampleRequestInterface for update sample edit requests.UpdateSpatialStructureRequestInterface for update spatial structure edit requests.VirtualModelConfigInterface representing the configuration for a virtual model.VirtualPropertiesConfigInterface representing the configuration for virtual properties in a Fragments model.VoidFillMapMapping of void/fill relationships between walls, openings, and fillers (doors/windows). |

## Type Aliases​


| Data Table |
| --- |
| Type aliasDescriptionAttributeDataRepresents attribute data for a model item.AttrsChangeUnion type representing all possible attribute change types.BIMMaterialUnion type representing all possible material types.BIMMeshUnion type representing all possible mesh types.CreateRequestType for create edit requests.DataBufferUnion type representing all possible data buffer types.DeleteRequestType for delete edit requests.EditRequestType for all edit requests.ElementDataContainer of all the data of an element of a fragments model.IdentifierType representing a unique identifier for a model item. This can be either a string or a number.InformationResultTypeType representing the result of an information query for a specific item type.ItemInformationTypeUnion type representing all possible item information types.ItemSelectionTypeUnion type representing all possible item selection types.LoadProgressEventProgress event emitted during model loading.MaterialDefinitionInterface representing the definition of a material.MeshDataInterface representing the data of a mesh.NewElementDataData defining a new element of a fragments model.RawCircleExtrusionData defining a circle extrusion geometry (e.g. reinforcement bars).RawGlobalTransformDataData defining a global transform of a mesh.RawItemDataData defining a fragments item. It can be anything, from a property to property set or a physical element like a wall or a beam.RawMaterialData defining a fragments material.RawMetadataDataData defining metadata of the fragments model.RawRelationDataData defining a fragments relation.RawRepresentationData defining a representation of a geometry.RawSampleData defining a sample (instance) of a mesh.RawShellData defining a shell geometry (e.g. a brep).RawTransformDataData defining a transform (local or global) of a mesh.RelsChangeUnion type representing all possible relation change types.ResultInputTypeUnion type representing all possible result input types.SelectionInputTypeUnion type representing all possible selection input types.UpdateRequestType for update edit requests. |

## Variables​


| Data Table |
| --- |
| VariableDescriptionEditRequestTypeNamesNames of the edit request types (e.g. to display in a history UI).geometryTypesA Set of unique numbers representing different types of IFC geometries.ifcCategoryMapA map that associates each unique integer identifier (IFC Entity ID) with its corresponding category name. This map is used to map IFC entities to their respective categories for easier identification and processing.limitOf2BytesThe maximum value for a 2-byte unsigned integer. |

## Functions​


| Data Table |
| --- |
| FunctionDescriptionextractExtract specific building elements from an IFC file into a new IFC file.getObjectRecursively converts a Flatbuffers object into a plain JavaScript object. This function traverses the prototype chain of the Flatbuffers object and extracts all properties and their values, handling both primitive values and nested objects/arrays.splitSplit an IFC file into N roughly equal groups of building elements.toClassicWorkerFetches a worker script and returns a blob URL with the ES module export stripped, so it can be used as a classic (non-module) worker. |


---

# MODULE: EditRequestTypeNames
**URL:** https://docs.thatopen.com/api/@thatopen/fragments/variables/EditRequestTypeNames

- 
- 📋 API
- @thatopen
- @thatopen/fragments
- variables
- EditRequestTypeNames

# EditRequestTypeNames

const EditRequestTypeNames: Record <EditRequestType, string>

Names of the edit request types (e.g. to display in a history UI).


---

# MODULE: geometryTypes
**URL:** https://docs.thatopen.com/api/@thatopen/fragments/variables/geometryTypes

- 
- 📋 API
- @thatopen
- @thatopen/fragments
- variables
- geometryTypes

# geometryTypes

const geometryTypes: Set<number>

A Set of unique numbers representing different types of IFC geometries.


---

# MODULE: ifcCategoryMap
**URL:** https://docs.thatopen.com/api/@thatopen/fragments/variables/ifcCategoryMap

- 
- 📋 API
- @thatopen
- @thatopen/fragments
- variables
- ifcCategoryMap

# ifcCategoryMap

const ifcCategoryMap: object

A map that associates each unique integer identifier (IFC Entity ID) with its corresponding category name. This map is used to map IFC entities to their respective categories for easier identification and processing.

## Index signature​

[key: number]: string


---

# MODULE: limitOf2Bytes
**URL:** https://docs.thatopen.com/api/@thatopen/fragments/variables/limitOf2Bytes

- 
- 📋 API
- @thatopen
- @thatopen/fragments
- variables
- limitOf2Bytes

# limitOf2Bytes

const limitOf2Bytes: 65536 = 0x10000

The maximum value for a 2-byte unsigned integer.


---

# MODULE: @thatopen/ui
**URL:** https://docs.thatopen.com/api/@thatopen/ui/

- 
- 📋 API
- @thatopen
- @thatopen/ui

# @thatopen/ui

## Classes​


| Data Table |
| --- |
| ClassDescriptionButtonA custom button web component for BIM applications. HTML tag: bim-buttonChartA flexible and customizable chart component that acts as a wrapper around Chart.js.ChartLegendA component that displays a legend for charts, allowing filtering by clicking on them.CheckboxA custom checkbox web component for BIM applications. HTML tag: bim-checkboxColorInputA custom color input web component for BIM applications. HTML tag: bim-color-inputComponentA base class for UI components that utilizes the LitElement library. Provides functionality for rendering stateless and stateful components, as well as lazy loading of elements using Intersection Observer.DropdownA custom dropdown web component for BIM applications.GridA custom grid component for web applications.IconA custom icon web component for BIM applications. HTML tag: bim-iconInputA custom input web component for BIM applications. HTML tag: bim-inputLabelA custom label web component for BIM applications. HTML tag: bim-labelManagerManager class is responsible for initializing the BIM UI library, defining custom elements, and providing configuration options.NumberInputA custom number input web component for BIM applications. HTML tag: bim-number-inputOptionA custom option web component for BIM applications. HTML tag: bim-optionPanelA custom panel web component for BIM applications. HTML tag: bim-panelPanelSectionA custom panel section web component for BIM applications. HTML tag: bim-panel-sectionSelectorA custom selector web component for BIM applications. HTML tag: bim-selectorSliderA custom slider web component for BIM applications. HTML tag: bim-sliderTabA custom tab web component for BIM applications. HTML tag: bim-tabTableA custom table web component for BIM applications. HTML tag: bim-tableTabsA custom tabs web component for BIM applications. HTML tag: bim-tabsTextInputA custom text input web component for BIM applications. HTML tag: bim-text-inputToolbarA custom toolbar web component for BIM applications. HTML tag: bim-toolbarToolbarGroupA custom toolbar group web component for BIM applications. HTML tag: bim-toolbar-groupToolbarSectionA custom toolbar section web component for BIM applications. HTML tag: bim-toolbar-sectionTooltipA custom tooltip web component for BIM applications. HTML tag: bim-tooltipViewportA custom viewport web component for BIM applications. HTML tag: bim-viewport |

## Interfaces​


| Data Table |
| --- |
| InterfaceDescriptionCellCreatedEventDetailRepresents the detail of a cell created event.ColumnDataRepresents a column in the table.ComponentUtilsUtility interface providing methods for component state and element management.DataClickDetailThe detail object for the 'sectionclick' event, containing information about the clicked chart element.EntryQueryRepresents a single query condition.HasNameRepresents an object that has a name and an optional label.HasValueRepresents an object that has a value and an event for value changes.ManagerConfigConfiguration interface for the Manager class. Defines the properties and their types that can be configured for the Manager.QueryGroupRepresents a group of queries with an operator.RowCreatedEventDetailRepresents the detail of a row created event.RowDeselectedEventDetailRepresents the detail of a row deselected event.RowSelectedEventDetailRepresents the detail of a row selected event.TableGroupDataRepresents a group of table rows with optional children.TableGroupTemplateRepresents a template for rendering a group of table rows in a table. |

## Type Aliases​


| Data Table |
| --- |
| Type aliasDescriptionChartDataSetThe structure for a single dataset to be used in Chart.js.ChartInputDataThe required data structure for populating a chart.ChartInputValuesUnion type for all chart data points. The specific type depends on the chart type.ChartLoadFunctionThe function signature for asynchronously loading chart data.ConditionFunctionsRepresents a map of condition functions, where the key is a QueryCondition and the value is a function that evaluates the condition.GeneralInputDataThe structure for individual data points within general charts (bar, line, pie, etc). Use a single numeric value.GridLayoutsDefinitionRepresents a collection of predefined grid layouts for the Grid component. Each layout is defined by a unique name, a grid template string, and a map of area names to HTMLElement instances. The grid template string defines the structure of the grid, and the area names correspond to the grid-area property of the HTMLElement instances. The HTMLElement instances are used to populate the grid with content.LabelDataThe data associated with a chart label.LabelEventDataThe event data dispatched when a label is clicked.LineFillTypeThe fill options for the area under a line in a line chart.LinePointStyleTypeThe possible styles for points in a line chart.QueryRepresents a query, which can be a single query or a group of queries.QueryConditionRepresents a condition used in query building.QueryOperatorsRepresents an operator used in query building.ScatterInputDataThe structure for individual data points within a scatter or bubble chart. Use x and y coordinates.StatefullComponentRepresents a function that returns a TemplateResult for a stateful component.StatelessComponentRepresents a function that returns a TemplateResult for a stateless component.TableDataTransformRepresents a transformation function for table data.TableGroupingTransformRepresents a transformation function for grouping table data. Used to transform values before they are used for grouping logic. ALWAYS returns an array of strings representing the hierarchical path. Examples: Simple grouping: ["Architecture"], Two-level: ["Shared Information", "S1 - Coordination"], Multi-level: ["Shared Information", "S1 - Coordination", "S1.1 - Initial Coordination"]. The array length determines the hierarchy depth, independent of groupBy columns.TableRowDataRepresents a row of data for a table.TableRowTemplateRepresents a template for rendering a row of data in a table.TypesThe available chart types. |

## Functions​


| Data Table |
| --- |
| FunctionDescriptioncalculateDividerStylesCalculates the CSS styles needed for a divider element. Handles positioning, transforms, and sizing based on divider type and grid gaps.calculateHorizontalResizeCalculates new sizes for a horizontal resize operation.calculateVerticalResizeCalculates new sizes for a vertical resize operation.deduplicateDividerAreasRemoves duplicate area names from divider area arrays. Each adjacent area should only appear once in the divider's area list.detectDividersDetects all dividers (vertical and horizontal) in a grid matrix. A divider exists where two adjacent areas have different names.extractUniqueAreasExtracts unique area names from a grid template string.getElementValueExtracts and returns the value of an HTML element's attributes.parseGridTemplateParses a grid template string and returns a 2D matrix representation.validateHorizontalResizeValidates if a horizontal resize operation is allowed. Prevents resizing if it would make an area smaller than the minimum size. Only blocks movement in the direction that would shrink an area below the minimum.validateVerticalResizeValidates if a vertical resize operation is allowed. Prevents resizing if it would make an area smaller than the minimum size. Only blocks movement in the direction that would shrink an area below the minimum. |


---

# MODULE: calculateDividerStyles()
**URL:** https://docs.thatopen.com/api/@thatopen/ui/functions/calculateDividerStyles

- 
- 📋 API
- @thatopen
- @thatopen/ui
- functions
- calculateDividerStyles()

# calculateDividerStyles()

calculateDividerStyles(divider, computedStyles): Record<string, string>

Calculates the CSS styles needed for a divider element. Handles positioning, transforms, and sizing based on divider type and grid gaps.

## Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondividerGridDividerInfoThe divider informationcomputedStylesCSSStyleDeclarationThe computed styles of the grid element |

## Returns​

Record<string, string>

Object with CSS properties for the divider


---

# MODULE: calculateHorizontalResize()
**URL:** https://docs.thatopen.com/api/@thatopen/ui/functions/calculateHorizontalResize

- 
- 📋 API
- @thatopen
- @thatopen/ui
- functions
- calculateHorizontalResize()

# calculateHorizontalResize()

calculateHorizontalResize(state, dy, row, isLastRow): object

Calculates new sizes for a horizontal resize operation.

## Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionstateGridResizeStateThe current resize statedynumberDelta Y (vertical movement)rownumberRow index being resizedisLastRowbooleanWhether this is the last row |

## Returns​

object

Object with new top and bottom row sizes

### bottom​

bottom: number

### top​

top: number


---

# MODULE: calculateVerticalResize()
**URL:** https://docs.thatopen.com/api/@thatopen/ui/functions/calculateVerticalResize

- 
- 📋 API
- @thatopen
- @thatopen/ui
- functions
- calculateVerticalResize()

# calculateVerticalResize()

calculateVerticalResize(state, dx, col, isLastCol): object

Calculates new sizes for a vertical resize operation.

## Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionstateGridResizeStateThe current resize statedxnumberDelta X (horizontal movement)colnumberColumn index being resizedisLastColbooleanWhether this is the last column |

## Returns​

object

Object with new left and right column sizes

### left​

left: number

### right​

right: number


---

# MODULE: deduplicateDividerAreas()
**URL:** https://docs.thatopen.com/api/@thatopen/ui/functions/deduplicateDividerAreas

- 
- 📋 API
- @thatopen
- @thatopen/ui
- functions
- deduplicateDividerAreas()

# deduplicateDividerAreas()

deduplicateDividerAreas(dividers): GridDividerInfo[]

Removes duplicate area names from divider area arrays. Each adjacent area should only appear once in the divider's area list.

## Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiondividersGridDividerInfo[]Array of dividers to deduplicate |

## Returns​

GridDividerInfo[]

The same array with deduplicated area names


---

# MODULE: detectDividers()
**URL:** https://docs.thatopen.com/api/@thatopen/ui/functions/detectDividers

- 
- 📋 API
- @thatopen
- @thatopen/ui
- functions
- detectDividers()

# detectDividers()

detectDividers(gridMatrix): GridDividerInfo[]

Detects all dividers (vertical and horizontal) in a grid matrix. A divider exists where two adjacent areas have different names.

## Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiongridMatrix(null | string)[][]2D array representing the grid structure |

## Returns​

GridDividerInfo[]

Array of divider information including type, position, and adjacent areas


---

# MODULE: extractUniqueAreas()
**URL:** https://docs.thatopen.com/api/@thatopen/ui/functions/extractUniqueAreas

- 
- 📋 API
- @thatopen
- @thatopen/ui
- functions
- extractUniqueAreas()

# extractUniqueAreas()

extractUniqueAreas(template): string[]

Extracts unique area names from a grid template string.

## Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiontemplatestringThe grid template string |

## Returns​

string[]

An array of unique area names

## Example​

```typescript
const template = `  "header header"  "sidebar main"`;const areas = extractUniqueAreas(template);// Returns: ['header', 'sidebar', 'main']
```


---

# MODULE: getElementValue()
**URL:** https://docs.thatopen.com/api/@thatopen/ui/functions/getElementValue

- 
- 📋 API
- @thatopen
- @thatopen/ui
- functions
- getElementValue()

# getElementValue()

getElementValue<T>(child, transform, recursive): T

Extracts and returns the value of an HTML element's attributes.

## Type parameters​


| Data Table |
| --- |
| Type parameterValueT extends Record<string, any>Record<string, any> |

## Parameters​


| Data Table |
| --- |
| ParameterTypeDefault valueDescriptionchildHTMLElementundefinedThe HTML element to extract values from.transform{ [K in string | number | symbol]?: Function }{}-recursivebooleantrueWhether to recursively extract values from child elements. Default is true. |

## Returns​

T

An object containing the extracted values.


---

# MODULE: parseGridTemplate()
**URL:** https://docs.thatopen.com/api/@thatopen/ui/functions/parseGridTemplate

- 
- 📋 API
- @thatopen
- @thatopen/ui
- functions
- parseGridTemplate()

# parseGridTemplate()

parseGridTemplate(template): (string | null)[][]

Parses a grid template string and returns a 2D matrix representation.

## Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiontemplatestringThe grid template string to parse |

## Returns​

(string | null)[][]

A 2D array where each cell contains the area name or null for empty cells

## Example​

```typescript
const template = `  "header header"  "sidebar main"`;const matrix = parseGridTemplate(template);// Returns: [['header', 'header'], ['sidebar', 'main']]
```


---

# MODULE: validateHorizontalResize()
**URL:** https://docs.thatopen.com/api/@thatopen/ui/functions/validateHorizontalResize

- 
- 📋 API
- @thatopen
- @thatopen/ui
- functions
- validateHorizontalResize()

# validateHorizontalResize()

validateHorizontalResize(topValue, bottomValue, dy, minSize): boolean

Validates if a horizontal resize operation is allowed. Prevents resizing if it would make an area smaller than the minimum size. Only blocks movement in the direction that would shrink an area below the minimum.

## Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiontopValuenumberNew size for the top rowbottomValuenumberNew size for the bottom rowdynumberDelta Y (vertical movement)minSizenumberMinimum allowed size in pixels |

## Returns​

boolean

true if the resize is allowed, false otherwise


---

# MODULE: validateVerticalResize()
**URL:** https://docs.thatopen.com/api/@thatopen/ui/functions/validateVerticalResize

- 
- 📋 API
- @thatopen
- @thatopen/ui
- functions
- validateVerticalResize()

# validateVerticalResize()

validateVerticalResize(leftValue, rightValue, dx, minSize): boolean

Validates if a vertical resize operation is allowed. Prevents resizing if it would make an area smaller than the minimum size. Only blocks movement in the direction that would shrink an area below the minimum.

## Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptionleftValuenumberNew size for the left columnrightValuenumberNew size for the right columndxnumberDelta X (horizontal movement)minSizenumberMinimum allowed size in pixels |

## Returns​

boolean

true if the resize is allowed, false otherwise


---

# MODULE: @thatopen/ui-obc
**URL:** https://docs.thatopen.com/api/@thatopen/ui-obc/

- 
- 📋 API
- @thatopen
- @thatopen/ui-obc

# @thatopen/ui-obc

## Classes​


| Data Table |
| --- |
| ClassDescriptionManagerManager class is responsible for initializing the custom elements for the BIM application. It uses the BUIManager from "@thatopen/ui" to define custom elements for 2D and 3D views.SheetBoardAn infinite pannable/zoomable canvas for arranging technical drawing sheets.ViewCubeA custom 3D view cube component for BIM applications. HTML tag: bim-view-cubeWorldA world for BIM Apps.World2DA custom 2D Scene component for BIM applications. HTML tag: bim-world-2d |

## Interfaces​


| Data Table |
| --- |
| InterfaceDescriptionItemsDataStateUI State to render an item data tableLoadFragStateInterface representing the state of the LoadIfcUI component. It contains a reference to the Components object from the @thatopen/components library.LoadIfcStateInterface representing the state of the LoadIfcUI component. It contains a reference to the Components object from the @thatopen/components library.TopicFormUIRepresents the UI elements and configuration for a topic form in the OBC system. |

TopicFormUI |


---

# MODULE: ItemsDataState
**URL:** https://docs.thatopen.com/api/@thatopen/ui-obc/interfaces/ItemsDataState

- 
- 📋 API
- @thatopen
- @thatopen/ui-obc
- interfaces
- ItemsDataState

# ItemsDataState

UI State to render an item data table

## Properties​

### components​

components: Components

The main entry point of @thatopen/components in your app

### emptySelectionWarning?​

optional emptySelectionWarning: boolean

Display a warning instead of the table in case there is no selection

#### Default​

```typescript
true
```

### modelIdMap​

modelIdMap: object

The collection of items per model to show its data in the table

#### Index signature​

[key: string]: Set<number>


---

# MODULE: LoadFragState
**URL:** https://docs.thatopen.com/api/@thatopen/ui-obc/interfaces/LoadFragState

- 
- 📋 API
- @thatopen
- @thatopen/ui-obc
- interfaces
- LoadFragState

# LoadFragState

Interface representing the state of the LoadIfcUI component. It contains a reference to the Components object from the @thatopen/components library.


---

# MODULE: LoadIfcState
**URL:** https://docs.thatopen.com/api/@thatopen/ui-obc/interfaces/LoadIfcState

- 
- 📋 API
- @thatopen
- @thatopen/ui-obc
- interfaces
- LoadIfcState

# LoadIfcState

Interface representing the state of the LoadIfcUI component. It contains a reference to the Components object from the @thatopen/components library.


---

# MODULE: TopicFormUI
**URL:** https://docs.thatopen.com/api/@thatopen/ui-obc/interfaces/TopicFormUI

- 
- 📋 API
- @thatopen
- @thatopen/ui-obc
- interfaces
- TopicFormUI

# TopicFormUI

Represents the UI elements and configuration for a topic form in the OBC system.

TopicFormUI

## Properties​

### components​

components: Components

The main components entry point of your app.

### onCancel()?​

optional onCancel: () => void | Promise<void>

Callback function triggered when the form is canceled.

#### Returns​

void | Promise<void>

### onSubmit()?​

optional onSubmit: (topic) => void | Promise<void>

Callback function triggered when the form is submitted.

#### Parameters​


| Data Table |
| --- |
| ParameterTypeDescriptiontopicTopicThe topic created/updated from the form. |

#### Returns​

void | Promise<void>

### styles?​

optional styles: Partial<DataStyles>

Custom styles for the form components.

### topic?​

optional topic: Topic

The topic data to be used in the form. This can be undefined if no topic is being edited.

### value?​

optional value: Partial<FormValue>

The initial values for the form fields. Can be a partial raw topic object.


---

