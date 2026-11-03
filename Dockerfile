FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /source

COPY src/QuantStat.Core/QuantStat.Core.csproj src/QuantStat.Core/
COPY src/QuantStat.Api/QuantStat.Api.csproj src/QuantStat.Api/

RUN dotnet restore src/QuantStat.Api/QuantStat.Api.csproj

COPY src/QuantStat.Core/ src/QuantStat.Core/
COPY src/QuantStat.Api/ src/QuantStat.Api/

RUN dotnet publish src/QuantStat.Api/QuantStat.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore


FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_EnableDiagnostics=0

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "QuantStat.Api.dll"]