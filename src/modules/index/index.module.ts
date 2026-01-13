import { BaseModule } from "../../core/modules";
import IndexController from "./index.controller";
import IndexRoute from "./index.route";

export class IndexModule extends BaseModule<IndexRoute> {
  constructor() {
    super();
    this.route = new IndexRoute(new IndexController());
  }
}
