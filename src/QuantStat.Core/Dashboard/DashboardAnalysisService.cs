using QuantStat.Core.Dashboard.Models;
using QuantStat.Core.Indicators;
using QuantStat.Core.Markets.Models;
using QuantStat.Core.Statistics;

namespace QuantStat.Core.Dashboard;

public sealed class DashboardAnalysisService
{
    private readonly StatisticsService _statisticsService;

    public DashboardAnalysisService(
        StatisticsService statisticsService)
    {
        _statisticsService =
            statisticsService;
    }


    public DashboardResult Calculate(
        string symbol,
        int intervalMinutes,
        int periodDays,
        IReadOnlyList<MarketCandle> candles)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(
            symbol);

        ArgumentNullException.ThrowIfNull(
            candles);

        if (candles.Count < 5)
        {
            throw new ArgumentException(
                "At least five completed candles are required.",
                nameof(candles));
        }

        MarketCandle[] orderedCandles =
            candles
                .Where(
                    candle =>
                        double.IsFinite(candle.Close) &&
                        candle.Close > 0.0)
                .OrderBy(
                    candle =>
                        candle.Date)
                .ToArray();

        if (orderedCandles.Length < 5)
        {
            throw new InvalidOperationException(
                "At least five valid closing prices are required.");
        }

        double[] prices =
            orderedCandles
                .Select(
                    candle =>
                        candle.Close)
                .ToArray();

        var statistics =
            _statisticsService.Calculate(
                orderedCandles,
                intervalMinutes);

        double?[] wilderRsi =
            RsiCalculator.Wilder(
                prices,
                14);

        double?[] cutlerRsi =
            RsiCalculator.Cutler(
                prices,
                14);

        double?[] exponentialRsi =
            RsiCalculator.Exponential(
                prices,
                14);

        double?[] stochasticRsi =
            RsiCalculator.Stochastic(
                prices,
                14,
                14);

        double?[] connorsRsi =
            RsiCalculator.Connors(
                prices,
                3,
                2,
                100);

        var points =
            new List<DashboardPoint>(
                orderedCandles.Length);

        for (int i = 0; i < orderedCandles.Length; i++)
        {
            points.Add(
                new DashboardPoint
                {
                    Date =
                        orderedCandles[i].Date,

                    Price =
                        orderedCandles[i].Close,

                    MeanPrice =
                        statistics.MeanPrice,

                    WilderRsi =
                        wilderRsi[i],

                    CutlerRsi =
                        cutlerRsi[i],

                    ExponentialRsi =
                        exponentialRsi[i],

                    StochasticRsi =
                        stochasticRsi[i],

                    ConnorsRsi =
                        connorsRsi[i]
                });
        }

        double latestPrice =
            prices[^1];

        double previousPrice =
            prices[^2];

        double priceChange =
            latestPrice -
            previousPrice;

        double priceChangePercent =
            previousPrice == 0.0
                ? 0.0
                : priceChange /
                  previousPrice *
                  100.0;

        return new DashboardResult
        {
            Symbol =
                symbol,

            IntervalMinutes =
                intervalMinutes,

            PeriodDays =
                periodDays,

            LatestPrice =
                latestPrice,

            PreviousPrice =
                previousPrice,

            PriceChange =
                priceChange,

            PriceChangePercent =
                priceChangePercent,

            ObservationCount =
                prices.Length,

            MeanPrice =
                statistics.MeanPrice,

            AnnualizedVolatility =
                statistics.AnnualizedVolatility,

            Statistics =
                statistics,

            Points =
                points
        };
    }
}
