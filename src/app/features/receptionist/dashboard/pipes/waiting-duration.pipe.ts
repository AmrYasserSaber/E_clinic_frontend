import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'waitingDuration',
  standalone: true,
})
export class WaitingDurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (minutes == null || Number.isNaN(minutes) || minutes < 0) return '0m';
    minutes = Math.floor(minutes);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem ? `${hours}h ${rem}m` : `${hours}h`;
  }
}
