import { localDataSource } from './localDataSource'
import { remoteDataSource } from './remoteDataSource'
import type { DataSource } from './dataSource'

export const dataSource: DataSource = import.meta.env.VITE_API_BASE_URL
  ? remoteDataSource
  : localDataSource
