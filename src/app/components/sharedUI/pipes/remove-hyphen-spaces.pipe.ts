import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeHyphenSpaces'
})
export class RemoveHyphenSpacesPipe implements PipeTransform {

 transform(value: string): string {
    return value ? value.replace(/\s*-\s*/g, '-') : value;
  }

}
