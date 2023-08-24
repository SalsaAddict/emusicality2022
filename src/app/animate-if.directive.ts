import { Directive, ElementRef, Input } from "@angular/core";
import * as Tone from "tone";

@Directive({ selector: "[appAnimateIf]" })
export class AnimateIfDirective {
  private condition: boolean = false;
  @Input("appAnimateIf") set appAnimateIf(value: boolean | undefined) {
    this.condition = value ?? false;
    this.animate();
  }
  @Input("animation") animation = "heartBeat";
  constructor(private readonly element: ElementRef) {
    Tone.Transport.on("start", () => {
      this.animate();
    });
  }
  private get classes() {
    return ["animate__animated", `animate__${this.animation}`];
  }
  private animate() {
    if (this.condition) {
      this.element.nativeElement.classList.add(...this.classes);
      /*
      this.tone.getTone().then(tone => {
        this.element.nativeElement.style.setProperty(
          "--animate-duration",
          `${tone.TransportTime("2n").toSeconds()}s`
        );
      });
      */
    } else {
      this.element.nativeElement.classList.remove(...this.classes);
      this.element.nativeElement.style.removeProperty("--animate-duration");
    }
    this.element.nativeElement.addEventListener(
      "animationend",
      (event: Event) => {
        event.stopPropagation();
        this.element.nativeElement.classList.remove(...this.classes);
      },
      { once: true }
    );
  }
}
