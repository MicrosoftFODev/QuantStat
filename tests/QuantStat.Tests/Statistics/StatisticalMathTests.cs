using QuantStat.Core.Markets.Models;
using QuantStat.Core.Statistics;

namespace QuantStat.Tests.Statistics;

public sealed class StatisticalMathTests
{
    [Fact]
    public void ArithmeticMean_ReturnsExpectedValue()
    {
        double result =
            StatisticalMath.ArithmeticMean(
                [1.0, 2.0, 3.0, 4.0]
            );

        Assert.Equal(
            2.5,
            result,
            12
        );
    }


    [Fact]
    public void GeometricMean_ReturnsExpectedValue()
    {
        double result =
            StatisticalMath.GeometricMean(
                [1.0, 4.0, 16.0]
            );

        Assert.Equal(
            4.0,
            result,
            12
        );
    }


    [Fact]
    public void HarmonicMean_ReturnsExpectedValue()
    {
        double result =
            StatisticalMath.HarmonicMean(
                [1.0, 2.0, 4.0]
            );

        Assert.Equal(
            12.0 / 7.0,
            result,
            12
        );
    }


    [Fact]
    public void WeightedMean_ReturnsExpectedValue()
    {
        double result =
            StatisticalMath.WeightedMean(
                [10.0, 20.0, 30.0],
                [1.0, 2.0, 1.0]
            );

        Assert.Equal(
            20.0,
            result,
            12
        );
    }


    [Fact]
    public void SampleVariance_ReturnsExpectedValue()
    {
        double result =
            StatisticalMath.SampleVariance(
                [1.0, 2.0, 3.0]
            );

        Assert.Equal(
            1.0,
            result,
            12
        );
    }


    [Fact]
    public void LogReturn_ReturnsNaturalLogReturn()
    {
        double result =
            StatisticalMath.LogReturn(
                100.0,
                110.0
            );

        Assert.Equal(
            Math.Log(1.1),
            result,
            12
        );
    }


    [Fact]
    public void Quantile_UsesLinearInterpolation()
    {
        double result =
            StatisticalMath.Quantile(
                [1.0, 2.0, 3.0, 4.0],
                0.5
            );

        Assert.Equal(
            2.5,
            result,
            12
        );
    }


    [Fact]
    public void StatisticsService_CalculatesMarketStatistics()
    {
        var candles =
            new List<MarketCandle>
            {
                Candle(100),
                Candle(102),
                Candle(101),
                Candle(105),
                Candle(110)
            };

        var service =
            new StatisticsService();

        var result =
            service.Calculate(
                candles,
                1440
            );

        Assert.Equal(
            5,
            result.ObservationCount
        );

        Assert.Equal(
            103.6,
            result.MeanPrice,
            12
        );

        Assert.True(
            result.ReturnStandardDeviation > 0
        );

        Assert.True(
            result.AnnualizedVolatility > 0
        );
    }


    private static MarketCandle Candle(
        double close
    )
    {
        return new MarketCandle
        {
            Date =
                DateTimeOffset.UtcNow,

            Open =
                close,

            High =
                close,

            Low =
                close,

            Close =
                close,

            Volume =
                1.0
        };
    }
}