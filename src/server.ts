import dotenv from "dotenv";
import App from "./app";
import { validateEnv } from "./core/utils";
import { AuthModule } from "./modules/auth";
import { IndexModule } from "./modules/index";

dotenv.config();
validateEnv();

const indexModule = new IndexModule();
const authModule = new AuthModule();

const routes = [indexModule.getRoute(), authModule.getRoute()];

const app = new App(routes);

app.listen();
