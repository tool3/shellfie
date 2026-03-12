import shellfie, { themes } from '../../src';
import { writeFileSync } from 'node:fs';

const code = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_USERS 100

typedef struct {
    int id;
    char name[50];
} User;

User* create_user(int id, const char* name) {
    User* user = (User*)malloc(sizeof(User));
    if (user == NULL) return NULL;

    user->id = id;
    strncpy(user->name, name, 49);
    user->name[49] = '\\0';
    return user;
}

int main(int argc, char* argv[]) {
    User* user = create_user(1, "Alice");
    printf("User: %s (ID: %d)\\n", user->name, user->id);
    free(user);
    return 0;
}
`;

const svg = shellfie(code, { theme: themes.githubDark });
writeFileSync('examples/svgs/languages/c.svg', svg);
console.log('Created examples/svgs/languages/c.svg');
