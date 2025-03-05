#!/usr/bin/env Rscript

# Load required libraries
suppressPackageStartup <- function(expr) {
  suppressPackageStartupMessages(suppressWarnings(expr))
}

suppressPackageStartup({
  library(tidytable)
  library(jsonlite)
})

# Define target years (matching existing data)
target_years <- c(1693, 1753, 1831, 1851, 1911)

convert_to_json <- function(input_file) {
  # Read the CSV file
  dt <- fread(input_file)

  # Create lighthouse data matching placeholder format
  lighthouses <- dt %>%
    group_by(Name) %>%
    summarise(
      name = first(Name),
      easting = first(POINT_X), # Keep original coordinates
      northing = first(POINT_Y), # Keep original coordinates
      yearBuilt = first(YearBuilt),
      height = first(Height), # Add height field
      reach = list(sapply(target_years, function(yr) {
        val <- dt$reach[dt$Name == first(Name) & dt$year == yr]
        if (length(val) == 0 || is.na(val) || val == 0) NA else as.numeric(val)
      })),
      lights = list(sapply(target_years, function(yr) {
        val <- dt$lights[dt$Name == first(Name) & dt$year == yr]
        if (length(val) == 0 || is.na(val) || val == 0) NA else as.numeric(val)
      }))
    ) %>%
    filter(
      !all(sapply(reach, is.na)) | !all(sapply(lights, is.na))
    ) %>%
    ungroup()

  json_output <- toJSON(
    lighthouses,
    pretty = TRUE,
    auto_unbox = TRUE,
    na = "null"
  )

  output_file <- "web/static/data/lighthouse_data.json"
  write(json_output, output_file)

  cat(sprintf("Processed %d lighthouses\n", nrow(lighthouses)))
}

# Main execution
main <- function() {
  tryCatch(
    {
      args <- commandArgs(trailingOnly = TRUE)
      if (length(args) != 1) {
        stop("Usage: Rscript convert_to_json.R <path_to_csv_file>")
      }

      input_file <- args[1]
      if (!file.exists(input_file)) {
        stop(sprintf("Input file not found: %s", input_file))
      }

      convert_to_json(input_file)
    },
    error = function(e) {
      cat("Error: ", conditionMessage(e), "\n", file = stderr())
      quit(status = 1)
    }
  )
}

if (!interactive()) {
  main()
}
