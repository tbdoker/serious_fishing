using System;

[Serializable]
public class LoginRequest
{
    public string username;
    public string password;
}

[Serializable]
public class RegisterRequest
{
    public string username;
    public string firstName;
    public string lastName;
    public int age;
    public string password;
}

[Serializable]
public class AuthResponse
{
    public bool ok;
    public string message;
    public string userId;
    public string username;
    public string firstName;
    public string lastName;
}
