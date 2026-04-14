const fs = require("fs/promises");
const extract = require('extract-zip');

async function setup() {
    try {
        await fs.access("static/")
        console.log("Anura already installed")
    } catch(e) {
        console.log("Anura static not installed, downloading")
        const response = await fetch("https://github.com/MercuryWorkshop/anuraOS/releases/download/latest/anura.zip");
        if (!response.ok) {
            throw new Error(`Failed to download anura.zip: HTTP ${response.status} ${response.statusText}`);
        }
        await fs.writeFile("static.zip", Buffer.from(await response.arrayBuffer()));
        await fs.mkdir("static");
        console.log("Extracting to " + __dirname + "/static")
        await extract("static.zip", { dir: __dirname + "/static" });

        // The service worker imports Filesystem.js and LocalFS.js from /lib/api/,
        // but the release zip places them in /lib/api/filesystem/. Copy them to
        // the expected paths so the SW can evaluate successfully.
        const filesToCopy = [
            { src: "lib/api/filesystem/Filesystem.js", dest: "lib/api/Filesystem.js" },
            { src: "lib/api/filesystem/LocalFS.js", dest: "lib/api/LocalFS.js" },
        ];
        for (const { src, dest } of filesToCopy) {
            const srcPath = __dirname + "/static/" + src;
            const destPath = __dirname + "/static/" + dest;
            try {
                await fs.access(srcPath);
                await fs.copyFile(srcPath, destPath);
                console.log("Copied " + src + " -> " + dest);
            } catch {
                console.warn("Warning: " + src + " not found in release, skipping copy");
            }
        }

        const config = JSON.parse(await fs.readFile(__dirname + "/static/config.json", "utf-8"));
        // config changes
        config.defaultsettings["wisp-url"] = process.env.WISP_URL || "wss://anura.pro/"; // Wisp server in lieu of vercel supporting one
        await fs.writeFile(__dirname + "/static/config.json", JSON.stringify(config)); // save config
    }
}
setup();
