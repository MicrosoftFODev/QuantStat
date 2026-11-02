using QuantStat.Core.Statistics.Models;

namespace QuantStat.Core.Dashboard.Models;

public sealed record DashboardResult
{
    public required string Symbol { get; init; }

    public required int IntervalMinutes { get; init; }

    public required int PeriodDays { get; init; }

    public required double LatestPrice { get; init; }

    public required double PreviousPrice { get; init; }

    public required double PriceChange { get; init; }

    public required double PriceChangePercent { get; init; }

    public required int ObservationCount { get; init; }

    public required double MeanPrice { get; init; }

    public required double AnnualizedVolatility { get; init; }

    public required StatisticsResult Statistics { get; init; }

    public required IReadOnlyList<DashboardPoint> Points { get; init; }
}
