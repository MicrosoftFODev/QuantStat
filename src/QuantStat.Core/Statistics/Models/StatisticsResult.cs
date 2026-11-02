namespace QuantStat.Core.Statistics.Models;

public sealed record StatisticsResult
{
    public required int ObservationCount { get; init; }

    public required double MeanPrice { get; init; }

    public required double MinimumPrice { get; init; }

    public required double MaximumPrice { get; init; }

    public required double MeanLogReturn { get; init; }

    public required double ReturnVariance { get; init; }

    public required double ReturnStandardDeviation { get; init; }

    public required double AnnualizedVolatility { get; init; }

    public required double Quantile05 { get; init; }

    public required double Quantile10 { get; init; }

    public required double Quantile90 { get; init; }

    public required double Quantile95 { get; init; }

    public required double Skewness { get; init; }

    public required double ExcessKurtosis { get; init; }
}
