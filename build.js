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

        const config = JSON.parse(await fs.readFile(__dirname + "/static/config.json", "utf-8"));
        // config changes
        config.defaultsettings["wisp-url"] = process.env.WISP_URL || "wss://anura.pro/"; // Wisp server in lieu of vercel supporting one
        await fs.writeFile(__dirname + "/static/config.json", JSON.stringify(config)); // save config
    }
}
setup();
