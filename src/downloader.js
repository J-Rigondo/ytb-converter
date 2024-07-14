const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const ytdl = require("@distube/ytdl-core");
const log = require('electron-log');
const {app} = require('electron');

ffmpeg.setFfmpegPath(ffmpegPath);

async function downloadVideo({url, quality}) {
    try {
        const homeDir = app.getPath('home');
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title;
        const output = path.join(homeDir, 'Downloads', `${Date.now()}.mp3`);

        const audioStream = ytdl(url, {filter: 'audioonly'});

        await new Promise((resolve, reject) => {
            ffmpeg(audioStream)
                .audioBitrate(quality)
                .save(output)
                .on('end', () => {
                    console.log('finish ffmPeg')
                    resolve(output);
                })
                .on('error', (err) => {
                    log.error(err);
                    reject(err);
                });
        });

        return ` ${title}: ${output}`;
    } catch (e) {
        console.error(e);
        log.error(e);
        throw e;
    }

}

module.exports = {downloadVideo};
