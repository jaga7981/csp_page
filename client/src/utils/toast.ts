export type ToastType = 'success' | 'error' | 'info'
type ToastPosition = 'top-right' | 'bottom-right'

type ToastOptions = {
  type?: ToastType
  position?: ToastPosition
  duration?: number
}

export function showToast(title: string, message: string, typeOrOptions?: ToastType | ToastOptions, extraOptions?: ToastOptions) {
  let type: ToastType = 'info'
  let options: ToastOptions = {}

  if (typeof typeOrOptions === 'string') {
    type = typeOrOptions
    options = extraOptions ?? {}
  } else if (typeof typeOrOptions === 'object' && typeOrOptions !== null) {
    options = typeOrOptions
    if (typeOrOptions.type) {
      type = typeOrOptions.type
    }
  }

  const position: ToastPosition = options.position ?? 'top-right'
  const duration = options.duration ?? (position === 'top-right' ? 4000 : 2000)
  const containerId = position === 'bottom-right' ? 'toastContainerBottom' : 'toastContainerTop'
  const toastContainer = document.getElementById(containerId)
  if (!toastContainer) return

  const toast = document.createElement('div')
  toast.className = `toast ${type}`

  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    info: '📧',
  }

  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `

  toastContainer.appendChild(toast)

  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

export default showToast
