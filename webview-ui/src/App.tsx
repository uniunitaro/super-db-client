import { VSCodeBadge, VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import './App.css'
import { vscode } from './utilities/vscode'

function App() {
  function handleHowdyClick() {
    vscode.postMessage({
      command: 'hello',
      text: 'Hey there partner! 🤠',
    })
  }

  return (
    <main>
      <h1>Hello World!</h1>
      <VSCodeButton onClick={handleHowdyClick}>Hoefwdy!</VSCodeButton>
      <VSCodeBadge>VS Code</VSCodeBadge>
    </main>
  )
}

export default App
