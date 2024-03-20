import { Injectable } from '@nestjs/common';

@Injectable()
export class DateHandlingProvider {
  addMonths(date: Date, numberOfMonths: number): Date {
    const formattedDate = new Date(date.getTime());
    const dayOfMonth = formattedDate.getDate();

    formattedDate.setMonth(formattedDate.getMonth() + numberOfMonths + 1, 0);

    const daysInMonth = formattedDate.getDate();

    if (dayOfMonth >= daysInMonth) return formattedDate;

    formattedDate.setFullYear(
      formattedDate.getFullYear(),
      formattedDate.getMonth(),
      dayOfMonth,
    );

    return formattedDate;
  }

  isBefore(date: Date, dateToBeCompared: Date) {
    return date.getTime() < dateToBeCompared.getTime();
  }

  isAfter(date: Date, dateToBeCompared: Date) {
    return date.getTime() > dateToBeCompared.getTime();
  }

  addMinutes(date: Date, numberOfMinutes: number): Date {
    const minutesInMilliseconds = numberOfMinutes * 60000;
    return new Date(date.getTime() + minutesInMilliseconds);
  }

  addHours(date: Date, numberOfHours: number): Date {
    const hoursInMilliseconds = numberOfHours * 3600000;
    return new Date(date.getTime() + hoursInMilliseconds);
  }
}
