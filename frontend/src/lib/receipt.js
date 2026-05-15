import { jsPDF } from 'jspdf'
import {
  getBookingPackageNamesText,
  getPackageLineLabel,
  getPackageLineSubtitle,
  parseBookingItemTitle,
} from './bookingDisplay'

function toNumber(value) {
  if (value == null) return null
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}

function pickNumber(...values) {
  for (const value of values) {
    const parsed = toNumber(value)
    if (parsed != null) return parsed
  }
  return 0
}

function normalizeReceiptPayments(payments = [], fallbackPayment = null) {
  const normalizedPayments = Array.isArray(payments)
    ? payments
        .filter(entry => entry && (entry.status == null || entry.status === 'success'))
        .map(entry => ({
          id: entry?.id ?? `${entry?.paymentType ?? 'payment'}-${entry?.createdAt ?? ''}`,
          label: entry?.paymentType || 'Payment',
          amount: pickNumber(entry?.amount),
          status: entry?.status || 'success',
          date: entry?.createdAt || '',
          method: entry?.paymentMethod || '',
        }))
        .filter(entry => entry.amount > 0)
    : []

  if (normalizedPayments.length) return normalizedPayments

  if (
    fallbackPayment &&
    pickNumber(
      fallbackPayment?.amountPaid,
      fallbackPayment?.amount,
      fallbackPayment?.advanceAmount
    ) > 0
  ) {
    return [
      {
        id: `checkout-${fallbackPayment?.paymentType || 'payment'}`,
        label: fallbackPayment?.paymentType || 'Payment',
        amount: pickNumber(
          fallbackPayment?.amountPaid,
          fallbackPayment?.amount,
          fallbackPayment?.advanceAmount
        ),
        status: 'success',
        date: fallbackPayment?.createdAt || new Date().toISOString(),
        method: fallbackPayment?.paymentMethod || '',
      },
    ]
  }

  return []
}

export function formatReceiptCurrency(value) {
  const amount = Number(value ?? 0)
  return `Rs${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatReceiptDate(value, options = {}) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not provided'

  return date.toLocaleDateString('en-IN', {
    weekday: options.includeWeekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatReceiptDateTime(value) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not provided'

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getReceiptCustomerName(customer = {}) {
  return (
    customer?.fullName ||
    [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') ||
    [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') ||
    customer?.name ||
    customer?.email ||
    'Customer'
  )
}

export function getReceiptItemTitle(title = '') {
  const rawTitle = String(title ?? '')
  const { displayTitle, itemType, addonTitle, selectedOptions } = parseBookingItemTitle(rawTitle)

  const optionValues =
    selectedOptions && typeof selectedOptions === 'object'
      ? Object.values(selectedOptions).filter(Boolean)
      : []

  if (itemType === 'addon') {
    return optionValues.length
      ? `${addonTitle || displayTitle || rawTitle} (${optionValues.join(', ')})`
      : addonTitle || displayTitle || rawTitle
  }

  return displayTitle || rawTitle
}

export function getReceiptPaymentSummary({
  booking = null,
  payment = null,
  checkoutInfo = {},
  isSampleTastingBooking = false,
} = {}) {
  const paymentSummary = booking?.paymentSummary ?? {}
  const normalizedPayments = normalizeReceiptPayments(booking?.payments, payment)
  const paidFromPayments = normalizedPayments.reduce(
    (sum, entry) => sum + pickNumber(entry.amount),
    0
  )
  const amountPaid =
    paidFromPayments ||
    pickNumber(
      paymentSummary?.amountPaid,
      payment?.amountPaid,
      payment?.amount,
      payment?.advanceAmount
    )
  const totalAmount = pickNumber(
    paymentSummary?.totalPrice,
    booking?.totalPrice,
    payment?.totalAmount,
    amountPaid +
      pickNumber(paymentSummary?.amountDue, booking?.remainingAmount, payment?.balanceDue)
  )
  const paidInFullFromCheckout = String(payment?.paymentType ?? '').toLowerCase() === 'full'
  const amountDue = paidInFullFromCheckout
    ? 0
    : Math.max(
        0,
        totalAmount > 0
          ? totalAmount - amountPaid
          : pickNumber(paymentSummary?.amountDue, booking?.remainingAmount, payment?.balanceDue)
      )
  const isFullyPaid =
    amountDue <= 0.009 || (totalAmount > 0 && Math.abs(totalAmount - amountPaid) <= 0.009)

  return {
    totalAmount,
    amountPaid,
    amountDue,
    isFullyPaid,
    primaryLabel: isSampleTastingBooking || isFullyPaid ? 'Total Amount Paid' : 'Advance Paid',
    secondaryLabel: isFullyPaid ? 'Payment completed' : 'Balance due before event',
    showSecondaryAmount: !isSampleTastingBooking,
    eventDate: checkoutInfo?.eventDate ?? booking?.eventDate ?? '',
  }
}

export function buildReceiptData({
  booking = null,
  payment = null,
  checkoutInfo = {},
  customer = {},
  isSampleTastingBooking = false,
} = {}) {
  const paymentSummary = getReceiptPaymentSummary({
    booking,
    payment,
    checkoutInfo,
    isSampleTastingBooking,
  })
  const checkoutPackageNames = Array.isArray(checkoutInfo?.selectedItems)
    ? [
        ...new Set(
          checkoutInfo.selectedItems
            .map(item => parseBookingItemTitle(item?.title))
            .filter(item => item.itemType !== 'addon')
            .map(item => String(item?.displayTitle ?? '').trim())
            .filter(Boolean)
        ),
      ]
    : []
  const packageTitle = booking
    ? getBookingPackageNamesText(
        booking,
        booking?.packageId ? `Package ID ${booking.packageId}` : 'Selected package'
      )
    : checkoutPackageNames.length
      ? checkoutPackageNames.join(', ')
      : 'Selected package'
  const lineItems =
    Array.isArray(booking?.items) && booking.items.length
      ? booking.items.map(item => ({
          id: item?.id ?? `${item?.title ?? 'item'}-${item?.totalPrice ?? 0}`,
          title: getPackageLineLabel(item?.title, getReceiptItemTitle(item?.title)),
          subtitle: getPackageLineSubtitle(item?.title),
          amount: pickNumber(item?.totalPrice),
        }))
      : Array.isArray(checkoutInfo?.selectedItems)
        ? checkoutInfo.selectedItems.map(item => ({
            id: item?.id ?? `${item?.title ?? 'item'}-${item?.amount ?? 0}`,
            title: getPackageLineLabel(item?.title, getReceiptItemTitle(item?.title)),
            subtitle: getPackageLineSubtitle(item?.title),
            amount: pickNumber(item?.amount),
          }))
        : []
  const payments = normalizeReceiptPayments(booking?.payments, payment)

  return {
    receiptNumber: String(booking?.id ?? 'booking'),
    issuedOn:
      payments[0]?.date || booking?.updatedAt || booking?.createdAt || new Date().toISOString(),
    bookingId: booking?.id ?? 'Not available',
    bookingStatus: booking?.statusLabel || booking?.status || 'Confirmed',
    customerName: getReceiptCustomerName(customer),
    customerEmail: customer?.email || checkoutInfo?.email || booking?.user?.email || 'Not provided',
    customerPhone: customer?.phone || checkoutInfo?.phone || booking?.user?.phone || 'Not provided',
    eventDate: checkoutInfo?.eventDate ?? booking?.eventDate ?? '',
    eventTime: checkoutInfo?.eventTime || '',
    eventAddress:
      checkoutInfo?.eventAddress ||
      booking?.address?.summary ||
      booking?.locationSummary ||
      'Not provided',
    guestCount: checkoutInfo?.guestCount ?? booking?.guestCount ?? 'Not provided',
    packageTitle,
    lineItems,
    payments,
    paymentSummary,
  }
}

function createReceiptPdf(receiptData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 36
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const colors = {
    text: [44, 44, 44],
    muted: [107, 114, 128],
    brand: [123, 93, 59],
    border: [232, 223, 210],
    softBorder: [241, 236, 229],
    card: [248, 244, 237],
    page: [247, 243, 237],
    label: [141, 123, 105],
  }

  const setTextColor = color => doc.setTextColor(...color)
  const setFillColor = color => doc.setFillColor(...color)
  const setDrawColor = color => doc.setDrawColor(...color)

  function ensureSpace(heightNeeded = 40) {
    if (y + heightNeeded <= pageHeight - margin) return
    doc.addPage()
    y = margin
  }

  function drawWrappedText(
    text,
    x,
    top,
    width,
    { fontSize = 11, color = colors.text, align = 'left', fontStyle = 'normal' } = {}
  ) {
    doc.setFont('helvetica', fontStyle)
    doc.setFontSize(fontSize)
    setTextColor(color)
    const lines = doc.splitTextToSize(String(text ?? ''), width)
    doc.text(lines, x, top, { align, baseline: 'top', maxWidth: width })
    return lines.length * (fontSize + 3)
  }

  function drawSectionTitle(title) {
    ensureSpace(28)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    setTextColor(colors.text)
    doc.text(title, margin, y)
    y += 18
  }

  function drawReceiptMetaBlock(data) {
    const blockHeight = 92
    ensureSpace(blockHeight + 12)
    setFillColor(colors.card)
    setDrawColor(colors.border)
    doc.roundedRect(margin, y, contentWidth, blockHeight, 14, 14, 'FD')

    drawWrappedText('Receipt Details', margin + 18, y + 14, 180, {
      fontSize: 14,
      color: colors.brand,
      fontStyle: 'bold',
    })

    const leftX = margin + 18
    const rightX = margin + contentWidth / 2 + 8
    drawWrappedText(`Receipt #: ${data.receiptNumber}`, leftX, y + 38, contentWidth / 2 - 28, {
      fontSize: 10,
    })
    drawWrappedText(`Booking ID: ${data.bookingId}`, leftX, y + 55, contentWidth / 2 - 28, {
      fontSize: 10,
    })
    drawWrappedText(
      `Issued On: ${formatReceiptDateTime(data.issuedOn)}`,
      rightX,
      y + 38,
      contentWidth / 2 - 28,
      {
        fontSize: 10,
      }
    )
    drawWrappedText(`Status: ${data.bookingStatus}`, rightX, y + 55, contentWidth / 2 - 28, {
      fontSize: 10,
    })
    y += blockHeight + 18
  }

  function drawSummaryCards(cards) {
    const gap = 12
    const cardWidth = (contentWidth - gap * 2) / 3
    const cardHeight = 70
    ensureSpace(cardHeight + 12)

    cards.forEach((card, index) => {
      const x = margin + index * (cardWidth + gap)
      setFillColor(colors.card)
      setDrawColor(colors.card)
      doc.roundedRect(x, y, cardWidth, cardHeight, 14, 14, 'FD')
      drawWrappedText(card.label, x + 14, y + 14, cardWidth - 28, {
        fontSize: 8,
        color: colors.label,
      })
      drawWrappedText(card.value, x + 14, y + 34, cardWidth - 28, {
        fontSize: 15,
        color: colors.brand,
        fontStyle: 'bold',
      })
    })

    y += cardHeight + 18
  }

  function drawInfoGrid(items) {
    const gap = 18
    const colWidth = (contentWidth - gap) / 2

    for (let index = 0; index < items.length; index += 2) {
      const pair = items.slice(index, index + 2)
      const measurements = pair.map(item => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        const labelLines = doc.splitTextToSize(`${item.label}:`, colWidth)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const valueLines = doc.splitTextToSize(String(item.value ?? ''), colWidth)
        return {
          labelLines,
          valueLines,
          height: 12 + labelLines.length * 12 + valueLines.length * 13 + 8,
        }
      })

      const rowHeight = Math.max(...measurements.map(item => item.height), 44)
      ensureSpace(rowHeight)

      pair.forEach((item, itemIndex) => {
        const x = margin + itemIndex * (colWidth + gap)
        setDrawColor(colors.softBorder)
        doc.line(x, y + rowHeight, x + colWidth, y + rowHeight)
        drawWrappedText(`${item.label}:`, x, y + 2, colWidth, {
          fontSize: 10,
          color: colors.text,
          fontStyle: 'bold',
        })
        drawWrappedText(item.value, x, y + 18, colWidth, {
          fontSize: 10,
          color: colors.text,
        })
      })

      y += rowHeight + 6
    }
  }

  function drawTable(headers, rows, columnWidths) {
    const tableWidth = contentWidth
    const normalizedWidths = columnWidths.map(width => width * tableWidth)
    const headerHeight = 24

    ensureSpace(headerHeight + 8)
    let x = margin
    headers.forEach((header, index) => {
      drawWrappedText(header, x + 2, y + 6, normalizedWidths[index] - 4, {
        fontSize: 8,
        color: colors.label,
        fontStyle: 'bold',
      })
      x += normalizedWidths[index]
    })
    y += headerHeight
    setDrawColor(colors.softBorder)
    doc.line(margin, y - 4, margin + tableWidth, y - 4)

    rows.forEach(row => {
      const cells = row.map((cell, index) =>
        doc.splitTextToSize(String(cell ?? ''), Math.max(normalizedWidths[index] - 8, 10))
      )
      const rowHeight = Math.max(...cells.map(cell => cell.length * 13), 18) + 12
      ensureSpace(rowHeight + 8)

      let cellX = margin
      row.forEach((cell, index) => {
        const align = index === row.length - 1 ? 'right' : 'left'
        const textX = align === 'right' ? cellX + normalizedWidths[index] - 2 : cellX + 2
        drawWrappedText(cell, textX, y + 4, normalizedWidths[index] - 4, {
          fontSize: 10,
          color: colors.text,
          align,
        })
        cellX += normalizedWidths[index]
      })

      y += rowHeight
      setDrawColor(colors.softBorder)
      doc.line(margin, y - 4, margin + tableWidth, y - 4)
    })

    y += 8
  }

  setFillColor(colors.page)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  setTextColor(colors.brand)
  doc.text('Elewen', margin, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  setTextColor(colors.muted)
  doc.text('Booking payment receipt', margin, y + 24)

  y += 42
  setDrawColor(colors.border)
  doc.line(margin, y, margin + contentWidth, y)
  y += 18

  drawReceiptMetaBlock(receiptData)

  drawSummaryCards([
    {
      label: 'Total Booking Amount',
      value: formatReceiptCurrency(receiptData.paymentSummary.totalAmount),
    },
    {
      label: 'Amount Paid',
      value: formatReceiptCurrency(receiptData.paymentSummary.amountPaid),
    },
    {
      label: 'Balance Due',
      value: formatReceiptCurrency(receiptData.paymentSummary.amountDue),
    },
  ])

  drawSectionTitle('Customer Details')
  drawInfoGrid([
    { label: 'Name', value: receiptData.customerName },
    { label: 'Email', value: receiptData.customerEmail },
    { label: 'Phone', value: receiptData.customerPhone },
    { label: 'Guests', value: String(receiptData.guestCount) },
  ])

  y += 10
  drawSectionTitle('Order Details')
  drawInfoGrid([
    {
      label: 'Event Date',
      value: formatReceiptDate(receiptData.eventDate, { includeWeekday: true }),
    },
    { label: 'Event Time', value: receiptData.eventTime || 'Not provided' },
    { label: 'Address', value: receiptData.eventAddress },
  ])

  y += 12
  drawSectionTitle('Selected Items')
  drawTable(
    ['Item', 'Amount'],
    receiptData.lineItems.length
      ? receiptData.lineItems.map(item => [
          item.subtitle ? `${item.title}\n${item.subtitle}` : item.title,
          formatReceiptCurrency(item.amount),
        ])
      : [
          [
            'No line items available',
            formatReceiptCurrency(receiptData.paymentSummary.totalAmount),
          ],
        ],
    [0.75, 0.25]
  )

  drawSectionTitle('Payment History')
  drawTable(
    ['Type', 'Method', 'Date', 'Amount'],
    receiptData.payments.length
      ? receiptData.payments.map(entry => [
          entry.label || 'Payment',
          entry.method || 'Online',
          formatReceiptDateTime(entry.date),
          formatReceiptCurrency(entry.amount),
        ])
      : [['Payment details are not available yet.', '', '', '']],
    [0.2, 0.2, 0.4, 0.2]
  )

  ensureSpace(28)
  drawWrappedText(
    'This receipt is generated by Elewen for your booking reference.',
    margin,
    y,
    contentWidth,
    { fontSize: 9, color: colors.muted }
  )

  return doc
}

export function downloadReceipt(receiptData) {
  const bookingId = String(receiptData?.bookingId ?? 'booking').replace(/[^a-z0-9_-]+/gi, '-')
  const doc = createReceiptPdf(receiptData)
  doc.save(`elewen-receipt-${bookingId}.pdf`)
}
