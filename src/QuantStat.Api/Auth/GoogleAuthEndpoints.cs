using Google.Apis.Auth;


namespace QuantStat.Api.Auth;


public static class GoogleAuthEndpoints
{
    public static IEndpointRouteBuilder
        MapGoogleAuthEndpoints(
            this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(
            "/api/auth/google",
            VerifyGoogleCredentialAsync);

        return endpoints;
    }


    private static async Task<IResult>
        VerifyGoogleCredentialAsync(
            GoogleCredentialRequest request,
            IConfiguration configuration)
    {
        if (
            string.IsNullOrWhiteSpace(
                request.Credential))
        {
            return Results.BadRequest(
                new
                {
                    error =
                        "Google credential is required."
                });
        }

        string clientId =
            configuration[
                "Authentication:Google:ClientId"]
            ??
            Environment.GetEnvironmentVariable(
                "GOOGLE_CLIENT_ID")
            ??
            throw new InvalidOperationException(
                "Google client ID is not configured.");

        try
        {
            GoogleJsonWebSignature
                .ValidationSettings settings =
                    new()
                    {
                        Audience =
                        [
                            clientId
                        ]
                    };

            GoogleJsonWebSignature.Payload
                payload =
                    await GoogleJsonWebSignature
                        .ValidateAsync(
                            request.Credential,
                            settings);

            if (
                string.IsNullOrWhiteSpace(
                    payload.Subject))
            {
                return Results.Unauthorized();
            }

            return Results.Ok(
                new GoogleAuthenticatedUser(
                    Provider:
                        "google",

                    Id:
                        payload.Subject,

                    DisplayName:
                        payload.Name ??
                        payload.Email ??
                        "Google account",

                    Email:
                        payload.Email ??
                        string.Empty,

                    Picture:
                        payload.Picture));
        }
        catch (
            InvalidJwtException)
        {
            return Results.Unauthorized();
        }
    }


    private sealed record
        GoogleCredentialRequest(
            string Credential);


    private sealed record
        GoogleAuthenticatedUser(
            string Provider,
            string Id,
            string DisplayName,
            string Email,
            string? Picture);
}
