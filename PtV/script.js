// Initialize map
const map = L.map('map').setView([20, 0], 2);

// Add base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load data
fetch('data/places.json')
  .then(response => response.json())
  .then(data => {
    window.allPlaces = data;
    renderData(data);
  })
  .catch(err => console.error("Error loading data:", err));

// Render markers + table
function renderData(places) {
  const tbody = document.querySelector('#placesTable tbody');
  tbody.innerHTML = '';

  if (window.markerLayer) map.removeLayer(window.markerLayer);
  const markers = [];

  places.forEach(place => {
    const { Name, Popularity, Latitude, Longitude } = place;

    if (!Latitude || !Longitude) return; // Skip invalid entries

    const marker = L.marker([Latitude, Longitude]).bindPopup(
      `<strong>${Name}</strong><br>Popularity: ${Popularity || "N/A"}`
    );
    markers.push(marker);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${Name}</td>
      <td>${Popularity || "N/A"}</td>
      <td>${Latitude.toFixed(4)}</td>
      <td>${Longitude.toFixed(4)}</td>
    `;
    tbody.appendChild(row);
  });

  window.markerLayer = L.layerGroup(markers).addTo(map);
}

// Filter by Popularity
document.getElementById('popularityFilter').addEventListener('change', e => {
  const value = e.target.value;
  if (value === 'all') renderData(window.allPlaces);
  else {
    const filtered = window.allPlaces.filter(p => p.Popularity === value);
    renderData(filtered);
  }
});
