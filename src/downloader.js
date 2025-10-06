const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const log = require('electron-log');
const {app} = require('electron');
const {Readable} = require('stream');

ffmpeg.setFfmpegPath(ffmpegPath);

const isDev = !app.isPackaged;

// --- youtubei.js (ESM) 로더 & 싱글턴 ---
let yt; // Innertube instance
async function getYT() {
    if (yt) return yt;
    // youtubei.js는 ESM이라 CommonJS에서 동적 import 사용
    const mod = await import('youtubei.js');
    const {Innertube, UniversalCache} = mod;
    yt = await Innertube.create({
        player_id: '0004de42', // 없으면 디사이퍼 에러
        cache: new UniversalCache(true),
        lang: 'ko',
        location: 'KR',
        // client_type: 'WEB',
        // retrieve_player: false,
        // device_category: 'desktop',
        enable_session_cache: true,
        generate_session_locally: true,
        // user_agent:`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36`
    }); // 로컬 캐시 사용(선택)
    return yt;
}

function toNodeReadable(stream) {
    // 이미 Node Readable인 경우
    if (stream && typeof stream.pipe === 'function') return stream;
    // WHATWG인 경우
    if (stream && typeof stream.getReader === 'function' && Readable.fromWeb) {
        return Readable.fromWeb(stream);
    }
    throw new Error('Unsupported stream type for ffmpeg input');
}

const safe = s => s
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '') || 'untitled';

async function downloadVideo({videoId, quality}) {
    try {

        // console.log(`videoId=${videoId}`);
        const yt = await getYT();
        const homeDir = app.getPath('home');

        const info = await yt.getBasicInfo(videoId);
        const title = safe(info.basic_info.title);

        // const output = path.join(homeDir, 'Downloads', `${Date.now()}.mp3`);
        const output = path.join(homeDir, 'Downloads', `${title}.mp3`);

        // 오디오 스트림만 요청 (youtubei.js가 복호화/서명 처리해 준 스트림)
        const audioStream = await yt.download(videoId, {
            type: 'audio',   // audio | video | video+audio
            quality: 'best', // 내부 포맷에서 최상 오디오 선택
            format: "webm",
            client: "TV" // 디사이퍼 에러가 발생 안하려면 TV만 가능
        });

        await new Promise((resolve, reject) => {
            ffmpeg(toNodeReadable(audioStream))
                .inputFormat('webm')
                .audioCodec('libmp3lame')
                .audioBitrate(quality)
                .noVideo()
                .format('mp3')
                .outputOptions([
                    '-write_id3v2', '1',
                    '-id3v2_version', '3',
                    // '-metadata', `title=${title}`  // 제목 넣을 때
                ])
                .save(output)
                // .on('start', (cmd) => log.info('[ffmpeg start]', cmd))
                .on('end', () => {
                    resolve(output);
                })
                .on('error', (err, stdout, stderr) => {
                    log.error('[ffmpeg error]', err?.message || err);
                    if (isDev && stdout) log.error('[ffmpeg stdout]', String(stdout));
                    if (isDev && stderr) log.error('[ffmpeg stderr-last]', String(stderr));
                    reject(err);
                })
            ;
        });

        return ` ${title}: ${output}`;
    } catch (e) {
        if (isDev) log.error(e);
        throw e;
    }

}

module.exports = {downloadVideo};
