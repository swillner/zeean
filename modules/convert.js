var child_process = require("child_process");

module.exports = function (app) {
    app.post("/convertsvg", function (req, res) {
        var cairosvg = child_process.spawn("cairosvg", ["-", "-f", req.body.format == "png" ? "png" : "pdf"]);
        if (req.body.format=="png") {
            res.setHeader("Content-Type", "image/png");
        } else {
            res.setHeader("Content-Type", "application/pdf");
        }
        res.setHeader("Content-Disposition", "attachment; filename=\"" + req.body.filename + "\"");
        cairosvg.stdout.pipe(res);
        cairosvg.stdin.end(req.body.data);
    });
};

