#!/usr/bin/env Rscript

#' @importFrom tidytable pivot_longer pivot_wider mutate rename arrange all_of %>% as_tidytable
#' @importFrom readxl read_excel
#' @importFrom data.table fwrite
#' @importFrom rlang .data

# Load required libraries
suppress_package_startup <- function(expr) {
    suppressPackageStartupMessages(suppressWarnings(expr))
}

suppress_package_startup({
    library(readxl)
    library(tidytable)
    library(rlang)
})

# Function to process historical data
process_historical_data <- function(input_file) {
    # Read the Excel file
    data <- read_excel(input_file) %>%
        as_tidytable()

    # Get all columns that contain REACH or LH data and print for debugging
    reach_cols <- grep("REACH", names(data), value = TRUE)
    lights_cols <- grep("LH", names(data), value = TRUE)

    cat("Found reach columns:", paste(reach_cols, collapse = ", "), "\n")
    cat("Found light columns:", paste(lights_cols, collapse = ", "), "\n")

    # Reshape the data while preserving years
    processed_data <- data %>%
        pivot_longer(
            cols = all_of(c(reach_cols, lights_cols)),
            names_to = c("type", "year"),
            names_pattern = "(REACH|LH)_(\\d+)"
        ) %>%
        mutate(
            name = .data$name,
            type = ifelse(.data$type == "REACH", "reach", "lights"),
            year = as.numeric(gsub("[^0-9]", "", .data$year))
        ) %>%
        pivot_wider(
            names_from = .data$type,
            values_from = .data$value
        ) %>%
        rename(
            reach = .data$REACH,
            lights = .data$LH
        ) %>%
        mutate(
            year = as.numeric(.data$year)
        ) %>%
        arrange(.data$Name, .data$year)

    # Write to CSV file
    fwrite(processed_data, "data/historical_data.csv")

    # Print summary
    cat(sprintf(
        "Processed %d lighthouses with historical data\n",
        length(unique(processed_data$Name))
    ))
    cat(sprintf(
        "Years covered: %s to %s\n",
        min(processed_data$year),
        max(processed_data$year)
    ))

    # Print sample of the data for verification
    print(head(processed_data))
}

# Main execution
main <- function() {
    tryCatch(
        {
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
        },
        error = function(e) {
            cat(sprintf("Error: %s\n", e$message), file = stderr())
            quit(status = 1)
        }
    )
}

# Run the script
if (!interactive()) {
    main()
}
