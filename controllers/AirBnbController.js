import Airbnb from "../models/AirbnbModels.js";
import moment from "moment";

// export const getPropertyType = async (req, res) => {
//   try {
//     const response = await Airbnb.aggregate([
//       {
//         $group: {
//           _id: "$property_type",
//           total: { $sum: 1 },
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           total: 1,
//         },
//       },
//     ]);
//     return res.status(200).json([{ ...response }]);
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       message: error,
//     });
//   }
// };

export const searchByname = async (req, res) => {
  try {
    const { letters } = req.query;
    if (!letters) {
      res.status(400).send({
        message: "Parameter Letters is required",
      });
    }
    const regex = new RegExp(letters, "i");
    const aggregationPipeline = [
      {
        $match: {
          name: { $regex: regex },
        },
      },
    ];

    const result = await Airbnb.aggregate(aggregationPipeline);
    //   console.log(result)
    res.status(200).send({ ...result });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error,
    });
  }
};

// export const getFilteredData = async (req, res) => {
//   try {
//     const { property_type, start_date, end_date, accommodates, search } =
//       req.query;
//     if (!property_type) {
//       res.status(400).send({
//         success: false,
//         message: "Property Type Parameters is Required",
//       });
//     }
//     let dateDifference;
//     let query = [];
//     if (start_date && end_date) {
//       const startDate = moment(start_date, "YYYY-MM-DD");
//       const endDate = moment(end_date, "YYYY-MM-DD");
//       if (startDate.isAfter(endDate)) {
//         return res
//           .status(400)
//           .json({ error: "start_date cannot be greater than end_date" });
//       }
//       if (!startDate.isValid() || !endDate.isValid()) {
//         return res
//           .status(400)
//           .json({ error: "Invalid date format. Use YYYY-MM-DD." });
//       }
//       const today = moment().startOf("day");
//       if (startDate.isBefore(today) || endDate.isBefore(today)) {
//         return res.status(400).json({ error: "Dates cannot be in the past." });
//       }

//       dateDifference = endDate.diff(startDate, "days");

//       query = [
//         {
//           $addFields: {
//             max_nights: { $toInt: "$maximum_nights" },
//             min_nights: { $toInt: "$minimum_nights" },
//           },
//         },
//         {
//           $match: { property_type },
//         },
//       ];
//       query.push({
//         $match: {
//           ["availability.availability_365"]: { $gte: dateDifference },
//           min_nights: { $lte: dateDifference },
//           max_nights: { $gte: dateDifference },
//         },
//       });
//     }
//     if (accommodates) {
//       query.push({
//         $match: {
//           accommodates: { $gte: parseInt(accommodates) },
//         },
//       });
//     }

//     if (search) {
//       query.push({
//         $match: {
//           $or: [
//             ...["name"].map((field) => ({
//               [field]: {
//                 $regex: search.toLowerCase().trim().replace(/\s/g, "\\s"),
//                 $options: "i",
//               },
//             })),
//           ],
//         },
//       });
//     }
//     const properties = await Airbnb.aggregate(query);
//     res.status(200).json(properties);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       error: error.message,
//     });
//   }
// };
export const getPropertyType = async (req, res) => {
  try {
    const { startIndex = 1, itemsPerPage = 10 } = req.query;

    const query = [
      paginationHelper.GenerateGroupQuery({
        _id: "$property_type",
        total: { $count: {} },
      }),
    ];

    const options = {
      startIndex: +startIndex,
      itemsPerPage: +itemsPerPage,
      projection: {
        _id: 1,
        total: 1,
      },
      query,
      sortObj: { _id: 1 },
    };
    const response = await paginationHelper.GenerateQueryWithPagination(
      options,
      Airbnb
    );
    return res.status(200).json({ ...response });
  } catch (error) {
    console.log("Error : ", error);
    res.status(500).json({ error: error.message });
  }
};

export const searchProperty = async (req, res) => {
  try {
    const {
      property_type,
      accommodates,
      startIndex = 1,
      itemsPerPage = 10,
      start_date,
      end_date,
      search,
    } = req.query;

    if (!property_type) {
      return res.status(422).json({ error: "Property type is required." });
    }
    let dateDifference;
    let query = [];

    if (start_date && end_date) {
      const startDate = moment(start_date, "YYYY-MM-DD");
      const endDate = moment(end_date, "YYYY-MM-DD");
      if (startDate.isAfter(endDate)) {
        return res.status(400).json({
          error: "start_date cannot be greater than end_date",
        });
      }

      if (!startDate.isValid() || !endDate.isValid()) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD." });
      }

      const today = moment().startOf("day");
      if (startDate.isBefore(today) || endDate.isBefore(today)) {
        return res.status(400).json({ error: "Dates cannot be in the past." });
      }

      dateDifference = endDate.diff(startDate, "days");

      query.push(
        paginationHelper.GenerateMatchQuery({
          ["availability.availability_365"]: { $gte: dateDifference },
          min_nights: { $lte: dateDifference },
          max_nights: { $gte: dateDifference },
        })
      );
    }
    if (accommodates) {
      query.push(
        paginationHelper.GenerateMatchQuery({
          accommodates: { $lte: parseInt(accommodates) },
        })
      );
    }

    query = [
      paginationHelper.GenerateAddFieldQuery({
        max_nights: { $toInt: "$maximum_nights" },
        min_nights: { $toInt: "$minimum_nights" },
      }),
      paginationHelper.GenerateMatchQuery({ property_type }),
    ];
    if (search) {
      query.push(paginationHelper.GenerateSearchQuery(["name"], search));
    }

    const options = {
      startIndex: +startIndex,
      itemsPerPage: +itemsPerPage,
      projection: {
        listing_url: 1,
        name: 1,
        bedrooms: 1,
        host: 1,
        beds: 1,
        accommodates: 1,
        availability_365: 1,
        property_type: 1,
        min_nights: 1,
        max_nights: 1,
      },
      query,
      sortObj: { name: 1 },
    };
    const response = await paginationHelper.GenerateQueryWithPagination(
      options,
      Airbnb
    );
    return res.status(200).json({ ...response });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const getFilteredData = async (req, res) => {
  try {
    const { property_type, start_date, end_date, accommodates, search } =
      req.query;
    if (!property_type) {
      res.status(400).send({
        success: false,
        message: "Property Type Parameters is Required",
      });
    }
    let dateDifference;
    let query = [];
    if (start_date && end_date) {
      const startDate = moment(start_date, "YYYY-MM-DD");
      const endDate = moment(end_date, "YYYY-MM-DD");
      if (startDate.isAfter(endDate)) {
        return res
          .status(400)
          .json({ error: "start_date cannot be greater than end_date" });
      }
      if (!startDate.isValid() || !endDate.isValid()) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD." });
      }
      const today = moment().startOf("day");
      if (startDate.isBefore(today) || endDate.isBefore(today)) {
        return res.status(400).json({ error: "Dates cannot be in the past." });
      }

      dateDifference = endDate.diff(startDate, "days");

      query = [
        {
          $addFields: {
            max_nights: { $toInt: "$maximum_nights" },
            min_nights: { $toInt: "$minimum_nights" },
          },
        },
        {
          $match: { property_type },
        },
      ];
      query.push({
        $match: {
          ["availability.availability_365"]: { $gte: dateDifference },
          min_nights: { $lte: dateDifference },
          max_nights: { $gte: dateDifference },
        },
      });
    }
    if (accommodates) {
      query.push({
        $match: {
          accommodates: { $gte: parseInt(accommodates) },
        },
      });
    }

    if (search) {
      query.push({
        $match: {
          $or: [
            ...["name"].map((field) => ({
              [field]: {
                $regex: search.toLowerCase().trim().replace(/\s/g, "\\s"),
                $options: "i",
              },
            })),
          ],
        },
      });
    }
    const properties = await Airbnb.aggregate(query);
    res.status(200).json(properties);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};
