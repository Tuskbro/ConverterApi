const express = require('express');
const fs = require("fs");
const ffmpeg = require('fluent-ffmpeg');
const  bodyParser = require('body-parser');
const expressFileUpload = require('express-fileupload');

const app = express();



console.log(ffmpeg);

app.use(bodyParser.urlencoded({extend: false}));

app.use(bodyParser.json());

app.use(
    expressFileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
    })
);

app.get('/', function (req,res) {
    res.sendfile(__dirname + '/index.html');

})

app.post('/convert', (req,res)=>{
    let to = req.body.to
    let file = req.files.file
    let fileName = `output.${to}`
    console.log(to)
    console.log(file)

    file.mv("tmp/" + file.name, function (err) {
        if (err) return res.sendStatus(500).send(err);
        console.log("File Uploaded successfully");
    });

    ffmpeg("tmp/" + file.name)
        .withOutputFormat(to)
        .on("end", function (stdout, stderr) {
            console.log("Finished");
            res.download(__dirname + fileName, function (err) {
                if (err) throw err;

                fs.unlink(__dirname + fileName, function (err) {
                    if (err) throw err;
                    console.log("File deleted");
                });
            });
            fs.unlink("tmp/" + file.name, function (err) {
                if (err) throw err;
                console.log("File deleted");
            });
        })
        .on("error", function (err) {
            console.log("an error happened: " + err.message);
            fs.unlink("tmp/" + file.name, function (err) {
                if (err) throw err;
                console.log("File deleted");
            });
        })
        .saveToFile(__dirname + fileName);
});


app.listen(3000, function () {
    console.log('Server ready');
})