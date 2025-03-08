#!/usr/bin/env Rscript

#' @importFrom tidytable group_by summarise filter as.list first %>%
#' @importFrom jsonlite toJSON
#' @importFrom data.table fread
#' @importFrom rlang .data

# Load required libraries
suppress_package_startup <- function(expr) {
    suppressPackageStartupMessages(suppressWarnings(expr))
}

suppress_package_startup({
    library(tidytable)
    library(jsonlite)
    library(rlang)
})

# Function to convert CSV data to JSON format
convert_to_json <- function(input_file) {
    # Read the CSV file
    dt <- fread(input_file)

    # Create lighthouse data matching placeholder format
    lighthouses <- dt %>%
        group_by(.data$Name) %>%
        summarise(
            name = first(.data$Name),
            easting = first(.data$POINT_X), # Keep original coordinates
            northing = first(.data$POINT_Y), # Keep original coordinates
            yearBuilt = first(.data$YearBuilt),
            height = first(.data$Height), # Add height field
            reach = list(sapply(c(1750, 1800, 1850, 1900, 1950), function(yr) {
                val <- dt$reach[dt$Name == first(.data$Name) & dt$year == yr]
                if (length(val) == 0) NA else val
            })),
            lights = list(sapply(c(1750, 1800, 1850, 1900, 1950), function(yr) {
                val <- dt$lights[dt$Name == first(.data$Name) & dt$year == yr]
                if (length(val) == 0) NA else val
            }))
        ) %>%
        filter(
            !all(sapply(.data$reach, is.na)) | !all(sapply(.data$lights, is.na))
        ) %>%
        as.list()

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

# Run the script
if (!interactive()) {
    main()
}
