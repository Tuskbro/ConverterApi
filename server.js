const express = require('express');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const readline = require('readline');
const  bodyParser = require('body-parser');
const ffmpeg_static = require('ffmpeg-static');
const cp = require('child_process');
const Sync = require('sync');

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

app.post('/VideoConvert', (req,res)=>{
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


app.post('/SplitAudio', (req,res)=>{
    res.contentType('video/avi');
    res.attachment('output.mp3');
    let file = req.files.file
    file.mv("tmp/" + file.name, function (err) {
        if (err) return res.sendStatus(500).send(err);
        console.log("File Uploaded successfully");
    });

    ffmpeg('tmp/'+ req.files.file.name)
        .toFormat('mp3')
        .on('end', function () {
            console.log('Done')
        })
        .on('error', function (error) {
            console.log('An error detected' + error.message);
        })
        .pipe(res,{end:true})
});

app.post('/AudioConvert' ,(req,res)=>{

    let to = req.body.to;
    res.contentType('audio');

    res.attachment('output'+to);
    let file = req.files.file;
    file.mv("tmp/" + file.name, function (err) {
        if (err) return res.sendStatus(500).send(err);
        console.log("File Uploaded successfully");
    });

    ffmpeg('tmp/'+ req.files.file.name)
        .toFormat(to)
        .on('end', function () {
            console.log('Done')
        })
        .on('error', function (error) {
            console.log('An error detected' + error.message);
        })
        .pipe(res,{end:true})
});


const ytdl = require('ytdl-core');
const tracker = {
    start: Date.now(),
    audio: { downloaded: 0, total: Infinity },
    video: { downloaded: 0, total: Infinity },
    merged: { frame: 0, speed: '0x', fps: 0 },
};


app.post('/YouTubeDownloader' ,(req,res)=> {
    let to = req.body.to

    let fileName = `output.${to}`
    console.log(to.name)


    let ref = req.body.url;


// Get audio and video stream going
var video = fs.createWriteStream('tmp/video.mp4');
     ytdl(ref, {filter: format => format.container === 'mp4'})
        .pipe(video)

    video.on('finish', ()=>{
        console.log('download')
        ffmpeg("tmp/video.mp4")
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
                fs.unlink("tmp/video.mp4", function (err) {
                    if (err) throw err;
                    console.log("File deleted");
                });
            })
            .on("error", function (err) {
                console.log("an error happened: " + err.message);
                fs.unlink("tmp/video.mp4", function (err) {
                    if (err) throw err;
                    console.log("File deleted");
                });
            })
            .saveToFile(__dirname + fileName);
    })










});

app.listen(3000, function () {
    console.log('Server ready');
})