

export interface BreadcrumbItem {
  label: string;
  level: number;
}

export enum BreadcrumbLevel {
  HOME = 0,
  SECTION = 1,
  CATEGORY = 2,
  MODULE = 3
}
