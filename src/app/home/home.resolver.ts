import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { DataService } from "../data.service";
import { ISongs } from "src/schema/schema";

export const homeResolver: ResolveFn<ISongs>
  = async (_route, _state, data = inject(DataService)) => {
    return await data.iSongs();
  }