#!/usr/bin/env Rscript

# Declare global variables to satisfy lintr
utils::globalVariables(c(
    "toJSON"
))

# Load required libraries
suppress_package_startup <- function(expr) {
    suppressPackageStartupMessages(suppressWarnings(expr))
}

suppress_package_startup({
    library(jsonlite)
})

# Define placeholder data
lighthouses <- list(
    list(
        name = "Bell Rock",
        easting = 355381,
        northing = 726782,
        yearBuilt = 1811,
        height = 35.3,
        reach = list(NA, NA, 15, 15, 15),
        lights = list(NA, NA, 1, 1, 1)
    ),
    list(
        name = "Eddystone",
        easting = 221459,
        northing = 32894,
        yearBuilt = 1882,
        height = 49,
        reach = list(NA, 13, 13, 13, 17),
        lights = list(NA, 1, 1, 1, 1)
    ),
    list(
        name = "Fastnet",
        easting = 62520,
        northing = 25747,
        yearBuilt = 1904,
        height = 54,
        reach = list(NA, NA, NA, 14, 14),
        lights = list(NA, NA, NA, 1, 1)
    ),
    list(
        name = "Hook Head",
        easting = 276340,
        northing = 97558,
        yearBuilt = 1245,
        height = 35,
        reach = list(NA, 10, 10, 17, 17),
        lights = list(NA, 1, 1, 1, 1)
    ),
    list(
        name = "Old Head of Kinsale",
        easting = 164053,
        northing = 43908,
        yearBuilt = 1853,
        height = 30,
        reach = list(NA, NA, NA, 21, 21),
        lights = list(NA, NA, NA, 1, 1)
    ),
    list(
        name = "Tuskar Rock",
        easting = 319478,
        northing = 99466,
        yearBuilt = 1815,
        height = 34,
        reach = list(NA, NA, 14, 14, 14),
        lights = list(NA, NA, 1, 1, 1)
    ),
    list(
        name = "Mull of Kintyre",
        easting = 162019,
        northing = 607226,
        yearBuilt = 1788,
        height = 12,
        reach = list(NA, NA, 16, 16, 16),
        lights = list(NA, NA, 1, 1, 1)
    ),
    list(
        name = "Cape Wrath",
        easting = 225151,
        northing = 973935,
        yearBuilt = 1828,
        height = 20,
        reach = list(NA, NA, 27, 27, 27),
        lights = list(NA, NA, 1, 1, 1)
    ),
    list(
        name = "Tory Island",
        easting = 124453,
        northing = 444851,
        yearBuilt = 1832,
        height = 39.6,
        reach = list(NA, NA, 14, 14, 14),
        lights = list(NA, NA, 1, 1, 1)
    ),
    list(
        name = "South Stack",
        easting = 220780,
        northing = 382253,
        yearBuilt = 1809,
        height = 28,
        reach = list(NA, NA, 20, 20, 20),
        lights = list(NA, NA, 1, 1, 1)
    )
)

# Write to JSON file
write(
    toJSON(
        lighthouses,
        pretty = TRUE,
        auto_unbox = TRUE,
        na = "null"
    ),
    "web/static/data/lighthouse_data.json"
)

cat(sprintf(
    "Wrote placeholder data for %d lighthouses to %s\n",
    length(lighthouses),
    "web/static/data/lighthouse_data.json"
))
