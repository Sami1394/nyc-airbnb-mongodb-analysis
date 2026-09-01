// NYC Airbnb Market Analysis — MongoDB Aggregation Queries
// Dataset: https://www.kaggle.com/datasets/dgomonov/new-york-city-airbnb-open-data

// -----------------------------------------------------------
// Question 1: Which borough and room type has the highest
// average nightly price?
// -----------------------------------------------------------
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
// Result: { borough: 'Manhattan', room_type: 'Entire home/apt', avgPrice: 249.26 }


// -----------------------------------------------------------
// Question 2: Which borough has the most "ghost" listings
// (30 days or less of yearly availability)?
// -----------------------------------------------------------
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
// Result: { ghostListings: 10497, borough: 'Manhattan' }


// -----------------------------------------------------------
// Question 3: Which neighborhoods are the most active based
// on normalized review activity (reviews per month)?
// -----------------------------------------------------------
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
// Top result: { totalListings: 171, neighbourhood: 'East Elmhurst', avgReviews: 4.82 }
