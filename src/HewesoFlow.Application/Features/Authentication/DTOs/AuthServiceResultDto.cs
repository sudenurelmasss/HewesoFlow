namespace HewesoFlow.Application.Features.Authentication.DTOs;

public class AuthServiceResultDto
{
    public bool IsSuccess { get; set; }

    public string Message { get; set; } = string.Empty;

    public AuthResponseDto? Data { get; set; }

    public static AuthServiceResultDto Success(
        string message,
        AuthResponseDto data)
    {
        return new AuthServiceResultDto
        {
            IsSuccess = true,
            Message = message,
            Data = data
        };
    }

    public static AuthServiceResultDto Failure(string message)
    {
        return new AuthServiceResultDto
        {
            IsSuccess = false,
            Message = message,
            Data = null
        };
    }
}