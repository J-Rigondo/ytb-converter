const { ipcRenderer, shell} = require('electron');


const urlInput = document.getElementById('youtube-url')
const qualitySelect = document.getElementById('quality');
const convertBtn = document.getElementById('convert-button');
const statusText = document.getElementById('status-text');
const errorText = document.getElementById('error-text');
const downloadBtn = document.getElementById('download-btn');
const removeIcon = document.getElementById('remove-icon');
removeIcon.style.display = 'none';

convertBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    const quality = qualitySelect.value;
    errorText.textContent = '';

    if (!url || !isValidUrl(url) || !quality) {
        errorText.textContent = '올바른 링크를 입력해주세요.'
        return;
    }

    ipcRenderer.send('convert', {url, quality});
    statusText.textContent = 'Converting...';
});

urlInput.addEventListener('input', ev => {
    if (!ev.target.value.trim()) {
        convertBtn.disabled = true;
        removeIcon.style.display = 'none';
    } else {
        convertBtn.disabled = false;
        removeIcon.style.display = 'inline';

    }
})

downloadBtn.addEventListener('click', () => {
    ipcRenderer.send('downloadOpen');
});

removeIcon.addEventListener('click', () => {
    urlInput.value = '';
    removeIcon.style.display = 'none';
});

ipcRenderer.on('convert-success', (event, filePath) => {
    document.getElementById('status-text').innerHTML = `변환에 성공했어요!<br>${filePath}`;
});

ipcRenderer.on('convert-failure', (event, errorMessage) => {
    document.getElementById('error-text').innerHTML = `변환에 실패했어요!<br>사유: ${errorMessage}`;
});

ipcRenderer.on('downloadOpen', (event, downloadPath) => {
    shell.openPath(downloadPath);
});

function isValidUrl(url) {
    try {
        new URL(url)
        return true;
    } catch (e) {
        return false;
    }
}
