interface Props {
  title: string
  description: string
}


function PlaceholderPage({
  title,
  description,
}: Props) {
  return (
    <>
      <section className="page-heading">

        <div>
          <h1>
            {title}
          </h1>

          <p>
            {description}
          </p>
        </div>

      </section>


      <section className="placeholder-card">

        <div className="placeholder-badge">
          QuantStat
        </div>

        <h2>
          {title}
        </h2>

        <p>
          This module is next in the
          QuantStat migration plan.
        </p>

      </section>
    </>
  )
}


export default PlaceholderPage
