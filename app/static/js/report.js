document.addEventListener('DOMContentLoaded', function () {
    // --- DOM Element References ---
    const reportStep1 = document.getElementById('report-step-1');
    const reportStep2 = document.getElementById('report-step-2');
    const loading = document.getElementById('loading');
    const step1Prompt = document.getElementById('step-1-prompt');

    // Step 1 Elements
    const initialChoiceButtons = document.getElementById('initial-choice-buttons');
    const liveCaptureBtn = document.getElementById('live-capture-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const imageUploadInput = document.getElementById('image-upload-input');
    const liveCameraView = document.getElementById('live-camera-view');
    const cameraVideo = document.getElementById('camera-video');
    const captureBtn = document.getElementById('capture-btn');
    const cancelCameraBtn = document.getElementById('cancel-camera-btn');
    const cameraCanvas = document.getElementById('camera-canvas');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const nextStepBtn = document.getElementById('next-step-btn');
    const tryAgainBtn = document.getElementById('try-again-btn');

    // Step 2 Elements
    const mapContainer = document.getElementById('map');
    const locationStatus = document.getElementById('location-status');
    const confirmLocationBtn = document.getElementById('confirm-location-btn');

    // --- State Management ---
    let imageData = null;
    let mediaStream = null;
    let map = null;
    let marker = null;
    const KOLKATA_COORDS = [22.5726, 88.3639]; // Default fallback

    // --- Core Functions ---

    function resetUI() {
        stopCamera();
        reportStep1.style.display = 'block';
        reportStep2.style.display = 'none';
        loading.style.display = 'none';
        imagePreviewContainer.style.display = 'none';
        liveCameraView.style.display = 'none';
        initialChoiceButtons.style.display = 'grid';
        step1Prompt.textContent = 'How would you like to provide an image of the issue?';
        imageData = null;
        imageUploadInput.value = '';
        if (map) {
            map.remove();
            map = null;
            marker = null;
        }
    }

    async function startCamera() {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            cameraVideo.srcObject = mediaStream;
            initialChoiceButtons.style.display = 'none';
            liveCameraView.style.display = 'block';
            step1Prompt.textContent = 'Point your camera at the issue and capture.';
        } catch (error) {
            console.error("Error accessing camera: ", error);
            alert('Could not access the camera. Please ensure you grant permission.');
            resetUI();
        }
    }

    function stopCamera() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        liveCameraView.style.display = 'none';
    }

    function showImagePreview(imageFile) {
        imageData = imageFile;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            stopCamera();
            initialChoiceButtons.style.display = 'none';
            imagePreviewContainer.style.display = 'block';
            step1Prompt.textContent = 'Confirm your image to proceed.';
        };
        reader.readAsDataURL(imageFile);
    }

    function setupMap(coords, zoom) {
        reportStep1.style.display = 'none';
        reportStep2.style.display = 'block';

        // Delay to ensure container is visible and rendered
        setTimeout(() => {
            // Define map layers
            const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            });

            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            });

            const baseMaps = {
                "Street View": streetLayer,
                "Satellite View": satelliteLayer
            };

            if (!map) {
                map = L.map(mapContainer, {
                    center: coords,
                    zoom: zoom,
                    layers: [streetLayer] // Default layer
                });
                L.control.layers(baseMaps).addTo(map);

                // **NEW**: Handle map clicks for moving the marker
                map.on('click', function(e) {
                    const clickedCoords = e.latlng;
                    marker.setLatLng(clickedCoords);
                    locationStatus.textContent = `Marker moved to: ${clickedCoords.lat.toFixed(5)}, ${clickedCoords.lng.toFixed(5)}`;
                });
            }
            
            map.setView(coords, zoom);
            map.invalidateSize(); // Important for proper rendering

            if (!marker) {
                // Marker is no longer draggable by default
                marker = L.marker(coords).addTo(map);
            } else {
                marker.setLatLng(coords);
            }

        }, 150); 
    }

    function requestLocationAndSetupMap() {
        locationStatus.textContent = 'Requesting your location...';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userCoords = [position.coords.latitude, position.coords.longitude];
                // **UPDATED**: Changed instruction text
                locationStatus.innerHTML = `<strong>Location found!</strong> Tap on the map to pinpoint the exact spot.`;
                setupMap(userCoords, 19);
            },
            (error) => {
                console.warn(`Geolocation error (${error.code}): ${error.message}`);
                // **UPDATED**: Changed instruction text
                locationStatus.innerHTML = `<strong>Location access denied.</strong> Tap on the map to place the marker correctly.`;
                setupMap(KOLKATA_COORDS, 12);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 } // High accuracy options
        );
    }

    function analyzeData() {
        const finalCoords = marker.getLatLng();
        reportStep2.style.display = 'none';
        loading.style.display = 'block';

        const formData = new FormData();
        formData.append('image', imageData);
        formData.append('lat', finalCoords.lat);
        formData.append('lon', finalCoords.lng);

        fetch('/analyze', { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                const params = new URLSearchParams({
                    category: data.category,
                    severity: data.severity,
                    draft_en: data.draft_en,
                    draft_bn: data.draft_bn
                }).toString();
                window.location.href = `/review?${params}`;
            })
            .catch(error => {
                console.error('Analysis Error:', error);
                loading.style.display = 'none';
                alert(`An unexpected error occurred during analysis: ${error.message}`);
                resetUI();
            });
    }

    // --- Event Listeners ---
    liveCaptureBtn.addEventListener('click', startCamera);
    uploadBtn.addEventListener('click', () => imageUploadInput.click());
    imageUploadInput.addEventListener('change', (e) => e.target.files[0] && showImagePreview(e.target.files[0]));
    cancelCameraBtn.addEventListener('click', resetUI);
    tryAgainBtn.addEventListener('click', resetUI);

    captureBtn.addEventListener('click', () => {
        cameraCanvas.width = cameraVideo.videoWidth;
        cameraCanvas.height = cameraVideo.videoHeight;
        const ctx = cameraCanvas.getContext('2d');
        ctx.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
        cameraCanvas.toBlob((blob) => {
            showImagePreview(new File([blob], "capture.jpg", { type: "image/jpeg" }));
        }, 'image/jpeg');
    });

    nextStepBtn.addEventListener('click', () => {
        if (!imageData) {
            alert('Please provide an image first.');
            return;
        }
        requestLocationAndSetupMap();
    });

    confirmLocationBtn.addEventListener('click', analyzeData);

    // --- Initial Setup ---
    resetUI();
});
