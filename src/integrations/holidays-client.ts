export interface Holiday {
  date: string;
  name: string;
  type: string;
}

export interface HolidaysClient {
  getHolidays(year: number): Promise<Holiday[]>;
}
