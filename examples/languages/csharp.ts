import shellfie, { themes } from '../../src';
import { writeFileSync } from 'node:fs';

const code = `using System;
using System.Collections.Generic;
using System.Linq;

namespace App.Services;

public class UserService
{
    private readonly List<User> _users = new();

    public async Task<User?> GetUserAsync(int id)
    {
        return await Task.FromResult(
            _users.FirstOrDefault(u => u.Id == id)
        );
    }

    public void AddUser(User user)
    {
        _users.Add(user);
        Console.WriteLine($"Added user: {user.Name}");
    }
}

public record User(int Id, string Name);
`;

const svg = shellfie(code, { theme: themes.githubDark });
writeFileSync('examples/svgs/languages/csharp.svg', svg);
console.log('Created examples/svgs/languages/csharp.svg');
