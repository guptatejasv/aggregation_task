class paginationHelper {
  async PerformQuery(model, query) {
    const data = await model.aggregate(query);
    return data;
  }

  GenerateSearchQuery(fieldArray, searchValue) {
    const query = {
      $match: {
        $or: [
          ...fieldArray.map((field) => ({
            [field]: {
              $regex: searchValue.toLowerCase().trim().replace(/\s/g, "\\s"),
              $options: "i",
            },
          })),
        ],
      },
    };
    return query;
  }

  GenerateDateFilterQuery(queries, fieldName) {
    const query = {
      $match: {
        [fieldName]: {
          $gte: new Date(queries.startDate),
          $lte: new Date(queries.endDate),
        },
      },
    };
    return query;
  }

  GenerateLookup(
    from,
    localField,
    foreignField,
    asString,
    pipeline = [],
    preserveNullAndEmptyArrays = true
  ) {
    const obj = [
      {
        $lookup: {
          from,
          localField,
          foreignField,
          pipeline,
          as: asString,
        },
      },
      {
        $unwind: {
          path: `$${asString}`,
          preserveNullAndEmptyArrays,
        },
      },
    ];
    return obj;
  }

  GenerateMatchQuery(matchCondition) {
    const matchObj = {
      $match: matchCondition,
    };
    return matchObj;
  }

  GenerateGroupQuery(dataObj) {
    const query = {
      $group: dataObj,
    };
    return query;
  }

  GenerateProjectionQuery(dataObj) {
    const query = {
      $project: dataObj,
    };
    return query;
  }

  GenerateSorting(dataObj) {
    const query = {
      $sort: dataObj,
    };
    return query;
  }

  async GenerateQueryWithPagination(inputs, model) {
    const perPage = inputs.itemsPerPage > 0 ? inputs.itemsPerPage : 10;
    const skipCount =
      inputs.startIndex > 0 ? (inputs.startIndex - 1) * perPage : 0;
    const facetObj = {
      $facet: {
        list: [
          {
            $project: { createdAt: 1, ...inputs.projection },
          },
          {
            $sort: inputs.sortObj || { _id: -1 },
          },
          {
            $skip: skipCount,
          },
          {
            $limit: perPage,
          },
        ],
        totalItems: [
          {
            $count: "count",
          },
        ],
      },
    };
    const query = inputs.query;
    query.push(facetObj);
    const data = await model.aggregate(inputs.query);
    const totalItems =
      data[0]?.totalItems.length > 0
        ? data[0]?.totalItems[0].count
        : data[0]?.totalItems.length;
    return {
      totalItems,
      startIndex: inputs.startIndex || 1,
      itemsPerPage: perPage,
      items: data[0]?.list,
    };
  }

  GenerateAddFieldQuery(inputs) {
    const query = {
      $addFields: inputs,
    };
    return query;
  }

  GenerateArrayForPopulate(pathArray, selectArray) {
    if (!pathArray || !selectArray || pathArray.length !== selectArray.length) {
      throw new Error(App.Messages.Error.PopulateError());
    }
    const populateArray = [];
    for (let i = 0; i < pathArray.length; i++) {
      const path = pathArray[i];
      const select = selectArray[i];
      const populateObj = { path, select };
      populateArray.push(populateObj);
    }
    return populateArray;
  }

  GenerateLimit(limit) {
    const query = {
      $limit: limit,
    };
    return query;
  }
}

export default new paginationHelper();
