import {
  Building2,
  CalendarDays,
  Check,
  FileSpreadsheet,
  Layers3,
  Table2,
  Upload,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as XLSX from 'xlsx'

type CellValue = string | number | boolean | Date | null
type DataLayout = 'wide' | 'long'

interface ImportedSheet {
  name: string
  headers: string[]
  rows: CellValue[][]
  rowCount: number
  suggestedDateColumn: string
  suggestedCompanyColumn: string
  suggestedValueColumn: string
  suggestedLayout: DataLayout
}

interface WorkbookInspection {
  fileName: string
  fileSize: number
  sheets: ImportedSheet[]
}

interface NormalizedRow {
  date: string
  company: string
  value: number
  sheet: string
}

interface DateMatrixRow {
  date: string
  values: Record<string, number | null>
}

interface CovarianceResult {
  companies: string[]
  returns: DateMatrixRow[]
  matrix: number[][]
  minimum: number
  maximum: number
  correlation: number[][]
  volatilities: number[]
  meanReturns: number[]
}

interface HistogramBin {
  label: string
  midpoint: number
  count: number
}

interface ReturnDistribution {
  company: string
  bins: HistogramBin[]
  observations: number
  mean: number
  volatility: number
  minimum: number
  maximum: number
  zeroLabel: string
  meanLabel: string
}

const dateWords = ['date', 'datetime', 'timestamp', 'time', 'day', 'period']
const companyWords = ['company', 'ticker', 'symbol', 'asset', 'instrument', 'security', 'stock', 'name']
const valueWords = ['adjusted close', 'adj close', 'close', 'return', 'returns', 'price', 'value', 'average', 'mean', 'open', 'nav']

function text(value: CellValue): string {
  return value === null || value === undefined ? '' : String(value)
}

function normalizedHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ')
}

function suggestedColumn(headers: string[], candidates: string[]): string {
  return headers.find(header => candidates.includes(normalizedHeader(header))) ??
    headers.find(header => candidates.some(candidate => normalizedHeader(header).includes(candidate))) ?? ''
}

function uniqueHeaders(values: CellValue[]): string[] {
  const counts = new Map<string, number>()
  return values.map((value, index) => {
    const original = text(value).trim() || `Column ${index + 1}`
    const count = counts.get(original) ?? 0
    counts.set(original, count + 1)
    return count === 0 ? original : `${original} (${count + 1})`
  })
}

function numeric(value: CellValue): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const percentage = value.includes('%')
  const parsed = Number(value.trim().replace(/[%,$Â£â‚¬]/g, '').replace(/,/g, ''))
  if (!Number.isFinite(parsed)) return null
  return percentage ? parsed / 100 : parsed
}

function parseDate(value: CellValue): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const candidate = new Date(String(value).trim())
  return Number.isNaN(candidate.getTime()) ? String(value).trim() : candidate.toISOString().slice(0, 10)
}

function inspectSheet(name: string, worksheet: XLSX.WorkSheet): ImportedSheet {
  const matrix = XLSX.utils.sheet_to_json<CellValue[]>(worksheet, {
    header: 1,
    raw: false,
    defval: null,
    blankrows: false,
  })
  const nonEmpty = matrix.filter(row => row.some(cell => cell !== null && text(cell).trim() !== ''))
  if (nonEmpty.length === 0) {
    return { name, headers: [], rows: [], rowCount: 0, suggestedDateColumn: '', suggestedCompanyColumn: '', suggestedValueColumn: '', suggestedLayout: 'wide' }
  }
  const headers = uniqueHeaders(nonEmpty[0])
  const rows = nonEmpty.slice(1).map(row => headers.map((_, index) => row[index] ?? null))
  const date = suggestedColumn(headers, dateWords)
  const company = suggestedColumn(headers, companyWords)
  const value = suggestedColumn(headers, valueWords)
  return {
    name,
    headers,
    rows,
    rowCount: rows.length,
    suggestedDateColumn: date,
    suggestedCompanyColumn: company,
    suggestedValueColumn: value,
    suggestedLayout: company ? 'long' : 'wide',
  }
}

function heatColor(
  value: number,
  minimum: number,
  maximum: number,
): string {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(minimum) ||
    !Number.isFinite(maximum)
  ) {
    return 'transparent'
  }

  const ratio =
    maximum === minimum
      ? 0.5
      : Math.max(
          0,
          Math.min(
            1,
            (value - minimum) /
              (maximum - minimum),
          ),
        )

  const red =
    Math.round(
      239 +
      (34 - 239) * ratio,
    )

  const green =
    Math.round(
      68 +
      (197 - 68) * ratio,
    )

  const blue =
    Math.round(
      68 +
      (94 - 68) * ratio,
    )

  return `rgba(${red}, ${green}, ${blue}, 0.72)`
}

function createHistogram(
  values: number[],
  binCount = 16,
): HistogramBin[] {
  if (values.length === 0) {
    return []
  }

  const minimum = Math.min(...values)
  const maximum = Math.max(...values)

  if (minimum === maximum) {
    return [{
      label: `${(minimum * 100).toFixed(2)}%`,
      midpoint: minimum,
      count: values.length,
    }]
  }

  const width =
    (maximum - minimum) /
    binCount

  const bins = Array.from(
    { length: binCount },
    (_, index) => {
      const lower =
        minimum + index * width
      const upper =
        index === binCount - 1
          ? maximum
          : lower + width

      return {
        label:
          `${(lower * 100).toFixed(2)}% to ${(upper * 100).toFixed(2)}%`,
        midpoint:
          (lower + upper) / 2,
        count: 0,
      }
    },
  )

  for (const value of values) {
    const rawIndex =
      Math.floor(
        (value - minimum) /
        width,
      )

    const index = Math.min(
      Math.max(rawIndex, 0),
      binCount - 1,
    )

    bins[index].count += 1
  }

  return bins
}

function closestBinLabel(
  bins: HistogramBin[],
  value: number,
): string {
  if (bins.length === 0) {
    return ''
  }

  return bins.reduce(
    (closest, bin) =>
      Math.abs(bin.midpoint - value) <
      Math.abs(closest.midpoint - value)
        ? bin
        : closest,
    bins[0],
  ).label
}

function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inspection, setInspection] = useState<WorkbookInspection | null>(null)
  const [sheetName, setSheetName] = useState('')
  const [layout, setLayout] = useState<DataLayout>('wide')
  const [dateColumn, setDateColumn] = useState('')
  const [companyColumn, setCompanyColumn] = useState('')
  const [valueColumn, setValueColumn] = useState('')
  const [companies, setCompanies] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sheet = useMemo(
    () => inspection?.sheets.find(item => item.name === sheetName) ?? null,
    [inspection, sheetName],
  )
    const visibleSheets =
        useMemo(
            () =>
                inspection?.sheets.filter(
                    item => {
                        const name =
                            item.name
                                .trim()
                                .toLowerCase()

                        return (
                            name !== 'companies' &&
                            name !== 'risk & return'
                        )
                    },
                ) ?? [],
            [inspection],
        )
  useEffect(() => {
    if (!sheet) return
    setLayout(sheet.suggestedLayout)
    setDateColumn(sheet.suggestedDateColumn || sheet.headers[0] || '')
    setCompanyColumn(sheet.suggestedCompanyColumn)
    setValueColumn(sheet.suggestedValueColumn)
    setStartDate('')
    setEndDate('')
  }, [sheet])

  const indexes = useMemo(
    () => new Map((sheet?.headers ?? []).map((header, index) => [header, index])),
    [sheet],
  )

  const numericColumns = useMemo(() => {
    if (!sheet) return []
    return sheet.headers.filter(header => {
      if (header === dateColumn || header === companyColumn) return false
      const index = indexes.get(header)
      if (index === undefined) return false
      const sample = sheet.rows.slice(0, 100)
      return sample.length > 0 && sample.filter(row => numeric(row[index]) !== null).length / sample.length >= 0.5
    })
  }, [sheet, dateColumn, companyColumn, indexes])

  const availableCompanies = useMemo(() => {
    if (!sheet) return []
    if (layout === 'wide') return numericColumns
    const index = indexes.get(companyColumn)
    if (index === undefined) return []
    return Array.from(new Set(sheet.rows.map(row => text(row[index]).trim()).filter(Boolean))).sort()
  }, [sheet, layout, numericColumns, indexes, companyColumn])

  useEffect(() => setCompanies(availableCompanies), [availableCompanies])

  const dateRange = useMemo(() => {
    if (!sheet) return { minimum: '', maximum: '' }
    const index = indexes.get(dateColumn)
    if (index === undefined) return { minimum: '', maximum: '' }
    const dates = sheet.rows.map(row => parseDate(row[index])).filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)).sort()
    return { minimum: dates[0] ?? '', maximum: dates.at(-1) ?? '' }
  }, [sheet, indexes, dateColumn])

  useEffect(() => {
    setStartDate(dateRange.minimum)
    setEndDate(dateRange.maximum)
  }, [dateRange])

  const normalized = useMemo(() => {
    if (!sheet || !dateColumn) return []
    const dateIndex = indexes.get(dateColumn)
    if (dateIndex === undefined) return []
    const result: NormalizedRow[] = []

    if (layout === 'long') {
      const companyIndex = indexes.get(companyColumn)
      const selectedValueIndex = indexes.get(valueColumn)
      if (companyIndex === undefined || selectedValueIndex === undefined) return []
      for (const row of sheet.rows) {
        const company = text(row[companyIndex]).trim()
        const date = parseDate(row[dateIndex])
        const value = numeric(row[selectedValueIndex])
        if (!company || !companies.includes(company) || !date || value === null) continue
        if ((startDate && date < startDate) || (endDate && date > endDate)) continue
        result.push({ date, company, value, sheet: sheet.name })
      }
    } else {
      for (const company of companies) {
        const valueIndex = indexes.get(company)
        if (valueIndex === undefined) continue
        for (const row of sheet.rows) {
          const date = parseDate(row[dateIndex])
          const value = numeric(row[valueIndex])
          if (!date || value === null) continue
          if ((startDate && date < startDate) || (endDate && date > endDate)) continue
          result.push({ date, company, value, sheet: sheet.name })
        }
      }
    }

    return result.sort((left, right) => left.date.localeCompare(right.date) || left.company.localeCompare(right.company))
  }, [sheet, dateColumn, companyColumn, valueColumn, layout, companies, startDate, endDate, indexes])

  const dateMatrix = useMemo<DateMatrixRow[]>(() => {
    const byDate = new Map<string, Record<string, number | null>>()
    for (const row of normalized) {
      const values = byDate.get(row.date) ?? {}
      values[row.company] = row.value
      byDate.set(row.date, values)
    }
    return Array.from(byDate.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, values]) => ({
        date,
        values: Object.fromEntries(
          companies.map(company => [company, values[company] ?? null]),
        ),
      }))
  }, [normalized, companies])

  const covariance = useMemo<CovarianceResult | null>(() => {
    if (companies.length < 2 || dateMatrix.length < 3) return null

    const returnRows: DateMatrixRow[] = []
    for (let index = 1; index < dateMatrix.length; index += 1) {
      const previous = dateMatrix[index - 1]
      const current = dateMatrix[index]
      const values: Record<string, number | null> = {}
      let complete = true

      for (const company of companies) {
        const prior = previous.values[company]
        const latest = current.values[company]
        if (prior === null || latest === null || prior === 0) {
          complete = false
          break
        }
        values[company] = latest / prior - 1
      }

      if (complete) returnRows.push({ date: current.date, values })
    }

    if (returnRows.length < 2) return null

    const means = companies.map(company =>
      returnRows.reduce((sum, row) => sum + (row.values[company] ?? 0), 0) /
      returnRows.length,
    )

    const matrix = companies.map((left, leftIndex) =>
      companies.map((right, rightIndex) => {
        const total = returnRows.reduce((sum, row) => {
          const leftValue = row.values[left] ?? 0
          const rightValue = row.values[right] ?? 0
          return sum +
            (leftValue - means[leftIndex]) *
            (rightValue - means[rightIndex])
        }, 0)
        return total / (returnRows.length - 1)
      }),
    )

    const volatilities =
      matrix.map(
        (row, index) =>
          Math.sqrt(
            Math.max(
              row[index],
              0,
            ),
          ),
      )

    const correlation =
      matrix.map(
        (row, rowIndex) =>
          row.map(
            (
              value,
              columnIndex,
            ) => {
              const denominator =
                volatilities[rowIndex] *
                volatilities[columnIndex]

              if (denominator === 0) {
                return rowIndex === columnIndex
                  ? 1
                  : 0
              }

              return value / denominator
            },
          ),
      )

    const values = matrix.flat()

    return {
      companies,
      returns: returnRows,
      matrix,
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      correlation,
      volatilities,
      meanReturns: means,
    }
  }, [companies, dateMatrix])

  function covarianceColor(
    value: number,
  ): string {
    if (!covariance) {
      return 'transparent'
    }

    return heatColor(
      value,
      covariance.minimum,
      covariance.maximum,
    )
  }

  const distributions =
    useMemo<ReturnDistribution[]>(
      () => {
        if (!covariance) {
          return []
        }

        return covariance.companies.map(
          (company, index) => {
            const values =
              covariance.returns
                .map(
                  row =>
                    row.values[company],
                )
                .filter(
                  (
                    value,
                  ): value is number =>
                    value !== null &&
                    Number.isFinite(value),
                )

            const bins =
              createHistogram(values)

            return {
              company,
              bins,
              observations: values.length,
              mean:
                covariance.meanReturns[index],
              volatility:
                covariance.volatilities[index],
              minimum:
                Math.min(...values),
              maximum:
                Math.max(...values),
              zeroLabel:
                closestBinLabel(bins, 0),
              meanLabel:
                closestBinLabel(
                  bins,
                  covariance.meanReturns[index],
                ),
            }
          },
        )
      },
      [covariance],
    )


  async function loadFile(file: File): Promise<void> {
    setLoading(true)
    setError(null)
    try {
      const extension = file.name.split('.').at(-1)?.toLowerCase()
      if (!extension || !['xlsx', 'xls', 'csv'].includes(extension)) throw new Error('Choose an XLSX, XLS, or CSV file.')
      if (file.size > 25 * 1024 * 1024) throw new Error('The maximum file size is 25 MB.')
      const book = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
        const sheets =
            book.SheetNames.map(
                name =>
                    inspectSheet(
                        name,
                        book.Sheets[name],
                    ),
            )

        if (sheets.length === 0) {
            throw new Error(
                'No readable worksheets were found.',
            )
        }

        const firstVisibleSheet =
            sheets.find(
                item => {
                    const name =
                        item.name
                            .trim()
                            .toLowerCase()

                    return (
                        name !== 'companies' &&
                        name !== 'risk & return'
                    )
                },
            )

        if (!firstVisibleSheet) {
            throw new Error(
                'No analyzable worksheets were found.',
            )
        }

        setInspection({
            fileName: file.name,
            fileSize: file.size,
            sheets,
        })

        setSheetName(
            firstVisibleSheet.name,
        )
    } catch (reason: unknown) {
      setInspection(null)
      setError(reason instanceof Error ? reason.message : 'The file could not be read.')
    } finally {
      setLoading(false)
    }
  }

  function clearFile(): void {
    setInspection(null)
    setSheetName('')
    setCompanies([])
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function toggleCompany(company: string): void {
    setCompanies(current => current.includes(company) ? current.filter(item => item !== company) : [...current, company])
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Import data</h1>
          <p>Inspect every sheet, map companies and values, and create a standardized dataset.</p>
        </div>
      </section>

      <section className="import-upload-card">
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={event => {
          const file = event.target.files?.[0]
          if (file) void loadFile(file)
        }} />
        {!inspection ? (
          <button type="button" className="import-drop-zone" disabled={loading} onClick={() => inputRef.current?.click()}>
            <Upload size={32} />
            <strong>{loading ? 'Inspecting file...' : 'Select Excel or CSV file'}</strong>
            <span>XLSX, XLS, or CSV. Maximum size 25 MB.</span>
          </button>
        ) : (
          <div className="import-file-summary">
            <FileSpreadsheet size={28} />
            <div>
              <strong>{inspection.fileName}</strong>
              <span>{inspection.sheets.length} sheet(s), {(inspection.fileSize / 1024).toFixed(1)} KB</span>
            </div>
            <button type="button" title="Remove file" onClick={clearFile}><X size={18} /></button>
          </div>
        )}
      </section>

      {error && <div className="error-banner">{error}</div>}

      {inspection && (
        <>
          <section className="import-sheet-tabs">
            {visibleSheets.map(item => (
              <button key={item.name} type="button" className={sheetName === item.name ? 'active' : undefined} onClick={() => setSheetName(item.name)}>
                <Layers3 size={14} /><span>{item.name}</span><small>{item.rowCount}</small>
              </button>
            ))}
          </section>

          {sheet && (
            <>
              <section className="import-mapping-grid">
                <article className="import-panel">
                  <header><Table2 size={18} /><div><h2>Structure</h2><p>Confirm how companies are organized.</p></div></header>
                  <label>Data layout<select value={layout} onChange={event => setLayout(event.target.value as DataLayout)}><option value="wide">Wide: one column per company</option><option value="long">Long: one company column</option></select></label>
                  <label>Date column<select value={dateColumn} onChange={event => setDateColumn(event.target.value)}><option value="">Select column</option>{sheet.headers.map(header => <option key={header} value={header}>{header}</option>)}</select></label>
                  {layout === 'long' && (
                    <>
                      <label>Company column<select value={companyColumn} onChange={event => setCompanyColumn(event.target.value)}><option value="">Select column</option>{sheet.headers.map(header => <option key={header} value={header}>{header}</option>)}</select></label>
                      <label>Value column<select value={valueColumn} onChange={event => setValueColumn(event.target.value)}><option value="">Select column</option>{numericColumns.map(header => <option key={header} value={header}>{header}</option>)}</select></label>
                    </>
                  )}
                </article>

                <article className="import-panel">
                  <header><Building2 size={18} /><div><h2>Companies</h2><p>Choose one, several, or all companies.</p></div></header>
                  <button type="button" className="import-select-all" onClick={() => setCompanies(companies.length === availableCompanies.length ? [] : availableCompanies)}><Check size={15} />{companies.length === availableCompanies.length ? 'Clear all' : 'Select all'}</button>
                  <div className="import-company-list">
                    {availableCompanies.map(company => <button key={company} type="button" className={companies.includes(company) ? 'selected' : undefined} onClick={() => toggleCompany(company)}><span>{company}</span>{companies.includes(company) && <Check size={14} />}</button>)}
                    {availableCompanies.length === 0 && <div className="import-empty">No numeric company series were detected.</div>}
                  </div>
                </article>

                <article className="import-panel">
                  <header><CalendarDays size={18} /><div><h2>Date range</h2><p>Limit the standardized dataset.</p></div></header>
                  <label>Start date<input type="date" value={startDate} min={dateRange.minimum} max={dateRange.maximum} onChange={event => setStartDate(event.target.value)} /></label>
                  <label>End date<input type="date" value={endDate} min={dateRange.minimum} max={dateRange.maximum} onChange={event => setEndDate(event.target.value)} /></label>
                  <div className="import-date-summary"><span>Detected range</span><strong>{dateRange.minimum || 'Unknown'} to {dateRange.maximum || 'Unknown'}</strong></div>
                </article>
              </section>

              <section className="import-preview-card">
                <header>
                  <div>
                    <h2>Complete date matrix</h2>
                    <p>Each date appears once. Every selected company is aligned to that shared date index.</p>
                  </div>
                  <strong>{dateMatrix.length} dates, {companies.length} companies</strong>
                </header>
                <div className="import-table-scroll import-all-data">
                  <table className="import-table import-matrix-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        {companies.map(company => <th key={company}>{company}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {dateMatrix.map(row => (
                        <tr key={row.date}>
                          <td>{row.date}</td>
                          {companies.map(company => (
                            <td key={company} className={row.values[company] === null ? 'import-missing-value' : undefined}>
                              {row.values[company] === null
                                ? 'Missing'
                                : row.values[company]?.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {dateMatrix.length === 0 && (
                        <tr><td colSpan={Math.max(companies.length + 1, 1)} className="import-empty-table">Complete the mapping and select at least one company.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="import-preview-card import-covariance-card">
                <header>
                  <div>
                    <h2>Return covariance heatmap</h2>
                    <p>Sample covariance calculated from complete, date-aligned simple returns.</p>
                  </div>
                  <strong>{covariance?.returns.length ?? 0} common return periods</strong>
                </header>

                {covariance ? (
                  <div className="import-table-scroll">
                    <table className="import-table covariance-table">
                      <thead>
                        <tr>
                          <th>Asset</th>
                          {covariance.companies.map(company => <th key={company}>{company}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {covariance.companies.map((company, rowIndex) => (
                          <tr key={company}>
                            <th>{company}</th>
                            {covariance.companies.map((column, columnIndex) => {
                              const value = covariance.matrix[rowIndex][columnIndex]
                              return (
                                <td
                                  key={column}
                                  style={{ backgroundColor: covarianceColor(value) }}
                                  title={`${company} / ${column}: ${value}`}
                                >
                                  {value.toExponential(4)}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="import-covariance-empty">
                    Select at least two companies with at least three shared complete dates.
                  </div>
                )}
              </section>

              <section className="import-preview-card import-covariance-card">
                <header>
                  <div>
                    <h2>Correlation heatmap</h2>
                    <p>Lowest observed correlation is red. Highest observed correlation is green.</p>
                  </div>
                  <strong>-1 to +1</strong>
                </header>

                {covariance ? (
                  <div className="import-table-scroll">
                    <table className="import-table covariance-table">
                      <thead>
                        <tr>
                          <th>Asset</th>
                          {covariance.companies.map(company => (
                            <th key={company}>{company}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {covariance.companies.map((company, rowIndex) => {
                          const observed = covariance.correlation.flat()
                          const minimum = Math.min(...observed)
                          const maximum = Math.max(...observed)

                          return (
                            <tr key={company}>
                              <th>{company}</th>
                              {covariance.companies.map((column, columnIndex) => {
                                const value = covariance.correlation[rowIndex][columnIndex]

                                return (
                                  <td
                                    key={column}
                                    style={{
                                      backgroundColor:
                                        heatColor(
                                          value,
                                          minimum,
                                          maximum,
                                        ),
                                    }}
                                    title={`${company} / ${column}: ${value}`}
                                  >
                                    {value.toFixed(4)}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="import-covariance-empty">
                    Select at least two companies with shared complete dates.
                  </div>
                )}
              </section>

              <section className="import-preview-card import-covariance-card">
                <header>
                  <div>
                    <h2>Volatility metrics</h2>
                    <p>Mean, standard deviation, and variance of aligned simple returns.</p>
                  </div>
                  <strong>{covariance?.returns.length ?? 0} periods</strong>
                </header>

                {covariance ? (
                  <div className="import-volatility-grid">
                    {covariance.companies.map((company, index) => (
                      <article key={company}>
                        <span>{company}</span>
                        <strong>
                          {(covariance.volatilities[index] * 100).toFixed(4)}%
                        </strong>
                        <small>Period volatility</small>
                        <div className="import-risk-detail">
                          <span>Mean return</span>
                          <strong>
                            {(covariance.meanReturns[index] * 100).toFixed(4)}%
                          </strong>
                        </div>
                        <div className="import-risk-detail">
                          <span>Variance</span>
                          <strong>
                            {covariance.matrix[index][index].toExponential(4)}
                          </strong>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="import-covariance-empty">
                    Volatility requires complete aligned return observations.
                  </div>
                )}
              </section>

              <section className="import-preview-card import-covariance-card">
                <header>
                  <div>
                    <h2>Return distributions</h2>
                    <p>Histograms of the aligned returns used by the covariance analysis.</p>
                  </div>
                  <strong>{distributions.length} companies</strong>
                </header>

                <div className="import-distribution-grid">
                  {distributions.map(distribution => (
                    <article
                      key={distribution.company}
                      className="import-distribution-card"
                    >
                      <header>
                        <div>
                          <h3>{distribution.company}</h3>
                          <span>{distribution.observations} returns</span>
                        </div>
                        <strong>
                          Mean {(distribution.mean * 100).toFixed(4)}%
                        </strong>
                      </header>

                      <div className="import-distribution-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={distribution.bins}
                            margin={{ top: 12, right: 12, left: -18, bottom: 8 }}
                          >
                            <CartesianGrid
                              stroke="var(--grid)"
                              strokeDasharray="3 3"
                            />
                            <XAxis
                              dataKey="label"
                              interval="preserveStartEnd"
                              tick={{ fill: 'var(--muted)', fontSize: 8 }}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fill: 'var(--muted)', fontSize: 9 }}
                            />
                            <Tooltip
                              formatter={value => [Number(value), 'Observations']}
                              contentStyle={{
                                background: 'var(--tooltip)',
                                border: '1px solid var(--border)',
                                borderRadius: 10,
                                color: 'var(--text)',
                              }}
                            />
                            <ReferenceLine
                              x={distribution.zeroLabel}
                              stroke="#f59e0b"
                              strokeDasharray="5 4"
                            />
                            <ReferenceLine
                              x={distribution.meanLabel}
                              stroke="#a78bfa"
                              strokeDasharray="3 3"
                            />
                            <Bar
                              dataKey="count"
                              fill="#6c8cff"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <footer>
                        <span>
                          Volatility {(distribution.volatility * 100).toFixed(4)}%
                        </span>
                        <span>
                          Min {(distribution.minimum * 100).toFixed(3)}%
                        </span>
                        <span>
                          Max {(distribution.maximum * 100).toFixed(3)}%
                        </span>
                      </footer>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </>
  )
}

export default ImportPage