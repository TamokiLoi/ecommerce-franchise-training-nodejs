const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth API",
      version: "1.0.0",
      description: "Authentication API documentation",
      contact: {
        email: "loinguyenlamthanh@gmail.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Index",
        description: "Index related endpoints",
      },
      {
        name: "Migrate",
        description: "Migrate related endpoints",
      },
      {
        name: "Franchise",
        description: "Franchise related endpoints",
      },
      {
        name: "Role",
        description: "Role related endpoints",
      },
      {
        name: "Auth",
        description: "Auth related endpoints",
      },
      {
        name: "User",
        description: "User related endpoints",
      },
    ],
  },
  apis: ["./src/modules/**/*.ts"], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

// Convert JSON spec to YAML
const swaggerYaml = yaml.dump(swaggerSpec);

// Define the output path for the YAML file
const outputPath = path.resolve(__dirname, "../swagger.yaml");

// Write the YAML file to disk
fs.writeFileSync(outputPath, swaggerYaml, "utf8");
console.log("Swagger YAML file generated at:", outputPath);

module.exports = swaggerSpec;
