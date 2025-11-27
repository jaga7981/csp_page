import { jsPDF } from 'jspdf'
import { downloadFile } from './download'

export type ConversationExportFormat = 'txt' | 'pdf' | 'doc'

type ExportMessage = {
  order: number
  direction: 'sent' | 'received'
  author: string
  body: string
  date: string
}

type ExportThread = {
  id: string
  subject: string
  label: string
  messages: ExportMessage[]
}

type ExportPayload = {
  agentName: string
  scopeLabel: string
  threads: ExportThread[]
}

const NEW_SECTION = `${'-'.repeat(80)}\n`

export function exportConversations(payload: ExportPayload, format: ConversationExportFormat, fileBaseName: string) {
  const safeFileBase = fileBaseName.replace(/\s+/g, '_').toLowerCase()
  switch (format) {
    case 'pdf':
      exportPdf(payload, `${safeFileBase}.pdf`)
      break
    case 'doc':
      exportDoc(payload, `${safeFileBase}.doc`)
      break
    default:
      exportText(payload, `${safeFileBase}.txt`)
      break
  }
}

function exportText(payload: ExportPayload, fileName: string) {
  const lines: string[] = []
  lines.push(`${payload.scopeLabel} — ${payload.agentName}`)
  lines.push(`Downloaded: ${new Date().toLocaleString()}`)
  lines.push(NEW_SECTION)

  payload.threads.forEach((thread, threadIndex) => {
    lines.push(`Thread ${threadIndex + 1}: ${thread.subject}`)
    lines.push(NEW_SECTION)
    thread.messages.forEach((msg) => {
      lines.push(formatMessageHeader(msg))
      lines.push(msg.body)
      lines.push('')
    })
    lines.push(NEW_SECTION)
  })

  downloadFile(lines.join('\n'), fileName, 'text/plain')
}

function exportDoc(payload: ExportPayload, fileName: string) {
  const htmlSections = payload.threads
    .map(
      (thread, threadIndex) => `
      <section class="thread">
        <h2>Thread ${threadIndex + 1}: ${thread.subject}</h2>
        ${thread.messages
          .map(
            (msg) => `
            <article class="message">
              <p class="meta">${formatMessageHeader(msg)}</p>
              <p>${escapeHtml(msg.body).replace(/\n/g, '<br/>')}</p>
            </article>
          `
          )
          .join('')}
      </section>
    `
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${payload.scopeLabel}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.5; margin: 24px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 12px; margin-bottom: 24px; }
          h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
          .message { border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; }
          .meta { font-size: 12px; color: #555; font-weight: bold; margin-bottom: 6px; }
        </style>
      </head>
      <body>
        <h1>${payload.scopeLabel}</h1>
        <p class="subtitle">${payload.agentName} • Downloaded ${new Date().toLocaleString()}</p>
        ${htmlSections}
      </body>
    </html>
  `

  downloadFile(`\ufeff${html}`, fileName, 'application/msword')
}

function exportPdf(payload: ExportPayload, fileName: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  let cursorY = 60
  const pageMarginX = 48
  const pageWidth = doc.internal.pageSize.getWidth() - pageMarginX * 2

  doc.setFontSize(14)
  doc.text(payload.scopeLabel, pageMarginX, cursorY)
  cursorY += 18
  doc.setFontSize(11)
  doc.setTextColor('#555555')
  doc.text(`${payload.agentName} — ${new Date().toLocaleString()}`, pageMarginX, cursorY)
  doc.setTextColor('#000000')
  cursorY += 24

  payload.threads.forEach((thread, threadIndex) => {
    cursorY = ensureRoom(doc, cursorY, 30)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Thread ${threadIndex + 1}: ${thread.subject}`, pageMarginX, cursorY)
    doc.setFont('helvetica', 'normal')
    cursorY += 18

    thread.messages.forEach((msg) => {
      cursorY = ensureRoom(doc, cursorY, 40)
      doc.setFontSize(11)
      doc.setTextColor('#444444')
      const metaLines = doc.splitTextToSize(formatMessageHeader(msg), pageWidth) as string[]
      metaLines.forEach((line: string) => {
        doc.text(line, pageMarginX, cursorY)
        cursorY += 14
      })

      doc.setTextColor('#000000')
      const bodyLines = doc.splitTextToSize(msg.body, pageWidth) as string[]
      bodyLines.forEach((line: string) => {
        doc.text(line, pageMarginX, cursorY)
        cursorY += 14
      })
      cursorY += 8
    })
    cursorY += 6
  })

  const blob = doc.output('blob')
  downloadFile(blob, fileName, 'application/pdf')
}

function ensureRoom(doc: jsPDF, cursorY: number, neededSpace: number) {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (cursorY + neededSpace <= pageHeight - 40) {
    return cursorY
  }
  doc.addPage()
  return 60
}

function formatMessageHeader(msg: ExportMessage) {
  const directionLabel = msg.direction === 'sent' ? 'Sent' : 'Received'
  const timestamp = new Date(msg.date).toLocaleString()
  return `Message ${msg.order} (${directionLabel} by ${msg.author} at ${timestamp})`
}

function escapeHtml(content: string) {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}


