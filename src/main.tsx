import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { HttpUsersRepository } from './repositories/usersRepository.ts'
import { queryClient } from './utils/queryClient.ts'
import './index.css'

const repository = new HttpUsersRepository()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App repository={repository} />
    </QueryClientProvider>
  </React.StrictMode>,
)