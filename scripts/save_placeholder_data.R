#!/usr/bin/env Rscript

# Load jsonlite for JSON handling
suppressPackageStartup <- function(expr) {
  suppressPackageStartupMessages(suppressWarnings(expr))
}

suppressPackageStartup({
  library(jsonlite)
})

# Define target years
target_years <- c(1693, 1753, 1831, 1851, 1911)

# Define the placeholder lighthouse data
lighthouse_data <- list(
  list(
    name = "Bell Rock",
    lat = 56.4337,
    lon = -2.3870,
    yearBuilt = 1811,
    height = 35, # Bell Rock is 35m high
    reach = c(NA, NA, 15, 20, 22),
    lights = c(NA, NA, 1, 2, 2)
  ),
  list(
    name = "Eddystone",
    lat = 50.1835,
    lon = -4.2673,
    yearBuilt = 1882,
    height = 49, # Eddystone is 49m high
    reach = c(8, 13, 13, 13, 17),
    lights = c(1, 1, 1, 2, 2)
  ),
  list(
    name = "Fastnet",
    lat = 51.3889,
    lon = -9.6036,
    yearBuilt = 1904,
    height = 54, # Fastnet is 54m high
    reach = c(NA, NA, NA, 18, 27),
    lights = c(NA, NA, NA, 1, 1)
  ),
  list(
    name = "Hook Head",
    lat = 52.1240,
    lon = -6.9293,
    yearBuilt = 1245,
    height = 35, # Hook Head is 35m high
    reach = c(10, 12, 15, 17, 20),
    lights = c(1, 1, 1, 2, 2)
  ),
  list(
    name = "Old Head of Kinsale",
    lat = 51.6361,
    lon = -8.5178,
    yearBuilt = 1853,
    height = 30, # Approximate height
    reach = c(NA, NA, NA, 16, 23),
    lights = c(NA, NA, NA, 1, 2)
  ),
  list(
    name = "Tuskar Rock",
    lat = 52.2042,
    lon = -6.1947,
    yearBuilt = 1815,
    height = 34, # Tuskar Rock is 34m high
    reach = c(NA, NA, 14, 16, 19),
    lights = c(NA, NA, 1, 1, 2)
  ),
  list(
    name = "Mull of Kintyre",
    lat = 55.3085,
    lon = -5.8009,
    yearBuilt = 1788,
    height = 40, # Approximate height
    reach = c(NA, 12, 15, 18, 24),
    lights = c(NA, 1, 1, 2, 2)
  ),
  list(
    name = "Cape Wrath",
    lat = 58.6272,
    lon = -5.0000,
    yearBuilt = 1828,
    height = 27, # Cape Wrath is 27m high
    reach = c(NA, NA, 16, 19, 25),
    lights = c(NA, NA, 1, 2, 2)
  ),
  list(
    name = "Tory Island",
    lat = 55.2644,
    lon = -8.2307,
    yearBuilt = 1832,
    height = 30, # Approximate height
    reach = c(NA, NA, 15, 17, 21),
    lights = c(NA, NA, 1, 1, 2)
  ),
  list(
    name = "South Stack",
    lat = 53.3047,
    lon = -4.6947,
    yearBuilt = 1809,
    height = 28, # South Stack is 28m high
    reach = c(NA, NA, 14, 16, 20),
    lights = c(NA, NA, 1, 2, 2)
  )
)

# Convert to JSON and write to file
json_output <- toJSON(lighthouse_data,
  pretty = TRUE,
  auto_unbox = TRUE,
  na = "null"
) # Use null for NA values in JSON
output_file <- "web/static/data/placeholder_lighthouse_data.json"
write(json_output, output_file)

# Print confirmation
cat(sprintf(
  "Wrote placeholder data for %d lighthouses to %s\n",
  length(lighthouse_data), output_file
))

# Print sample of the data structure
cat("\nSample of data structure:\n")
str(lighthouse_data[[1]])
