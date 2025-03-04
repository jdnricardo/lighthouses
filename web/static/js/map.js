// Debug flag - set to true to use placeholder data
const DEBUG = false;

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
        proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs");
        proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
    }
}

// Function to convert BNG to WGS84
function convertBNGtoWGS84(easting, northing) {
    if (typeof proj4 === 'undefined') {
        console.error('proj4 not loaded, returning original coordinates');
        return { lat: 0, lon: 0 };
    }
    const [lon, lat] = proj4("EPSG:27700", "EPSG:4326", [easting, northing]);
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

// SparkLine constructor
Highcharts.SparkLine = function (container, options) {
    const defaultOptions = {
        chart: {
            renderTo: container,
            backgroundColor: null,
            borderWidth: 0,
            type: 'line',
            margin: [2, 0, 2, 0],
            style: {
                overflow: 'visible'
            },
            skipClone: true
        },
        title: {
            text: ''
        },
        credits: {
            enabled: false
        },
        xAxis: {
            labels: {
                enabled: false
            },
            title: {
                text: null
            },
            startOnTick: false,
            endOnTick: false,
            tickPositions: []
        },
        yAxis: {
            endOnTick: false,
            startOnTick: false,
            labels: {
                enabled: false
            },
            title: {
                text: null
            },
            tickPositions: [0],
            min: 0
        },
        legend: {
            enabled: false
        },
        tooltip: {
            enabled: true,
            hideDelay: 0,
            shared: true,
            outside: true
        },
        plotOptions: {
            series: {
                enableMouseTracking: true,
                animation: false,
                lineWidth: 1,
                shadow: false,
                states: {
                    hover: {
                        enabled: true,
                        lineWidth: 2,
                        halo: {
                            size: 2,
                            opacity: 0.25
                        }
                    }
                },
                marker: {
                    enabled: false,
                    radius: 2,
                    states: {
                        hover: {
                            enabled: true,
                            radius: 3
                        }
                    }
                },
                stickyTracking: false
            }
        }
    };

    options = Highcharts.merge(defaultOptions, options);
    return new Highcharts.Chart(options);
};

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
                    fontSize: '16px'
                }
            },
            tooltip: {
                enabled: DEBUG
            },
            plotOptions: {
                series: {
                    states: {
                        hover: {
                            enabled: DEBUG
                        },
                        inactive: {
                            opacity: 1
                        }
                    }
                }
            },
            series: [{
                mapData: Highcharts.maps['custom/british-isles'],
                name: 'Basemap',
                borderColor: '#A0A0A0',
                nullColor: 'rgba(200, 200, 200, 0.3)',
                showInLegend: false,
                enableMouseTracking: DEBUG,
                states: {
                    hover: {
                        enabled: DEBUG
                    }
                }
            }, {
                type: 'mappoint',
                name: 'Lighthouses',
                data: mappedData,
                enableMouseTracking: DEBUG,
                states: {
                    hover: {
                        enabled: DEBUG
                    }
                },
                cluster: {
                    enabled: !DEBUG,
                    allowOverlap: false,
                    animation: {
                        duration: 250
                    },
                    layoutAlgorithm: {
                        type: 'grid',
                        gridSize: 50,  // Larger grid size for better performance
                        processTime: 500
                    },
                    minimumClusterSize: 3,
                    zones: [{
                        from: 1,
                        to: 4,
                        marker: {
                            radius: 13,
                            fillColor: 'rgba(66, 133, 244, 0.5)',
                            lineWidth: 1,
                            lineColor: '#fff'
                        }
                    }, {
                        from: 5,
                        to: 9,
                        marker: {
                            radius: 15,
                            fillColor: 'rgba(219, 68, 55, 0.5)',
                            lineWidth: 1,
                            lineColor: '#fff'
                        }
                    }, {
                        from: 10,
                        marker: {
                            radius: 17,
                            fillColor: 'rgba(244, 180, 0, 0.5)',
                            lineWidth: 1,
                            lineColor: '#fff'
                        }
                    }],
                    dataLabels: {
                        enabled: true,
                        format: '{point.clusterPointsAmount}',
                        color: '#000',
                        style: {
                            textOutline: 'none',
                            fontWeight: 'normal'
                        }
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

function populateTable() {
    const tableBody = document.querySelector('#lighthouse-table tbody');
    if (!tableBody) return;

    // Load the data and populate table
    loadLighthouseData().then(lighthouseData => {
        tableBody.innerHTML = '';

        lighthouseData.forEach(lighthouse => {
            const row = document.createElement('tr');

            const lat = Number(lighthouse.lat).toFixed(2);
            const lon = Number(lighthouse.lon).toFixed(2);
            const yearBuilt = lighthouse.yearBuilt;

            // Extract time series data
            const visibilityData = extractTimeSeriesData(lighthouse, 'reach');
            const lightsData = extractTimeSeriesData(lighthouse, 'lights');

            row.innerHTML = `
                <td>${lighthouse.name}</td>
                <td>(${lat}°N, ${Math.abs(lon)}°W)</td>
                <td>${yearBuilt}</td>
                <td class="sparkline-cell" data-values="${visibilityData.join(',')}"></td>
                <td class="sparkline-cell" data-values="${lightsData.join(',')}"></td>
            `;

            tableBody.appendChild(row);
        });

        // Create sparklines
        document.querySelectorAll('.sparkline-cell').forEach(cell => {
            const values = cell.getAttribute('data-values')
                .split(',')
                .map(v => v === '' ? null : Number(v));

            const sparklineOptions = {
                chart: {
                    renderTo: cell,
                    backgroundColor: null,
                    borderWidth: 0,
                    type: 'line',
                    margin: [2, 0, 2, 0],
                    animation: false
                },
                series: [{
                    data: values,
                    enableMouseTracking: true,
                    animation: false,
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: true,
                                radius: 3
                            }
                        }
                    }
                }],
                tooltip: {
                    enabled: true,
                    hideDelay: 0,
                    formatter: function () {
                        return this.y;
                    }
                },
                plotOptions: {
                    series: {
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    }
                }
            };

            Highcharts.SparkLine(cell, sparklineOptions);
        });
    });
}

// Update the initialization to properly pass data
document.addEventListener('DOMContentLoaded', async () => {
    initializeProj4();

    try {
        const data = await loadLighthouseData();
        await initializeMap(data);
        populateTable();
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }

    // Initialize sidebar
    $('.ui.sidebar')
        .sidebar({
            transition: 'overlay',
            dimPage: false,
            closable: true
        })
        .sidebar('attach events', '#sidebar-toggle');
});