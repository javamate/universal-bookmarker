import { render } from 'preact'
import './index.css'
import './styles/auth.css'
import './styles/dashboard.css'
import './styles/layout.css'
import { AppRouter } from './AppRouter.tsx'

render(<AppRouter />, document.getElementById('app')!)
