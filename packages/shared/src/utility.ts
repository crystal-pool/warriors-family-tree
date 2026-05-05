export function generateRandomId8(): string {
    // 8 characters
    let result = Math.floor(Math.random() * 2821109907456).toString(36);
    while (result.length < 8) result = "0" + result;
    return result;
}

export function generateRandomId32(): string {
    // 32 characters
    return generateRandomId8() + generateRandomId8() + generateRandomId8() + generateRandomId8();
}
