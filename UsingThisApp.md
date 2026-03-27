# How to Set Up the Consolepuffs Jira Board App

This guide walks you through cloning the repo, configuring your credentials, and running the app locally. Any changes you make (creating stories, updating fields, adding comments) will show up in Jira under **your** name.

---

## Prerequisites

- **macOS** (or any OS with a terminal)
- **Node.js 18+** installed — check with `node -v` in Terminal. If not installed, download from https://nodejs.org/ or run `brew install node`
- **Git** installed — check with `git --version`. Comes pre-installed on macOS.
- **A Jira (Atlassian) account** with access to the CPUX project

---

## Step 1: Open Terminal

You can find it in **Applications > Utilities > Terminal**, or press **Cmd + Space** and type "Terminal".

---

## Step 2: Clone the Repo

Run these commands in Terminal. This downloads the project to your home folder:

```bash
cd ~
git clone https://github.com/KendraMar/JiraProjectKendra.git
```

---

## Step 3: Install Dependencies

Navigate into the dashboard folder and install the required packages:

```bash
cd ~/JiraProjectKendra/dashboard
npm install
```

This may take a minute. You'll see a progress bar as packages download.

---

## Step 4: Get Your Jira API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens in your browser
2. Log in with your Red Hat Atlassian account
3. Click **Create API token**
4. Give it a label (e.g., "Consolepuffs Dashboard")
5. **Copy the token** — you'll need it in the next step. You won't be able to see it again after closing the dialog.

---

## Step 5: Create Your `.env` File

Still in Terminal, run this command to open a text editor:

```bash
nano ~/JiraProjectKendra/dashboard/.env
```

Paste in the following, replacing the two lines marked with `<-- replace`:

```
VITE_JIRA_CLOUD_ID=2b9e35e3-6bd3-4cec-b838-f4249ee02432
VITE_JIRA_EMAIL=your-email@redhat.com              <-- replace with your Atlassian email
VITE_JIRA_API_TOKEN=paste-your-token-here           <-- replace with the token from Step 4
VITE_JIRA_PROJECT_KEY=CPUX
VITE_JIRA_COMPONENT=HCC
VITE_JIRA_BASE_URL=https://redhat.atlassian.net
```

Then press **Ctrl + O**, then **Enter** to save, and **Ctrl + X** to exit.

> **Important:** The `.env` file is listed in `.gitignore` so your credentials are never pushed to GitHub. Each person creates their own local `.env` file.

---

## Step 6: Start the App

From the dashboard folder, run:

```bash
cd ~/JiraProjectKendra/dashboard
npx vite --host
```

You should see output like:

```
VITE v8.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://10.x.x.x:5173/
```

---

## Step 7: Open the App

Open your browser and go to:

```
http://localhost:5173/
```

You're all set! The dashboard will load your team's HCC sprint stories from Jira.

---

## How It Works

- The app uses **your** Jira API token to authenticate all requests. Every action you take (create a story, change a status, add a comment) is attributed to **your** Jira account — just like working directly in Jira.
- Your email address appears in the masthead so you know which account is active.
- Data is fetched live from Jira each time you load or refresh the page.

---

## Daily Usage

To start the app each day:

```bash
cd ~/JiraProjectKendra/dashboard
npx vite --host
```

Then open http://localhost:5173/ in your browser.

To stop the app, press **Ctrl + C** in the Terminal window where it's running.

---

## Pulling Updates

When new features are pushed to the repo, pull the latest changes:

```bash
cd ~/JiraProjectKendra
git pull
cd dashboard
npm install
npx vite --host
```

The `npm install` step ensures any new dependencies are downloaded. If nothing changed in `package.json`, it will finish instantly.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `command not found: node` | Install Node.js from https://nodejs.org/ |
| `command not found: git` | Run `xcode-select --install` to install Git on macOS |
| `XSRF check failed (403)` | Make sure the app is running via `npx vite --host` (the dev server proxies API requests to avoid CORS issues) |
| `Jira API 401` | Your API token may have expired. Create a new one at https://id.atlassian.com/manage-profile/security/api-tokens and update your `.env` file |
| `site can't be reached` | The dev server isn't running. Start it with `npx vite --host` from the `dashboard/` folder |
| Page loads but no data appears | Check that your `.env` file has the correct email and token, and that you have access to the CPUX project in Jira |

---

## Questions?

Reach out to Kendra Marchant (kmarchan@redhat.com) for help getting set up.
