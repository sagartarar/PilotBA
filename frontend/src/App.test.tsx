// Tests for the main App component
import { describe, it, expect } from 'vitest'
import { render, screen } from './test/utils/test-utils'
import App from './App'

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText('PilotBA')).toBeInTheDocument()
  })

  it('displays the application title', () => {
    render(<App />)
    const title = screen.getByRole('heading', { name: /PilotBA/i })
    expect(title).toBeInTheDocument()
    expect(title).toHaveClass('text-3xl', 'font-bold')
  })

  it('displays the application tagline', () => {
    render(<App />)
    expect(screen.getByText(/Lightning-Fast Business Intelligence/i)).toBeInTheDocument()
  })

  it('displays the welcome message', () => {
    render(<App />)
    expect(screen.getByText(/Welcome to PilotBA/i)).toBeInTheDocument()
    expect(screen.getByText(/Building the next generation of BI tools/i)).toBeInTheDocument()
  })

  it('has proper layout structure', () => {
    const { container } = render(<App />)
    
    // Check for header
    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('bg-white', 'shadow-sm')
    
    // Check for main content area
    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
    expect(main).toHaveClass('max-w-7xl', 'mx-auto')
  })

  it('applies responsive padding classes', () => {
    const { container } = render(<App />)
    const main = container.querySelector('main')
    expect(main).toHaveClass('px-4', 'sm:px-6', 'lg:px-8')
  })

  it('renders with QueryClientProvider', () => {
    // If the component renders successfully, QueryClientProvider is working
    const { container } = render(<App />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('App Component - Accessibility', () => {
  it('has semantic HTML structure', () => {
    const { container } = render(<App />)
    
    expect(container.querySelector('header')).toBeInTheDocument()
    expect(container.querySelector('main')).toBeInTheDocument()
  })

  it('heading hierarchy is correct', () => {
    render(<App />)
    
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('PilotBA')
    
    const h2 = screen.getByRole('heading', { level: 2 })
    expect(h2).toHaveTextContent('Welcome to PilotBA')
  })
})

describe('App Component - Visual Regression', () => {
  it('matches snapshot', () => {
    const { container } = render(<App />)
    expect(container).toMatchSnapshot()
  })
})

