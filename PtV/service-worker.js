<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tourist Explorer</title>

  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>

  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    #map { flex: 1; height: 50%; }
    #table-container {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      background: #f7f7f7;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
      text-align: left;
    }
    th {
      background-color: #0078d7;
      color: white;
    }
  </style>
</head>
<body>

  <div id="map"></div>

  <div id="table-container">
    <table id="places-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Popularity</th>
          <th>Distance (km)</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>

  <!-- Leaflet JS -->
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

  <script>
    const map = L.map('map').setView([28.6139, 77.2090], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const tableBody = document.querySelector('#places-table tbody');
    let markers = [];

    // Haversine distance (in km)
    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Radius of Earth (km)
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    // Fetch and parse CSV
    fetch('data/tourist_data.csv')
      .then(response => response.text())
      .then(csvText => Papa.parse(csvText, { header: true, skipEmptyLines: true }))
      .then(results => {
        const places = results.data;
        locateUser(places);
      });

    function locateUser(places) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            map.setView([userLat, userLon], 12);
            L.marker([userLat, userLon]).addTo(map).bindPopup("You are here").openPopup();
            displayNearestPlaces(places, userLat, userLon);
          },
          () => {
            alert('Location access denied. Showing all places.');
            displayNearestPlaces(places);
          }
        );
      } else {
        alert('Geolocation not supported');
        displayNearestPlaces(places);
      }
    }

    function displayNearestPlaces(places, userLat, userLon) {
      tableBody.innerHTML = '';
      markers.forEach(m => map.removeLayer(m));
      markers = [];

      let placesWithDistance = places.map(p => {
        if (userLat && userLon && p.Latitude && p.Longitude) {
          p.Distance = getDistance(userLat, userLon, parseFloat(p.Latitude), parseFloat(p.Longitude));
        } else {
          p.Distance = null;
        }
        return p;
      });

      // Sort by distance if available
      if (userLat && userLon) {
        placesWithDistance.sort((a, b) => a.Distance - b.Distance);
      }

      placesWithDistance.forEach(p => {
        const { Name, Category, Popularity, Latitude, Longitude, Distance } = p;
        if (!Latitude || !Longitude) return;

        const marker = L.marker([parseFloat(Latitude), parseFloat(Longitude)]).addTo(map);
        marker.bindPopup(`<b>${Name}</b><br>${Category}<br>${Popularity}<br>${Distance ? Distance.toFixed(2) + ' km' : ''}`);
        markers.push(marker);

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${Name}</td>
          <td>${Category}</td>
          <td>${Popularity}</td>
          <td>${Distance ? Distance.toFixed(2) : '-'}</td>
        `;
        row.addEventListener('click', () => {
          map.setView([parseFloat(Latitude), parseFloat(Longitude)], 14);
          marker.openPopup();
        });
        tableBody.appendChild(row);
      });
    }
  </script>
</body>
</html>
