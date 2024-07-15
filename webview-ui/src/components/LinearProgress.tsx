import type { FC } from 'react'
import { css } from 'styled-system/css'

const LinearProgress: FC = () => {
  return (
    <progress
      className={css({
        display: 'block',
        appearance: 'none',
        border: 'none',
        h: '0.5',
        w: 'full',
        color: 'var(--vscode-progressBar-background)',
        '&::-webkit-progress-bar': {
          backgroundColor: 'transparent',
        },
        _indeterminate: {
          backgroundSize: '200% 100%',
          backgroundImage:
            'linear-gradient(to right, transparent 50%, currentColor 50%, currentColor 60%, transparent 60%, transparent 71.5%, currentColor 71.5%, currentColor 84%, transparent 84%)',
          animation: 'progress 3s linear infinite',
        },
      })}
    />
  )
}

export default LinearProgress
