/**
 * Algomancy Card Converter
 *
 * This script converts the creator's JSON format to our application format.
 * It reads from app/cards/AlgomancyCards.json and outputs a new file in our format.
 *
 * Usage:
 *   node convert-creator-cards.js [output-file]
 *
 * Example:
 *   node convert-creator-cards.js ../app/cards/ConvertedCards.json
 *
 * IMPORTANT: This script does NOT modify the original file.
 */

const fs = require("fs");
const path = require("path");

// Get output path from command line arguments or use default
const defaultOutputPath = path.join(
  __dirname,
  "..",
  "app",
  "cards",
  "ConvertedCards.json"
);
const outputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : defaultOutputPath;

// Input path
const inputPath = path.join(
  __dirname,
  "..",
  "app",
  "cards",
  "AlgomancyCards.json"
);

// Element mapping (from creator's format to our format)
const elementMapping = {
  r: "Fire",
  b: "Water",
  e: "Earth",
  g: "Wood",
  m: "Metal",
  p: "Colorless",
};

// Timing mapping
const timingMapping = {
  Battle: "Battle",
  Haste: "Haste",
  Virus: "Virus",
  "": "Standard", // Default
};

// Function to parse card type and attributes from the creator's format
function parseTypeAndAttributes(typeString) {
  const result = {
    mainType: "Unit", // Default
    subType: "",
    attributes: [],
  };

  // Extract attributes in curly braces
  const attributeMatches = typeString.match(/{([^}]+)}/g) || [];
  attributeMatches.forEach((match) => {
    const attribute = match.replace(/{|}/g, "").trim();
    if (
      attribute === "Battle" ||
      attribute === "Haste" ||
      attribute === "Virus"
    ) {
      // These are timing types, not attributes
    } else if (attribute === "Unstable" || attribute === "Burst") {
      result.attributes.push(attribute);
    } else {
      result.attributes.push(attribute);
    }
  });

  // Remove attributes from the type string
  let cleanTypeString = typeString;
  attributeMatches.forEach((match) => {
    cleanTypeString = cleanTypeString.replace(match, "").trim();
  });

  // Split the remaining type string
  const typeParts = cleanTypeString.split(" ");

  // The last word is usually the main type
  const lastWord = typeParts[typeParts.length - 1];
  if (
    lastWord === "Unit" ||
    lastWord === "Spell" ||
    lastWord === "Resource" ||
    lastWord === "Token" ||
    lastWord === "Spell Token" ||
    lastWord === "Spell Unit"
  ) {
    result.mainType = lastWord;
    result.subType = typeParts.slice(0, typeParts.length - 1).join(" ");
  } else {
    // If no recognized main type, assume it's all subtype
    result.subType = cleanTypeString;
  }

  return result;
}

// Function to parse element and affinity from the creator's format
function parseElementAndAffinity(cost) {
  if (cost === "empty" || cost === "p") {
    return {
      element: {
        type: "Colorless",
        symbol: "/images/elements/colorless.png",
      },
      affinity: {},
    };
  }

  // Count occurrences of each element
  const elementCounts = {};
  for (const char of cost) {
    if (elementMapping[char]) {
      elementCounts[char] = (elementCounts[char] || 0) + 1;
    }
  }

  // Get the elements present
  const elements = Object.keys(elementCounts);

  // Create the element object
  let element = {
    type: elementMapping[elements[0]] || "Colorless",
    symbol: `/images/elements/${elementMapping[elements[0]].toLowerCase()}.png`,
  };

  // If there are two different elements, it's a hybrid
  if (elements.length === 2) {
    element.type = `${elementMapping[elements[0]]}/${
      elementMapping[elements[1]]
    }`;
    element.secondarySymbol = `/images/elements/${elementMapping[
      elements[1]
    ].toLowerCase()}.png`;
  }

  // Create the affinity object
  const affinity = {};
  elements.forEach((e) => {
    const elementName = elementMapping[e].toLowerCase();
    if (elementName !== "colorless") {
      affinity[elementName] = elementCounts[e];
    }
  });

  return { element, affinity };
}

// Function to parse abilities from the creator's format
function parseAbilities(text) {
  if (!text) return [];

  // Replace special notations with our format
  let processedText = text
    .replace(/\[Augment\]/g, "AUGMENT:")
    .replace(/\[Augment\]\[once\]/g, "AUGMENT 1X:")
    .replace(/\[Switch\]/g, "GRAFT:")
    .replace(/\[Switch1\]/g, "GRAFT1:")
    .replace(/\[once\]/g, "1X:")
    .replace(/\[one\]/g, "1")
    .replace(/\[two\]/g, "2")
    .replace(/\[three\]/g, "3")
    .replace(/\[x\]/g, "X")
    .replace(/\[r\]/g, "FIRE")
    .replace(/\[b\]/g, "WATER")
    .replace(/\[e\]/g, "EARTH")
    .replace(/\[g\]/g, "WOOD")
    .replace(/\[m\]/g, "METAL")
    .replace(/{i}\((.*?)\)/g, "($1)")
    .replace(/{g}(\w+)/g, "$1")
    .replace(/{p}(\w+)/g, "$1")
    .replace(/{\/n}/g, " ");

  // Split by line breaks if present
  const abilities = processedText
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line);

  // If no line breaks, return the whole text as one ability
  return abilities.length > 0 ? abilities : [processedText];
}

// Function to generate Cloudinary URL for a card
function generateCloudinaryUrl(cardName) {
  // Format the card name for the URL
  const formattedName = cardName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Create the Cloudinary URL with your cloud name
  return `https://res.cloudinary.com/dyfj9qvc0/image/upload/v1747595000/algomancy/cards/algomancy_${formattedName}.jpg`;
}

// Function to convert a card from creator's format to our format
function convertCard(creatorCard, index) {
  // Generate an ID from the name
  const id = creatorCard.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Parse element and affinity
  const { element, affinity } = parseElementAndAffinity(creatorCard.cost);

  // Parse type and attributes
  const typeAndAttributes = parseTypeAndAttributes(creatorCard.type);

  // Determine timing
  let timing = {
    type: "Standard",
    description: "Can be played during deployment",
  };

  // Check for timing in type
  if (creatorCard.type.includes("{Battle}")) {
    timing.type = "Battle";
    timing.description = "Special timing rules apply";
  } else if (creatorCard.type.includes("{Haste}")) {
    timing.type = "Haste";
    timing.description = "Special timing rules apply";
  } else if (creatorCard.type.includes("{Virus}")) {
    timing.type = "Virus";
    timing.description = "Special timing rules apply";
  }

  // Parse abilities
  const abilities = parseAbilities(creatorCard.text);

  // Determine complexity
  let complexity = "Common";
  if (creatorCard.complexity === "Complex") {
    complexity = "Uncommon";
  } else if (creatorCard.complexity === "Glitch") {
    complexity = "Mythic";
  }

  // Generate Cloudinary URL for the card
  const cloudinaryUrl = generateCloudinaryUrl(creatorCard.name);

  // Create the converted card
  return {
    id,
    name: creatorCard.name,
    manaCost: parseInt(creatorCard.total_cost) || 0,
    element,
    stats: {
      power: parseInt(creatorCard.power) || 0,
      defense: parseInt(creatorCard.toughness) || 0,
      affinity,
    },
    timing,
    typeAndAttributes,
    abilities,
    set: {
      symbol: "core",
      name: "Core Set",
      complexity,
    },
    imageUrl: cloudinaryUrl,
    currentIndex: index,
  };
}

// Main function to convert all cards
function convertCards() {
  try {
    // Read the input file
    const inputData = fs.readFileSync(inputPath, "utf8");
    const creatorCards = JSON.parse(inputData);

    // Convert each card
    const convertedCards = [];
    let index = 0;

    for (const [cardName, cardVersions] of Object.entries(creatorCards)) {
      // Skip help cards and backs
      if (
        cardVersions[0].type === "Help Card" ||
        cardVersions[0].Side === "Back"
      ) {
        continue;
      }

      // Convert the card
      const convertedCard = convertCard(cardVersions[0], index++);
      convertedCards.push(convertedCard);
    }

    // Write the output file
    fs.writeFileSync(outputPath, JSON.stringify(convertedCards, null, 2));

    console.log(
      `Conversion complete! ${convertedCards.length} cards converted.`
    );
    console.log(`Output file: ${outputPath}`);
  } catch (error) {
    console.error("Error converting cards:", error);
  }
}

// Run the conversion
convertCards();
