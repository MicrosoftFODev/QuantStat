import NumericInput
  from '../../components/inputs/NumericInput'
interface SimulationSetupProps {
  amountPerPurchase: number
  numberOfPurchases: number
  startingBudget: number

  rsiType:
    | 'wilder'
    | 'cutler'
    | 'exponential'

  rsiPeriod: number
  rsiThreshold: number

  seed: number
  availableObservations: number

  loading: boolean
  parametersValid: boolean
  purchaseWarning: string | null

  onAmountChange: (
    value: number,
  ) => void

  onPurchasesChange: (
    value: number,
  ) => void

  onRsiTypeChange: (
    value:
      | 'wilder'
      | 'cutler'
      | 'exponential',
  ) => void

  onRsiPeriodChange: (
    value: number,
  ) => void

  onRsiThresholdChange: (
    value: number,
  ) => void

  onSeedChange: (
    value: number,
  ) => void

  onGenerateSeed: () => void
  onRunNewSeed: () => void
  onRun: () => void
}


function currency(
  value: number,
): string {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    },
  ).format(value)
}


function SimulationSetup({
  amountPerPurchase,
  numberOfPurchases,
  startingBudget,
  rsiType,
  rsiPeriod,
  rsiThreshold,
  seed,
  availableObservations,
  loading,
  parametersValid,
  purchaseWarning,
  onAmountChange,
  onPurchasesChange,
  onRsiTypeChange,
  onRsiPeriodChange,
  onRsiThresholdChange,
  onSeedChange,
  onGenerateSeed,
  onRunNewSeed,
  onRun,
}: SimulationSetupProps) {
  return (
    <section className="simulation-setup">
      <div className="simulation-setup-header">
        <div>
          <span className="simulation-eyebrow">
            Experiment
          </span>

          <h2>
            Simulation setup
          </h2>

          <p>
            Configure capital allocation and strategy parameters.
          </p>
        </div>

        <span className="simulation-sampling-note">
          Uniform random timing
        </span>
      </div>


      <div className="simulation-core-controls">
        <label className="simulation-inline-field">
          <span>
            $ / buy
          </span>

          <NumericInput
            value={amountPerPurchase}
            minimum={0.01}
            decimalScale={2}
            allowNegative={false}
            onNumericValueChange={
              onAmountChange
            }
          />
        </label>


        <label className="simulation-inline-field">
          <span>
            Purchases
          </span>

          <NumericInput
            value={numberOfPurchases}
            minimum={1}
            integer
            allowNegative={false}
            onNumericValueChange={
              onPurchasesChange
            }
          />
        </label>


        <div className="simulation-inline-stat">
          <span>
            Budget
          </span>

          <strong>
            {currency(
              startingBudget,
            )}
          </strong>
        </div>
      </div>


      <div className="simulation-strategy-controls">
        <span className="simulation-control-prefix">
          RSI
        </span>

        <label className="simulation-compact-field">
          <span>
            Type
          </span>

          <select
            value={rsiType}
            onChange={event =>
              onRsiTypeChange(
                event.target.value as
                  | 'wilder'
                  | 'cutler'
                  | 'exponential',
              )
            }
          >
            <option value="wilder">
              Wilder
            </option>

            <option value="cutler">
              Cutler
            </option>

            <option value="exponential">
              Exponential
            </option>
          </select>
        </label>


        <label className="simulation-compact-field small">
          <span>
            Period
          </span>

          <NumericInput
            value={rsiPeriod}
            minimum={1}
            integer
            allowNegative={false}
            onNumericValueChange={
              onRsiPeriodChange
            }
          />
        </label>


        <label className="simulation-compact-field small">
          <span>
            Buy below
          </span>

          <NumericInput
            value={rsiThreshold}
            minimum={0}
            maximum={100}
            integer
            allowNegative={false}
            onNumericValueChange={
              onRsiThresholdChange
            }
          />
        </label>
      </div>


      {!parametersValid && (
        <div className="error-banner simulation-setup-message">
          Enter valid investment, purchase, RSI and seed parameters.
        </div>
      )}


      {purchaseWarning && (
        <div className="simulation-warning simulation-setup-message">
          {purchaseWarning}
        </div>
      )}


      <div className="simulation-setup-footer">
        <details className="simulation-advanced">
          <summary>
            Advanced settings
          </summary>

          <div className="simulation-advanced-panel">
            <label className="simulation-inline-field">
              <span>
                Random seed
              </span>

              <NumericInput
                value={seed}
                minimum={0}
                integer
                allowNegative={false}
                thousandSeparator={false}
                onNumericValueChange={
                  onSeedChange
                }
              />
            </label>


            <div className="simulation-advanced-value">
              <span>
                Sampling
              </span>

              <strong>
                Uniform, without replacement
              </strong>
            </div>


            <div className="simulation-advanced-value">
              <span>
                Available candles
              </span>

              <strong>
                {
                  loading
                    ? '...'
                    : availableObservations
                }
              </strong>
            </div>


            <div className="simulation-advanced-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onGenerateSeed}
              >
                Regenerate Seed
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={
                  loading ||
                  !parametersValid
                }
                onClick={onRunNewSeed}
              >
                Run New Random Sample
              </button>
            </div>
          </div>
        </details>


        <button
          type="button"
          className="primary-button simulation-run-button"
          disabled={
            loading ||
            !parametersValid
          }
          onClick={onRun}
        >
          {
            loading
              ? 'Loading Data...'
              : 'Run Simulation'
          }
        </button>
      </div>
    </section>
  )
}


export default SimulationSetup
