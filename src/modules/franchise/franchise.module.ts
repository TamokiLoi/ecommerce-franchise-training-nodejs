import { BaseModule } from "../../core/modules";
import FranchiseController from "./franchise.controller";
import { FranchiseRepository } from "./franchise.repository";
import FranchiseRoute from "./franchise.route";
import FranchiseService from "./franchise.service";

export class FranchiseModule extends BaseModule<FranchiseRoute> {
  private readonly repo: FranchiseRepository;

  constructor() {
    super();
    this.repo = new FranchiseRepository();

    const franchiseService = new FranchiseService(this.repo);
    const franchiseController = new FranchiseController(franchiseService);
    
    this.route = new FranchiseRoute(franchiseController);
  }
}
