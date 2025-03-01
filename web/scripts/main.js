document.addEventListener('DOMContentLoaded', () => {
    // View switching
    const viewButtons = document.querySelectorAll('.control-button[data-view]');
    const views = document.querySelectorAll('.view');
    const coordinates = document.querySelector('.coordinates');

    // Initialize map view by default
    initializeMap();

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update button states
            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update view visibility
            const targetView = button.dataset.view;
            views.forEach(view => {
                if (view.id === `${targetView}-view`) {
                    view.classList.add('active');

                    if (targetView === 'map') {
                        // Reconstruct map view structure
                        const mapView = document.querySelector('#map-view');
                        mapView.innerHTML = '<svg id="map"></svg><div class="coordinates">LAT: -- N LON: -- W</div>';

                        // Initialize map view
                        initializeMap();

                        // Show coordinates for map view
                        if (coordinates) {
                            coordinates.style.display = 'block';
                            coordinates.textContent = 'LAT: -- N LON: -- W';
                        }
                    } else if (targetView === 'profile') {
                        // First, remove all D3 bindings and elements
                        d3.selectAll('#map-view *').remove();
                        d3.selectAll('#map').remove();

                        // Then clear both views completely
                        const mapView = document.querySelector('#map-view');
                        const profileView = document.querySelector('#profile-view');
                        mapView.innerHTML = '';
                        profileView.innerHTML = '';

                        // Hide coordinates
                        if (coordinates) {
                            coordinates.style.display = 'none';
                        }
                    }
                } else {
                    view.classList.remove('active');
                }
            });
        });
    });

    // Time slider
    const timeSlider = document.querySelector('.time-slider');
    const yearDisplays = document.querySelectorAll('.year-display');
    const historicalDates = [1693, 1753, 1831, 1851, 1911];

    timeSlider.addEventListener('input', () => {
        const index = parseInt(timeSlider.value);
        const year = historicalDates[index];
        yearDisplays[0].textContent = year;
        // Trigger map/profile update with new year
        updateVisualization(year);
    });
});

function updateVisualization(year) {
    // This function will be implemented to update both map and profile views
    console.log(`Updating visualization for year: ${year}`);
} 