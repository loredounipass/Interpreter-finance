import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface DownloadData {
  period: string
  totalMinutes: number
  totalEarnings: number
  entries: { date: string; minutes: number; note: string | null }[]
}

// FORMATS AND GENERATES A PROFESSIONAL PDF DOCUMENT USING JSPDF AND JSPDF-AUTOTABLE
export function generateProfessionalPDF(data: DownloadData) {
  const doc = new jsPDF()
  
  // Set up professional fonts and styling
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Header section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(33, 37, 41)
  doc.text('Interpreter Finance', 14, 22)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(108, 117, 125)
  doc.text('Detailed Earnings & Practice Report', 14, 30)

  // Report details
  doc.setFontSize(10)
  doc.setTextColor(33, 37, 41)
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(`Generated: ${reportDate}`, pageWidth - 14, 22, { align: 'right' })
  doc.text(`Period: ${data.period.charAt(0).toUpperCase() + data.period.slice(1)}`, pageWidth - 14, 28, { align: 'right' })

  // Horizontal line
  doc.setDrawColor(222, 226, 230)
  doc.line(14, 35, pageWidth - 14, 35)

  // Summary statistics box
  doc.setFillColor(248, 249, 250)
  doc.rect(14, 42, pageWidth - 28, 24, 'F')
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Total Minutes:', 20, 52)
  doc.setFont('helvetica', 'normal')
  doc.text(data.totalMinutes.toString(), 60, 52)

  doc.setFont('helvetica', 'bold')
  doc.text('Total Earnings:', 120, 52)
  doc.setFont('helvetica', 'normal')
  doc.text(`$${data.totalEarnings.toFixed(2)}`, 160, 52)

  // Table
  const tableData = data.entries.map((entry) => [
    entry.date,
    entry.minutes.toString(),
    entry.note || '-'
  ])

  autoTable(doc, {
    startY: 75,
    head: [['Date', 'Minutes', 'Notes']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [33, 37, 41],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 6,
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    margin: { top: 75, left: 14, right: 14 },
  })

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Save the PDF
  const filename = `interpreter-finance-report-${data.period}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}
