namespace QuantStat.Core.Dashboard.Models;

public sealed record DashboardPoint
{
    public required DateTimeOffset Date { get; init; }

    public required double Price { get; init; }

    public required double MeanPrice { get; init; }

    public double? WilderRsi { get; init; }

    public double? CutlerRsi { get; init; }

    public double? ExponentialRsi { get; init; }

    public double? StochasticRsi { get; init; }

    public double? ConnorsRsi { get; init; }
}
