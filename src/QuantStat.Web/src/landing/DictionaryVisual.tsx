import {
  useEffect,
  useState,
} from 'react'


const concepts = [
  {
    symbol: '\u03C3',
    name: 'Standard deviation',
    category: 'Dispersion',
    formula: 'sqrt(Var(X))',
    description:
      'How widely observations vary around their mean.',
  },
  {
    symbol: '\u03C1',
    name: 'Correlation',
    category: 'Dependence',
    formula: 'Cov(X,Y) / (\u03C3X \u03C3Y)',
    description:
      'The strength and direction of linear association.',
  },
  {
    symbol: '\u03BC',
    name: 'Mean',
    category: 'Location',
    formula: 'sum(x) / n',
    description:
      'The arithmetic center of a set of observations.',
  },
  {
    symbol: 'CI',
    name: 'Confidence interval',
    category: 'Inference',
    formula: 'estimate +/- margin',
    description:
      'A range expressing uncertainty around an estimate.',
  },
  {
    symbol: 'RSI',
    name: 'Relative Strength Index',
    category: 'Momentum',
    formula: '100 - 100 / (1 + RS)',
    description:
      'A bounded momentum indicator derived from gains and losses.',
  },
]


function DictionaryVisual() {
  const [
    conceptIndex,
    setConceptIndex,
  ] =
    useState(0)

  useEffect(
    () => {
      const timer =
        window.setInterval(
          () => {
            setConceptIndex(
              current =>
                (
                  current + 1
                ) %
                concepts.length,
            )
          },
          4500,
        )

      return () =>
        window.clearInterval(
          timer,
        )
    },
    [],
  )

  const concept =
    concepts[
      conceptIndex
    ]

  return (
    <div className="dictionary-visual">
      <div className="dictionary-header">
        <span>
          QUANTITATIVE DICTIONARY
        </span>

        <strong>
          Concept + formula + interpretation
        </strong>
      </div>

      <div
        key={concept.name}
        className="dictionary-concept"
      >
        <div className="dictionary-symbol">
          {concept.symbol}
        </div>

        <div className="dictionary-copy">
          <span>
            {concept.category}
          </span>

          <h4>
            {concept.name}
          </h4>

          <code>
            {concept.formula}
          </code>

          <p>
            {concept.description}
          </p>
        </div>
      </div>

      <div className="dictionary-selector">
        {
          concepts.map(
            (
              item,
              index,
            ) => (
              <span
                key={item.name}
                className={
                  index === conceptIndex
                    ? 'active'
                    : ''
                }
              >
                {item.symbol}
              </span>
            ),
          )
        }
      </div>
    </div>
  )
}


export default DictionaryVisual