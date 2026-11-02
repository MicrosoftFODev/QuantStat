
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

import { useMemo, useState } from 'react'

import MarketNormalityTest from './MarketNormalityTest'

type Alternative = 'two-sided' | 'less' | 'greater'

interface CurvePoint {
    x: number
    density: number
    rejection: number | null
}

interface CriticalBoundaries {
    lower: number | null
    upper: number | null
}

interface TestChartProps {
    distributionName: string
    data: CurvePoint[]
    statistic: number
    lowerCritical: number | null
    upperCritical: number | null
}

/* =========================================================
   PROBABILITY DISTRIBUTIONS
========================================================= */

/*
 * Log-gamma using the Lanczos approximation.
 */
function logGamma(value: number): number {
    const coefficients = [
        676.5203681218851,
        -1259.1392167224028,
        771.3234287776531,
        -176.6150291621406,
        12.507343278686905,
        -0.13857109526572012,
        0.000009984369578019572,
        0.00000015056327351493116,
    ]

    if (value < 0.5) {
        return (
            Math.log(Math.PI) -
            Math.log(Math.sin(Math.PI * value)) -
            logGamma(1 - value)
        )
    }

    const adjusted = value - 1

    let series = 0.9999999999998099

    for (let index = 0; index < coefficients.length; index++) {
        series += coefficients[index] / (adjusted + index + 1)
    }

    const shifted = adjusted + coefficients.length - 0.5

    return (
        0.5 * Math.log(2 * Math.PI) +
        (adjusted + 0.5) * Math.log(shifted) -
        shifted +
        Math.log(series)
    )
}

/*
 * Continued fraction for the regularized
 * incomplete beta function.
 */
function betaContinuedFraction(
    a: number,
    b: number,
    x: number,
): number {
    const maximumIterations = 200
    const epsilon = 3e-14
    const minimumValue = 1e-300

    const sum = a + b
    const aPlusOne = a + 1
    const aMinusOne = a - 1

    let c = 1

    let d = 1 - (sum * x) / aPlusOne

    if (Math.abs(d) < minimumValue) {
        d = minimumValue
    }

    d = 1 / d

    let result = d

    for (let iteration = 1; iteration <= maximumIterations; iteration++) {
        const doubleIteration = 2 * iteration

        let numerator =
            (iteration * (b - iteration) * x) /
            ((aMinusOne + doubleIteration) * (a + doubleIteration))

        d = 1 + numerator * d

        if (Math.abs(d) < minimumValue) {
            d = minimumValue
        }

        c = 1 + numerator / c

        if (Math.abs(c) < minimumValue) {
            c = minimumValue
        }

        d = 1 / d

        result *= d * c

        numerator =
            -((a + iteration) * (sum + iteration) * x) /
            ((a + doubleIteration) * (aPlusOne + doubleIteration))

        d = 1 + numerator * d

        if (Math.abs(d) < minimumValue) {
            d = minimumValue
        }

        c = 1 + numerator / c

        if (Math.abs(c) < minimumValue) {
            c = minimumValue
        }

        d = 1 / d

        const delta = d * c

        result *= delta

        if (Math.abs(delta - 1) < epsilon) {
            break
        }
    }

    return result
}

/*
 * Regularized incomplete beta function.
 */
function regularizedIncompleteBeta(
    x: number,
    a: number,
    b: number,
): number {
    if (x <= 0) return 0
    if (x >= 1) return 1

    const betaTerm = Math.exp(
        logGamma(a + b) -
        logGamma(a) -
        logGamma(b) +
        a * Math.log(x) +
        b * Math.log(1 - x),
    )

    if (x < (a + 1) / (a + b + 2)) {
        return (
            (betaTerm * betaContinuedFraction(a, b, x)) / a
        )
    }

    return (
        1 -
        (betaTerm * betaContinuedFraction(b, a, 1 - x)) / b
    )
}

/* =========================================================
   STUDENT'S T DISTRIBUTION
========================================================= */

function studentTDensity(
    value: number,
    degreesOfFreedom: number,
): number {
    const df = degreesOfFreedom

    const logCoefficient =
        logGamma((df + 1) / 2) -
        logGamma(df / 2) -
        0.5 * Math.log(df * Math.PI)

    return (
        Math.exp(logCoefficient) *
        Math.pow(1 + (value * value) / df, -(df + 1) / 2)
    )
}

function studentTCdf(
    value: number,
    degreesOfFreedom: number,
): number {
    if (
        !Number.isFinite(value) ||
        !Number.isFinite(degreesOfFreedom) ||
        degreesOfFreedom <= 0
    ) {
        return Number.NaN
    }

    if (value === 0) return 0.5

    const x =
        degreesOfFreedom /
        (degreesOfFreedom + value * value)

    const beta = regularizedIncompleteBeta(
        x,
        degreesOfFreedom / 2,
        0.5,
    )

    if (value > 0) {
        return 1 - 0.5 * beta
    }

    return 0.5 * beta
}

/*
 * Inverse Student's t CDF using binary search.
 */
function inverseStudentT(
    probability: number,
    degreesOfFreedom: number,
): number {
    if (probability <= 0) {
        return Number.NEGATIVE_INFINITY
    }

    if (probability >= 1) {
        return Number.POSITIVE_INFINITY
    }

    let lower = -100
    let upper = 100

    for (let iteration = 0; iteration < 120; iteration++) {
        const middle = (lower + upper) / 2

        if (studentTCdf(middle, degreesOfFreedom) < probability) {
            lower = middle
        } else {
            upper = middle
        }
    }

    return (lower + upper) / 2
}

/* =========================================================
   STANDARD NORMAL DISTRIBUTION
========================================================= */

/*
 * Error function approximation.
 */
function errorFunction(value: number): number {
    const sign = value < 0 ? -1 : 1
    const absoluteValue = Math.abs(value)

    const t = 1 / (1 + 0.3275911 * absoluteValue)

    const approximation =
        1 -
        (
            (
                (
                    (
                        (
                            1.061405429 * t -
                            1.453152027
                        ) * t +
                        1.421413741
                    ) * t -
                    0.284496736
                ) * t +
                0.254829592
            ) * t
        ) *
        Math.exp(-absoluteValue * absoluteValue)

    return sign * approximation
}

function normalCdf(value: number): number {
    return (
        1 +
        errorFunction(value / Math.sqrt(2))
    ) / 2
}

function normalDensity(value: number): number {
    return (
        Math.exp(-0.5 * value * value) /
        Math.sqrt(2 * Math.PI)
    )
}

/*
 * Inverse standard normal CDF.
 */
function inverseNormal(probability: number): number {
    if (probability <= 0) {
        return Number.NEGATIVE_INFINITY
    }

    if (probability >= 1) {
        return Number.POSITIVE_INFINITY
    }

    let lower = -8
    let upper = 8

    for (let iteration = 0; iteration < 120; iteration++) {
        const middle = (lower + upper) / 2

        if (normalCdf(middle) < probability) {
            lower = middle
        } else {
            upper = middle
        }
    }

    return (lower + upper) / 2
}

/* =========================================================
   HYPOTHESIS TEST CALCULATIONS
========================================================= */

function calculatePValue(
    cumulativeProbability: number,
    alternative: Alternative,
): number {
    if (alternative === 'less') {
        return cumulativeProbability
    }

    if (alternative === 'greater') {
        return 1 - cumulativeProbability
    }

    return Math.min(
        1,
        2 * Math.min(
            cumulativeProbability,
            1 - cumulativeProbability,
        ),
    )
}

function getCriticalBoundaries(
    alpha: number,
    alternative: Alternative,
    inverse: (probability: number) => number,
): CriticalBoundaries {
    if (alternative === 'less') {
        return {
            lower: inverse(alpha),
            upper: null,
        }
    }

    if (alternative === 'greater') {
        return {
            lower: null,
            upper: inverse(1 - alpha),
        }
    }

    return {
        lower: inverse(alpha / 2),
        upper: inverse(1 - alpha / 2),
    }
}

/*
 * Generates points for the distribution chart
 * and identifies the rejection region.
 */
function createCurve(
    density: (value: number) => number,
    boundaries: CriticalBoundaries,
    statistic: number,
): CurvePoint[] {
    const finiteValues = [
        boundaries.lower,
        boundaries.upper,
        statistic,
    ].filter(
        (value): value is number =>
            value !== null && Number.isFinite(value),
    )

    const mostExtreme =
        finiteValues.length > 0
            ? Math.max(
                ...finiteValues.map(value => Math.abs(value)),
            )
            : 4

    const range = Math.max(
        4,
        Math.min(12, mostExtreme + 1),
    )

    const pointCount = 300

    const points: CurvePoint[] = []

    for (let index = 0; index <= pointCount; index++) {
        const x =
            -range +
            (2 * range * index) / pointCount

        const densityValue = density(x)

        const rejected =
            (
                boundaries.lower !== null &&
                x <= boundaries.lower
            ) ||
            (
                boundaries.upper !== null &&
                x >= boundaries.upper
            )

        points.push({
            x: Number(x.toFixed(4)),
            density: densityValue,
            rejection: rejected ? densityValue : null,
        })
    }

    return points
}

/* =========================================================
   DISPLAY HELPERS
========================================================= */

function alternativeText(
    alternative: Alternative,
    nullValue: number,
): string {
    if (alternative === 'less') {
        return `H1: population mean < ${nullValue}`
    }

    if (alternative === 'greater') {
        return `H1: population mean > ${nullValue}`
    }

    return `H1: population mean ≠ ${nullValue}`
}

function formatResult(
    value: number,
    digits = 6,
): string {
    if (!Number.isFinite(value)) {
        return '-'
    }

    if (Math.abs(value) < 0.000001 && value !== 0) {
        return value.toExponential(4)
    }

    return value.toFixed(digits)
}

/* =========================================================
   DISTRIBUTION CHART
========================================================= */

function TestChart({
    distributionName,
    data,
    statistic,
    lowerCritical,
    upperCritical,
}: TestChartProps) {
    return (
        <div className= "test-chart" >
        <ResponsiveContainer width="100%" height = "100%" >
            <ComposedChart
                    data={ data }
    margin = {{
        top: 24,
            right: 24,
                bottom: 6,
                    left: 8,
                    }
}
                >
    <CartesianGrid
                        stroke="var(--grid)"
strokeDasharray = "3 3"
vertical = { false}
    />

    <XAxis
                        type="number"
dataKey = "x"
domain = { ['dataMin', 'dataMax']}
tickCount = { 9}
tick = {{
    fill: 'var(--muted)',
        fontSize: 10,
                        }}
                    />

    < YAxis
hide
domain = { [0, 'auto']}
    />

    <Tooltip
                        contentStyle={
    {
        background: 'var(--tooltip)',
            border: '1px solid var(--border)',
                borderRadius: 12,
                    color: 'var(--text)',
                        }
}
formatter = {(value) => [
    Number(value).toFixed(6),
    'Density',
]}
labelFormatter = {(value) =>
`${distributionName}: ${Number(value).toFixed(4)}`
                        }
                    />

    < Area
type = "monotone"
dataKey = "rejection"
stroke = "none"
fill = "#fb7185"
fillOpacity = { 0.35}
connectNulls = { false}
name = "Rejection region"
    />

    <Line
                        type="monotone"
dataKey = "density"
stroke = "#6c8cff"
strokeWidth = { 2.4}
dot = { false}
name = {`${distributionName} density`}
                    />

{
    lowerCritical !== null && (
        <ReferenceLine
                            x={ lowerCritical }
    stroke = "#fb7185"
    strokeWidth = { 1.5}
    strokeDasharray = "5 5"
    label = {{
        value: `Critical ${lowerCritical.toFixed(3)}`,
            fill: '#fb7185',
                fontSize: 9,
                            }
}
                        />
                    )}

{
    upperCritical !== null && (
        <ReferenceLine
                            x={ upperCritical }
    stroke = "#fb7185"
    strokeWidth = { 1.5}
    strokeDasharray = "5 5"
    label = {{
        value: `Critical ${upperCritical.toFixed(3)}`,
            fill: '#fb7185',
                fontSize: 9,
                            }
}
                        />
                    )}

{
    Number.isFinite(statistic) && (
        <ReferenceLine
                            x={ statistic }
    stroke = "#f59e0b"
    strokeWidth = { 2}
    label = {{
        value: `Observed ${statistic.toFixed(3)}`,
            fill: '#f59e0b',
                fontSize: 9,
                            }
}
                        />
                    )}
</ComposedChart>
    </ResponsiveContainer>
    </div>
    )
}

/* =========================================================
   STATISTICAL DECISION
========================================================= */

function TestDecision({
    valid,
    pValue,
    alpha,
}: {
    valid: boolean
    pValue: number
    alpha: number
}) {
    if (!valid) {
        return (
            <div className= "calculator-message" >
            Enter valid values before interpreting the test.
            </div>
        )
    }

    const reject = pValue <= alpha

    return (
        <div className= { reject? 'test-decision reject': 'test-decision retain' } >
        <span>Statistical decision </span>

            <strong>
    {
        reject
            ? 'Reject the null hypothesis'
            : 'Do not reject the null hypothesis'
    }
    </strong>

        <small>
    {
        reject
            ? 'The p-value is less than or equal to the significance level.'
            : 'The p-value is greater than the significance level.'
    }
    </small>
        </div>
    )
}

/* =========================================================
   SHARED ONE-SAMPLE TEST CALCULATOR
========================================================= */

interface CalculatorProps {
    type: 't' | 'z'
}

function OneSampleTest({ type }: CalculatorProps) {
    const isTTest = type === 't'

    const [sampleMeanText, setSampleMeanText] = useState('102')
    const [nullMeanText, setNullMeanText] = useState('100')

    const [sdText, setSdText] = useState(
        isTTest ? '8' : '10',
    )

    const [sampleSizeText, setSampleSizeText] = useState(
        isTTest ? '25' : '36',
    )

    const [alphaText, setAlphaText] = useState('0.05')

    const [alternative, setAlternative] = useState<Alternative>(
        'two-sided',
    )

    const sampleMean = Number(sampleMeanText)
    const nullMean = Number(nullMeanText)
    const sd = Number(sdText)
    const sampleSize = Number(sampleSizeText)
    const alpha = Number(alphaText)

    const degreesOfFreedom = sampleSize - 1

    /*
     * Validate both the contents of the fields
     * and the numerical values.
     */
    const valid =
        sampleMeanText.trim() !== '' &&
        nullMeanText.trim() !== '' &&
        sdText.trim() !== '' &&
        sampleSizeText.trim() !== '' &&
        alphaText.trim() !== '' &&
        Number.isFinite(sampleMean) &&
        Number.isFinite(nullMean) &&
        Number.isFinite(sd) &&
        Number.isFinite(sampleSize) &&
        Number.isFinite(alpha) &&
        Number.isInteger(sampleSize) &&
        sd > 0 &&
        sampleSize >= (isTTest ? 2 : 1) &&
        alpha > 0 &&
        alpha < 1

    const standardError = valid
        ? sd / Math.sqrt(sampleSize)
        : Number.NaN

    const statistic = valid
        ? (sampleMean - nullMean) / standardError
        : Number.NaN

    const cumulativeProbability = valid
        ? isTTest
            ? studentTCdf(statistic, degreesOfFreedom)
            : normalCdf(statistic)
        : Number.NaN

    const pValue = valid
        ? calculatePValue(cumulativeProbability, alternative)
        : Number.NaN

    const inverse = isTTest
        ? (probability: number) =>
            inverseStudentT(probability, degreesOfFreedom)
        : inverseNormal

    const boundaries = valid
        ? getCriticalBoundaries(alpha, alternative, inverse)
        : {
            lower: null,
            upper: null,
        }

    /*
     * Two-sided (1-alpha) confidence interval.
     */
    const twoSidedCritical = valid
        ? inverse(1 - alpha / 2)
        : Number.NaN

    const confidenceLower = valid
        ? sampleMean - twoSidedCritical * standardError
        : Number.NaN

    const confidenceUpper = valid
        ? sampleMean + twoSidedCritical * standardError
        : Number.NaN

    /*
     * Effect size.
     *
     * Cohen's d for the one-sample t-test.
     * Standardized effect for the z-test.
     */
    const effectSize = valid
        ? (sampleMean - nullMean) / sd
        : Number.NaN

    /*
     * Distribution chart.
     */
    const chartData = useMemo(
        () =>
            createCurve(
                isTTest
                    ? (value) =>
                        studentTDensity(
                            value,
                            Math.max(1, degreesOfFreedom),
                        )
                    : normalDensity,
                boundaries,
                statistic,
            ),
        [
            isTTest,
            degreesOfFreedom,
            boundaries.lower,
            boundaries.upper,
            statistic,
        ],
    )

    const title = isTTest
        ? 'One-sample t-test'
        : 'One-sample z-test'

    const distributionName = isTTest
        ? 'Student t'
        : 'Standard normal'

    return (
        <article className= "hypothesis-test-card" >

        {/* Heading */ }

        < div className = "test-card-heading" >
            <div>
            <span>
            {
                isTTest
                ? 'Unknown population standard deviation'
                    : 'Known population standard deviation'
            }
            </span>

            < h3 > { title } </h3>

            <p>
    {
        isTTest
            ? 'Tests whether a population mean differs from a hypothesized value when the population standard deviation is unknown and estimated using the sample standard deviation.'
            : 'Tests whether a population mean differs from a hypothesized value when the population standard deviation is known.'
    }
    </p>
        </div>
        </div>

    {/* Hypotheses */ }

    <div className="test-hypotheses" >

        <div>
        <span>Null hypothesis </span>

            <strong>
    H0: population mean = {
        Number.isFinite(nullMean)
            ? nullMean
            : 'mu_0'
    }
        </strong>
        </div>

        < div >
        <span>Alternative hypothesis </span>

            <strong>
    {
        Number.isFinite(nullMean)
        ? alternativeText(alternative, nullMean)
        : 'Enter a valid null mean'
    }
    </strong>
        </div>

        </div>

    {/* Input fields */ }

    <div className="test-input-grid" >

        <label>
        Sample mean(x_bar)

            < input
    type = "number"
    value = { sampleMeanText }
    onChange = {(event) =>
    setSampleMeanText(event.target.value)
}
                    />
    </label>

    <label>
                    Hypothesized mean(mu_0)

    < input
type = "number"
value = { nullMeanText }
onChange = {(event) =>
setNullMeanText(event.target.value)
                        }
                    />
    </label>

    <label>
{
    isTTest
        ? 'Sample standard deviation (s)'
        : 'Known population SD (sigma)'
}

<input
                        type="number"
min = "0"
value = { sdText }
onChange = {(event) =>
setSdText(event.target.value)
                        }
                    />
    </label>

    <label>
                    Sample size(n)

    < input
type = "number"
min = { isTTest? '2': '1' }
step = "1"
value = { sampleSizeText }
onChange = {(event) =>
setSampleSizeText(event.target.value)
                        }
                    />
    </label>

    <label>
                    Significance level(alpha)

    < select
value = { alphaText }
onChange = {(event) =>
setAlphaText(event.target.value)
                        }
                    >
    <option value="0.10" > 0.10 </option>
        < option value = "0.05" > 0.05 </option>
            < option value = "0.01" > 0.01 </option>
                </select>
                </label>

                <label>
                    Alternative hypothesis

    < select
value = { alternative }
onChange = {(event) =>
setAlternative(
    event.target.value as Alternative,
)
                        }
                    >
    <option value="two-sided" >
        Two - sided
        </option>

        < option value = "less" >
            Mean is less than mu_0
                </option>

                < option value = "greater" >
                    Mean is greater than mu_0
                        </option>
                        </select>
                        </label>

                        </div>

{/* Distribution chart */ }

<TestChart
                distributionName={ distributionName }
data = { chartData }
statistic = { statistic }
lowerCritical = { boundaries.lower }
upperCritical = { boundaries.upper }
    />

{/* Results */ }

    < div className = "test-result-grid" >

        <div>
        <span>Standard error </span>

            <strong>
{ formatResult(standardError) }
</strong>
    </div>

    < div >
    <span>{ isTTest? 't statistic': 'z statistic' } </span>

    <strong>
{ formatResult(statistic) }
</strong>
    </div>

{
    isTTest && (
        <div>
        <span>Degrees of freedom </span>

            <strong>
    { valid ? degreesOfFreedom : '-' }
    </strong>
        </div>
                )
}

<div>
    <span>p - value </span>

    <strong>
{ formatResult(pValue) }
</strong>
    </div>

    < div >
    <span>Significance level </span>

        <strong>
{ valid ? alpha.toFixed(2) : '-' }
</strong>
    </div>

    < div >
    <span>Lower critical value </span>

        <strong>
{
    boundaries.lower === null
    ? 'Not used'
    : formatResult(boundaries.lower)
}
</strong>
    </div>

    < div >
    <span>Upper critical value </span>

        <strong>
{
    boundaries.upper === null
    ? 'Not used'
    : formatResult(boundaries.upper)
}
</strong>
    </div>

    < div >
    <span>Two - sided confidence interval </span>

        <strong>
{
    valid
        ? `[${formatResult(confidenceLower)}, ${formatResult(confidenceUpper)}]`
        : '-'
}
</strong>
    </div>

    < div >
    <span>
    { isTTest? "Cohen's d": 'Standardized effect' }
    </span>

    <strong>
{ formatResult(effectSize) }
</strong>
    </div>

    </div>

{/* Statistical decision */ }

<TestDecision
                valid={ valid }
pValue = { pValue }
alpha = { alpha }
    />

{/* Explanation */ }

    < div className = "test-explanation" >

        <strong>Calculation </strong>

        <p>
{
    isTTest
        ? 't = (x_bar - mu_0) / (s / sqrt(n)). The test follows a Student t distribution with n - 1 degrees of freedom.'
        : 'z = (x_bar - mu_0) / (sigma / sqrt(n)). The test follows a standard normal distribution.'
}
</p>

    <p>
                    The orange line represents the observed test statistic.
                    The red area represents the rejection region for the
                    selected significance level and alternative hypothesis.
                </p>

{
    !isTTest && (
        <p>
        Use the z - test only when the population standard
                        deviation is genuinely known.When it is estimated
                        from the sample, use the one - sample t - test.
                    </p>
                )
}

</div>

    </article>
    )
}

/* =========================================================
   ONE-SAMPLE T-TEST
========================================================= */

function OneSampleTTest() {
    return <OneSampleTest type="t" />
}

/* =========================================================
   ONE-SAMPLE Z-TEST
========================================================= */

function OneSampleZTest() {
    return <OneSampleTest type="z" />
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

function DictionaryCalculators() {
    return (
        <section className= "dictionary-calculators" >

        <div className="dictionary-section-heading" >

            <span>Interactive learning </span>

                < h2 > Statistical tests </h2>

                    <p>
                    Enter summary statistics to examine the test
    statistic, critical region, p - value, confidence
    interval, effect size, and statistical decision.
                </p>

        </div>

        < div className = "hypothesis-test-stack" >

            <OneSampleTTest />

            < OneSampleZTest />

            <MarketNormalityTest />

            </div>

            </section>
    )
}

export default DictionaryCalculators
