import shellfie, { themes } from '../../src';
import { writeFileSync } from 'node:fs';

const code = `#!/usr/bin/env python3
from typing import List, Optional

class UserService:
    """Service for managing users."""

    def __init__(self, db_url: str):
        self.db_url = db_url
        self.users: List[dict] = []

    async def get_user(self, user_id: int) -> Optional[dict]:
        for user in self.users:
            if user['id'] == user_id:
                return user
        return None

# Main execution
if __name__ == "__main__":
    service = UserService("postgresql://localhost/db")
    print(f"Connected to {service.db_url}")
`;

const svg = shellfie(code, { theme: themes.githubDark });
writeFileSync('examples/svgs/languages/python.svg', svg);
console.log('Created examples/svgs/languages/python.svg');
