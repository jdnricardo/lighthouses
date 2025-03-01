# Lighthouses of Britain

An interactive visualization of historical British lighthouses, featuring a retro-digital interface inspired by maritime navigation systems.

## Features

- Interactive map of British lighthouses
- Historical timeline navigation (1693-1911)
- Detailed lighthouse profiles
- Retro-digital aesthetic with nautical influences

## Live Demo

Visit [GitHub Pages URL] to see the project in action.

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/[your-username]/lighthouses.git
   cd lighthouses
   ```

2. Serve the files:
   - Using Python:
     ```bash
     cd web
     python -m http.server 8000
     ```
   - Using Node.js:
     ```bash
     npx http-server web
     ```
   - Using PHP:
     ```bash
     php -S localhost:8000 -t web
     ```

3. Open `http://localhost:8000` in your browser

## Data Sources

- Lighthouse data: [TBD]
- UK coastline: Natural Earth Data (simplified for development)

## Dependencies

All dependencies are loaded via CDN:
- D3.js v7
- Google Fonts (VT323, Special Elite)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Natural Earth Data for coastline data
- Buxton-Dunn, Oliver and Alvrez-Palau, Eduard and Bogart, Dan and Shaw-Taylor, Leigh (2020). [Historical light aids to navigation 1514-1911](https://reshare.ukdataservice.ac.uk/854522/). [Data Collection]. Colchester, Essex: UK Data Service. [10.5255/UKDA-SN-854172](https://dx.doi.org/10.5255/UKDA-SN-854172).
