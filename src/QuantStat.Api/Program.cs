using QuantStat.Api.Providers.Kraken;
using QuantStat.Core.Abstractions;

var builder =
    WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient<
    KrakenMarketDataProvider
>(
    client =>
    {
        client.BaseAddress =
            new Uri(
                "https://api.kraken.com/"
            );

        client.Timeout =
            TimeSpan.FromSeconds(30);

        client.DefaultRequestHeaders
            .UserAgent
            .ParseAdd(
                "QuantStat/1.0"
            );
    }
);

builder.Services.AddScoped<
    IMarketDataProvider
>(
    services =>
        services.GetRequiredService<
            KrakenMarketDataProvider
        >()
);

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
                        "https://localhost:5173"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            }
        );
    }
);

var app =
    builder.Build();

app.UseHttpsRedirection();

app.UseCors(
    "QuantStatWeb"
);

app.MapGet(
    "/api/health",
    () =>
        Results.Ok(
            new
            {
                success = true,
                service = "QuantStat.Api",
                timestamp = DateTimeOffset.UtcNow
            }
        )
);

app.MapGet(
    "/api/markets",
    async (
        IMarketDataProvider provider,
        CancellationToken cancellationToken
    ) =>
    {
        var metadata =
            await provider.GetMetadataAsync(
                cancellationToken
            );

        return Results.Ok(metadata);
    }
);

app.MapGet(
    "/api/market-data",
    async (
        string symbol,
        int? interval,
        int? periodDays,
        IMarketDataProvider provider,
        CancellationToken cancellationToken
    ) =>
    {
        int selectedInterval =
            interval ?? 1440;

        IReadOnlyList<
            QuantStat.Core.Markets.Models.MarketCandle
        > candles =
            await provider.GetCandlesAsync(
                symbol,
                selectedInterval,
                false,
                cancellationToken
            );

        if (
            periodDays.HasValue
            &&
            periodDays.Value > 0
        )
        {
            DateTimeOffset threshold =
                DateTimeOffset.UtcNow
                    .AddDays(
                        -periodDays.Value
                    );

            candles =
                candles
                    .Where(
                        candle =>
                            candle.Date >= threshold
                    )
                    .ToList();
        }

        return Results.Ok(
            new
            {
                provider =
                    provider.Name,

                symbol,

                interval =
                    selectedInterval,

                periodDays,

                candles
            }
        );
    }
);

app.Run();