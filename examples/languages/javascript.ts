import shellfie, { themes } from '../../src';
import { writeFileSync } from 'node:fs';

const code = `// Async function with arrow functions
const fetchUser = async (id) => {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
};

// Class with methods
class UserService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getUsers() {
    const users = await fetchUser(1);
    console.log('Users:', users);
    return users;
  }
}

// Export and destructuring
export const { name, age } = user;
`;

const svg = shellfie(code, { theme: themes.githubDark });
writeFileSync('examples/svgs/languages/javascript.svg', svg);
console.log('Created examples/svgs/languages/javascript.svg');
