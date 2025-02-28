# Lighthouses Data Analysis Project

This project combines data analysis (using R and Python via Quarto) with interactive web-based data visualization.

## Project Structure

```
.
├── analysis/          # Quarto documents for data analysis
├── data/
│   ├── raw/          # Original, immutable data
│   └── processed/    # Cleaned and processed data
├── src/              # Source code for web application (future)
├── docs/             # Documentation
└── requirements/      # Dependency management
    ├── r/            # R package requirements
    └── python/       # Python package requirements
```

## Setup Instructions

### 1. Environment Setup

#### Python Setup
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements/python/requirements.txt
```

#### R Setup
```r
# Install required R packages
install.packages("renv")
renv::restore()
```

### 2. Quarto Setup

Make sure you have [Quarto](https://quarto.org/docs/get-started/) installed on your system.

### 3. Development Workflow

1. Data Analysis:
   - Work in the `analysis/` directory using Quarto documents
   - Store raw data in `data/raw/`
   - Save processed data in `data/processed/`

2. Web Development (Future):
   - Web application code will be developed in the `src/` directory
   - More details to come as the project evolves

## Getting Started

1. Clone this repository
2. Set up your Python and R environments as described above
3. Open the Quarto project in RStudio or VS Code
4. Begin your analysis in the `analysis/` directory
