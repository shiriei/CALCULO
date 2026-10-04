::: {align="center"}
\# CALCULO \### Calculate. Visualize. Explore. A desktop scientific
calculator designed to bring mathematical tools and your everyday
workflow into one place.
\[\![Electron\](https://img.shields.io/badge/Electron-desktop-47848F?logo=electron&logoColor=white)\](https://www.electronjs.org/)
\[\![React\](https://img.shields.io/badge/React-interface-61DAFB?logo=react&logoColor=20232A)\](https://react.dev/)
\[\![TypeScript\](https://img.shields.io/badge/TypeScript-typed%20code-3178C6?logo=typescript&logoColor=white)\](https://www.typescriptlang.org/)
\[\![Vite\](https://img.shields.io/badge/Vite-build%20tool-646CFF?logo=vite&logoColor=white)\](https://vite.dev/)
\[Explore features\](#-what-you-can-do) · \[Run
locally\](#-get-calculo-running) · \[Roadmap\](#-whats-next) ·
\[Contribute\](#-contributing)
:::

\-\-- \> \*\*One workspace. More ways to work with math.\*\* \>
Calculate with a scientific engine, explore functions visually, revisit
previous work, and open Chrome when you need a web reference---all from
a desktop app. \## Why CALCULO? Math often means bouncing between a
calculator, a graphing tool, and a browser. CALCULO brings these parts
of the workflow closer together in a focused desktop experience built
with Electron, React, and TypeScript. \## ✦ What you can do \| Feature
\| What it brings to your workflow \| \|\-\--\|\-\--\| \| \*\*Scientific
calculator\*\* \| Enter supported mathematical expressions and calculate
results in a dedicated desktop interface. \| \| \*\*Interactive
graphing\*\* \| Plot supported functions and explore their mathematical
shape visually. \| \| \*\*Calculation history\*\* \| Revisit previous
calculations using the history tools available in your build. \| \|
\*\*Chrome launch\*\* \| Open Chrome from CALCULO to consult
documentation, references, or learning resources. \| \|
\*\*Desktop-first experience\*\* \| Use a dedicated Electron app rather
than keeping another calculator tab open. \| \### A typical CALCULO
workflow \*\*Calculate → Visualize → Investigate → Continue\*\* 1. Enter
an expression in the calculator. 2. Switch to graphing when you want to
see a function visually. 3. Return to previous work through history when
available. 4. Launch Chrome to research a formula or explore a related
topic. \*The exact controls and supported operations depend on the
current version of the app.\* \## 🧪 Try these example expressions Use
these as examples of mathematical expressions to try if they are
supported by the current calculator interface and math engine. \| Goal
\| Example \| \|\-\--\|\-\--\| \| Basic arithmetic \| \`(25 + 15) / 4\`
\| \| Powers \| \`2\^10\` \| \| Trigonometry \| \`sin(pi / 2)\` \| \|
Logarithms \| \`log(100, 10)\` \| \| Square roots \| \`sqrt(144)\` \| \|
Function to explore \| \`sin(x)\` \| \> \*\*Tip:\*\* Trigonometric
results depend on the angle mode and syntax supported by the current
build. Check the app\'s controls if a result differs from what you
expect. \## 🖥️ Get CALCULO running Want to run the project from source
or help build it? Follow the steps below. \### Prerequisites -
\[Node.js\](https://nodejs.org/) --- use an LTS release compatible with
the dependencies - npm --- included with Node.js -
\[Git\](https://git-scm.com/) \### 1. Clone the repository \`\`\`bash
git clone https://github.com/shiriei/CALCULO.git cd CALCULO \`\`\` \###
2. Install dependencies \`\`\`bash npm install \`\`\` \### 3. Start the
development app \`\`\`bash npm run dev \`\`\` Keep the terminal open
while using the development version. \### Useful commands \| Command \|
Purpose \| \|\-\--\|\-\--\| \| \`npm run dev\` \| Start the development
workflow \| \| \`npm run typecheck\` \| Check TypeScript types \| \|
\`npm test\` \| Run the Vitest test suite \| \| \`npm run build\` \|
Compile TypeScript projects and build the frontend \| These commands
reflect the scripts currently defined in \`package.json\`. A packaged
installer may require separate packaging configuration. \## 🔐 Optional
configuration: Supabase The project includes the Supabase JavaScript
client. If your current build uses online authentication, create a
\`.env\` file in the project root: \`\`\`env
VITE_SUPABASE_URL=\"YOUR_SUPABASE_PROJECT_URL\"
VITE_SUPABASE_ANON_KEY=\"YOUR_SUPABASE_ANON_KEY\" \`\`\` Replace the
placeholders with the values from your Supabase project, then restart
the development server. \*\*Keep secrets safe:\*\* - Never commit
\`.env\`. - Commit only \`.env.example\` with placeholders. - Never put
database passwords or service-role keys in \`VITE\_\` variables;
frontend-exposed values are not secret. - Authentication will not work
until the required project settings and environment variables are
configured. \## ⚙️ Built with \| Technology \| Role \| \|\-\--\|\-\--\|
\| \*\*Electron\*\* \| Desktop application runtime \| \| \*\*React\*\*
\| User interface \| \| \*\*TypeScript\*\* \| Typed application code \|
\| \*\*Vite\*\* \| Frontend development and build tooling \| \|
\*\*mathjs\*\* \| Mathematical expression functionality \| \|
\*\*Supabase JS\*\* \| Backend/authentication integration when
configured \| \| \*\*Vitest\*\* \| Automated tests \| \## 🗺️ What\'s
next? These are planned ideas, not promises that the features are
already available. The goal is to grow CALCULO into a more capable
mathematical workspace. - \[ \] \*\*Graph Intelligence\*\* --- identify
roots, intercepts, extrema, and intersections. - \[ \] \*\*Step-by-Step
Solver\*\* --- explain supported calculations through formulas and
intermediate steps. - \[ \] \*\*What-If Explorer\*\* --- adjust function
parameters with sliders and watch graphs respond. - \[ \]
\*\*Natural-Language Math\*\* --- turn requests such as
compound-interest questions into supported calculations. - \[ \]
\*\*Saved Math Workspaces\*\* --- keep calculations, variables, graphs,
and notes together. - \[ \] \*\*Smarter Browser Workflow\*\* --- send an
expression to a browser search in one click. - \[ \] \*\*Unit
Intelligence\*\* --- convert units and flag incompatible dimensions. -
\[ \] \*\*Equation Capture\*\* --- extract printed equations from images
using OCR. Have a feature idea? Open an issue and describe the problem
it would solve, how you imagine it working, and an example if possible.
\## 🧰 Troubleshooting

**Node.js or npm is not recognized**

Install Node.js from \[nodejs.org\](https://nodejs.org/), reopen the
terminal, then run: \`\`\`bash node \--version npm \--version \`\`\`

**The app does not start**

From the project directory, try: \`\`\`bash npm install npm run dev
\`\`\` Read the first meaningful terminal error. If you open an issue,
include your operating system, Node.js version, command, and a sanitized
error message. Remove passwords and tokens from logs first.

**Supabase authentication is not working**

Confirm that \`.env\` is in the project root, its variable names match
\`.env.example\`, the values are correct, and you restarted the
development server after editing it. Verify the relevant authentication
settings in Supabase as well.

**Type checks, tests, or build fail**

Run the commands separately to identify the failing step: \`\`\`bash npm
run typecheck npm test npm run build \`\`\` Include the failing command
and a concise, sanitized error when reporting the problem.

\## 🤝 Contributing CALCULO is a work in progress, and practical
improvements are welcome. 1. Fork the repository. 2. Create a branch:
\`git checkout -b feat/your-feature\` 3. Make one focused change. 4. Run
the relevant checks. 5. Commit with a clear message, such as \`feat: add
graph intersection detection\`. 6. Open a pull request explaining what
changed and how you tested it. Please avoid including generated build
folders, unrelated temporary scripts, or credentials in pull requests.
\## 🔒 Security Please do not publish credentials, database connection
strings, access tokens, or other secrets in commits or issues. Treat all
\`VITE\_\` variables as client-visible. For a suspected vulnerability,
contact the repository maintainer privately rather than publishing
exploit details. \## 📄 License Add a \`LICENSE\` file before describing
CALCULO as open source or specifying reuse permissions. Until a license
is included, do not assume the code is available for unrestricted reuse.
\-\--

::: {align="center"}
\*\*CALCULO --- make math something you can explore.\*\* Built with
Electron, React, TypeScript, and curiosity.
:::
