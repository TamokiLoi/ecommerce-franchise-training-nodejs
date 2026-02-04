import dotenv from "dotenv";
import App from "./app";
import { validateEnv } from "./core/utils";
import { AuthModule } from "./modules/auth";
import { IndexModule } from "./modules/index";
import { UserModule } from "./modules/user";
import { FranchiseModule } from "./modules/franchise";

dotenv.config();
validateEnv();

const indexModule = new IndexModule();
const authModule = new AuthModule();
const franchiseModule = new FranchiseModule();
const userModule = new UserModule();

const routes = [indexModule.getRoute(), authModule.getRoute(), franchiseModule.getRoute(), userModule.getRoute()];

const app = new App(routes);

app.listen();
