import {
  jsPDF,
} from 'jspdf'

import type {
  DictionaryEntry,
} from './dictionaryData'


function pdfSafe(
  value: string,
): string {
  return value
    .replaceAll('μ', 'mu')
    .replaceAll('σ', 'sigma')
    .replaceAll('θ', 'theta')
    .replaceAll('α', 'alpha')
    .replaceAll('β', 'beta')
    .replaceAll('λ', 'lambda')
    .replaceAll('χ', 'chi')
    .replaceAll('²', '^2')
    .replaceAll('³', '^3')
    .replaceAll('⁴', '^4')
    .replaceAll('₀', '0')
    .replaceAll('₁', '1')
    .replaceAll('₂', '2')
    .replaceAll('ₜ', 't')
    .replaceAll('ᵢ', 'i')
    .replaceAll('√', 'sqrt')
    .replaceAll('Σ', 'SUM')
    .replaceAll('Π', 'PRODUCT')
    .replaceAll('≤', '<=')
    .replaceAll('≥', '>=')
    .replaceAll('≠', '!=')
    .replaceAll('≈', '~')
    .replaceAll('±', '+/-')
    .replaceAll('→', '->')
    .replaceAll('–', '-')
    .replaceAll('—', '-')
    .replaceAll('×', 'x')
    .replaceAll('∞', 'infinity')
}


function addWrappedText(
  document: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight = 5,
): number {
  const lines =
    document.splitTextToSize(
      pdfSafe(text),
      width,
    ) as string[]

  const pageHeight =
    document.internal.pageSize.getHeight()

  let currentY =
    y

  for (const line of lines) {
    if (currentY > pageHeight - 15) {
      document.addPage()
      currentY = 20
    }

    document.text(
      line,
      x,
      currentY,
    )

    currentY +=
      lineHeight
  }

  return currentY
}


function ensureSpace(
  document: jsPDF,
  y: number,
  requiredSpace: number,
): number {
  const pageHeight =
    document.internal.pageSize.getHeight()

  if (
    y + requiredSpace >
    pageHeight - 15
  ) {
    document.addPage()

    return 20
  }

  return y
}


export function exportDictionaryPdf(
  entries: DictionaryEntry[],
  description = 'QuantStat Statistical Dictionary',
): void {
  const document =
    new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

  const pageWidth =
    document.internal
      .pageSize
      .getWidth()

  const contentWidth =
    pageWidth - 30

  let y =
    20


  // =========================================================
  // COVER / HEADER
  // =========================================================

  document.setFont(
    'helvetica',
    'bold',
  )

  document.setFontSize(22)

  document.setTextColor(
    55,
    79,
    150,
  )

  document.text(
    'QuantStat',
    15,
    y,
  )

  y += 10

  document.setFontSize(16)

  document.setTextColor(
    30,
    35,
    45,
  )

  document.text(
    'Statistical Dictionary',
    15,
    y,
  )

  y += 8

  document.setFont(
    'helvetica',
    'normal',
  )

  document.setFontSize(10)

  document.setTextColor(
    90,
    95,
    105,
  )

  y =
    addWrappedText(
      document,
      description,
      15,
      y,
      contentWidth,
      5,
    )

  y += 3

  document.text(
    `Topics exported: ${entries.length}`,
    15,
    y,
  )

  y += 9


  // =========================================================
  // CONTENT
  // =========================================================

  let previousCategory =
    ''


  entries.forEach(
    (
      entry,
      index,
    ) => {
      y =
        ensureSpace(
          document,
          y,
          35,
        )


      if (
        entry.category !==
        previousCategory
      ) {
        y += 3

        document.setFont(
          'helvetica',
          'bold',
        )

        document.setFontSize(13)

        document.setTextColor(
          65,
          85,
          155,
        )

        y =
          addWrappedText(
            document,
            entry.category,
            15,
            y,
            contentWidth,
            6,
          )

        y += 3

        previousCategory =
          entry.category
      }


      document.setFont(
        'helvetica',
        'bold',
      )

      document.setFontSize(11)

      document.setTextColor(
        25,
        30,
        40,
      )

      y =
        addWrappedText(
          document,
          `${index + 1}. ${entry.title}`,
          15,
          y,
          contentWidth,
          5.5,
        )


      document.setFont(
        'helvetica',
        'normal',
      )

      document.setFontSize(9.5)

      document.setTextColor(
        55,
        60,
        70,
      )

      y =
        addWrappedText(
          document,
          entry.summary,
          18,
          y + 1,
          contentWidth - 3,
          4.8,
        )


      if (entry.formula) {
        document.setFont(
          'courier',
          'normal',
        )

        document.setTextColor(
          45,
          65,
          125,
        )

        y =
          addWrappedText(
            document,
            `Formula: ${entry.formula}`,
            18,
            y + 1,
            contentWidth - 3,
            4.8,
          )
      }


      document.setFont(
        'helvetica',
        'normal',
      )

      document.setTextColor(
        55,
        60,
        70,
      )

      y =
        addWrappedText(
          document,
          `Interpretation: ${
            entry.interpretation ??
            entry.summary
          }`,
          18,
          y + 1,
          contentWidth - 3,
          4.8,
        )


      if (
        entry.variables &&
        entry.variables.length > 0
      ) {
        y =
          addWrappedText(
            document,
            `Variables: ${
              entry.variables.join(
                '; ',
              )
            }`,
            18,
            y + 1,
            contentWidth - 3,
            4.8,
          )
      }


      if (
        entry.assumptions &&
        entry.assumptions.length > 0
      ) {
        y =
          addWrappedText(
            document,
            `Assumptions: ${
              entry.assumptions.join(
                '; ',
              )
            }`,
            18,
            y + 1,
            contentWidth - 3,
            4.8,
          )
      }


      if (
        entry.related &&
        entry.related.length > 0
      ) {
        y =
          addWrappedText(
            document,
            `Related: ${
              entry.related.join(
                ', ',
              )
            }`,
            18,
            y + 1,
            contentWidth - 3,
            4.8,
          )
      }


      y +=
        6
    },
  )


  // =========================================================
  // PAGE NUMBERS
  // =========================================================

  const pages =
    document.getNumberOfPages()

  for (
    let page = 1;
    page <= pages;
    page++
  ) {
    document.setPage(page)

    document.setFont(
      'helvetica',
      'normal',
    )

    document.setFontSize(8)

    document.setTextColor(
      130,
      135,
      145,
    )

    document.text(
      `QuantStat Statistical Dictionary | ${page} / ${pages}`,
      pageWidth / 2,
      document.internal
        .pageSize
        .getHeight() -
        7,
      {
        align: 'center',
      },
    )
  }


  document.save(
    'QuantStat-Statistical-Dictionary.pdf',
  )
}