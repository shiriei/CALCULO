# CALCULO

**A desktop scientific calculator built for more than calculations.**

CALCULO brings scientific mathematics, interactive graphing, calculation
history, and quick access to Chrome into one desktop workspace. Built
with Electron, React, and TypeScript, it aims to make everyday
calculations and mathematical exploration easier from a single app.

```{=html}
<p align="center">
```
`<a href="#-features">`{=html}Features`</a>`{=html} •
`<a href="#-getting-started">`{=html}Get started`</a>`{=html} •
`<a href="#-usage-guide">`{=html}Usage guide`</a>`{=html} •
`<a href="#-technology-stack">`{=html}Tech stack`</a>`{=html} •
`<a href="#-roadmap">`{=html}Roadmap`</a>`{=html} •
`<a href="#-contributing">`{=html}Contributing`</a>`{=html}
```{=html}
</p>
```
> **Project status:** CALCULO is under active development. Features
> marked as planned in the roadmap are ideas for future releases and may
> not be available in the current build.

------------------------------------------------------------------------

## Table of contents

-   [Why CALCULO?](#-why-calculo)
-   [Features](#-features)
-   [Usage guide](#-usage-guide)
-   [Getting started](#-getting-started)
-   [Configuration](#-configuration)
-   [Technology stack](#-technology-stack)
-   [Project structure](#-project-structure)
-   [Roadmap](#-roadmap)
-   [Troubleshooting](#-troubleshooting)
-   [Security and privacy](#-security-and-privacy)
-   [Contributing](#-contributing)
-   [License](#-license)

## ✨ Why CALCULO?

Switching between a calculator, graphing website, notes, and browser
tabs interrupts the way you work. CALCULO brings key mathematical tools
together in a desktop application, with a focus on a clean interface and
a workflow that can grow over time.

### At a glance

  -----------------------------------------------------------------------
  Capability                          What it means
  ----------------------------------- -----------------------------------
  Scientific calculator               Work with supported mathematical
                                      expressions and scientific
                                      operations.

  Interactive graphing                Visualize supported mathematical
                                      functions.

  Calculation history                 Revisit previous calculations where
                                      history is available in your build.

  Chrome access                       Launch Chrome from the app for
                                      quick access to web resources.

  Desktop experience                  Use CALCULO as an Electron desktop
                                      application rather than a
                                      browser-only tool.
  -----------------------------------------------------------------------

## 🚀 Features

### Scientific calculations

-   Enter mathematical expressions using the calculator interface.
-   Use the supported functions and syntax provided by the calculation
    engine.
-   Get results without switching to a separate calculator website.

### Interactive graphing

-   Explore supported functions visually.
-   Use graphing to build intuition about mathematical relationships.
-   Graphing capabilities may vary by current build; consult the app UI
    for available controls.

### Calculation history

-   Review previous calculations when the history feature is enabled in
    your build.
-   Use history to revisit work instead of repeatedly entering the same
    expression.

### Quick Chrome access

-   Open Chrome from within the CALCULO workflow.
-   Use your browser to look up references, documentation, or additional
    learning resources.

### Designed to grow

CALCULO is being developed as a wider mathematics workspace. Potential
future additions are listed in the roadmap and should not be assumed to
exist in the current release.

## 🧭 Usage guide

1.  **Launch CALCULO** using the installed desktop app or the
    development command below.
2.  **Enter a calculation** using the calculator interface and the
    expression syntax supported by the app.
3.  **Explore a function** in the graphing area if graphing is available
    in your current build.
4.  **Revisit previous work** through calculation history where
    available.
5.  **Open Chrome** when you need to consult a web resource.

> Tip: For exact function syntax, supported operations, and available
> controls, use the in-app interface and the current source code as the
> source of truth. The feature set may evolve while CALCULO is in
> development.

```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}What is CALCULO built with?`</strong>`{=html}
```{=html}
</summary>
```
-   **Electron** provides the desktop application shell.
-   **React** builds the user interface.
-   **TypeScript** adds static typing to the application code.
-   **Vite** supports the frontend development and build workflow.
-   **mathjs** provides mathematical expression functionality.
-   **Supabase** is included as a dependency for online
    authentication-related functionality; availability depends on
    configuration.

```{=html}
</details>
```
## 💻 Getting started

### Requirements

Install the following before running CALCULO from source:

-   [Node.js](https://nodejs.org/) (use a current LTS release compatible
    with the project dependencies)
-   npm (included with Node.js)
-   [Git](https://git-scm.com/) to clone the repository

### 1. Clone the repository

``` bash
git clone https://github.com/shiriei/CALCULO.git
cd CALCULO
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Start the development app

``` bash
npm run dev
```

This runs the development processes defined in `package.json`. Keep the
terminal open while developing.

### 4. Check the project

Run the available checks:

``` bash
npm run typecheck
npm test
npm run build
```

-   `npm run typecheck` checks TypeScript types.
-   `npm test` runs the project's Vitest test suite.
-   `npm run build` creates a production frontend build and compiles the
    configured TypeScript projects.

### Available scripts

  -----------------------------------------------------------------------
  Command                             Purpose
  ----------------------------------- -----------------------------------
  `npm run dev`                       Start the development workflow.

  `npm run dev:vite`                  Start Vite only.

  `npm run dev:main`                  Watch and compile the Electron
                                      main-process TypeScript project.

  `npm run dev:electron`              Launch Electron after its
                                      development prerequisites are
                                      ready.

  `npm run typecheck`                 Check TypeScript projects.

  `npm test`                          Run tests with Vitest.

  `npm run build`                     Build the configured application
                                      projects.
  -----------------------------------------------------------------------

> Packaging a distributable installer is a separate step and requires a
> packaging tool/configuration. The scripts above do not, by themselves,
> promise a Windows installer.

## 🔐 Configuration

### Supabase (optional, if using online authentication)

The project includes the Supabase JavaScript client. If your current
build uses Supabase authentication, configure the expected Vite
environment variables locally.

Create a `.env` file in the project root:

``` env
VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

Replace the placeholders with the appropriate project URL and
client-side publishable/anonymous key from your Supabase project
settings. Restart the development server after changing environment
variables.

-   Keep `.env` local and untracked.
-   Commit only `.env.example` with placeholders.
-   Never place a database password, service-role key, or other server
    secret in a `VITE_` variable. Vite-exposed variables can be included
    in client-side code.
-   If authentication is not configured, online account features may be
    unavailable.

## 🧱 Technology stack

  -----------------------------------------------------------------------
  Technology                          Role
  ----------------------------------- -----------------------------------
  Electron                            Desktop runtime

  React                               UI components

  TypeScript                          Typed application code

  Vite                                Frontend development and build
                                      tooling

  mathjs                              Mathematical expression engine

  Supabase JS                         Authentication/backend client
                                      integration, when configured

  Vitest                              Automated testing
  -----------------------------------------------------------------------

## 📁 Project structure

The exact layout may change as development continues. The main project
areas include:

``` text
CALCULO/
├── public/                 # Static public assets, if present
├── src/
│   ├── renderer/            # React UI and renderer-side application code
│   │   ├── components/      # UI components
│   │   └── engine/          # Calculation and graphing logic
│   └── ...                  # Other application modules
├── .env.example             # Environment-variable template
├── .gitignore
├── index.html
├── package.json             # Scripts and dependencies
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

Some folders may differ by branch or version. Use the actual repository
tree if a path above is not present in your checkout.

## 🗺️ Roadmap

These are proposed improvements, not claims about features already
shipped.

-   [ ] **Graph Intelligence** --- detect roots, intercepts, extrema,
    and intersections where numerical methods can reliably find them.
-   [ ] **Step-by-Step Solver** --- explain supported calculations
    through formulas and intermediate steps.
-   [ ] **What-If Parameter Explorer** --- change parameters with
    sliders and see graph updates live.
-   [ ] **Natural-Language Math Input** --- interpret supported requests
    such as compound-interest questions and convert them into
    calculations.
-   [ ] **Persistent Math Workspaces** --- save calculations, variables,
    graphs, and notes together.
-   [ ] **Browser Workflow Improvements** --- send a selected expression
    to a browser search with one click.
-   [ ] **Unit Intelligence** --- add unit conversion and flag
    incompatible dimensions.
-   [ ] **Equation Capture** --- extract printed equations from images
    using OCR.

### Help shape the roadmap

Have an idea or found a gap? Open an issue with: - What you want to do -
Why it would be useful - A short example or mock-up, if possible

## 🛠️ Troubleshooting

```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}`<code>`{=html}npm`</code>`{=html} or
`<code>`{=html}node`</code>`{=html} is not recognized`</strong>`{=html}
```{=html}
</summary>
```
Install Node.js from [nodejs.org](https://nodejs.org/), reopen your
terminal, and check:

``` bash
node --version
npm --version
```

```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}Dependencies or startup fail`</strong>`{=html}
```{=html}
</summary>
```
From the project root, try:

``` bash
npm install
npm run dev
```

Read the first meaningful error in the terminal. If the problem
persists, open an issue with your operating system, Node.js version,
command used, and relevant error output. Remove any tokens, passwords,
or personal information before sharing logs.

```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}Supabase authentication is
unavailable`</strong>`{=html}
```{=html}
</summary>
```
Check that the `.env` file exists in the project root, the variable
names match `.env.example`, the values are correct, and the development
server was restarted after editing the file. Also verify that the
relevant authentication settings are enabled in Supabase.

```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}Tests or build fail`</strong>`{=html}
```{=html}
</summary>
```
Run the checks individually to identify the failing step:

``` bash
npm run typecheck
npm test
npm run build
```

Include the failing command and a concise, sanitized error message when
reporting the issue.

```{=html}
</details>
```
## 🔒 Security and privacy

-   Do not commit `.env` files, database connection strings, passwords,
    access tokens, or service-role keys.
-   Treat all values exposed through Vite's `VITE_` environment
    variables as client-visible.
-   Review external-link and browser-launch behavior before using the
    application with untrusted input.
-   Report suspected security vulnerabilities privately to the
    repository maintainer rather than publishing exploit details in an
    issue.

## 🤝 Contributing

Contributions, bug reports, and practical feature suggestions are
welcome.

1.  Fork the repository.
2.  Create a branch: `git checkout -b feat/your-feature`.
3.  Make a focused change.
4.  Run the relevant checks (`npm run typecheck`, `npm test`, and
    `npm run build`).
5.  Commit with a clear message, for example
    `feat: add graph intersection detection`.
6.  Open a pull request describing the change and how it was tested.

Please keep pull requests focused and avoid including secrets, generated
build folders, or unrelated temporary scripts.

## 📄 License

No license has been specified in this README. Until a license file is
added to the repository, do not assume that the code is available for
unrestricted reuse. If you intend to publish CALCULO as open source,
choose a license and add its full text to a `LICENSE` file.

------------------------------------------------------------------------

```{=html}
<p align="center">
```
Made to make mathematics easier to explore.
```{=html}
</p>
```
