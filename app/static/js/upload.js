const uploadFile = document.getElementById('upload-file');
const mapDiv = document.getElementById('map');
const datetime = document.getElementById('datetime');
const civicPledge = document.getElementById('civic-pledge');
const uploadBtn = document.getElementById('upload-btn');
const uploadTab = document.getElementById('upload-tab');

let map;
let marker;
let mapInitialized = false; // Flag to prevent re-initialization

function initMap() {
    // Define map layers
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    });

    const initializeMapView = (lat, lon, zoom) => {
        // Initialize the map with the satellite layer as default
        map = L.map(mapDiv, {
            center: [lat, lon],
            zoom: zoom,
            layers: [satelliteLayer] // Default layer
        });

        // Layer control
        const baseMaps = {
            "Satellite": satelliteLayer,
            "Street": streetLayer
        };

        L.control.layers(baseMaps).addTo(map);

        // Use a small timeout to ensure the map container is visible and has dimensions
        setTimeout(() => {
            map.invalidateSize();
        }, 10);

        map.on('click', function(e) {
            if (marker) {
                map.removeLayer(marker);
            }
            marker = L.marker(e.latlng).addTo(map);
            validateForm();
        });
        mapInitialized = true;
    };

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Success: Center map on user's location with a high zoom level
                initializeMapView(position.coords.latitude, position.coords.longitude, 18);
            },
            (error) => {
                // Error or permission denied: Fallback to default location
                console.warn('Geolocation failed or was denied. Defaulting to Kolkata.', error);
                initializeMapView(22.5726, 88.3639, 13);
            }
        );
    } else {
        // Geolocation not supported: Fallback to default location
        console.error("Geolocation is not supported by this browser.");
        initializeMapView(22.5726, 88.3639, 13);
    }
}

function validateForm() {
    const file = uploadFile.files[0];
    const dt = datetime.value;
    const pledge = civicPledge.checked;
    const loc = marker;

    if (file && dt && pledge && loc) {
        uploadBtn.disabled = false;
    } else {
        uploadBtn.disabled = true;
    }
}

// Event listener for when the upload tab is shown
uploadTab.addEventListener('shown.bs.tab', (event) => {
  if (!mapInitialized) {
    initMap();
  }
});

uploadFile.addEventListener('change', validateForm);
datetime.addEventListener('change', validateForm);
civicPledge.addEventListener('change', validateForm);

uploadBtn.addEventListener('click', () => {
    const file = uploadFile.files[0];
    const dt = datetime.value;
    const latlng = marker.getLatLng();

    const formData = new FormData();
    formData.append('image', file);
    formData.append('mode', 'upload');
    formData.append('lat', latlng.lat);
    formData.append('lon', latlng.lng);
    formData.append('timestamp', dt);

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
});
