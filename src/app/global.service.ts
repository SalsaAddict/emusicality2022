import { Injectable } from "@angular/core";
import { CheckboxControlValueAccessor } from "@angular/forms";

@Injectable({ providedIn: "root" })
export class GlobalService {
  constructor() {
    window.localStorage.setItem("count", (this.count + 1).toString());
  }
  public get count() {
    return parseInt(window.localStorage.getItem("count") ?? "0");
  }
  public get never() {
    return window.localStorage.getItem("never") === "true";
  }
  public set never(value: boolean) {
    window.localStorage.setItem("never", value.toString());
  }
}
