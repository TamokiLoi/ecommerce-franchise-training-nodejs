export abstract class BaseModule<T> {
  protected route!: T;

  public getRoute(): T {
    return this.route;
  }
}

export default BaseModule;
