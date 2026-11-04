using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;

namespace QuantStat.Api.Providers.Alpaca;

public sealed class AlpacaAssetsClient
{
    private const string CacheKey =
        "alpaca-active-us-equities";

    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;

    public AlpacaAssetsClient(
        HttpClient httpClient,
        IMemoryCache cache)
    {
        _httpClient = httpClient;
        _cache = cache;
    }

    public async Task<IReadOnlyList<AlpacaAsset>>
        GetActiveStocksAsync(
            CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(
            CacheKey,
            out IReadOnlyList<AlpacaAsset>? cached) &&
            cached is not null)
        {
            return cached;
        }

        AlpacaAssetResponse[] assets =
            await _httpClient.GetFromJsonAsync<
                AlpacaAssetResponse[]>(
                "/v2/assets?status=active&asset_class=us_equity",
                cancellationToken)
            ?? [];

        AlpacaAsset[] result =
            assets
                .Where(
                    asset =>
                        asset.Tradable &&
                        !string.IsNullOrWhiteSpace(
                            asset.Symbol) &&
                        !string.IsNullOrWhiteSpace(
                            asset.Name))
                .Select(
                    asset =>
                        new AlpacaAsset(
                            asset.Symbol
                                .Trim()
                                .ToUpperInvariant(),
                            asset.Name.Trim(),
                            asset.Exchange?.Trim()
                                ?? string.Empty))
                .DistinctBy(
                    asset => asset.Symbol,
                    StringComparer.OrdinalIgnoreCase)
                .OrderBy(
                    asset => asset.Name,
                    StringComparer.OrdinalIgnoreCase)
                .ToArray();

        _cache.Set(
            CacheKey,
            result,
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow =
                    TimeSpan.FromHours(6),

                Size = 1
            });

        return result;
    }

    private sealed class AlpacaAssetResponse
    {
        [JsonPropertyName("symbol")]
        public string Symbol { get; init; } =
            string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; init; } =
            string.Empty;

        [JsonPropertyName("exchange")]
        public string? Exchange { get; init; }

        [JsonPropertyName("tradable")]
        public bool Tradable { get; init; }
    }
}

public sealed record AlpacaAsset(
    string Symbol,
    string Name,
    string Exchange);
