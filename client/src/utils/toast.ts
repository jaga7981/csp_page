export type ToastType = 'success' | 'error' | 'info'

export function showToast(title: string, message: string, type: ToastType = 'info') {
  const toastContainer = document.getElementById('toastContainer')
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
  }, 3000)
}

export default showToast
