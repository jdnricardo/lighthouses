#!/usr/bin/env Rscript

# Load required libraries
suppressPackageStartup <- function(expr) {
  suppressPackageStartupMessages(suppressWarnings(expr))
}

suppressPackageStartup({
  library(readxl)
  library(tidytable)
})

# Function to process historical data
process_historical_data <- function(input_file) {
  # Read the Excel file
  dt <- read_excel(input_file) %>%
    as_tidytable()
  
  # Get all columns that contain REACH or LH data and print for debugging
  reach_cols <- names(dt)[grep("^REACH_[0-9]+", names(dt))]
  lights_cols <- names(dt)[grep("^LH_[0-9]+", names(dt))]
  
  cat("Found reach columns:", paste(reach_cols, collapse=", "), "\n")
  cat("Found lights columns:", paste(lights_cols, collapse=", "), "\n")
  
  # Reshape the data while preserving years
  historical_data <- dt %>%
    pivot_longer(
      cols = all_of(c(reach_cols, lights_cols)),
      names_to = "name",
      values_to = "value"
    ) %>%
    # Then separate the name into type and year
    separate(
      name,
      into = c("type", "year"),
      sep = "_"
    ) %>%
    # Pivot wider to get reach and lights as columns
    pivot_wider(
      names_from = type,
      values_from = value
    ) %>%
    rename(
      reach = REACH,
      lights = LH
    ) %>%
    mutate(
      year = as.numeric(year)
    ) %>%
    arrange(Name, year)
  
  # Write to CSV file
  output_file <- "web/static/data/historical_data.csv"
  write.csv(historical_data, output_file, row.names = FALSE)
  
  # Print summary
  cat(sprintf("Processed %d lighthouses with historical data\n", 
              n_distinct(historical_data$Name)))
  cat(sprintf("Years covered: %s to %s\n",
              min(historical_data$year),
              max(historical_data$year)))
  
  # Print sample of the data for verification
  cat("\nSample of processed data:\n")
  print(head(historical_data))
}

# Main execution
main <- function() {
  # Set up error handling
  tryCatch({
    # Check command line arguments
    args <- commandArgs(trailingOnly = TRUE)
    
    if (length(args) != 1) {
      stop("Usage: Rscript fetch_historical_data.R <path_to_excel_file>")
    }
    
    input_file <- args[1]
    
    if (!file.exists(input_file)) {
      stop(sprintf("Input file not found: %s", input_file))
    }
    
    # Process the data
    process_historical_data(input_file)
    
  }, error = function(e) {
    cat(sprintf("Error: %s\n", e$message), file = stderr())
    quit(status = 1)
  })
}

# Run the script
if (!interactive()) {
  main()
} 