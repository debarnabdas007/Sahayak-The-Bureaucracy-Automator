const video = document.getElementById('video');
const snap = document.getElementById('snap');
const canvas = document.getElementById('canvas');
const latSpan = document.getElementById('lat');
const lonSpan = document.getElementById('lon');
const timestampSpan = document.getElementById('timestamp');
const livePledge = document.getElementById('live-pledge');
const analyzeBtn = document.getElementById('analyze-btn');

const constraints = {
    audio: false,
    video: {
        width: 1280, height: 720
    }
};

let stream;
let photoTaken = false;

async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.style.display = 'block';
        canvas.style.display = 'none';
        photoTaken = false;
        livePledge.checked = false;
        validateLiveForm();
    } catch (e) {
        console.error(e);
        alert("Camera access is required for Live Mode. Please allow access and try again.");
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    latSpan.textContent = position.coords.latitude;
    lonSpan.textContent = position.coords.longitude;
    timestampSpan.textContent = new Date().toLocaleString();
}

function validateLiveForm() {
    if (photoTaken && livePledge.checked) {
        analyzeBtn.disabled = false;
    } else {
        analyzeBtn.disabled = true;
    }
}

snap.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    video.style.display = 'none';
    canvas.style.display = 'block';
    photoTaken = true;
    validateLiveForm();
});

livePledge.addEventListener('change', validateLiveForm);

analyzeBtn.addEventListener('click', () => {
    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append('image', blob, 'live-capture.png');
        formData.append('mode', 'live');
        formData.append('lat', latSpan.textContent);
        formData.append('lon', lonSpan.textContent);
        formData.append('timestamp', timestampSpan.textContent);

        fetch('/analyze', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const queryParams = new URLSearchParams({
                category: data.category,
                severity: data.severity,
                draft_en: data.draft_en,
                draft_bn: data.draft_bn
            });
            window.location.href = `/review?${queryParams.toString()}`;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }, 'image/png');
});


// Start camera when Live Mode is shown, stop when hidden
document.getElementById('live-tab').addEventListener('shown.bs.tab', () => {
    initCamera();
    getLocation();
});

document.getElementById('upload-tab').addEventListener('shown.bs.tab', stopCamera);