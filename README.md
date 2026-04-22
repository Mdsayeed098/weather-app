# Ultimate Weather App

A modern, professional weather web application focusing on real-time data, dynamic styles, and stunning design.

## How to Deploy to Localhost
Since the app uses simple HTML/CSS/JS with ES6 Modules or `fetch` APIs, running it from the `file://` protocol may cause CORS or cross-origin errors in the browser. 

You should run a local server:
- **Using Python:** Run `python -m http.server 8000` in this directory, then open `http://localhost:8000`.
- **Using Node.js:** Run `npx serve` in this directory.
- **Using VS Code:** Install the "Live Server" extension, right click `index.html`, and select "Open with Live Server".

## How to perform this task using Claude (or similar AI)
If you were using Claude to build this app, you would:
1. Provide the exact same prompt you gave me.
2. Claude would generate the HTML, CSS, and JS code in markdown blocks in the chat.
3. You would manually create the files (`index.html`, `styles.css`, `app.js`) in your local folder and copy-paste Claude's code into them.
4. If there are any bugs or requested changes, you would reply to Claude with e.g. "The background isn't updating" or "Make the font bigger", and paste the error or required changes, and Claude would rewrite the specific sections for you.

## How to upload these files to GitHub
1. Open your terminal in this project directory (`f:\Documents\projects\weather app`).
2. Run `git init` to initialize a new repository.
3. Run `git add .` to add all your files to the staging area.
4. Run `git commit -m "Initial commit - Weather App"` to commit your changes.
5. Go to [GitHub.com](https://github.com/) and create a new repository (do not add a README, gitignore, or license on GitHub).
6. Copy the repo URL (e.g., `https://github.com/yourusername/weather-app.git`).
7. Back in your terminal, run: `git remote add origin https://github.com/yourusername/weather-app.git`
8. Run `git branch -M main` (if not already main).
9. Run `git push -u origin main` to upload the files.
