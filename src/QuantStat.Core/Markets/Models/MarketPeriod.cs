namespace QuantStat.Core.Markets.Models;

public sealed record MarketPeriod
{
    public required string Name { get; init; }

    public required int Days { get; init; }

    public bool IsDefault { get; init; }
}