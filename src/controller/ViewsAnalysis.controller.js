const ViewsAnalysis = require("../modeling/ViewsAnalysis");

// Function to create or update views for the current year and month
const createOrUpdateViews = async (req, res) => {
  try {
    // Get current year and month
    const currentDate = new Date();
    const year = req.body.year || currentDate.getFullYear(); // Use current year if not provided
    const monthNumber = req.body.month || currentDate.getMonth() + 1; // Use current month if not provided (JavaScript months are 0-based)

    // Map months from number to name
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthName = months[monthNumber - 1]; // Get month name from number

    // Find existing record for the year and month (by month name)
    let record = await ViewsAnalysis.findOne({ year, month: monthName });

    if (record) {
      // If record exists, increment total views by 1
      record.totalViews += 1;
      await record.save();
    } else {
      // If no record exists, create a new one with totalViews set to 1
      record = new ViewsAnalysis({
        year,
        month: monthName, // Store month as a string (e.g., "January")
        totalViews: 1,
      });
      await record.save();
    }

    // Success message with month name
    return res.status(200).json({
      message: `Views for ${year}-${monthName} updated successfully.`,
      data: record,
    });
  } catch (error) {
    console.error("Error creating or updating views:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getTotalViewsForLast12Months = async (req, res) => {
  try {
    // Get current date (current month and year)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // JavaScript months are 0-based (0 = January, 11 = December)

    // Array to store the monthly data
    const monthsData = [];
    let totalViewsLast12Months = 0;
    let oldYearExists = false; // Track if old year has data

    // Loop to get data for the last 12 months, from the old year to the current month
    for (let i = 0; i < 12; i++) {
      // Calculate the month index and year for each of the last 12 months
      const monthIndex = (currentMonth - i + 12) % 12; // This ensures wrapping back to December if needed
      const year = currentMonth - i >= 0 ? currentYear : currentYear - 1; // Fix year calculation here

      // Convert month index to month name (optional)
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const monthName = months[monthIndex];

      // Find the views record for that month and year
      const record = await ViewsAnalysis.findOne({ year, month: monthName });

      // If record found, add totalViews to total and push to array
      const viewsForMonth = record ? record.totalViews : 0;
      monthsData.push({
        month: monthName,
        year: year,
        totalViews: viewsForMonth,
      });

      // Add the views for the current month to the total views
      totalViewsLast12Months += viewsForMonth;

      // Check if data exists for the old year
      if (year === currentYear - 1 && viewsForMonth > 0) {
        oldYearExists = true;
      }
    }

    // Return the result for the last 12 months along with the total views
    return res.status(200).json({
      message: `Total views per month for the last 12 months`,
      oldYear: oldYearExists ? currentYear - 1 : null, // Send old year if it exists
      currentYear,
      totalViewsLast12Months,
      data: monthsData.reverse(),
    });
    
  } catch (error) {
    console.error("Error fetching total views for the last 12 months:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = { createOrUpdateViews, getTotalViewsForLast12Months };
