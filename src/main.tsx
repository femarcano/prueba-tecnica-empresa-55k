import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { HttpUsersRepository } from './repositories/usersRepository.ts'
import './index.css'

const repository = new HttpUsersRepository()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App repository={repository} />
  </React.StrictMode>,
)