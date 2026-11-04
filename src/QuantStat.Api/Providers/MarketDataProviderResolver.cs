using QuantStat.Api.Providers.Coinbase;
using QuantStat.Api.Providers.Kraken;
using QuantStat.Core.Abstractions;

namespace QuantStat.Api.Providers;

public sealed class MarketDataProviderResolver
{
    private readonly IServiceProvider _services;

    public MarketDataProviderResolver(
        IServiceProvider services)
    {
        _services =
            services;
    }

    public IReadOnlyList<object> GetProviders()
    {
        return
        [
            new
            {
                Id = "kraken",
                Name = "Kraken",
                DefaultSymbol = "ETHUSD"
            },

            new
            {
                Id = "coinbase",
                Name = "Coinbase",
                DefaultSymbol = "ETH-USD"
            }
        ];
    }

    public IMarketDataProvider Resolve(
        string? provider)
    {
        string normalizedProvider =
            string.IsNullOrWhiteSpace(provider)
                ? "kraken"
                : provider
                    .Trim()
                    .ToLowerInvariant();

        return normalizedProvider switch
        {
            "kraken" =>
                _services.GetRequiredService<
                    KrakenMarketDataProvider>(),

            "coinbase" =>
                _services.GetRequiredService<
                    CoinbaseMarketDataProvider>(),

            _ =>
                throw new ArgumentException(
                    $"Unknown market-data provider '{provider}'. " +
                    "Supported providers are 'kraken' and 'coinbase'.",
                    nameof(provider))
        };
    }

    public string GetDefaultSymbol(
        string? provider)
    {
        string normalizedProvider =
            string.IsNullOrWhiteSpace(provider)
                ? "kraken"
                : provider
                    .Trim()
                    .ToLowerInvariant();

        return normalizedProvider switch
        {
            "coinbase" =>
                "ETH-USD",

            _ =>
                "ETHUSD"
        };
    }
}