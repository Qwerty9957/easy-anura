const express = require("express");
const cors = require("cors");
const { routeRequest } = require("wisp-server-node");
const path = require("path");

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());

// Cross-origin isolation headers required for SharedArrayBuffer (used by v86)
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
});

app.use(express.static(path.join(__dirname, "static")));

const server = app.listen(port, () => {
    console.log("AnuraOS listening on port " + port);
});

server.on("upgrade", (req, socket, head) => {
    routeRequest(req, socket, head);
});
