import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import mongoose from "mongoose";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { IRoute } from "./core/interfaces";
import { errorMiddleware } from "./core/middleware";
import { logger } from "./core/utils";
import cookieParser from "cookie-parser";

export default class App {
  public app: express.Application;
  public port: string | number;
  public production: boolean;

  constructor(routes: IRoute[]) {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.production = !!(process.env.NODE_ENV === "production");

    // ❌ Disable ETag to prevent 304
    this.app.disable("etag");

    this.initializeMiddleware();
    this.initializeSwagger();
    this.initializeRoute(routes);
    this.initializeErrorMiddleware();
  }

  // start server
  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`Server is running at port ${this.port}`);
    });
  }

  // connect to mongoDB
  public async connectToDatabase() {
    const mongoDbUri = process.env.MONGODB_URI;
    if (!mongoDbUri) {
      throw new Error("MongoDb URI is empty!");
    }

    mongoose.set("strictQuery", true);
    mongoose.set("bufferCommands", false);

    // 🔥 Attach listeners BEFORE connect
    mongoose.connection.on("connected", () => {
      logger.info("MongoDB connected");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    await mongoose.connect(mongoDbUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: false,
    });

    logger.info("Connection to database success!");
  }

  // declare middleware
  private initializeMiddleware() {
    this.app.use((req, res, next) => {
      logger.info(`FULL URL: ${req.originalUrl} - METHOD: ${req.method}`);
      next();
    });

    this.app.use(cookieParser());

    // 🚫 Disable cache for auth APIs
    this.app.use("/auth", (req, res, next) => {
      res.set("Cache-Control", "no-store");
      next();
    });

    // 🚫 Disable cache for customer-auth APIs
    this.app.use("/customer-auth", (req, res, next) => {
      res.set("Cache-Control", "no-store");
      next();
    });

    if (this.production) {
      this.app.use(hpp());
      this.app.use(helmet());
      this.app.use(morgan("combined"));
      // this.app.use(cors({ origin: "your.domain.com", credentials: true }));
      this.app.use(cors({ origin: true, credentials: true }));
    } else {
      this.app.use(morgan("dev"));
      this.app.use(cors({ origin: true, credentials: true }));
    }
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeSwagger() {
    // config for swagger
    this.app.use("/swagger", express.static(path.join(__dirname, "../node_modules/swagger-ui-dist")));
    this.app.use("/public/css", express.static("public/css"));
    const swaggerPath = path.join(__dirname, "../swagger.yaml");
    const swaggerDocument = YAML.load(swaggerPath);
    swaggerDocument.host = process.env.DOMAIN_API;
    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        swaggerOptions: {
          url: "/swagger/swagger.yaml",
        },
      }),
    );
  }

  // declare error handler middleware
  private initializeErrorMiddleware() {
    this.app.use(errorMiddleware);
  }

  // declare init router
  private initializeRoute(routes: IRoute[]) {
    routes.forEach((route) => {
      this.app.use("/", route.router);
    });
  }
}
