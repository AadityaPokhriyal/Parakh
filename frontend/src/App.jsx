import PdfUploader from './components/PdfUploader'

function App() {
  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <h1 style={styles.title}>AICTE Parakh</h1>
        <p style={styles.subtitle}>Unified Exam Paper Evaluation and Assessment Portal</p>
      </header>
      <main style={styles.main}>
        <PdfUploader />
      </main>
      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} AICTE Parakh. All rights reserved.</p>
      </footer>
    </div>
  )
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
    justifyContent: 'space-between',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    margin: '40px 0 20px',
  },
  title: {
    margin: '0',
    fontSize: '48px',
    background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '800',
    letterSpacing: '-1px',
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '16px',
    color: 'var(--text)',
  },
  main: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  footer: {
    textAlign: 'center',
    padding: '20px 0',
    fontSize: '14px',
    color: 'var(--text)',
    borderTop: '1px solid var(--border)',
    marginTop: '40px',
  }
}

export default App

