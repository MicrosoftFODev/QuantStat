using QuantStat.Core.Markets.Models;
using QuantStat.Core.Statistics.Models;

namespace QuantStat.Core.Statistics;

public sealed class StatisticsService
{
    public StatisticsResult Calculate(
        IReadOnlyList<MarketCandle> candles,
        int intervalMinutes)
    {
        ArgumentNullException.ThrowIfNull(candles);

        if (candles.Count < 5)
        {
            throw new ArgumentException(
                "At least five market observations are required.",
                nameof(candles));
        }

        double[] closingPrices = candles
            .Select(candle => candle.Close)
            .Where(price =>
                double.IsFinite(price) &&
                price > 0.0)
            .ToArray();

        if (closingPrices.Length < 5)
        {
            throw new InvalidOperationException(
                "At least five valid closing prices are required.");
        }

        double[] returns =
            StatisticalMath.LogReturns(closingPrices);

        double standardDeviation =
            StatisticalMath.SampleStandardDeviation(returns);

        double periodsPerYear =
            CalculatePeriodsPerYear(intervalMinutes);

        return new StatisticsResult
        {
            ObservationCount = closingPrices.Length,

            MeanPrice =
                StatisticalMath.ArithmeticMean(closingPrices),

            MinimumPrice =
                closingPrices.Min(),

            MaximumPrice =
                closingPrices.Max(),

            MeanLogReturn =
                StatisticalMath.ArithmeticMean(returns),

            ReturnVariance =
                StatisticalMath.SampleVariance(returns),

            ReturnStandardDeviation =
                standardDeviation,

            AnnualizedVolatility =
                standardDeviation * Math.Sqrt(periodsPerYear),

            Quantile05 =
                StatisticalMath.Quantile(
                    returns,
                    0.05),

            Quantile10 =
                StatisticalMath.Quantile(
                    returns,
                    0.10),

            Quantile90 =
                StatisticalMath.Quantile(
                    returns,
                    0.90),

            Quantile95 =
                StatisticalMath.Quantile(
                    returns,
                    0.95),

            Skewness =
                StatisticalMath.AdjustedSkewness(returns),

            ExcessKurtosis =
                StatisticalMath.AdjustedExcessKurtosis(returns)
        };
    }

    public static double CalculatePeriodsPerYear(
        int intervalMinutes)
    {
        if (intervalMinutes <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(intervalMinutes));
        }

        const double MinutesPerYear =
            365.25 * 24.0 * 60.0;

        return MinutesPerYear / intervalMinutes;
    }
}