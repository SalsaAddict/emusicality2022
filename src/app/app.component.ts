import { Component } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent {
  constructor(updates: SwUpdate) {
    console.log("emusicality");
    updates
      .checkForUpdate()
      .then((value) => {
        console.log("Checking for emusicality update.", value);
        if (value) {
          console.log("An emusicality update is available.");
          updates.activateUpdate().then((value) => {
            console.log("The emusicality update was successfully installed.");
          });
        }
      })
      .finally(() => {
        this.updating = false;
      });
  }
  public updating = true;
}
