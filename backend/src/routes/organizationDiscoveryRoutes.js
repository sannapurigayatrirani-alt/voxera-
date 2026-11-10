const express = require("express");

const router = express.Router();

// --------------------------------------
// ORGANIZATION CATEGORIES
// --------------------------------------

const CATEGORIES = {
  school: ["school"],
  college: ["college", "university"],
  university: ["university"],
  hospital: ["hospital"],
  clinic: ["clinic", "doctors"],
  education: ["school", "college", "university"],
  healthcare: ["hospital", "clinic", "doctors"],
  all: [
    "school",
    "college",
    "university",
    "hospital",
    "clinic",
    "doctors"
  ]
};

const OVERPASS_SERVERS = [
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

// --------------------------------------
// HTTP HELPER
// --------------------------------------

async function fetchJson(
  url,
  options = {},
  timeout = 12000
) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeout)
  });

  if (!response.ok) {
    throw new Error(
      `Provider returned HTTP ${response.status}`
    );
  }

  return response.json();
}

// --------------------------------------
// LOCATION GEOCODING
// --------------------------------------

async function geocode(location) {
  const url = new URL(
    "https://photon.komoot.io/api/"
  );

  url.searchParams.set("q", location);
  url.searchParams.set("limit", "1");

  const result = await fetchJson(url.toString());

  const feature = result.features?.[0];

  if (!feature) {
    throw new Error(
      "Location not found. Try a city or area name."
    );
  }

  const [longitude, latitude] =
    feature.geometry.coordinates;

  return {
    latitude,
    longitude,
    label:
      feature.properties?.name ||
      feature.properties?.city ||
      location
  };
}

// --------------------------------------
// NORMALIZE OPENSTREETMAP RESULTS
// --------------------------------------

function normalizeOverpass(elements) {
  return elements
    .filter((item) => item.tags?.name)
    .map((item) => {
      const tags = item.tags;
      const coords = item.center || item;

      return {
        id: `${item.type}/${item.id}`,
        name: tags.name,
        category:
          tags.amenity ||
          tags.building ||
          null,
        address: [
          tags["addr:housenumber"],
          tags["addr:street"],
          tags["addr:suburb"],
          tags["addr:city"],
          tags["addr:postcode"]
        ]
          .filter(Boolean)
          .join(", ") || null,
        website:
          tags.website ||
          tags["contact:website"] ||
          null,
        phone:
          tags.phone ||
          tags["contact:phone"] ||
          null,
        email:
          tags.email ||
          tags["contact:email"] ||
          null,
        latitude: coords.lat,
        longitude: coords.lon,
        mapUrl:
          `https://www.openstreetmap.org/${item.type}/${item.id}`,
        source: "OpenStreetMap"
      };
    });
}

// --------------------------------------
// NORMALIZE PHOTON RESULTS
// --------------------------------------

function normalizePhoton(features, category) {
  const allowed = new Set(CATEGORIES[category]);
  const seen = new Set();

  return features
    .filter((feature) => {
      const p = feature.properties || {};
      const type = p.osm_value || p.type || "";

      return (
        !type ||
        allowed.has(type) ||
        (
          category === "all" &&
          /school|college|hospital|clinic|university|doctor/i.test(
            `${p.name || ""} ${type}`
          )
        )
      );
    })
    .filter((feature) => {
      const p = feature.properties || {};

      if (!p.name) return false;

      const key =
        `${p.name}|${p.street || ""}|${p.city || ""}`
          .toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .map((feature, index) => {
      const p = feature.properties || {};

      const [longitude, latitude] =
        feature.geometry.coordinates;

      return {
        id:
          `photon-${index}-${encodeURIComponent(p.name)}`,
        name: p.name,
        category:
          p.osm_value ||
          p.type ||
          category,
        address: [
          p.housenumber,
          p.street,
          p.district,
          p.city,
          p.state,
          p.postcode
        ]
          .filter(Boolean)
          .join(", ") || null,
        website: null,
        phone: null,
        email: null,
        latitude,
        longitude,
        mapUrl:
          `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`,
        source: "OpenStreetMap via Photon"
      };
    });
}

// --------------------------------------
// OVERPASS SEARCH
// --------------------------------------

async function searchOverpass(
  location,
  category,
  radius
) {
  const amenityPattern =
    CATEGORIES[category].join("|");

  const query = `
    [out:json][timeout:15];
    (
      nwr["amenity"~"^(${amenityPattern})$"]
        (around:${radius},${location.latitude},${location.longitude});
    );
    out center tags 30;
  `;

  let lastError;

  for (const server of OVERPASS_SERVERS) {
    try {
      const result = await fetchJson(
        server,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
            "User-Agent": "VOXERA-Discovery/1.0"
          },
          body: new URLSearchParams({
            data: query
          })
        },
        18000
      );

      return normalizeOverpass(
        result.elements || []
      );
    } catch (error) {
      lastError = error;

      console.warn(
        "Overpass provider failed:",
        server,
        error.message
      );
    }
  }

  throw (
    lastError ||
    new Error("All Overpass providers failed.")
  );
}

// --------------------------------------
// PHOTON FALLBACK SEARCH
// --------------------------------------

async function searchPhoton(location, category) {
  const terms = CATEGORIES[category];
  const allFeatures = [];

  for (const term of terms) {
    const url = new URL(
      "https://photon.komoot.io/api/"
    );

    url.searchParams.set("q", term);
    url.searchParams.set(
      "lat",
      String(location.latitude)
    );
    url.searchParams.set(
      "lon",
      String(location.longitude)
    );
    url.searchParams.set("limit", "15");

    try {
      const result = await fetchJson(
        url.toString(),
        {},
        12000
      );

      allFeatures.push(
        ...(result.features || [])
      );
    } catch (error) {
      console.warn(
        "Photon search failed:",
        term,
        error.message
      );
    }
  }

  return normalizePhoton(
    allFeatures,
    category
  );
}

// --------------------------------------
// ORGANIZATION DISCOVERY ENDPOINT
// POST /api/organizations/discovery/search
// --------------------------------------

router.post("/search", async (req, res) => {
  try {
    const {
      location: requestedLocation,
      category = "all",
      radius = 8000
    } = req.body || {};

    if (
      typeof requestedLocation !== "string" ||
      !requestedLocation.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a city or location."
      });
    }

    const normalizedCategory =
      String(category).toLowerCase();

    if (!CATEGORIES[normalizedCategory]) {
      return res.status(400).json({
        success: false,
        message: "Unsupported category.",
        supportedCategories:
          Object.keys(CATEGORIES)
      });
    }

    const safeRadius = Math.min(
      Math.max(Number(radius) || 8000, 1000),
      25000
    );

    const coordinates = await geocode(
      requestedLocation.trim()
    );

    let organizations = [];
    let provider = "Overpass";

    try {
      organizations = await searchOverpass(
        coordinates,
        normalizedCategory,
        safeRadius
      );
    } catch (error) {
      console.warn(
        "Switching to Photon fallback:",
        error.message
      );

      provider = "Photon fallback";
    }

    if (!organizations.length) {
      organizations = await searchPhoton(
        coordinates,
        normalizedCategory
      );

      provider = "Photon";
    }

    return res.json({
      success: true,
      platform: "VOXERA",
      source: "OpenStreetMap",
      provider,
      searchedLocation: coordinates.label,
      category: normalizedCategory,
      count: organizations.length,
      data: organizations,
      notice:
        "Results depend on map coverage. Contact details may be unavailable. Verify organization details before taking action."
    });
  } catch (error) {
    console.error(
      "Organization discovery failed:",
      error.message
    );

    return res.status(502).json({
      success: false,
      message:
        "Organization discovery is temporarily unavailable. Please retry shortly.",
      detail: error.message
    });
  }
});

// --------------------------------------
// OFFICIAL PORTAL SEARCH
// POST /api/organizations/discovery/search-portal
// --------------------------------------

router.post("/search-portal", async (req, res) => {
  try {
    const {
      organizationName,
      location,
      requestType = "appointment"
    } = req.body || {};

    if (
      typeof organizationName !== "string" ||
      !organizationName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required."
      });
    }

    if (
      typeof location !== "string" ||
      !location.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Organization location is required."
      });
    }

    const normalizedType =
      String(requestType).toLowerCase();

    if (
      !["appointment", "admission"].includes(
        normalizedType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Request type must be appointment or admission."
      });
    }

    const searchPhrase =
      normalizedType === "admission"
        ? "official school college university admission application enquiry portal"
        : "official hospital clinic appointment booking portal";

    const searchQuery = [
      organizationName.trim(),
      location.trim(),
      searchPhrase
    ].join(" ");

    const searchUrl = new URL(
      "https://www.google.com/search"
    );

    searchUrl.searchParams.set(
      "q",
      searchQuery
    );

    return res.json({
      success: true,
      platform: "VOXERA",
      organizationName: organizationName.trim(),
      location: location.trim(),
      requestType: normalizedType,
      portalFound: false,
      verified: false,
      searchQuery,
      searchUrl: searchUrl.toString(),
      message:
        normalizedType === "admission"
          ? "A search link for the institution's admission information is ready. VOXERA has not verified an official admission portal. Check that the result belongs to the institution before sharing personal information."
          : "A search link for the provider's appointment information is ready. VOXERA has not verified an official booking portal. Check that the result belongs to the provider before sharing personal information."
    });
  } catch (error) {
    console.error(
      "Portal discovery error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to prepare the portal search link."
    });
  }
});

module.exports = router;