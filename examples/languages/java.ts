import shellfie, { themes } from '../../src';
import { writeFileSync } from 'node:fs';

const code = `package com.example.app;

import java.util.ArrayList;
import java.util.List;

public class UserService {
    private final List<User> users = new ArrayList<>();

    @Override
    public String toString() {
        return "UserService{users=" + users.size() + "}";
    }

    public User findById(int id) {
        return users.stream()
            .filter(u -> u.getId() == id)
            .findFirst()
            .orElse(null);
    }

    public static void main(String[] args) {
        UserService service = new UserService();
        System.out.println("Service: " + service);
    }
}
`;

const svg = shellfie(code, { theme: themes.githubDark });
writeFileSync('examples/svgs/languages/java.svg', svg);
console.log('Created examples/svgs/languages/java.svg');
