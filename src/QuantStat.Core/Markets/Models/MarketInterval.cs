namespace QuantStat.Core.Markets.Models;

public sealed record MarketInterval
{
    public required string Name { get; init; }

    public required int Minutes { get; init; }

    public bool IsDefault { get; init; }
}