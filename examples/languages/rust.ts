import shellfie, { themes } from '../../src';
import { writeFileSync } from 'node:fs';

const code = `use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct User {
    id: u32,
    name: String,
}

impl User {
    pub fn new(id: u32, name: &str) -> Self {
        Self {
            id,
            name: name.to_string(),
        }
    }

    fn greet(&self) -> String {
        format!("Hello, {}!", self.name)
    }
}

fn main() {
    let mut users: HashMap<u32, User> = HashMap::new();
    let user = User::new(1, "Alice");
    users.insert(user.id, user.clone());

    if let Some(u) = users.get(&1) {
        println!("{}", u.greet());
    }
}
`;

const svg = shellfie(code, { theme: themes.githubDark });
writeFileSync('examples/svgs/languages/rust.svg', svg);
console.log('Created examples/svgs/languages/rust.svg');
