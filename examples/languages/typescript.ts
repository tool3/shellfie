import shellfie, { themes } from '../../src';
import { writeFileSync } from 'node:fs';

const code = `interface User {
  id: number;
  name: string;
  email?: string;
}

type UserRole = 'admin' | 'user' | 'guest';

async function fetchUser<T extends User>(id: number): Promise<T> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json() as T;
}

class UserService {
  private users: Map<number, User> = new Map();

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
}

export { User, UserRole, fetchUser };
`;

const svg = shellfie(code, { theme: themes.githubDark });
writeFileSync('examples/svgs/languages/typescript.svg', svg);
console.log('Created examples/svgs/languages/typescript.svg');
