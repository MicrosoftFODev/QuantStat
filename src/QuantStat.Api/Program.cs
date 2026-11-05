using QuantStat.Api.Auth;
using QuantStat.Api.Providers.Alpaca;
using QuantStat.Core.Abstractions;
using QuantStat.Core.Dashboard;
using QuantStat.Core.Markets.Models;
using QuantStat.Core.Statistics;

var builder =
    WebApplication.CreateBuilder(args);

string port =
    Environment.GetEnvironmentVariable(
        "PORT") ?? "5094";

builder.WebHost.UseUrls(
    $"http://0.0.0.0:{port}");


builder.Services.AddMemoryCache(
    options =>
    {
        options.SizeLimit =
            250000;
    });


builder.Services.AddHttpClient<
    AlpacaMarketDataProvider>(
    client =>
    {
        client.BaseAddress =
            new UriBuilder(
                "https",
                "data.alpaca.markets")
                .Uri;

        client.Timeout =
            TimeSpan.FromSeconds(60);

        client.DefaultRequestHeaders
            .UserAgent
            .ParseAdd(
                "QuantStat/1.0");

        client.DefaultRequestHeaders
            .Accept
            .ParseAdd(
                "application/json");

        string apiKey =
            Environment.GetEnvironmentVariable(
                "ALPACA_API_KEY")
            ??
            throw new InvalidOperationException(
                "ALPACA_API_KEY is missing.");

        string secretKey =
            Environment.GetEnvironmentVariable(
                "ALPACA_SECRET_KEY")
            ??
            throw new InvalidOperationException(
                "ALPACA_SECRET_KEY is missing.");

        client.DefaultRequestHeaders.Add(
            "APCA-API-KEY-ID",
            apiKey);

        client.DefaultRequestHeaders.Add(
            "APCA-API-SECRET-KEY",
            secretKey);
    });


builder.Services.AddHttpClient<
    AlpacaAssetsClient>(
    client =>
    {
        client.BaseAddress =
            new Uri(
                "https://paper-api.alpaca.markets");

        client.Timeout =
            TimeSpan.FromSeconds(60);

        client.DefaultRequestHeaders
            .Accept
            .ParseAdd(
                "application/json");

        string apiKey =
            Environment.GetEnvironmentVariable(
                "ALPACA_API_KEY")
            ??
            throw new InvalidOperationException(
                "ALPACA_API_KEY is missing.");

        string secretKey =
            Environment.GetEnvironmentVariable(
                "ALPACA_SECRET_KEY")
            ??
            throw new InvalidOperationException(
                "ALPACA_SECRET_KEY is missing.");

        client.DefaultRequestHeaders.Add(
            "APCA-API-KEY-ID",
            apiKey);

        client.DefaultRequestHeaders.Add(
            "APCA-API-SECRET-KEY",
            secretKey);
    });

builder.Services.AddScoped<
    StatisticsService>();

builder.Services.AddScoped<
    DashboardAnalysisService>();


builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "QuantStatWeb",
            policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:5173",
                        "https://localhost:5173",
                        "https://quantstat.zoisantonopoulos.workers.dev")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });


var app =
    builder.Build();


app.UseCors(
    "QuantStatWeb");


app.MapGoogleAuthEndpoints();


app.MapGet(
    "/api/health",
    () =>
        Results.Ok(
            new
            {
                success = true,
                service = "QuantStat.Api",
                provider = "Alpaca",
                timestamp =
                    DateTimeOffset.UtcNow
            }));


app.MapGet(
    "/api/asset-classes",
    () =>
        Results.Ok(
            new[]
            {
                new
                {
                    id = "stock",
                    name = "Stocks",
                    defaultSymbol = "AAPL"
                },

                new
                {
                    id = "crypto",
                    name = "Crypto",
                    defaultSymbol = "BTC/USD"
                }
            }));


app.MapGet(
    "/api/providers",
    () =>
        Results.Ok(
            new[]
            {
                new
                {
                    id = "alpaca",
                    name = "Alpaca",
                    defaultSymbol = "AAPL"
                }
            }));


app.MapGet(
    "/api/markets",
    async (
        string? assetClass,
        string? provider,
        AlpacaMarketDataProvider marketProvider,
        CancellationToken cancellationToken) =>
    {
        try
        {
            string selectedAssetClass =
                ResolveAssetClass(
                    assetClass,
                    provider,
                    null);

            MarketMetadata metadata =
                await marketProvider
                    .GetMetadataAsync(
                        cancellationToken);

            MarketInstrument[] markets =
                metadata.Markets
                    .Where(
                        market =>
                            MarketMatchesAssetClass(
                                market,
                                selectedAssetClass))
                    .OrderBy(
                        market =>
                            market.DisplayName)
                    .ToArray();

            string[] quoteCurrencies =
                markets
                    .Select(
                        market =>
                            market.QuoteAsset)
                    .Distinct(
                        StringComparer.OrdinalIgnoreCase)
                    .OrderBy(
                        quote =>
                            quote)
                    .ToArray();

            return Results.Ok(
                new MarketMetadata
                {
                    Markets =
                        markets,

                    Intervals =
                        metadata.Intervals,

                    Periods =
                        metadata.Periods,

                    QuoteCurrencies =
                        quoteCurrencies
                });
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(
                new
                {
                    error =
                        exception.Message
                });
        }
        catch (Exception exception)
        {
            return ProviderProblem(
                exception);
        }
    });


app.MapGet(
    "/api/market-data",
    async (
        string? assetClass,
        string? provider,
        string symbol,
        int? interval,
        int? periodDays,
        AlpacaMarketDataProvider marketProvider,
        CancellationToken cancellationToken) =>
    {
        try
        {
            string selectedAssetClass =
                ResolveAssetClass(
                    assetClass,
                    provider,
                    symbol);

            string selectedSymbol =
                NormalizeSymbol(
                    symbol,
                    selectedAssetClass);

            int selectedInterval =
                interval ?? 1440;

            IReadOnlyList<MarketCandle> candles =
                await marketProvider
                    .GetCandlesAsync(
                        selectedSymbol,
                        selectedInterval,
                        false,
                        cancellationToken);

            if (periodDays is > 0)
            {
                DateTimeOffset threshold =
                    DateTimeOffset.UtcNow
                        .AddDays(
                            -periodDays.Value);

                candles =
                    candles
                        .Where(
                            candle =>
                                candle.Date >=
                                threshold)
                        .ToArray();
            }

            return Results.Ok(
                new
                {
                    provider =
                        marketProvider.Name,

                    assetClass =
                        selectedAssetClass,

                    symbol =
                        selectedSymbol,

                    interval =
                        selectedInterval,

                    periodDays,

                    candles
                });
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(
                new
                {
                    error =
                        exception.Message
                });
        }
        catch (Exception exception)
        {
            return ProviderProblem(
                exception);
        }
    });


app.MapGet(
    "/api/dashboard",
    async (
        string? assetClass,
        string? provider,
        string? symbol,
        int? interval,
        int? periodDays,
        AlpacaMarketDataProvider marketProvider,
        DashboardAnalysisService analysisService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            string selectedAssetClass =
                ResolveAssetClass(
                    assetClass,
                    provider,
                    symbol);

            string selectedSymbol =
                NormalizeSymbol(
                    string.IsNullOrWhiteSpace(
                        symbol)
                        ? DefaultSymbol(
                            selectedAssetClass)
                        : symbol,
                    selectedAssetClass);

            int selectedInterval =
                interval ?? 1440;

            int selectedPeriod =
                periodDays ?? 365;

            IReadOnlyList<MarketCandle> candles =
                await marketProvider
                    .GetCandlesAsync(
                        selectedSymbol,
                        selectedInterval,
                        false,
                        cancellationToken);

            DateTimeOffset threshold =
                DateTimeOffset.UtcNow
                    .AddDays(
                        -selectedPeriod);

            MarketCandle[] selectedCandles =
                candles
                    .Where(
                        candle =>
                            candle.Date >=
                            threshold)
                    .OrderBy(
                        candle =>
                            candle.Date)
                    .ToArray();

            if (selectedCandles.Length < 5)
            {
                return Results.BadRequest(
                    new
                    {
                        error =
                            "The selected market and period do not contain enough observations."
                    });
            }

            var dashboard =
                analysisService.Calculate(
                    selectedSymbol,
                    selectedInterval,
                    selectedPeriod,
                    selectedCandles);

            return Results.Ok(
                dashboard);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(
                new
                {
                    error =
                        exception.Message
                });
        }
        catch (Exception exception)
        {
            return ProviderProblem(
                exception);
        }
    });


app.MapGet(
    "/api/statistics",
    async (
        string? assetClass,
        string? provider,
        string? symbol,
        int? interval,
        int? periodDays,
        AlpacaMarketDataProvider marketProvider,
        StatisticsService statisticsService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            string selectedAssetClass =
                ResolveAssetClass(
                    assetClass,
                    provider,
                    symbol);

            string selectedSymbol =
                NormalizeSymbol(
                    string.IsNullOrWhiteSpace(
                        symbol)
                        ? DefaultSymbol(
                            selectedAssetClass)
                        : symbol,
                    selectedAssetClass);

            int selectedInterval =
                interval ?? 1440;

            int selectedPeriod =
                periodDays ?? 365;

            IReadOnlyList<MarketCandle> candles =
                await marketProvider
                    .GetCandlesAsync(
                        selectedSymbol,
                        selectedInterval,
                        false,
                        cancellationToken);

            DateTimeOffset threshold =
                DateTimeOffset.UtcNow
                    .AddDays(
                        -selectedPeriod);

            MarketCandle[] selectedCandles =
                candles
                    .Where(
                        candle =>
                            candle.Date >=
                            threshold)
                    .OrderBy(
                        candle =>
                            candle.Date)
                    .ToArray();

            if (selectedCandles.Length < 5)
            {
                return Results.BadRequest(
                    new
                    {
                        error =
                            "The selected market and period do not contain enough observations."
                    });
            }

            var result =
                statisticsService.Calculate(
                    selectedCandles,
                    selectedInterval);

            return Results.Ok(
                new
                {
                    provider =
                        marketProvider.Name,

                    assetClass =
                        selectedAssetClass,

                    symbol =
                        selectedSymbol,

                    intervalMinutes =
                        selectedInterval,

                    periodDays =
                        selectedPeriod,

                    result
                });
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(
                new
                {
                    error =
                        exception.Message
                });
        }
        catch (Exception exception)
        {
            return ProviderProblem(
                exception);
        }
    });


app.MapGet(
    "/api/alpaca-test/stock",
    async (
        AlpacaMarketDataProvider provider,
        CancellationToken cancellationToken) =>
    {
        IReadOnlyList<MarketCandle> candles =
            await provider.GetCandlesAsync(
                "AAPL",
                1440,
                false,
                cancellationToken);

        return Results.Ok(
            new
            {
                assetClass = "stock",
                symbol = "AAPL",
                provider = provider.Name,
                observations = candles.Count,
                first = candles.FirstOrDefault(),
                last = candles.LastOrDefault()
            });
    });


app.MapGet(
    "/api/alpaca-test/crypto",
    async (
        AlpacaMarketDataProvider provider,
        CancellationToken cancellationToken) =>
    {
        IReadOnlyList<MarketCandle> candles =
            await provider.GetCandlesAsync(
                "BTC/USD",
                1440,
                false,
                cancellationToken);

        return Results.Ok(
            new
            {
                assetClass = "crypto",
                symbol = "BTC/USD",
                provider = provider.Name,
                observations = candles.Count,
                first = candles.FirstOrDefault(),
                last = candles.LastOrDefault()
            });
    });


app.Run();


static string ResolveAssetClass(
    string? assetClass,
    string? legacyProvider,
    string? symbol)
{
    if (
        !string.IsNullOrWhiteSpace(
            assetClass))
    {
        string normalized =
            assetClass
                .Trim()
                .ToLowerInvariant();

        return normalized switch
        {
            "stock" or "stocks" =>
                "stock",

            "crypto" =>
                "crypto",

            _ =>
                throw new ArgumentException(
                    "Asset class must be 'stock' or 'crypto'.",
                    nameof(assetClass))
        };
    }

    if (
        string.Equals(
            legacyProvider,
            "kraken",
            StringComparison.OrdinalIgnoreCase) ||
        string.Equals(
            legacyProvider,
            "coinbase",
            StringComparison.OrdinalIgnoreCase))
    {
        return "crypto";
    }

    if (
        !string.IsNullOrWhiteSpace(
            symbol) &&
        (
            symbol.Contains(
                '/',
                StringComparison.Ordinal) ||
            symbol.Contains(
                '-',
                StringComparison.Ordinal) ||
            IsLegacyCryptoSymbol(
                symbol)
        ))
    {
        return "crypto";
    }

    return "stock";
}


static bool MarketMatchesAssetClass(
    MarketInstrument market,
    string assetClass)
{
    bool isCrypto =
        market.Symbol.Contains(
            '/',
            StringComparison.Ordinal);

    return assetClass == "crypto"
        ? isCrypto
        : !isCrypto;
}


static string NormalizeSymbol(
    string symbol,
    string assetClass)
{
    string normalized =
        symbol
            .Trim()
            .ToUpperInvariant();

    if (assetClass == "stock")
    {
        return normalized;
    }

    normalized =
        normalized.Replace(
            '-',
            '/');

    if (
        normalized.Contains(
            '/',
            StringComparison.Ordinal))
    {
        return normalized;
    }

    string[] quotes =
    [
        "USDT",
        "USDC",
        "USD",
        "EUR",
        "GBP",
        "BTC",
        "ETH"
    ];

    string? quote =
        quotes.FirstOrDefault(
            candidate =>
                normalized.EndsWith(
                    candidate,
                    StringComparison.OrdinalIgnoreCase) &&
                normalized.Length >
                    candidate.Length);

    if (quote is null)
    {
        throw new ArgumentException(
            $"Crypto symbol '{symbol}' could not be normalized.");
    }

    string baseAsset =
        normalized[..^quote.Length];

    return $"{baseAsset}/{quote}";
}


static bool IsLegacyCryptoSymbol(
    string symbol)
{
    string normalized =
        symbol
            .Trim()
            .ToUpperInvariant();

    string[] knownCryptoBases =
    [
        "BTC",
        "XBT",
        "ETH",
        "SOL",
        "AVAX",
        "LINK"
    ];

    return knownCryptoBases.Any(
        baseAsset =>
            normalized.StartsWith(
                baseAsset,
                StringComparison.OrdinalIgnoreCase));
}


static string DefaultSymbol(
    string assetClass)
{
    return assetClass == "crypto"
        ? "BTC/USD"
        : "AAPL";
}


static IResult ProviderProblem(
    Exception exception)
{
    return Results.Problem(
        title:
            "Alpaca market-data request failed",

        detail:
            exception.Message,

        statusCode:
            StatusCodes.Status502BadGateway);
}

