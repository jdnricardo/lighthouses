// Map visualization
let map, projection, path;
const width = 800;
const height = 600;
const mapScale = 6500; // Increased scale for better visibility range display

// Keep track of selected lighthouses
let selectedLighthouses = [];

// Tooltip dimensions and styling
const tooltipWidth = 200;
const tooltipHeight = 100;
const sparklineHeight = 30;
const sparklinePadding = 5;
const sparklineColor = '#FF8C42'; // High-contrast orange that meets WCAG guidelines

// Placeholder lighthouse data for testing with historical visibility ranges (in miles)
const placeholderLighthouses = [
    {
        name: "Flamborough Head",
        latitude: 54.1169,
        longitude: -0.0819,
        ranges: [
            { year: 1693, range: 30 },
            { year: 1753, range: 36 },
            { year: 1831, range: 44 },
            { year: 1851, range: 50 },
            { year: 1911, range: 56 }
        ]
    },
    {
        name: "Lizard",
        latitude: 49.9597,
        longitude: -5.2015,
        ranges: [
            { year: 1693, range: 36 },
            { year: 1753, range: 40 },
            { year: 1831, range: 48 },
            { year: 1851, range: 54 },
            { year: 1911, range: 60 }
        ]
    },
    {
        name: "Bell Rock",
        latitude: 56.4336,
        longitude: -2.3870,
        ranges: [
            { year: 1693, range: 0 },
            { year: 1753, range: 0 },
            { year: 1831, range: 46 },
            { year: 1851, range: 52 },
            { year: 1911, range: 58 }
        ]
    },
    {
        name: "Needles",
        latitude: 50.6627,
        longitude: -1.5896,
        ranges: [
            { year: 1693, range: 24 },
            { year: 1753, range: 32 },
            { year: 1831, range: 40 },
            { year: 1851, range: 48 },
            { year: 1911, range: 54 }
        ]
    }
];

// Keep track of current year for updates
let currentYear = 1693;

function initializeMap() {
    console.log("Initializing map...");

    // Store current state before clearing
    const previousYear = currentYear;
    const previousSelection = [...selectedLighthouses];

    // Remove existing tooltip if it exists
    d3.select('.lighthouse-tooltip').remove();

    // Clear existing map content
    d3.select('#map').selectAll('*').remove();

    // Create SVG container with a temporary viewBox
    map = d3.select('#map')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background-color', 'var(--display-bg)');

    // Create lighthouse selector
    createLighthouseSelector();

    // Create tooltip container
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'lighthouse-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'var(--metal-dark)')
        .style('border', '1px solid var(--display-text)')
        .style('border-radius', '4px')
        .style('padding', '10px')
        .style('color', 'var(--display-text)')
        .style('font-family', "'VT323', monospace")
        .style('pointer-events', 'none')
        .style('z-index', '1000');

    // Create OSGB 1936 projection (Transverse Mercator)
    projection = d3.geoTransverseMercator()
        .center([-2.5, 55.4])
        .rotate([0, 0])
        .scale(mapScale)
        .translate([width / 2, height / 2]);

    // Create path generator
    path = d3.geoPath().projection(projection);

    // Load UK coastline data
    d3.json('data/uk.json')
        .then(uk => {
            console.log("Coastline data loaded:", uk);

            // Verify the GeoJSON structure
            if (!uk || uk.type !== 'FeatureCollection' || !uk.features || !uk.features.length) {
                console.error("Invalid GeoJSON structure:", uk);
                throw new Error("Invalid GeoJSON structure");
            }

            // Get the first feature's geometry
            const feature = uk.features[0];

            // Calculate bounds of the coastline
            const bounds = path.bounds(feature);
            const dx = bounds[1][0] - bounds[0][0];
            const dy = bounds[1][1] - bounds[0][1];
            const x = bounds[0][0];
            const y = bounds[0][1];

            // Add padding (10%)
            const padding = 0.1;
            const viewBox = [
                x - dx * padding,
                y - dy * padding,
                dx * (1 + 2 * padding),
                dy * (1 + 2 * padding)
            ].join(' ');

            // Update SVG viewBox to fit coastline
            map.attr('viewBox', viewBox)
                .attr('preserveAspectRatio', 'xMidYMid meet');

            // Create a group for map content
            const mapGroup = map.append('g');

            // Create a group for visibility ranges (below coastline)
            mapGroup.append('g')
                .attr('class', 'visibility-ranges');

            // Draw coastline
            const coastline = mapGroup.append('path')
                .datum(feature)
                .attr('d', path)
                .attr('class', 'coastline')
                .style('fill', 'none')
                .style('stroke', 'var(--display-text)')
                .style('stroke-width', '1.5')
                .style('opacity', '0.4');

            // Add glow filter
            const defs = map.append('defs');
            const filter = defs.append('filter')
                .attr('id', 'glow');

            filter.append('feGaussianBlur')
                .attr('stdDeviation', '2')
                .attr('result', 'coloredBlur');

            const feMerge = filter.append('feMerge');
            feMerge.append('feMergeNode')
                .attr('in', 'coloredBlur');
            feMerge.append('feMergeNode')
                .attr('in', 'SourceGraphic');

            // Display placeholder lighthouses
            displayPlaceholderData(mapGroup);

            // Restore previous state
            currentYear = previousYear;
            selectedLighthouses = previousSelection;

            // Update the lighthouse selector to reflect the previous selection
            const select = d3.select('#lighthouse-select');
            select.selectAll('option')
                .property('selected', d => selectedLighthouses.includes(d.name));

            // Update visibility ranges with restored state
            console.log('Restoring visibility ranges for year:', currentYear);
            updateVisibilityRanges(currentYear);

            // Update map view if there were selected lighthouses
            if (selectedLighthouses.length > 0) {
                updateMapView();
            }
        })
        .catch(error => {
            console.error("Error loading or processing coastline data:", error);
            throw error;
        });

    // Mouse move handler for coordinates
    map.on('mousemove', (event) => {
        const [x, y] = d3.pointer(event);
        const [lon, lat] = projection.invert([x, y]);
        document.querySelector('.coordinates').textContent =
            `LAT: ${lat.toFixed(2)}°N LON: ${Math.abs(lon).toFixed(2)}°W`;
    });
}

function createLighthouseSelector() {
    // Remove existing lighthouse selector if it exists
    d3.select('.lighthouse-controls').remove();

    // Create container for the selector in the control panel content
    const selectorContainer = d3.select('.control-panel-content')
        .append('div')
        .attr('class', 'panel-section lighthouse-controls')
        .style('margin-bottom', '30px')
        .style('padding', '15px')
        .style('background', 'var(--metal-dark)')
        .style('border-radius', '8px');

    // Add heading
    selectorContainer.append('h2')
        .attr('class', 'panel-heading')
        .text('LIGHTHOUSE SELECT');

    // Create control group
    const controlGroup = selectorContainer.append('div')
        .attr('class', 'control-group');

    // Create select element
    const select = controlGroup.append('select')
        .attr('id', 'lighthouse-select')
        .attr('multiple', true)
        .style('width', '100%')
        .style('background-color', 'var(--display-bg)')
        .style('color', 'var(--display-text)')
        .style('border', '1px solid var(--display-text)')
        .style('padding', '5px')
        .style('margin-top', '10px')
        .style('font-family', "'VT323', monospace");

    // Add helper text
    controlGroup.append('div')
        .style('color', 'var(--display-text-dim)')
        .style('font-size', '0.8em')
        .style('margin-top', '5px')
        .text('Select lighthouses to focus');

    // Add options
    select.selectAll('option')
        .data(placeholderLighthouses)
        .enter()
        .append('option')
        .attr('value', d => d.name)
        .text(d => d.name);

    // Handle selection changes
    select.on('change', handleSelectionChange);
}

function updateMapView() {
    if (selectedLighthouses.length === 0) {
        // Reset to default view if no lighthouses selected
        const uk = d3.select('.coastline').datum();
        const bounds = path.bounds(uk);
        console.log('Resetting to full UK view, bounds:', bounds);
        updateViewBox(bounds);
        return;
    }

    // Calculate bounds for selected lighthouses
    const selected = placeholderLighthouses.filter(l => selectedLighthouses.includes(l.name));
    const points = selected.map(l => {
        const point = projection([l.longitude, l.latitude]);
        console.log(`Projected point for ${l.name}:`, point);
        return point;
    });

    // Find the bounding box
    const xMin = d3.min(points, p => p[0]);
    const xMax = d3.max(points, p => p[0]);
    const yMin = d3.min(points, p => p[1]);
    const yMax = d3.max(points, p => p[1]);

    console.log('Raw bounding box:', { xMin, xMax, yMin, yMax });

    // Add padding (20%)
    const padding = 0.2;
    const dx = xMax - xMin || 500; // Minimum width if single point
    const dy = yMax - yMin || 500; // Minimum height if single point
    const bounds = [
        [xMin - dx * padding, yMin - dy * padding],
        [xMax + dx * padding, yMax + dy * padding]
    ];

    // Enforce minimum zoom level
    const minWidth = 800; // Minimum width in pixels
    const minHeight = 600; // Minimum height in pixels

    const width = bounds[1][0] - bounds[0][0];
    const height = bounds[1][1] - bounds[0][1];

    if (width < minWidth || height < minHeight) {
        const centerX = (bounds[1][0] + bounds[0][0]) / 2;
        const centerY = (bounds[1][1] + bounds[0][1]) / 2;
        const newWidth = Math.max(width, minWidth);
        const newHeight = Math.max(height, minHeight);

        bounds[0][0] = centerX - newWidth / 2;
        bounds[0][1] = centerY - newHeight / 2;
        bounds[1][0] = centerX + newWidth / 2;
        bounds[1][1] = centerY + newHeight / 2;

        console.log('Adjusted bounds to enforce minimum zoom:', bounds);
    }

    console.log('Final bounds with padding:', bounds);
    updateViewBox(bounds);
}

function updateViewBox(bounds) {
    const [[x0, y0], [x1, y1]] = bounds;
    const viewBox = [x0, y0, x1 - x0, y1 - y0].join(' ');
    map.transition()
        .duration(750)
        .attr('viewBox', viewBox);
}

function displayPlaceholderData(mapGroup) {
    console.log("Displaying placeholder lighthouses...");

    // Add lighthouse points
    mapGroup.selectAll('.lighthouse')
        .data(placeholderLighthouses)
        .enter()
        .append('circle')
        .attr('class', 'lighthouse')
        .attr('cx', d => {
            const proj = projection([d.longitude, d.latitude]);
            console.log(`Projecting ${d.name}:`, proj);
            return proj[0];
        })
        .attr('cy', d => projection([d.longitude, d.latitude])[1])
        .attr('r', 4)
        .style('fill', d => selectedLighthouses.includes(d.name) ? sparklineColor : 'var(--display-text)')
        .style('opacity', '0.8')
        .style('filter', 'url(#glow)')
        .on('mouseover', (event, d) => showTooltip(d, event))
        .on('mouseout', hideTooltip);

    // Show tooltip by default if only one lighthouse is selected
    if (selectedLighthouses.length === 1) {
        const lighthouse = placeholderLighthouses.find(l => l.name === selectedLighthouses[0]);
        if (lighthouse) {
            const point = projection([lighthouse.longitude, lighthouse.latitude]);
            showTooltip(lighthouse, null, point);
        }
    }
}

function showTooltip(d, event) {
    const tooltip = d3.select('.lighthouse-tooltip');
    const [x, y] = event ? [event.pageX, event.pageY] : d3.pointer(event, document.body);

    // Create sparkline data
    const sparklineData = d.ranges.map(r => ({
        year: r.year,
        range: r.range
    }));

    // Create sparkline
    const sparklineSvg = d3.create('svg')
        .attr('width', tooltipWidth - 20)
        .attr('height', sparklineHeight);

    const xScale = d3.scaleLinear()
        .domain([d3.min(sparklineData, d => d.year), d3.max(sparklineData, d => d.year)])
        .range([sparklinePadding, tooltipWidth - 20 - sparklinePadding]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(sparklineData, d => d.range)])
        .range([sparklineHeight - sparklinePadding, sparklinePadding]);

    // Draw sparkline path
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.range));

    sparklineSvg.append('path')
        .datum(sparklineData)
        .attr('fill', 'none')
        .attr('stroke', sparklineColor)
        .attr('stroke-width', 1.5)
        .attr('d', line);

    // Add current year indicator - use parseInt to ensure proper number comparison
    const currentYearNum = parseInt(currentYear);
    sparklineSvg.append('line')
        .attr('x1', xScale(currentYearNum))
        .attr('x2', xScale(currentYearNum))
        .attr('y1', sparklinePadding)
        .attr('y2', sparklineHeight - sparklinePadding)
        .attr('stroke', sparklineColor)
        .attr('stroke-width', 1.5)
        .style('opacity', 0.8);

    // Update tooltip content
    tooltip.html(
        `<div style="margin-bottom: 5px;"><strong>${d.name}</strong></div>` +
        `<div style="font-size: 0.9em;">LAT: ${d.latitude.toFixed(2)}°N</div>` +
        `<div style="font-size: 0.9em;">LON: ${Math.abs(d.longitude).toFixed(2)}°W</div>` +
        `<div style="margin-top: 10px;">Visibility Range Over Time:</div>`
    )
        .append(() => sparklineSvg.node());

    // Position tooltip
    tooltip.style('left', `${x + 15}px`)
        .style('top', `${y - tooltipHeight - 10}px`)
        .style('visibility', 'visible');
}

function hideTooltip() {
    d3.select('.lighthouse-tooltip')
        .style('visibility', 'hidden');
}

function updateVisibilityRanges(year) {
    const yearNum = parseInt(year);
    currentYear = yearNum; // Set the global currentYear
    console.log(`Updating visibility ranges for year: ${yearNum}`);

    // Update lighthouse colors based on selection
    d3.selectAll('.lighthouse')
        .style('fill', d => selectedLighthouses.includes(d.name) ? sparklineColor : 'var(--display-text)');

    // Get the visibility ranges group
    const rangesGroup = d3.select('.visibility-ranges');
    console.log('Ranges group found:', !rangesGroup.empty());

    if (!rangesGroup.empty()) {
        // Clear existing ranges
        rangesGroup.selectAll('*').remove();

        // Add new range circles for each lighthouse
        placeholderLighthouses.forEach(lighthouse => {
            // Find the range for the current year
            const rangeData = lighthouse.ranges.find(r => parseInt(r.year) === yearNum) ||
                lighthouse.ranges.reduce((prev, curr) =>
                    Math.abs(parseInt(curr.year) - yearNum) < Math.abs(parseInt(prev.year) - yearNum) ? curr : prev
                );

            console.log(`${lighthouse.name} range for year ${yearNum}:`, rangeData);

            if (rangeData.range > 0) {
                // Convert range from miles to pixels
                const milesPerPixel = 69 / (mapScale / 100);
                const rangeInPixels = rangeData.range / milesPerPixel;
                console.log(`${lighthouse.name} range in pixels:`, rangeInPixels);

                // Add the range circle - show all ranges if none selected, or only selected ones
                const shouldShow = selectedLighthouses.length === 0 || selectedLighthouses.includes(lighthouse.name);
                if (shouldShow) {
                    rangesGroup.append('circle')
                        .attr('class', 'visibility-range')
                        .attr('cx', projection([lighthouse.longitude, lighthouse.latitude])[0])
                        .attr('cy', projection([lighthouse.longitude, lighthouse.latitude])[1])
                        .attr('r', rangeInPixels)
                        .style('fill', selectedLighthouses.includes(lighthouse.name) ? sparklineColor : 'var(--display-text)')
                        .style('opacity', selectedLighthouses.includes(lighthouse.name) ? '0.25' : '0.1')
                        .style('stroke', selectedLighthouses.includes(lighthouse.name) ? sparklineColor : 'var(--display-text)')
                        .style('stroke-width', '1')
                        .style('stroke-opacity', selectedLighthouses.includes(lighthouse.name) ? '0.4' : '0.2')
                        .style('pointer-events', 'none');
                }
            }
        });

        // Log the number of visibility ranges created
        console.log('Number of visibility ranges created:', rangesGroup.selectAll('.visibility-range').size());
    }

    // Update any visible tooltips
    const tooltip = d3.select('.lighthouse-tooltip');
    if (tooltip.style('visibility') === 'visible') {
        // Find the lighthouse data for the currently shown tooltip
        const lighthouseName = tooltip.select('strong').text();
        const lighthouse = placeholderLighthouses.find(l => l.name === lighthouseName);
        if (lighthouse) {
            showTooltip(lighthouse, null);
        }
    }
}

// Handle selection changes
function handleSelectionChange() {
    const options = this.selectedOptions;
    selectedLighthouses = Array.from(options).map(opt => opt.value);

    // Update lighthouse colors and ranges
    updateVisibilityRanges(currentYear);
    updateMapView();
}

// Export the update function for use with the time slider
window.updateVisualization = function (year) {
    console.log('Time slider update called with year:', year);
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) {
        console.error('Invalid year value:', year);
        return;
    }
    updateVisibilityRanges(yearNum);
}; 