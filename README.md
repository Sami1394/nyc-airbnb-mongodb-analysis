# nyc-airbnb-mongodb-analysis
MongoDB aggregation pipeline analysis of NYC Airbnb listing data - pricing, availability, and neighborhood activity trends.

## Overview
This project analyzes New York City Airbnb listing data using MongoDB's aggregation framework to answer real business questions about pricing, availability, and neighborhood activity. The goal was to practice writing multi-stage aggregation pipelines and translate raw listing data into actionable insights.

## Dataset
- **Source:** [New York City Airbnb Open Data (Kaggle)](https://www.kaggle.com/datasets/dgomonov/new-york-city-airbnb-open-data)
- **Format:** CSV, imported directly into MongoDB
- **Size:** ~48,000 listings across NYC boroughs and neighborhoods

## Tools Used
- MongoDB (aggregation pipeline: `$match`, `$group`, `$project`, `$addFields`, `$cond`, `$sort`, `$limit`)
- MongoDB Compass / Shell for querying

## Key Questions Answered

### 1. Which borough and room type has the highest average nightly price?
Filtered out listings priced at $0 to avoid skewing the average, then grouped by borough and room type to compare pricing patterns across NYC.

**Result:** Manhattan entire home/apt listings had the highest average price at **$249.26/night**.

```js
db.Airbnb.aggregate([
  { $match: { price: { $gt: 0 } } },

  { $group: {
      _id: {
        borough: "$neighbourhood_group",
        room_type: "$room_type"
      },
      avgPrice: { $avg: "$price" }
  }},

  { $project: {
      _id: 0,
      borough: "$_id.borough",
      room_type: "$_id.room_type",
      avgPrice: { $round: ["$avgPrice", 2] }
  }},

  { $sort: { avgPrice: -1 } },
  { $limit: 1 }
]);
```

### 2. Which borough has the most "ghost" listings (low availability)?
Flagged listings with 30 days or less of yearly availability as "ghost" listings — a proxy for units that may not be genuinely available for booking — then aggregated counts by borough.

**Result:** Manhattan had the most ghost listings, with **10,497** flagged.

```js
db.Airbnb.aggregate([
  { $addFields: {
      isGhost: {
        $cond: {
          if: { $lte: ["$availability_365", 30] },
          then: 1,
          else: 0
        }
      }
  }},

  { $group: {
      _id: "$neighbourhood_group",
      ghostListings: { $sum: "$isGhost" }
  }},

  { $project: {
      _id: 0,
      borough: "$_id",
      ghostListings: 1
  }},

  { $sort: { ghostListings: -1 } },
  { $limit: 1 }
]);
```

### 3. Which neighborhoods are the most active based on review activity?
Filtered out listings with no reviews or invalid pricing, calculated average reviews per month per neighborhood, and excluded low-listing-count neighborhoods to reduce noise before ranking by review consistency.

**Top result:** East Elmhurst — 4.82 average reviews/month across 171 listings.

```js
db.Airbnb.aggregate([
  { $match: {
      reviews_per_month: { $gt: 0 },
      price: { $gt: 0 }
  }},

  { $group: {
      _id: "$neighbourhood",
      avgReviews: { $avg: "$reviews_per_month" },
      totalListings: { $sum: 1 }
  }},

  { $match: { totalListings: { $gte: 10 } } },

  { $project: {
      _id: 0,
      neighbourhood: "$_id",
      avgReviews: { $round: ["$avgReviews", 2] },
      totalListings: 1
  }},

  { $sort: { avgReviews: -1 } },
  { $limit: 10 }
]);
```

## Key Findings
- Manhattan showcases the highest nightly prices for entire-home listings but also has the highest count of low-availability ("ghost") listings, presenting potential short-term rental saturation using listings inconsistently.
- Normalizing engagement by reviews-per-month (rather than raw review counts) surfaces smaller, consistently active neighborhoods like East Elmhurst that wouldn't stand out using raw totals alone.

## Skills Demonstrated
- NoSQL data modeling and import (CSV → MongoDB)
- Multi-stage aggregation pipeline design
- Conditional field creation (`$cond`, `$addFields`)
- Data cleaning and outlier handling within queries
- Translating query output into business-relevant insights
