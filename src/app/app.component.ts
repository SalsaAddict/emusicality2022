import { Component } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import { DataService } from "./data.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent {
  constructor(data: DataService, updates: SwUpdate) {
    if (data.isOnline) {
      this.updating = true;
      console.log("Checking for emusicality update.");
      updates
        .checkForUpdate()
        .then(value => {
          if (value) {
            console.log("An emusicality update is available.");
            updates
              .activateUpdate()
              .then(value => {
                if (value)
                  console.log("The emusicality update was successfully installed.");
                else
                  console.log('The emusicality update failed to install.')
              });
            console.log('No emusicality updates are available.')
          }
        })
        .finally(() => {
          this.updating = false;
        });
    }
    else this.updating = false;
  }
  updating: boolean;
}
