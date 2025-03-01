// Profile visualization
class ProfileView {
    constructor() {
        this.svg = d3.select('#profile');
        this.width = this.svg.node().clientWidth;
        this.height = this.svg.node().clientHeight;
    }

    init() {
        console.log("Initializing profile view...");

        // Clear any existing content
        this.svg.selectAll('*').remove();

        // Set up the SVG
        this.svg
            .attr('width', '100%')
            .attr('height', '100%')
            .style('background-color', 'var(--display-bg)');

        // Add background grid
        this.addGrid();

        // Add placeholder content
        this.addPlaceholder();

        // Update stats display
        this.updateStats('--', '--');
    }

    addGrid() {
        const gridSize = 60;
        const gridGroup = this.svg.append('g').attr('class', 'grid');

        // Vertical lines
        for (let x = 0; x < this.width; x += gridSize) {
            gridGroup.append('line')
                .attr('x1', x)
                .attr('y1', 0)
                .attr('x2', x)
                .attr('y2', this.height)
                .attr('stroke', 'var(--display-text)')
                .attr('stroke-width', 0.5)
                .attr('opacity', 0.2);
        }

        // Horizontal lines
        for (let y = 0; y < this.height; y += gridSize) {
            gridGroup.append('line')
                .attr('x1', 0)
                .attr('y1', y)
                .attr('x2', this.width)
                .attr('y2', y)
                .attr('stroke', 'var(--display-text)')
                .attr('stroke-width', 0.5)
                .attr('opacity', 0.2);
        }
    }

    addPlaceholder() {
        // Add placeholder text
        this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', this.height / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--display-text)')
            .style('font-family', "'VT323', monospace")
            .style('font-size', '24px')
            .text('LIGHTHOUSE PROFILE VIEW');

        // Add placeholder lighthouse silhouette
        const lighthouseGroup = this.svg.append('g')
            .attr('transform', `translate(${this.width / 2}, ${this.height / 2})`);

        // Base
        lighthouseGroup.append('rect')
            .attr('x', -30)
            .attr('y', -10)
            .attr('width', 60)
            .attr('height', 20)
            .attr('fill', 'none')
            .attr('stroke', 'var(--display-text)')
            .attr('stroke-width', 2);

        // Tower
        lighthouseGroup.append('path')
            .attr('d', 'M-20,-10 L-10,-100 L10,-100 L20,-10')
            .attr('fill', 'none')
            .attr('stroke', 'var(--display-text)')
            .attr('stroke-width', 2);

        // Light housing
        lighthouseGroup.append('rect')
            .attr('x', -15)
            .attr('y', -120)
            .attr('width', 30)
            .attr('height', 20)
            .attr('fill', 'none')
            .attr('stroke', 'var(--display-text)')
            .attr('stroke-width', 2);

        // Light beams
        const beams = lighthouseGroup.append('g')
            .attr('class', 'beams');

        [-30, 0, 30].forEach(angle => {
            beams.append('line')
                .attr('x1', 0)
                .attr('y1', -110)
                .attr('x2', Math.sin(angle * Math.PI / 180) * 100)
                .attr('y2', -110 - Math.cos(angle * Math.PI / 180) * 100)
                .attr('stroke', 'var(--display-text)')
                .attr('stroke-width', 1)
                .attr('opacity', 0.5);
        });
    }

    updateStats(height, range) {
        const statsElement = document.querySelector('.stats');
        statsElement.textContent = `HEIGHT: ${height}M RANGE: ${range}KM`;
    }
}

// Create a single instance of ProfileView
const profileView = new ProfileView();

// Export the initialization function for use in main.js
function initializeProfile() {
    profileView.init();
} 