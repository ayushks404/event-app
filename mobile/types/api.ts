import { Meta } from './models';

export interface ApiOne<T> {
  success: boolean;
  data: T;
}

export interface ApiList<T> {
  success: boolean;
  data: T[];
  meta: Meta;
}
