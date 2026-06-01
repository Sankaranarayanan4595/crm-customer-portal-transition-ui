import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
// interface Step {
//   label: string;
//   completed: boolean;
//   disabled: boolean;
// }
@Component({
  selector: 'app-stepper',
  imports: [CommonModule],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss'
})
export class StepperComponent {
  // @Input() steps: Step[] = [];
  @Input() steps: any[] = [];
  @Input() currentStep = 0;
  @Input() completeLabel = 'Complete';
  @Input() verticalPos: boolean = false;
  @Input() progressbar: boolean = false;
  @Input() enablestepclick: boolean = false;
  @Output() stepChange = new EventEmitter<number>();
  @Output() completeEvent = new EventEmitter<void>();

  ngOnInit() {
    if (!this.steps || this.steps.length === 0) {
      console.warn("Stepper component requires the steps input to be populated");
    }
    console.clear();
    console.log(this.steps);
  }

  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      console.log(this.currentStep);
      this.stepChange.emit(this.currentStep);
    }
  }

  back() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.stepChange.emit(this.currentStep);
    }
  }

  goToStep(stepIndex: number) {
    if (this.enablestepclick) {
      this.currentStep = stepIndex;
      this.stepChange.emit(this.currentStep);
    }
  }

  complete() {
    this.completeEvent.emit();
  }
}

