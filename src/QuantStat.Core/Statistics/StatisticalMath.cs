namespace QuantStat.Core.Statistics;

public static class StatisticalMath
{
    public static double ArithmeticMean(
        IReadOnlyList<double> values)
    {
        Validate(
            values,
            1);

        double sum = 0.0;

        for (int i = 0; i < values.Count; i++)
        {
            sum += values[i];
        }

        return sum / values.Count;
    }


    public static double GeometricMean(
        IReadOnlyList<double> values)
    {
        Validate(
            values,
            1);

        double logSum = 0.0;

        foreach (double value in values)
        {
            if (value <= 0.0)
            {
                throw new ArgumentException(
                    "Geometric mean requires positive values.",
                    nameof(values));
            }

            logSum += Math.Log(value);
        }

        return Math.Exp(
            logSum / values.Count);
    }


    public static double HarmonicMean(
        IReadOnlyList<double> values)
    {
        Validate(
            values,
            1);

        double reciprocalSum = 0.0;

        foreach (double value in values)
        {
            if (value <= 0.0)
            {
                throw new ArgumentException(
                    "Harmonic mean requires positive values.",
                    nameof(values));
            }

            reciprocalSum += 1.0 / value;
        }

        return values.Count / reciprocalSum;
    }


    public static double WeightedMean(
        IReadOnlyList<double> values,
        IReadOnlyList<double> weights)
    {
        Validate(
            values,
            1);

        ArgumentNullException.ThrowIfNull(weights);

        if (values.Count != weights.Count)
        {
            throw new ArgumentException(
                "Values and weights must have the same length.");
        }

        double weightedSum = 0.0;
        double totalWeight = 0.0;

        for (int i = 0; i < values.Count; i++)
        {
            double weight = weights[i];

            if (!double.IsFinite(weight) || weight < 0.0)
            {
                throw new ArgumentException(
                    "Weights must be finite and non-negative.",
                    nameof(weights));
            }

            weightedSum +=
                values[i] * weight;

            totalWeight += weight;
        }

        if (totalWeight <= 0.0)
        {
            throw new ArgumentException(
                "At least one weight must be positive.",
                nameof(weights));
        }

        return weightedSum / totalWeight;
    }


    public static double SampleVariance(
        IReadOnlyList<double> values)
    {
        Validate(
            values,
            2);

        double mean =
            ArithmeticMean(values);

        double sum = 0.0;

        foreach (double value in values)
        {
            double difference =
                value - mean;

            sum +=
                difference * difference;
        }

        return sum /
               (values.Count - 1);
    }


    public static double SampleStandardDeviation(
        IReadOnlyList<double> values)
    {
        return Math.Sqrt(
            SampleVariance(values));
    }


    public static double LogReturn(
        double previousPrice,
        double currentPrice)
    {
        if (
            !double.IsFinite(previousPrice) ||
            !double.IsFinite(currentPrice) ||
            previousPrice <= 0.0 ||
            currentPrice <= 0.0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(currentPrice),
                "Prices must be positive finite values.");
        }

        return Math.Log(
            currentPrice /
            previousPrice);
    }


    public static double[] LogReturns(
        IReadOnlyList<double> prices)
    {
        Validate(
            prices,
            2);

        var result =
            new double[
                prices.Count - 1
            ];

        for (int i = 1; i < prices.Count; i++)
        {
            result[i - 1] =
                LogReturn(
                    prices[i - 1],
                    prices[i]);
        }

        return result;
    }


    public static double Quantile(
        IReadOnlyList<double> values,
        double probability)
    {
        Validate(
            values,
            1);

        if (
            probability < 0.0 ||
            probability > 1.0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(probability));
        }

        double[] sorted =
            values
                .OrderBy(x => x)
                .ToArray();

        if (sorted.Length == 1)
        {
            return sorted[0];
        }

        double position =
            probability *
            (sorted.Length - 1);

        int lower =
            (int)Math.Floor(position);

        int upper =
            (int)Math.Ceiling(position);

        if (lower == upper)
        {
            return sorted[lower];
        }

        double fraction =
            position - lower;

        return
            sorted[lower] +
            fraction *
            (
                sorted[upper] -
                sorted[lower]
            );
    }


    public static double AdjustedSkewness(
        IReadOnlyList<double> values)
    {
        Validate(
            values,
            3);

        int n = values.Count;

        double mean =
            ArithmeticMean(values);

        double standardDeviation =
            SampleStandardDeviation(values);

        if (standardDeviation == 0.0)
        {
            return 0.0;
        }

        double sum = 0.0;

        foreach (double value in values)
        {
            double z =
                (value - mean) /
                standardDeviation;

            sum += z * z * z;
        }

        return
            n /
            (
                (n - 1.0) *
                (n - 2.0)
            ) *
            sum;
    }


    public static double AdjustedExcessKurtosis(
        IReadOnlyList<double> values)
    {
        Validate(
            values,
            4);

        int n = values.Count;

        double mean =
            ArithmeticMean(values);

        double standardDeviation =
            SampleStandardDeviation(values);

        if (standardDeviation == 0.0)
        {
            return 0.0;
        }

        double fourthPowerSum = 0.0;

        foreach (double value in values)
        {
            double z =
                (value - mean) /
                standardDeviation;

            fourthPowerSum +=
                z * z * z * z;
        }

        double first =
            (
                n *
                (n + 1.0)
            ) /
            (
                (n - 1.0) *
                (n - 2.0) *
                (n - 3.0)
            ) *
            fourthPowerSum;

        double second =
            (
                3.0 *
                Math.Pow(
                    n - 1.0,
                    2.0)
            ) /
            (
                (n - 2.0) *
                (n - 3.0)
            );

        return first - second;
    }


    private static void Validate(
        IReadOnlyList<double> values,
        int minimumCount)
    {
        ArgumentNullException.ThrowIfNull(values);

        if (values.Count < minimumCount)
        {
            throw new ArgumentException(
                $"At least {minimumCount} values are required.",
                nameof(values));
        }

        foreach (double value in values)
        {
            if (!double.IsFinite(value))
            {
                throw new ArgumentException(
                    "All values must be finite.",
                    nameof(values));
            }
        }
    }
}
