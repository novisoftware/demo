// 度分秒を10進数に変換
function convertDMSToDD(degrees, minutes, seconds, direction) {
    let dd = degrees + minutes/60 + seconds/3600;
    if (direction === 'S' || direction === 'W') {
        dd = -dd;
    }
    return dd;
}

// 10進数を度分秒に変換
function convertDDToDMS(dd) {
    const deg = Math.floor(Math.abs(dd));
    const minFloat = (Math.abs(dd) - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = (minFloat - min) * 60;
    return {
        degrees: deg,
        minutes: min,
        seconds: sec.toFixed(2)
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const locationInfo = document.getElementById('location-info');
    const mapLinks = document.getElementById('map-links');

    // ドラッグ&ドロップイベントの処理
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        });
    });

    // ファイルドロップの処理
    dropZone.addEventListener('drop', handleDrop);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/jpeg')) {
                handleImageFile(file);
            } else {
                alert('JPEGファイルのみ対応しています。');
            }
        }
    }

    // ドラッグ&ドロップされた画像の処理
    function handleImageFile(file) {
        locationInfo.textContent = 'EXIF情報を読み込んでいます...';
        mapLinks.innerHTML = '';

        EXIF.getData(file, function() {
            const exifData = EXIF.getAllTags(this);
            if (exifData.GPSLatitude && exifData.GPSLongitude) {
                processGPSData(exifData);
            } else {
                locationInfo.textContent = '位置情報が見つかりませんでした。';
            }
        });
    }

    function processGPSData(exifData) {
        // 緯度の計算
        const latDeg = exifData.GPSLatitude[0];
        const latMin = exifData.GPSLatitude[1];
        const latSec = exifData.GPSLatitude[2];
        const latDir = exifData.GPSLatitudeRef;
        const latitude = convertDMSToDD(latDeg, latMin, latSec, latDir);

        // 経度の計算
        const lonDeg = exifData.GPSLongitude[0];
        const lonMin = exifData.GPSLongitude[1];
        const lonSec = exifData.GPSLongitude[2];
        const lonDir = exifData.GPSLongitudeRef;
        const longitude = convertDMSToDD(lonDeg, lonMin, lonSec, lonDir);

        // 表示用のテキスト作成
        const dmsLat = `${latDeg}°${latMin}'${latSec.toFixed(2)}"${latDir}`;
        const dmsLon = `${lonDeg}°${lonMin}'${lonSec.toFixed(2)}"${lonDir}`;
        const ddLat = latitude.toFixed(6);
        const ddLon = longitude.toFixed(6);

        // 情報表示
        locationInfo.innerHTML = `
            <p><strong>度分秒</strong></p>
            <p>緯度： ${dmsLat}</p>
            <p>経度: ${dmsLon}</p>
            <p><strong>10進</strong></p>
            <p>緯度 ${ddLat}</p>
            <p>経度: ${ddLon}</p>
        `;

        // 地図リンクの生成
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;

        mapLinks.innerHTML = `
            <a href="${googleMapsUrl}" target="_blank" class="map-link">Google Mapsで表示</a>
            <a href="${osmUrl}" target="_blank" class="map-link">OpenStreetMapで表示</a>
        `;
    }
});