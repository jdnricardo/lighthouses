// Debug flag - set to true to use placeholder data
const DEBUG = true;

// Define target years for time series data
const TARGET_YEARS = [1693, 1753, 1831, 1851, 1911];

// Add proj4js to your HTML:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.9.0/proj4.js"></script>

// Check if required libraries are loaded
function checkDependencies() {
    if (typeof proj4 === 'undefined') {
        console.error('proj4 library not loaded');
        return false;
    }
    if (typeof Highcharts === 'undefined') {
        console.error('Highcharts library not loaded');
        return false;
    }
    return true;
}

// Only define proj4 if it's loaded
function initializeProj4() {
    if (typeof proj4 !== 'undefined') {
        proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs');
        proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
    }
}

// Function to convert BNG to WGS84
function convertBNGtoWGS84(easting, northing) {
    if (typeof proj4 === 'undefined') {
        console.error('proj4 not loaded, returning original coordinates');
        return { lat: 0, lon: 0 };
    }
    const [lon, lat] = proj4('EPSG:27700', 'EPSG:4326', [easting, northing]);
    return { lat, lon };
}

// Modify your data loading function
async function loadLighthouseData() {
    if (!checkDependencies()) {
        console.error('Required libraries not loaded');
        return [];
    }

    const isDebug = DEBUG;
    console.log('Debug mode:', isDebug);

    // Use relative paths from the current page
    const dataPath = isDebug ?
        'static/data/placeholder_lighthouse_data.json' :
        'static/data/lighthouse_data.json';

    console.log('Attempting to load:', dataPath);

    try {
        const response = await fetch(dataPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Response received:', response.status);

        const data = await response.json();
        console.log('Data loaded:', data.length, 'lighthouses');

        if (isDebug) {
            // Modify some of the placeholder data to have no time series
            return data.map(lighthouse => {
                // Remove data for specific lighthouses (e.g., first and last in the set)
                if (lighthouse.name === 'South Stack' || lighthouse.name === 'Eddystone') {
                    return {
                        ...lighthouse,
                        reach: [],
                        lights: []
                    };
                }
                return lighthouse;
            });
        }

        if (!isDebug) {
            // Take every 5th lighthouse instead of random sampling
            const sampledData = data.filter((_, index) => index % 5 === 0)
                .map(lighthouse => {
                    const coords = convertBNGtoWGS84(lighthouse.easting, lighthouse.northing);
                    return {
                        ...lighthouse,
                        lat: coords.lat,
                        lon: coords.lon,
                        easting: undefined,
                        northing: undefined
                    };
                });

            console.log('Processed sample size:', sampledData.length);
            return sampledData;
        }

        return data;
    } catch (error) {
        console.error('Error loading lighthouse data:', error);
        console.log('Current page URL:', window.location.href);
        console.log('Attempted data path:', dataPath);
        return [];
    }
}

// Helper function to extract time series data
function extractTimeSeriesData(lighthouse, property) {
    // property will be either 'reach' or 'lights'
    return lighthouse[property] || [];
}

// Add or update these variables at the top of your file
let hoverTimeout = null;
let highlightLock = null;
const HOVER_DELAY = 200; // Reduced from 500ms to 200ms for faster hover response
const LOCK_DURATION = 300; // milliseconds to lock the highlight after triggering

// Add a variable to store pending highlight
let pendingHighlight = null;

// Update the clearAllHighlights function
function clearAllHighlights() {
    // Clear table row highlights
    const highlightedRows = document.querySelectorAll('.highlight-row');
    highlightedRows.forEach(row => {
        row.classList.remove('highlight-row');
        row.classList.remove('highlight-row-from-map');
        row.style.border = 'none';
        row.style.borderTop = '';
        row.style.borderBottom = '';
        row.style.borderLeft = '';
        row.style.borderRight = '';
        row.style.boxShadow = '';
    });

    // Clear map point and data label highlights
    const chart = Highcharts.charts[0];
    if (chart) {
        chart.series[1].points.forEach(point => {
            // Reset point state
            point.setState('');

            // Reset data label color
            if (point.dataLabel) {
                point.dataLabel.css({
                    color: '#2b1810'
                });
            }
        });
    }
}

// Update the setHighlightLock function
function setHighlightLock(lighthouseName) {
    if (highlightLock) {
        clearTimeout(highlightLock);
    }

    // Set the current locked highlight
    highlightLock = setTimeout(() => {
        highlightLock = null;
        // If there's a pending highlight and the mouse is still over it, apply it
        if (pendingHighlight && pendingHighlight.hoverActive) {
            highlightTableRow(pendingHighlight);
        }
        pendingHighlight = null;
    }, LOCK_DURATION);

    // Store the name of the locked lighthouse
    setHighlightLock.currentName = lighthouseName;
}

// Add or update the moveCursor function
function moveCursor(x, y) {
    // Create a hidden input element at the target position
    const temp = document.createElement('input');
    temp.style.position = 'fixed';
    temp.style.left = x + 'px';
    temp.style.top = y + 'px';
    temp.style.opacity = '0';
    temp.style.pointerEvents = 'none';
    document.body.appendChild(temp);

    // Focus and click the element to move the cursor
    temp.focus();
    temp.click();

    // Remove the temporary element
    setTimeout(() => temp.remove(), 100);
}

// Map initialization with separate hover controls
async function initializeMap(data) {
    if (!data || !data.length) {
        console.error('No data provided to initializeMap');
        return;
    }

    console.log('Map initialization starting with', data.length, 'lighthouses');
    console.log('First lighthouse data:', data[0]);

    // Filter and validate coordinates
    const mappedData = data
        .filter(lighthouse => {
            const isValid = typeof lighthouse.lat === 'number' &&
                typeof lighthouse.lon === 'number' &&
                isFinite(lighthouse.lat) &&
                isFinite(lighthouse.lon);
            if (!isValid) {
                console.warn('Invalid coordinates for lighthouse:', lighthouse.name);
            }
            return isValid;
        })
        .map(lighthouse => ({
            name: lighthouse.name,
            // For mappoint series, we need to use geometry or lat/lon directly
            geometry: {
                type: 'Point',
                coordinates: [lighthouse.lon, lighthouse.lat]
            },
            yearBuilt: lighthouse.yearBuilt,
            reach: lighthouse.reach,
            lights: lighthouse.lights
        }));

    console.log('Validated mapped data:', mappedData.length, 'lighthouses');
    if (mappedData.length === 0) {
        console.error('No valid lighthouse data after coordinate validation');
        return;
    }

    try {
        const mapOptions = {
            chart: {
                map: Highcharts.maps['custom/british-isles'],
                width: null,
                height: null,
                animation: false,
                spacing: [10, 10, 10, 10],
                margin: [10, 10, 10, 10],
                backgroundColor: '#f4f1ea',
                style: {
                    backgroundColor: '#f4f1ea'
                },
                plotBackgroundColor: 'transparent',
                events: {
                    load() {
                        const chart = this;

                        // Get position of zoom out button (last button)
                        const zoomButtons = chart.container.getElementsByClassName('highcharts-zoom-out');
                        if (zoomButtons.length > 0) {
                            const zoomOutButton = zoomButtons[0];
                            const buttonRect = zoomOutButton.getBoundingClientRect();
                            const chartRect = chart.container.getBoundingClientRect();

                            // Position reset button below zoom out button
                            const x = 20;  // Match the x offset of zoom buttons
                            const y = 70;  // Position below zoom buttons with a small gap

                            // Create reset button with matching style
                            const resetButton = chart.renderer.button('RESET', x, y, function () {
                                chart.mapZoom();
                            }, {
                                height: 29,        // Match exact height from SVG path (28.5 + 0.5)
                                width: 40,         // Match exact width from SVG path (28.5 + 0.5)
                                padding: 2,        // Remove padding to match zoom buttons exactly
                                fill: 'rgba(255, 255, 255, 0.9)',
                                stroke: '#ccc',
                                'stroke-width': 1,
                                style: {
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    color: '#666'
                                },
                                r: 3              // Match the border radius from SVG path
                            })
                                .addClass('highcharts-map-navigation')
                                .add(chart.zoomGroup);  // Add to zoomGroup instead of mapNavigation.box

                            // Add hover state
                            resetButton.on('mouseover', function () {
                                this.attr({
                                    fill: '#fff'
                                });
                            }).on('mouseout', function () {
                                this.attr({
                                    fill: 'rgba(255, 255, 255, 0.9)'
                                });
                            });

                            // Ensure the button is above other elements
                            resetButton.attr({
                                zIndex: 7  // Same z-index as zoom buttons
                            });
                        }
                    }
                },
                tooltip: {
                    enabled: false  // Disable tooltips globally
                },
                plotOptions: {
                    series: {
                        states: {
                            inactive: {
                                opacity: 1
                            }
                        }
                    }
                }
            },
            mapNavigation: {
                enabled: true,
                buttonOptions: {
                    verticalAlign: 'top',
                    align: 'left',
                    x: 10,
                    y: 10,
                    theme: {
                        fill: 'rgba(255, 255, 255, 0.9)',
                        'stroke-width': 1,
                        stroke: '#ccc',
                        r: 3,
                        states: {
                            hover: {
                                fill: '#fff'
                            }
                        }
                    }
                }
            },
            title: {
                text: 'UK Lighthouses',
                style: {
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#705335',
                    textOutline: '3px solid #f4f1ea',
                    textShadow: '0 0 6px #f4f1ea, 0 0 3px #f4f1ea'
                }
            },
            legend: {
                enabled: false  // Explicitly disable the legend
            },
            series: [{
                mapData: Highcharts.maps['custom/british-isles'],
                name: 'Basemap',
                borderColor: '#4A3721',
                nullColor: '#d4cec0',
                color: 'transparent',
                fillOpacity: 1,
                showInLegend: false,
                enableMouseTracking: false,  // Explicitly disable for basemap
                states: {
                    hover: {
                        enabled: false
                    },
                    normal: {
                        animation: false,
                        opacity: 1
                    }
                }
            }, {
                type: 'mappoint',
                name: 'Lighthouses',
                data: mappedData,
                enableMouseTracking: true,
                stickyTracking: false,  // Prevent sticky hover states
                tooltip: {
                    enabled: false
                },
                marker: {
                    radius: 8,
                    fillColor: 'rgba(112, 83, 53, 0.9)',
                    lineWidth: 1,
                    lineColor: '#A0A0A0',
                    states: {
                        hover: {
                            enabled: true,
                            fillColor: '#8B4513',  // Dark sepia for hover
                            lineColor: '#A0A0A0',
                            lineWidth: 1,
                            animation: {
                                duration: 50
                            }
                        }
                    }
                },
                dataLabels: {
                    enabled: true,
                    format: '{point.name}',
                    style: {
                        fontSize: '14px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        fontWeight: 'bold',
                        textOutline: '3px solid #f4f1ea',
                        color: '#2b1810',
                        textShadow: '0 0 6px #f4f1ea, 0 0 3px #f4f1ea',
                        lineHeight: '14px'
                    }
                },
                point: {
                    events: {
                        mouseOver: function (event) {
                            const point = this;

                            if (highlightLock) {
                                if (setHighlightLock.currentName !== point.name) {
                                    // Store this point as pending
                                    pendingHighlight = point;
                                    point.hoverActive = true;
                                }
                                return;
                            }

                            if (hoverTimeout) {
                                clearTimeout(hoverTimeout);
                            }

                            hoverTimeout = setTimeout(() => {
                                highlightTableRow(point, false);
                            }, HOVER_DELAY);
                        },
                        click: function (event) {
                            const point = this;
                            // Clear any existing timeouts to prevent hover from interfering
                            if (hoverTimeout) {
                                clearTimeout(hoverTimeout);
                            }
                            // Immediately highlight the row and scroll into view, passing true for isClick
                            highlightTableRow(point, true);
                        },
                        mouseOut: function () {
                            const point = this;

                            // Clear the timeout if mouse leaves before delay
                            if (hoverTimeout) {
                                clearTimeout(hoverTimeout);
                                hoverTimeout = null;
                            }

                            // Mark this point as no longer being hovered
                            point.hoverActive = false;

                            // If this was the pending highlight, clear it
                            if (pendingHighlight === point) {
                                pendingHighlight = null;
                            }

                            // Only clear highlights if there's no lock
                            if (!highlightLock) {
                                clearAllHighlights();
                            } else {
                                // If there is a lock, ensure this point stays highlighted if it's the locked one
                                const point = this;
                                if (setHighlightLock.currentName === point.name) {
                                    point.setState('hover');
                                    if (point.dataLabel) {
                                        point.dataLabel.css({
                                            color: '#8B4513'
                                        });
                                    }
                                }
                            }
                        }
                    }
                },
                states: {
                    hover: {
                        enabled: true  // Enable hover state for the series
                    },
                    inactive: {
                        opacity: 1
                    }
                },
                cluster: {
                    enabled: !DEBUG,
                    allowOverlap: false,
                    layoutAlgorithm: {
                        type: 'grid',
                        gridSize: 50,
                        processTime: 500,
                        enableSimulation: true
                    },
                    minimumClusterSize: 3,
                    zones: [{
                        from: 1,
                        to: 4,
                        marker: {
                            radius: 13,
                            fillColor: 'rgba(112, 83, 53, 0.9)',
                            lineWidth: 1,
                            lineColor: '#A0A0A0'
                        }
                    }, {
                        from: 5,
                        to: 9,
                        marker: {
                            radius: 15,
                            fillColor: 'rgba(112, 83, 53, 0.9)',
                            lineWidth: 1,
                            lineColor: '#A0A0A0'
                        }
                    }, {
                        from: 10,
                        marker: {
                            radius: 17,
                            fillColor: 'rgba(112, 83, 53, 0.9)',
                            lineWidth: 1,
                            lineColor: '#A0A0A0'
                        }
                    }],
                    dataLabels: {
                        enabled: true,
                        format: '{point.clusterPointsAmount}',
                        style: {
                            fontSize: '14px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            fontWeight: 'bold',
                            textOutline: '3px solid #f4f1ea',
                            color: '#2b1810',
                            textShadow: '0 0 6px #f4f1ea, 0 0 3px #f4f1ea',
                            lineHeight: '14px'
                        },
                        backgroundColor: undefined,
                        padding: 0,
                        crop: true,
                        overflow: 'justify',
                        allowOverlap: false
                    }
                }
            }]
        };

        console.log('Creating map with options:', mapOptions);
        const container = document.getElementById('map-container');
        const chart = Highcharts.mapChart(container, mapOptions);
        console.log('Map created:', chart);

        // Add a resize handler
        window.addEventListener('resize', () => {
            if (chart) {
                chart.reflow();
            }
        });

    } catch (error) {
        console.error('Error creating map:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
    }
}

// Modify the initialization code to properly handle the sidebar
document.addEventListener('DOMContentLoaded', async () => {
    initializeProj4();

    try {
        const data = await loadLighthouseData();
        await initializeMap(data);
        populateTable();  // Make sure this runs before sidebar initialization

        // Initialize sidebar first
        $('.ui.sidebar')
            .sidebar({
                context: $('.bottom.segment'),  // Make sure this matches your HTML
                transition: 'overlay',
                dimPage: false
            })
            .sidebar('attach events', '.menu .item.sidebar-toggle');

        // Then initialize view controls
        initializeViewControls();

    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});

// Modify initializeViewControls to focus only on view switching
function initializeViewControls() {
    const tableContainer = document.getElementById('table-container');
    const mapContainer = document.getElementById('map-container');
    const sidebarToggle = document.querySelector('.sidebar-toggle');

    // Set initial states based on screen size
    function setInitialState() {
        if (window.innerWidth <= 768) {
            // Mobile: Show map only initially, show sidebar toggle
            tableContainer.style.display = 'none';
            mapContainer.style.display = 'block';
            sidebarToggle.style.display = 'block';

            // Initialize sidebar for mobile
            $('.ui.sidebar')
                .sidebar({
                    transition: 'overlay',
                    dimPage: false
                })
                .sidebar('attach events', '.sidebar-toggle');
        } else {
            // Desktop: Show both, hide sidebar toggle
            tableContainer.style.display = 'block';
            mapContainer.style.display = 'block';
            sidebarToggle.style.display = 'none';

            // Disable sidebar in desktop mode
            $('.ui.sidebar').sidebar('destroy');
        }
    }

    // Mobile-only view switching
    $('#map-view-item').on('click', function () {
        if (window.innerWidth <= 768) {
            tableContainer.style.display = 'none';
            mapContainer.style.display = 'block';
            $('.ui.sidebar').sidebar('hide');

            // Reflow the map
            const chart = Highcharts.charts[0];
            if (chart) {
                chart.reflow();
            }
        }
    });

    $('#table-view-item').on('click', function () {
        if (window.innerWidth <= 768) {
            mapContainer.style.display = 'none';
            tableContainer.style.display = 'block';
            $('.ui.sidebar').sidebar('hide');
        }
    });

    // Handle resize events
    window.addEventListener('resize', () => {
        setInitialState();

        // Reflow the map if it's visible
        if (mapContainer.style.display === 'block') {
            const chart = Highcharts.charts[0];
            if (chart) {
                chart.reflow();
            }
        }
    });

    // Set initial state on load
    setInitialState();
}

// Modify populateTable to ensure table is visible in desktop mode
function populateTable() {
    const tableBody = document.querySelector('#lighthouse-table tbody');
    if (!tableBody) {
        console.error('Could not find table body');
        return;
    }

    // Define the lighthouse icon SVG
    const lighthouseIcon = `
            <svg width="44" height="44" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <title>Lighthouse by Rafiico Creative Studio from Noun Project</title>
                <path d="M65.2,93.3H34.8c-1.1,0-2-0.9-2-2v-7.8c0-1.1,0.9-2,2-2h30.4c1.1,0,2,0.9,2,2v7.8C67.2,92.4,66.3,93.3,65.2,93.3z M50,6.7
                c-1.1,0-2,0.9-2,2v4.9c0,1.1,0.9,2,2,2s2-0.9,2-2V8.7C52,7.6,51.1,6.7,50,6.7z M61.2,25.8L50,19.1l-11.2,6.7c-0.7,0.4-1.1,1.2-1.1,2
                v45.7c0,1.1,0.9,2,2,2h20.6c1.1,0,2-0.9,2-2V27.8C62.3,27,61.9,26.2,61.2,25.8z M45.9,35.6h8.2v8.2h-8.2V35.6z M45.9,51.9h8.2v8.2
                h-8.2V51.9z" fill="currentColor"/>
            </svg>`;

    tableBody.innerHTML = '';

    loadLighthouseData().then(lighthouseData => {
        lighthouseData.sort((a, b) => a.yearBuilt - b.yearBuilt);

        lighthouseData.forEach(lighthouse => {
            const lat = Number(lighthouse.lat).toFixed(2);
            const lon = Number(lighthouse.lon).toFixed(2);

            const mainRow = document.createElement('tr');
            mainRow.className = 'lighthouse-row';

            const expandRow = document.createElement('tr');
            expandRow.className = 'coordinate-details';
            expandRow.style.display = 'none';

            const hasAnyData = lighthouse.reach?.some(v => v !== null && v !== '') ||
                lighthouse.lights?.some(v => v !== null && v !== '');

            // Update main row content to use lighthouse icon
            mainRow.innerHTML = `
                <td>
                    <div class="expandable-name">
                        <i class="chevron right icon"></i>
                        ${lighthouse.name}
                    </div>
                </td>
                <td class="year-cell">${lighthouse.yearBuilt}</td>
                <td class="height-cell">${lighthouse.height || 'N/A'}</td>
                <td class="data-cell lighthouse-icon-cell">${hasAnyData ? lighthouseIcon : '—'}</td>
                <td class="points-cell">${lighthouse.reach?.length || '—'}</td>
            `;

            // Expandable content
            expandRow.innerHTML = `
                <td colspan="5">
                    <div class="coordinate-content">
                        <p>Latitude: ${lat}° N, Longitude: ${Math.abs(lon)}° W</p>
                    </div>
                </td>
            `;

            // Add click handler
            mainRow.querySelector('.expandable-name').addEventListener('click', (e) => {
                const icon = mainRow.querySelector('.chevron');
                icon.classList.toggle('right');
                icon.classList.toggle('down');
                expandRow.style.display = expandRow.style.display === 'none' ? 'table-row' : 'none';
            });

            // Add rows to table
            tableBody.appendChild(mainRow);
            tableBody.appendChild(expandRow);

            // Add mouseenter and mouseleave handlers
            mainRow.addEventListener('mouseenter', () => {
                // If there's a map-triggered highlight, set a delay before clearing it
                if (highlightLock) {
                    // Store the current hover start time
                    mainRow.dataset.hoverStartTime = Date.now();

                    // Wait 750ms before clearing the map highlight
                    setTimeout(() => {
                        // Only clear if we're still hovering the same row after the delay
                        if (mainRow.dataset.hoverStartTime &&
                            Date.now() - mainRow.dataset.hoverStartTime >= 750) {
                            clearTimeout(highlightLock);
                            highlightLock = null;
                            clearAllHighlights();

                            // Apply the new highlight
                            mainRow.classList.add('highlight-row');

                            // Highlight corresponding map point
                            const chart = Highcharts.charts[0];
                            if (chart) {
                                const point = chart.series[1].points.find(p => p.name === lighthouse.name);
                                if (point) {
                                    point.setState('hover');
                                    if (point.dataLabel) {
                                        point.dataLabel.css({
                                            color: '#8B4513'
                                        });
                                    }
                                }
                            }
                        }
                    }, 750);
                } else {
                    // If no map highlight, apply hover highlight immediately
                    mainRow.classList.add('highlight-row');

                    // Highlight corresponding map point
                    const chart = Highcharts.charts[0];
                    if (chart) {
                        const point = chart.series[1].points.find(p => p.name === lighthouse.name);
                        if (point) {
                            point.setState('hover');
                            if (point.dataLabel) {
                                point.dataLabel.css({
                                    color: '#8B4513'
                                });
                            }
                        }
                    }
                }
            });

            // Update the mouseleave handler to clear the hover start time
            mainRow.addEventListener('mouseleave', () => {
                // Clear the hover start time
                delete mainRow.dataset.hoverStartTime;

                // Only clear highlights if there's no lock
                if (!highlightLock) {
                    mainRow.classList.remove('highlight-row');

                    // Reset map point state
                    const chart = Highcharts.charts[0];
                    if (chart) {
                        const point = chart.series[1].points.find(p => p.name === lighthouse.name);
                        if (point) {
                            point.setState('');
                            if (point.dataLabel) {
                                point.dataLabel.css({
                                    color: '#2b1810'
                                });
                            }
                        }
                    }
                }
            });
        });
    }).catch(error => {
        console.error('Error populating table:', error);
    });
}

// Add this CSS
const style = document.createElement('style');
style.textContent = `
    .cursor-indicator {
        pointer-events: none;
        mix-blend-mode: multiply;
    }
    
    @keyframes pulse {
        0% { transform: scale(1) translate(-50%, -50%); }
        50% { transform: scale(1.2) translate(-50%, -50%); }
        100% { transform: scale(1) translate(-50%, -50%); }
    }
`;
document.head.appendChild(style);

// Update the highlightTableRow function to handle scroll behavior separately
function highlightTableRow(point, isClick = false) {
    const lighthouseName = point.name;
    clearAllHighlights();

    // Store the point's screen coordinates if this was triggered by a click
    let pointCoords;
    if (isClick && point.graphic) {
        const bbox = point.graphic.getBBox();
        const chartPos = point.series.chart.containerPos;
        pointCoords = {
            x: chartPos.left + bbox.x + (bbox.width / 2),
            y: chartPos.top + bbox.y + (bbox.height / 2)
        };
    }

    // Set point state to hover
    point.setState('hover');
    if (point.dataLabel) {
        point.dataLabel.css({
            color: '#8B4513'
        });
    }

    const tableRows = document.querySelectorAll('#lighthouse-table tbody tr.lighthouse-row');
    for (const row of tableRows) {
        const nameCell = row.querySelector('.expandable-name');
        if (nameCell && nameCell.textContent.trim() === lighthouseName) {
            // Apply highlights first
            row.classList.add('highlight-row');
            row.classList.add('highlight-row-from-map');
            row.style.borderTop = '2px solid #8B4513';
            row.style.borderBottom = '2px solid #8B4513';
            row.style.borderLeft = '2px solid #8B4513';
            row.style.borderRight = '2px solid #8B4513';

            setHighlightLock(lighthouseName);

            // Only scroll into view if this was triggered by a click
            if (isClick) {
                row.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }

            // Move cursor based on event type
            setTimeout(() => {
                if (isClick && pointCoords) {
                    // Return cursor to map point if this was a click
                    moveCursor(pointCoords.x, pointCoords.y);
                } else {
                    // Move to row for hover events
                    const rect = row.getBoundingClientRect();
                    const targetX = rect.left + 20;
                    const targetY = rect.top + (rect.height / 2);
                    moveCursor(targetX, targetY);
                }
            }, 500);

            break;
        }
    }
}
