import shellfie, { themes } from '../../src';
import { writeFileSync } from 'node:fs';

const code = `package main

import (
	"fmt"
	"sync"
)

type User struct {
	ID   int
	Name string
}

func (u *User) Greet() string {
	return fmt.Sprintf("Hello, %s!", u.Name)
}

func main() {
	var wg sync.WaitGroup
	users := make(chan User, 10)

	go func() {
		defer close(users)
		users <- User{ID: 1, Name: "Alice"}
	}()

	for user := range users {
		fmt.Println(user.Greet())
	}
}
`;

const svg = shellfie(code, { theme: themes.githubDark });
writeFileSync('examples/svgs/languages/go.svg', svg);
console.log('Created examples/svgs/languages/go.svg');
