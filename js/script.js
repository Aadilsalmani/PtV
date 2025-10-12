console.time('loadTime');

const map = L.map('map').setView([28.6139, 77.2090], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const tableBody = document.querySelector('#places-table tbody');
let allPlaces = [];
let markers = [];
let userLat, userLon;

// Haversine distance (km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Load data
fetch('data/tourist_data.json')
  .then(res => res.json())
  .then(data => {
    allPlaces = data;
    locateUser();
  });

// Locate user
function locateUser() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        map.setView([userLat, userLon], 12);
        L.marker([userLat, userLon]).addTo(map).bindPopup("You are here").openPopup();
        applyFilters(); // Default filters
      },
      err => {
        alert('Location access denied. Showing all data.');
        applyFilters(); // fallback
      }
    );
  } else {
    alert('Geolocation not supported');
    applyFilters();
  }
}

// Apply filters and render
function applyFilters() {
  const selectedPopularity = Array.from(document.querySelectorAll('.pop-check:checked')).map(cb => cb.value);
  const distanceValue = document.getElementById('distanceFilter').value;
  tableBody.innerHTML = '';
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  let filtered = allPlaces.filter(p => {
    if (!p.Latitude || !p.Longitude) return false;
    let include = true;

    if (userLat && userLon)
      p.Distance = getDistance(userLat, userLon, p.Latitude, p.Longitude);
    else
      p.Distance = null;

    if (!selectedPopularity.includes(p.Popularity)) include = false;
    if (distanceValue !== "All" && p.Distance !== null && p.Distance > parseFloat(distanceValue)) include = false;

    return include;
  });

  if (userLat && userLon) filtered.sort((a, b) => a.Distance - b.Distance);

  const visible = filtered.slice(0, 200);

  visible.forEach(p => {
    const marker = L.marker([p.Latitude, p.Longitude]).addTo(map);
    marker.bindPopup(
      `<b>${p.Name}</b><br>${p.Category}<br>${p.Popularity}<br>${p.Distance ? p.Distance.toFixed(2)+' km' : ''}`
    );
    markers.push(marker);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.Name}</td>
      <td>${p.Category}</td>
      <td>${p.Popularity}</td>
      <td>${p.Distance ? p.Distance.toFixed(2) : '-'}</td>
    `;
    row.addEventListener('click', () => {
      map.setView([p.Latitude, p.Longitude], 14);
      marker.openPopup();
    });
    tableBody.appendChild(row);
  });

  document.getElementById('loading-overlay').style.display = 'none';
  console.timeEnd('loadTime');
}

// Listen to checkbox and dropdown changes
document.querySelectorAll('.pop-check').forEach(cb => cb.addEventListener('change', applyFilters));
document.getElementById('distanceFilter').addEventListener('change', applyFilters);

// Activate Lucide icons
lucide.createIcons();

// Filter toggle & overlay logic
const filterToggle = document.getElementById('filter-toggle');
const filterBar = document.getElementById('filter-bar');
const filterOverlay = document.getElementById('filter-overlay');

filterToggle.addEventListener('click', () => {
  const isVisible = filterBar.classList.toggle('show');
  filterOverlay.style.display = isVisible ? 'block' : 'none';
});

filterOverlay.addEventListener('click', () => {
  filterBar.classList.remove('show');
  filterOverlay.style.display = 'none';
});

// Register service worker for PWA (if exists)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker registered'))
    .catch(err => console.error('SW registration failed:', err));
}
