using System.Globalization;
using System.Text.Json;
using QuantStat.Core.Abstractions;
using QuantStat.Core.Markets.Models;

namespace QuantStat.Api.Providers.Kraken;

public sealed class KrakenMarketDataProvider : IMarketDataProvider
{
    private static readonly HashSet<int> SupportedIntervals =
    [
        1,
        5,
        15,
        30,
        60,
        240,
        1440,
        10080,
        21600
    ];

    private static readonly IReadOnlyDictionary<string, string>
        AssetAliases =
        new Dictionary<string, string>(
            StringComparer.OrdinalIgnoreCase
        )
        {
            ["XXBT"] = "BTC",
            ["XBT"] = "BTC",
            ["BTC"] = "BTC",

            ["XETH"] = "ETH",
            ["ETH"] = "ETH",

            ["XLTC"] = "LTC",
            ["LTC"] = "LTC",

            ["XXRP"] = "XRP",
            ["XRP"] = "XRP",

            ["XXDG"] = "DOGE",
            ["XDG"] = "DOGE",
            ["DOGE"] = "DOGE",

            ["ZUSD"] = "USD",
            ["USD"] = "USD",

            ["ZEUR"] = "EUR",
            ["EUR"] = "EUR",

            ["ZGBP"] = "GBP",
            ["GBP"] = "GBP",

            ["ZJPY"] = "JPY",
            ["JPY"] = "JPY",

            ["ZCAD"] = "CAD",
            ["CAD"] = "CAD",

            ["ZAUD"] = "AUD",
            ["AUD"] = "AUD",

            ["ZCHF"] = "CHF",
            ["CHF"] = "CHF"
        };

    private readonly HttpClient _httpClient;

    public KrakenMarketDataProvider(
        HttpClient httpClient
    )
    {
        _httpClient =
            httpClient;
    }

    public string Name =>
        "Kraken";

    public async Task<MarketMetadata> GetMetadataAsync(
        CancellationToken cancellationToken = default
    )
    {
        using JsonDocument document =
            await GetDocumentAsync(
                "0/public/AssetPairs",
                cancellationToken
            );

        JsonElement result =
            GetResult(document);

        var markets =
            new List<MarketInstrument>();

        foreach (JsonProperty property in result.EnumerateObject())
        {
            JsonElement pairData =
                property.Value;

            string status =
                GetString(
                    pairData,
                    "status"
                );

            if (
                !string.IsNullOrWhiteSpace(status)
                &&
                !string.Equals(
                    status,
                    "online",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                continue;
            }

            string symbol =
                GetString(
                    pairData,
                    "altname"
                );

            if (string.IsNullOrWhiteSpace(symbol))
            {
                symbol =
                    property.Name;
            }

            string wsName =
                GetString(
                    pairData,
                    "wsname"
                );

            (
                string baseAsset,
                string quoteAsset
            ) =
                ExtractAssets(
                    wsName,
                    pairData
                );

            if (
                string.IsNullOrWhiteSpace(baseAsset)
                ||
                string.IsNullOrWhiteSpace(quoteAsset)
            )
            {
                continue;
            }

            markets.Add(
                new MarketInstrument
                {
                    Symbol =
                        symbol.Trim().ToUpperInvariant(),

                    BaseAsset =
                        baseAsset,

                    QuoteAsset =
                        quoteAsset,

                    DisplayName =
                        $"{baseAsset}/{quoteAsset}",

                    Provider =
                        Name
                }
            );
        }

        List<MarketInstrument> uniqueMarkets =
            markets
                .GroupBy(
                    market =>
                        market.Symbol,
                    StringComparer.OrdinalIgnoreCase
                )
                .Select(
                    group =>
                        group.First()
                )
                .OrderBy(
                    market =>
                        market.QuoteAsset
                )
                .ThenBy(
                    market =>
                        market.BaseAsset
                )
                .ToList();

        List<string> quotes =
            uniqueMarkets
                .Select(
                    market =>
                        market.QuoteAsset
                )
                .Distinct(
                    StringComparer.OrdinalIgnoreCase
                )
                .OrderBy(
                    quote =>
                        quote
                )
                .ToList();

        return new MarketMetadata
        {
            Markets =
                uniqueMarkets,

            Intervals =
                CreateIntervals(),

            Periods =
                CreatePeriods(),

            QuoteCurrencies =
                quotes
        };
    }

    public async Task<IReadOnlyList<MarketCandle>> GetCandlesAsync(
        string symbol,
        int intervalMinutes,
        bool includeIncompleteCandle = false,
        CancellationToken cancellationToken = default
    )
    {
        string normalizedSymbol =
            symbol
                .Trim()
                .ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(normalizedSymbol))
        {
            throw new ArgumentException(
                "The market symbol is required.",
                nameof(symbol)
            );
        }

        if (!SupportedIntervals.Contains(intervalMinutes))
        {
            throw new ArgumentOutOfRangeException(
                nameof(intervalMinutes),
                intervalMinutes,
                "The requested Kraken interval is not supported."
            );
        }

        string requestUri =
            "0/public/OHLC" +
            $"?pair={Uri.EscapeDataString(normalizedSymbol)}" +
            $"&interval={intervalMinutes}";

        using JsonDocument document =
            await GetDocumentAsync(
                requestUri,
                cancellationToken
            );

        JsonElement result =
            GetResult(document);

        JsonProperty series =
            result
                .EnumerateObject()
                .FirstOrDefault(
                    property =>
                        !string.Equals(
                            property.Name,
                            "last",
                            StringComparison.OrdinalIgnoreCase
                        )
                );

        if (series.Value.ValueKind != JsonValueKind.Array)
        {
            throw new InvalidOperationException(
                "Kraken returned no OHLC data."
            );
        }

        List<JsonElement> rows =
            series.Value
                .EnumerateArray()
                .ToList();

        if (
            !includeIncompleteCandle
            &&
            rows.Count > 0
        )
        {
            rows.RemoveAt(
                rows.Count - 1
            );
        }

        var candles =
            new List<MarketCandle>(
                rows.Count
            );

        foreach (JsonElement row in rows)
        {
            JsonElement[] values =
                row
                    .EnumerateArray()
                    .ToArray();

            if (values.Length < 8)
            {
                continue;
            }

            candles.Add(
                new MarketCandle
                {
                    Date =
                        DateTimeOffset.FromUnixTimeSeconds(
                            values[0].GetInt64()
                        ),

                    Open =
                        ParseDouble(values[1]),

                    High =
                        ParseDouble(values[2]),

                    Low =
                        ParseDouble(values[3]),

                    Close =
                        ParseDouble(values[4]),

                    Vwap =
                        ParseDouble(values[5]),

                    Volume =
                        ParseDouble(values[6]),

                    TradeCount =
                        ParseLong(values[7])
                }
            );
        }

        return candles
            .OrderBy(
                candle =>
                    candle.Date
            )
            .ToList();
    }

    private async Task<JsonDocument> GetDocumentAsync(
        string requestUri,
        CancellationToken cancellationToken
    )
    {
        using HttpResponseMessage response =
            await _httpClient.GetAsync(
                requestUri,
                cancellationToken
            );

        response.EnsureSuccessStatusCode();

        Stream stream =
            await response.Content.ReadAsStreamAsync(
                cancellationToken
            );

        JsonDocument document =
            await JsonDocument.ParseAsync(
                stream,
                cancellationToken:
                    cancellationToken
            );

        ValidateErrors(document);

        return document;
    }

    private static JsonElement GetResult(
        JsonDocument document
    )
    {
        if (
            !document.RootElement.TryGetProperty(
                "result",
                out JsonElement result
            )
            ||
            result.ValueKind != JsonValueKind.Object
        )
        {
            throw new InvalidOperationException(
                "Kraken returned no result."
            );
        }

        return result;
    }

    private static void ValidateErrors(
        JsonDocument document
    )
    {
        if (
            !document.RootElement.TryGetProperty(
                "error",
                out JsonElement errors
            )
            ||
            errors.ValueKind != JsonValueKind.Array
        )
        {
            return;
        }

        string[] messages =
            errors
                .EnumerateArray()
                .Select(
                    error =>
                        error.GetString()
                )
                .Where(
                    message =>
                        !string.IsNullOrWhiteSpace(message)
                )
                .Select(
                    message =>
                        message!
                )
                .ToArray();

        if (messages.Length > 0)
        {
            throw new InvalidOperationException(
                "Kraken API error: " +
                string.Join(
                    ", ",
                    messages
                )
            );
        }
    }

    private static (
        string BaseAsset,
        string QuoteAsset
    ) ExtractAssets(
        string wsName,
        JsonElement pairData
    )
    {
        if (
            !string.IsNullOrWhiteSpace(wsName)
            &&
            wsName.Contains('/')
        )
        {
            string[] parts =
                wsName.Split(
                    '/',
                    2
                );

            return (
                NormalizeAsset(parts[0]),
                NormalizeAsset(parts[1])
            );
        }

        return (
            NormalizeAsset(
                GetString(
                    pairData,
                    "base"
                )
            ),
            NormalizeAsset(
                GetString(
                    pairData,
                    "quote"
                )
            )
        );
    }

    private static string NormalizeAsset(
        string value
    )
    {
        string normalized =
            value
                .Trim()
                .ToUpperInvariant();

        return AssetAliases.TryGetValue(
            normalized,
            out string? alias
        )
            ? alias
            : normalized;
    }

    private static string GetString(
        JsonElement element,
        string propertyName
    )
    {
        if (
            !element.TryGetProperty(
                propertyName,
                out JsonElement property
            )
        )
        {
            return string.Empty;
        }

        return property.ValueKind == JsonValueKind.String
            ? property.GetString() ?? string.Empty
            : property.ToString();
    }

    private static double ParseDouble(
        JsonElement element
    )
    {
        string value =
            element.ValueKind == JsonValueKind.String
                ? element.GetString() ?? string.Empty
                : element.ToString();

        return double.Parse(
            value,
            NumberStyles.Float,
            CultureInfo.InvariantCulture
        );
    }

    private static long ParseLong(
        JsonElement element
    )
    {
        string value =
            element.ValueKind == JsonValueKind.String
                ? element.GetString() ?? string.Empty
                : element.ToString();

        return long.Parse(
            value,
            NumberStyles.Integer,
            CultureInfo.InvariantCulture
        );
    }

    private static IReadOnlyList<MarketInterval> CreateIntervals()
    {
        return
        [
            new()
            {
                Name = "1 Minute",
                Minutes = 1
            },
            new()
            {
                Name = "5 Minutes",
                Minutes = 5
            },
            new()
            {
                Name = "15 Minutes",
                Minutes = 15
            },
            new()
            {
                Name = "30 Minutes",
                Minutes = 30
            },
            new()
            {
                Name = "1 Hour",
                Minutes = 60
            },
            new()
            {
                Name = "4 Hours",
                Minutes = 240
            },
            new()
            {
                Name = "1 Day",
                Minutes = 1440,
                IsDefault = true
            },
            new()
            {
                Name = "1 Week",
                Minutes = 10080
            },
            new()
            {
                Name = "15 Days",
                Minutes = 21600
            }
        ];
    }

    private static IReadOnlyList<MarketPeriod> CreatePeriods()
    {
        return
        [
            new()
            {
                Name = "30 Days",
                Days = 30
            },
            new()
            {
                Name = "90 Days",
                Days = 90
            },
            new()
            {
                Name = "180 Days",
                Days = 180
            },
            new()
            {
                Name = "1 Year",
                Days = 365,
                IsDefault = true
            },
            new()
            {
                Name = "Maximum",
                Days = 720
            }
        ];
    }
}