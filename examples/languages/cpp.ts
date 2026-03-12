import shellfie, { themes } from '../../src';
import { writeFileSync } from 'node:fs';

const code = `#include <iostream>
#include <vector>
#include <memory>

namespace app {

template<typename T>
class Repository {
private:
    std::vector<T> items_;

public:
    void add(T item) {
        items_.push_back(std::move(item));
    }

    virtual T* find(int id) {
        for (auto& item : items_) {
            if (item.id == id) return &item;
        }
        return nullptr;
    }
};

} // namespace app

int main() {
    auto repo = std::make_unique<app::Repository<User>>();
    std::cout << "Repository created" << std::endl;
    return 0;
}
`;

const svg = shellfie(code, { theme: themes.githubDark });
writeFileSync('examples/svgs/languages/cpp.svg', svg);
console.log('Created examples/svgs/languages/cpp.svg');
