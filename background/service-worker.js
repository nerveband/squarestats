try {
  importScripts('../lib/jszip.min.js');
} catch (e) {
  console.error('SquareStats: Failed to load JSZip', e);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_CSV') {
    const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(message.csv);
    chrome.downloads.download({
      url: dataUrl,
      filename: message.filename,
      saveAs: true,
    });
  }

  if (message.type === 'DOWNLOAD_ZIP') {
    if (typeof JSZip === 'undefined') {
      console.error('SquareStats: JSZip not loaded');
      return;
    }
    const zip = new JSZip();
    for (const file of message.files) {
      zip.file(file.name, file.content);
    }
    zip.generateAsync({ type: 'base64' }).then(base64 => {
      chrome.downloads.download({
        url: 'data:application/zip;base64,' + base64,
        filename: message.zipName,
        saveAs: true,
      });
    });
  }
});
