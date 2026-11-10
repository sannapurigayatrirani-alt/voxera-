
const express = require("express");

const {
  planOrganizationRequest
} = require("../organizationEngine");

const router = express.Router();
const organizationDiscoveryRoutes = require("./organizationDiscoveryRoutes");

router.post("/plan", (req, res) => {
  try {
    const {
      organizationName,
      organizationType,
      website,
      requestType,
      userDetails
    } = req.body;

    const result = planOrganizationRequest({
      organizationName,
      organizationType,
      website,
      requestType,
      userDetails
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      platform: "VOXERA",
      data: result
    });

  } catch (error) {
    console.error("Organization planning error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process the organization request."
    });
  }
});

module.exports = router;

